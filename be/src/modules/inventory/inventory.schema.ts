import { z } from 'zod';

const quantityErrorMessage =
  'La cantidad de mercancía a ingresar debe ser un número entero mayor a cero';

const outboundQuantityErrorMessage =
  'La cantidad a retirar debe ser un número entero mayor a cero';

export const createInboundSchema = z.object({
  productId: z.string().uuid('Selecciona un producto válido'),
  quantity: z.coerce
    .number({ message: quantityErrorMessage })
    .int(quantityErrorMessage)
    .gt(0, quantityErrorMessage),
  unitCost: z.coerce.number().gt(0).optional(),
  supplierId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().trim().max(100).optional().nullable(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const OUTBOUND_REASONS = [
  'Traslado entre sucursales',
  'Muestra comercial',
  'Consumo interno',
  'Merma por daño',
  'Devolución a proveedor',
  'Otro',
] as const;

// HU-003 · CA-003.1: motivo de retiro OBLIGATORIO (mínimo 3 caracteres)
export const createOutboundSchema = z.object({
  productId: z.string().uuid('Selecciona un producto válido'),
  quantity: z.coerce
    .number({ message: outboundQuantityErrorMessage })
    .int(outboundQuantityErrorMessage)
    .gt(0, outboundQuantityErrorMessage),
  reasonType: z.enum(OUTBOUND_REASONS, {
    message: 'Selecciona el motivo del retiro',
  }),
  reason: z
    .string({ message: 'La justificación del retiro es obligatoria' })
    .trim()
    .min(3, 'La justificación del retiro es obligatoria (mínimo 3 caracteres)')
    .max(500),
});