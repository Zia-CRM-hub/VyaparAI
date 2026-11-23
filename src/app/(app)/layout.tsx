import Link from "next/link";
import { SignOutButton } from "@/components/sign-out";
import { can } from "@/server/context";
import type { Permission } from "@/server/rbac";
import { requirePageContext } from "@/server/page-context";

const NAV: Array<{ href: string; label: string; perm: Permission }> = [
  { href: "/dashboard", label: "Dashboard", perm: "dashboard:read" },
  { href: "/customers", label: "Customers", perm: "customer:read" },
  { href: "/branches", label: "Branches", perm: "branch:read" },
  { href: "/team", label: "Team", perm: "user:read" },
  { href: "/audit", label: "Audit", perm: "audit:read" },
  { href: "/sub-projects", label: "Sub-projects", perm: "tenant:manage" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePageContext();
  const items = NAV.filter((n) => can(ctx, n.perm));
  return (
    <div className="mx-auto max-w-5xl px-4 pb-8">
      <header className="flex items-center justify-between py-3">
        <div>
          <p className="font-semibold text-brand">{ctx.tenantName}</p>
          <p className="text-xs text-stone-500">{ctx.userName} · {ctx.roleKey.replace("_", " ")}</p>
        </div>
        <SignOutButton />
      </header>
      <nav className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200 pb-2" aria-label="Main">
        {items.map((n) => (
          <Link key={n.href} href={n.href} className="min-h-11 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm hover:bg-stone-200">
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
