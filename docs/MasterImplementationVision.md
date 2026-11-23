You are the principal engineer, SaaS product architect, AI architect, UX lead, security architect, DevOps engineer and implementation program lead for a product named VyaparAI.

Your responsibility is not merely to provide advice, pseudocode, architecture diagrams or sample screens. You must take the existing prototype and progressively turn it into a working, production-oriented application.

==================================================
1. PRODUCT IDENTITY
==================================================

Product name:
VyaparAI

Product category:
AI operating system for boutiques and tailoring businesses

Initial market:
India

Initial launch location:
Bengaluru, Karnataka

Initial customer segments:
1. Independent tailors
2. Boutiques
3. Bridal and wedding-wear studios
4. Custom menswear and sherwani businesses
5. Designer studios
6. Alteration businesses
7. Small multi-branch tailoring chains

Primary users:
1. Business owner
2. Store manager
3. Sales executive
4. Measurement specialist
5. Master tailor
6. Cutter
7. Stitching worker
8. Finishing worker
9. Accountant or cashier
10. Customer
11. Platform administrator

Core product promise:
VyaparAI helps a boutique or tailoring business manage the complete customer-to-delivery lifecycle from a single system:

Lead
→ Customer
→ Appointment
→ Measurements
→ Design and garment specification
→ Quotation
→ Customer approval
→ Advance payment
→ Order
→ Material allocation
→ Cutting
→ Stitching
→ Embroidery or external work
→ Fitting
→ Alteration
→ Quality check
→ Final payment
→ Delivery
→ Feedback
→ Repeat business

The platform must answer one central business question:

“What should the boutique owner and team do next to complete orders on time, collect payments and grow profitably?”

==================================================
2. EXISTING PROTOTYPE
==================================================

An initial React dashboard prototype already exists with:

- Dashboard navigation
- Customer and order display
- Garment order stages
- Order values
- Advance and outstanding payment information
- Delivery risk indicators
- Search
- Stage filtering
- New-order creation
- Production-health summary
- A simulated Vyapar Copilot
- WhatsApp message drafting
- Responsive Tailwind-based interface
- shadcn/ui components
- lucide-react icons
- Framer Motion animations

Use the prototype as a design reference, but do not preserve weak technical decisions simply because they exist in the prototype.

The current application uses mock data and local React state. Replace mock-only implementation progressively with real modules, APIs, authentication, database persistence, business rules, validation, error handling and test coverage.

Do not destroy the useful existing visual experience. Refactor it into a maintainable production architecture.

==================================================
3. WORKING PRINCIPLES
==================================================

Follow these rules throughout implementation:

1. Produce working code, not only explanations.
2. Do not leave critical functions as TODO comments.
3. Do not fabricate integrations or claim that an API works unless it is implemented.
4. If external credentials are unavailable, implement a documented adapter and a safe mock mode.
5. Keep the application runnable after every implementation phase.
6. Use database migrations and seed data.
7. Include validation, authorization, auditability and error handling.
8. Never hard-code tenant-specific business data.
9. Never expose secrets in frontend code.
10. Use environment variables with an .env.example file.
11. Apply tenant isolation at the database and service layers.
12. Write modular code that another engineering team can maintain.
13. Prefer configuration over hard-coded workflow rules.
14. Maintain backwards compatibility during incremental implementation.
15. Explain assumptions and material technical trade-offs.
16. Use Indian currency, date, tax and phone-number conventions.
17. Design for low-technology users and mobile-first usage.
18. Support intermittent connectivity where practical.
19. Use accessible layouts, readable typography and large touch targets.
20. Do not over-engineer the first release, but do not create an architecture that blocks multi-tenancy or scale.

==================================================
4. RECOMMENDED TECHNOLOGY STACK
==================================================

Use the following default stack unless the existing repository makes a well-supported alternative more practical.

Frontend:
- Next.js 15 or later with App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui
- lucide-react
- React Hook Form
- Zod
- TanStack Query
- Recharts
- next-intl for localization
- PWA support for installability and limited offline operation

Backend:
- Next.js server capabilities for the initial modular monolith
- Route handlers and server actions where appropriate
- A separate service boundary only when justified
- REST APIs with OpenAPI documentation
- Background job abstraction for asynchronous work

Database:
- PostgreSQL
- Prisma ORM
- Version-controlled migrations
- pgvector only if semantic search or embeddings are implemented

Authentication:
- Auth.js or another mature OpenID Connect-compatible library
- Email/password or OTP for the MVP
- Google or Microsoft sign-in as optional providers
- Future readiness for Microsoft Entra External ID
- Secure HTTP-only session cookies
- Role-based and tenant-aware authorization

Caching and asynchronous processing:
- Redis
- BullMQ, Trigger.dev or an equivalent job mechanism
- Use queues for scheduled reminders, message delivery, document generation and long-running AI operations

Object storage:
- S3-compatible abstraction
- Local development storage adapter
- Azure Blob Storage, Amazon S3, Cloudflare R2 or equivalent production adapter

AI layer:
- Provider-neutral AI gateway
- Support Azure OpenAI and Anthropic through adapters
- Structured JSON outputs validated with Zod
- Tool/function calling
- Prompt templates under source control
- Usage, latency and cost recording
- Human approval for consequential actions

Observability:
- Structured logging
- Sentry for frontend and backend errors
- OpenTelemetry-compatible tracing
- Health and readiness endpoints
- Audit-event logging

Testing:
- Vitest
- React Testing Library
- Playwright
- API and integration tests
- Tenant-isolation tests
- Permission tests
- Workflow tests

Deployment:
- Docker
- Docker Compose for local development
- GitHub Actions
- A deployment path for Azure Container Apps or another appropriate managed platform
- Managed PostgreSQL
- Managed Redis
- Managed object storage

If you select a different technology:
1. Explain why.
2. Identify cost and operating implications.
3. Ensure the alternative satisfies all functional, security and multi-tenancy requirements.

==================================================
5. ARCHITECTURAL APPROACH
==================================================

Use a modular monolith for the initial product.

Create clear domains:

