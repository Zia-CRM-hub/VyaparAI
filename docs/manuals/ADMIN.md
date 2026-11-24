# Admin manual (business Owner and Manager)

For the person who runs a boutique or tailoring shop on VyaparAI. Version 0.3.0, 2026-11-24.

Owner can do everything. Manager can do everything except business settings/branding (`tenant:manage`) and deleting customers, and cannot create another Owner.

## 1. Register your business

1. Open **Sign up**, enter business name, your name, email and a strong password (12+ characters).
2. A separate workspace is created for you with a trial plan and the seven standard roles. You are the Owner. Nobody outside your business can see your data.

## 2. Set up your profile and branding (Owner)

**Settings** (menu -> Settings):
- Business name, phone, address, city.
- **Logo**: PNG, JPEG or WebP, up to 150 KB (SVG is refused for safety).
- **Theme colour**: pick your brand colour; buttons and highlights follow it.
- **Top banner**: switch on, write the message (for example a festival offer), choose tone (info, promo, warning). Every staff member sees it at the top of every page. Switch off to hide.

## 3. Branches

**Branches**: add each shop location. The trial plan limits the number of branches.

## 4. Team and roles

**Team** -> add a member with name, email, temporary password, role and branches.

| Role | Typical use | Can |
|---|---|---|
| Owner | Proprietor | Everything |
| Manager | Shop manager | Customers, orders, payments, team, branches, audit |
| Sales | Front desk | Customers, measurements, create orders, take payments |
| Measurement Specialist | Master taking measurements | Customers, measurements, view orders |
| Production Manager | Workshop lead | Move orders through production, view team |
| Tailor / Worker | Stitcher | See **only orders assigned to them**, move them forward |
| Cashier | Accounts | View orders and customers, record payments |

- Limit a member to certain branches to hide other branches' data from them.
- Disable a member to remove access immediately (history is kept).
- Only Owners can create other Owners.

## 5. Daily oversight

- **Dashboard**: orders by stage, due today, overdue, balances, today's takings.
- **Production**: board of orders per stage; filter by tailor.
- **Delivery**: ready orders; delivery is blocked until the balance is zero.
- **Payments**: orders with a balance to collect.
- **Notifications** (bell): overdue orders, due soon, balance due at Ready, trials pending.
- Assign or change the tailor and promised date from the order page.

## 6. Audit trail

**Audit** lists who did what and when (logins, role changes, order and payment actions). Entries cannot be edited or deleted. Review it regularly, especially after staff changes.

## 7. Recommended routine

Morning: check Notifications and Production, assign unassigned orders. Midday: chase balances on Payments. Evening: confirm Deliveries, review the Dashboard.

## 8. Account safety

Use a unique password, remove leavers the same day, and give each person the lowest role that works. After 5 wrong passwords an account is temporarily locked.

## Not yet available

Inventory/suppliers, quotations and GST invoices, WhatsApp reminders, AI Copilot, plan upgrades and billing, password reset by email (ask engineering/Super Admin). See [ROADMAP](../ROADMAP.md).
