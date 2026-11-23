/* Demo data: two tenants so isolation is visible. Run: npm run db:seed */
import { loadContext } from "../src/server/context";
import { prisma } from "../src/server/db";
import { createCustomer } from "../src/server/services/customers";
import { createBranch } from "../src/server/services/branches";
import { createMember } from "../src/server/services/team";
import { provisionTenant, syncPermissions } from "../src/server/tenancy";

const PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe!12345";

async function seedTenant(name: string, owner: string, email: string, city: string, customers: Array<[string, string]>) {
  if (await prisma.user.findUnique({ where: { email } })) {
    console.log(`skip ${name}: already seeded`);
    return;
  }
  const { user, membership, branch } = await provisionTenant({ businessName: name, ownerName: owner, email, password: PASSWORD, city });
  const ctx = await loadContext({ userId: user.id, membershipId: membership.id });
  const second = await createBranch(ctx, { name: `${city} Studio`, code: "STU", city });
  const slug = email.split("@")[1]!.split(".")[0]!;
  await createMember(ctx, { name: "Manager", email: `manager.${slug}@demo.test`, password: PASSWORD, role: "MANAGER", allBranches: true, branchIds: [] });
  await createMember(ctx, { name: "Sales (studio only)", email: `sales.${slug}@demo.test`, password: PASSWORD, role: "SALES", allBranches: false, branchIds: [second.id] });
  for (const [cname, phone] of customers) {
    await createCustomer(ctx, { name: cname, phone: phone as never, branchId: branch.id, preferredLanguage: "en" });
  }
  console.log(`seeded ${name}: owner ${email}`);
}

async function main() {
  await syncPermissions();
  await seedTenant("Rangoli Boutique", "Anita Rao", "owner@rangoli.demo.test", "Bengaluru", [
    ["Priya Nair", "9886000001"],
    ["Sunita Gowda", "9886000002"],
  ]);
  await seedTenant("Stitch & Style Tailors", "Imran Khan", "owner@stitchstyle.demo.test", "Bengaluru", [
    ["Rahul Verma", "9900000001"],
    ["Farah Siddiqui", "9900000002"],
  ]);
  console.log(`Demo password for all seeded users: ${PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
