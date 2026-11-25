import { z } from 'zod';

export const despatchStatusEnum = [
  'in_transit',
  'delivered',
  'returned',
  'canceled',
] as const;

const addressSchema = z.string().max(
  500,
  'La dirección de entrega no puede superar los 500 caracteres.'
);

export const createDespatchSchema = z.object({
  orderId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  address: addressSchema.optional(),
  status: z.enum(despatchStatusEnum).optional(),
});

export const updateDespatchSchema = z.object({
  driverId: z.string().uuid().optional(),
  address: addressSchema.optional(),
  status: z.enum(despatchStatusEnum).optional(),
  deliveredAt: z.coerce.date().optional(),
});