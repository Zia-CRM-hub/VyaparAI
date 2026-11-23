import { Card } from "@/components/ui/card";
import { requirePageContext } from "@/server/page-context";
import { getDashboard } from "@/server/services/overview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requirePageContext("dashboard:read");
  const d = await getDashboard(ctx);
  const stats = [
    ["Customers", d.counts.customers],
    ["Branches", d.counts.branches],
    ["Team members", d.counts.team],
  ] as const;
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Welcome, {d.me.name}</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(([label, n]) =>
          n === null ? null : (
            <Card key={label}>
              <p className="text-sm text-stone-500">{label}</p>
              <p className="text-3xl font-semibold">{n}</p>
            </Card>
          ),
        )}
      </div>
      {d.subscription && (
        <Card>
          <p className="text-sm">
            Plan: <b>{d.subscription.plan}</b> ({d.subscription.status.toLowerCase()})
            {d.subscription.trialEndsAt && ` · trial ends ${d.subscription.trialEndsAt.toISOString().slice(0, 10)}`}
          </p>
        </Card>
      )}
      <Card>
        <h2 className="mb-2 font-medium">Recent customers</h2>
        {d.recentCustomers.length === 0 ? (
          <p className="text-sm text-stone-500">No customers yet.</p>
        ) : (
          <ul className="text-sm">
            {d.recentCustomers.map((c) => (
              <li key={c.id} className="py-1">{c.name}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