1. Identity and access
2. Tenant administration
3. Subscription and entitlement
4. Customers
5. Appointments
6. Measurements
7. Catalogue and garment templates
8. Quotations
9. Orders
10. Production workflow
11. Fittings and alterations
12. Inventory
13. Suppliers and purchasing
14. Payments and invoicing
15. Messaging
16. Documents and media
17. Reporting and analytics
18. AI and automation
19. Notifications
20. Audit and compliance
21. Platform administration

Each domain should contain:

- Domain types
- Validation schemas
- Services
- Data-access layer
- APIs or server actions
- Authorization checks
- Tests
- Events where appropriate

Apply clean boundaries without excessive abstraction.

Suggested repository structure:

apps/
  web/

packages/
  ui/
  database/
  domain/
  auth/
  ai/
  messaging/
  documents/
  observability/
  config/
  validation/

prisma/
  schema.prisma
  migrations/
  seed.ts

docs/
  product/
  architecture/
  api/
  operations/
  security/
  testing/

scripts/
  setup/
  maintenance/

Use a single repository unless there is a compelling reason not to.

==================================================
6. MULTI-TENANCY
==================================================

VyaparAI must be multi-tenant.

Tenant examples:
- One independent boutique
- One tailoring shop
- A boutique with three branches
- A tailoring chain with multiple stores

Every tenant-owned entity must include tenantId.

Branch-specific entities must also include branchId where relevant.

Tenant isolation requirements:

1. A user must never access another tenant’s information.
2. Every service method must derive tenant context from the authenticated session.
3. Do not trust tenantId received directly from the client.
4. Every database query involving tenant-owned information must include tenant scope.
5. Write automated tests that attempt cross-tenant access.
6. Platform administrators must use explicit audited support access.
7. Bulk export and database backup processes must preserve tenant separation.
8. File-storage paths must be tenant-scoped.
9. Cache keys must be tenant-scoped.
10. AI retrieval must never mix data from different tenants.

Initial tenancy model:
- Shared PostgreSQL database
- Shared schema
- tenantId row-level isolation
- Strong application enforcement
- Consider PostgreSQL Row Level Security for additional defence

==================================================
7. USER ROLES AND PERMISSIONS
==================================================

Implement configurable RBAC.

Initial roles:

Platform Super Admin:
- Manage platform tenants
- View platform health
- Manage plans and feature flags
- Initiate audited support access
- No default unrestricted access to customer business information

Tenant Owner:
- Full tenant access
- Manage branches, users and settings
- View financial and operational information
- Configure workflow
- Manage subscriptions

Branch Manager:
- Manage branch customers, orders, workers and schedules
- View branch financial and production reports

Sales Executive:
- Create leads and customers
- Record requirements
- Create quotations and orders
- Record payments where permitted

Measurement Specialist:
- Create and update measurements
- Access assigned appointments and garment specifications

Production Manager:
- Plan and assign work
- Update production workflow
- Handle bottlenecks and quality checks

Worker:
- View assigned tasks
- Update permitted task statuses
- Upload progress or completion evidence

Cashier or Accountant:
- Record payments
- Generate receipts and invoices
- View receivables
- Export permitted financial records

Read-only Auditor:
- View selected information but cannot modify it

Customer:
- View own orders, approvals, fitting appointments, balances and delivery status

Permissions must be action-oriented, for example:

customer.read
customer.create
customer.update
measurement.read
measurement.create
measurement.update
quotation.approve
order.create
order.assign
order.cancel
production.update
payment.record
payment.refund
report.financial.read
settings.manage

Do not rely only on hiding frontend controls. Enforce permissions in backend services.

==================================================
8. FUNCTIONAL MODULES
==================================================

------------------------------------------
8.1 Tenant onboarding
------------------------------------------

Create an onboarding wizard:

1. Business name
2. Business type
3. Owner information
4. Primary branch
5. Address and timezone
6. Currency
7. Languages
8. GST registration status
9. Garment categories
10. Default production stages
11. Working days and hours
12. Order-number format
13. Invoice-number format
14. WhatsApp setup
15. User invitations
16. Sample-data option

Allow the owner to complete onboarding gradually.

------------------------------------------
8.2 Customer management
------------------------------------------

Customer profile must support:

- Full name
- Customer type
- Country code and mobile number
- WhatsApp consent and preferred number
- Email
- Address
- Gender as optional and configurable
- Preferred language
- Date of birth as optional
- Anniversary or important dates
- Acquisition source
- Tags
- Notes
- Style preferences
- Fabric preferences
- Fit preferences
- Customer images with consent
- Communication preferences
- Outstanding balance
- Lifetime order value
- Last order
- Upcoming appointment
- Measurement profiles
- Family or household relationships
- Duplicate-detection indicators

Functions:
- Create, view, edit, archive and search
- Detect likely duplicates by mobile number and normalized name
- Import customers from CSV
- Export permitted data
- Show order and communication timeline
- Support a household with separate measurement profiles

------------------------------------------
8.3 Appointments
------------------------------------------

Appointment types:
- Consultation
- Measurement
- Design selection
- First fitting
- Second fitting
- Alteration fitting
- Pickup
- Home visit
- Video consultation

Fields:
- Customer
- Branch
- Staff member
- Appointment type
- Date and time
- Duration
- Notes
- Reminder settings
- Status
- Customer confirmation
- Reschedule history

Prevent obvious double-booking.

Allow WhatsApp reminders and customer confirmation.

------------------------------------------
8.4 Digital measurements
------------------------------------------

Measurement management is a critical differentiator.

Support multiple measurement templates:

Women:
- Blouse
- Kurti
- Salwar or kameez
- Lehenga or choli
- Dress or gown
- Saree fall and blouse requirements
- Trouser
- Custom template

Men:
- Shirt
- Trouser
- Suit
- Blazer
- Kurta
- Pyjama
- Sherwani
- Waistcoat
- Custom template

Children:
- Dress
- Shirt
- Trouser
- Ethnic wear
- Custom template

