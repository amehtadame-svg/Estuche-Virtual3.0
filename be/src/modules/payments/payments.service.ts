import { Prisma } from '@prisma/client';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import {
  Actor, assertSimulation, atomic, event, fingerprint, lockOrder, requestLock,
} from '../employee/employee.domain';
import { DemoCheckout } from './payments.schema';

const paymentInclude = { receipt: { include: { order: true } } } satisfies Prisma.PayoutInclude;
type DemoPayment = Prisma.PayoutGetPayload<{ include: typeof paymentInclude }>;
const reference = (key: string) => `DEMO-${key}`;

function assertBuyer(actor: Actor) {
  assertSimulation();
  if (!['client', 'admin', 'superadmin'].includes(actor.role)) throw forbidden();
}

function owned(payment: DemoPayment | null, actor: Actor): asserts payment is DemoPayment {
  if (!payment || payment.userId !== actor.id || payment.gateway !== 'demo-academica') {
    throw notFound('Pago de demostración no encontrado.');
  }
}

function response(payment: DemoPayment) {
  return {
    simulated: true,
    message: 'Demostración académica: no hubo ningún cobro real.',
    reference: payment.transactionId,
    status: payment.status,
    method: payment.method,
    amount: payment.amount,
    currency: payment.currency,
    orderId: payment.receipt.orderId,
    orderStatus: payment.receipt.order?.status,
    receiptNumber: payment.receipt.receiptNumber,
    expiresAt: payment.receipt.order?.expiresAt,
  };
}

async function findPayment(tx: Prisma.TransactionClient, key: string) {
  return tx.payout.findUnique({
    where: { transactionId: reference(key) }, include: paymentInclude,
  });
}

