import { prisma } from '../../lib/prisma';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../../lib/errors';
import {
  Actor,
  assertSimulation,
  atomic,
  event,
  lockOrder,
  requestLock,
} from '../employee/employee.domain';
import { Prisma } from '@prisma/client';

export async function synchronize(
  tx: Prisma.TransactionClient,
  orderId: string,
  actorId: string
) {
  const order = await lockOrder(
    tx,
    orderId
  );

  if (!order.receipt) {
    throw conflict(
      'El pedido no tiene recibo.'
    );
  }

  const total = new Prisma.Decimal(
    order.total
  );

  if (
    total.lte(0) ||
    !total.equals(order.receipt.total)
  ) {
    throw conflict(
      'Importes del pedido y recibo inconsistentes.'
    );
  }

  if (
    order.receipt.payouts.some(
      (payment) =>
        payment.status === 'refunded'
    )
  ) {
    throw conflict(
      'Existe un reembolso; se requiere revisión financiera.'
    );
  }

  const approved =
    order.receipt.payouts.filter(
      (payment) =>
        payment.status === 'approved'
    );

  if (
    approved.some(
      (payment) =>
        payment.currency !== 'COP' ||
        !payment.confirmedAt
    )
  ) {
    throw conflict(
      'Pago incompatible.'
    );
  }

  const paid = approved.reduce(
    (sum, payment) =>
      sum.plus(payment.amount),
    new Prisma.Decimal(0)
  );

  if (paid.gt(total)) {
    throw conflict(
      'El pago excede el saldo del pedido.'
    );
  }

  const complete = paid.equals(total);

  await tx.receipt.update({
    where: {
      id: order.receipt.id,
    },
    data: {
      paymentStatus: complete
        ? 'paid'
        : paid.gt(0)
          ? 'partial'
          : 'pending',
    },
  });

  if (
    complete &&
    order.status === 'pending'
  ) {
    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: 'paid',
        expiresAt: null,
      },
    });

    await event(
      tx,
      orderId,
      actorId,
      'payment_confirmed'
    );
  }
}

export const payoutService = {
  list() {
    return prisma.payout.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        receipt: {
          select: {
            receiptNumber: true,
            total: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  },

  async getById(id: string) {
    const payout =
      await prisma.payout.findUnique({
        where: {
          id,
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
          receipt: {
            select: {
              receiptNumber: true,
              total: true,
              paymentStatus: true,
            },
          },
        },
      });

    if (!payout) {
      throw notFound(
        'Pago no encontrado'
      );
    }

    return payout;
  },

  async updateStatus(
    id: string,
    status: string,
    _confirmedAt?: Date,
    actorId?: string
  ) {
    if (!actorId) {
      throw forbidden();
    }

    const payment =
      await prisma.payout.findUnique({
        where: {
          id,
        },
        include: {
          receipt: true,
        },
      });

    if (!payment?.receipt.orderId) {
      throw notFound(
        'Pago asociado a pedido no encontrado.'
      );
    }

    return atomic(async (tx) => {
      const order = await lockOrder(
        tx,
        payment.receipt.orderId!
      );

      const current =
        await tx.payout.findUniqueOrThrow({
          where: {
            id,
          },
        });

      if (current.status === status) {
        return current;
      }

      if (
        current.status !== 'pending' ||
        !['approved', 'rejected'].includes(
          status
        )
      ) {
        throw conflict(
          'Transición financiera no permitida. Los reembolsos requieren un flujo específico.'
        );
      }

      if (
        order.status !== 'pending' ||
        order.stockReleasedAt ||
        (
          order.expiresAt &&
          order.expiresAt <= new Date()
        )
      ) {
        throw conflict(
          'Pedido cancelado, vencido o no disponible para pago.'
        );
      }

      const result =
        await tx.payout.update({
          where: {
            id,
          },
          data: {
            status: status as
              | 'approved'
              | 'rejected',
            confirmedAt:
              status === 'approved'
                ? new Date()
                : null,
          },
        });

      await synchronize(
        tx,
        order.id,
        actorId
      );

      await event(
        tx,
        order.id,
        actorId,
        `payment_${status}`
      );

      return result;
    });
  },

  async simulate(
    orderId: string,
    requestKey: string,
    result: 'approved' | 'rejected',
    actor: Actor
  ) {
    if (actor.role !== 'superadmin') {
      throw forbidden();
    }

    assertSimulation();

    return atomic(async (tx) => {
      await requestLock(
        tx,
        requestKey
      );

      const order = await lockOrder(
        tx,
        orderId
      );

      const transactionId =
        `SIM-${requestKey}`;

      const previous =
        await tx.payout.findUnique({
          where: {
            transactionId,
          },
        });

      if (previous) {
        if (
          previous.receiptId !==
            order.receipt?.id ||
          previous.status !== result
        ) {
          throw conflict(
            'La referencia ya fue usada para otro resultado.'
          );
        }

        return {
          message:
            'Simulación ya registrada.',
          id: previous.id,
        };
      }

      if (
        !order.createdById ||
        !order.receipt ||
        !order.customerId ||
        !order.details.length ||
        new Prisma.Decimal(
          order.total
        ).lte(0)
      ) {
        throw conflict(
          'La simulación requiere un pedido válido del módulo de empleado.'
        );
      }

      if (
        order.status !== 'pending' ||
        order.stockReleasedAt ||
        (
          order.expiresAt &&
          order.expiresAt <= new Date()
        )
      ) {
        throw conflict(
          'Pedido no disponible para pago.'
        );
      }

      if (
        order.receipt.payouts.some(
          (payment) =>
            payment.status === 'approved' ||
            payment.status === 'refunded'
        )
      ) {
        throw conflict(
          'Ya existen pagos confirmados.'
        );
      }

      const payment =
        await tx.payout.create({
          data: {
            receiptId: order.receipt.id,
            userId: order.customerId,
            gateway: 'simulado',
            transactionId,
            status: result,
            method: 'test',
            amount: order.total,
            currency: 'COP',
            confirmedAt:
              result === 'approved'
                ? new Date()
                : null,
          },
        });

      await synchronize(
        tx,
        orderId,
        actor.id
      );

      await event(
        tx,
        orderId,
        actor.id,
        `simulation_${result}`,
        'SIMULACIÓN: no representa un cobro real.'
      );

      return {
        message:
          `Pago SIMULADO ${result}. No hubo cobro real.`,
        id: payment.id,
      };
    });
  },
};