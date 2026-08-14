import { z } from 'zod';

export const returnStatusEnum = ['approved', 'rejected', 'refunded'] as const;

export const resolveReturnSchema = z.object({
  status: z.enum(returnStatusEnum),
  refund: z.coerce.number().min(0).optional(),
  productCondition: z.string().max(30).optional(),
});
