import Link from "next/link";
import { AdvanceButton } from "@/components/order-actions";
import { DueLabel, PageHeader, StatusBadge } from "@/components/ui/bits";
import { garmentLabel } from "@/lib/measurements";
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { listOrders } from "@/server/services/orders";

export const dynamic = "force-dynamic";

const COLUMNS: OrderStatus[] = ["ORDER_RECEIVED", "MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "ALTERATION", "READY"];

export default async function ProductionPage() {
  const ctx = await requirePageContext("order:read");
  const orders = await listOrders(ctx, { statuses: COLUMNS, take: 300 });
  const canAdvance = can(ctx, "order:advance");
  const mine = ctx.roleKey === "TAILOR";

  return (
    <div className="grid gap-4">
      <PageHeader title="Production board" subtitle={mine ? "Your assigned work" : "Every order in progress, by stage"} />
      <div className="flex gap-3 overflow-x-auto pb-3 [scroll-snap-type:x_proximity]">
        {COLUMNS.map((s) => {
          const col = orders.filter((o) => o.status === s);
          return (
            <section key={s} aria-label={STATUS_LABEL[s]} className="w-72 shrink-0 [scroll-snap-align:start]">
              <h2 className={cn("mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold", STATUS_TONE[s])}>
                {STATUS_LABEL[s]} <span>{col.length}</span>
              </h2>
              <ul className="grid gap-2">
                {col.length === 0 && <li className="rounded-lg border border-dashed border-stone-300 p-3 text-center text-xs text-stone-400">Empty</li>}
                {col.map((o) => (
                  <li key={o.id} className={cn("grid gap-1 rounded-lg border bg-white p-3 text-sm shadow-sm", o.daysLeft < 0 ? "border-red-300" : "border-stone-200")}>
                    <Link href={`/orders/${o.id}`} className="font-medium hover:underline">{o.label} · {o.member.name}</Link>
                    <span className="text-stone-600">{garmentLabel(o.garment)}</span>
                    <span className="flex items-center justify-between text-xs">
                      <DueLabel daysLeft={o.daysLeft} /> <span className="text-stone-500">{o.assignedTo?.name ?? "Unassigned"}</span>
                    </span>
                    {canAdvance && s !== "READY" && (
                      <AdvanceButton orderId={o.id} status={o.status} blockedReason={s === "MEASUREMENT" && !o.measurementSetId ? "Needs measurements" : undefined} />
                    )}
                    {s === "READY" && <StatusBadge status="READY" />}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
