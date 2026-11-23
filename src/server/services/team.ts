import type { MemberCreateInput } from "@/lib/schemas";
import { recordAudit } from "../audit";
import { assertCan, type AuthContext } from "../context";
import { prisma } from "../db";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { assignableRoles } from "../rbac";
import { tenantDb } from "../tenant-db";
import { hashPassword } from "../tenancy";

export async function listMembers(ctx: AuthContext) {
  assertCan(ctx, "user:read");
  const rows = await tenantDb(ctx.tenantId).membership.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, lastLoginAt: true } },
      role: { select: { key: true, name: true } },
      branches: { select: { branchId: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((m) => ({
    id: m.id,
    status: m.status,
    allBranches: m.allBranches,
    branchIds: m.branches.map((b) => b.branchId),
    role: m.role,
    user: m.user,
  }));
}

export async function createMember(ctx: AuthContext, input: MemberCreateInput) {
  assertCan(ctx, "user:manage");
  if (!assignableRoles(ctx.roleKey).includes(input.role)) {
    throw new ForbiddenError("You cannot assign that role");
  }
  const db = tenantDb(ctx.tenantId);

  const role = await db.role.findUnique({ where: { tenantId_key: { tenantId: ctx.tenantId, key: input.role } } });
  if (!role) throw new NotFoundError("Role not found");

  // Branch ids must belong to THIS tenant (client-supplied ids are never trusted).
  const branchIds = input.allBranches ? [] : [...new Set(input.branchIds)];
  if (!input.allBranches && branchIds.length === 0) throw new ForbiddenError("Assign at least one branch");
  if (branchIds.length) {
    const found = await db.branch.count({ where: { id: { in: branchIds } } });
    if (found !== branchIds.length) throw new NotFoundError("Branch not found");
  }

  const limit = await db.featureEntitlement.findUnique({
    where: { tenantId_feature: { tenantId: ctx.tenantId, feature: "users" } },
  });
  if (limit?.limit != null) {
    const count = await db.membership.count({ where: { status: "ACTIVE" } });
    if (count >= limit.limit) throw new ConflictError(`Your plan allows ${limit.limit} users`);
  }

  // Joining an existing account to a second tenant needs an invite/accept flow (Phase 2 backlog).
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await hashPassword(input.password);
  const membership = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: input.email, name: input.name, passwordHash } });
    const m = await tx.membership.create({
      data: { tenantId: ctx.tenantId, userId: user.id, roleId: role.id, allBranches: input.allBranches },
    });
    if (branchIds.length) {
      await tx.membershipBranch.createMany({
        data: branchIds.map((branchId) => ({ membershipId: m.id, branchId, tenantId: ctx.tenantId })),
      });
    }
    await recordAudit(
      {
        tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "member.create",
        entityType: "Membership", entityId: m.id, metadata: { role: input.role, email: input.email },
        ip: ctx.ip, userAgent: ctx.userAgent,
      },
      tx,
    );
    return m;
  });
  return { id: membership.id };
}

export async function setMemberStatus(ctx: AuthContext, membershipId: string, status: "ACTIVE" | "DISABLED") {
  assertCan(ctx, "user:manage");
  const db = tenantDb(ctx.tenantId);
  const target = await db.membership.findUnique({ where: { id: membershipId }, include: { role: true } });
  if (!target) throw new NotFoundError("Member not found");
  if (target.id === ctx.membershipId) throw new ForbiddenError("You cannot change your own status");
  if (target.role.key === "OWNER" && ctx.roleKey !== "OWNER") throw new ForbiddenError("Only an owner can change an owner");

  await db.membership.update({ where: { id: membershipId }, data: { status } });
  await recordAudit({
    tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `member.${status === "ACTIVE" ? "enable" : "disable"}`,
    entityType: "Membership", entityId: membershipId, ip: ctx.ip, userAgent: ctx.userAgent,
  });
}
