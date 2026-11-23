/**
 * Permission catalogue and default system roles. Code is the source of truth;
 * `syncPermissions` / `provisionTenant` copy it into the Permission/Role tables.
 */
export const PERMISSIONS = {
  "dashboard:read": "View the business dashboard",
  "branch:read": "View branches",
  "branch:manage": "Create and edit branches",
  "user:read": "View team members",
  "user:manage": "Invite and manage team members and roles",
  "customer:read": "View customers",
  "customer:write": "Create and edit customers",
  "customer:delete": "Delete customers",
  "consent:write": "Record customer consent",
  "audit:read": "View the audit trail",
  "tenant:manage": "Edit business settings and subscription",
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const ROLE_KEYS = [
  "OWNER",
  "MANAGER",
  "SALES",
  "MEASUREMENT_SPECIALIST",
  "PRODUCTION_MANAGER",
  "TAILOR",
  "CASHIER",
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const ROLE_NAMES: Record<RoleKey, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  SALES: "Sales",
  MEASUREMENT_SPECIALIST: "Measurement Specialist",
  PRODUCTION_MANAGER: "Production Manager",
  TAILOR: "Tailor / Worker",
  CASHIER: "Cashier",
};

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  MANAGER: [
    "dashboard:read", "branch:read", "branch:manage", "user:read", "user:manage",
    "customer:read", "customer:write", "consent:write", "audit:read",
  ],
  SALES: ["dashboard:read", "branch:read", "customer:read", "customer:write", "consent:write"],
  MEASUREMENT_SPECIALIST: ["dashboard:read", "branch:read", "customer:read", "customer:write", "consent:write"],
  PRODUCTION_MANAGER: ["dashboard:read", "branch:read", "user:read", "customer:read"],
  TAILOR: ["branch:read"],
  CASHIER: ["dashboard:read", "branch:read", "customer:read"],
};

/** Roles a user with `user:manage` may assign. Only an OWNER can mint another OWNER. */
export function assignableRoles(actorRole: RoleKey): RoleKey[] {
  return actorRole === "OWNER" ? [...ROLE_KEYS] : ROLE_KEYS.filter((r) => r !== "OWNER");
}
