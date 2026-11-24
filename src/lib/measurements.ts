/**
 * Default measurement templates. Pure data + functions, shared by server validation and the UI.
 * Selecting gender + age group + garment resolves the template (field list) automatically.
 * All lengths are centimetres. Tenant-specific custom templates are a later phase.
 */
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type AgeGroup = "BABY" | "KID" | "TEEN" | "ADULT" | "SENIOR";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
];

export const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "BABY", label: "Baby (0-2)" },
  { value: "KID", label: "Kid (3-12)" },
  { value: "TEEN", label: "Teen (13-17)" },
  { value: "ADULT", label: "Adult (18-59)" },
  { value: "SENIOR", label: "Senior (60+)" },
];

export interface MeasureField {
  key: string;
  label: string;
  /** Hidden for BABY/KID templates. */
  adultOnly?: boolean;
}

export interface Garment {
  key: string;
  label: string;
  /** Genders this garment is normally made for (OTHER sees everything). */
  genders: ("MALE" | "FEMALE")[];
  ages: AgeGroup[];
  fields: MeasureField[];
}

const f = (key: string, label: string, adultOnly = false): MeasureField => ({ key, label, adultOnly });
const ALL: AgeGroup[] = ["BABY", "KID", "TEEN", "ADULT", "SENIOR"];
const KID_UP: AgeGroup[] = ["KID", "TEEN", "ADULT", "SENIOR"];
const TEEN_UP: AgeGroup[] = ["TEEN", "ADULT", "SENIOR"];

export const GARMENTS: Garment[] = [
  {
    key: "blouse", label: "Blouse", genders: ["FEMALE"], ages: TEEN_UP,
    fields: [f("bust", "Bust"), f("waist", "Waist"), f("shoulder", "Shoulder"), f("sleeve_length", "Sleeve length"),
      f("sleeve_round", "Sleeve round"), f("armhole", "Armhole"), f("front_length", "Front length"),
      f("back_length", "Back length"), f("front_neck", "Front neck depth"), f("back_neck", "Back neck depth")],
  },
  {
    key: "kurti", label: "Kurti", genders: ["FEMALE"], ages: KID_UP,
    fields: [f("bust", "Bust"), f("waist", "Waist"), f("hip", "Hip"), f("shoulder", "Shoulder"),
      f("sleeve_length", "Sleeve length"), f("length", "Kurti length"), f("armhole", "Armhole", true), f("neck", "Neck depth")],
  },
  {
    key: "salwar_suit", label: "Salwar suit", genders: ["FEMALE"], ages: KID_UP,
    fields: [f("bust", "Bust"), f("waist", "Waist"), f("hip", "Hip"), f("shoulder", "Shoulder"),
      f("sleeve_length", "Sleeve length"), f("top_length", "Top length"), f("bottom_length", "Bottom length"),
      f("thigh", "Thigh", true), f("ankle", "Ankle / bottom round")],
  },
  {
    key: "lehenga", label: "Lehenga", genders: ["FEMALE"], ages: KID_UP,
    fields: [f("bust", "Bust"), f("waist", "Waist"), f("hip", "Hip"), f("shoulder", "Shoulder"),
      f("blouse_length", "Blouse length"), f("skirt_length", "Skirt length"), f("sleeve_length", "Sleeve length"),
      f("armhole", "Armhole", true)],
  },
  {
    key: "gown", label: "Gown", genders: ["FEMALE"], ages: KID_UP,
    fields: [f("bust", "Bust"), f("waist", "Waist"), f("hip", "Hip"), f("shoulder", "Shoulder"),
      f("sleeve_length", "Sleeve length"), f("gown_length", "Gown length"), f("bust_point", "Bust point", true)],
  },
  {
    key: "palazzo", label: "Palazzo / pant", genders: ["FEMALE"], ages: TEEN_UP,
    fields: [f("waist", "Waist"), f("hip", "Hip"), f("length", "Length"), f("thigh", "Thigh"), f("bottom", "Bottom round")],
  },
  {
    key: "frock", label: "Frock", genders: ["FEMALE"], ages: ["BABY", "KID"],
    fields: [f("chest", "Chest"), f("waist", "Waist"), f("shoulder", "Shoulder"), f("length", "Length"), f("sleeve_length", "Sleeve length")],
  },
  {
    key: "shirt", label: "Shirt", genders: ["MALE"], ages: KID_UP,
    fields: [f("chest", "Chest"), f("waist", "Waist"), f("hip", "Hip", true), f("shoulder", "Shoulder"),
      f("sleeve_length", "Sleeve length"), f("length", "Shirt length"), f("neck", "Neck"), f("bicep", "Bicep", true), f("cuff", "Cuff", true)],
  },
  {
    key: "trouser", label: "Trouser", genders: ["MALE"], ages: KID_UP,
    fields: [f("waist", "Waist"), f("hip", "Hip"), f("length", "Length"), f("inseam", "Inseam"),
      f("thigh", "Thigh", true), f("knee", "Knee", true), f("bottom", "Bottom")],
  },
  {
    key: "suit", label: "Suit (2-piece)", genders: ["MALE"], ages: TEEN_UP,
    fields: [f("chest", "Chest"), f("waist", "Waist"), f("hip", "Hip"), f("shoulder", "Shoulder"),
      f("sleeve_length", "Sleeve length"), f("jacket_length", "Jacket length"), f("neck", "Neck"),
      f("trouser_waist", "Trouser waist"), f("trouser_length", "Trouser length"), f("inseam", "Inseam")],
  },
  {
    key: "kurta_pyjama", label: "Kurta / pyjama", genders: ["MALE", "FEMALE"], ages: ALL,
    fields: [f("chest", "Chest"), f("waist", "Waist"), f("hip", "Hip", true), f("shoulder", "Shoulder"),
      f("sleeve_length", "Sleeve length"), f("kurta_length", "Kurta length"), f("neck", "Neck"),
      f("pyjama_length", "Pyjama length"), f("pyjama_waist", "Pyjama waist")],
  },
  {
    key: "sherwani", label: "Sherwani", genders: ["MALE"], ages: KID_UP,
    fields: [f("chest", "Chest"), f("waist", "Waist"), f("hip", "Hip"), f("shoulder", "Shoulder"),
      f("sleeve_length", "Sleeve length"), f("length", "Sherwani length"), f("neck", "Neck"), f("bicep", "Bicep", true)],
  },
  {
    key: "shorts", label: "Shorts", genders: ["MALE"], ages: ["BABY", "KID", "TEEN"],
    fields: [f("waist", "Waist"), f("hip", "Hip"), f("length", "Length")],
  },
];

