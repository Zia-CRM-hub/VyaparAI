# Release and revision process

Every change that reaches `main` is a **revision**; a tagged group of revisions is a **release**.

## Rules (every revision)

1. Add a line under `## [Unreleased]` in [CHANGELOG.md](../CHANGELOG.md) in the same commit as the change (Added / Changed / Deprecated / Removed / Fixed / Security).
2. If behaviour, schema, API or permissions changed, update the matching doc in the same commit (table below).
3. Schema changes ship as a new numbered migration in `prisma/migrations/`; never edit an applied migration.
4. Commit message: imperative summary, optional body. Reference the phase (for example `Phase 5: stock ledger`).
5. Gates must pass: `npm run lint && npm run typecheck && npm test && npm run build`, plus `npx tsx scripts/smoke.ts` for UI/auth changes.

| Change type | Update |
|---|---|
| Table, enum, constraint, trigger | `docs/TECHNICAL_SPEC.md` (data model), `docs/ARCHITECTURE.md` if structural |
| API route | `docs/TECHNICAL_SPEC.md` (API reference) |
| Permission or role | `docs/TECHNICAL_SPEC.md` (RBAC matrix), the three manuals |
| Screen or workflow | the affected manual in `docs/manuals/` |
| Phase completed | `docs/ROADMAP.md`, `README.md` status |

## Cutting a release

1. Pick the version: patch (fixes), minor (features or migrations), major (after 1.0, breaking changes).
2. In `CHANGELOG.md` rename `[Unreleased]` to `[x.y.z] - YYYY-MM-DD`, start a fresh `[Unreleased]`, list any migration and upgrade steps, and update the compare links at the bottom.
3. Set `"version"` in `package.json`; update "Document control" in each doc you touched.
4. Run all gates.
5. Commit: `Release x.y.z`. Tag: `git tag -a vx.y.z -m "VyaparAI x.y.z"`. Push the commit and tag.
6. Create the GitHub release from the tag, pasting the changelog section.

## Upgrading a deployment

```bash
npx prisma migrate deploy
npm run db:sync-roles   # only needed when permissions changed
```
Take a database backup first. Migrations are forward-only; to roll back, restore the backup and redeploy the previous tag.

## Version history

See [CHANGELOG.md](../CHANGELOG.md). Current: **0.3.0**.
