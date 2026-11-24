# Rule review and upkeep

The value of VyaparSaathi is only as good as the correctness of its rules. A wrong due date costs a trader a late fee.

## Current state

All 15 rules in [src/rules/index.ts](../src/rules/index.ts) are **`draft-needs-ca-review`**. They were written from general knowledge of Indian compliance, not signed off by a professional. Treat every threshold and due date as unverified. Some are known to vary (QRMP date by state, professional tax slabs, trade licence cycle, FSSAI renewal) and are flagged in `penaltyNote`.

## Rule record

Each rule carries: `source` (Act, section or notification), `reviewStatus`, `lastCheckedOn`, `portal`, a `penaltyNote` and per-language text. Only a rule with `reviewStatus: "reviewed"` may be sent to a real trader. (Enforcement of this gate is a Phase 1 task; today the demo prints drafts.)

## Review process

1. **Initial review.** A partner Chartered Accountant goes rule by rule against the official sources, edits the catalogue (or a review sheet exported from it), and sets `reviewed` with their name and date.
2. **Change watch.** Subscribe to CBIC, GST Council, CBDT, MSME and state labour department notifications. Any change opens a ticket within 2 business days and the affected rule goes back to `draft-needs-ca-review` until re-checked.
3. **Quarterly sweep.** Re-verify every rule's `lastCheckedOn`, regardless of news.
4. **Translation review.** A native speaker reviews each language. Legal terms stay in English in brackets where portals use them.
5. **Tests.** Every threshold and date rule has a unit test with named dates (see [tests/engine.test.ts](../tests/engine.test.ts)), so a change is visible in review.

## Not covered, on purpose

Tax computation, rate lookup, classification of goods and services, litigation, notices from tax officers. For these the product hands over to a human CA.
