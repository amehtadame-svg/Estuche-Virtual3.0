import { z } from 'zod';

export const paymentStatusEnum = ['pending', 'approved', 'rejected', 'refunded'] as const;

export const updatePayoutStatusSchema = z.object({
  status: z.enum(paymentStatusEnum),
  confirmedAt: z.coerce.date().optional(),
});
