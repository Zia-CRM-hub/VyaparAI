import { prisma } from "./db";

/** Every model that carries a tenantId column. Keep in sync with prisma/schema.prisma. */
export const TENANT_MODELS = new Set([
  "Branch",
  "Role",
  "Membership",
  "MembershipBranch",
  "Customer",
  "Consent",
  "AuditEvent",
  "Subscription",
  "FeatureEntitlement",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Args = Record<string, unknown> | undefined;

function scopeWhere(args: Args, tenantId: string): Record<string, unknown> {
  const next = { ...(args ?? {}) };
  const where = (next.where ?? {}) as Record<string, unknown>;
  if (where.tenantId !== undefined && where.tenantId !== tenantId) {
    throw new Error("Tenant scope violation: foreign tenantId in where");
  }
  next.where = { ...where, tenantId };
  return next;
}

function scopeData(data: unknown, tenantId: string): unknown {
  if (Array.isArray(data)) return data.map((d) => scopeData(d, tenantId));
  const row = { ...(data as Record<string, unknown>) };
  if (row.tenantId !== undefined && row.tenantId !== tenantId) {
    throw new Error("Tenant scope violation: foreign tenantId in data");
  }
  row.tenantId = tenantId;
  return row;
}

/**
 * Returns a Prisma client that is hard-scoped to one tenant:
 *  - reads/updates/deletes get `tenantId` ANDed into `where`
 *  - creates get `tenantId` forced (a different value throws)
 * The tenantId must come from the authenticated session, never from the client.
 *
 * Limits (documented in docs/ARCHITECTURE.md): raw SQL bypasses this and is banned in
 * feature code; nested relation connects must reference ids verified through this client.
 */
export function tenantDb(tenantId: string) {
  if (!UUID_RE.test(tenantId)) throw new Error("tenantDb requires a valid tenant UUID");

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);
          const a = args as Args;
          switch (operation) {
            case "findMany":
            case "findFirst":
            case "findFirstOrThrow":
            case "findUnique":
            case "findUniqueOrThrow":
            case "count":
            case "aggregate":
            case "groupBy":
            case "update":
            case "updateMany":
            case "updateManyAndReturn":
            case "delete":
            case "deleteMany":
              return query(scopeWhere(a, tenantId) as typeof args);
            case "create":
              return query({ ...a, data: scopeData(a?.data, tenantId) } as typeof args);
            case "createMany":
            case "createManyAndReturn":
              return query({ ...a, data: scopeData(a?.data, tenantId) } as typeof args);
            case "upsert":
              return query({
                ...scopeWhere(a, tenantId),
                create: scopeData(a?.create, tenantId),
              } as typeof args);
            default:
              throw new Error(`Operation ${operation} is not allowed on tenant-scoped models`);
          }
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;
