import { z } from 'zod';
import { databaseUuidSchema } from '../../lib/schemas';

export const createOrderDetailSchema = z.object({
  orderId: databaseUuidSchema,
  productId: databaseUuidSchema,
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const updateOrderDetailSchema = createOrderDetailSchema.partial();
