import { z } from 'zod';

export const paymentStatusEnum = ['pending', 'approved', 'rejected', 'refunded'] as const;

export const createPayoutSchema = z.object({
  receiptId: z.string().uuid(),
  gateway: z.string().min(1).max(50),
  transactionId: z.string().min(1).max(255),
  status: z.enum(paymentStatusEnum).optional(),
  method: z.string().max(50).optional(),
  currency: z.string().max(10).optional(),
  // El importe lo fija el servidor a partir del recibo (C-02).
  confirmedAt: z.coerce.date().optional(),
});

export const updatePayoutStatusSchema = z.object({
  status: z.enum(paymentStatusEnum),
  confirmedAt: z.coerce.date().optional(),
});
