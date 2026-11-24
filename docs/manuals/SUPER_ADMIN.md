# Super Admin manual

For the VyaparAI platform operator. Version 0.3.0, 2026-11-24.

## What you can and cannot do

You manage the businesses (tenants) on the platform. You see **counts, totals, staff and status**. You never see customer names, phone numbers, measurements or order contents. That is by design, to protect each business's customers.

## Signing in

1. Open the app and go to **Sign in**.
2. Use the Super Admin account (demo: `admin@vyaparai.demo.test`). Change the demo password in any real deployment.
3. You land on `/admin`. If you open a business page such as `/dashboard` you are sent back to `/admin`.

## Platform overview (`/admin`)

Cards for total businesses, customers, orders, payments collected, and registrations by month (last 6 months). Use it to watch growth and activity.

## Businesses (`/admin/tenants`)

- Search by business name.
- Each row shows status, plan, registration date and usage counts.
- Select a row to open the business detail.

## Business detail (`/admin/tenants/[id]`)

Shows profile, subscription and plan limits, usage totals, and the staff list with roles.

### Suspend or reactivate a business
1. Open the business detail.
2. Press **Suspend** (or **Reactivate**) and confirm.
3. Effect is immediate: every user of that business is signed out of access on their next request. No data is deleted.
4. The action is written to that business's audit trail as `platform.tenant_suspended` / `platform.tenant_active` with your user.

Use suspension for non-payment, abuse or at the business's request.

## Good practice

- Keep the Super Admin account to a few named people; never share it.
- Do not use it for day-to-day shop work. Create a normal owner account for that.
- Report cross-tenant data you can see to engineering immediately; that would be a defect.

## Not yet available

Plan changes, billing, invoicing the businesses, impersonation and platform-wide announcements (planned for Phase 9, see [ROADMAP](../ROADMAP.md)).
