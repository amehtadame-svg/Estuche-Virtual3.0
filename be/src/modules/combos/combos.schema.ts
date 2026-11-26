import { z } from 'zod';
import { databaseUuidSchema } from '../../lib/schemas';

const comboItemSchema = z.object({
  productId: databaseUuidSchema,
  quantity: z.coerce.number().int('La cantidad debe ser un número entero').min(1, 'La cantidad mínima por producto es 1'),
});

export const createComboSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del combo es obligatorio').max(150),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number().optional(),
  discountPercent: z.coerce.number().min(0, 'El porcentaje de descuento no puede ser negativo').max(100, 'El porcentaje de descuento no puede superar el 100%').optional(),
  discountAmount: z.coerce.number().min(0, 'El valor del descuento no puede ser negativo').optional(),
  items: z.array(comboItemSchema).default([]),
});

export const updateComboSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del combo es obligatorio').max(150).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number().optional(),
  discountPercent: z.coerce.number().min(0, 'El porcentaje de descuento no puede ser negativo').max(100, 'El porcentaje de descuento no puede superar el 100%').optional(),
  discountAmount: z.coerce.number().min(0, 'El valor del descuento no puede ser negativo').optional(),
  isActive: z.boolean().optional(),
  items: z.array(comboItemSchema).optional(),
});