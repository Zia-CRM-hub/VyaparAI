# Technical specification

| | |
|---|---|
| Document control | Version 0.3.0, 2026-11-24. Update with every release ([RELEASE_PROCESS.md](RELEASE_PROCESS.md)) |
| Audience | Engineers, reviewers, operators |
| Related | [ARCHITECTURE.md](ARCHITECTURE.md), [CHANGELOG.md](../CHANGELOG.md) |

## 1. Stack

Next.js 15 (App Router, standalone output), React 19, strict TypeScript (`noUncheckedIndexedAccess`), Tailwind 3, Prisma 6, PostgreSQL, Auth.js v5 (credentials, JWT), Zod, Vitest 3. Node 20+.

## 2. Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | JWT signing secret (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | `true` behind a proxy |
| `SEED_OWNER_PASSWORD`, `SEED_ADMIN_PASSWORD` | Demo seed passwords (defaults in README; change outside local dev) |

See `.env.example`.

## 3. Data model

All tenant-owned tables carry `tenantId` and a `@@unique([tenantId, id])` key so child rows reference parents through composite foreign keys; a row can never point at another tenant's row.

| Group | Tables |
|---|---|
| Identity and access | Tenant, Branch, User, Membership, MembershipBranch, Permission, Role, RolePermission |
| Customers | Customer, FamilyMember, Consent |
| Measurements | MeasurementSet (immutable versions) |
| Orders and money | Order, OrderStatusHistory (append-only), Payment |
| Platform | AuditEvent (append-only), Subscription, FeatureEntitlement |

Key columns: Tenant branding (`phone`, `address`, `city`, `brandColor`, `logoDataUrl`, `bannerText`, `bannerEnabled`, `bannerTone`, `nextOrderNo`, `status`); User `isPlatformAdmin`; money `Decimal(12,2)`; all timestamps `timestamptz`; UUID keys.

Enums: Gender, AgeGroup (BABY, KID, TEEN, ADULT, ...), OrderStatus (ORDER_RECEIVED, MEASUREMENT, CUTTING, STITCHING, TRIAL, ALTERATION, READY, DELIVERED, CANCELLED), PaymentMethod.

Database-enforced rules: `AuditEvent` and `OrderStatusHistory` reject UPDATE/DELETE (trigger); `MeasurementSet` rejects UPDATE; check constraints `charges >= 0`, `amount > 0`.

Migrations: `0001_init`, `0002_audit_append_only`, `0003_orders_family_branding`.

## 4. Tenancy and identity

1. The JWT holds only `userId` and `membershipId`.
2. `loadContext` (`src/server/context.ts`) reloads user, membership, tenant status, role permissions and branch scope from the database on every request. Disabled users and suspended tenants lose access immediately; the tenant id never comes from the client.
3. `tenantDb(tenantId)` (`src/server/tenant-db.ts`) is a Prisma query extension that forces `tenantId` on reads/writes of every model in `TENANT_MODELS` and throws on a foreign `tenantId`.
4. Feature code rules: use `tenantDb` only (base `prisma` is for identity/bootstrap and verified transactions); no raw SQL in features; verify nested `connect` ids through the scoped client; every mutation calls `assertCan` and writes an audit event.
5. Platform admins (`isPlatformAdmin`, no membership) use `loadPlatformContext` and the unscoped client, exposing aggregates and staff only.

## 5. RBAC matrix

Permissions are defined in `src/server/rbac.ts` and synced to the database (`npm run db:sync-roles`).

| Permission | Owner | Manager | Sales | Meas. spec. | Prod. mgr | Tailor | Cashier |
|---|---|---|---|---|---|---|---|
| dashboard:read | Y | Y | Y | Y | Y | - | Y |
| branch:read | Y | Y | Y | Y | Y | Y | Y |
| branch:manage | Y | Y | - | - | - | - | - |
| user:read | Y | Y | - | - | Y | - | - |
| user:manage | Y | Y | - | - | - | - | - |
| customer:read | Y | Y | Y | Y | Y | - | Y |
| customer:write | Y | Y | Y | Y | - | - | - |
| customer:delete | Y | - | - | - | - | - | - |
| consent:write | Y | Y | Y | Y | - | - | - |
| audit:read | Y | Y | - | - | - | - | - |
| tenant:manage | Y | - | - | - | - | - | - |
| measurement:read | Y | Y | Y | Y | Y | Y | - |
| measurement:write | Y | Y | Y | Y | - | - | - |
| order:read | Y | Y | Y | Y | Y | Y | Y |
| order:write | Y | Y | Y | - | - | - | - |
| order:advance | Y | Y | - | - | Y | Y | - |
| payment:write | Y | Y | Y | - | - | - | Y |

