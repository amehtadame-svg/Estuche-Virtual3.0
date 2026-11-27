import { prisma } from '../../lib/prisma';
import { badRequest, conflict, forbidden } from '../../lib/errors';
import { Actor, assertOperational, atomic, event, financiallyPaid, lockOrder, orderInclude } from '../employee/employee.domain';

function assertDelivery(actor: Actor) { if (actor.role !== 'delivery') throw forbidden(); }
export const deliveryService = {
  async pending(actor: Actor) {
    assertDelivery(actor);
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, stockReleasedAt: null, status: 'preparing', driverId: null, fulfillmentMethod: 'delivery', work: { is: { status: 'packed' } }, shipments: { none: {} } },
      include: orderInclude,
      orderBy: [{ orderDate: 'asc' }, { id: 'asc' }],
    });
    // No exponer datos personales antes de que el repartidor tome el pedido.
    return orders.filter(o => o.details.length && (o.deliverySnapshot || o.deliveryAddressId) && financiallyPaid(o))
      .slice(0, 100).map(o => ({ id: o.id, orderDate: o.orderDate, itemCount: o.details.length }));
  },
  async claim(id: string, actor: Actor) {
    assertDelivery(actor);
    return atomic(async tx => {
      const order = await lockOrder(tx, id);
      if (order.status === 'shipped' && order.work?.status === 'dispatched' && order.driverId === actor.id) {
        const existing = await tx.despatch.findFirst({ where: { orderId: id, driverId: actor.id, status: 'in_transit' } });
        if (existing) return { message: 'Pedido ya tomado.', id: existing.id };
      }
      assertOperational(order);
      if (order.fulfillmentMethod !== 'delivery' || order.work?.status !== 'packed' || order.status !== 'preparing' || order.driverId) throw conflict('El pedido ya no está disponible para tomar.');
      const address = order.deliverySnapshot || (order.deliveryAddressId ? (await tx.deliveryAddress.findUnique({ where: { id: order.deliveryAddressId } }))?.address : null);
      if (!address) throw conflict('El pedido no tiene dirección de entrega.');
      if (await tx.despatch.count({ where: { orderId: id } })) throw conflict('El pedido ya tiene un envío; requiere revisión administrativa.');
      const shipment = await tx.despatch.create({ data: { orderId: id, driverId: actor.id, address, status: 'in_transit' } });
      await tx.orderWork.update({ where: { orderId: id }, data: { status: 'dispatched' } });
      await tx.order.update({ where: { id }, data: { status: 'shipped', driverId: actor.id } });
      await event(tx, id, actor.id, 'dispatched', 'Pedido tomado por el repartidor.');
      return { id: shipment.id, message: 'Pedido tomado; ahora aparece en Mis entregas.' };
    });
  },
};
export function assertEmptyBody(body: unknown) {
  if (body && (typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length)) throw badRequest('Esta operación no acepta campos.');
}
