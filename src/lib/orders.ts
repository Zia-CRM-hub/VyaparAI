/** Order pipeline rules and money helpers (pure, shared by server and UI). */
export type OrderStatus =
  | "ORDER_RECEIVED" | "MEASUREMENT" | "CUTTING" | "STITCHING"
  | "TRIAL" | "ALTERATION" | "READY" | "DELIVERED" | "CANCELLED";

export const PIPELINE: OrderStatus[] = [
  "ORDER_RECEIVED", "MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "ALTERATION", "READY", "DELIVERED",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  ORDER_RECEIVED: "Order received",
  MEASUREMENT: "Measurement",
  CUTTING: "Cutting",
  STITCHING: "Stitching",
  TRIAL: "Trial",
  ALTERATION: "Alteration",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Tailwind badge classes per status (colour + text, never colour alone). */
export const STATUS_TONE: Record<OrderStatus, string> = {
  ORDER_RECEIVED: "bg-stone-200 text-stone-800",
  MEASUREMENT: "bg-sky-100 text-sky-800",
  CUTTING: "bg-indigo-100 text-indigo-800",
  STITCHING: "bg-violet-100 text-violet-800",
  TRIAL: "bg-amber-100 text-amber-800",
  ALTERATION: "bg-orange-100 text-orange-800",
  READY: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-green-200 text-green-900",
  CANCELLED: "bg-red-100 text-red-800",
};

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  ORDER_RECEIVED: ["MEASUREMENT", "CUTTING"],
  MEASUREMENT: ["CUTTING"],
  CUTTING: ["STITCHING"],
  STITCHING: ["TRIAL"],
  TRIAL: ["ALTERATION", "READY"],
  ALTERATION: ["TRIAL", "READY"],
  READY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Moves allowed from a status. Cancel is allowed until delivery. */
export function nextStatuses(from: OrderStatus): OrderStatus[] {
  const base = NEXT[from];
  return from === "DELIVERED" || from === "CANCELLED" ? base : [...base, "CANCELLED"];
}

export const canTransition = (from: OrderStatus, to: OrderStatus) => nextStatuses(from).includes(to);
export const isOpen = (s: OrderStatus) => s !== "DELIVERED" && s !== "CANCELLED";
export const IN_PRODUCTION: OrderStatus[] = ["CUTTING", "STITCHING", "TRIAL", "ALTERATION"];

/** Primary "advance" action label for a status (the one-click happy path). */
export function primaryAction(s: OrderStatus): { to: OrderStatus; label: string } | null {
  switch (s) {
    case "ORDER_RECEIVED": return { to: "MEASUREMENT", label: "Start measurement" };
    case "MEASUREMENT": return { to: "CUTTING", label: "Send to cutting" };
    case "CUTTING": return { to: "STITCHING", label: "Start stitching" };
    case "STITCHING": return { to: "TRIAL", label: "Ready for trial" };
    case "TRIAL": return { to: "READY", label: "Trial OK: mark ready" };
    case "ALTERATION": return { to: "TRIAL", label: "Alteration done: trial again" };
    case "READY": return { to: "DELIVERED", label: "Deliver" };
    default: return null;
  }
}

// ── Money: integer paise arithmetic, never floats ──

/** "1234.50" | number | Decimal-like -> integer paise. */
export function toPaise(v: { toString(): string } | number | string): bigint {
  const s = typeof v === "string" ? v : v.toString();
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?\d*$/.exec(s.trim());
  if (!m) throw new Error(`Invalid money value: ${s}`);
  const paise = BigInt(m[2]!) * 100n + BigInt((m[3] ?? "").padEnd(2, "0") || "0");
  return m[1] ? -paise : paise;
}

export function fromPaise(p: bigint): string {
  const neg = p < 0n;
  const abs = neg ? -p : p;
  return `${neg ? "-" : ""}${abs / 100n}.${String(abs % 100n).padStart(2, "0")}`;
}

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export function paymentSummary(charges: { toString(): string }, paid: { toString(): string }) {
  const c = toPaise(charges);
  const p = toPaise(paid);
  const balance = c - p;
  const paymentStatus: PaymentStatus = p <= 0n ? "UNPAID" : balance <= 0n ? "PAID" : "PARTIAL";
  return { charges: fromPaise(c), paid: fromPaise(p), balance: fromPaise(balance < 0n ? 0n : balance), paymentStatus };
}

export const PAYMENT_TONE: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-100 text-red-800",
  PARTIAL: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
};

export const inr = (v: { toString(): string } | number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number(fromPaise(toPaise(v))),
  );

export const orderLabel = (n: number) => `#${String(n).padStart(4, "0")}`;

/** Date-only helpers (promised dates are calendar dates, handled as UTC midnight). */
export const todayUtc = () => new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
export const daysUntil = (d: Date) => Math.round((d.getTime() - todayUtc().getTime()) / 86_400_000);
