import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignForm, MeasurementPanel, PaymentForm, StatusActions } from "@/components/order-actions";
import { DueLabel, fmtDate, PageHeader, PayBadge, StatusBadge } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { garmentLabel } from "@/lib/measurements";
import { inr, isOpen, PIPELINE, STATUS_LABEL, toPaise } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { can } from "@/server/context";
import { NotFoundError } from "@/server/errors";
import { requirePageContext } from "@/server/page-context";
import { getOrder, listAssignableStaff } from "@/server/services/orders";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePageContext("order:read");
  const o = await getOrder(ctx, id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const staff = can(ctx, "order:write") ? await listAssignableStaff(ctx) : [];
  const open = isOpen(o.status);
  const idx = PIPELINE.indexOf(o.status as (typeof PIPELINE)[number]);
  const hasBalance = toPaise(o.balance) > 0n;

  return (
    <div className="grid gap-4">
      <PageHeader
        title={`${o.label} · ${garmentLabel(o.garment)} for ${o.member.name}`}
        subtitle={`${o.customer.name} · ${o.customer.phone}`}
        actions={<><StatusBadge status={o.status} /><PayBadge status={o.paymentStatus} /></>}
      />

      <Card>
        <ol className="flex gap-1 overflow-x-auto text-xs" aria-label="Progress">
          {PIPELINE.map((s, i) => (
            <li key={s} aria-current={s === o.status ? "step" : undefined}
              className={cn("min-w-24 flex-1 rounded px-2 py-2 text-center", o.status === "CANCELLED" ? "bg-stone-100 text-stone-400" : i < idx ? "bg-brand-mid" : i === idx ? "bg-brand font-semibold text-white" : "bg-stone-100 text-stone-500")}>
              {STATUS_LABEL[s]}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm">
          Promised <b>{fmtDate(o.promisedDate)}</b> <DueLabel daysLeft={o.daysLeft} closed={!open} />
          {o.description && <> · {o.description}</>}
        </p>
        {open && (can(ctx, "order:advance") || can(ctx, "order:write")) && (
          <div className="mt-3"><StatusActions orderId={o.id} status={o.status} canAdvance={can(ctx, "order:advance")} canCancel={can(ctx, "order:write")} /></div>
        )}
        {o.status === "READY" && hasBalance && <p className="mt-2 text-sm text-amber-800">Collect the balance of {inr(o.balance)} before delivery.</p>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="grid gap-3">
          <h2 className="font-medium">Payment</h2>
          <dl className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-stone-50 p-2"><dt className="text-xs text-stone-500">Charges</dt><dd className="font-semibold">{inr(o.charges)}</dd></div>
            <div className="rounded-lg bg-stone-50 p-2"><dt className="text-xs text-stone-500">Paid</dt><dd className="font-semibold">{inr(o.paid)}</dd></div>
            <div className={cn("rounded-lg p-2", hasBalance ? "bg-amber-50" : "bg-emerald-50")}><dt className="text-xs text-stone-500">Balance</dt><dd className="font-semibold">{inr(o.balance)}</dd></div>
          </dl>
          {o.payments.length > 0 && (
            <ul className="divide-y divide-stone-100 text-sm">
              {o.payments.map((p) => (
                <li key={p.id} className="flex justify-between py-1.5">
                  <span>{fmtDate(p.createdAt)} · {p.method}{p.note ? ` · ${p.note}` : ""}{p.reference ? ` · ${p.reference}` : ""}</span>
                  <span className="tabular-nums">{inr(p.amount.toString())}</span>
                </li>
              ))}
            </ul>
          )}
          {can(ctx, "payment:write") && hasBalance && o.status !== "CANCELLED" && <PaymentForm orderId={o.id} balance={o.balance} />}
        </Card>

        <Card className="grid gap-3">
          <h2 className="font-medium">Assignment and delivery</h2>
          <p className="text-sm">Tailor: <b>{o.assignedTo?.name ?? "Unassigned"}</b></p>
          {o.deliveredAt && <p className="text-sm text-emerald-800">Delivered on {fmtDate(o.deliveredAt)}</p>}
          {open && can(ctx, "order:write") && (
            <AssignForm orderId={o.id} staff={staff} current={o.assignedTo?.id ?? null} promised={o.promisedDate.toISOString().slice(0, 10)} />
          )}
          <Link href={`/customers/${o.customer.id}`} className="text-sm text-brand underline">Open customer profile</Link>
        </Card>
      </div>

      {can(ctx, "measurement:read") && (
        <Card>
          <h2 className="mb-3 font-medium">Measurements</h2>
          <MeasurementPanel
            orderId={o.id} garment={o.garment} gender={o.member.gender} ageGroup={o.member.ageGroup}
            current={o.measurement?.values ?? null} version={o.measurement?.version ?? null}
            editable={can(ctx, "measurement:write") && (o.status === "ORDER_RECEIVED" || o.status === "MEASUREMENT")}
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-2 font-medium">Timeline</h2>
        <ol className="grid gap-1 text-sm">
          {o.history.map((h) => (
            <li key={h.id} className="flex flex-wrap gap-2">
              <span className="text-stone-500">{h.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              <span>{STATUS_LABEL[h.toStatus as keyof typeof STATUS_LABEL]}</span>
              {h.note && <span className="text-stone-600">· {h.note}</span>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
