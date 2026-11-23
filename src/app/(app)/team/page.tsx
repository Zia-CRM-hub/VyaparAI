import { Card } from "@/components/ui/card";
import { TeamForm } from "@/components/team-form";
import { can } from "@/server/context";
import { requirePageContext } from "@/server/page-context";
import { ROLE_NAMES, assignableRoles } from "@/server/rbac";
import { listBranches } from "@/server/services/branches";
import { listMembers } from "@/server/services/team";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const ctx = await requirePageContext("user:read");
  const [members, branches] = await Promise.all([listMembers(ctx), listBranches(ctx)]);
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Team</h1>
      {can(ctx, "user:manage") && (
        <Card>
          <h2 className="mb-3 font-medium">Add team member</h2>
          <TeamForm
            roles={assignableRoles(ctx.roleKey).map((r) => ({ value: r, label: ROLE_NAMES[r] }))}
            branches={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Card>
      )}
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-stone-500"><tr><th className="py-1">Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-stone-100">
                <td className="py-2">{m.user.name}</td><td>{m.user.email}</td><td>{m.role.name}</td><td>{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
