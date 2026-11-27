import { randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma';
import { conflict, forbidden } from '../../lib/errors';
import { Actor, assertOperational, atomic, event, fingerprint, lockOrder } from '../employee/employee.domain';

export const clientService = {
  async customerPickups(actor: Actor) {
    if (actor.role !== 'client') {
      throw forbidden();
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: actor.id,
        deletedAt: null,
        fulfillmentMethod: 'pickup',
      },
      select: {
        id: true,
        total: true,
        status: true,
        orderDate: true,
        work: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
      take: 50,
    });

    return orders;
  },

  async issuePickupCode(
    id: string,
    actor: Actor
  ) {
    if (actor.role !== 'client') {
      throw forbidden(
        'Solo el cliente comprador obtiene el código.'
      );
    }

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      if (order.customerId !== actor.id) {
        throw forbidden();
      }

      assertOperational(order);

      if (
        order.fulfillmentMethod !== 'pickup' ||
        order.work?.status !== 'packed'
      ) {
        throw conflict(
          'El retiro todavía no está listo.'
        );
      }

      const code = randomBytes(8)
        .toString('hex')
        .toUpperCase();

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          pickupCodeHash: fingerprint(code),
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'pickup_code_issued'
      );

      return {
        code,
        message:
          'Muestra este código al retirar. Generar otro invalida el anterior.',
      };
    });
  },

};
