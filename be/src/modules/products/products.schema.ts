import { z } from 'zod';

const numericRuleMessage =
  'El precio de venta y el costo de adquisición deben ser valores numéricos estrictamente mayores a cero, y el stock inicial no puede contener cifras negativas';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'El nombre comercial es obligatorio').max(150),
  sku: z.string().trim().max(80).optional().nullable(),
  barcode: z.string().trim().max(80).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  cost: z.coerce.number().gt(0, numericRuleMessage).optional(),
  price: z.coerce.number().gt(0, numericRuleMessage),
  categoryId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  stock: z.coerce.number().int().min(0, numericRuleMessage).optional(),
  stockMin: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().url().max(500).optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();