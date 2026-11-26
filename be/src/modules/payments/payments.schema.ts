import { z } from 'zod';

export const demoOutcome = z.enum(['approved', 'rejected', 'pending']);
export const demoKeyParams = z.object({ key: z.string().uuid() });
export const demoCheckoutSchema = z.object({
  requestKey: z.string().uuid(),
  method: z.enum(['tarjeta', 'pse', 'nequi']),
  outcome: demoOutcome,
  address: z.string().trim().min(5).max(255),
  phone: z.string().trim().regex(/^3\d{9}$/, 'Introduce un celular colombiano de 10 dígitos.'),
  code: z.string().trim().min(1).max(50).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(999),
  }).strict()).min(1).max(100),
}).strict().refine(
  (data) => new Set(data.items.map((item) => item.productId)).size === data.items.length,
  'No se permiten productos repetidos.'
);
export const demoResolveSchema = z.object({
  outcome: z.enum(['approved', 'rejected']),
}).strict();

export type DemoCheckout = z.infer<typeof demoCheckoutSchema>;
