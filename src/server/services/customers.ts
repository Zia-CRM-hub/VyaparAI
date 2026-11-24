import { Prisma } from "@prisma/client";
import type { CustomerCreateInput, CustomerUpdateInput } from "@/lib/schemas";
import { recordAudit } from "../audit";
import { assertCan, canAccessBranch, type AuthContext } from "../context";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { tenantDb } from "../tenant-db";

function branchFilter(ctx: AuthContext): Prisma.CustomerWhereInput {
  return ctx.allBranches ? {} : { branchId: { in: [...ctx.branchIds] } };
}

async function assertBranchUsable(ctx: AuthContext, branchId: string | undefined | null) {
  if (!branchId) {
    if (!ctx.allBranches) throw new ForbiddenError("Choose one of your branches");
    return;
  }
  if (!canAccessBranch(ctx, branchId)) throw new ForbiddenError("You do not have access to that branch");
  const branch = await tenantDb(ctx.tenantId).branch.findUnique({ where: { id: branchId }, select: { id: true } });
  if (!branch) throw new NotFoundError("Branch not found");
}

export async function listCustomers(ctx: AuthContext, opts: { q?: string; take?: number } = {}) {
  assertCan(ctx, "customer:read");
  const q = opts.q?.trim();
  return tenantDb(ctx.tenantId).customer.findMany({
    where: {
      deletedAt: null,
      ...branchFilter(ctx),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(opts.take ?? 50, 100),
  });
}

export async function getCustomer(ctx: AuthContext, id: string) {
  assertCan(ctx, "customer:read");
  const c = await tenantDb(ctx.tenantId).customer.findFirst({ where: { id, deletedAt: null, ...branchFilter(ctx) } });
  if (!c) throw new NotFoundError("Customer not found");
  return c;
}

export async function createCustomer(ctx: AuthContext, input: CustomerCreateInput) {
  assertCan(ctx, "customer:write");
  await assertBranchUsable(ctx, input.branchId);
  const { gender, ageGroup, ...fields } = input;
  try {
    const c = await tenantDb(ctx.tenantId).customer.create({
      data: {
        ...fields,
        branchId: input.branchId ?? null,
        ...(gender && ageGroup
          ? { familyMembers: { create: { name: input.name, relation: "Self", isSelf: true, gender, ageGroup } } }
          : {}),
      } as Prisma.CustomerUncheckedCreateInput,
    });
    await recordAudit({
      tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "customer.create",
      entityType: "Customer", entityId: c.id, ip: ctx.ip, userAgent: ctx.userAgent,
    });
    return c;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("A customer with this phone number already exists");
    }
    throw e;
  }
}

export async function updateCustomer(ctx: AuthContext, id: string, input: CustomerUpdateInput) {
  assertCan(ctx, "customer:write");
  await getCustomer(ctx, id); // existence + branch visibility
  if (input.branchId !== undefined) await assertBranchUsable(ctx, input.branchId);
  try {
    const c = await tenantDb(ctx.tenantId).customer.update({ where: { id }, data: input });
    await recordAudit({
      tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "customer.update",
      entityType: "Customer", entityId: id, metadata: { fields: Object.keys(input) },
      ip: ctx.ip, userAgent: ctx.userAgent,
    });
    return c;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("A customer with this phone number already exists");
    }
    throw e;
  }
}

export async function deleteCustomer(ctx: AuthContext, id: string) {
  assertCan(ctx, "customer:delete");
  await getCustomer(ctx, id);
  await tenantDb(ctx.tenantId).customer.update({ where: { id }, data: { deletedAt: new Date() } });
  await recordAudit({
    tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "customer.delete",
    entityType: "Customer", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent,
  });
}
