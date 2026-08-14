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
  deliveryAddressId: z.string().uuid().optional(),
  total: z.coerce.number().min(0),
  promotionalCodeId: z.string().uuid().optional(),
  status: z.enum(orderStatusEnum).optional(),
  details: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0),
      })
    )
    .optional(),
});

export const updateOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  driverId: z.string().uuid().nullable().optional(),
  promotionalCodeId: z.string().uuid().nullable().optional(),
  deliveryAddressId: z.string().uuid().nullable().optional(),
  total: z.coerce.number().min(0).optional(),
  status: z.enum(orderStatusEnum).optional(),
});

export const applyPromotionalCodeSchema = z.object({
  code: z.string().min(1),
});
