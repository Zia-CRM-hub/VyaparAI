import type { BusinessProfile, Language, Reminder, Urgency } from "./types.js";
import { OBLIGATIONS } from "./rules/index.js";
import { daysBetween } from "./dates.js";

export const DISCLAIMER =
  "General guidance, not legal or tax advice. Dates and limits change. Confirm with a Chartered Accountant or the official portal before you act.";

function urgency(daysLeft: number | null): Urgency {
  if (daysLeft === null) return "todo";
  if (daysLeft <= 3) return "overdue-risk";
  if (daysLeft <= 7) return "this-week";
  if (daysLeft <= 31) return "this-month";
  return "later";
}

const ORDER: Urgency[] = ["overdue-risk", "this-week", "this-month", "todo", "later"];

/** Everything this trader should be doing, most urgent first. */
export function remindersFor(profile: BusinessProfile, asOf: Date, lang: Language = profile.language): Reminder[] {
  return OBLIGATIONS.filter((o) => o.appliesTo(profile))
    .map((o): Reminder => {
      const { due, period } = o.nextDue(profile, asOf);
      const daysLeft = due ? daysBetween(asOf, due) : null;
      return { obligationId: o.id, title: o.title[lang], due, period, daysLeft, urgency: urgency(daysLeft), obligation: o };
    })
    .sort((a, b) => ORDER.indexOf(a.urgency) - ORDER.indexOf(b.urgency) || (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
}
