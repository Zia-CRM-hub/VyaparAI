import Link from "next/link";
import { fmtDate, PageHeader, StatCard } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { inr, STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { requirePlatformPage } from "@/server/page-context";
import { platformOverview } from "@/server/services/platform";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const admin = await requirePlatformPage();
  const o = await platformOverview(admin);
  const maxReg = Math.max(1, ...o.registrationsByMonth.map((m) => m.count));
  const statusTotal = Object.values(o.ordersByStatus).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="grid gap-5">
      <PageHeader title="Platform overview" subtitle="All businesses on VyaparAI. Customer personal data is never shown here; only counts and totals." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Businesses" value={o.totals.tenants} hint={`${o.totals.active} active · ${o.totals.suspended} suspended`} href="/admin/tenants" />
        <StatCard label="Staff users" value={o.totals.users} />
        <StatCard label="Customers" value={o.totals.customers} />
        <StatCard label="Orders" value={o.totals.orders} />
        <StatCard label="Payments collected" value={inr(o.totals.revenue)} tone="good" />
        <StatCard label="Outstanding" value={inr(o.totals.outstanding)} tone={o.totals.outstanding !== "0.00" ? "warn" : "default"} />
        <StatCard label="Inactive (14d)" value={o.inactive.length} tone={o.inactive.length ? "warn" : "default"} hint="Active businesses with no recent activity" />
        <StatCard label="Plans" value={Object.entries(o.planCounts).map(([k, n]) => `${k} ${n}`).join(" · ") || "-"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">New registrations (6 months)</h2>
          <ul className="grid gap-2" aria-label="Registrations per month">
            {o.registrationsByMonth.map((m) => (
              <li key={m.month} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-stone-500">{m.month}</span>
                <span className="h-5 rounded bg-stone-800" style={{ width: `${(m.count / maxReg) * 100}%`, minWidth: m.count ? 6 : 0 }} />
                <span className="tabular-nums">{m.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Orders by stage (all businesses)</h2>
          <ul className="grid gap-2">
            {Object.entries(o.ordersByStatus).map(([s, n]) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-stone-600">{STATUS_LABEL[s as OrderStatus] ?? s}</span>
                <span className="h-5 rounded bg-stone-800" style={{ width: `${(n / statusTotal) * 100}%`, minWidth: 6 }} />
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
            {Object.keys(o.ordersByStatus).length === 0 && <li className="text-sm text-stone-500">No orders yet.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Top businesses by payments collected</h2>
          <ol className="divide-y divide-stone-100 text-sm">
            {o.topByRevenue.map((t) => (
              <li key={t.id} className="flex justify-between py-2"><Link className="hover:underline" href={`/admin/tenants/${t.id}`}>{t.name}</Link><span className="tabular-nums">{inr(t.revenue)}</span></li>
            ))}
          </ol>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Needs a check-in (inactive)</h2>
          {o.inactive.length === 0 ? <p className="text-sm text-stone-500">Everyone is active.</p> : (
            <ul className="divide-y divide-stone-100 text-sm">
              {o.inactive.map((t) => (
                <li key={t.id} className="flex justify-between py-2"><Link className="hover:underline" href={`/admin/tenants/${t.id}`}>{t.name}</Link><span className="text-stone-500">{t.lastActivity ? fmtDate(t.lastActivity) : "never"}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-2 font-medium">Recent registrations</h2>
        <ul className="divide-y divide-stone-100 text-sm">
          {o.recent.map((t) => (
            <li key={t.id} className="flex flex-wrap justify-between gap-2 py-2">
              <Link className="font-medium hover:underline" href={`/admin/tenants/${t.id}`}>{t.name}</Link>
              <span className="text-stone-500">{t.city ?? "-"} · {t.plan} · joined {fmtDate(t.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
