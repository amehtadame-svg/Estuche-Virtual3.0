import { z } from 'zod';

// Esquemas de parámetros reutilizables (validan que los IDs sean UUID).
export const uuidParam = z.object({
  id: z.string().uuid(),
});

export const uuidProductParam = z.object({
  productId: z.string().uuid(),
});
