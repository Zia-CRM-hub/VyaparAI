import { Prisma } from "@prisma/client";
import type { BranchCreateInput } from "@/lib/schemas";
import { recordAudit } from "../audit";
import { assertCan, type AuthContext } from "../context";
import { ConflictError } from "../errors";
import { tenantDb } from "../tenant-db";

export async function listBranches(ctx: AuthContext) {
  assertCan(ctx, "branch:read");
  return tenantDb(ctx.tenantId).branch.findMany({
    where: ctx.allBranches ? {} : { id: { in: [...ctx.branchIds] } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createBranch(ctx: AuthContext, input: BranchCreateInput) {
  assertCan(ctx, "branch:manage");
  const db = tenantDb(ctx.tenantId);

  const limit = await db.featureEntitlement.findUnique({
    where: { tenantId_feature: { tenantId: ctx.tenantId, feature: "branches" } },
  });
  if (limit?.limit != null) {
    const count = await db.branch.count({ where: { isActive: true } });
    if (count >= limit.limit) throw new ConflictError(`Your plan allows ${limit.limit} branches`);
  }

  try {
    const branch = await db.branch.create({ data: input as Prisma.BranchUncheckedCreateInput });
    await recordAudit({
      tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "branch.create",
      entityType: "Branch", entityId: branch.id, ip: ctx.ip, userAgent: ctx.userAgent,
    });
    return branch;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("A branch with this code already exists");
    }
    throw e;
  }
}
