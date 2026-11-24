import { notFound } from "next/navigation";
import { fmtDate, PageHeader, StatCard } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { TenantStatusButton } from "@/components/tenant-status-button";
import { inr, STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { NotFoundError } from "@/server/errors";
import { requirePlatformPage } from "@/server/page-context";
import { getTenantDetail } from "@/server/services/platform";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requirePlatformPage();
  const t = await getTenantDetail(admin, id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });

  return (
    <div className="grid gap-5">
      <PageHeader title={t.name} subtitle={`${t.city ?? "-"} · ${t.slug} · joined ${fmtDate(t.createdAt)} · ${t.plan} (${t.planStatus.toLowerCase()})`} actions={<TenantStatusButton tenantId={t.id} status={t.status} />} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Staff" value={t.users} /><StatCard label="Branches" value={t.branches} />
        <StatCard label="Customers" value={t.customers} /><StatCard label="Orders" value={t.orders} />
        <StatCard label="Collected" value={inr(t.revenue)} tone="good" /><StatCard label="Outstanding" value={inr(t.outstanding)} />
        <StatCard label="Last activity" value={t.lastActivity ? fmtDate(t.lastActivity) : "-"} />
        <StatCard label="Status" value={t.status === "ACTIVE" ? "Active" : "Suspended"} tone={t.status === "ACTIVE" ? "good" : "danger"} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-medium">Orders by stage</h2>
          <ul className="grid gap-1 text-sm">
            {Object.entries(t.ordersByStatus).map(([s, n]) => <li key={s} className="flex justify-between"><span>{STATUS_LABEL[s as OrderStatus] ?? s}</span><b>{n}</b></li>)}
            {Object.keys(t.ordersByStatus).length === 0 && <li className="text-stone-500">No orders.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Staff</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {t.staff.map((s) => <li key={s.id} className="flex flex-wrap justify-between gap-2 py-1.5"><span>{s.name} · {s.role}</span><span className="text-stone-500">{s.email} · {s.status.toLowerCase()}</span></li>)}
          </ul>
        </Card>
      </div>
      <Card>
        <h2 className="mb-2 font-medium">Recent activity</h2>
        <ul className="divide-y divide-stone-100 text-sm">
          {t.recentActivity.map((a) => <li key={a.id} className="flex justify-between py-1.5"><span>{a.action} <span className="text-stone-500">({a.entityType})</span></span><span className="text-stone-500">{a.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span></li>)}
        </ul>
      </Card>
    </div>
  );
}
