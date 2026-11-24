import Link from "next/link";
import { PageHeader } from "@/components/ui/bits";
import { can } from "@/server/context";
import type { Permission } from "@/server/rbac";
import { requirePageContext } from "@/server/page-context";

const ITEMS: Array<[string, string, Permission]> = [
  ["/production", "Production board", "order:read"],
  ["/delivery", "Delivery", "order:read"],
  ["/payments", "Payments", "order:read"],
  ["/notifications", "Notifications", "dashboard:read"],
  ["/team", "Team", "user:read"],
  ["/branches", "Branches", "branch:read"],
  ["/audit", "Audit trail", "audit:read"],
  ["/settings", "Settings and branding", "tenant:manage"],
];

/** Mobile overflow: everything not on the bottom bar. */
export default async function MenuPage() {
  const ctx = await requirePageContext();
  return (
    <div className="grid gap-4">
      <PageHeader title="Menu" />
      <ul className="grid gap-2">
        {ITEMS.filter(([, , p]) => can(ctx, p)).map(([href, label]) => (
          <li key={href}><Link href={href} className="flex min-h-12 items-center rounded-xl border border-stone-200 bg-white px-4 shadow-sm">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
