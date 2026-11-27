import { Prisma } from '@prisma/client';
import { conflict, forbidden } from '../../lib/errors';
import { Actor, assertStaff, atomic, event, isSupervisor, lockOrder, requestLock } from './employee.domain';
import { synchronize } from '../payout/payout.service';

// Registra un cobro ya realizado fuera del sistema; no procesa tarjetas.
export async function registerStorePayment(orderId: string, requestKey: string, method: 'cash' | 'card', actor: Actor) {
  assertStaff(actor);
  return atomic(async tx => {
    await requestLock(tx, `STORE-${requestKey}`);
    const order = await lockOrder(tx, orderId);
    if (!isSupervisor(actor) && order.createdById !== actor.id) throw forbidden('Solo puedes registrar el pago de un pedido creado por ti.');
    const transactionId = `STORE-${requestKey}`;
    const previous = await tx.payout.findUnique({ where: { transactionId } });
    if (previous) {
      if (previous.receiptId !== order.receipt?.id || previous.method !== method || previous.userId !== order.customerId) throw conflict('La referencia ya fue usada para otro pago.');
      return { id: previous.id, message: 'Pago ya registrado.' };
    }
    if (!order.createdById || !order.customerId || !order.receipt || !order.details.length || new Prisma.Decimal(order.total).lte(0)) throw conflict('El pedido no es válido para pago en tienda.');
    if (order.status !== 'pending' || order.stockReleasedAt || !order.expiresAt || order.expiresAt <= new Date() || order.work) throw conflict('La reserva venció o el pedido no admite pagos.');
    if (order.receipt.payouts.some(p => p.status !== 'rejected')) throw conflict('Existe otro pago pendiente, aprobado o reembolsado; solicita revisión financiera.');
    if (!new Prisma.Decimal(order.total).equals(order.receipt.total)) throw conflict('Importes del pedido y recibo inconsistentes.');
    const payment = await tx.payout.create({ data: { receiptId: order.receipt.id, userId: order.customerId, gateway: 'tienda', transactionId, status: 'approved', method, amount: order.total, currency: 'COP', confirmedAt: new Date() } });
    await synchronize(tx, order.id, actor.id);
    await event(tx, order.id, actor.id, 'store_payment_registered', `Cobro en tienda registrado: ${method === 'cash' ? 'efectivo' : 'tarjeta'}.`);
    return { id: payment.id, message: 'Pago en tienda registrado. El pedido entra en la cola pagada.' };
  });
}
