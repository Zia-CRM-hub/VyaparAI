# VyaparAI

AI Operating System for boutiques and tailoring businesses (India / Bengaluru first). Multi-tenant SaaS, modular monolith.

**Status:** Phases 0-1 done, plus the first slice of Phases 2-4 (customers, family members, versioned measurements, orders, production, payments, delivery) and Super Admin. Inventory/suppliers, quotations and GST invoices, WhatsApp, the Copilot, SaaS billing and the final hardening pass are **not built yet**; see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**Version 0.3.0.** Docs: [docs/README.md](docs/README.md) (architecture, technical spec, manuals for Super Admin / Admin / users). Every revision is logged in [CHANGELOG.md](CHANGELOG.md); the process is in [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md).

## Run locally (Windows/macOS/Linux, no Docker needed)

Requires Node 20+.

```bash
npm install
cp .env.example .env          # then set AUTH_SECRET (openssl rand -base64 32)

# terminal 1: local PostgreSQL on :5432 (embedded, data in .pgdata)
npm run db:local

# terminal 2
npx prisma migrate deploy
npm run db:seed               # two demo tenants
npm run dev                   # http://localhost:3000
```

Or with Docker: `docker compose up -d db redis`, then the same `migrate deploy` / `db:seed` / `dev` steps.

Demo logins (password `ChangeMe!12345`, override with `SEED_OWNER_PASSWORD`):

| User | Role |
|---|---|
| owner@rangoli.demo.test | Owner, Rangoli Boutique (purple theme, promo banner) |
| owner@stitchstyle.demo.test | Owner, Stitch & Style Tailors (teal theme): separate tenant |
| manager.rangoli@demo.test, sales.rangoli@demo.test (studio only), tailor1.rangoli@demo.test, cashier.rangoli@demo.test | Staff roles (same pattern for `stitchstyle`) |
| admin@vyaparai.demo.test / `PlatformAdmin!2345` | Super Admin (`/admin`), no tenant |

After upgrading an existing database run `npx prisma migrate deploy` then `npm run db:seed` (it also syncs role permissions; `npm run db:sync-roles` does only that).

## Quality gates

```bash
npm run lint && npm run typecheck && npm test && npm run build
npx tsx scripts/smoke.ts      # end-to-end login against the production build
```

Tests need PostgreSQL. With no `DATABASE_URL` set they start a throwaway embedded Postgres automatically; CI uses a service container.

## Layout

```
prisma/        schema, migrations, seed
src/app/       Next.js routes: (auth) login/signup, (app) dashboard/customers/branches/team/audit, api/*
src/server/    tenant-db (scoping), context (session identity), rbac, audit, login, services/*
src/lib/       shared Zod schemas
tests/         tenant isolation, RBAC/auth/audit, HTTP API
```
