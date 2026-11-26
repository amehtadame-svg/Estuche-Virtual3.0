import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { prisma } from '../../lib/prisma';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../../lib/errors';

export interface Actor {
  id: string;
  role: string;
}

export const isSupervisor = (actor: Actor) =>
  ['admin', 'superadmin'].includes(actor.role);

export function assertStaff(actor: Actor) {
  if (
    !actor ||
    !['employee', 'admin', 'superadmin'].includes(actor.role)
  ) {
    throw forbidden();
  }
}

export function assertSupervisor(actor: Actor) {
  if (!actor || !isSupervisor(actor)) {
    throw forbidden('Operación exclusiva de administración.');
  }
}

export const fingerprint = (data: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');

export async function atomic<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        timeout: 15000,
        maxWait: 10000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt < 2
      ) {
        continue;
      }

      throw error;
    }
  }
}

export async function requestLock(
  tx: Prisma.TransactionClient,
  key: string
) {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))
  `;
}

export const orderInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      isActive: true,
      deletedAt: true,
    },
  },
  details: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          category: { select: { name: true } },
          images: { select: { url: true, isPrimary: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
    orderBy: {
      id: 'asc' as const,
    },
  },
  work: {
    include: {
      assignee: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  },
  receipt: {
    include: {
      payouts: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          confirmedAt: true,
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export type OperationalOrder = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export async function lockOrder(
  tx: Prisma.TransactionClient,
  id: string
): Promise<OperationalOrder> {
  await tx.$queryRaw`
    SELECT id FROM orders
    WHERE id = ${id}::uuid
    FOR UPDATE
  `;

  const order = await tx.order.findUnique({
    where: {
      id,
      deletedAt: null,
    },
    include: orderInclude,
  });

  if (!order) {
    throw notFound('Pedido no encontrado.');
  }

  return order;
}

export function financiallyPaid(
  order: Pick<OperationalOrder, 'receipt' | 'total'>
) {
  const receipt = order.receipt;

  if (
    !receipt ||
    receipt.paymentStatus !== 'paid' ||
    !new Prisma.Decimal(receipt.total).equals(order.total)
  ) {
    return false;
  }

  if (receipt.payouts.some((p) => p.status === 'refunded')) {
    return false;
  }

  const paid = receipt.payouts
    .filter(
      (p) =>
        p.status === 'approved' &&
        p.currency === 'COP' &&
        p.confirmedAt
    )
    .reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0)
    );

  return (
    new Prisma.Decimal(order.total).gt(0) &&
    paid.equals(order.total)
  );
}

export function assertOperational(order: OperationalOrder) {
  if (
    order.stockReleasedAt ||
    !['paid', 'preparing'].includes(order.status) ||
    !financiallyPaid(order)
  ) {
    throw conflict(
      'El pedido no está habilitado: necesita pago confirmado y un estado operativo válido.'
    );
  }

  if (!order.details.length) {
    throw conflict('El pedido no contiene productos.');
  }
}

export function assertOwner(
  order: OperationalOrder,
  actor: Actor
) {
  assertStaff(actor);

  if (
    !order.work ||
    (
      order.work.assigneeId !== actor.id &&
      !isSupervisor(actor)
    )
  ) {
    throw forbidden(
      'El pedido no está asignado a tu cuenta.'
    );
  }
}

export async function event(
  tx: Prisma.TransactionClient,
  orderId: string,
  actorId: string | null,
  action: string,
  note?: string
) {
  await tx.orderEvent.create({
    data: {
      orderId,
      actorId,
      action,
      note,
    },
  });
}

export function publicOrder(order: OperationalOrder) {
  return {
    id: order.id,
    customerId: order.customerId,
    createdById: order.createdById,
    status: order.status,
    total: order.total,
    orderDate: order.orderDate,
    expiresAt: order.expiresAt,
    fulfillmentMethod: order.fulfillmentMethod,
    deliverySnapshot: order.deliverySnapshot,
    customer: order.customer
      ? {
          id: order.customer.id,
          fullName: order.customer.fullName,
          phone: order.customer.phone,
          email: order.customer.email,
        }
      : null,
    details: order.details,
    work: order.work
      ? {
          id: order.work.id,
          assigneeId: order.work.assigneeId,
          assignee: order.work.assignee,
          status: order.work.status,
          claimedAt: order.work.claimedAt,
          packedAt: order.work.packedAt,
          completedAt: order.work.completedAt,
          incident: order.work.incident,
        }
      : null,
    receipt: order.receipt
      ? {
          id: order.receipt.id,
          receiptNumber: order.receipt.receiptNumber,
          paymentStatus: order.receipt.paymentStatus,
        }
      : null,
  };
}

export async function assertUnmanaged(
  tx: Prisma.TransactionClient,
  id: string
) {
  await tx.$queryRaw`
    SELECT id FROM orders
    WHERE id = ${id}::uuid
    FOR UPDATE
  `;

  const order = await tx.order.findUnique({
    where: {
      id,
    },
    select: {
      createdById: true,
      work: {
        select: {
          id: true,
        },
      },
    },
  });

  if (order && (order.createdById || order.work)) {
    throw conflict(
      'Pedido operativo: utiliza las acciones del módulo de empleado/supervisión, no la edición general.'
    );
  }
}

export function simulationEnabled() {
  return (
    ['development', 'test'].includes(
      process.env.NODE_ENV || ''
    ) &&
    process.env.ENABLE_PAYMENT_SIMULATION === 'true'
  );
}

export function assertSimulation() {
  if (!simulationEnabled()) {
    throw forbidden(
      'Simulación deshabilitada. Nunca habilitada en producción.'
    );
  }
}

export function positiveMoney(
  value: Prisma.Decimal | number | string
) {
  const amount = new Prisma.Decimal(value);

  if (!amount.isFinite() || amount.lte(0)) {
    throw badRequest('Importe inválido.');
  }

  return amount;
}