# MeasureMate to VyaparAI: feature map

MeasureMate and VyaparAI are separate codebases on different stacks. This map says which MeasureMate capability feeds which VyaparAI domain, what is reusable as-is, and what must be re-implemented.

| MeasureMate feature | Where it lives here | VyaparAI domain | VyaparAI phase | Approach |
|---|---|---|---|---|
| Sign-up, tenants, branches, team, roles | `apps/api/src/modules/{auth,tenant}` | Identity / Tenants / Branches | 1 (done) | Already re-implemented in VyaparAI (Auth.js, `tenantDb`, RBAC). No port needed |
| Customers and households, fuzzy search (`pg_trgm`) | `modules/customers` | Customers | 2 | Re-implement on Prisma in Next.js; reuse the household model and search approach |
| Measurement templates with immutable revisions | `modules/measurements`, `system-templates.ts` | Measurements | 2 | Port the **system template definitions** (data) and revision rules; rebuild service layer |
| Unit conversion (cm/in) | `packages/validation/src/units.ts` | Measurements | 2 | Copy as-is (pure TS, no framework) |
| Money maths | `packages/validation/src/money.ts` | Payments / Quotes | 3 | Review, then copy (VyaparAI requires Decimal, never floats) |
| Order workflow and transition rules | `packages/validation/src/{workflow,orders}.ts`, `modules/orders` | Orders / Production | 3-4 | Copy the transition table; map to VyaparAI statuses (Draft to Delivered) |
| Append-only order status history | `modules/orders` | Orders / Audit | 3 | Re-implement with VyaparAI audit conventions |
| Permissions matrix | `packages/validation/src/permissions.ts` | RBAC | 1 (done) | Compare against `src/server/rbac.ts` when adding order/measurement permissions |
| Platform admin, plans, entitlements | `modules/platform` | Subscription / Admin | 8 | Reference design |
| Postgres Row-Level Security | Prisma migrations | Tenancy | 9 | Reference for adding RLS as defense in depth |
| Manuals (user, admin, super-admin, backup, deployment) | `docs/` | Docs | all | Reuse as the base for VyaparAI manuals |

## Not in MeasureMate (VyaparAI must build)

Quotes and approvals, payments (Razorpay), GST invoicing, inventory and suppliers, WhatsApp, Vyapar Copilot, fittings/QC, localization (hi, kn, ur), PWA offline.

## Known differences to resolve before porting

- **Auth:** MeasureMate uses its own NestJS auth; VyaparAI uses Auth.js with identity re-derived per request.
- **Tenancy:** MeasureMate relies on Postgres RLS; VyaparAI scopes in the Prisma client (`tenantDb`). Different guarantees; port tests, not code.
- **Order statuses:** MeasureMate's workflow differs from the VyaparAI spec (Draft, Confirmed, Awaiting Advance, Material Pending, Ready, Production, Fitting, Alteration, QC, Ready for Delivery, Delivered). Map explicitly in Phase 3.
- **Data:** no shared database. Any migration of real MeasureMate tenants needs a one-off import script (not written).

## Connection today

- Listed in the VyaparAI app at `/sub-projects`, with the feature map and phase for each capability.
- No runtime coupling: no shared DB, login or API calls yet.
