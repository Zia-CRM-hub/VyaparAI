import Link from "next/link";
import { AdvanceButton } from "@/components/order-actions";
import { DueLabel, EmptyState, fmtDate, PageHeader, PayBadge } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { garmentLabel } from "@/lib/measurements";
import { inr, toPaise } from "@/lib/orders";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { listOrders } from "@/server/services/orders";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const ctx = await requirePageContext("order:read");
  const [ready, upcoming, delivered] = await Promise.all([
    listOrders(ctx, { statuses: ["READY"] }),
    listOrders(ctx, { statuses: ["TRIAL", "ALTERATION", "STITCHING"], dueWithinDays: 3 }),
    listOrders(ctx, { statuses: ["DELIVERED"], take: 10 }),
  ]);
  const canDeliver = can(ctx, "order:advance");

  return (
    <div className="grid gap-4">
      <PageHeader title="Delivery" subtitle="Ready for pickup, and what is due soon" />
      <Card>
        <h2 className="mb-2 font-medium">Ready for delivery ({ready.length})</h2>
        {ready.length === 0 ? <EmptyState title="Nothing waiting for pickup" /> : (
          <ul className="divide-y divide-stone-100">
            {ready.map((o) => {
              const owes = toPaise(o.balance) > 0n;
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/orders/${o.id}`} className="font-medium hover:underline">{o.label} · {o.member.name}</Link>
                    <p className="text-sm text-stone-600">{garmentLabel(o.garment)} · {o.customer.name} · {o.customer.phone}</p>
                    <p className="text-xs">Promised {fmtDate(o.promisedDate)} <DueLabel daysLeft={o.daysLeft} /></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PayBadge status={o.paymentStatus} />
                    <span className="text-sm tabular-nums">{owes ? `${inr(o.balance)} to collect` : "Settled"}</span>
                    {canDeliver && <AdvanceButton orderId={o.id} status="READY" blockedReason={owes ? "Collect balance first" : undefined} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-medium">Due within 3 days, not ready yet ({upcoming.length})</h2>
        {upcoming.length === 0 ? <p className="text-sm text-stone-500">All on track.</p> : (
          <ul className="divide-y divide-stone-100 text-sm">
            {upcoming.map((o) => (
              <li key={o.id} className="flex justify-between gap-2 py-2">
                <Link href={`/orders/${o.id}`} className="hover:underline">{o.label} · {o.member.name} · {garmentLabel(o.garment)}</Link>
                <span><DueLabel daysLeft={o.daysLeft} /> · {o.status.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-medium">Recently delivered</h2>
        <ul className="divide-y divide-stone-100 text-sm">
          {delivered.map((o) => (
            <li key={o.id} className="flex justify-between py-2"><Link href={`/orders/${o.id}`} className="hover:underline">{o.label} · {o.member.name}</Link><span className="text-stone-500">{o.deliveredAt ? fmtDate(o.deliveredAt) : ""}</span></li>
          ))}
          {delivered.length === 0 && <li className="text-stone-500">No deliveries yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
