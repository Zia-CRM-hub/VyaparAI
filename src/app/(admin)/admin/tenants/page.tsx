import Link from "next/link";
import { fmtDate, PageHeader } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { inr } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { requirePlatformPage } from "@/server/page-context";
import { listTenants } from "@/server/services/platform";

export const dynamic = "force-dynamic";

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const admin = await requirePlatformPage();
  const status = sp.status === "ACTIVE" || sp.status === "SUSPENDED" ? sp.status : undefined;
  const rows = await listTenants(admin, { q: sp.q?.trim() || undefined, status });
  const chip = (label: string, s?: string) => (
    <Link href={`/admin/tenants?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(s ? { status: s } : {}) })}`} className={cn("chip", sp.status === s || (!sp.status && !s) ? "chip-on" : "")}>{label}</Link>
  );

  return (
    <div className="grid gap-4">
      <PageHeader title="Businesses" subtitle={`${rows.length} shown`} />
      <form action="/admin/tenants" className="flex gap-2">
        <input name="q" defaultValue={sp.q} className="field mt-0 flex-1" placeholder="Search business name" aria-label="Search businesses" />
        {status && <input type="hidden" name="status" value={status} />}
        <button className="min-h-11 rounded-lg bg-stone-900 px-4 text-sm font-medium text-white">Search</button>
      </form>
      <div className="flex gap-2">{chip("All")}{chip("Active", "ACTIVE")}{chip("Suspended", "SUSPENDED")}</div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="bg-stone-100 text-xs uppercase text-stone-500">
            <tr><th className="p-3">Business</th><th>Status</th><th>Plan</th><th className="text-right">Users</th><th className="text-right">Customers</th><th className="text-right">Orders</th><th className="text-right">Collected</th><th className="text-right">Outstanding</th><th className="pr-3 text-right">Last activity</th></tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-stone-100">
                <td className="p-3"><Link href={`/admin/tenants/${t.id}`} className="font-medium hover:underline">{t.name}</Link><span className="block text-xs text-stone-500">{t.city ?? "-"} · joined {fmtDate(t.createdAt)}</span></td>
                <td><span className={cn("rounded-full px-2 py-0.5 text-xs", t.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{t.status === "ACTIVE" ? "Active" : "Suspended"}</span></td>
                <td>{t.plan}</td>
                <td className="text-right tabular-nums">{t.users}</td><td className="text-right tabular-nums">{t.customers}</td><td className="text-right tabular-nums">{t.orders}</td>
                <td className="text-right tabular-nums">{inr(t.revenue)}</td><td className="text-right tabular-nums">{inr(t.outstanding)}</td>
                <td className="pr-3 text-right text-stone-500">{t.lastActivity ? fmtDate(t.lastActivity) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