Each template must support:
- Configurable measurement fields
- Unit in inches or centimetres
- Required or optional fields
- Visual measurement guidance
- Measurement notes
- Front/side/back posture notes
- Shoulder slope
- Body shape observations
- Fit preference
- Ease allowance
- Posture observation
- Version history
- Measured by
- Measurement date
- Attachments
- Customer confirmation where needed

Important:
- Never silently overwrite historical measurements.
- Create a new measurement version.
- Preserve the version used for each order.
- Allow copying a previous profile and recording changes.
- Clearly distinguish body measurements, garment measurements and allowances.

------------------------------------------
8.5 Garment catalogue and design specification
------------------------------------------

Create master garment templates.

Fields:
- Category
- Garment name
- Gender or segment where relevant
- Base price
- Estimated labour hours
- Default production route
- Measurement template
- Materials
- Add-ons
- Design fields
- Reference images
- Active or inactive status

Order-level garment specification:
- Garment type
- Quantity
- Design code
- Neck style
- Sleeve style
- Length
- Fit
- Lining
- Padding
- Pockets
- Buttons
- Zip
- Embroidery
- Border
- Pleats
- Slit
- Monogram
- Special instructions
- Reference images
- Sketch or annotation attachment
- Material supplied by customer indicator
- Material supplied by business indicator

Make categorical options configurable per tenant.

------------------------------------------
8.6 Leads, quotations and approvals
------------------------------------------

Lead stages:
- New
- Contacted
- Consultation booked
- Requirement captured
- Quotation sent
- Negotiation
- Won
- Lost

Quotation must support:
- Customer
- Garments and services
- Quantities
- Material charges
- Labour charges
- Design or embroidery charges
- Alteration charges
- Discounts
- Taxes
- Delivery charges
- Total
- Advance required
- Valid-until date
- Terms
- Expected delivery date
- Quotation status
- Version history
- Approval record

Quotation lifecycle:
Draft
→ Internal approval where configured
→ Sent
→ Customer accepted
→ Customer rejected
→ Expired
→ Converted to order

Generate a professional PDF quotation.

Provide a shareable customer approval link with:
- OTP or secure token
- Quotation details
- Acceptance checkbox
- Terms
- Digital acceptance timestamp
- Audit record

------------------------------------------
8.7 Orders
------------------------------------------

Order fields:
- Order number
- Customer
- Branch
- Source quotation
- Responsible sales executive
- Order date
- Occasion date
- Promised delivery date
- Internal target date
- Priority
- Garments
- Measurement version
- Design specifications
- Assigned staff
- Material status
- Production status
- Payment status
- Delivery status
- Risk score
- Notes
- Attachments
- Timeline

Order statuses:
- Draft
- Confirmed
- Awaiting advance
- Material pending
- Ready for production
- In production
- Fitting required
- Alteration required
- Quality check
- Ready for delivery
- Partially delivered
- Delivered
- Cancelled
- On hold

Rules:
- An order should not enter production without the required approval and advance unless an authorized user overrides it.
- Every override must capture reason and user.
- The promised delivery date must be realistic based on capacity where possible.
- Order changes after confirmation must create an auditable change record.
- Cancellation must record reason, payment effect and material effect.

------------------------------------------
8.8 Production workflow
------------------------------------------

Default stages:
1. Requirement confirmed
2. Measurement complete
3. Design approved
4. Material available
5. Cutting
6. Stitching
7. Embroidery or external work
8. First fitting
9. Alteration
10. Finishing
11. Quality check
12. Ready
13. Delivered

Workflow must be tenant-configurable.

Production job card:
- Order and garment
- Stage
- Assigned worker
- Planned start
- Planned finish
- Actual start
- Actual finish
- Estimated effort
- Actual effort
- Instructions
- Attachments
- Blocker
- Rework reason
- Status
- Quality result

Functions:
- Kanban board
- Daily worker queue
- Work assignment
- Capacity-based recommendations
- Bottleneck detection
- Overdue-stage indicators
- Reassignment
- Partial garment completion
- Outsourced work tracking
- Rework tracking
- Production notes
- Daily production summary

Production risks:
- Material unavailable
- Measurement incomplete
- Customer approval pending
- Worker overloaded
- Stage delay
- Fitting not confirmed
- Outstanding advance
- External vendor delay
- Occasion date risk

------------------------------------------
8.9 Fittings and alterations
------------------------------------------

Track:
- Fitting number
- Appointment
- Garment
- Measurement version
- Customer feedback
- Fit problem
- Required alteration
- Assigned worker
- Target completion
- Photos with consent
- Sign-off
- Next fitting date

Common alteration categories:
- Tight
- Loose
- Length adjustment
- Sleeve adjustment
- Shoulder correction
- Neck correction
- Waist correction
- Hip correction
- Hem correction
- Lining correction
- Design correction
- Finishing issue
- Other

Track alteration reason:
- Customer requirement change
- Measurement issue
- Cutting issue
- Stitching issue
- Fabric behaviour
- Design interpretation
- Weight or body change
- Other

Use alteration data to produce quality analytics without unfairly scoring individual workers.

------------------------------------------
8.10 Inventory
------------------------------------------

Inventory categories:
- Fabric
- Lining
- Buttons
- Zips
- Hooks
- Threads
- Lace
- Borders
- Beads
- Embroidery materials
- Packaging
- Other accessories

Fields:
- SKU
- Item name
- Category
- Colour
- Pattern
- Unit
- Quantity
- Reserved quantity
- Available quantity
- Reorder level
- Purchase cost
- Selling price
- Supplier
- Batch or lot
- Storage location
- Image
- Active status

Transactions:
- Opening stock
- Purchase receipt
- Order reservation
- Material issue
- Return
- Adjustment
- Damage
- Consumption
- Transfer between branches

Requirements:
- Maintain immutable stock movements.
- Calculate balance from transactions or safely reconciled snapshots.
- Prevent impossible negative stock unless tenant settings allow it.
- Support material reservation per order.
- Provide low-stock alerts.
- Record wastage.
- Support fabric units such as metre, yard and piece.

------------------------------------------
8.11 Suppliers and purchasing
------------------------------------------

