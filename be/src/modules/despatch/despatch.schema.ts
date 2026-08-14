import { z } from 'zod';

export const despatchStatusEnum = ['in_transit', 'delivered', 'returned', 'canceled'] as const;

export const createDespatchSchema = z.object({
  orderId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  address: z.string().optional(),
  status: z.enum(despatchStatusEnum).optional(),
});

export const updateDespatchSchema = z.object({
  driverId: z.string().uuid().optional(),
  address: z.string().optional(),
  status: z.enum(despatchStatusEnum).optional(),
  deliveredAt: z.coerce.date().optional(),
});
