import { Prisma } from '@prisma/client';
import { atomic, assertUnmanaged, event, lockOrder } from '../employee/employee.domain';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
type Snapshot = { orderId: string; productId: string; quantity: number; unitPrice: number };
type Actor = { id: string; role: string };
const money = (n: Prisma.Decimal | number) => new Prisma.Decimal(n);

async function lockedCorrection(tx: Prisma.TransactionClient, id: string, expected: Snapshot) {
  const prior = await tx.orderDetail.findUnique({ where: { id } });
  if (!prior) throw notFound('El artículo ya no existe. Actualiza la lista.');
  const order = await lockOrder(tx, prior.orderId);
  const detail = order.details.find((d) => d.id === id);
  if (!detail || detail.orderId !== expected.orderId || detail.productId !== expected.productId ||
      detail.quantity !== expected.quantity || !money(detail.unitPrice).equals(expected.unitPrice))
    throw conflict('El artículo cambió desde que lo abriste. Actualiza la lista antes de intentarlo de nuevo.');
  if (!order.createdById) throw conflict('Este pedido histórico necesita revisión de inventario antes de corregir artículos.');
  if (order.receipt && (order.receipt.paymentStatus !== 'pending' || order.receipt.payouts.length))
    throw conflict('El pedido tiene pagos o un estado financiero avanzado. Revisa el pago y, si corresponde, el reembolso real antes de modificar artículos.');
  if (order.status !== 'pending' || order.work || order.stockReleasedAt || (order.expiresAt && order.expiresAt <= new Date()))
    throw conflict('El pedido ya avanzó, venció o liberó su reserva. Revisa su estado antes de corregir artículos.');
  if (!order.receipt) throw conflict('El pedido aún no tiene un recibo asociado. Revísalo antes de corregir artículos.');
  if (order.promotionalCodeId) throw conflict('El pedido tiene un descuento que necesita revisión antes de cambiar artículos.');
  const [receiptItems, shipments, returns] = await Promise.all([
    tx.receiptItem.count({ where: { receiptId: order.receipt.id } }),
    tx.despatch.count({ where: { orderId: order.id } }),
    tx.orderReturn.count({ where: { orderId: order.id } }),
  ]);
  if (receiptItems || shipments || returns || order.details.some((d) => d.pickedQuantity !== 0))
    throw conflict('El pedido tiene datos de preparación, envío, devolución o recibo que necesitan revisión antes del cambio.');
  let sum = new Prisma.Decimal(0);
  for (const item of order.details) {
    const subtotal = money(item.unitPrice).mul(item.quantity);
    if (item.subtotal === null || !subtotal.equals(item.subtotal) || item.quantity < 1)
      throw conflict('Los importes del pedido necesitan revisión antes de corregir artículos.');
    sum = sum.plus(subtotal);
  }
  if (!sum.equals(order.total) || !sum.equals(order.receipt.total))
    throw conflict('El total del pedido y el recibo no coinciden. Revísalos antes de cambiar artículos.');
  return { order, detail, sum };
}
async function adjustStock(tx: Prisma.TransactionClient, id: string, delta: number, orderId: string, actorId: string) {
  if (!delta) return;
  const changed = delta < 0
    ? await tx.product.updateMany({ where: { id, deletedAt: null, stock: { gte: -delta } }, data: { stock: { decrement: -delta } } })
    : await tx.product.updateMany({ where: { id }, data: { stock: { increment: delta } } });
  if (changed.count !== 1) throw conflict('No hay existencias suficientes o no se pudo ajustar el producto.');
  await tx.inventoryMovement.create({ data: { productId: id, type: delta > 0 ? 'in' : 'out', quantity: Math.abs(delta), userId: actorId, reason: `Corrección de artículo del pedido ${orderId}` } });
}
export const orderDetailService = {
  list() { return prisma.orderDetail.findMany({ include: { order: { select: { id: true } }, product: { select: { name: true } } }, orderBy: { id: 'desc' } }); },
  async create(data: Snapshot) { return atomic(async (tx) => { await assertUnmanaged(tx, data.orderId); return tx.orderDetail.create({ data: { ...data, subtotal: data.quantity * data.unitPrice } }); }); },
  async update(id: string, data: Snapshot & { expected: Snapshot }, actor: Actor) {
    return atomic(async (tx) => {
      const { order, detail, sum } = await lockedCorrection(tx, id, data.expected);
      if (data.orderId !== order.id) throw badRequest('No se puede trasladar un artículo a otro pedido desde este formulario.');
      const sub = money(data.unitPrice).mul(data.quantity);
      const total = sum.minus(money(detail.unitPrice).mul(detail.quantity)).plus(sub);
      if (total.lte(0) || total.gt('999999999999.99')) throw badRequest('El total resultante debe ser válido y mayor que cero.');
      const delta = new Map<string, number>();
      delta.set(detail.productId, (delta.get(detail.productId) ?? 0) + detail.quantity);
      delta.set(data.productId, (delta.get(data.productId) ?? 0) - data.quantity);
      for (const [productId, amount] of [...delta].sort(([a], [b]) => a.localeCompare(b))) await adjustStock(tx, productId, amount, order.id, actor.id);
      const updated = await tx.orderDetail.update({ where: { id }, data: { productId: data.productId, quantity: data.quantity, unitPrice: money(data.unitPrice), subtotal: sub } });
      await tx.order.update({ where: { id: order.id }, data: { total, updatedAt: new Date() } });
      await tx.receipt.update({ where: { id: order.receipt!.id }, data: { total } });
      await event(tx, order.id, actor.id, 'detail_corrected', `Artículo ${id}: ${detail.productId} x${detail.quantity} a ${detail.unitPrice}; ahora ${data.productId} x${data.quantity} a ${data.unitPrice}.`);
      return updated;
    });
  },
  async remove(id: string, expected: Snapshot, actor: Actor) {
    return atomic(async (tx) => {
      const { order, detail, sum } = await lockedCorrection(tx, id, expected);
      if (order.details.length <= 1) throw conflict('No se puede dejar el pedido sin artículos. Revisa la cancelación del pedido completo.');
      const total = sum.minus(money(detail.unitPrice).mul(detail.quantity));
      if (total.lte(0)) throw conflict('El pedido debe conservar un total mayor que cero. Revisa el pedido completo.');
      await adjustStock(tx, detail.productId, detail.quantity, order.id, actor.id);
      await tx.orderDetail.delete({ where: { id } });
      await tx.order.update({ where: { id: order.id }, data: { total, updatedAt: new Date() } });
      await tx.receipt.update({ where: { id: order.receipt!.id }, data: { total } });
      await event(tx, order.id, actor.id, 'detail_removed', `Artículo ${id}: retirado producto ${detail.productId}, ${detail.quantity} unidades a ${detail.unitPrice}.`);
      return null;
    });
  },
};
