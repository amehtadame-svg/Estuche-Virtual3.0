import { z } from 'zod';
import { databaseUuidSchema } from '../../lib/schemas';

export const orderStatusEnum = [
  'pending',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'canceled',
  'returned',
] as const;

export const createOrderSchema = z.object({
  deliveryAddressId: databaseUuidSchema.optional(),
  total: z.coerce.number().min(0),
  promotionalCodeId: databaseUuidSchema.optional(),
  status: z.enum(orderStatusEnum).optional(),
  details: z
    .array(
      z.object({
        productId: databaseUuidSchema,
        quantity: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0),
      })
    )
    .optional(),
});

export const updateOrderSchema = z.object({
  customerId: databaseUuidSchema.optional(),
  driverId: databaseUuidSchema.nullable().optional(),
  promotionalCodeId: databaseUuidSchema.nullable().optional(),
  deliveryAddressId: databaseUuidSchema.nullable().optional(),
  total: z.coerce.number().min(0).optional(),
  status: z.enum(orderStatusEnum).optional(),
});

export const applyPromotionalCodeSchema = z.object({
  code: z.string().min(1),
});
