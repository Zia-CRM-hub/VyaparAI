# Roadmap

Status as of 0.3.0 (2026-11-24).

| Phase | Scope | Status |
|---|---|---|
| 0 | Assessment, architecture | Done (0.1.0) |
| 1 | Tenancy, auth, RBAC, audit, customers, CI | Done (0.1.0) |
| 2-4 (first slice) | Family members, versioned measurements, orders, production, payments, delivery, branding, Super Admin | Done (0.3.0) |
| 5 | Inventory, suppliers, purchase orders, material reservation | Not built |
| 6 | Quotations and approval, GST-ready sequential invoices, PDF quote/receipt/invoice, Razorpay adapter, refunds | Not built |
| 7 | WhatsApp: consent, opt-out, templates, webhooks, retries, mock provider | Not built |
| 8 | Vyapar Copilot: provider-neutral AI adapter, structured JSON, human confirmation, usage logging | Not built |
| 9 | SaaS plans/billing, Redis rate limiting, Postgres RLS, Sentry/OpenTelemetry, Playwright, i18n (en/hi/kn/ur), PWA service worker, DPDP export/erasure | Not built |

## Backlog (not scheduled)
- Customer CRM extras: edit, households, consent capture UI/API, DPDP export/correction/erasure.
- Invite flow, password reset, email verification, MFA for owners.
- Appointments, measurement attachments.
- Dependency upgrades: Next 16, vitest 5 (clears current `npm audit` findings).

Each phase ships as its own minor release with tests, migration, docs and changelog entry ([RELEASE_PROCESS.md](RELEASE_PROCESS.md)).
