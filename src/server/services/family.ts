import type { Prisma } from "@prisma/client";
import type { FamilyMemberInput } from "@/lib/schemas";
import { recordAudit } from "../audit";
import { assertCan, type AuthContext } from "../context";
import { NotFoundError } from "../errors";
import { tenantDb } from "../tenant-db";
import { getCustomer } from "./customers";

export async function listFamily(ctx: AuthContext, customerId: string) {
  await getCustomer(ctx, customerId); // existence + permission + branch visibility
  return tenantDb(ctx.tenantId).familyMember.findMany({
    where: { customerId },
    orderBy: [{ isSelf: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { measurements: true, orders: true } } },
  });
}

export async function addFamilyMember(ctx: AuthContext, customerId: string, input: FamilyMemberInput) {
  assertCan(ctx, "customer:write");
  await getCustomer(ctx, customerId);
  const m = await tenantDb(ctx.tenantId).familyMember.create({
    data: {
      customerId,
      name: input.name,
      relation: input.relation,
      gender: input.gender,
      ageGroup: input.ageGroup,
      dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null,
      notes: input.notes ?? null,
      isSelf: input.relation === "Self",
    } as Prisma.FamilyMemberUncheckedCreateInput,
  });
  await recordAudit({
    tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "family.create", entityType: "FamilyMember",
    entityId: m.id, ip: ctx.ip, userAgent: ctx.userAgent,
  });
  return m;
}

/** A family member the caller may see (customer branch rules apply). */
export async function getFamilyMember(ctx: AuthContext, id: string) {
  const m = await tenantDb(ctx.tenantId).familyMember.findUnique({ where: { id } });
  if (!m) throw new NotFoundError("Family member not found");
  await getCustomer(ctx, m.customerId);
  return m;
}