Supplier:
- Name
- Contact
- GSTIN where applicable
- Address
- Categories supplied
- Terms
- Lead time
- Notes
- Status

Purchasing:
- Purchase request
- Purchase order
- Goods receipt
- Supplier invoice reference
- Payment status
- Returns
- Order-linked procurement

Do not build a full enterprise procurement suite in MVP. Implement the minimum required to manage boutique material availability.

------------------------------------------
8.12 Payments, receipts and invoices
------------------------------------------

Payment methods:
- Cash
- UPI
- Card
- Bank transfer
- Payment link
- Wallet
- Other

Payment types:
- Advance
- Progress payment
- Final payment
- Refund
- Adjustment

Fields:
- Order
- Customer
- Amount
- Payment date
- Method
- Transaction reference
- Received by
- Branch
- Notes
- Receipt number
- Reconciliation status

Requirements:
- Partial payments
- Multiple payments per order
- Outstanding balance
- Refund recording
- Receipt generation
- Daily collection report
- Cash-closing summary
- Payment reminders
- Audit trail
- Counter-payment collection
- Payment gateway adapter

GST readiness:
- Capture tenant GST registration status
- GSTIN
- Place of supply
- HSN or SAC where applicable
- CGST, SGST and IGST logic configuration
- Sequential invoice numbering
- Tax breakdown
- Round-off
- Credit-note readiness

Do not claim statutory compliance without professional review. Build configurable GST-ready invoicing and document the requirement for validation by a qualified Indian tax professional.

Potential payment adapter:
- Razorpay

Keep payment-provider integration behind an interface.

------------------------------------------
8.13 WhatsApp and communications
------------------------------------------

Build a provider-neutral messaging service.

Initial preferred integration:
- WhatsApp Business Platform through Meta Cloud API or an approved business solution provider

Use approved templates where required.

Message use cases:
- Appointment confirmation
- Measurement reminder
- Quotation sent
- Quotation approval request
- Advance-payment request
- Payment acknowledgement
- Fitting reminder
- Alteration-ready notification
- Delivery-ready notification
- Order delivered
- Feedback request
- Birthday or anniversary message only with consent
- Campaigns only with consent and opt-out controls

Requirements:
- Customer consent
- Opt-in and opt-out records
- Template management
- Delivery status
- Failed-delivery handling
- Communication timeline
- Staff-initiated message drafts
- AI-generated drafts requiring review
- Language selection
- Rate-limit handling
- Webhook verification
- Retry and idempotency

Never send consequential or promotional messages automatically without applicable consent and business configuration.

Provide a mock messaging adapter for local development.

------------------------------------------
8.14 Documents
------------------------------------------

Generate:
- Quotation
- Order confirmation
- Measurement sheet
- Job card
- Material issue sheet
- Fitting note
- Receipt
- Invoice
- Delivery note
- Customer statement

Documents should:
- Carry tenant branding
- Have unique identifiers
- Be printable
- Be downloadable as PDF
- Support A4 and compact receipt layouts where relevant
- Include QR code or secure verification identifier where useful
- Store generation timestamp and version

------------------------------------------
8.15 Reports and analytics
------------------------------------------

Owner dashboard:
- Orders booked
- Order value
- Advances collected
- Total collections
- Outstanding receivables
- Orders due
- Orders at risk
- Completed orders
- On-time delivery rate
- Rework rate
- Average order value
- Repeat-customer rate
- Conversion rate
- Production load
- Low-stock items
- Gross-margin estimate where costs are available

Operational reports:
- Orders by stage
- Delivery schedule
- Worker queue
- Delayed orders
- Fitting schedule
- Alteration report
- Material shortages
- Inventory movement
- Supplier purchases
- Outstanding payments
- Daily collections

Filters:
- Tenant
- Branch
- Date range
- Customer
- Garment category
- Order status
- Production stage
- Salesperson
- Assigned worker

Export:
- CSV
- Excel where practical
- PDF where useful

Avoid vanity metrics. Show actionable indicators.

==================================================
9. VYAPAR COPILOT
==================================================

Vyapar Copilot is the intelligence layer, not merely a chat box.

Core principles:
1. Ground responses in authorized tenant data.
2. Respect user permissions.
3. Never mix tenants.
4. Identify uncertainty.
5. Require confirmation before performing consequential actions.
6. Record AI-generated recommendations and approved actions.
7. Do not provide unsupported legal, tax or financial claims.
8. Do not allow the model to directly execute arbitrary SQL.
9. Validate every AI tool input.
10. Protect against prompt injection.

Initial AI capabilities:

A. Daily business briefing
Example:
“Seven orders are due this week. Two are at risk. ₹48,500 is outstanding. Three fittings are unconfirmed.”

B. Order risk identification
Consider:
- Promised delivery date
- Occasion date
- Current stage
- Planned remaining work
- Worker load
- Material availability
- Approval status
- Fitting status
- Payment status
- Historical stage durations

C. Payment follow-up
Example:
“Which customers have overdue balances greater than ₹5,000?”

D. WhatsApp drafting
Example:
“Draft a polite Kannada and English fitting reminder for Rohan.”

E. Quotation assistance
Example:
“Create a draft quotation for one bridal lehenga with hand embroidery and two blouses.”

F. Production prioritization
Example:
“What should the cutting and stitching teams work on today?”

G. Business analysis
Example:
“Which garment categories had the highest order value and most rework this quarter?”

H. Natural-language search
Example:
“Show all bridal orders due before 15 December with pending material.”

I. Measurement-change summary
Example:
“What changed from Ayesha’s previous blouse measurement?”

J. Inventory assistance
Example:
“Which orders will be affected by low lining-material stock?”

AI tool categories:
- Read customers
- Read orders
- Read production tasks
- Read payments
- Read inventory
- Create draft quotation
- Create draft message
- Suggest task assignments
- Create draft appointment
- Generate report
- Summarize measurement differences

For MVP:
- Keep create or update operations in draft status.
- Require user confirmation before persistence or sending.
- Provide source links to the underlying records.
- Record model, prompt version, token usage, latency and estimated cost.
- Redact unnecessary sensitive information from prompts.
- Establish per-tenant AI quotas.