async function settle(
  tx: Prisma.TransactionClient, payment: DemoPayment,
  outcome: 'approved' | 'rejected', actor: Actor,
) {
  const order = await lockOrder(tx, payment.receipt.orderId!);
  // La fila del pedido serializa también confirmaciones concurrentes del administrador.
  const current = await tx.payout.findUniqueOrThrow({ where: { id: payment.id } });
  if (current.status === outcome) return;
  if (current.status !== 'pending') throw conflict('El resultado de este pago ya es definitivo.');
  if (order.status !== 'pending' || order.stockReleasedAt ||
    !order.expiresAt || order.expiresAt <= new Date()) {
    throw conflict('La reserva venció o el pedido ya no admite pagos.');
  }
  if (!order.receipt || !new Prisma.Decimal(order.total).equals(order.receipt.total) ||
    !new Prisma.Decimal(order.total).equals(current.amount) ||
    order.receipt.payouts.some((p) => p.status === 'approved' || p.status === 'refunded')) {
    throw conflict('El pedido requiere revisión financiera.');
  }
  await tx.payout.update({
    where: { id: payment.id },
    data: { status: outcome, confirmedAt: outcome === 'approved' ? new Date() : null },
  });
  await tx.receipt.update({
    where: { id: payment.receiptId },
    data: { paymentStatus: outcome === 'approved' ? 'paid' : 'voided' },
  });
  if (outcome === 'rejected') {
    for (const item of [...order.details].sort((a, b) => a.productId.localeCompare(b.productId))) {
      await tx.product.update({
        where: { id: item.productId }, data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({ data: {
        productId: item.productId, type: 'in', quantity: item.quantity,
        userId: actor.id, reason: `Rechazo de pago DEMO - pedido ${order.id}`,
      } });
    }
  }
  await tx.order.update({
    where: { id: order.id },
    data: {
      status: outcome === 'approved' ? 'paid' : 'canceled',
      expiresAt: null,
      ...(outcome === 'rejected' ? { stockReleasedAt: new Date() } : {}),
    },
  });
  await event(tx, order.id, actor.id, `demo_payment_${outcome}`, 'SIMULACIÓN ACADÉMICA: sin dinero real.');
}

export const paymentsService = {
  async checkout(input: DemoCheckout, actor: Actor) {
    assertBuyer(actor);
    return atomic(async (tx) => {
      await requestLock(tx, reference(input.requestKey));
      const previous = await findPayment(tx, input.requestKey);
      if (previous) {
        owned(previous, actor);
        if (previous.gatewayToken !== fingerprint(input)) {
          throw conflict('Esta referencia pertenece a otro intento. Recupera su resultado antes de continuar.');
        }
        return response(previous);
      }

      // Precios, descuento, disponibilidad y total proceden exclusivamente de la BD.
      let total = new Prisma.Decimal(0);
      const details = [];
      for (const item of [...input.items].sort((a, b) => a.productId.localeCompare(b.productId))) {
        const product = await tx.product.findUnique({ where: { id: item.productId, deletedAt: null } });
        if (!product || product.stock < item.quantity || product.price.lte(0)) {
          throw badRequest('Un producto no está disponible o no tiene stock suficiente.');
        }
        const subtotal = product.price.mul(item.quantity);
        total = total.plus(subtotal);
        details.push({ ...item, unitPrice: product.price, subtotal });
      }
      let promotionalCodeId: string | undefined;
      if (input.code) {
        // Bloqueo compartido con otros checkouts para no exceder maxUses.
        await tx.$queryRaw`SELECT id FROM promotional_codes WHERE code = ${input.code} FOR UPDATE`;
        const promo = await tx.promotionalCode.findUnique({ where: { code: input.code } });
        const today = new Date().toISOString().slice(0, 10);
        if (!promo || !promo.active || promo.startDate.toISOString().slice(0, 10) > today ||
          promo.endDate.toISOString().slice(0, 10) < today || total.lt(promo.minPurchase ?? 0) ||
          (promo.maxUses !== null && (promo.currentUses ?? 0) >= promo.maxUses)) {
          throw badRequest('El código no está vigente, no cumple el mínimo o agotó sus usos.');
        }
        total = promo.type === 'percentage'
          ? total.mul(new Prisma.Decimal(100).minus(promo.value)).div(100)
          : total.minus(promo.value);
        promotionalCodeId = promo.id;
        await tx.promotionalCode.update({
          where: { id: promo.id }, data: { currentUses: (promo.currentUses ?? 0) + 1 },
        });
      }
      total = total.toDecimalPlaces(2);
      if (total.lte(0)) throw badRequest('La demostración requiere un total mayor que cero.');
      const order = await tx.order.create({ data: {
        customerId: actor.id, createdById: actor.id, total, status: 'pending',
        deliverySnapshot: input.address, promotionalCodeId,
        expiresAt: new Date(Date.now() + 30 * 60000),
        details: { create: details },
      } });
      for (const item of details) {
        const reserved = await tx.product.updateMany({
          where: { id: item.productId, deletedAt: null, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) throw badRequest('El stock cambió. Actualiza el carrito.');
        await tx.inventoryMovement.create({ data: {
          productId: item.productId, type: 'out', quantity: item.quantity,
          userId: actor.id, reason: `Reserva DEMO - pedido ${order.id}`,
        } });
      }
      await tx.user.update({ where: { id: actor.id }, data: { phone: input.phone, address: input.address } });
      const receipt = await tx.receipt.create({ data: {
        orderId: order.id, customerId: actor.id, total, paymentStatus: 'pending',
        receiptItems: { create: details },
      } });
      const payment = await tx.payout.create({ data: {
        receiptId: receipt.id, userId: actor.id, gateway: 'demo-academica',
        transactionId: reference(input.requestKey), gatewayToken: fingerprint(input),
        method: input.method, amount: total, currency: 'COP', status: 'pending',
      }, include: paymentInclude });
      await tx.shopping.deleteMany({ where: { userId: actor.id, productId: { in: details.map((item) => item.productId) } } });
      await event(tx, order.id, actor.id, 'demo_checkout', 'SIMULACIÓN ACADÉMICA. Envío gratis; reserva por 30 minutos.');
      if (input.outcome !== 'pending') await settle(tx, payment, input.outcome, actor);
      return response((await findPayment(tx, input.requestKey))!);
    });
  },

  async get(key: string, actor: Actor) {
    assertBuyer(actor);
    return atomic(async (tx) => {
      await requestLock(tx, reference(key));
      const payment = await findPayment(tx, key);
      owned(payment, actor);
      return response(payment);
    });
  },

  async resolve(key: string, outcome: 'approved' | 'rejected', actor: Actor) {
    assertBuyer(actor);
    return atomic(async (tx) => {
      await requestLock(tx, reference(key));
      const payment = await findPayment(tx, key);
      owned(payment, actor);
      await settle(tx, payment, outcome, actor);
      return response((await findPayment(tx, key))!);
    });
  },
};
