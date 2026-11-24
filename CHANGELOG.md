# Changelog

All notable changes to VyaparAI are recorded here, newest first.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/) (`0.x` = pre-1.0, minor versions may change behaviour). The release procedure is in [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md).

## [Unreleased]

Planned, not built (see [docs/ROADMAP.md](docs/ROADMAP.md)): Phase 5 inventory/suppliers, Phase 6 quotations/GST invoices/Razorpay, Phase 7 WhatsApp, Phase 8 Copilot, Phase 9 SaaS billing and hardening.

### Added
- Documentation set: architecture, technical specification, roadmap, release process, and user manuals for Super Admin, Admin (owner/manager) and end users (`docs/`).

## [0.3.0] - 2026-11-24 - Tenant UX redesign, orders, branding, Super Admin

Migration: `0003_orders_family_branding`. Run `npx prisma migrate deploy` then `npm run db:seed` (the seed also syncs role permissions).

### Added
- Per-tenant branding: business name, phone, address, city, logo (PNG/JPEG/WebP, max 150 KB, magic-byte checked), theme colour (CSS variable), configurable top banner (enabled, text, tone).
- Family members under a customer, each with their own measurement history. A "Self" member is created with the customer when gender and age group are given.
- Measurements: code-defined templates by gender + age group + garment; adult-only fields hidden for baby/kid; immutable versions (`MeasurementSet`); unchanged values reuse the latest version; each order pins the exact version used.
- Orders with pipeline Order Received -> Measurement -> Cutting -> Stitching -> Trial -> Alteration -> Ready -> Delivered (plus Cancelled), promised date, assigned tailor, charges, advance, balance, payment status and delivery status. Append-only status history.
- Payments with idempotency keys, row lock against overpayment, balance-before-delivery rule.
- Single-screen order wizard (`/orders/new`) with deep links (`customerId`, `memberId`).
- Screens: dashboard cards, Orders (search/filters), Production board, Delivery, Payments, Notifications (computed live), Menu, Settings, Customer detail; mobile bottom navigation.
- Super Admin console (`/admin`): platform overview, business list/search, business detail, suspend/reactivate (audited, immediate effect). Aggregates and staff only, never customer personal data.
- New permissions: `measurement:read/write`, `order:read/write/advance`, `payment:write`. Cashier and tailor demo users. `npm run db:sync-roles`.
- Tests (60 total) for orders flow, branding and platform; smoke test extended to 23 checks.

### Changed
- Login permits a platform admin with no tenant membership; page guards redirect admins to `/admin`.
- Seed data now covers orders at every stage, overdue orders, payments and a measurement v1/reuse/v2 example.

### Security
- Tailors see only orders assigned to them; cutting blocked without measurements; delivery blocked with a balance due; status changes use compare-and-set.

### Known issues
- `npm audit` reports high/critical findings in dev/build tooling (vitest chain, Prisma CLI chain, postcss inside Next). Fixes require major upgrades (Next 16, vitest 5); scheduled, not applied.

## [0.2.0] - 2026-11-23 - Sub-projects and richer demo data

Commits `2f414c7`, `09cdee3`.

### Added
- `sub_projects/` registry with the MeasureMate snapshot and `INTEGRATION.md`; `/sub-projects` page and `src/lib/sub-projects.ts`.
- Richer demo seed (two tenants, staff, customers).

### Fixed
- Folder-name casing (`measureMate`) in docs and registry links.

## [0.1.0] - 2026-11-23 - Phase 0 + 1 foundation

Commit `f97e8d9`. Migrations `0001_init`, `0002_audit_append_only`.

### Added
- Next.js 15 / React 19 / strict TypeScript modular monolith; PostgreSQL + Prisma 6.
- Multi-tenancy: `tenantDb` scoped client, composite same-tenant foreign keys, tenant context re-derived from the DB each request.
- Auth.js v5 credentials login, bcrypt, lockout after 5 failures, rate limits, CSRF defence, security headers.
- RBAC: permission catalogue, 7 system roles per tenant, branch scoping.
- Append-only audit trail (DB trigger), sensitive-key redaction.
- Customers, branches, team, signup with trial subscription and entitlements.
- Embedded PostgreSQL for local dev and tests, Vitest suites, smoke test, Dockerfile, docker-compose, GitHub Actions CI.

[Unreleased]: https://github.com/Zia-CRM-hub/VyaparAI/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Zia-CRM-hub/VyaparAI/releases/tag/v0.3.0
[0.2.0]: https://github.com/Zia-CRM-hub/VyaparAI/releases/tag/v0.2.0
[0.1.0]: https://github.com/Zia-CRM-hub/VyaparAI/releases/tag/v0.1.0
