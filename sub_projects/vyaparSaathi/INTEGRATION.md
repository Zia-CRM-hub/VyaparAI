# Integration with VyaparAI

VyaparSaathi is standalone today. This maps its parts to VyaparAI domains and phases. The registry entry is in `src/lib/sub-projects.ts`.

| Saathi piece | VyaparAI domain | Phase | How |
|---|---|---|---|
| `BusinessProfile` | Tenants / Settings | 2 | Build from the tenant record plus a few new settings (state, GST scheme, Udyam, shop licence). Language from tenant branding or user preference. |
| `annualTurnoverInr` | Payments | 3 | Aggregate of payments, trailing 12 months. Never asked from the owner. |
| `employees` | Identity / Team | 2 | Count of active staff users. |
| Reminders and Done/Snooze | Notifications | 3 | New tables: `ComplianceTask` (tenant, obligationId, period, status, doneAt, evidenceDocId) scoped by `tenantId` and audited like other writes. |
| Channel posts | Notifications page | 3 | Render `ChannelPost` as feed cards; reuse the notifications list. |
| WhatsApp transport | Notifications | 4 | Worker that sends templates and receives button taps; consent stored with timestamp. |
| DPDP consent | Customers | 2 | Consent checkbox and WhatsApp YES recorded on the customer; one-tap data deletion for measurements. |
| Document locker | Documents | 3 | Certificates (GST, Udyam, licences) with expiry reminders. |
| Rule catalogue | Platform admin | 4 | Super admin screen to view rules and review status. Rules stay in code or a versioned JSON, not tenant-editable. |

## Rules for integration

1. The rule engine stays pure TypeScript with no I/O. The root app imports it as a package (or copies it) and supplies the profile and clock.
2. Tenant data never leaves the tenant. Rule text is global; reminders and tasks are per tenant.
3. Draft rules must not be shown to real tenants. Enforce `reviewStatus === "reviewed"` at the call site first.
4. Nothing is filed on the trader's behalf from this project.
