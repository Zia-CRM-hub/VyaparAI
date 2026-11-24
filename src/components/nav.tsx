"use client";
import {
  Bell, Building2, ClipboardList, FolderKanban, Home, IndianRupee, Layers, Menu, PackageCheck, Plus, Settings,
  Shield, Users, UsersRound, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  home: Home, orders: ClipboardList, production: FolderKanban, customers: Users, delivery: PackageCheck,
  payments: IndianRupee, team: UsersRound, branches: Building2, audit: Shield, settings: Settings,
  subprojects: Layers, bell: Bell, menu: Menu, plus: Plus,
};

export interface NavItem { href: string; label: string; icon: string }

const active = (path: string, href: string) => path === href || (href !== "/dashboard" && path.startsWith(href + "/"));

/** Desktop sidebar. */
export function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="grid gap-1">
      {items.map((n) => {
        const Icon = ICONS[n.icon] ?? Home;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active(path, n.href) ? "page" : undefined}
            className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm", active(path, n.href) ? "bg-brand text-white" : "hover:bg-brand-light")}
          >
            <Icon size={18} /> {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile bottom bar: the 4 most-used destinations + a centre "new order" action. */
export function BottomNav({ items, canCreateOrder }: { items: NavItem[]; canCreateOrder: boolean }) {
  const path = usePathname();
  const pick = (h: string) => items.find((i) => i.href === h);
  const slots = [pick("/dashboard"), pick("/orders"), pick("/customers"), { href: "/menu", label: "Menu", icon: "menu" }].filter(Boolean) as NavItem[];
  const cell = (n: NavItem) => {
    const Icon = ICONS[n.icon] ?? Home;
    return (
      <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined}
        className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]", active(path, n.href) ? "font-semibold text-brand" : "text-stone-600")}>
        <Icon size={20} /> {n.label}
      </Link>
    );
  };
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 flex items-center border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {slots.slice(0, 2).map(cell)}
      {canCreateOrder && (
        <Link href="/orders/new" aria-label="New order" className="-mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-lg">
          <Plus size={28} />
        </Link>
      )}
      {slots.slice(2).map(cell)}
    </nav>
  );
}
