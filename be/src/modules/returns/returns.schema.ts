import { z } from 'zod';
import { databaseUuidSchema } from '../../lib/schemas';

export const createReturnSchema = z.object({
  orderId: databaseUuidSchema,
  productId: databaseUuidSchema,
  quantity: z.coerce.number().int().min(1).max(100000),
  reason: z.string().trim().min(3).max(50),
});

export const returnStatusEnum = ['approved', 'rejected', 'refunded'] as const;

export const resolveReturnSchema = z.object({
  status: z.enum(returnStatusEnum),
  refund: z.coerce.number().min(0).optional(),
  productCondition: z.string().max(30).optional(),
});
