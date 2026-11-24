import { z } from "zod";
import { ROLE_KEYS } from "@/server/rbac";

const trimmed = (max: number, min = 1) => z.string().trim().min(min).max(max);

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Include letters and numbers");

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

/** Indian mobile numbers, normalised to E.164 (+91XXXXXXXXXX). */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+91|91|0)?[6-9]\d{9}$/.test(v), "Enter a valid Indian mobile number")
  .transform((v) => `+91${v.slice(-10)}`);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const signupSchema = z.object({
  businessName: trimmed(120, 2),
  ownerName: trimmed(100, 2),
  email: emailSchema,
  password: passwordSchema,
  city: trimmed(80).optional(),
});

export const branchCreateSchema = z.object({
  name: trimmed(100, 2),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,12}$/, "2-12 letters, digits or dashes"),
  city: trimmed(80).optional(),
  address: trimmed(300).optional(),
  phone: phoneSchema.optional(),
});

export const memberCreateSchema = z.object({
  name: trimmed(100, 2),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(ROLE_KEYS),
  allBranches: z.boolean().default(false),
  branchIds: z.array(z.string().uuid()).max(50).default([]),
});

export const customerCreateSchema = z.object({
  name: trimmed(120, 2),
  phone: phoneSchema,
  email: emailSchema.optional(),
  branchId: z.string().uuid().optional(),
  preferredLanguage: z.enum(["en", "hi", "kn", "ur"]).default("en"),
  notes: trimmed(1000).optional(),
  /** If both are given, a "Self" family member is created with the customer (fewer clicks). */
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  ageGroup: z.enum(["BABY", "KID", "TEEN", "ADULT", "SENIOR"]).optional(),
});

export const customerUpdateSchema = customerCreateSchema.omit({ gender: true, ageGroup: true }).partial().strict();

export const RELATIONS = ["Self", "Spouse", "Son", "Daughter", "Mother", "Father", "Sibling", "Other"] as const;

export const familyMemberCreateSchema = z.object({
  name: trimmed(100, 2),
  relation: z.enum(RELATIONS).default("Other"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  ageGroup: z.enum(["BABY", "KID", "TEEN", "ADULT", "SENIOR"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: trimmed(500).optional(),
});

/** Money: positive, max 2 decimals, kept as a string end to end (never a float). */
export const moneySchema = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{1,9}(\.\d{1,2})?$/.test(v), "Enter an amount with at most 2 decimals")
  .refine((v) => Number(v) > 0, "Amount must be greater than zero");

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
export const paymentMethodSchema = z.enum(["CASH", "UPI", "CARD", "BANK"]);

export const measurementSaveSchema = z.object({
  garment: trimmed(40),
  values: z.record(z.string().max(40), z.union([z.number(), z.string()])),
  notes: trimmed(500).optional(),
});

export const orderCreateSchema = z.object({
  customerId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  garment: trimmed(40),
  description: trimmed(500).optional(),
  branchId: z.string().uuid().optional(),
  promisedDate: dateOnly,
  assignedMembershipId: z.string().uuid().optional(),
  charges: moneySchema,
  advance: z.object({ amount: moneySchema, method: paymentMethodSchema, reference: trimmed(80).optional() }).optional(),
  measurement: z.object({ values: z.record(z.string().max(40), z.union([z.number(), z.string()])), notes: trimmed(500).optional() }).optional(),
});

export const orderUpdateSchema = z
  .object({
    assignedMembershipId: z.string().uuid().nullable(),
    promisedDate: dateOnly,
    charges: moneySchema,
    description: trimmed(500),
  })
  .partial()
  .strict();

export const orderStatusSchema = z.object({
  to: z.enum(["ORDER_RECEIVED", "MEASUREMENT", "CUTTING", "STITCHING", "TRIAL", "ALTERATION", "READY", "DELIVERED", "CANCELLED"]),
  note: trimmed(300).optional(),
});

export const paymentCreateSchema = z.object({
  amount: moneySchema,
  method: paymentMethodSchema,
  reference: trimmed(80).optional(),
  note: trimmed(200).optional(),
  idempotencyKey: trimmed(80).optional(),
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #7c2d5b");
export const brandingSchema = z.object({
  name: trimmed(120, 2),
  phone: phoneSchema.nullable().optional(),
  address: trimmed(300).nullable().optional(),
  city: trimmed(80).nullable().optional(),
  gstin: z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid GSTIN").nullable().optional(),
  brandColor: hexColor,
  bannerEnabled: z.boolean(),
  bannerText: trimmed(200).nullable().optional(),
  bannerTone: z.enum(["info", "promo", "warning"]),
  /** data:image/png|jpeg|webp;base64,... (max ~150 KB). null removes the logo, undefined keeps it. */
  logoDataUrl: z.string().max(210_000).nullable().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export type SignupInput = z.infer<typeof signupSchema>;
export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type FamilyMemberInput = z.infer<typeof familyMemberCreateSchema>;
export type MeasurementSaveInput = z.infer<typeof measurementSaveSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
