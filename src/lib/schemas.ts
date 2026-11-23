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
});

export const customerUpdateSchema = customerCreateSchema.partial().strict();

export const idParamSchema = z.object({ id: z.string().uuid() });

export type SignupInput = z.infer<typeof signupSchema>;
export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
