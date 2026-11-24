import { Bell } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BottomNav, SideNav, type NavItem } from "@/components/nav";
import { SignOutButton } from "@/components/sign-out";
import { can } from "@/server/context";
import type { Permission } from "@/server/rbac";
import { requirePageContext } from "@/server/page-context";
import { getBranding } from "@/server/services/branding";
import { getNotifications } from "@/server/services/orders";

const NAV: Array<NavItem & { perm: Permission }> = [
  { href: "/dashboard", label: "Home", icon: "home", perm: "dashboard:read" },
  { href: "/orders", label: "Orders", icon: "orders", perm: "order:read" },
  { href: "/production", label: "Production", icon: "production", perm: "order:read" },
  { href: "/customers", label: "Customers", icon: "customers", perm: "customer:read" },
  { href: "/delivery", label: "Delivery", icon: "delivery", perm: "order:read" },
  { href: "/payments", label: "Payments", icon: "payments", perm: "order:read" },
  { href: "/team", label: "Team", icon: "team", perm: "user:read" },
  { href: "/branches", label: "Branches", icon: "branches", perm: "branch:read" },
  { href: "/audit", label: "Audit", icon: "audit", perm: "audit:read" },
  { href: "/settings", label: "Settings", icon: "settings", perm: "tenant:manage" },
  { href: "/sub-projects", label: "Sub-projects", icon: "subprojects", perm: "tenant:manage" },
];

const BANNER: Record<string, string> = {
  info: "bg-sky-100 text-sky-900",
  promo: "bg-amber-100 text-amber-900",
  warning: "bg-red-100 text-red-900",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePageContext();
  const [brand, notices] = await Promise.all([getBranding(ctx.tenantId), getNotifications(ctx)]);
  const items = NAV.filter((n) => can(ctx, n.perm));
  const urgent = notices.filter((n) => n.severity !== "info").length;

  return (
    <div style={{ "--brand": brand.brandColor } as CSSProperties} className="min-h-screen">
      {brand.bannerEnabled && brand.bannerText && (
        <div role="status" className={`px-4 py-2 text-center text-sm ${BANNER[brand.bannerTone] ?? BANNER.info}`}>{brand.bannerText}</div>
      )}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-2">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          {brand.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoDataUrl} alt={`${brand.name} logo`} className="h-9 w-9 rounded object-contain" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded bg-brand font-semibold text-white">{brand.name.slice(0, 1)}</span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-semibold">{brand.name}</span>
            <span className="block truncate text-xs text-stone-500">{ctx.userName} · {ctx.roleKey.replaceAll("_", " ").toLowerCase()}</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/notifications" aria-label={`Notifications${urgent ? `, ${urgent} need attention` : ""}`} className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-stone-100">
            <Bell size={20} />
            {urgent > 0 && <span className="absolute right-1 top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">{urgent > 99 ? "99+" : urgent}</span>}
          </Link>
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-24 pt-4 md:pb-8">
        <aside className="hidden w-52 shrink-0 md:block"><div className="sticky top-20"><SideNav items={items} /></div></aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <BottomNav items={items} canCreateOrder={can(ctx, "order:write")} />
    </div>
  );
}
