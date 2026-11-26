import { z } from 'zod';
import { databaseUuidSchema } from '../../lib/schemas';

export const addItemSchema = z.object({
  productId: databaseUuidSchema,
  quantity: z.coerce.number().int().min(1).optional(),
});

export const updateQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(0),
});
