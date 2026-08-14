import { z } from 'zod';

export const createOrderDetailSchema = z.object({
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const updateOrderDetailSchema = createOrderDetailSchema.partial();
