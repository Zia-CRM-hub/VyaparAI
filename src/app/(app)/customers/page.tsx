import { ApiForm } from "@/components/api-form";
import { Card } from "@/components/ui/card";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { listCustomers } from "@/server/services/customers";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const ctx = await requirePageContext("customer:read");
  const customers = await listCustomers(ctx);
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Customers</h1>
      {can(ctx, "customer:write") && (
        <Card>
          <h2 className="mb-3 font-medium">Add customer</h2>
          <ApiForm
            endpoint="/api/customers"
            submitLabel="Add customer"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "phone", label: "Mobile number", type: "tel", required: true },
              { name: "email", label: "Email", type: "email" },
            ]}
          />
        </Card>
      )}
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-stone-500"><tr><th className="py-1">Name</th><th>Phone</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-stone-100"><td className="py-2">{c.name}</td><td>{c.phone}</td></tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="py-2 text-sm text-stone-500">No customers yet.</p>}
      </Card>
    </div>
  );
}
