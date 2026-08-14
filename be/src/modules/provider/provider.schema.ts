import { z } from 'zod';

export const createProviderSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const updateProviderSchema = createProviderSchema.partial();
