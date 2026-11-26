import { z } from 'zod';

export const createProviderSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(255).optional(),
  address: z.string().max(255).optional(),
});

export const updateProviderSchema = createProviderSchema.partial();
