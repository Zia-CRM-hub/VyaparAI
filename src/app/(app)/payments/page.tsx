import Link from "next/link";
import { EmptyState, fmtDate, PageHeader, PayBadge, StatCard } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { fromPaise, inr, toPaise } from "@/lib/orders";
import { requirePageContext } from "@/server/page-context";
import { listOrders, listPayments } from "@/server/services/orders";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const ctx = await requirePageContext("order:read");
  const [due, recent] = await Promise.all([listOrders(ctx, { unpaid: true, take: 200 }), listPayments(ctx, 30)]);
  const owing = due.filter((o) => toPaise(o.balance) > 0n).sort((a, b) => Number(toPaise(b.balance) - toPaise(a.balance)));
  const total = owing.reduce((s, o) => s + toPaise(o.balance), 0n);
  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = recent.filter((p) => p.createdAt.toISOString().slice(0, 10) === today).reduce((s, p) => s + toPaise(p.amount), 0n);

  return (
    <div className="grid gap-4">
      <PageHeader title="Payments" subtitle="Outstanding balances and recent receipts. Open an order to record a payment." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Outstanding" value={inr(fromPaise(total))} tone={total > 0n ? "warn" : "good"} />
        <StatCard label="Orders with balance" value={owing.length} />
        <StatCard label="Collected today" value={inr(fromPaise(todayTotal))} />
      </div>

      <Card>
        <h2 className="mb-2 font-medium">Balances to collect</h2>
        {owing.length === 0 ? <EmptyState title="No pending balances" /> : (
          <ul className="divide-y divide-stone-100">
            {owing.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-stone-50">
                  <span><b>{o.label}</b> {o.customer.name} · {o.member.name}</span>
                  <span className="flex items-center gap-2"><PayBadge status={o.paymentStatus} /><b className="tabular-nums">{inr(o.balance)}</b></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-medium">Recent payments</h2>
        <ul className="divide-y divide-stone-100 text-sm">
          {recent.map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>{fmtDate(p.createdAt)} · <Link href={`/orders/${p.orderId}`} className="underline">{p.orderLabel}</Link> · {p.customer} · {p.method}</span>
              <span className="tabular-nums">{inr(p.amount)}</span>
            </li>
          ))}
          {recent.length === 0 && <li className="text-stone-500">No payments yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
