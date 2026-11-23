# Architecture (Phase 0 + 1)

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

## Mocked / not yet built

- Rate limiting is in-memory (single instance). Redis store is Phase 9 hardening.
- No email verification, password reset or MFA. Adding an existing user to a second tenant needs an invite flow.
- No Postgres Row-Level Security yet (application scoping + composite FKs only); planned as defense in depth.
- Customer UI is minimal (list/add). Consent ledger table exists, no UI/API yet.
- No PWA service worker (manifest only), no i18n (English only), no Playwright e2e yet (`scripts/smoke.ts` covers login).
- Subscription/entitlements: trial plan with branch/user limits enforced; no billing or admin console.

## Phase 2 backlog

1. Customer CRM: search, edit, households, consent capture UI and API, DPDP export/correction/erasure workflows.
2. Measurement templates (blouse, kurti, salwar, lehenga, gown, shirt, trouser, suit, kurta, sherwani), profiles, immutable versions, attachments.
3. Invite flow, password reset, email verification, MFA for owners.
4. Appointments.
5. i18n scaffolding (en, hi, kn, ur incl. RTL) and PWA service worker.
6. Playwright e2e and Postgres RLS as defense in depth.
7. Redis-backed rate limiting; OpenTelemetry/Sentry wiring.
