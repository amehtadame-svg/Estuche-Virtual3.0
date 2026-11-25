import {
  atomic,
  assertUnmanaged,
  event,
  lockOrder,
  financiallyPaid,
} from '../employee/employee.domain';
import {
  conflict,
  notFound,
} from '../../lib/errors';
import { prisma } from '../../lib/prisma';

export const despatchService = {
  list() {
    return prisma.despatch.findMany({
      include: {
        order: {
          select: {
            id: true,
            customer: {
              select: {
                fullName: true,
              },
            },
          },
        },
        driver: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  },

  async create(
    data: {
      orderId: string;
      driverId?: string;
      address?: string;
      status?: string;
    }
  ) {
    return atomic(async (tx) => {
      await assertUnmanaged(
        tx,
        data.orderId
      );

      return tx.despatch.create({
        data: {
          orderId: data.orderId,
          driverId:
            data.driverId || null,
          address:
            data.address ?? null,
          status: (
            data.status ??
            'in_transit'
          ) as any,
        },
      });
    });
  },

  async update(
    id: string,
    data: {
      driverId?: string;
      address?: string;
      status?: string;
      deliveredAt?: Date;
    },
    actorId?: string
  ) {
    const existing =
      await prisma.despatch.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      throw notFound();
    }

    return atomic(async (tx) => {
      const order = await lockOrder(
        tx,
        existing.orderId
      );

      const current =
        await tx.despatch.findUniqueOrThrow({
          where: {
            id,
          },
        });

      if (
        order.work ||
        order.createdById
      ) {
        if (
          (
            data.driverId &&
            data.driverId !==
              current.driverId
          ) ||
          (
            data.address &&
            data.address !==
              current.address
          )
        ) {
          throw conflict(
            'No se puede cambiar un envío operativo ya despachado.'
          );
        }

        if (
          data.status !== 'delivered' ||
          !actorId
        ) {
          throw conflict(
            'El envío operativo solo permite confirmar entrega al cliente. Otras incidencias requieren un flujo específico.'
          );
        }

        if (
          current.status === 'delivered'
        ) {
          return current;
        }

        if (
          order.status !== 'shipped' ||
          order.work?.status !==
            'dispatched' ||
          !financiallyPaid(order)
        ) {
          throw conflict(
            'Pedido no habilitado para entrega.'
          );
        }

        const deliveredAt =
          new Date();

        const result =
          await tx.despatch.update({
            where: {
              id,
            },
            data: {
              status: 'delivered',
              deliveredAt,
            },
          });

        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: 'delivered',
          },
        });

        await tx.orderWork.update({
          where: {
            orderId: order.id,
          },
          data: {
            status: 'completed',
            completedAt: deliveredAt,
          },
        });

        await event(
          tx,
          order.id,
          actorId,
          'delivery_confirmed'
        );

        return result;
      }

      return tx.despatch.update({
        where: {
          id,
        },
        data: {
          driverId: data.driverId,
          address: data.address,
          status: data.status as any,
          deliveredAt:
            data.deliveredAt,
        },
      });
    });
  },

  async remove(id: string) {
    const existing =
      await prisma.despatch.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      throw notFound();
    }

    return atomic(async (tx) => {
      await assertUnmanaged(
        tx,
        existing.orderId
      );

      await tx.despatch.delete({
        where: {
          id,
        },
      });

      return null;
    });
  },
};