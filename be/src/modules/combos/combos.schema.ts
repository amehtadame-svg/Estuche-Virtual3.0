import { z } from 'zod';

const comboItemSchema = z.object({
  productId: z.string().uuid('El identificador del producto no es válido'),
  quantity: z.coerce.number().int('La cantidad debe ser un número entero').min(1, 'La cantidad mínima por producto es 1'),
});

export const createComboSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del combo es obligatorio').max(150),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number(),
  items: z.array(comboItemSchema).default([]),
});

export const updateComboSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del combo es obligatorio').max(150).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
  items: z.array(comboItemSchema).optional(),
});