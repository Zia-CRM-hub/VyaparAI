# Sub-projects of the VyaparAI vision

Self-contained projects that feed the VyaparAI platform. Each lives in its own folder, keeps its own tooling, and is **excluded** from the root app's typecheck, lint and tests. The root app lists them at `/sub-projects` (registry: `src/lib/sub-projects.ts`).

| Folder | What | Stack | Status |
|---|---|---|---|
| [measuremate/](measuremate/) | MeasureMate: boutique/tailoring management (customers, versioned measurements, orders and production workflow) | NestJS 11, Next.js 15, Prisma 6, PostgreSQL RLS, pnpm | Imported snapshot, runs standalone. Features are mapped to VyaparAI phases in [measuremate/INTEGRATION.md](measuremate/INTEGRATION.md) |

## Adding a sub-project

1. Create `sub_projects/<name>/` (tracked files only: no `.env`, `node_modules`, build output, data dirs).
2. Add `INTEGRATION.md` mapping its features to VyaparAI domains and phases.
3. Add an entry to `src/lib/sub-projects.ts`.

## Provenance and drift

`measuremate/` is a snapshot of the `measureMate-orders` working copy (branch `feature/orders-production`, commit `8a4a034`, upstream https://github.com/Zia-CRM-hub/measureMate). It is **not** linked by git submodule, so changes upstream do not appear here automatically. Re-import deliberately when needed.

## Running MeasureMate on its own

```bash
cd sub_projects/measuremate
pnpm install && pnpm --filter @measuremate/validation build
pnpm --filter @measuremate/api db:local     # see its README for the remaining steps
```

It uses ports and a database of its own; it does not share VyaparAI's database or login.
