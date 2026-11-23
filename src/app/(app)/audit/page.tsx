import { Card } from "@/components/ui/card";
import { requirePageContext } from "@/server/page-context";
import { listAudit } from "@/server/services/overview";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const ctx = await requirePageContext("audit:read");
  const events = await listAudit(ctx);
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Audit trail</h1>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-stone-500"><tr><th className="py-1">When (UTC)</th><th>Action</th><th>Entity</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-stone-100">
                <td className="py-2">{e.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                <td>{e.action}</td><td>{e.entityType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
