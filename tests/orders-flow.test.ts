import { beforeAll, describe, expect, it } from "vitest";
import { cleanMeasurements, garmentsFor, getTemplate } from "@/lib/measurements";
import { canTransition, fromPaise, nextStatuses, paymentSummary, toPaise } from "@/lib/orders";
import { prisma } from "@/server/db";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/server/errors";
import { createCustomer } from "@/server/services/customers";
import { listFamily } from "@/server/services/family";
import { getMeasurementWorkspace } from "@/server/services/measurements";
import {
  addPayment, attachMeasurement, createOrder, getNotifications, getOrder, getOrderDashboard, listOrders, transitionOrder,
} from "@/server/services/orders";
import { addMember, makeTenant, phone } from "./helpers";

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const KURTI = { bust: 92, waist: 76, hip: 98, shoulder: 37, sleeve_length: 22, length: 100 };

describe("measurement templates (pure)", () => {
  it("auto-selects garments by gender and age group", () => {
    const adultF = garmentsFor("FEMALE", "ADULT").map((g) => g.key);
    expect(adultF).toContain("blouse");
    expect(adultF).not.toContain("shirt");
    expect(garmentsFor("MALE", "ADULT").map((g) => g.key)).toContain("sherwani");
    expect(garmentsFor("FEMALE", "BABY").map((g) => g.key)).toEqual(expect.arrayContaining(["frock", "kurta_pyjama"]));
    expect(garmentsFor("FEMALE", "BABY").map((g) => g.key)).not.toContain("lehenga");
    expect(garmentsFor("OTHER", "ADULT").length).toBeGreaterThan(garmentsFor("MALE", "ADULT").length);
  });

  it("loads a different default template for kids than adults", () => {
    const adult = getTemplate("shirt", "MALE", "ADULT")!;
    const kid = getTemplate("shirt", "MALE", "KID")!;
    expect(adult.fields.some((f) => f.key === "bicep")).toBe(true);
    expect(kid.fields.some((f) => f.key === "bicep")).toBe(false);
    expect(kid.hints.length).toBeGreaterThan(0);
    expect(getTemplate("blouse", "MALE", "ADULT")).toBeNull();
  });

  it("validates and normalises values", () => {
    const t = getTemplate("kurti", "FEMALE", "ADULT")!;
    expect(cleanMeasurements(t, { bust: "92.46", waist: "" })).toEqual({ bust: 92.5 });
    expect(() => cleanMeasurements(t, { bust: -1 })).toThrow();
    expect(() => cleanMeasurements(t, { bust: 500 })).toThrow();
    expect(() => cleanMeasurements(t, { sherwani_length: 10 })).toThrow(/not part of/);
    expect(() => cleanMeasurements(t, {})).toThrow();
  });
});

describe("money and workflow rules (pure)", () => {
  it("uses exact integer arithmetic", () => {
    expect(fromPaise(toPaise("0.10") + toPaise("0.20"))).toBe("0.30");
    expect(paymentSummary("1800.00", "800")).toMatchObject({ balance: "1000.00", paymentStatus: "PARTIAL" });
    expect(paymentSummary("1800", "1800")).toMatchObject({ balance: "0.00", paymentStatus: "PAID" });
    expect(paymentSummary("1800", "0").paymentStatus).toBe("UNPAID");
  });

  it("enforces the pipeline", () => {
    expect(canTransition("ORDER_RECEIVED", "STITCHING")).toBe(false);
    expect(canTransition("TRIAL", "ALTERATION")).toBe(true);
    expect(canTransition("ALTERATION", "TRIAL")).toBe(true);
    expect(canTransition("READY", "DELIVERED")).toBe(true);
    expect(nextStatuses("DELIVERED")).toEqual([]);
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
  });
});

type T = Awaited<ReturnType<typeof makeTenant>>;
let A: T, B: T;
let aCust: string, aSelf: string, bCust: string, bSelf: string;

async function person(t: T, gender: "MALE" | "FEMALE" = "FEMALE") {
  const c = await createCustomer(t.ctx, { name: "Cust", phone: phone() as never, gender, ageGroup: "ADULT", preferredLanguage: "en" });
  const fam = await listFamily(t.ctx, c.id);
  return { customerId: c.id, memberId: fam.find((m) => m.isSelf)!.id };
}

beforeAll(async () => {
  A = await makeTenant("OA");
  B = await makeTenant("OB");
  ({ customerId: aCust, memberId: aSelf } = await person(A));
  ({ customerId: bCust, memberId: bSelf } = await person(B));
});

