# VyaparAI

AI Operating System for boutiques and tailoring businesses (India / Bengaluru first). Multi-tenant SaaS, modular monolith.

**Status: Phase 0 + 1 complete** (foundation). Customers, measurements, orders, payments, production, WhatsApp and the Copilot are later phases; see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for what is built, mocked and planned.

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

Demo logins (password from `SEED_OWNER_PASSWORD`, default `ChangeMe!12345`):

| User | Role |
|---|---|
| owner@rangoli.demo.test | Owner of Rangoli Boutique |
| manager.rangoli@demo.test | Manager |
| sales.rangoli@demo.test | Sales, studio branch only |
| owner@stitchstyle.demo.test | Owner of a second tenant (isolation demo) |

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
