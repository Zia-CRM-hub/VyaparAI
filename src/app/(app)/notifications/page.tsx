import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui/bits";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { requirePageContext } from "@/server/page-context";
import { getNotifications } from "@/server/services/orders";

export const dynamic = "force-dynamic";

const DOT = { high: "bg-red-600", medium: "bg-amber-500", info: "bg-sky-500" } as const;
const WORD = { high: "Urgent", medium: "Soon", info: "FYI" } as const;

export default async function NotificationsPage() {
  const ctx = await requirePageContext();
  const notices = await getNotifications(ctx);
  return (
    <div className="grid gap-4">
      <PageHeader title="Notifications" subtitle="Generated live from your orders: overdue, due soon, balances and trials" />
      <Card className="p-2 sm:p-4">
        {notices.length === 0 ? <EmptyState title="You are all caught up" /> : (
          <ul className="divide-y divide-stone-100">
            {notices.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className="flex items-start gap-3 py-3 hover:bg-stone-50">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", DOT[n.severity])} aria-hidden />
                  <span><span className="sr-only">{WORD[n.severity]}: </span><span className="font-medium">{n.title}</span><span className="block text-sm text-stone-500">{n.detail}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
