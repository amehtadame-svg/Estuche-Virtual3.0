import { z } from 'zod';

const quantity = z
  .number()
  .int()
  .min(1)
  .max(100000);

export const newEmployeeOrder = z
  .object({
    requestKey: z.string().uuid(),
    customerId: z.string().uuid(),
    fulfillmentMethod: z.enum([
      'delivery',
      'pickup',
    ]),
    address: z
      .string()
      .trim()
      .min(8)
      .max(500)
      .optional(),
    details: z
      .array(
        z
          .object({
            productId: z.string().uuid(),
            quantity,
          })
          .strict()
      )
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    (data) =>
      data.fulfillmentMethod !== 'delivery' ||
      !!data.address,
    {
      message: 'Indica una dirección para domicilio.',
      path: ['address'],
    }
  );

export const pickingSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            detailId: z.string().uuid(),
            pickedQuantity: z
              .number()
              .int()
              .min(0)
              .max(100000),
          })
          .strict()
      )
      .min(1)
      .max(100),
  })
  .strict();

export const noteSchema = z
  .object({
    note: z
      .string()
      .trim()
      .min(5)
      .max(500),
  })
  .strict();

export const reassignSchema = noteSchema
  .extend({
    assigneeId: z.string().uuid(),
  })
  .strict();

export const dispatchSchema = z
  .object({
    driverId: z.string().uuid(),
  })
  .strict();

export const pickupSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[a-fA-F0-9]{16}$/),
    recipientName: z
      .string()
      .trim()
      .min(3)
      .max(150),
  })
  .strict();

export const inventorySchema = z
  .object({
    requestKey: z.string().uuid(),
    productId: z.string().uuid(),
    type: z.enum([
      'in',
      'out',
    ]),
    quantity,
    reason: z
      .string()
      .trim()
      .min(5)
      .max(400),
  })
  .strict();

export const simulationSchema = z
  .object({
    requestKey: z.string().uuid(),
    result: z.enum([
      'approved',
      'rejected',
    ]),
  })
  .strict();

export const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2)
    .max(80),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .default(1),
});

export const pageSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .default(1),
  scope: z
    .enum([
      'available',
      'mine',
      'supervision',
    ])
    .default('mine'),
});

export type NewEmployeeOrder = z.infer<
  typeof newEmployeeOrder
>;

export type InventoryInput = z.infer<
  typeof inventorySchema
>;