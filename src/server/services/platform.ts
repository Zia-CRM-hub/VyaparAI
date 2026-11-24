/**
 * Super Admin (platform) services. These intentionally use the UNSCOPED client because they span tenants,
 * but they only expose aggregates and staff/profile data, never customer personal data or measurements
 * (DPDP data minimisation). Every entry point requires an authenticated platform admin.
 */
import { fromPaise, toPaise } from "@/lib/orders";
import { recordAudit } from "../audit";
import { prisma } from "../db";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../errors";

export interface PlatformContext {
  userId: string;
  name: string;
  email: string;
  ip?: string | null;
  userAgent?: string | null;
}

export async function loadPlatformContext(session: { userId?: string } | null | undefined): Promise<PlatformContext> {
  if (!session?.userId) throw new UnauthorizedError();
  const u = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!u) throw new UnauthorizedError();
  if (!u.isPlatformAdmin) throw new ForbiddenError("Platform administrators only");
  return { userId: u.id, name: u.name, email: u.email };
}

const dec = (v: { toString(): string } | null | undefined) => toPaise(v ?? 0);

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  city: string | null;
  plan: string;
  planStatus: string;
  createdAt: Date;
  users: number;
  customers: number;
  orders: number;
  revenue: string;
  outstanding: string;
  lastActivity: Date | null;
}

async function aggregates() {
  const [users, customers, orders, charges, payments, activity] = await Promise.all([
    prisma.membership.groupBy({ by: ["tenantId"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.customer.groupBy({ by: ["tenantId"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.order.groupBy({ by: ["tenantId"], _count: { _all: true } }),
    prisma.order.groupBy({ by: ["tenantId"], where: { status: { not: "CANCELLED" } }, _sum: { charges: true } }),
    prisma.payment.groupBy({ by: ["tenantId"], _sum: { amount: true } }),
    prisma.auditEvent.groupBy({ by: ["tenantId"], _max: { createdAt: true } }),
  ]);
  const m = <T extends { tenantId: string | null }, V>(rows: T[], f: (r: T) => V) =>
    new Map(rows.filter((r) => r.tenantId).map((r) => [r.tenantId as string, f(r)]));
  return {
    users: m(users, (r) => r._count._all),
    customers: m(customers, (r) => r._count._all),
    orders: m(orders, (r) => r._count._all),
    charges: m(charges, (r) => dec(r._sum.charges)),
    revenue: m(payments, (r) => dec(r._sum.amount)),
    lastActivity: m(activity, (r) => r._max.createdAt),
  };
}

export async function listTenants(_admin: PlatformContext, opts: { q?: string; status?: "ACTIVE" | "SUSPENDED" } = {}): Promise<TenantRow[]> {
  const [tenants, agg] = await Promise.all([
    prisma.tenant.findMany({
      where: {
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.q ? { OR: [{ name: { contains: opts.q, mode: "insensitive" } }, { slug: { contains: opts.q, mode: "insensitive" } }] } : {}),
      },
      include: { subscription: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    aggregates(),
  ]);
  return tenants.map((t) => {
    const revenue = agg.revenue.get(t.id) ?? 0n;
    const out = (agg.charges.get(t.id) ?? 0n) - revenue;
    return {
      id: t.id, name: t.name, slug: t.slug, status: t.status, city: t.city,
      plan: t.subscription?.plan ?? "-", planStatus: t.subscription?.status ?? "-", createdAt: t.createdAt,
      users: agg.users.get(t.id) ?? 0, customers: agg.customers.get(t.id) ?? 0, orders: agg.orders.get(t.id) ?? 0,
      revenue: fromPaise(revenue), outstanding: fromPaise(out > 0n ? out : 0n), lastActivity: agg.lastActivity.get(t.id) ?? null,
    };
  });
}

export async function platformOverview(admin: PlatformContext) {
  const tenants = await listTenants(admin);
  const since = new Date(Date.now() - 6 * 30 * 86_400_000);
  const [byStatus, regs] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.tenant.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);

  const months: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    months.push({ month: d.toISOString().slice(0, 7), count: 0 });
  }
  for (const r of regs) {
    const hit = months.find((x) => x.month === r.createdAt.toISOString().slice(0, 7));
    if (hit) hit.count++;
  }

  const stale = Date.now() - 14 * 86_400_000;
  const sum = (f: (t: TenantRow) => string) => fromPaise(tenants.reduce((s, t) => s + toPaise(f(t)), 0n));
  const planCounts: Record<string, number> = {};
  for (const t of tenants) planCounts[t.plan] = (planCounts[t.plan] ?? 0) + 1;

  return {
    totals: {
      tenants: tenants.length,
      active: tenants.filter((t) => t.status === "ACTIVE").length,
      suspended: tenants.filter((t) => t.status === "SUSPENDED").length,
      users: tenants.reduce((s, t) => s + t.users, 0),
      customers: tenants.reduce((s, t) => s + t.customers, 0),
      orders: tenants.reduce((s, t) => s + t.orders, 0),
      revenue: sum((t) => t.revenue),
      outstanding: sum((t) => t.outstanding),
    },
    registrationsByMonth: months,
    ordersByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Record<string, number>,
    planCounts,
    topByRevenue: [...tenants].sort((a, b) => Number(toPaise(b.revenue) - toPaise(a.revenue))).slice(0, 5),
    inactive: tenants.filter((t) => t.status === "ACTIVE" && (!t.lastActivity || t.lastActivity.getTime() < stale)),
    recent: tenants.slice(0, 8),
  };
}

export async function getTenantDetail(admin: PlatformContext, id: string) {
  const row = (await listTenants(admin)).find((t) => t.id === id);
  if (!row) throw new NotFoundError("Tenant not found");
  const [tenant, byStatus, staff, audit, branches] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id }, select: { phone: true, address: true, gstin: true, brandColor: true, bannerEnabled: true, bannerText: true } }),
    prisma.order.groupBy({ by: ["status"], where: { tenantId: id }, _count: { _all: true } }),
    prisma.membership.findMany({
      where: { tenantId: id },
      include: { user: { select: { name: true, email: true, lastLoginAt: true } }, role: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditEvent.findMany({ where: { tenantId: id }, orderBy: { createdAt: "desc" }, take: 15, select: { id: true, action: true, createdAt: true, entityType: true } }),
    prisma.branch.count({ where: { tenantId: id } }),
  ]);
  return {
    ...row,
    profile: tenant,
    branches,
    ordersByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Record<string, number>,
    staff: staff.map((m) => ({ id: m.id, name: m.user.name, email: m.user.email, role: m.role.name, status: m.status, lastLoginAt: m.user.lastLoginAt })),
    recentActivity: audit,
  };
}

export async function setTenantStatus(admin: PlatformContext, tenantId: string, status: "ACTIVE" | "SUSPENDED") {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
  if (!t) throw new NotFoundError("Tenant not found");
  await prisma.tenant.update({ where: { id: tenantId }, data: { status } });
  await recordAudit({
    tenantId, actorUserId: admin.userId, action: `platform.tenant_${status.toLowerCase()}`, entityType: "Tenant",
    entityId: tenantId, ip: admin.ip, userAgent: admin.userAgent,
  });
}