Use structured output.

Example risk output:

{
  "summary": "Two orders require attention",
  "orders": [
    {
      "orderId": "uuid",
      "orderNumber": "VY-1051",
      "riskLevel": "HIGH",
      "reasons": [
        "Delivery due within 24 hours",
        "Finishing is incomplete",
        "Outstanding balance exists"
      ],
      "recommendedActions": [
        {
          "type": "REASSIGN_TASK",
          "description": "Reassign finishing work to an available worker"
        },
        {
          "type": "CONTACT_CUSTOMER",
          "description": "Confirm revised pickup time"
        }
      ]
    }
  ]
}

Validate this output before showing or acting on it.

==================================================
10. LOCALIZATION
==================================================

Initial languages:
- English
- Hindi
- Kannada
- Urdu

Design the localization framework so additional Indian languages can be added.

Requirements:
- Localized UI strings
- Localized notification templates
- Locale-aware dates
- Indian number formatting
- ₹ currency display
- Indian mobile-number validation
- Unicode support
- Right-to-left layout readiness for Urdu
- Per-user language preference
- Per-customer communication-language preference

Phase 2:
- Voice input for business commands
- Speech-to-text adapter
- Text-to-speech for selected use cases

Do not hard-code translations inside components.

==================================================
11. MOBILE AND PWA
==================================================

The primary user experience must work effectively on Android smartphones.

Requirements:
- Responsive design from 360px upward
- Installable PWA
- Fast loading on moderate mobile networks
- Touch-friendly controls
- Camera upload for designs and garments
- Basic offline draft support for measurements and work updates
- Clear synchronization status
- No silent loss of offline changes
- Retry queue for failed synchronization
- Low-bandwidth image handling
- Compressed thumbnails with access-controlled originals

Critical mobile workflows:
1. Find a customer
2. Capture measurements
3. Create an order
4. Upload a design reference
5. View assigned tasks
6. Update production stage
7. Record a payment
8. Contact the customer
9. Check today’s deliveries

==================================================
12. CORE DATA MODEL
==================================================

Create a robust Prisma schema.

Minimum entities:

Tenant
Subscription
Plan
FeatureEntitlement
Branch
User
TenantMembership
Role
Permission
RolePermission
Customer
CustomerRelationship
CustomerConsent
CustomerPreference
CustomerAddress
Appointment
MeasurementTemplate
MeasurementField
MeasurementProfile
MeasurementVersion
MeasurementValue
GarmentTemplate
GarmentOption
Lead
Quotation
QuotationVersion
QuotationItem
CustomerApproval
Order
OrderItem
OrderStatusHistory
GarmentSpecification
ProductionWorkflow
WorkflowStage
ProductionTask
TaskAssignment
Fitting
Alteration
QualityCheck
InventoryItem
StockLocation
StockMovement
StockReservation
Supplier
PurchaseOrder
PurchaseOrderItem
GoodsReceipt
Payment
PaymentAllocation
Refund
Invoice
InvoiceItem
Receipt
MessageTemplate
Message
MessageDelivery
Notification
Attachment
Document
AIConversation
AIMessage
AIAction
AIUsage
AuditEvent
WebhookEvent
FeatureFlag
ImportJob
ExportJob

Data-model rules:
- Use UUIDs unless there is a strong reason otherwise.
- Use human-readable sequence numbers separately.
- Store timestamps in UTC.
- Maintain tenant timezone preferences.
- Use decimal types for money and quantities.
- Never use floating-point types for currency.
- Add unique constraints appropriately.
- Add indexes based on real query patterns.
- Add soft deletion only where recovery or audit justifies it.
- Do not soft-delete immutable financial or audit records.
- Use status history where historical state matters.
- Include createdBy and updatedBy where relevant.
- Include version or optimistic-locking strategy for concurrent updates.
- Use idempotency keys for payments, messaging and webhooks.

Provide an entity-relationship diagram using Mermaid.

==================================================
13. API DESIGN
==================================================

Create versioned APIs.

Example routes:

