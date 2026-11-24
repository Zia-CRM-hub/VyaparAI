export type Segment = "tailor" | "boutique" | "shop" | "vendor" | "service" | "food";
export type Language = "en" | "hi" | "kn";
export type GstScheme = "none" | "regular" | "qrmp" | "composition";
export type SupplyKind = "goods" | "services" | "both";

/** What the trader tells us once, in a 6-question chat. Nothing else is needed to start. */
export interface BusinessProfile {
  name: string;
  segment: Segment;
  /** Two-letter-ish state key, e.g. "KA". Drives state-level rules (shops act, professional tax). */
  state: string;
  supply: SupplyKind;
  /** Expected annual turnover in INR (not profit). */
  annualTurnoverInr: number;
  employees: number;
  gstScheme: GstScheme;
  hasUdyam: boolean;
  hasShopLicence: boolean;
  language: Language;
}

export type Frequency = "monthly" | "quarterly" | "annual" | "one-time" | "event";

/** Draft rules are NOT legal advice until a Chartered Accountant signs them off (see docs/RULE_REVIEW.md). */
export type ReviewStatus = "draft-needs-ca-review" | "reviewed";

export interface Obligation {
  id: string;
  title: Record<Language, string>;
  /** One plain sentence: why this matters to a small trader. */
  why: Record<Language, string>;
  steps: Record<Language, string[]>;
  frequency: Frequency;
  appliesTo: (p: BusinessProfile) => boolean;
  /** Next due date on/after asOf, or null for one-time items with no date. */
  nextDue: (p: BusinessProfile, asOf: Date) => { due: Date | null; period?: string };
  portal: string;
  penaltyNote?: string;
  source: string;
  reviewStatus: ReviewStatus;
  /** Date the rule was last checked against the official source. */
  lastCheckedOn: string;
}

export type Urgency = "overdue-risk" | "this-week" | "this-month" | "later" | "todo";

export interface Reminder {
  obligationId: string;
  title: string;
  due: Date | null;
  period?: string;
  daysLeft: number | null;
  urgency: Urgency;
  obligation: Obligation;
}
