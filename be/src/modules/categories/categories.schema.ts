import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es obligatorio').max(150),
  description: z.string().max(500).optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();