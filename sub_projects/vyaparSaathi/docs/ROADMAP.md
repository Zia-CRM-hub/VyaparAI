# Roadmap

| Phase | Outcome | Notes |
|---|---|---|
| **0. Foundation** (done) | Rule model, 15 draft rules, engine, post composer, tests, design docs | This folder |
| **1. Trust** | CA reviews and signs off the catalogue; `reviewed` gate enforced in the engine; Hindi and Kannada reviewed by native speakers | Blocker for any real user |
| **2. In-app feed** | `/saathi` page in VyaparAI: profile from existing data, reminders as cards, Done/Snooze, document locker | Tailors first; reuses VyaparAI auth, tenancy and audit |
| **3. WhatsApp** | Business Platform integration: opt-in, template approval, interactive buttons, webhook for taps, quiet hours | Needs a verified business account and approved templates |
| **4. Delivery quality** | Scheduler with per-trader timezone, snooze rules, delivery receipts, voice-note versions | |
| **5. Verticals** | Shop, vendor, service-provider and food packs; more languages | Each pack needs its own CA review |
| **6. Human help** | Optional paid hand-over to partner CAs; Q&A from the catalogue only | Needs commercial and liability terms |
| **7. Assisted filing** | Export GSTR-1 summaries and Udyam/GST pre-filled data; consider GSP partner for filing | Regulated; partner-led |

## Risks

- **Legal accuracy.** Mitigation: review gate, sources on every rule, disclaimers, no free-form legal answers.
- **WhatsApp policy and cost changes.** Mitigation: in-app feed as a first-class fallback; templates kept generic.
- **State variation.** Mitigation: state is a first-class profile field; unreviewed states fall back to a "check your state portal" post.
- **Scams around compliance.** Mitigation: say plainly what is free, link only to official domains.
