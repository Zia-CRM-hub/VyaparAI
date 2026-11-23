import { ApiForm } from "@/components/api-form";
import { Card } from "@/components/ui/card";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { listBranches } from "@/server/services/branches";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const ctx = await requirePageContext("branch:read");
  const branches = await listBranches(ctx);
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Branches</h1>
      {can(ctx, "branch:manage") && (
        <Card>
          <h2 className="mb-3 font-medium">Add branch</h2>
          <ApiForm
            endpoint="/api/branches"
            submitLabel="Add branch"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "code", label: "Code (e.g. KOR)", required: true },
              { name: "city", label: "City" },
              { name: "phone", label: "Phone", type: "tel" },
            ]}
          />
        </Card>
      )}
      <Card>
        <ul className="divide-y divide-stone-100 text-sm">
          {branches.map((b) => (
            <li key={b.id} className="py-2">{b.name} <span className="text-stone-500">({b.code}{b.city ? `, ${b.city}` : ""})</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
