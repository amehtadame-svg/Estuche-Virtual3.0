import { badRequest, conflict, forbidden } from '../../lib/errors';
import { Actor, assertSupervisor, assertOperational, atomic, event, lockOrder } from '../employee/employee.domain';

export const supervisionService = {
  async resolve(
    id: string,
    note: string,
    actor: Actor
  ) {
    assertSupervisor(actor);

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOperational(order);

      if (order.work?.status !== 'blocked') {
        throw conflict(
          'No hay incidencia bloqueante.'
        );
      }

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          status: 'picking',
          incident: null,
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'incident_resolved',
        note
      );

      return {
        message:
          'Incidencia resuelta; revisa la recogida antes de empacar.',
      };
    });
  },

  async reassign(
    id: string,
    assigneeId: string,
    note: string,
    actor: Actor
  ) {
    assertSupervisor(actor);

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOperational(order);

      if (
        !order.work ||
        !['picking', 'packed', 'blocked'].includes(
          order.work.status
        )
      ) {
        throw conflict(
          'No es posible reasignar este pedido.'
        );
      }

      const employee = await tx.user.findFirst({
        where: {
          id: assigneeId,
          role: 'employee',
          isActive: true,
          deletedAt: null,
        },
      });

      if (!employee) {
        throw badRequest(
          'Selecciona un empleado activo.'
        );
      }

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          assigneeId,
          pickupCodeHash: null,
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'reassigned',
        `${order.work.assigneeId} -> ${assigneeId}: ${note}`.slice(
          0,
          500
        )
      );

      return {
        message: 'Responsable actualizado.',
      };
    });
  },

  async cancel(
    id: string,
    note: string,
    actor: Actor | null,
    expiredOnly = false
  ) {
    if (actor) {
      assertSupervisor(actor);
    } else if (!expiredOnly) {
      throw forbidden();
    }

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      if (!order.createdById) {
        throw conflict(
          'Esta operación requiere un pedido con registro de creador; los pedidos históricos necesitan revisión.'
        );
      }

      if (order.stockReleasedAt) {
        return {
          message: 'Reserva ya liberada.',
        };
      }

      if (
        order.status !== 'pending' ||
        order.work ||
        order.receipt?.payouts.some(
          (payment) =>
            payment.status === 'approved' ||
            payment.status === 'refunded'
        )
      ) {
        throw conflict(
          'No se puede cancelar automáticamente un pedido con pago o preparación.'
        );
      }

      if (
        expiredOnly &&
        (
          !order.expiresAt ||
          order.expiresAt > new Date()
        )
      ) {
        throw conflict(
          'La reserva no ha vencido.'
        );
      }

      for (
        const detail of [...order.details].sort(
          (a, b) =>
            a.productId.localeCompare(
              b.productId
            )
        )
      ) {
        await tx.product.update({
          where: {
            id: detail.productId,
          },
          data: {
            stock: {
              increment: detail.quantity,
            },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: detail.productId,
            type: 'in',
            quantity: detail.quantity,
            userId: actor?.id,
            reason:
              `Liberación de reserva ${id}`,
          },
        });
      }

      await tx.order.update({
        where: {
          id,
        },
        data: {
          status: 'canceled',
          stockReleasedAt: new Date(),
        },
      });

      if (order.receipt) {
        await tx.receipt.update({
          where: {
            id: order.receipt.id,
          },
          data: {
            paymentStatus: 'voided',
          },
        });
      }

      await event(
        tx,
        id,
        actor?.id ?? null,
        expiredOnly ? 'expired' : 'canceled',
        note
      );

      return {
        message:
          'Pedido cancelado y reserva liberada una sola vez.',
      };
    });
  },
};
