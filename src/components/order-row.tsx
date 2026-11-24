import Link from "next/link";
import { garmentLabel } from "@/lib/measurements";
import { inr, isOpen } from "@/lib/orders";
import type { OrderView } from "@/server/services/orders";
import { DueLabel, fmtDate, PayBadge, StatusBadge } from "./ui/bits";

/** One order as a tappable row/card: who, what, when, status, money. Used across dashboards. */
export function OrderRow({ o, showTailor = false }: { o: OrderView; showTailor?: boolean }) {
  return (
    <li>
      <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 hover:bg-stone-50">
        <div className="min-w-0">
          <p className="truncate font-medium">
            <span className="text-stone-500">{o.label}</span> {o.member.name}
            {o.member.relation !== "Self" && <span className="text-xs font-normal text-stone-500"> ({o.member.relation}, {o.customer.name})</span>}
          </p>
          <p className="text-sm text-stone-600">
            {garmentLabel(o.garment)} · due {fmtDate(o.promisedDate)} <DueLabel daysLeft={o.daysLeft} closed={!isOpen(o.status)} />
            {showTailor && <> · {o.assignedTo?.name ?? "Unassigned"}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={o.status} />
          <PayBadge status={o.paymentStatus} />
          <span className="w-24 text-right text-sm tabular-nums">{o.paymentStatus === "PAID" ? inr(o.charges) : `${inr(o.balance)} due`}</span>
        </div>
      </Link>
    </li>
  );
}
