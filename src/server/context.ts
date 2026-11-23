import { prisma } from "./db";
import { ForbiddenError, UnauthorizedError } from "./errors";
import type { Permission, RoleKey } from "./rbac";

/**
 * The authoritative, server-derived identity for one request.
 * tenantId always comes from the DB membership referenced by the signed session -
 * never from request bodies, query strings or headers.
 */
export interface AuthContext {
  userId: string;
  userName: string;
  email: string;
  membershipId: string;
  tenantId: string;
  tenantName: string;
  roleKey: RoleKey;
  permissions: ReadonlySet<Permission>;
  allBranches: boolean;
  branchIds: readonly string[];
  ip?: string | null;
  userAgent?: string | null;
}

export function can(ctx: AuthContext, permission: Permission): boolean {
  return ctx.permissions.has(permission);
}

export function assertCan(ctx: AuthContext, permission: Permission): void {
  if (!can(ctx, permission)) throw new ForbiddenError();
}

/** Branch-level visibility: owners/managers with allBranches see everything. */
export function canAccessBranch(ctx: AuthContext, branchId: string | null): boolean {
  if (ctx.allBranches) return true;
  return branchId !== null && ctx.branchIds.includes(branchId);
}

/**
 * Re-validates the session's membership against the database on every request so that
 * disabled users, suspended tenants and role changes take effect immediately.
 */
export async function loadContext(session: { userId?: string; membershipId?: string } | null | undefined): Promise<AuthContext> {
  if (!session?.userId || !session.membershipId) throw new UnauthorizedError();

  const m = await prisma.membership.findFirst({
    where: { id: session.membershipId, userId: session.userId, status: "ACTIVE", tenant: { status: "ACTIVE" } },
    include: {
      user: { select: { name: true, email: true } },
      tenant: { select: { name: true } },
      role: { include: { permissions: { include: { permission: true } } } },
      branches: { select: { branchId: true } },
    },
  });
  if (!m) throw new UnauthorizedError("Session is no longer valid");

  return {
    userId: m.userId,
    userName: m.user.name,
    email: m.user.email,
    membershipId: m.id,
    tenantId: m.tenantId,
    tenantName: m.tenant.name,
    roleKey: m.role.key as RoleKey,
    permissions: new Set(m.role.permissions.map((p) => p.permission.key as Permission)),
    allBranches: m.allBranches,
    branchIds: m.branches.map((b) => b.branchId),
  };
}
