import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Nunca ejecutar contra la base habitual ni contra Supabase.
const target = process.env.PAYMENT_TEST_DATABASE_URL || process.env.EMPLOYEE_TEST_DATABASE_URL;
if (!target) throw new Error('Define PAYMENT_TEST_DATABASE_URL con una base local exclusiva terminada en _test.');
const url = new URL(target);
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) {
  throw new Error('Las pruebas de pagos requieren PostgreSQL local y una base terminada en _test.');
}
process.env.DATABASE_URL = target;
process.env.NODE_ENV = 'test';
process.env.ENABLE_PAYMENT_SIMULATION = 'true';

const { prisma: db } = require('../src/lib/prisma');
const { paymentsService } = require('../src/modules/payments/payments.service');
const { supervisionService } = require('../src/modules/supervision/supervision.service');

test('Pagos académicos: idempotencia y carreras con transacciones reales', async (t) => {
  const run = randomUUID();
  const buyer = await db.user.create({ data: {
    email: `${run}@payments.test`, fullName: 'Cliente de prueba de pagos',
    hashedPassword: 'not-a-login-password', role: 'client',
  } });
  const product = await db.product.create({ data: {
    name: `Pago ${run}`, price: '12500.25', stock: 20,
  } });
  const scarce = await db.product.create({ data: {
    name: `Escaso ${run}`, price: '2000', stock: 1,
  } });
  const actor = { id: buyer.id, role: 'client' };
  const input = (overrides: Record<string, unknown> = {}) => ({
    requestKey: randomUUID(), method: 'pse', outcome: 'pending',
    address: 'Calle de prueba 123, Bogotá', phone: '3001234567',
    items: [{ productId: product.id, quantity: 2 }], ...overrides,
  });
  try {
    await t.test('Dos peticiones con la misma clave crean un solo pedido y pago', async () => {
      const body = input();
      const results = await Promise.all([
        paymentsService.checkout(body, actor), paymentsService.checkout(body, actor),
      ]);
      assert.equal(results[0].reference, results[1].reference);
      assert.equal(await db.payout.count({ where: { userId: buyer.id } }), 1);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock, 18);
      await Promise.all([
        paymentsService.resolve(body.requestKey, 'approved', actor),
        paymentsService.resolve(body.requestKey, 'approved', actor),
      ]);
      const order = await db.order.findUniqueOrThrow({ where: { id: results[0].orderId }, include: { events: true, receipt: true } });
      assert.equal(order.status, 'paid');
      assert.equal(order.receipt.paymentStatus, 'paid');
      assert.equal(order.events.filter((event: any) => event.action === 'demo_payment_approved').length, 1);
    });
    await t.test('Dos rechazos simultáneos devuelven inventario una sola vez', async () => {
      const body = input({ method: 'nequi' });
      await paymentsService.checkout(body, actor);
      await Promise.all([
        paymentsService.resolve(body.requestKey, 'rejected', actor),
        paymentsService.resolve(body.requestKey, 'rejected', actor),
      ]);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock, 18);
      const cart = await db.shopping.findUniqueOrThrow({ where: { userId_productId: { userId: buyer.id, productId: product.id } } });
      assert.equal(cart.quantity, 2);
    });
    await t.test('Aprobar y rechazar simultáneamente solo permite un resultado definitivo', async () => {
      const body = input({ method: 'tarjeta' });
      const payment = await paymentsService.checkout(body, actor);
      const outcomes = await Promise.allSettled([
        paymentsService.resolve(body.requestKey, 'approved', actor),
        paymentsService.resolve(body.requestKey, 'rejected', actor),
      ]);
      assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
      assert.equal(outcomes.filter((result) => result.status === 'rejected').length, 1);
      const saved = await paymentsService.get(body.requestKey, actor);
      const order = await db.order.findUniqueOrThrow({ where: { id: payment.orderId }, include: { receipt: true } });
      assert.equal(order.status, saved.status === 'approved' ? 'paid' : 'canceled');
      assert.equal(order.receipt.paymentStatus, saved.status === 'approved' ? 'paid' : 'voided');
    });
    await t.test('Dos compras compitiendo por una unidad no generan stock negativo ni pedidos huérfanos', async () => {
      const count = await db.order.count({ where: { customerId: buyer.id } });
      const outcomes = await Promise.allSettled([
        paymentsService.checkout(input({ items: [{ productId: scarce.id, quantity: 1 }], outcome: 'approved' }), actor),
        paymentsService.checkout(input({ items: [{ productId: scarce.id, quantity: 1 }], outcome: 'approved' }), actor),
      ]);
      assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: scarce.id } })).stock, 0);
      assert.equal(await db.order.count({ where: { customerId: buyer.id } }), count + 1);
    });
    await t.test('Una reserva vencida se libera con el flujo existente y no puede pagarse después', async () => {
      const body = input();
      const payment = await paymentsService.checkout(body, actor);
      await db.order.update({ where: { id: payment.orderId }, data: { expiresAt: new Date(0) } });
      await supervisionService.cancel(payment.orderId, 'Prueba de vencimiento académico', null, true);
      await assert.rejects(paymentsService.resolve(body.requestKey, 'approved', actor), (err: any) => err.status === 409);
      const order = await db.order.findUniqueOrThrow({ where: { id: payment.orderId } });
      assert.equal(order.status, 'canceled');
      assert.ok(order.stockReleasedAt);
    });
    await t.test('Rechazo y nueva compra recuperan carrito sin dejar bloqueado el pedido siguiente', async () => {
      await db.shopping.deleteMany({ where: { userId: buyer.id } });
      await db.shopping.create({ data: { userId: buyer.id, productId: product.id, quantity: 2 } });
      const first = input({ outcome: 'rejected' });
      const rejected = await paymentsService.checkout(first, actor);
      assert.equal(rejected.status, 'rejected');
      const restored = await db.shopping.findUniqueOrThrow({ where: { userId_productId: { userId: buyer.id, productId: product.id } } });
      assert.equal(restored.quantity, 2);
      const second = input({ outcome: 'approved' });
      const approved = await paymentsService.checkout(second, actor);
      assert.equal(approved.status, 'approved');
      assert.notEqual(approved.reference, rejected.reference);
      assert.notEqual(approved.orderId, rejected.orderId);
      assert.equal(await db.shopping.count({ where: { userId: buyer.id } }), 0);
      const original = await paymentsService.get(first.requestKey, actor);
      assert.equal(original.status, 'rejected');
    });
  } finally {
    const orders = await db.order.findMany({ where: { customerId: buyer.id }, select: { id: true } });
    const orderIds = orders.map((order: any) => order.id);
    const receipts = await db.receipt.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } });
    const receiptIds = receipts.map((receipt: any) => receipt.id);
    await db.payout.deleteMany({ where: { receiptId: { in: receiptIds } } });
    await db.receiptItem.deleteMany({ where: { receiptId: { in: receiptIds } } });
    await db.receipt.deleteMany({ where: { id: { in: receiptIds } } });
    await db.orderEvent.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.orderDetail.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
    await db.inventoryMovement.deleteMany({ where: { productId: { in: [product.id, scarce.id] } } });
    await db.shopping.deleteMany({ where: { userId: buyer.id } });
    await db.product.deleteMany({ where: { id: { in: [product.id, scarce.id] } } });
    await db.user.delete({ where: { id: buyer.id } });
    await db.$disconnect();
  }
});
