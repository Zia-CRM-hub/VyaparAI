import { notFound } from "next/navigation";
import { ApiForm } from "@/components/api-form";
import { OrderRow } from "@/components/order-row";
import { fmtDate, LinkButton, PageHeader } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { AGE_GROUP_OPTIONS, garmentLabel, GARMENT_BY_KEY, GENDER_OPTIONS } from "@/lib/measurements";
import { RELATIONS } from "@/lib/schemas";
import { can } from "@/server/context";
import { NotFoundError } from "@/server/errors";
import { requirePageContext } from "@/server/page-context";
import { getCustomer } from "@/server/services/customers";
import { listFamily } from "@/server/services/family";
import { listMeasurementHistory } from "@/server/services/measurements";
import { listOrders } from "@/server/services/orders";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePageContext("customer:read");
  const customer = await getCustomer(ctx, id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const family = await listFamily(ctx, id);
  const canMeasure = can(ctx, "measurement:read");
  const histories = canMeasure ? await Promise.all(family.map((m) => listMeasurementHistory(ctx, m.id))) : family.map(() => []);
  const orders = can(ctx, "order:read") ? await listOrders(ctx, { customerId: id, take: 50 }) : [];

  return (
    <div className="grid gap-4">
      <PageHeader
        title={customer.name}
        subtitle={`${customer.phone}${customer.email ? ` · ${customer.email}` : ""}`}
        actions={can(ctx, "order:write") && <LinkButton href={`/orders/new?customerId=${id}`}>+ New order</LinkButton>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {family.map((m, i) => {
          const sets = histories[i] ?? [];
          const byGarment = new Map<string, typeof sets>();
          for (const s of sets) byGarment.set(s.garment, [...(byGarment.get(s.garment) ?? []), s]);
          return (
            <Card key={m.id} className="grid gap-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium">{m.name} <span className="text-sm font-normal text-stone-500">· {m.relation}</span></h2>
                  <p className="text-xs text-stone-500">
                    {GENDER_OPTIONS.find((g) => g.value === m.gender)?.label}, {AGE_GROUP_OPTIONS.find((g) => g.value === m.ageGroup)?.label} · {m._count.orders} order(s)
                  </p>
                </div>
                {can(ctx, "order:write") && <LinkButton variant="outline" href={`/orders/new?customerId=${id}&memberId=${m.id}`}>Order for {m.name.split(" ")[0]}</LinkButton>}
              </div>
              {byGarment.size === 0 ? (
                <p className="text-sm text-stone-500">No measurements saved yet. They are captured when you create an order.</p>
              ) : (
                [...byGarment.entries()].map(([garment, versions]) => (
                  <details key={garment} className="rounded-lg border border-stone-200 p-2 text-sm">
                    <summary className="cursor-pointer font-medium">
                      {garmentLabel(garment)} <span className="font-normal text-stone-500">· latest v{versions[0]!.version}, {fmtDate(versions[0]!.createdAt)} · {versions.length} version(s)</span>
                    </summary>
                    <div className="mt-2 grid gap-3">
                      {versions.map((v) => (
                        <div key={v.id}>
                          <p className="text-xs font-semibold text-stone-600">v{v.version} · {fmtDate(v.createdAt)}{v.notes ? ` · ${v.notes}` : ""}</p>
                          <p className="text-stone-700">
                            {Object.entries(v.values as Record<string, number>).map(([k, n]) => `${GARMENT_BY_KEY.get(garment)?.fields.find((f) => f.key === k)?.label ?? k}: ${n}`).join(" · ")} <span className="text-stone-400">(cm)</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                ))
              )}
            </Card>
          );
        })}
      </div>

      {can(ctx, "customer:write") && (
        <Card>
          <h2 className="mb-3 font-medium">Add family member</h2>
          <ApiForm
            endpoint={`/api/customers/${id}/family`}
            submitLabel="Add family member"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "relation", label: "Relation", type: "select", options: RELATIONS.filter((r) => r !== "Self").map((r) => ({ value: r, label: r })), required: true },
              { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS, required: true },
              { name: "ageGroup", label: "Age group", type: "select", options: AGE_GROUP_OPTIONS, defaultValue: "ADULT", required: true },
            ]}
          />
        </Card>
      )}

      {orders.length > 0 && (
        <Card>
          <h2 className="mb-1 font-medium">Orders</h2>
          <ul className="divide-y divide-stone-100">{orders.map((o) => <OrderRow key={o.id} o={o} />)}</ul>
        </Card>
      )}
    </div>
  );
}
