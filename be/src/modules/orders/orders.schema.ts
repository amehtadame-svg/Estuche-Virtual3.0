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

export const fulfillmentMethodEnum = [
  'delivery',
  'pickup',
] as const;

/**
 * A-01/A-02/A-03: una venta siempre lleva al menos una línea y una dirección
 * cuando es domicilio. `total` y `unitPrice` se siguen aceptando por
 * compatibilidad con clientes anteriores, pero el servidor los IGNORA:
 * precios, descuentos y total se calculan exclusivamente en la BD.
 */
const orderLineSchema = z
  .object({
    productId: databaseUuidSchema,
    quantity: z.coerce.number().int().min(1).max(999),
    unitPrice: z.coerce.number().min(0).optional(),
  })
  .strict();

export const createOrderSchema = z
  .object({
    fulfillmentMethod: z.enum(fulfillmentMethodEnum).optional(),
    deliveryAddressId: databaseUuidSchema.optional(),
    deliveryAddress: z
      .string()
      .trim()
      .min(8, 'Indica una dirección de entrega válida.')
      .max(500, 'La dirección de entrega no puede superar los 500 caracteres.')
      .optional(),
    promotionalCodeId: databaseUuidSchema.optional(),
    promotionalCode: z.string().trim().min(1).max(50).optional(),
    status: z.enum(orderStatusEnum).optional(),
    total: z.coerce.number().min(0).optional(),
    details: z
      .array(orderLineSchema)
      .min(1, 'Un pedido debe incluir al menos un producto.')
      .max(100),
    customerId: databaseUuidSchema.optional(),
  })
  .refine(
    (data) => new Set(data.details.map((line) => line.productId)).size === data.details.length,
    { message: 'No se permiten productos repetidos.', path: ['details'] }
  )
  // La dirección de domicilio NO se exige aquí: el servicio la toma del perfil
  // del cliente cuando el cuerpo no la trae, y solo rechaza si tampoco hay una
  // guardada. Validarlo en el esquema rompía el checkout del cliente que ya
  // tenía su dirección registrada.
  .refine(
    (data) => !(data.deliveryAddressId && data.deliveryAddress),
    {
      message: 'Envía deliveryAddressId o deliveryAddress, no ambos.',
      path: ['deliveryAddress'],
    }
  )
  .refine(
    (data) => !(data.promotionalCodeId && data.promotionalCode),
    {
      message: 'Envía promotionalCodeId o promotionalCode, no ambos.',
      path: ['promotionalCode'],
    }
  );

export const updateOrderSchema = z.object({
  customerId: databaseUuidSchema.optional(),
  driverId: databaseUuidSchema.nullable().optional(),
  promotionalCodeId: databaseUuidSchema.nullable().optional(),
  deliveryAddressId: databaseUuidSchema.nullable().optional(),
  total: z.coerce.number().min(0).optional(),
  status: z.enum(orderStatusEnum).optional(),
});

export const applyPromotionalCodeSchema = z.object({
  code: z.string().trim().min(1).max(50),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
