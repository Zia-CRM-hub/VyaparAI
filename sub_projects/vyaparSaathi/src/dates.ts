const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
export const startOfDay = (d: Date) => utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
export const fmt = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
export const monthLabel = (y: number, m: number) => `${MONTHS[((m % 12) + 12) % 12]} ${y + Math.floor(m / 12)}`;

/** Monthly deadline on `day` of each month, covering the previous month. Returns the next one on/after asOf. */
export function nextMonthly(day: number, asOf: Date) {
  const a = startOfDay(asOf);
  let y = a.getUTCFullYear();
  let m = a.getUTCMonth();
  if (a.getUTCDate() > day) m += 1;
  const due = utc(y, m, day);
  return { due, period: monthLabel(y, m - 1) };
}

/** Quarterly deadline: `day` of the month after each quarter end (Apr, Jul, Oct, Jan). */
export function nextQuarterly(day: number, asOf: Date) {
  const a = startOfDay(asOf);
  const y = a.getUTCFullYear();
  const candidates = [utc(y, 0, day), utc(y, 3, day), utc(y, 6, day), utc(y, 9, day), utc(y + 1, 0, day)];
  const due = candidates.find((c) => c.getTime() >= a.getTime())!;
  const qEndMonth = due.getUTCMonth() - 1; // quarter ended last month
  const label = `quarter ended ${monthLabel(due.getUTCFullYear(), qEndMonth)}`;
  return { due, period: label };
}

/** Yearly deadline on month/day (month 0-based). */
export function nextAnnual(month: number, day: number, asOf: Date) {
  const a = startOfDay(asOf);
  let due = utc(a.getUTCFullYear(), month, day);
  if (due.getTime() < a.getTime()) due = utc(a.getUTCFullYear() + 1, month, day);
  return { due };
}