Additional rules: only an Owner can assign the Owner role; users with limited branches see only those branches' data; a Tailor sees only orders assigned to them.

## 6. Business rules

**Measurements.** Template = f(gender, age group, garment) from `src/lib/measurements.ts`; adult-only fields are hidden for baby/kid. Saving identical values reuses the latest version; changed values create version N+1. An order references the exact `measurementSetId`; measurements are locked once cutting starts.

**Order pipeline.** ORDER_RECEIVED -> MEASUREMENT -> CUTTING -> STITCHING -> TRIAL -> ALTERATION -> READY -> DELIVERED; CANCELLED from open states. Allowed moves are in `src/lib/orders.ts` (`nextStatuses`). Transitions use compare-and-set (a stale click fails rather than double-advancing) and write an immutable history row. CUTTING requires a measurement; DELIVERED requires zero balance.

**Money.** Integer paise in code (`toPaise`/`fromPaise`), `Decimal(12,2)` in the database. `paymentSummary` returns charges, paid, balance and payment status. A payment is rejected if it exceeds the balance (checked under `FOR UPDATE` row lock). Each payment carries an idempotency key; a repeat returns the original.

**Branding.** Logo must be PNG/JPEG/WebP data URL, magic bytes match the declared type, at most 150 KB; SVG rejected. Colour is a hex value applied as the `--brand` CSS variable.

**Notifications.** Computed on request from orders: overdue, due soon, balance due at Ready, trials pending. No stored state, no push.

## 7. API reference

All mutating routes require same-origin, `application/json`, an authenticated session, and the permission shown. Responses are JSON; errors map to 400 (validation), 401, 403, 404, 409 (conflict), 429 (rate limit).

| Method and path | Permission | Purpose |
|---|---|---|
| GET `/api/health` | none | Liveness |
| POST `/api/signup` | none (5/hour/IP) | Create tenant + owner + trial |
| `/api/auth/*` | none | Auth.js sign-in/out/session |
| GET `/api/me` | session | Current identity and permissions |
| GET, POST `/api/customers` | customer:read / write | List/search, create |
| GET, PATCH, DELETE `/api/customers/[id]` | read / write / delete | Customer detail |
| GET, POST `/api/customers/[id]/family` | read / write | Family members |
| GET, POST `/api/family/[id]/measurements` | measurement:read / write | History, save version |
| GET, POST `/api/orders` | order:read / write | List with filters, create |
| GET, PATCH `/api/orders/[id]` | order:read / write | Detail, edit (charges, date, tailor) |
| POST `/api/orders/[id]/status` | order:advance | Pipeline transition |
| POST `/api/orders/[id]/payments` | payment:write | Record payment |
| POST `/api/orders/[id]/measurement` | measurement:write | Attach measurement version |
| GET `/api/notifications` | order:read | Live alerts |
| GET `/api/staff` | order:read | Assignable staff |
| GET, POST `/api/branches` | branch:read / manage | Branches |
| GET, POST `/api/team`; PATCH `/api/team/[id]` | user:read / manage | Team and roles |
| GET `/api/audit` | audit:read | Audit trail |
| GET, PUT `/api/settings/branding` | any / tenant:manage | Branding |
| PATCH `/api/admin/tenants/[id]/status` | platform admin | Suspend or reactivate |

## 8. Security controls

- bcrypt (12 rounds); lockout after 5 failed logins; login limits 30/min per IP and 10/min per email; API limit 120/min per user (in-memory store, single instance).
- CSRF: same-origin + JSON-only on mutating routes, SameSite cookies.
- Headers: nosniff, frame deny, HSTS, referrer and permissions policy.
- Audit events redact sensitive keys; platform actions are recorded against the target tenant.
- Super Admin sees no customer personal data or measurements (asserted in tests).

Known gaps: no email verification, password reset or MFA; no Postgres RLS; in-memory rate limiting. See [ROADMAP.md](ROADMAP.md).

## 9. Testing and quality gates

| Layer | Location |
|---|---|
| Tenant isolation (service + data) | `tests/tenant-isolation.test.ts` |
| RBAC, auth, audit | `tests/rbac-auth.test.ts` |
| HTTP routes | `tests/api-routes.test.ts` |
| Orders, measurements, payments | `tests/orders-flow.test.ts` |
| Branding, Super Admin | `tests/branding-platform.test.ts` |
| End-to-end on production build | `scripts/smoke.ts` (23 checks) |

Tests start a throwaway embedded PostgreSQL unless `DATABASE_URL` is set. CI (`.github/workflows/ci.yml`) runs lint, typecheck, test and build.

## 10. Deployment

`Dockerfile` builds the standalone server; `docker-compose.yml` provides PostgreSQL and Redis (Redis not yet used). Deploy: `prisma migrate deploy`, then start. Health check: `/api/health`.
