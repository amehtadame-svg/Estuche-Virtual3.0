import { z } from 'zod';

const quantityErrorMessage =
  'La cantidad de mercancía a ingresar debe ser un número entero mayor a cero';

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