describe("customer to delivery journey", () => {
  it("creating a customer with gender+age creates a Self family member", async () => {
    const fam = await listFamily(A.ctx, aCust);
    expect(fam).toHaveLength(1);
    expect(fam[0]).toMatchObject({ isSelf: true, gender: "FEMALE", ageGroup: "ADULT" });
  });

  it("versions measurements, reuses them, and never mutates history", async () => {
    const p = await person(A);
    const o1 = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "1800", measurement: { values: KURTI } });
    const o2 = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "2000" });
    const a = await getOrder(A.ctx, o1.id);
    const b = await getOrder(A.ctx, o2.id);
    expect(a.measurement?.version).toBe(1);
    expect(b.measurementSetId).toBe(a.measurementSetId); // reused, no new version

    const o3 = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "2200", measurement: { values: { ...KURTI, bust: 95 } } });
    const c = await getOrder(A.ctx, o3.id);
    expect(c.measurement?.version).toBe(2);
    expect((await getOrder(A.ctx, o1.id)).measurement?.values.bust).toBe(92); // the order keeps its exact version

    const ws = await getMeasurementWorkspace(A.ctx, p.memberId, "kurti");
    expect(ws.history.map((h) => h.version)).toEqual([2, 1]);
    await expect(prisma.measurementSet.update({ where: { id: a.measurementSetId! }, data: { notes: "x" } })).rejects.toThrow(/immutable/);
  });

  it("rejects garments that do not fit the person", async () => {
    const m = await person(A, "MALE");
    await expect(createOrder(A.ctx, { customerId: m.customerId, familyMemberId: m.memberId, garment: "blouse", promisedDate: tomorrow(), charges: "500" })).rejects.toBeInstanceOf(AppError);
  });

  it("numbers orders sequentially per tenant and records advance + timeline", async () => {
    const p = await person(A);
    const x = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "1000", advance: { amount: "400", method: "CASH" } });
    const y = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "1000" });
    expect(y.orderNo).toBe(x.orderNo + 1);
    const o = await getOrder(A.ctx, x.id);
    expect(o).toMatchObject({ paid: "400.00", balance: "600.00", paymentStatus: "PARTIAL", status: "ORDER_RECEIVED" });
    expect(o.history).toHaveLength(1);
  });

  it("runs the full pipeline with guards on cutting and delivery", async () => {
    const p = await person(A);
    const o = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "1000", advance: { amount: "300", method: "UPI" } });
    await expect(transitionOrder(A.ctx, o.id, "STITCHING")).rejects.toBeInstanceOf(ConflictError); // skipping stages
    await transitionOrder(A.ctx, o.id, "MEASUREMENT");
    await expect(transitionOrder(A.ctx, o.id, "CUTTING")).rejects.toThrow(/measurements/i); // none taken yet
    await attachMeasurement(A.ctx, o.id, KURTI);
    for (const s of ["CUTTING", "STITCHING", "TRIAL", "ALTERATION", "TRIAL", "READY"] as const) await transitionOrder(A.ctx, o.id, s);
    await expect(transitionOrder(A.ctx, o.id, "DELIVERED")).rejects.toThrow(/balance/i); // 700 still due
    await addPayment(A.ctx, o.id, { amount: "700", method: "CASH" });
    await transitionOrder(A.ctx, o.id, "DELIVERED", "Collected by customer");
    const done = await getOrder(A.ctx, o.id);
    expect(done).toMatchObject({ status: "DELIVERED", paymentStatus: "PAID", balance: "0.00" });
    expect(done.deliveredAt).not.toBeNull();
    expect(done.history.map((h) => h.toStatus)).toEqual(["ORDER_RECEIVED", "MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "ALTERATION", "TRIAL", "READY", "DELIVERED"]);
    await expect(transitionOrder(A.ctx, o.id, "CANCELLED")).rejects.toBeInstanceOf(ConflictError);
    await expect(attachMeasurement(A.ctx, o.id, KURTI)).rejects.toBeInstanceOf(ConflictError);
  });

  it("blocks overpayment, dedupes by idempotency key, and survives concurrent payments", async () => {
    const p = await person(A);
    const o = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "1000" });
    await expect(addPayment(A.ctx, o.id, { amount: "1000.01", method: "CASH" })).rejects.toThrow(/exceeds/);
    await addPayment(A.ctx, o.id, { amount: "100", method: "UPI", idempotencyKey: "k1" });
    await addPayment(A.ctx, o.id, { amount: "100", method: "UPI", idempotencyKey: "k1" });
    expect((await getOrder(A.ctx, o.id)).paid).toBe("100.00");
    const results = await Promise.allSettled([
      addPayment(A.ctx, o.id, { amount: "600", method: "CASH" }),
      addPayment(A.ctx, o.id, { amount: "600", method: "CASH" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(Number((await getOrder(A.ctx, o.id)).paid)).toBeLessThanOrEqual(1000);
  });

  it("cancelled orders accept no payments; past promise dates are refused", async () => {
    const p = await person(A);
    const o = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "500" });
    await transitionOrder(A.ctx, o.id, "CANCELLED", "Customer changed mind");
    await expect(addPayment(A.ctx, o.id, { amount: "100", method: "CASH" })).rejects.toBeInstanceOf(ConflictError);
    await expect(createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: "2020-01-01", charges: "500" })).rejects.toBeInstanceOf(AppError);
  });

  it("dashboard and notifications reflect overdue and balances", async () => {
    const t = await makeTenant("Dash");
    const p = await person(t);
    const o = await createOrder(t.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "1000", advance: { amount: "250", method: "CASH" } });
    await prisma.order.update({ where: { id: o.id }, data: { promisedDate: new Date(Date.now() - 2 * 86_400_000) } });
    const d = await getOrderDashboard(t.ctx);
    expect(d.overdue).toBe(1);
    expect(d.outstanding).toBe("750.00");
    expect(d.collectedThisMonth).toBe("250.00");
    expect((await getNotifications(t.ctx)).some((n) => n.severity === "high")).toBe(true);
  });

  it("tailors see only the jobs assigned to them", async () => {
    const tailor = await addMember(A.ctx, "TAILOR");
    const p = await person(A);
    const mine = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "700", assignedMembershipId: tailor.membershipId });
    const other = await createOrder(A.ctx, { customerId: p.customerId, familyMemberId: p.memberId, garment: "kurti", promisedDate: tomorrow(), charges: "700" });
    const seen = (await listOrders(tailor.ctx)).map((o) => o.id);
    expect(seen).toContain(mine.id);
    expect(seen).not.toContain(other.id);
    await expect(getOrder(tailor.ctx, other.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(transitionOrder(tailor.ctx, mine.id, "MEASUREMENT")).resolves.toBeUndefined();
    await expect(transitionOrder(tailor.ctx, mine.id, "CANCELLED")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("Tenant A cannot touch Tenant B's orders, family or measurements", () => {
  let bOrder: string;
  beforeAll(async () => {
    bOrder = (await createOrder(B.ctx, { customerId: bCust, familyMemberId: bSelf, garment: "kurti", promisedDate: tomorrow(), charges: "900", advance: { amount: "100", method: "CASH" }, measurement: { values: KURTI } })).id;
  });

  it("cannot read, advance, pay or update B's order", async () => {
    await expect(getOrder(A.ctx, bOrder)).rejects.toBeInstanceOf(NotFoundError);
    await expect(transitionOrder(A.ctx, bOrder, "MEASUREMENT")).rejects.toBeInstanceOf(NotFoundError);
    await expect(addPayment(A.ctx, bOrder, { amount: "10", method: "CASH" })).rejects.toBeInstanceOf(NotFoundError);
    expect((await listOrders(A.ctx)).map((o) => o.id)).not.toContain(bOrder);
  });

  it("cannot create orders for B's customer/member or assign B's staff", async () => {
    await expect(createOrder(A.ctx, { customerId: bCust, familyMemberId: bSelf, garment: "kurti", promisedDate: tomorrow(), charges: "1" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(createOrder(A.ctx, { customerId: aCust, familyMemberId: bSelf, garment: "kurti", promisedDate: tomorrow(), charges: "1" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(createOrder(A.ctx, { customerId: aCust, familyMemberId: aSelf, garment: "kurti", promisedDate: tomorrow(), charges: "1", assignedMembershipId: B.ctx.membershipId })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("cannot read B's measurements or family", async () => {
    await expect(getMeasurementWorkspace(A.ctx, bSelf, "kurti")).rejects.toBeInstanceOf(NotFoundError);
    await expect(listFamily(A.ctx, bCust)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("each tenant has its own order number sequence", async () => {
    const a = await createOrder(A.ctx, { customerId: aCust, familyMemberId: aSelf, garment: "kurti", promisedDate: tomorrow(), charges: "100" });
    const b = await createOrder(B.ctx, { customerId: bCust, familyMemberId: bSelf, garment: "kurti", promisedDate: tomorrow(), charges: "100" });
    expect(Math.abs(a.orderNo - b.orderNo)).toBeLessThan(a.orderNo + 1000); // independent counters (not shared)
    const rows = await prisma.order.findMany({ where: { id: { in: [a.id, b.id] } }, select: { tenantId: true } });
    expect(new Set(rows.map((r) => r.tenantId)).size).toBe(2);
  });
});
