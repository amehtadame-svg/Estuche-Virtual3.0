import { z } from 'zod';

export const pqrTypeValues = ['petition', 'complaint', 'claim'] as const;

export const pqrStatusValues = [
  'received',
  'in_progress',
  'answered',
  'closed',
] as const;

export const createPqrSchema = z.object({
  type: z.enum(pqrTypeValues),
  subject: z
    .string()
    .trim()
    .min(5, 'Escribe un asunto de al menos 5 caracteres.')
    .max(160),
  description: z
    .string()
    .trim()
    .min(20, 'Describe tu solicitud con al menos 20 caracteres.')
    .max(5000),
});

export const updatePqrSchema = z.object({
  status: z.enum(pqrStatusValues),
  response: z.string().trim().max(5000).optional(),
});