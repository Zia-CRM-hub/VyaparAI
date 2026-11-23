import { Card } from "@/components/ui/card";
import { SUB_PROJECTS, type FeatureStatus } from "@/lib/sub-projects";
import { requirePageContext } from "@/server/page-context";

const LABEL: Record<FeatureStatus, string> = {
  "done-in-core": "Built in core",
  planned: "Planned",
  reference: "Reference",
};
const COLOR: Record<FeatureStatus, string> = {
  "done-in-core": "bg-green-100 text-green-800",
  planned: "bg-amber-100 text-amber-800",
  reference: "bg-stone-200 text-stone-700",
};

export default async function SubProjectsPage() {
  await requirePageContext("tenant:manage");
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Sub-projects</h1>
      <p className="text-sm text-stone-600">Projects under the VyaparAI vision and how their features connect to the platform.</p>
      {SUB_PROJECTS.map((p) => (
        <Card key={p.slug} className="grid gap-3">
          <div>
            <h2 className="font-semibold text-brand">{p.name}</h2>
            <p className="text-sm">{p.summary}</p>
            <p className="mt-1 text-xs text-stone-500">{p.stack} · <code>{p.folder}</code></p>
            <p className="text-xs text-stone-500">{p.status}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-stone-500">
                <tr><th className="py-1">Feature</th><th>VyaparAI domain</th><th>Phase</th><th>Status</th></tr>
              </thead>
              <tbody>
                {p.features.map((f) => (
                  <tr key={f.name} className="border-t border-stone-100 align-top">
                    <td className="py-2 pr-2">{f.name}<span className="block text-xs text-stone-500">{f.note}</span></td>
                    <td className="pr-2">{f.vyaparDomain}</td>
                    <td className="pr-2">{f.phase}</td>
                    <td><span className={`rounded px-2 py-0.5 text-xs ${COLOR[f.status]}`}>{LABEL[f.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
