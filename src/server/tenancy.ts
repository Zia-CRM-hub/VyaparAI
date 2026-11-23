import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { recordAudit } from "./audit";
import { prisma } from "./db";
import { ConflictError } from "./errors";
import { ALL_PERMISSIONS, PERMISSIONS, ROLE_KEYS, ROLE_NAMES, ROLE_PERMISSIONS } from "./rbac";
import type { SignupInput } from "@/lib/schemas";

export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "shop";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

/** Idempotently copies the code permission catalogue into the Permission table. */
export async function syncPermissions(db: Prisma.TransactionClient | typeof prisma = prisma) {
  for (const key of ALL_PERMISSIONS) {
    await db.permission.upsert({
      where: { key },
      update: { description: PERMISSIONS[key] },
      create: { key, description: PERMISSIONS[key] },
    });
  }
}

/** Creates the seven system roles (with their permissions) for a tenant. Returns roleId by key. */
export async function createSystemRoles(tx: Prisma.TransactionClient, tenantId: string) {
  const perms = await tx.permission.findMany();
  const permId = new Map(perms.map((p) => [p.key, p.id]));
  const roleIds: Record<string, string> = {};
  for (const key of ROLE_KEYS) {
    const role = await tx.role.create({ data: { tenantId, key, name: ROLE_NAMES[key], isSystem: true } });
    roleIds[key] = role.id;
    await tx.rolePermission.createMany({
      data: ROLE_PERMISSIONS[key].map((p) => ({ roleId: role.id, permissionId: permId.get(p)! })),
    });
  }
  return roleIds;
}

export const DEFAULT_ENTITLEMENTS: Array<{ feature: string; limit: number | null }> = [
  { feature: "branches", limit: 3 },
  { feature: "users", limit: 10 },
  { feature: "customers", limit: null },
];

interface Meta {
  ip?: string | null;
  userAgent?: string | null;
}

/** Self-serve signup: tenant + roles + default branch + owner + trial subscription, atomically. */
export async function provisionTenant(input: SignupInput, meta: Meta = {}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (tx) => {
    await syncPermissions(tx);
    const tenant = await tx.tenant.create({ data: { name: input.businessName, slug: slugify(input.businessName) } });
    const roleIds = await createSystemRoles(tx, tenant.id);
    const branch = await tx.branch.create({
      data: { tenantId: tenant.id, name: "Main Branch", code: "MAIN", city: input.city ?? null },
    });
    const user = await tx.user.create({ data: { email: input.email, name: input.ownerName, passwordHash } });
    const membership = await tx.membership.create({
      data: { tenantId: tenant.id, userId: user.id, roleId: roleIds.OWNER!, allBranches: true },
    });
    await tx.subscription.create({
      data: { tenantId: tenant.id, plan: "TRIAL", status: "TRIALING", trialEndsAt: new Date(Date.now() + 14 * 864e5) },
    });
    await tx.featureEntitlement.createMany({
      data: DEFAULT_ENTITLEMENTS.map((e) => ({ tenantId: tenant.id, ...e })),
    });
    await recordAudit(
      { tenantId: tenant.id, actorUserId: user.id, action: "tenant.signup", entityType: "Tenant", entityId: tenant.id, ...meta },
      tx,
    );
    return { tenant, branch, user, membership };
  });

  return result;
}
