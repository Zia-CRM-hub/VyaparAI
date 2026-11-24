/* Demo data: two boutiques (separate tenants) + a Super Admin. Idempotent. Run: npm run db:seed */
import type { AgeGroup, Gender } from "../src/lib/measurements";
import type { OrderStatus } from "../src/lib/orders";
import { loadContext, type AuthContext } from "../src/server/context";
import { prisma } from "../src/server/db";
import { createBranch } from "../src/server/services/branches";
import { createCustomer, listCustomers } from "../src/server/services/customers";
import { addFamilyMember, listFamily } from "../src/server/services/family";
import { addPayment, createOrder, transitionOrder } from "../src/server/services/orders";
import { createMember } from "../src/server/services/team";
import { hashPassword, provisionTenant, syncAllTenantRoles } from "../src/server/tenancy";

const PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe!12345";
const ADMIN_EMAIL = "admin@vyaparai.demo.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "PlatformAdmin!2345";

type V = Record<string, number>;
const M: Record<string, V> = {
  kurti: { bust: 92, waist: 76, hip: 98, shoulder: 37, sleeve_length: 22, length: 100, neck: 15 },
  blouse: { bust: 90, waist: 74, shoulder: 36, sleeve_length: 14, front_length: 36, back_length: 36, armhole: 41 },
  lehenga: { bust: 90, waist: 74, hip: 98, blouse_length: 15, skirt_length: 100, shoulder: 36 },
  salwar_suit: { bust: 92, waist: 76, hip: 98, top_length: 105, bottom_length: 100, shoulder: 37 },
  frock: { chest: 58, waist: 54, length: 60, shoulder: 28 },
  shirt: { chest: 100, waist: 90, shoulder: 46, sleeve_length: 62, length: 75, neck: 40 },
  trouser: { waist: 88, hip: 100, length: 102, inseam: 78, bottom: 22 },
  kurta_pyjama: { chest: 100, waist: 88, shoulder: 45, sleeve_length: 61, kurta_length: 105, pyjama_length: 100 },
  sherwani: { chest: 102, waist: 92, shoulder: 46, sleeve_length: 63, length: 110, neck: 41 },
};

interface Spec {
  name: string; owner: string; email: string; city: string; brandColor: string;
  banner: { text: string; tone: string } | null;
  customers: Array<[string, string, Gender, AgeGroup]>;
  /** [customerIdx, memberIdx (0 = self, 1.. = family), garment, charges, advance, daysAhead, target status, change measurement?] */
  orders: Array<[number, number, string, string, string | null, number, OrderStatus | "OVERDUE", boolean?]>;
  family: Array<[number, string, string, Gender, AgeGroup]>;
}

const SPECS: Spec[] = [
  {
    name: "Rangoli Boutique", owner: "Anita Rao", email: "owner@rangoli.demo.test", city: "Bengaluru",
    brandColor: "#7c2d5b", banner: { text: "Festive season: book Diwali stitching before 20 Oct", tone: "promo" },
    customers: [
      ["Priya Nair", "9886000001", "FEMALE", "ADULT"], ["Sunita Gowda", "9886000002", "FEMALE", "ADULT"],
      ["Meera Iyer", "9886000003", "FEMALE", "ADULT"], ["Lakshmi Reddy", "9886000004", "FEMALE", "SENIOR"],
      ["Divya Shetty", "9886000005", "FEMALE", "ADULT"], ["Kavya Hegde", "9886000006", "FEMALE", "TEEN"],
      ["Ananya Bhat", "9886000007", "FEMALE", "ADULT"], ["Rekha Murthy", "9886000008", "FEMALE", "ADULT"],
    ],
    family: [[0, "Aarav Nair", "Son", "MALE", "KID"], [0, "Rohit Nair", "Spouse", "MALE", "ADULT"], [1, "Ishita Gowda", "Daughter", "FEMALE", "KID"]],
    orders: [
      [0, 0, "kurti", "1800", "800", 6, "STITCHING"],
      [0, 0, "kurti", "2000", "500", 9, "ORDER_RECEIVED"],
      [0, 0, "kurti", "2200", "1000", 12, "CUTTING", true],
      [0, 1, "kurta_pyjama", "1500", "500", 12, "STITCHING"],
      [1, 0, "lehenga", "14500", "7000", 20, "STITCHING"],
      [1, 1, "frock", "1200", "1200", 5, "READY"],
      [2, 0, "blouse", "900", "300", 3, "TRIAL"],
      [3, 0, "salwar_suit", "2600", "1000", 4, "ALTERATION"],
      [4, 0, "blouse", "850", "850", 0, "READY"],
      [5, 0, "kurti", "1400", "400", 2, "OVERDUE"],
      [6, 0, "blouse", "900", "900", 14, "DELIVERED"],
      [7, 0, "lehenga", "9800", "3000", 1, "MEASUREMENT"],
    ],
  },
  {
    name: "Stitch & Style Tailors", owner: "Imran Khan", email: "owner@stitchstyle.demo.test", city: "Bengaluru",
    brandColor: "#0f766e", banner: { text: "Free alterations within 7 days of delivery", tone: "info" },
    customers: [
      ["Rahul Verma", "9900000001", "MALE", "ADULT"], ["Farah Siddiqui", "9900000002", "FEMALE", "ADULT"],
      ["Arjun Menon", "9900000003", "MALE", "ADULT"], ["Zainab Ali", "9900000004", "FEMALE", "ADULT"],
      ["Karthik Rao", "9900000005", "MALE", "TEEN"], ["Nazia Begum", "9900000006", "FEMALE", "SENIOR"],
      ["Vikram Joshi", "9900000007", "MALE", "ADULT"], ["Sana Pasha", "9900000008", "FEMALE", "ADULT"],
    ],
    family: [[1, "Imaad Siddiqui", "Son", "MALE", "KID"], [0, "Neha Verma", "Spouse", "FEMALE", "ADULT"]],
    orders: [
      [0, 0, "shirt", "1100", "500", 7, "STITCHING"],
      [0, 0, "shirt", "1200", "500", 9, "ORDER_RECEIVED"],
      [0, 0, "shirt", "1300", "600", 10, "CUTTING", true],
      [0, 0, "trouser", "1000", "400", 8, "CUTTING"],
      [2, 0, "sherwani", "18500", "9000", 18, "STITCHING"],
      [1, 1, "kurta_pyjama", "1100", "1100", 4, "READY"],
      [3, 0, "salwar_suit", "2200", "800", 3, "TRIAL"],
      [4, 0, "shirt", "950", "300", 2, "OVERDUE"],
      [6, 0, "trouser", "1050", "1050", 12, "DELIVERED"],
    ],
  },
];

