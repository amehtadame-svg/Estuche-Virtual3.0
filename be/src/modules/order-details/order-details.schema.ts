import { z } from 'zod';
import { databaseUuidSchema } from '../../lib/schemas';

const quantity = z.coerce.number().int().min(1).max(2147483647);
const money = z.coerce.number().finite().min(0).max(999999999999.99)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Usa como máximo dos decimales.');

export const createOrderDetailSchema = z.object({
  orderId: databaseUuidSchema,
  productId: databaseUuidSchema,
  quantity,
  unitPrice: money,
});

export const expectedOrderDetailSchema = createOrderDetailSchema.strict();
export const updateOrderDetailSchema = createOrderDetailSchema.extend({ expected: expectedOrderDetailSchema }).strict();
export const deleteOrderDetailSchema = z.object({ expected: expectedOrderDetailSchema }).strict();
