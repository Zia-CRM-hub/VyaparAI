import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { tenantDb } from "@/server/tenant-db";
import { createBranch, listBranches } from "@/server/services/branches";
import { createCustomer, deleteCustomer, getCustomer, listCustomers, updateCustomer } from "@/server/services/customers";
import { getDashboard, listAudit } from "@/server/services/overview";
import { createMember, listMembers, setMemberStatus } from "@/server/services/team";
import { NotFoundError } from "@/server/errors";
import { PASSWORD, makeTenant, phone, uniqueEmail } from "./helpers";

type T = Awaited<ReturnType<typeof makeTenant>>;
let A: T, B: T;
let aCustomerId: string, bCustomerId: string, bCustomerPhone: string;

beforeAll(async () => {
  A = await makeTenant("A");
  B = await makeTenant("B");
  aCustomerId = (await createCustomer(A.ctx, { name: "Alice A", phone: phone() as never, preferredLanguage: "en" })).id;
  bCustomerPhone = phone();
  bCustomerId = (await createCustomer(B.ctx, { name: "Bob B", phone: bCustomerPhone as never, preferredLanguage: "en" })).id;
});

describe("Tenant A cannot touch Tenant B (service layer)", () => {
  it("list returns only own customers", async () => {
    const ids = (await listCustomers(A.ctx)).map((c) => c.id);
    expect(ids).toContain(aCustomerId);
    expect(ids).not.toContain(bCustomerId);
  });

  it("cannot read B's customer by id", async () => {
    await expect(getCustomer(A.ctx, bCustomerId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("cannot update B's customer, and B's data is unchanged", async () => {
    await expect(updateCustomer(A.ctx, bCustomerId, { name: "Hacked" })).rejects.toBeInstanceOf(NotFoundError);
    expect((await getCustomer(B.ctx, bCustomerId)).name).toBe("Bob B");
  });

  it("cannot delete B's customer", async () => {
    await expect(deleteCustomer(A.ctx, bCustomerId)).rejects.toBeInstanceOf(NotFoundError);
    expect((await getCustomer(B.ctx, bCustomerId)).deletedAt).toBeNull();
  });

  it("cannot create a customer in B's branch", async () => {
    await expect(
      createCustomer(A.ctx, { name: "X", phone: phone() as never, branchId: B.mainBranchId, preferredLanguage: "en" }),
    ).rejects.toThrow();
  });

  it("the same phone number can exist in both tenants (unique per tenant)", async () => {
    const c = await createCustomer(A.ctx, { name: "Dup", phone: bCustomerPhone as never, preferredLanguage: "en" });
    expect(c.tenantId).toBe(A.tenantId);
  });

  it("branches, members and audit are scoped", async () => {
    expect((await listBranches(A.ctx)).every((b) => b.tenantId === A.tenantId)).toBe(true);
    expect((await listMembers(A.ctx)).some((m) => m.user.email === B.email)).toBe(false);
    const audit = await listAudit(A.ctx);
    expect(audit.length).toBeGreaterThan(0);
    expect(audit.every((e) => e.tenantId === A.tenantId)).toBe(true);
  });

  it("cannot assign a member to B's branch or disable B's member", async () => {
    await expect(
      createMember(A.ctx, { name: "N", email: uniqueEmail(), password: PASSWORD, role: "SALES", allBranches: false, branchIds: [B.mainBranchId] }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(setMemberStatus(A.ctx, B.ctx.membershipId, "DISABLED")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("dashboard counts only own data", async () => {
    const before = await getDashboard(B.ctx);
    await createCustomer(A.ctx, { name: "More A", phone: phone() as never, preferredLanguage: "en" });
    expect((await getDashboard(B.ctx)).counts.customers).toBe(before.counts.customers);
  });

  it("branch limit is enforced per tenant entitlement", async () => {
    const t = await makeTenant("Limits");
    await createBranch(t.ctx, { name: "Two", code: "TWO" });
    await createBranch(t.ctx, { name: "Three", code: "THR" });
    await expect(createBranch(t.ctx, { name: "Four", code: "FOR" })).rejects.toThrow(/allows 3 branches/);
  });
});

describe("tenantDb hard scoping (data layer)", () => {
  it("findUnique/findFirst on a foreign id returns null", async () => {
    expect(await tenantDb(A.tenantId).customer.findUnique({ where: { id: bCustomerId } })).toBeNull();
    expect(await tenantDb(A.tenantId).customer.findFirst({ where: { id: bCustomerId } })).toBeNull();
  });

  it("update/delete of a foreign row fails", async () => {
    await expect(tenantDb(A.tenantId).customer.update({ where: { id: bCustomerId }, data: { name: "x" } })).rejects.toThrow();
    await expect(tenantDb(A.tenantId).customer.delete({ where: { id: bCustomerId } })).rejects.toThrow();
    expect((await tenantDb(A.tenantId).customer.updateMany({ where: { id: bCustomerId }, data: { name: "x" } })).count).toBe(0);
  });

  it("explicit foreign tenantId in where or data is rejected", async () => {
    await expect(tenantDb(A.tenantId).customer.findMany({ where: { tenantId: B.tenantId } })).rejects.toThrow(/scope violation/);
    await expect(
      tenantDb(A.tenantId).customer.create({ data: { tenantId: B.tenantId, name: "x", phone: phone() } }),
    ).rejects.toThrow(/scope violation/);
  });

  it("creates always receive the scoped tenantId", async () => {
    const c = await tenantDb(A.tenantId).customer.create({ data: { name: "auto", phone: phone() } as never });
    expect(c.tenantId).toBe(A.tenantId);
  });

  it("rejects non-UUID tenant ids", () => {
    expect(() => tenantDb("not-a-uuid")).toThrow();
    expect(() => tenantDb("' OR 1=1 --")).toThrow();
  });

  it("DB-level composite FK blocks cross-tenant branch references", async () => {
    await expect(
      prisma.customer.create({ data: { tenantId: A.tenantId, branchId: B.mainBranchId, name: "x", phone: phone() } }),
    ).rejects.toThrow();
  });
});