async function ensureUser(email: string, name: string, password: string, platform: boolean) {
  const found = await prisma.user.findUnique({ where: { email } });
  if (found) return found;
  return prisma.user.create({ data: { email, name, passwordHash: await hashPassword(password), isPlatformAdmin: platform } });
}

async function seedTenant(spec: Spec) {
  let ownerUser = await prisma.user.findUnique({ where: { email: spec.email } });
  if (!ownerUser) {
    await provisionTenant({ businessName: spec.name, ownerName: spec.owner, email: spec.email, password: PASSWORD, city: spec.city });
    ownerUser = await prisma.user.findUniqueOrThrow({ where: { email: spec.email } });
    console.log(`created ${spec.name}`);
  }
  const membership = await prisma.membership.findFirstOrThrow({ where: { userId: ownerUser.id } });
  const ctx: AuthContext = await loadContext({ userId: ownerUser.id, membershipId: membership.id });
  const slug = spec.email.split("@")[1]!.split(".")[0]!;

  await prisma.tenant.update({
    where: { id: ctx.tenantId },
    data: { brandColor: spec.brandColor, bannerEnabled: !!spec.banner, bannerText: spec.banner?.text ?? null, bannerTone: spec.banner?.tone ?? "info", city: spec.city, phone: "+919800000000" },
  });

  const studio = (await prisma.branch.findFirst({ where: { tenantId: ctx.tenantId, code: "STU" } })) ?? (await createBranch(ctx, { name: `${spec.city} Studio`, code: "STU", city: spec.city }));
  const staff: Array<[string, string, "MANAGER" | "SALES" | "TAILOR" | "CASHIER", boolean]> = [
    [`manager.${slug}@demo.test`, "Manager", "MANAGER", true],
    [`sales.${slug}@demo.test`, "Sales (studio only)", "SALES", false],
    [`tailor1.${slug}@demo.test`, "Ramesh (Tailor)", "TAILOR", true],
    [`tailor2.${slug}@demo.test`, "Salma (Tailor)", "TAILOR", true],
    [`cashier.${slug}@demo.test`, "Cashier", "CASHIER", true],
  ];
  for (const [email, name, role, all] of staff) {
    if (await prisma.user.findUnique({ where: { email } })) continue;
    await createMember(ctx, { name, email, password: PASSWORD, role, allBranches: all, branchIds: all ? [] : [studio.id] });
  }

  // Customers (+ Self member), then family members
  const custIds: string[] = [];
  const selfIds: string[] = [];
  const main = await prisma.branch.findFirstOrThrow({ where: { tenantId: ctx.tenantId, code: "MAIN" } });
  for (const [i, [name, phone, gender, ageGroup]] of spec.customers.entries()) {
    const existing = (await listCustomers(ctx, { q: phone }))[0];
    const c = existing ?? (await createCustomer(ctx, { name, phone: phone as never, gender, ageGroup, branchId: i % 3 === 2 ? studio.id : main.id, preferredLanguage: (["en", "hi", "kn", "ur"] as const)[i % 4]! }));
    let fam = await listFamily(ctx, c.id);
    if (!fam.some((m) => m.isSelf)) {
      await addFamilyMember(ctx, c.id, { name, relation: "Self", gender, ageGroup });
      fam = await listFamily(ctx, c.id);
    }
    custIds.push(c.id);
    selfIds.push(fam.find((m) => m.isSelf)!.id);
  }
  const memberOf = new Map<number, string[]>();
  for (const [ci, name, relation, gender, ageGroup] of spec.family) {
    const fam = await listFamily(ctx, custIds[ci]!);
    const m = fam.find((x) => x.name === name) ?? (await addFamilyMember(ctx, custIds[ci]!, { name, relation: relation as never, gender, ageGroup }));
    memberOf.set(ci, [...(memberOf.get(ci) ?? []), m.id]);
  }

  if ((await prisma.order.count({ where: { tenantId: ctx.tenantId } })) > 0) return console.log(`orders exist for ${spec.name}, skipping`);

  const tailors = await prisma.membership.findMany({ where: { tenantId: ctx.tenantId, role: { key: "TAILOR" } } });
  const chain: Record<string, OrderStatus[]> = {
    ORDER_RECEIVED: [], MEASUREMENT: ["MEASUREMENT"], CUTTING: ["MEASUREMENT", "CUTTING"],
    STITCHING: ["MEASUREMENT", "CUTTING", "STITCHING"], TRIAL: ["MEASUREMENT", "CUTTING", "STITCHING", "TRIAL"],
    ALTERATION: ["MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "ALTERATION"],
    READY: ["MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "READY"],
    DELIVERED: ["MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "READY", "DELIVERED"],
    OVERDUE: ["MEASUREMENT", "CUTTING", "STITCHING"],
  };

  let n = 0;
  for (const [ci, mi, garment, charges, advance, days, target, change] of spec.orders) {
    const memberId = mi === 0 ? selfIds[ci]! : memberOf.get(ci)![mi - 1]!;
    const base = M[garment]!;
    const values = change ? { ...base, ...(base.bust ? { bust: base.bust + 2 } : { chest: (base.chest ?? 100) + 2 }) } : base;
    const date = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    const o = await createOrder(ctx, {
      customerId: custIds[ci]!, familyMemberId: memberId, garment, promisedDate: date, charges: charges as never,
      assignedMembershipId: n % 4 === 3 ? undefined : tailors[n % tailors.length]?.id,
      advance: advance ? { amount: advance as never, method: (["UPI", "CASH", "CARD"] as const)[n % 3]! } : undefined,
      // First order of a person+garment records measurements; "ORDER_RECEIVED" ones stay without, others reuse/modify.
      measurement: target === "ORDER_RECEIVED" && !change ? undefined : { values, notes: change ? "Loosened slightly after trial" : undefined },
      description: ["Boat neck, back tie", "Mandarin collar", "Contrast piping", "Lining and can-can", "Standard"][n % 5],
    });
    if (target === "DELIVERED" || target === "READY" && advance === charges) {
      const paid = advance === charges;
      if (target === "DELIVERED" && !paid) await addPayment(ctx, o.id, { amount: String(Number(charges) - Number(advance ?? 0)) as never, method: "UPI" });
    }
    for (const step of chain[target]!) await transitionOrder(ctx, o.id, step, step === "DELIVERED" ? "Handed over to customer" : undefined);
    if (target === "OVERDUE" || target === "DELIVERED") {
      // Back-date the promise so the dashboard shows overdue work / realistic history.
      const shift = target === "OVERDUE" ? -3 : -2;
      await prisma.order.update({ where: { id: o.id }, data: { promisedDate: new Date(Date.now() + shift * 86_400_000) } });
    }
    n++;
  }
  console.log(`seeded ${spec.name}: ${n} orders`);
}

async function main() {
  await syncAllTenantRoles();
  for (const spec of SPECS) await seedTenant(spec);
  await ensureUser(ADMIN_EMAIL, "Platform Admin", ADMIN_PASSWORD, true);
  console.log("\nLogins");
  console.log(`  Tenant users (password ${PASSWORD}): owner@rangoli.demo.test, owner@stitchstyle.demo.test, manager.<shop>@demo.test, sales.<shop>@demo.test, tailor1.<shop>@demo.test, cashier.<shop>@demo.test`);
  console.log(`  Super Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
