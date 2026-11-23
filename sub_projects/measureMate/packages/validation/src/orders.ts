import { z } from 'zod';
import { ORDER_STATUSES } from './workflow';
import { moneyString } from './schemas';

export const ORDER_KINDS = ['STITCHING', 'ALTERATION', 'REPAIR', 'UNIFORM', 'REPEAT'] as const;
export const ORDER_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export const orderItemInputSchema = z.object({
  garmentType: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(1000).default(1),
  unitPrice: moneyString,
  discount: moneyString.default('0'),
  /** Percent such as "18" or "12.5"; omitted means the tenant default tax percent. */
  taxPercent: z.string().regex(/^\d{1,3}(\.\d{1,4})?$/, 'Use a percentage like 18 or 12.5').optional(),
  wearerId: z.string().uuid().optional(),
  fabricSource: z.enum(['CUSTOMER', 'SHOP']).optional(),
  fabricDetails: z.string().trim().max(300).optional(),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const orderInputSchema = z.object({
  customerId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  kind: z.enum(ORDER_KINDS).default('STITCHING'),
  priority: z.enum(ORDER_PRIORITIES).default('NORMAL'),
  trialDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date').optional(),
  deliveryDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date').optional(),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(orderItemInputSchema).min(1, 'Add at least one item').max(50),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export const orderTransitionSchema = z.object({
  toStatus: z.enum(ORDER_STATUSES),
  version: z.number().int().positive(),
  note: z.string().trim().max(500).optional(),
});
export type OrderTransitionInput = z.infer<typeof orderTransitionSchema>;
