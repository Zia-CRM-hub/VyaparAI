# Architecture

Document control: version 0.3.0, 2026-11-24. History in [CHANGELOG.md](../CHANGELOG.md); full detail in [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md); other docs in [README.md](README.md).

```
Browser --> Next.js App Router (pages + /api routes)
              |  secured() wrapper: same-origin, JSON, rate limit, loadContext (DB-derived identity), assertCan
              v
        src/server/services/*  (domain logic, audit events)
              |  tenantDb(tenantId): forced tenant scoping
              v
        PostgreSQL (composite same-tenant FKs, append-only triggers)

Super Admin --> loadPlatformContext --> unscoped client, aggregates only
```

## Phase 0 assessment (history)

## Phase 0 assessment

The `VyaparAI` folder was empty: there was **no React prototype** to preserve. Phase 1 was built greenfield (decision confirmed with the owner). The sibling `measureMate` project (NestJS) was reviewed but not reused.

## Decisions

| Area | Decision | Why |
|---|---|---|
| Shape | Modular monolith: Next.js 15 App Router, strict TS | One deployable; domains live in `src/server/services/*` |
| DB | PostgreSQL + Prisma 6, UUID keys, `timestamptz` | Required stack; composite FKs enforce same-tenant references |
| Auth | Auth.js v5 Credentials, JWT cookie, bcrypt (12 rounds) | JWT carries only `userId` + `membershipId` |
| Identity | **Re-derived from DB every request** (`server/context.ts`) | Disabled users, suspended tenants and role changes apply immediately; tenant can never come from the client |
| Tenancy | `tenantDb(tenantId)` Prisma extension forces `tenantId` on every read/write of tenant-owned models; foreign `tenantId` throws | One choke point, tested |
| RBAC | Permission catalogue in code, synced to `Permission`/`Role`/`RolePermission`; 7 system roles per tenant; branch scoping via `allBranches` + `MembershipBranch` | Least privilege; only owners can mint owners |
| Audit | `AuditEvent` append-only, enforced by a DB trigger; sensitive keys redacted | Tamper resistance |
| CSRF/abuse | Same-origin + JSON-only on mutating APIs, SameSite cookies, rate limits (login, signup, per-user API), lockout after 5 failures | |
| Headers | nosniff, frame deny, HSTS, referrer and permissions policy | |

## Entities (migrations `0001_init`, `0002_audit_append_only`)

Tenant, Branch, User, Permission, Role, RolePermission, Membership, MembershipBranch, Customer, Consent, AuditEvent, Subscription, FeatureEntitlement.

## Rules for feature code

1. Import `prisma` only for identity/bootstrap code. Everything tenant-owned uses `tenantDb(ctx.tenantId)`.
2. No raw SQL in features (it bypasses scoping).
3. Nested `connect` ids must be verified through the scoped client first (see `createMember`).
4. Every mutation records an audit event and checks `assertCan`.

## Phase 2-4 slice (migration `0003_orders_family_branding`)

- **Entities added:** FamilyMember, MeasurementSet (immutable versions), Order, OrderStatusHistory (append-only), Payment; tenant branding fields on Tenant.
- **Journey:** `/orders/new` is one screen: customer (search or quick-add) -> family member -> garment -> measurements -> order details -> advance. Gender + age group + garment resolve a default template (`src/lib/measurements.ts`); the person's latest saved version is prefilled; changing a value saves a new version; each order stores the exact version used.
- **Pipeline:** Order received, Measurement, Cutting, Stitching, Trial, Alteration, Ready, Delivered (Cancelled). Cutting needs measurements; delivery needs a zero balance; compare-and-set prevents double advances; tailors see only their own jobs.
- **Money:** `Decimal(12,2)` in the DB, integer paise in code, payment idempotency keys, row lock against overpayment.
- **Branding:** per-tenant name, logo (PNG/JPEG/WebP only, magic-byte checked, 150 KB), theme colour (CSS variable), configurable top banner.
- **Super Admin:** `/admin` overview, businesses list and detail, suspend/reactivate (audited, takes effect immediately). Shows aggregates and staff only, never customer personal data or measurements.
- **Notifications:** computed live from orders (overdue, due soon, balance at ready, trials); no push/WhatsApp yet.

## Mocked / not yet built

- Rate limiting is in-memory (single instance). Redis store is Phase 9 hardening.
- No email verification, password reset or MFA. Adding an existing user to a second tenant needs an invite flow.
- No Postgres Row-Level Security yet (application scoping + composite FKs only); planned as defense in depth.
- Customer UI is minimal (list/add). Consent ledger table exists, no UI/API yet.
- No PWA service worker (manifest only), no i18n (English only), no Playwright e2e yet (`scripts/smoke.ts` covers login).
- Subscription/entitlements: trial plan with branch/user limits enforced; no billing or admin console.

## Remaining phases (not built)

5. Inventory, suppliers, purchase orders, material reservation.
6. Quotations and customer approval, GST-ready invoices, PDF quote/receipt/invoice, Razorpay, refunds.
7. WhatsApp (consent, templates, webhooks, retries; mock provider).
8. Vyapar Copilot (provider-neutral AI adapter, structured JSON, human confirmation).
9. SaaS plans and billing, Redis rate limiting, RLS, Sentry/OpenTelemetry, Playwright, i18n, PWA service worker, DPDP export/erasure.

## Earlier backlog

1. Customer CRM: search, edit, households, consent capture UI and API, DPDP export/correction/erasure workflows.
2. Measurement templates (blouse, kurti, salwar, lehenga, gown, shirt, trouser, suit, kurta, sherwani), profiles, immutable versions, attachments.
3. Invite flow, password reset, email verification, MFA for owners.
4. Appointments.
5. i18n scaffolding (en, hi, kn, ur incl. RTL) and PWA service worker.
6. Playwright e2e and Postgres RLS as defense in depth.
7. Redis-backed rate limiting; OpenTelemetry/Sentry wiring.
