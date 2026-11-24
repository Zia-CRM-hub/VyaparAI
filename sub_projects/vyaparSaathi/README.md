# VyaparSaathi

A compliance companion for India's small traders: shop owners, street and small vendors, service providers and tailors who cannot afford a legal or finance consultant. It tells them, in their own language, what the government expects from them and when, and walks them through each task in simple steps.

It works like a **WhatsApp channel**: short posts, one idea each, one tap to act. No dashboards to learn. The same posts also appear as a feed inside VyaparAI.

## What exists today

| Piece | Where | Status |
|---|---|---|
| Rule catalogue (GST, income tax, Udyam, shops act, trade licence, FSSAI, professional tax, ESI/EPF, DPDP) | [src/rules/index.ts](src/rules/index.ts) | 15 rules, **drafts awaiting CA review** |
| Rule engine: profile in, prioritised reminders out | [src/engine.ts](src/engine.ts) | Working, tested |
| Channel post composer (English, Hindi, Kannada) | [src/channel.ts](src/channel.ts) | Working, tested |
| Design docs | [docs/](docs/) | Written |
| WhatsApp transport, persistence, UI | n/a | Planned, see [docs/ROADMAP.md](docs/ROADMAP.md) |

## Important

Rules are **general guidance, not legal or tax advice**. Every rule ships as `draft-needs-ca-review` and carries a source and a `lastCheckedOn` date. Nothing should be shown to real traders until a Chartered Accountant has signed off the catalogue ([docs/RULE_REVIEW.md](docs/RULE_REVIEW.md)). Hindi and Kannada text is only translated for a few rules and needs native-speaker review.

## Run it

```bash
cd sub_projects/vyaparSaathi
pnpm install          # or npm install
pnpm test             # 7 tests
pnpm typecheck
AS_OF=2026-11-24 pnpm demo    # prints sample channel posts for a tailor
```

Standalone: no database, no network, no shared login with the root app.

## Docs

- [docs/VISION.md](docs/VISION.md): who it is for, principles, scope
- [docs/WHATSAPP_CHANNEL.md](docs/WHATSAPP_CHANNEL.md): the channel experience, message design, WhatsApp platform constraints
- [docs/TAILOR_PACK.md](docs/TAILOR_PACK.md): tailoring-specific compliance, tied to VyaparAI
- [docs/RULE_REVIEW.md](docs/RULE_REVIEW.md): how rules are reviewed, versioned and kept current
- [docs/ROADMAP.md](docs/ROADMAP.md): phased plan
- [INTEGRATION.md](INTEGRATION.md): how it plugs into VyaparAI
