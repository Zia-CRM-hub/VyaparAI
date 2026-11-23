import { randomUUID } from "node:crypto";
import { loadContext, type AuthContext } from "@/server/context";
import { createBranch } from "@/server/services/branches";
import { createMember } from "@/server/services/team";
import { provisionTenant } from "@/server/tenancy";
import type { RoleKey } from "@/server/rbac";

export const PASSWORD = "TestPassw0rd!x";
export const uniqueEmail = (p = "u") => `${p}.${randomUUID().slice(0, 8)}@test.dev`;

export async function makeTenant(name = "Shop") {
  const email = uniqueEmail("owner");
  const { user, membership, branch, tenant } = await provisionTenant({
    businessName: `${name} ${randomUUID().slice(0, 4)}`,
    ownerName: "Owner",
    email,
    password: PASSWORD,
  });
  const ctx = await loadContext({ userId: user.id, membershipId: membership.id });
  return { ctx, email, tenantId: tenant.id, mainBranchId: branch.id };
}

/** Creates a member through the real service and returns that member's own context. */
export async function addMember(
  owner: AuthContext,
  role: RoleKey,
  opts: { allBranches?: boolean; branchIds?: string[] } = {},
) {
  const email = uniqueEmail(role.toLowerCase());
  const { id } = await createMember(owner, {
    name: role,
    email,
    password: PASSWORD,
    role,
    allBranches: opts.allBranches ?? true,
    branchIds: opts.branchIds ?? [],
  });
  const { prisma } = await import("@/server/db");
  const m = await prisma.membership.findUniqueOrThrow({ where: { id } });
  return { ctx: await loadContext({ userId: m.userId, membershipId: m.id }), email, membershipId: id };
}

let n = 0;
export const phone = () => `9${String(800000000 + ++n + Math.floor(Math.random() * 1e6)).padStart(9, "0")}`;
export { createBranch };
