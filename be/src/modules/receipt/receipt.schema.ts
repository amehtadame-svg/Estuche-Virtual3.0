import { z } from 'zod';
import { databaseUuidSchema } from '../../lib/schemas';

export const receiptStatusEnum = ['pending', 'paid', 'partial', 'overdue', 'voided'] as const;

export const createReceiptSchema = z.object({
  customerId: databaseUuidSchema.optional(),
  employeeId: databaseUuidSchema.optional(),
  orderId: databaseUuidSchema.optional(),
  total: z.coerce.number().min(0).optional(),
  paymentStatus: z.enum(receiptStatusEnum).optional(),
});

// Update does not allow changing the associated order (matches the original flow).
export const updateReceiptSchema = createReceiptSchema.omit({ orderId: true }).partial();