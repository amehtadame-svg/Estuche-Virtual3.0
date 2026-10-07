import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0),
  // `null` explícito sí limpia la relación; ausente la deja intacta.
  categoryId: z.string().uuid().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  stockMin: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().url().max(500).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const adjustStockSchema = z.object({
  delta: z.coerce.number().int(),
  reason: z.string().max(500).optional(),
});
