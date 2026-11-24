import { beforeAll, describe, expect, it } from "vitest";
import { loadContext } from "@/server/context";
import { prisma } from "@/server/db";
import { ForbiddenError, UnauthorizedError } from "@/server/errors";
import { hashPassword } from "@/server/tenancy";
import { createCustomer } from "@/server/services/customers";
import { getBranding, updateBranding, validateLogo } from "@/server/services/branding";
import { getTenantDetail, listTenants, loadPlatformContext, platformOverview, setTenantStatus } from "@/server/services/platform";
import { addMember, makeTenant, phone, uniqueEmail } from "./helpers";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const base = (name: string) => ({ name, brandColor: "#0f766e", bannerEnabled: true, bannerText: "Sale on", bannerTone: "promo" as const });

let A: Awaited<ReturnType<typeof makeTenant>>, B: Awaited<ReturnType<typeof makeTenant>>;
beforeAll(async () => {
  A = await makeTenant("BrandA");
  B = await makeTenant("BrandB");
});

describe("tenant branding", () => {
  it("each tenant has its own theme, logo and banner", async () => {
    await updateBranding(A.ctx, { ...base("Rangoli"), logoDataUrl: PNG, phone: "9886000000" });
    const a = await getBranding(A.tenantId);
    const b = await getBranding(B.tenantId);
    expect(a).toMatchObject({ name: "Rangoli", brandColor: "#0f766e", bannerEnabled: true, logoDataUrl: PNG });
    expect(b.logoDataUrl).toBeNull();
    expect(b.brandColor).toBe("#7c2d5b");
    expect(b.bannerEnabled).toBe(false);
  });

  it("only users with tenant:manage can change branding", async () => {
    const sales = await addMember(A.ctx, "SALES");
    await expect(updateBranding(sales.ctx, base("Hacked"))).rejects.toBeInstanceOf(ForbiddenError);
    const manager = await addMember(A.ctx, "MANAGER");
    await expect(updateBranding(manager.ctx, base("Hacked"))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses SVG, mislabelled and oversized logos", () => {
    expect(() => validateLogo("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toThrow();
    expect(() => validateLogo("data:image/png;base64," + Buffer.from("<script>alert(1)</script>").toString("base64"))).toThrow(/does not match/);
    expect(() => validateLogo("data:image/jpeg;base64," + Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(160 * 1024)]).toString("base64"))).toThrow(/150 KB/);
    expect(() => validateLogo(PNG)).not.toThrow();
  });

  it("a suspended tenant's users lose access immediately", async () => {
    const t = await makeTenant("Susp");
    const admin = await adminCtx();
    await setTenantStatus(admin, t.tenantId, "SUSPENDED");
    await expect(loadContext({ userId: t.ctx.userId, membershipId: t.ctx.membershipId })).rejects.toBeInstanceOf(UnauthorizedError);
    await setTenantStatus(admin, t.tenantId, "ACTIVE");
    await expect(loadContext({ userId: t.ctx.userId, membershipId: t.ctx.membershipId })).resolves.toBeDefined();
  });
});

async function adminCtx() {
  const u = await prisma.user.create({ data: { email: uniqueEmail("admin"), name: "Root", passwordHash: await hashPassword("x".repeat(12)), isPlatformAdmin: true } });
  return loadPlatformContext({ userId: u.id });
}

describe("Super Admin", () => {
  it("tenant staff cannot reach platform data", async () => {
    await expect(loadPlatformContext({ userId: A.ctx.userId })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(loadPlatformContext({})).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("sees every tenant with aggregates but no customer personal data", async () => {
    await createCustomer(A.ctx, { name: "Secret Person Zed", phone: phone() as never, preferredLanguage: "en" });
    const admin = await adminCtx();
    const rows = await listTenants(admin);
    expect(rows.map((r) => r.id)).toEqual(expect.arrayContaining([A.tenantId, B.tenantId]));
    expect(rows.find((r) => r.id === A.tenantId)!.customers).toBeGreaterThanOrEqual(1);

    const overview = await platformOverview(admin);
    const detail = await getTenantDetail(admin, A.tenantId);
    const dump = JSON.stringify({ overview, detail });
    expect(dump).not.toContain("Secret Person Zed");
    expect(overview.totals.tenants).toBeGreaterThanOrEqual(2);
    expect(overview.registrationsByMonth).toHaveLength(6);
    expect(detail.staff.length).toBeGreaterThan(0);
  });

  it("suspend/activate is audited against the target tenant", async () => {
    const admin = await adminCtx();
    await setTenantStatus(admin, B.tenantId, "SUSPENDED");
    await setTenantStatus(admin, B.tenantId, "ACTIVE");
    const events = await prisma.auditEvent.findMany({ where: { tenantId: B.tenantId, action: { startsWith: "platform." } } });
    expect(events.map((e) => e.action)).toEqual(expect.arrayContaining(["platform.tenant_suspended", "platform.tenant_active"]));
    expect(events.every((e) => e.actorUserId === admin.userId)).toBe(true);
  });
});
