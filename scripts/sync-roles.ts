import { prisma } from "../src/server/db";
import { syncAllTenantRoles } from "../src/server/tenancy";

syncAllTenantRoles()
  .then(() => console.log("Role permissions synced for all tenants."))
  .finally(() => prisma.$disconnect());
