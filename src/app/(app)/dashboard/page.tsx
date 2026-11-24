import Link from "next/link";
import { OrderRow } from "@/components/order-row";
import { EmptyState, LinkButton, PageHeader, StatCard } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { inr, isOpen, PIPELINE, STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { getNotifications, getOrderDashboard } from "@/server/services/orders";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requirePageContext("dashboard:read");
  const [d, notices] = await Promise.all([getOrderDashboard(ctx), getNotifications(ctx)]);
  const active = PIPELINE.filter((s) => isOpen(s as OrderStatus)).reduce((n, s) => n + (d.counts[s] ?? 0), 0);

  return (
    <div className="grid gap-5">
      <PageHeader
        title={`Welcome, ${ctx.userName.split(" ")[0]}`}
        subtitle={ctx.tenantName}
        actions={
          <>
            {can(ctx, "order:write") && <LinkButton href="/orders/new">+ New order</LinkButton>}
            {can(ctx, "customer:write") && <LinkButton href="/customers?new=1" variant="outline">Add customer</LinkButton>}
            {can(ctx, "payment:write") && <LinkButton href="/payments" variant="outline">Record payment</LinkButton>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active orders" value={active} href="/orders" />
        <StatCard label="Due today" value={d.dueToday} href="/orders?due=today" tone={d.dueToday ? "warn" : "default"} />
        <StatCard label="Overdue" value={d.overdue} href="/orders?overdue=1" tone={d.overdue ? "danger" : "default"} />
        <StatCard label="Ready for delivery" value={d.readyForDelivery} href="/delivery" tone={d.readyForDelivery ? "good" : "default"} />
        <StatCard label="Outstanding" value={inr(d.outstanding)} href="/payments" />
        {d.collectedThisMonth !== null && <StatCard label="Collected this month" value={inr(d.collectedThisMonth)} />}
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Production pipeline</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PIPELINE.filter((s) => s !== "DELIVERED").map((s) => (
            <Link key={s} href={`/orders?status=${s}`} className={cn("min-w-28 flex-1 rounded-lg p-3 text-center", STATUS_TONE[s])}>
              <span className="block text-2xl font-semibold">{d.counts[s] ?? 0}</span>
              <span className="text-xs">{STATUS_LABEL[s]}</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Coming up</h2>
            <Link href="/orders" className="text-sm text-brand underline">All orders</Link>
          </div>
          {d.upcoming.length === 0 ? (
            <EmptyState title="No active orders" hint="Create an order to see it here." action={can(ctx, "order:write") && <LinkButton href="/orders/new">+ New order</LinkButton>} />
          ) : (
            <ul className="divide-y divide-stone-100">{d.upcoming.map((o) => <OrderRow key={o.id} o={o} />)}</ul>
          )}
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Needs attention</h2>
            <Link href="/notifications" className="text-sm text-brand underline">All</Link>
          </div>
          {notices.length === 0 ? (
            <p className="text-sm text-stone-500">Nothing urgent. 🎉</p>
          ) : (
            <ul className="grid gap-2">
              {notices.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <Link href={n.href} className="block rounded-lg border border-stone-200 p-2 text-sm hover:bg-stone-50">
                    <span className={cn("mr-1 inline-block h-2 w-2 rounded-full", n.severity === "high" ? "bg-red-600" : n.severity === "medium" ? "bg-amber-500" : "bg-sky-500")} aria-hidden />
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
