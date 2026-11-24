import Link from "next/link";
import { OrderRow } from "@/components/order-row";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { PIPELINE, STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { listOrders } from "@/server/services/orders";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; overdue?: string; due?: string; unpaid?: string; mine?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext("order:read");
  const status = sp.status && [...PIPELINE, "CANCELLED"].includes(sp.status) ? (sp.status as OrderStatus) : undefined;
  const orders = await listOrders(ctx, {
    q: sp.q,
    statuses: status ? [status] : undefined,
    overdue: sp.overdue === "1",
    dueWithinDays: sp.due === "today" ? 0 : sp.due === "week" ? 7 : undefined,
    unpaid: sp.unpaid === "1",
    mine: sp.mine === "1",
  });

  const q = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    const next = { ...sp, ...over };
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    return `/orders${p.size ? `?${p}` : ""}`;
  };
  const chip = (label: string, href: string, on: boolean) => (
    <Link key={label} href={href} className={cn("chip", on && "chip-on")} aria-pressed={on}>{label}</Link>
  );

  return (
    <div className="grid gap-4">
      <PageHeader title="Orders" subtitle={`${orders.length} shown`} actions={can(ctx, "order:write") && <LinkButton href="/orders/new">+ New order</LinkButton>} />

      <form className="flex gap-2" action="/orders">
        <input name="q" defaultValue={sp.q} placeholder="Search customer, family member, phone or order #" className="field mt-0 flex-1" aria-label="Search orders" />
        {status && <input type="hidden" name="status" value={status} />}
        <button className="min-h-11 rounded-lg bg-brand px-4 text-sm font-medium text-white">Search</button>
      </form>

      <div className="flex flex-wrap gap-2" aria-label="Filters">
        {chip("All", q({ status: undefined, overdue: undefined, due: undefined, unpaid: undefined, mine: undefined }), !status && !sp.overdue && !sp.due && !sp.unpaid && !sp.mine)}
        {[...PIPELINE, "CANCELLED" as const].map((s) => chip(STATUS_LABEL[s], q({ status: sp.status === s ? undefined : s }), sp.status === s))}
      </div>
      <div className="flex flex-wrap gap-2">
        {chip("Overdue", q({ overdue: sp.overdue ? undefined : "1" }), !!sp.overdue)}
        {chip("Due today", q({ due: sp.due === "today" ? undefined : "today" }), sp.due === "today")}
        {chip("Due this week", q({ due: sp.due === "week" ? undefined : "week" }), sp.due === "week")}
        {chip("Balance pending", q({ unpaid: sp.unpaid ? undefined : "1" }), !!sp.unpaid)}
        {chip("Assigned to me", q({ mine: sp.mine ? undefined : "1" }), !!sp.mine)}
      </div>

      <Card className="p-2 sm:p-4">
        {orders.length === 0 ? (
          <EmptyState title="No orders match" hint="Try clearing filters." action={can(ctx, "order:write") && <LinkButton href="/orders/new">+ New order</LinkButton>} />
        ) : (
          <ul className="divide-y divide-stone-100">{orders.map((o) => <OrderRow key={o.id} o={o} showTailor />)}</ul>
        )}
      </Card>
    </div>
  );
}