export const GARMENT_BY_KEY = new Map(GARMENTS.map((g) => [g.key, g]));
export const garmentLabel = (key: string) => GARMENT_BY_KEY.get(key)?.label ?? key;

/** Garments suitable for this person. "OTHER" gender can choose from anything that fits the age. */
export function garmentsFor(gender: Gender, ageGroup: AgeGroup): Garment[] {
  return GARMENTS.filter(
    (g) => g.ages.includes(ageGroup) && (gender === "OTHER" || g.genders.includes(gender)),
  );
}

export interface ResolvedTemplate {
  garment: Garment;
  fields: MeasureField[];
  unit: "cm";
  hints: string[];
}

/** The default template for gender + age group + garment, or null if that combination is not offered. */
export function getTemplate(garmentKey: string, gender: Gender, ageGroup: AgeGroup): ResolvedTemplate | null {
  const garment = GARMENT_BY_KEY.get(garmentKey);
  if (!garment || !garmentsFor(gender, ageGroup).some((g) => g.key === garmentKey)) return null;
  const child = ageGroup === "BABY" || ageGroup === "KID";
  const hints: string[] = [];
  if (child) hints.push("Children grow fast: consider adding growth allowance in the notes.");
  if (ageGroup === "SENIOR") hints.push("Check comfort ease for seating and arm movement.");
  return { garment, fields: garment.fields.filter((x) => !(child && x.adultOnly)), unit: "cm", hints };
}

export class MeasurementError extends Error {}

/** Validates and normalises values against the resolved template. Returns clean {key: cm}. */
export function cleanMeasurements(
  template: ResolvedTemplate,
  values: Record<string, unknown>,
): Record<string, number> {
  const allowed = new Set(template.fields.map((x) => x.key));
  const out: Record<string, number> = {};
  for (const [k, raw] of Object.entries(values)) {
    if (raw === "" || raw === null || raw === undefined) continue;
    if (!allowed.has(k)) throw new MeasurementError(`"${k}" is not part of the ${template.garment.label} template`);
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > 300) throw new MeasurementError(`"${k}" must be between 0 and 300 cm`);
    out[k] = Math.round(n * 10) / 10;
  }
  if (Object.keys(out).length === 0) throw new MeasurementError("Enter at least one measurement");
  return out;
}

export function sameMeasurements(a: Record<string, number>, b: Record<string, number>): boolean {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}
