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
];
