import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).optional(),
});

export const updateQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(0),
});
