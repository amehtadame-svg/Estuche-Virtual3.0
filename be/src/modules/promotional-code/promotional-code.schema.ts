import { z } from 'zod';

export const promotionalCodeTypeEnum = ['percentage', 'fixed'] as const;

export const createPromotionalCodeSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  type: z.enum(promotionalCodeTypeEnum),
  value: z.coerce.number().min(0),
  minPurchase: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  maxUses: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const updatePromotionalCodeSchema = createPromotionalCodeSchema.partial();

export const validatePromotionalCodeSchema = z.object({
  code: z.string().min(1),
  total: z.coerce.number().optional(),
});

export const applyPromotionalCodeSchema = z.object({
  code: z.string().min(1),
});
