import { assertCan, can, type AuthContext } from "../context";
import { tenantDb } from "../tenant-db";

export async function listAudit(ctx: AuthContext, take = 50) {
  assertCan(ctx, "audit:read");
  return tenantDb(ctx.tenantId).auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: Math.min(take, 200) });
}

export async function getDashboard(ctx: AuthContext) {
  assertCan(ctx, "dashboard:read");
  const db = tenantDb(ctx.tenantId);
  const branchWhere = ctx.allBranches ? {} : { id: { in: [...ctx.branchIds] } };
  const customerWhere = { deletedAt: null, ...(ctx.allBranches ? {} : { branchId: { in: [...ctx.branchIds] } }) };

  const [customers, branches, team, subscription, recent] = await Promise.all([
    can(ctx, "customer:read") ? db.customer.count({ where: customerWhere }) : Promise.resolve(null),
    can(ctx, "branch:read") ? db.branch.count({ where: { ...branchWhere, isActive: true } }) : Promise.resolve(null),
    can(ctx, "user:read") ? db.membership.count({ where: { status: "ACTIVE" } }) : Promise.resolve(null),
    db.subscription.findFirst({}),
    can(ctx, "customer:read")
      ? db.customer.findMany({ where: customerWhere, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, createdAt: true } })
      : Promise.resolve([]),
  ]);

  return {
    tenant: { id: ctx.tenantId, name: ctx.tenantName },
    me: { name: ctx.userName, email: ctx.email, role: ctx.roleKey },
    counts: { customers, branches, team },
    subscription: subscription && { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt },
    recentCustomers: recent,
  };
}
