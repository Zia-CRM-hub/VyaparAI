# Tailor pack

Tailors, alteration shops and boutiques are VyaparAI's first customers, so this is the first vertical pack of VyaparSaathi. It adds what is specific to tailoring on top of the generic catalogue.

## Where tailors differ

| Topic | Why it matters for a tailor | Status in catalogue |
|---|---|---|
| **GST on services vs goods** | Stitching a customer's own cloth is a service (job work); selling a ready-made garment is a sale of goods. Rates and thresholds can differ, so the same shop may touch both limits. | Registration limit handled (services Rs 20 lakh, goods Rs 40 lakh, lower in special-category states). **Rates not encoded**: need CA input. |
| **Composition scheme** | Often fits a small boutique selling goods; service-only providers have different rules. | CMP-08 and GSTR-4 reminders present. Eligibility check to add. |
| **Customer measurements are personal data** | Body measurements, phone numbers and photos of customers (often women and children) are sensitive in practice. | `dpdp-consent` rule present. Consent capture is a product feature in VyaparAI (see below). |
| **Staff** | Master tailors, cutters and helpers: ESI at 10 employees, EPF at 20, professional tax in states that levy it, minimum wages, state shops-act rules on hours. | ESI/EPF and professional tax present. Minimum-wage rule to add. |
| **Home-based and online sellers** | Many tailors work from home or sell through Instagram and WhatsApp. Trade licence and GST rules for online sale of goods differ. | Open question for CA. |
| **Seasonal spikes** | Wedding and festival seasons push turnover past thresholds quickly. | `gst-registration` nudges at 80% of the limit. A running-turnover tracker would be better (below). |

## Tying it into VyaparAI

VyaparAI already holds the data the compliance engine needs, so a tailor should **never** type their turnover:

1. **Turnover.** Sum of VyaparAI payments over the trailing 12 months and the current financial year feeds `annualTurnoverInr`. The 80% nudge becomes a live gauge on the dashboard ("Rs 17.2 lakh of your Rs 20 lakh GST limit").
2. **Staff count.** Active users with production roles feed `employees`.
3. **Invoices.** Orders and payments are the source for a GSTR-1 sales summary (export only, no filing).
4. **Consent.** The new-customer flow records DPDP consent (checkbox plus WhatsApp "YES" reply) against the customer. Measurement deletion on request is a one-tap action that anonymises the customer's measurement revisions while keeping order totals.
5. **Branding.** Posts and consent messages use the tenant's branding from Settings.

## Tailor onboarding variant

Same six questions, but the segment is preselected, the sales band is prefilled from VyaparAI, and the first digest says: "Your shop turned over Rs X this year. Here is what that means for GST."

## Open questions for the CA reviewer

1. Current GST rates for stitching (job work) vs ready-made garments, and any price-slab rules.
2. Whether a tailor selling both services and goods can use composition.
3. Treatment of advance payments received for orders (time of supply).
4. Home-based business: trade licence and shops-act applicability by city.
5. Minimum wage and working-hours rules for tailoring employment in Karnataka.
