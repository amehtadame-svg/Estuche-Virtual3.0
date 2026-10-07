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
  // El total lo recalcula el servidor (C-02); si el cliente lo manda se ignora.
  total: z.coerce.number().min(0).optional(),
  promotionalCodeId: z.string().uuid().optional(),
  status: z.enum(orderStatusEnum).optional(),
  details: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0).optional(),
      })
    )
    .optional(),
});

// Solo los campos que el servicio realmente persiste. `customerId` y `total`
// quedan fuera: el dueño y el importe los fija el servidor.
export const updateOrderSchema = z.object({
  status: z.enum(orderStatusEnum).optional(),
  driverId: z.string().uuid().nullable().optional(),
  deliveryAddressId: z.string().uuid().nullable().optional(),
  promotionalCodeId: z.string().uuid().nullable().optional(),
});

export const applyPromotionalCodeSchema = z.object({
  code: z.string().min(1),
});
