import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { loadContext } from "@/server/context";
import { authenticate } from "@/server/login";
import { resetRateLimits } from "@/server/rate-limit";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/errors";
import { createBranch } from "@/server/services/branches";
import { createCustomer, listCustomers } from "@/server/services/customers";
import { listAudit } from "@/server/services/overview";
import { createMember, setMemberStatus } from "@/server/services/team";
import { PASSWORD, addMember, makeTenant, phone, uniqueEmail } from "./helpers";

let T: Awaited<ReturnType<typeof makeTenant>>;
beforeAll(async () => {
  T = await makeTenant("RBAC");
});

describe("RBAC", () => {
  it("sales cannot manage branches, team or audit", async () => {
    const sales = await addMember(T.ctx, "SALES");
    await expect(createBranch(sales.ctx, { name: "Nope", code: "NOPE" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      createMember(sales.ctx, { name: "x", email: uniqueEmail(), password: PASSWORD, role: "TAILOR", allBranches: true, branchIds: [] }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listAudit(sales.ctx)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("tailor cannot read customers", async () => {
    const tailor = await addMember(T.ctx, "TAILOR");
    await expect(listCustomers(tailor.ctx)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("cashier can read but not write customers", async () => {
    const cashier = await addMember(T.ctx, "CASHIER");
    await expect(listCustomers(cashier.ctx)).resolves.toBeDefined();
    await expect(createCustomer(cashier.ctx, { name: "x", phone: phone() as never, preferredLanguage: "en" })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("only an owner can mint an owner; managers cannot", async () => {
    const manager = await addMember(T.ctx, "MANAGER");
    await expect(
      createMember(manager.ctx, { name: "x", email: uniqueEmail(), password: PASSWORD, role: "OWNER", allBranches: true, branchIds: [] }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(setMemberStatus(manager.ctx, T.ctx.membershipId, "DISABLED")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("branch-scoped users see and create only within their branches", async () => {
    const other = await createBranch(T.ctx, { name: "Other", code: "OTH" });
    const hq = await createCustomer(T.ctx, { name: "HQ cust", phone: phone() as never, branchId: T.mainBranchId, preferredLanguage: "en" });
    const sales = await addMember(T.ctx, "SALES", { allBranches: false, branchIds: [other.id] });
    expect((await listCustomers(sales.ctx)).map((c) => c.id)).not.toContain(hq.id);
    await expect(
      createCustomer(sales.ctx, { name: "x", phone: phone() as never, branchId: T.mainBranchId, preferredLanguage: "en" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    const mine = await createCustomer(sales.ctx, { name: "mine", phone: phone() as never, branchId: other.id, preferredLanguage: "en" });
    expect((await listCustomers(sales.ctx)).map((c) => c.id)).toContain(mine.id);
  });

  it("disabled members lose access immediately", async () => {
    const m = await addMember(T.ctx, "SALES");
    await setMemberStatus(T.ctx, m.membershipId, "DISABLED");
    await expect(loadContext({ userId: m.ctx.userId, membershipId: m.membershipId })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("a session cannot be pointed at someone else's membership", async () => {
    const other = await makeTenant("Other");
    await expect(loadContext({ userId: T.ctx.userId, membershipId: other.ctx.membershipId })).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(loadContext({})).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("branch ids from another tenant are rejected for members", async () => {
    const other = await makeTenant("Other2");
    await expect(
      createMember(T.ctx, { name: "x", email: uniqueEmail(), password: PASSWORD, role: "SALES", allBranches: false, branchIds: [other.mainBranchId] }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("authentication", () => {
  it("accepts valid credentials and rejects wrong password / unknown user", async () => {
    resetRateLimits();
    expect(await authenticate({ email: T.email, password: PASSWORD })).toMatchObject({ email: T.email, membershipId: T.ctx.membershipId });
    expect(await authenticate({ email: T.email, password: "wrong-password-1" })).toBeNull();
    expect(await authenticate({ email: "nobody@test.dev", password: PASSWORD })).toBeNull();
    expect(await authenticate({ email: "not-an-email", password: "x" })).toBeNull();
  });

  it("locks the account after repeated failures", async () => {
    resetRateLimits();
    const victim = await makeTenant("Lock");
    for (let i = 0; i < 5; i++) await authenticate({ email: victim.email, password: "bad-password-1" });
    resetRateLimits();
    expect(await authenticate({ email: victim.email, password: PASSWORD })).toBeNull();
  });

  it("rate limits repeated attempts for one email", async () => {
    resetRateLimits();
    const t = await makeTenant("RL");
    for (let i = 0; i < 10; i++) await authenticate({ email: t.email, password: "bad-password-1" });
    expect(await authenticate({ email: t.email, password: PASSWORD })).toBeNull();
    resetRateLimits();
  });

  it("never stores plaintext passwords", async () => {
    const u = await prisma.user.findUniqueOrThrow({ where: { email: T.email } });
    expect(u.passwordHash).not.toContain(PASSWORD);
    expect(u.passwordHash).toMatch(/^\$2[aby]\$/);
  });
});

describe("audit trail", () => {
  it("records actions and is immutable at the database level", async () => {
    const events = await listAudit(T.ctx);
    expect(events.some((e) => e.action === "tenant.signup")).toBe(true);
    const id = events[0]!.id;
    await expect(prisma.auditEvent.update({ where: { id }, data: { action: "tampered" } })).rejects.toThrow(/immutable/);
    await expect(prisma.auditEvent.delete({ where: { id } })).rejects.toThrow(/immutable/);
  });
});
