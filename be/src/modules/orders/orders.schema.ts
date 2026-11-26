import { z } from 'zod';

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
  deliveryAddressId: z.guid().optional(),
  total: z.coerce.number().min(0),
  promotionalCodeId: z.guid().optional(),
  status: z.enum(orderStatusEnum).optional(),
  details: z
    .array(
      z.object({
        productId: z.guid(),
        quantity: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0),
      })
    )
    .optional(),
});

export const updateOrderSchema = z.object({
  customerId: z.guid().optional(),
  driverId: z.guid().nullable().optional(),
  promotionalCodeId: z.guid().nullable().optional(),
  deliveryAddressId: z.guid().nullable().optional(),
  total: z.coerce.number().min(0).optional(),
  status: z.enum(orderStatusEnum).optional(),
});

export const applyPromotionalCodeSchema = z.object({
  code: z.string().min(1),
});
