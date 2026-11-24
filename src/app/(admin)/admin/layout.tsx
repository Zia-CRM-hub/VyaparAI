import Link from "next/link";
import { SignOutButton } from "@/components/sign-out";
import { requirePlatformPage } from "@/server/page-context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformPage();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-3 bg-stone-900 px-4 py-2 text-white">
        <div className="flex items-center gap-4">
          <span className="font-semibold">VyaparAI Platform</span>
          <nav aria-label="Super admin" className="flex gap-1 text-sm">
            <Link href="/admin" className="rounded px-3 py-2 hover:bg-stone-700">Overview</Link>
            <Link href="/admin/tenants" className="rounded px-3 py-2 hover:bg-stone-700">Businesses</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline text-stone-300">{admin.email}</span>
          <span className="[&_button]:text-white [&_button:hover]:bg-stone-700"><SignOutButton /></span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5">{children}</main>
    </div>
  );
}
