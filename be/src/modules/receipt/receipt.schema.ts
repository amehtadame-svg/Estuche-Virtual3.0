import { z } from 'zod';

export const receiptStatusEnum = ['pending', 'paid', 'partial', 'overdue', 'voided'] as const;

export const createReceiptSchema = z.object({
  customerId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  total: z.coerce.number().min(0).optional(),
  paymentStatus: z.enum(receiptStatusEnum).optional(),
});

// Update does not allow changing the associated order (matches the original flow).
export const updateReceiptSchema = createReceiptSchema.omit({ orderId: true }).partial();