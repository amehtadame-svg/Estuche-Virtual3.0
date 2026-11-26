import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { registerStorePayment } from './store-payment.service';
import { storePaymentSchema } from './employee.schema';

// Dobles de Prisma: las carreras y bloqueos se verifican en PostgreSQL por integración.
const db = prisma as any;
const worker = { id: 'worker', role: 'employee' };
const key = '22222222-2222-4222-8222-222222222222';
const errorStatus = (status: number) => (e: unknown) => e instanceof HttpError && e.status === status;
let state: any;
beforeEach(() => {
  state = { order: { id: 'order', createdById: 'worker', customerId: 'buyer', total: new Prisma.Decimal(15000), status: 'pending', expiresAt: new Date(Date.now() + 60000), stockReleasedAt: null, work: null, details: [{ productId: 'p', quantity: 1 }] }, receipt: { id: 'receipt', total: new Prisma.Decimal(15000), paymentStatus: 'pending' }, payments: [], events: [] };
  db.$transaction = async (fn: any) => {
    const snapshot = { order: { ...state.order }, receipt: { ...state.receipt }, payments: [...state.payments], events: [...state.events] };
    try { return await fn(db); } catch (e) { state = snapshot; throw e; }
  };
  db.$executeRaw = async () => 1;
  db.$queryRaw = async () => [];
  db.order.findUnique = async () => ({ ...state.order, receipt: state.receipt && { ...state.receipt, payouts: state.payments } });
  db.order.update = async ({ data }: any) => { Object.assign(state.order, data); return state.order; };
  db.receipt.update = async ({ data }: any) => { Object.assign(state.receipt, data); return state.receipt; };
  db.payout.findUnique = async ({ where }: any) => state.payments.find((p: any) => p.transactionId === where.transactionId) || null;
  db.payout.create = async ({ data }: any) => { const payment = { id: 'pay-1', ...data }; state.payments.push(payment); return payment; };
  db.orderEvent.create = async ({ data }: any) => { state.events.push(data); return data; };
});

test('Pago en tienda valida referencia y medio; no acepta importes externos', () => {
  assert.equal(storePaymentSchema.safeParse({ requestKey: key, method: 'cash' }).success, true);
  assert.equal(storePaymentSchema.safeParse({ requestKey: key, method: 'card' }).success, true);
  assert.equal(storePaymentSchema.safeParse({ requestKey: key, method: 'cash', amount: 1 }).success, false);
  assert.equal(storePaymentSchema.safeParse({ requestKey: key, method: 'pse' }).success, false);
});

test('Pago en tienda crea evidencia y sincroniza recibo y pedido una sola vez', async () => {
  const first = await registerStorePayment('order', key, 'cash', worker);
  const second = await registerStorePayment('order', key, 'cash', worker);
  assert.equal(first.id, second.id);
  assert.equal(state.payments.length, 1);
  assert.equal(state.payments[0].amount.toString(), '15000');
  assert.equal(state.payments[0].userId, 'buyer');
  assert.equal(state.payments[0].gateway, 'tienda');
  assert.ok(state.payments[0].confirmedAt instanceof Date);
  assert.equal(state.receipt.paymentStatus, 'paid');
  assert.equal(state.order.status, 'paid');
  assert.equal(state.order.expiresAt, null);
  assert.deepEqual(state.events.map((e: any) => e.action), ['payment_confirmed', 'store_payment_registered']);
  await assert.rejects(registerStorePayment('order', key, 'card', worker), errorStatus(409));
  await assert.rejects(registerStorePayment('order', 'another', 'cash', worker), errorStatus(409));
});

test('Solo personal autorizado puede registrar; supervisor puede registrar ajeno', async () => {
  await assert.rejects(registerStorePayment('order', key, 'card', { id: 'x', role: 'client' }), errorStatus(403));
  await assert.rejects(registerStorePayment('order', key, 'card', { id: 'other', role: 'employee' }), errorStatus(403));
  await registerStorePayment('order', key, 'card', { id: 'admin', role: 'admin' });
  assert.equal(state.payments[0].method, 'card');
});

test('Rechaza reservas vencidas, pagos pendientes y recibos inconsistentes', async () => {
  state.order.expiresAt = new Date(Date.now() - 1);
  await assert.rejects(registerStorePayment('order', key, 'cash', worker), errorStatus(409));
  state.order.expiresAt = new Date(Date.now() + 60000);
  state.payments.push({ status: 'pending' });
  await assert.rejects(registerStorePayment('order', key, 'cash', worker), errorStatus(409));
  state.payments = [];
  state.receipt.total = new Prisma.Decimal(1);
  await assert.rejects(registerStorePayment('order', key, 'cash', worker), errorStatus(409));
  assert.equal(state.payments.length, 0);
  assert.equal(state.order.status, 'pending');
});
