import {
  atomic,
  assertUnmanaged,
  event,
  lockOrder,
  financiallyPaid,
} from '../employee/employee.domain';
import {
  conflict,
  badRequest,
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
      driverId?: string | null;
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
      driverId?: string | null;
      address?: string;
      status?: string;
      deliveredAt?: Date;
      expected?: { driverId: string | null; address: string | null; status: string };
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

      if (data.expected && (
        data.expected.driverId !== current.driverId ||
        data.expected.address !== current.address ||
        data.expected.status !== current.status
      )) {
        throw conflict('El envío cambió mientras lo editabas. Cierra el formulario, actualiza la lista y vuelve a intentarlo.');
      }

      if (order.work || order.createdById) {
        const addressChanged = data.address !== undefined && data.address !== current.address;
        const driverChanged = data.driverId !== undefined && data.driverId !== current.driverId;
        const detailsChanged = addressChanged || driverChanged;
        if (!actorId) throw conflict('No se pudo identificar al responsable del cambio.');

        if (detailsChanged) {
          if (data.status && data.status !== 'in_transit') {
            throw conflict('Guarda primero los cambios de dirección o repartidor; después confirma la entrega por separado.');
          }
          if (current.status !== 'in_transit' || order.status !== 'shipped' || order.work?.status !== 'dispatched') {
            throw conflict('Solo se pueden corregir datos de un envío operativo que esté en camino y despachado.');
          }
          if (await tx.despatch.count({ where: { orderId: order.id } }) !== 1) {
            throw conflict('El pedido tiene varios envíos y requiere revisión antes de corregir sus datos.');
          }
          if (addressChanged && !data.address?.trim()) {
            throw badRequest('Ingresa una dirección de entrega.');
          }
          if (driverChanged) {
            if (!data.driverId) throw badRequest('Un envío en camino debe tener un repartidor asignado.');
            const driver = await tx.user.findFirst({
              where: { id: data.driverId, role: 'delivery', isActive: true, deletedAt: null },
              select: { id: true },
            });
            if (!driver) throw badRequest('Selecciona un repartidor activo.');
          }
          const updated = await tx.despatch.update({
            where: { id },
            data: {
              ...(addressChanged ? { address: data.address } : {}),
              ...(driverChanged ? { driverId: data.driverId } : {}),
            },
          });
          await tx.order.update({
            where: { id: order.id },
            data: {
              ...(addressChanged ? { deliverySnapshot: data.address } : {}),
              ...(driverChanged ? { driverId: data.driverId } : {}),
            },
          });
          if (addressChanged) {
            await event(tx, order.id, actorId, 'despatch_address_previous', current.address ?? '(sin dirección)');
            await event(tx, order.id, actorId, 'despatch_address_corrected', data.address!);
          }
          if (driverChanged) {
            await event(tx, order.id, actorId, 'despatch_driver_previous', current.driverId ?? '(sin asignar)');
            await event(tx, order.id, actorId, 'despatch_driver_corrected', data.driverId!);
          }
          return updated;
        }

        if (!data.status || data.status === current.status) return current;
        if (data.status !== 'delivered') {
          throw conflict('Para un envío operativo, confirma únicamente la entrega real. Otras incidencias requieren revisión.');
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