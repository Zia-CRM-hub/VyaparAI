import { Prisma } from "@prisma/client";
import { cleanMeasurements, getTemplate, MeasurementError, sameMeasurements, type AgeGroup, type Gender } from "@/lib/measurements";
import type { MeasurementSaveInput } from "@/lib/schemas";
import { recordAudit } from "../audit";
import { assertCan, type AuthContext } from "../context";
import { prisma } from "../db";
import { AppError, ConflictError } from "../errors";
import { tenantDb } from "../tenant-db";
import { getFamilyMember } from "./family";

type Member = { id: string; gender: Gender; ageGroup: AgeGroup };

export function resolveTemplate(member: Member, garment: string) {
  const t = getTemplate(garment, member.gender, member.ageGroup);
  if (!t) throw new AppError(400, "invalid_garment", "That garment is not available for this person's gender and age group");
  return t;
}

function clean(member: Member, garment: string, values: Record<string, unknown>) {
  const template = resolveTemplate(member, garment);
  try {
    return cleanMeasurements(template, values);
  } catch (e) {
    if (e instanceof MeasurementError) throw new AppError(400, "invalid_measurement", e.message);
    throw e;
  }
}

/** Template + latest saved values (for prefill) + full version history for one person and garment. */
export async function getMeasurementWorkspace(ctx: AuthContext, memberId: string, garment: string) {
  assertCan(ctx, "measurement:read");
  const member = await getFamilyMember(ctx, memberId);
  const template = resolveTemplate(member, garment);
  const history = await tenantDb(ctx.tenantId).measurementSet.findMany({
    where: { familyMemberId: memberId, garment },
    orderBy: { version: "desc" },
    take: 50,
  });
  return { member, template, latest: history[0] ?? null, history };
}

/** Every saved measurement for a person, grouped by garment (profile view). */
export async function listMeasurementHistory(ctx: AuthContext, memberId: string) {
  assertCan(ctx, "measurement:read");
  await getFamilyMember(ctx, memberId);
  return tenantDb(ctx.tenantId).measurementSet.findMany({
    where: { familyMemberId: memberId },
    orderBy: [{ garment: "asc" }, { version: "desc" }],
    take: 200,
  });
}

type Tx = Prisma.TransactionClient;

/**
 * Saves a new immutable version, or returns the latest one untouched when the values did not change
 * (so reusing measurements for a new order never creates noise versions).
 */
export async function saveVersion(
  tx: Tx,
  ctx: AuthContext,
  member: Member,
  garment: string,
  rawValues: Record<string, unknown>,
  notes?: string,
) {
  const values = clean(member, garment, rawValues);
  const latest = await tx.measurementSet.findFirst({
    where: { tenantId: ctx.tenantId, familyMemberId: member.id, garment },
    orderBy: { version: "desc" },
  });
  if (latest && sameMeasurements(latest.values as Record<string, number>, values)) {
    return { set: latest, created: false };
  }
  const set = await tx.measurementSet.create({
    data: {
      tenantId: ctx.tenantId, familyMemberId: member.id, garment, version: (latest?.version ?? 0) + 1,
      values, notes: notes ?? null, createdById: ctx.userId,
    },
  });
  await recordAudit(
    {
      tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "measurement.save", entityType: "MeasurementSet",
      entityId: set.id, metadata: { garment, version: set.version }, ip: ctx.ip, userAgent: ctx.userAgent,
    },
    tx,
  );
  return { set, created: true };
}

export async function saveMeasurement(ctx: AuthContext, memberId: string, input: MeasurementSaveInput) {
  assertCan(ctx, "measurement:write");
  const member = await getFamilyMember(ctx, memberId);
  try {
    return await prisma.$transaction((tx) => saveVersion(tx, ctx, member, input.garment, input.values, input.notes));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("Measurements were just saved by someone else. Reload and try again.");
    }
    throw e;
  }
}
