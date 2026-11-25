import {
  atomic,
  assertUnmanaged,
} from '../employee/employee.domain';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../../lib/errors';

interface Requester {
  id: string;
  role: string;
}

interface ReceiptInput {
  customerId?: string;
  employeeId?: string;
  orderId?: string;
  total?: number;
  paymentStatus?: string;
}

const isAdmin = (requester: Requester) =>
  ['admin', 'superadmin'].includes(requester.role);

export const receiptService = {
  list() {
    return prisma.receipt.findMany({
      include: {
        customer: {
          select: {
            fullName: true,
          },
        },
        employee: {
          select: {
            fullName: true,
          },
        },
        order: {
          select: {
            id: true,
            total: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  },

  async create(
    data: ReceiptInput,
    requester: Requester
  ) {
    if (
      !requester ||
      !['client', 'admin', 'superadmin'].includes(
        requester.role
      )
    ) {
      throw forbidden(
        'No tienes permiso para crear recibos.'
      );
    }

    if (
      data.paymentStatus &&
      data.paymentStatus !== 'pending'
    ) {
      throw badRequest(
        'Los recibos nuevos deben quedar pendientes de pago.'
      );
    }

    let total: number;
    let customerId: string | null;

    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: {
          id: data.orderId,
          deletedAt: null,
        },
      });

      if (!order) {
        throw notFound('Pedido no encontrado.');
      }

      if (
        !isAdmin(requester) &&
        order.customerId !== requester.id
      ) {
        throw forbidden(
          'No puedes crear un recibo para un pedido ajeno.'
        );
      }

      if (order.status !== 'pending') {
        throw badRequest(
          'Solo se crean recibos para pedidos pendientes.'
        );
      }

      if (
        data.customerId &&
        data.customerId !== order.customerId
      ) {
        throw badRequest(
          'El cliente del recibo debe coincidir con el pedido.'
        );
      }

      total = Number(order.total);
      customerId = order.customerId;
    } else {
      if (!isAdmin(requester)) {
        throw forbidden(
          'Los clientes deben indicar un pedido propio.'
        );
      }

      if (
        data.total === undefined ||
        !Number.isFinite(data.total) ||
        data.total < 0
      ) {
        throw badRequest(
          'Debes indicar un total válido.'
        );
      }

      total = data.total;
      customerId = data.customerId ?? null;
    }

    try {
      return await prisma.receipt.create({
        data: {
          orderId: data.orderId,
          customerId,
          employeeId: isAdmin(requester)
            ? requester.id
            : null,
          total,
          paymentStatus: 'pending',
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw conflict(
          'El pedido ya tiene un recibo asociado.'
        );
      }

      throw error;
    }
  },

  async update(
    id: string,
    data: Omit<ReceiptInput, 'orderId'>
  ) {
    return atomic(async (tx) => {
      const existing = await tx.receipt.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              payouts: true,
            },
          },
        },
      });

      if (!existing) {
        throw notFound('Recibo no encontrado.');
      }

      if (
        existing.paymentStatus !== 'pending' ||
        existing._count.payouts > 0
      ) {
        throw conflict(
          'No se puede editar un recibo con pagos o estado financiero avanzado.'
        );
      }

      if (
        data.paymentStatus &&
        data.paymentStatus !== existing.paymentStatus
      ) {
        throw badRequest(
          'El estado financiero solo puede cambiar desde el flujo de pagos.'
        );
      }

      if (
        data.employeeId &&
        data.employeeId !== existing.employeeId
      ) {
        throw badRequest(
          'No puedes cambiar el responsable del recibo.'
        );
      }

      let total = data.total;

      let customerId:
        | string
        | null
        | undefined = data.customerId;

      if (existing.orderId) {
        await assertUnmanaged(
          tx,
          existing.orderId
        );

        const order = await tx.order.findUnique({
          where: {
            id: existing.orderId,
            deletedAt: null,
          },
        });

        if (!order) {
          throw notFound('Pedido no encontrado.');
        }

        if (
          data.customerId &&
          data.customerId !== order.customerId
        ) {
          throw badRequest(
            'El cliente del recibo debe coincidir con el pedido.'
          );
        }

        total = Number(order.total);
        customerId = order.customerId;
      }

      return tx.receipt.update({
        where: {
          id,
        },
        data: {
          total,
          customerId,
        },
      });
    });
  },

  async remove(id: string) {
    throw conflict(
      'La eliminación de recibos está deshabilitada para conservar el historial.'
    );
  },
};