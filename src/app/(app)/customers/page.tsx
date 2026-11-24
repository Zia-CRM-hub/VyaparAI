import Link from "next/link";
import { ApiForm } from "@/components/api-form";
import { EmptyState, PageHeader } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { AGE_GROUP_OPTIONS, GENDER_OPTIONS } from "@/lib/measurements";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { listCustomers } from "@/server/services/customers";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; new?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext("customer:read");
  const customers = await listCustomers(ctx, { q: sp.q });
  const canWrite = can(ctx, "customer:write");

  return (
    <div className="grid gap-4">
      <PageHeader title="Customers" subtitle={`${customers.length} shown`} actions={canWrite && <Link href="/customers?new=1#add" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white">+ Add customer</Link>} />

      <form action="/customers" className="flex gap-2">
        <input name="q" defaultValue={sp.q} className="field mt-0 flex-1" placeholder="Search by name or phone" aria-label="Search customers" />
        <button className="min-h-11 rounded-lg bg-brand px-4 text-sm font-medium text-white">Search</button>
      </form>

      {canWrite && sp.new && (
        <Card id="add">
          <h2 className="mb-3 font-medium">Add customer</h2>
          <ApiForm
            endpoint="/api/customers"
            submitLabel="Save customer"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "phone", label: "Mobile number", type: "tel", required: true },
              { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS, defaultValue: "FEMALE", required: true },
              { name: "ageGroup", label: "Age group", type: "select", options: AGE_GROUP_OPTIONS, defaultValue: "ADULT", required: true },
              { name: "email", label: "Email (optional)", type: "email" },
            ]}
          />
        </Card>
      )}

      {customers.length === 0 ? (
        <EmptyState title="No customers found" hint="Add your first customer to start taking orders." />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <li key={c.id}>
              <Link href={`/customers/${c.id}`} className="block rounded-xl border border-stone-200 bg-white p-3 shadow-sm hover:shadow">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-stone-500">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
