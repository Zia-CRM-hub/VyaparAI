import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export interface AuditInput {
  tenantId: string | null;
  actorUserId: string | null;
  action: string; // e.g. "customer.create"
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

const SENSITIVE = /password|secret|token|hash/i;

function redact(value: Prisma.InputJsonValue | undefined): Prisma.InputJsonValue | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, SENSITIVE.test(k) ? "[redacted]" : v]),
  ) as Prisma.InputJsonValue;
}

/** Append-only audit write. The DB also rejects UPDATE/DELETE on AuditEvent. */
export async function recordAudit(input: AuditInput, db: Pick<typeof prisma, "auditEvent"> = prisma) {
  await db.auditEvent.create({
    data: {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: redact(input.metadata),
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 300) ?? null,
    },
  });
}
