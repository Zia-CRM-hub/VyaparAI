/** Registry of sub-projects under the VyaparAI vision. Keep in sync with sub_projects/README.md. */
export type FeatureStatus = "done-in-core" | "planned" | "reference";

export interface SubProjectFeature {
  name: string;
  vyaparDomain: string;
  phase: number;
  status: FeatureStatus;
  note: string;
}

export interface SubProject {
  slug: string;
  name: string;
  folder: string;
  summary: string;
  stack: string;
  status: string;
  features: SubProjectFeature[];
}

export const SUB_PROJECTS: SubProject[] = [
  {
    slug: "measuremate",
    name: "MeasureMate",
    folder: "sub_projects/measureMate",
    summary: "Boutique and tailoring management: customers, versioned measurements, orders and production workflow.",
    stack: "NestJS, Next.js, Prisma, PostgreSQL RLS",
    status: "Imported snapshot, runs standalone (no shared DB or login yet)",
    features: [
      { name: "Sign-up, tenants, branches, team, roles", vyaparDomain: "Identity / Tenants", phase: 1, status: "done-in-core", note: "Re-implemented in VyaparAI" },
      { name: "Customers and households, fuzzy search", vyaparDomain: "Customers", phase: 2, status: "planned", note: "Reuse household model and search approach" },
      { name: "Measurement templates, immutable revisions", vyaparDomain: "Measurements", phase: 2, status: "planned", note: "Port system templates and revision rules" },
      { name: "Unit conversion (cm/in)", vyaparDomain: "Measurements", phase: 2, status: "planned", note: "Pure TS, copy as-is" },
      { name: "Money maths", vyaparDomain: "Payments / Quotes", phase: 3, status: "planned", note: "Review for Decimal-only rule, then copy" },
      { name: "Order workflow and status history", vyaparDomain: "Orders / Production", phase: 3, status: "planned", note: "Map to VyaparAI order statuses" },
      { name: "Plans, entitlements, platform admin", vyaparDomain: "Subscription / Admin", phase: 8, status: "reference", note: "Reference design" },
      { name: "Postgres Row-Level Security", vyaparDomain: "Tenancy", phase: 9, status: "reference", note: "Defense in depth" },
    ],
  },
  {
    slug: "vyaparsaathi",
    name: "VyaparSaathi",
    folder: "sub_projects/vyaparSaathi",
    summary: "WhatsApp-channel style compliance companion for small traders, vendors, service providers and tailors without a legal or finance consultant.",
    stack: "TypeScript rule engine, WhatsApp Business Platform (planned)",
    status: "Foundation: draft rule catalogue, engine and channel posts. Rules need CA review before real use",
    features: [
      { name: "Compliance rule catalogue (GST, income tax, Udyam, shops act, FSSAI, DPDP)", vyaparDomain: "Notifications", phase: 3, status: "planned", note: "Draft rules; CA review gate first" },
      { name: "Reminders with Done / Snooze tracking", vyaparDomain: "Notifications", phase: 3, status: "planned", note: "New ComplianceTask table, tenant-scoped" },
      { name: "Turnover gauge against the GST limit", vyaparDomain: "Payments", phase: 3, status: "planned", note: "Computed from VyaparAI payments, never typed" },
      { name: "DPDP consent and measurement deletion", vyaparDomain: "Customers", phase: 2, status: "planned", note: "Consent on customer record" },
      { name: "WhatsApp delivery with interactive buttons", vyaparDomain: "Notifications", phase: 4, status: "planned", note: "Business Platform, approved templates" },
    ],
  },
];
