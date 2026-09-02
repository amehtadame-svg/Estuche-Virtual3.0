import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0),
  categoryId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  stock: z.coerce.number().int().optional(),
  stockMin: z.coerce.number().int().optional(),
  imageUrl: z.string().url().max(500).optional(),
});

export const updateProductSchema = createProductSchema.partial();