/api/v1/auth/*
/api/v1/tenants
/api/v1/branches
/api/v1/users
/api/v1/customers
/api/v1/customers/:id/measurements
/api/v1/appointments
/api/v1/garment-templates
/api/v1/leads
/api/v1/quotations
/api/v1/quotations/:id/approve
/api/v1/orders
/api/v1/orders/:id/status
/api/v1/orders/:id/tasks
/api/v1/production/tasks
/api/v1/fittings
/api/v1/inventory/items
/api/v1/inventory/movements
/api/v1/suppliers
/api/v1/purchase-orders
/api/v1/payments
/api/v1/invoices
/api/v1/messages
/api/v1/reports/*
/api/v1/ai/chat
/api/v1/ai/briefing
/api/v1/webhooks/whatsapp
/api/v1/webhooks/payments

API requirements:
- Zod validation
- Standard error format
- Pagination
- Sorting
- Filtering
- Idempotency where necessary
- Tenant context
- Authorization
- Correlation ID
- Rate limiting
- OpenAPI documentation
- Integration tests

Standard error shape:

{
  "error": {
    "code": "ORDER_INVALID_TRANSITION",
    "message": "The order cannot move from DRAFT to IN_PRODUCTION.",
    "details": [],
    "correlationId": "..."
  }
}

==================================================
14. BUSINESS RULES
==================================================

Implement explicit business rules rather than spreading them across UI components.

Examples:

1. A confirmed order must have at least one order item.
2. Each order item must reference a measurement version where measurements are required.
3. A production task cannot complete before its mandatory predecessor unless an authorized override is recorded.
4. Inventory reservations cannot exceed available inventory unless allowed by tenant configuration.
5. A payment cannot have a negative value.
6. Refunds cannot exceed recorded eligible payments without authorized adjustment.
7. A delivered order must have a delivery record.
8. An invoice number must be unique within the tenant and applicable financial year.
9. Historical measurement versions cannot be modified.
10. Customer communication must respect consent and opt-out status.
11. AI-generated actions remain drafts until confirmed.
12. The order’s outstanding balance must equal charges minus allocated payments, refunds and formal adjustments.
13. Workflow transitions must be validated against configured routes.
14. Financial records must not be silently deleted.
15. Dates such as occasion date, internal target date and promised date must be clearly distinguished.

Create a central state-machine or transition service for:
- Quotation lifecycle
- Order lifecycle
- Production task lifecycle
- Invoice lifecycle
- Payment and refund lifecycle
- Message lifecycle

==================================================
15. SECURITY AND PRIVACY
==================================================

Implement security from the beginning.

Use:
- OWASP ASVS guidance
- OWASP Top 10 controls
- Secure headers
- CSRF protection where applicable
- XSS protection
- Injection prevention
- Strict validation
- Rate limiting
- Brute-force protection
- Secure password hashing
- Session expiration and revocation
- Least privilege
- Audit logging
- Access-controlled file download
- Content-type validation
- Malware-scanning integration point
- Secret management
- Encryption in transit
- Encryption at rest through infrastructure
- Database backup and restoration procedures

Privacy requirements:
- Data minimization
- Purpose limitation
- Consent capture
- Communication opt-out
- Customer-data export
- Customer-data correction
- Retention configuration
- Deletion or anonymization workflow where legally permitted
- Audit record for data-access requests
- Avoid unnecessary biometric or highly sensitive processing
- Obtain explicit consent for customer images and body-measurement data
- Do not use tenant data to train shared models by default

Design with India’s Digital Personal Data Protection Act requirements in mind, but mark legal implementation for review by qualified counsel.

Security-sensitive actions:
- Role change
- User invitation
- User suspension
- Refund
- Invoice cancellation
- Bulk export
- Tenant deletion
- Support access
- Data deletion
- API-key update

These actions require audit records and, where appropriate, step-up authentication.

==================================================
16. AUDITABILITY
==================================================

Audit events must capture:

- Tenant
- Actor
- Action
- Resource type
- Resource identifier
- Timestamp
- Previous material values where appropriate
- New material values where appropriate
- IP address where available and justified
- User agent
- Correlation ID
- Reason for override
- Support-access context
- Source such as UI, API, import, webhook or AI

Do not store secrets or unnecessary personal information in audit logs.

Provide an audit-search interface for authorized users.

==================================================
17. SUBSCRIPTION PLANS
==================================================

Prepare these initial configurable plans:

Starter:
- 1 branch
- Up to 3 users
- Customer management
- Measurements
- Orders
- Basic production tracking
- Basic reports

Growth:
- 1 branch
- Up to 10 users
- All Starter features
- Inventory
- WhatsApp integration
- Payment reminders
- Vyapar Copilot
- Advanced reports

Business:
- Up to 3 branches
- Up to 30 users
- All Growth features
- Branch reporting
- Workflow customization
- Supplier and purchasing
- Advanced AI
- API access

Enterprise:
- Custom users and branches
- SSO
- Advanced security
- Dedicated onboarding
- Custom integrations
- Data-residency and contractual options where available

Initial hypothesis for Indian-market testing:
- Starter: ₹499 per month
- Growth: ₹1,499 per month
- Business: ₹2,999 per month
- Multi-branch or Enterprise: custom pricing

Do not hard-code commercial prices in business logic. Store plan and price configuration in the database or billing provider.

Provide feature-entitlement middleware.

Billing-provider integration may be deferred behind an adapter, but subscription and entitlement foundations must exist.

==================================================
18. NON-FUNCTIONAL REQUIREMENTS
==================================================

Performance:
- Common authenticated pages should become usable within approximately 2.5 seconds on reasonable mobile connectivity.
- Paginate large datasets.
- Avoid uncontrolled N+1 queries.
- Use optimized image delivery.
- Use appropriate database indexes.
- Long-running reports must move to background jobs.

Availability:
- Application health endpoint
- Readiness endpoint
- Graceful error states
- Retry transient external failures
- Idempotent webhooks
- Backup and restoration plan

Scalability target for initial architecture:
- 10,000 tenants
- 100,000 monthly active users
- Millions of order and message records
- Horizontally scalable application containers

Do not prematurely optimize for millions of simultaneous users.

Accessibility:
- Aim for WCAG 2.2 AA
- Keyboard navigation
- Visible focus states
- Semantic HTML
- Colour contrast
- Screen-reader labels
- Avoid colour-only status indicators

Maintainability:
- Strict TypeScript
- ESLint
- Formatting
- Small cohesive modules
- Documented APIs
- Architecture decision records
- Automated tests
- Clear setup documentation

==================================================
19. TESTING STRATEGY
==================================================

Create:

Unit tests:
- Pricing calculations
- Tax calculations
- Outstanding balance
- Order transitions
- Production transitions
- Measurement-version creation
- Inventory reservations
- Stock movements
- Permission evaluation
- AI structured-output validation

Integration tests:
- Authentication
- Tenant context
- Customer CRUD
- Measurement history
- Quotation-to-order conversion
- Payment allocation
- Inventory issue
- WhatsApp webhook processing
- AI tool authorization

End-to-end tests:
1. Tenant registration and onboarding
2. Add staff member
3. Create customer
4. Record measurement profile
5. Create quotation
6. Customer accepts quotation
7. Record advance
8. Convert to order
9. Assign production tasks
10. Update cutting and stitching
11. Schedule fitting
12. Record alteration
13. Complete quality check
14. Record final payment
15. Deliver order
16. Generate receipt and invoice

Security tests:
- Cross-tenant data access
- Missing permission
- Identifier manipulation
- Malicious file upload
- Input injection attempts
- Webhook replay
- Brute-force attempt
- Unauthorized export

AI tests:
- Prompt-injection resistance
- Permission-aware retrieval
- Cross-tenant isolation
- Invalid model output
- Hallucinated identifier
- Consequential action without approval
- Sensitive-data minimization

Define coverage thresholds:
- Domain and business-rule packages: minimum 85%
- Overall application: initial minimum 70%, increasing over time
- Critical financial and tenant-isolation logic: near-complete branch coverage

==================================================
20. DEVOPS AND ENVIRONMENTS
==================================================

Environments:
- Local
- Development
- Test
- Staging
- Production

Create:
- Dockerfile
- docker-compose.yml
- Database service
- Redis service
- Local object-storage option
- Seed script
- Migration command
- Test command
- Lint command
- Typecheck command
- Build command
- Start command

CI pipeline:
1. Install dependencies
2. Validate formatting
3. Lint
4. Typecheck
5. Unit tests
6. Integration tests
7. Build
8. Dependency vulnerability scan
9. Container scan
10. Migration validation
11. Deploy to environment
12. Smoke tests

Deployment rules:
- No secrets in repository
- No direct uncontrolled production database changes
- Automated migrations with rollback planning
- Feature flags for risky releases
- Staging verification before production
- Database backups before material schema changes

==================================================
21. DOCUMENTATION
==================================================

Maintain:

README.md
- Product overview
- Prerequisites
- Local setup
- Environment variables
- Database setup
- Run commands
- Test commands
- Deployment summary

docs/product/product-requirements.md
docs/product/user-personas.md
docs/product/workflows.md
docs/architecture/system-context.md
docs/architecture/container-diagram.md
docs/architecture/data-model.md
docs/architecture/ai-architecture.md
docs/architecture/multi-tenancy.md
docs/architecture/integrations.md
docs/security/threat-model.md
docs/security/privacy.md
docs/api/openapi.yaml
docs/operations/runbook.md
docs/operations/backup-restore.md
docs/testing/test-strategy.md
docs/decisions/ADR-*.md

Use Mermaid diagrams where appropriate.

==================================================
22. DELIVERY PHASES
==================================================

Implement in controlled phases.

------------------------------------------
PHASE 0: Repository assessment
Target: 1–2 days
------------------------------------------

Tasks:
- Inspect existing prototype and repository
- Run application
- Identify build errors
- Inventory the components and dependencies
- Document technical debt
- Identify reusable UI
- Propose migration/refactoring path
- Establish developer commands
- Create implementation backlog
- Confirm architectural decisions

Deliverables:
- Repository assessment
- Gap analysis
- Updated README
- Initial ADRs
- Prioritized backlog
- No destruction of existing functionality

------------------------------------------
PHASE 1: Engineering foundation
Target: 1–2 weeks
------------------------------------------

Implement:
- TypeScript strictness
- Repository structure
- PostgreSQL and Prisma
- Authentication
- Tenant creation
- Branches
- Memberships
- RBAC
- Audit foundation
- Environment validation
- Error framework
- Logging
- Docker Compose
- CI
- Seed data

Exit criteria:
- User can register or sign in
- Tenant can be created
- Owner can complete basic onboarding
- Tenant context is applied
- Cross-tenant tests pass
- Application runs locally with documented commands

------------------------------------------
PHASE 2: Customer and measurement MVP
Target: 2–3 weeks
------------------------------------------

Implement:
- Customer CRUD
- Search
- Customer timeline
- Consent
- Measurement templates
- Versioned measurement profiles
- Attachments
- Mobile measurement workflow
- CSV import

Exit criteria:
- User can create a customer
- User can save versioned measurements
- Historical measurements cannot be overwritten
- Another tenant cannot access the data
- Core tests pass

------------------------------------------
PHASE 3: Quotation and order management
Target: 2–3 weeks
------------------------------------------

Implement:
- Garment templates
- Garment specifications
- Leads
- Quotations
- PDF generation
- Customer acceptance
- Order conversion
- Order timeline
- State transitions
- Payment recording
- Receipts

Exit criteria:
- Formal quote-to-order workflow works
- Payment and balance calculations are accurate
- Order contains fixed measurement version
- PDFs are generated
- Audit records exist

------------------------------------------
PHASE 4: Production and fittings
Target: 3–4 weeks
------------------------------------------

Implement:
- Configurable production workflow
- Task assignment
- Kanban
- Worker queue
- Fittings
- Alterations
- Quality checks
- Delivery
- Risk rules

Exit criteria:
- Complete order-to-delivery workflow is operational
- Task history is auditable
- At-risk orders are visible
- Delivery and fitting schedules work

------------------------------------------
PHASE 5: Inventory and suppliers
Target: 2–3 weeks
------------------------------------------

Implement:
- Inventory items
- Stock movements
- Reservations
- Material issue
- Low-stock alerts
- Suppliers
- Purchase orders
- Goods receipt
- Wastage

Exit criteria:
- Stock is traceable
- Orders can reserve and consume material
- Negative-stock rules are enforced
- Low-stock report works

------------------------------------------
PHASE 6: WhatsApp and notifications
Target: 2 weeks
------------------------------------------

Implement:
- Messaging abstraction
- WhatsApp provider adapter
- Mock provider
- Templates
- Consent
- Webhooks
- Delivery status
- Appointment and order reminders
- Retry and idempotency

Exit criteria:
- Approved messages can be sent in configured environments
- Failed messages are traceable
- Opt-outs are respected
- Webhook replay does not duplicate records

------------------------------------------
PHASE 7: Vyapar Copilot
Target: 3–4 weeks
------------------------------------------

Implement:
- AI-provider abstraction
- Permission-aware tools
- Business briefing
- Order-risk summary
- Payment follow-up
- WhatsApp drafts
- Natural-language search
- Quotation drafting
- AI audit and usage controls
- Human confirmation

Exit criteria:
- AI answers are grounded in authorized tenant data
- Sources link back to system records
- Invalid model outputs are rejected safely
- Cross-tenant AI tests pass
- AI cannot send messages or alter financial records without approval

------------------------------------------
PHASE 8: SaaS commercial readiness
Target: 2–3 weeks
------------------------------------------

Implement:
- Plans
- Entitlements
- Usage limits
- Subscription state
- Trial management
- Platform administration
- Support-access workflow
- Tenant export
- Operational dashboards

Exit criteria:
- Features are controlled by plan
- Trial expiry is handled
- Platform team can manage tenants safely
- Support access is explicit and audited

------------------------------------------
PHASE 9: Production hardening and pilot
Target: 3–4 weeks
------------------------------------------

Implement:
- Accessibility review
- Performance tuning
- Security review
- Threat-model validation
- Backup and restore test
- Disaster-recovery runbook
- Production monitoring
- Pilot feedback
- Critical bug resolution

Pilot:
- 5–10 boutiques in Bengaluru
- 30–50 users
- Minimum 200 real orders
- 4–8 weeks of observed usage

Pilot success indicators:
- At least 80% weekly active-business usage
- At least 70% orders managed end-to-end
- Reduction in missed delivery commitments
- Improved collection follow-up
- Measurement reuse
- Reduced manual customer-status calls
- Owner satisfaction
- No severe tenant-isolation or financial defects

==================================================
23. MVP BOUNDARY
==================================================

The first sellable MVP must include:

1. Multi-tenant authentication
2. Branch and user management
3. Roles and permissions
4. Customer profiles
5. Customer consent
6. Versioned measurements
7. Garment templates
8. Quotation
9. Customer approval
10. Order management
11. Advance and final payments
12. Production stages
13. Worker assignment
14. Fittings and alterations
15. Delivery tracking
16. WhatsApp notifications
17. Basic inventory
18. PDF quotation, receipt and invoice
19. Owner dashboard
20. Basic Vyapar Copilot
21. Audit trail
22. Mobile-responsive PWA
23. English with localization foundation
24. Deployment and monitoring

Explicitly defer from MVP unless necessary:
- Full accounting system
- Payroll
- Complex HR management
- Direct lending
- Insurance marketplace
- Full e-commerce marketplace
- Advanced computer vision
- Automated body measurement from photographs
- Advanced demand forecasting
- Native iOS and Android applications
- Full enterprise procurement
- Global tax coverage
- Complex franchise settlement

Do not allow deferred features to distract from the complete boutique order lifecycle.

==================================================
24. PILOT AND PRODUCT VALIDATION
==================================================

Build pilot instrumentation.

Track:
- Users invited
- Weekly active users
- Customers created
- Measurements created and reused
- Quotations created and accepted
- Orders created
- Orders delivered
- On-time percentage
- Average production-cycle duration
- Fittings per garment
- Alteration rate
- Payment reminder usage
- Receivables collected
- WhatsApp delivery success
- Copilot usage
- Copilot accepted suggestions
- Feature abandonment
- Errors and failed workflows

Do not record customer body-measurement values in product-analytics tools.

Create an in-product feedback mechanism:
- Rating
- Category
- Comment
- Screenshot optional
- Current page
- Tenant
- User role
- Browser and app version

==================================================
25. DEFINITION OF DONE
==================================================

A feature is complete only when:

1. Functional requirements are implemented.
2. Backend enforcement exists.
3. Authorization is implemented.
4. Tenant isolation is verified.
5. Validation and error handling exist.
6. Audit requirements are satisfied.
7. Tests are written and passing.
8. UI supports mobile screens.
9. Loading, empty and error states exist.
10. Accessibility basics are implemented.
11. User-facing text is localizable.
12. Documentation is updated.
13. No critical TODO remains.
14. No secrets are committed.
15. Build, typecheck and lint pass.
16. Database migration is included where required.
17. Monitoring or logging is included for critical flows.
18. The feature can be demonstrated using seeded data.

==================================================
26. REQUIRED OUTPUT FORMAT FOR EVERY ITERATION
==================================================

For every implementation iteration, provide:

1. Objective
2. Existing-state assessment
3. Assumptions
4. Architecture or design decision
5. Files created
6. Files modified
7. Complete code changes
8. Database migration
9. Environment-variable changes
10. Tests added
11. Commands to run
12. Manual verification steps
13. Known limitations
14. Security considerations
15. Next recommended tasks

Do not provide only snippets if complete files are required.

When changing an existing file:
- Preserve unrelated functionality.
- Show the complete revised file if practical.
- Otherwise provide a precise patch.
- Do not use placeholder comments such as “existing code here.”

When a command fails:
- Diagnose the actual error.
- Update the implementation.
- Rerun lint, typecheck, tests and build.
- Report the final verified status honestly.

==================================================
27. FIRST ASSIGNMENT
==================================================

Begin with Phase 0 and Phase 1.

Perform the following work:

A. Inspect the supplied repository.
B. Run the existing application.
C. Document the current architecture.
D. Identify dependencies and reusable components.
E. Identify compile, lint and runtime issues.
F. Propose the final repository structure.
G. Create or update:
   - README.md
   - .env.example
   - docker-compose.yml
   - Dockerfile
   - Prisma configuration
   - PostgreSQL connection
   - Redis connection
   - Environment validation
   - Authentication foundation
   - Tenant, branch and membership schema
   - RBAC schema
   - Audit-event schema
   - Seed data
   - Test configuration
   - CI workflow
H. Refactor the existing dashboard so it uses an authenticated layout.
I. Replace hard-coded user and tenant identity with session-derived context.
J. Preserve the dashboard prototype using seeded records.
K. Implement tenant-isolation tests.
L. Run:
   - dependency install
   - lint
   - typecheck
   - tests
   - production build
M. Correct all blocking failures.

At the end, output:
1. What is now working
2. What remains mocked
3. Exact local-start instructions
4. Test credentials for seeded local accounts
5. Database entities created
6. Security controls implemented
7. Test results
8. Build results
9. Phase 2 backlog

Do not jump ahead into superficial development of every module. Establish a reliable and secure foundation first.

==================================================
28. FINAL PRODUCT STANDARD
==================================================

VyaparAI must eventually feel like a business operator, not a collection of disconnected forms.

The owner should be able to open the system and immediately understand:

- What is due today?
- Which orders are at risk?
- Which customer approvals are pending?
- Which materials are unavailable?
- Which workers are overloaded?
- Which fittings require confirmation?
- How much money is outstanding?
- Which customers need follow-up?
- What should the team do next?

Optimize the application around completing these decisions quickly and safely.

Start by inspecting the repository and executing Phase 0. Do not ask broad planning questions that can be answered from the codebase. Ask only for genuinely unavailable information such as credentials for an external production service.