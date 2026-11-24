import Link from "next/link";
import { PAYMENT_TONE, STATUS_LABEL, STATUS_TONE, type OrderStatus, type PaymentStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_TONE[status])}>{STATUS_LABEL[status]}</span>;
}

export function PayBadge({ status }: { status: PaymentStatus }) {
  const label = { UNPAID: "Unpaid", PARTIAL: "Part paid", PAID: "Paid" }[status];
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", PAYMENT_TONE[status])}>{label}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, href, tone = "default", hint }: {
  label: string; value: React.ReactNode; href?: string; tone?: "default" | "warn" | "danger" | "good"; hint?: string;
}) {
  const ring = { default: "border-stone-200", warn: "border-amber-300 bg-amber-50", danger: "border-red-300 bg-red-50", good: "border-emerald-300 bg-emerald-50" }[tone];
  const body = (
    <div className={cn("h-full rounded-xl border bg-white p-4 shadow-sm transition hover:shadow", ring)}>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Link styled as a button (server-component friendly). */
export function LinkButton({ href, children, variant = "primary", className }: {
  href: string; children: React.ReactNode; variant?: "primary" | "outline"; className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition",
        variant === "primary" ? "bg-brand text-white hover:bg-brand-dark" : "border border-stone-300 bg-white hover:bg-stone-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export function DueLabel({ daysLeft, closed }: { daysLeft: number; closed?: boolean }) {
  if (closed) return null;
  if (daysLeft < 0) return <span className="text-xs font-medium text-red-700">{-daysLeft}d overdue</span>;
  if (daysLeft === 0) return <span className="text-xs font-medium text-amber-700">Due today</span>;
  if (daysLeft <= 2) return <span className="text-xs font-medium text-amber-700">Due in {daysLeft}d</span>;
  return <span className="text-xs text-stone-500">{daysLeft}d left</span>;
}
