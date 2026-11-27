import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { deliveryService } from './delivery.service';

// Dobles: las condiciones de carrera requieren integración real con PostgreSQL.
const db = prisma as any;
const driver = { id: 'driver', role: 'delivery' };
const failure = (status: number) => (error: unknown) => error instanceof HttpError && error.status === status;
let state: any;
beforeEach(() => {
  state = { order: { id: 'order', status: 'preparing', driverId: null, stockReleasedAt: null, fulfillmentMethod: 'delivery', deliverySnapshot: 'Calle 123', details: [{ id: 'line' }], work: { status: 'packed' }, total: new Prisma.Decimal(100), receipt: { total: new Prisma.Decimal(100), paymentStatus: 'paid', payouts: [{ status: 'approved', amount: new Prisma.Decimal(100), currency: 'COP', confirmedAt: new Date() }] } }, shipment: null, events: [] };
  db.$transaction = async (fn: any) => fn(db);
  db.$queryRaw = async () => [];
  db.order.findUnique = async () => state.order;
  db.order.findMany = async () => [state.order];
  db.order.update = async ({ data }: any) => Object.assign(state.order, data);
  db.orderWork.update = async ({ data }: any) => Object.assign(state.order.work, data);
  db.despatch.count = async () => state.shipment ? 1 : 0;
  db.despatch.findFirst = async ({ where }: any) => state.shipment?.driverId === where.driverId && state.shipment?.status === where.status ? state.shipment : null;
  db.despatch.create = async ({ data }: any) => { state.shipment = { id: 'shipment', ...data }; return state.shipment; };
  db.orderEvent.create = async ({ data }: any) => { state.events.push(data); return data; };
});

test('Pedidos pendientes solo muestran información mínima de órdenes pagadas', async () => {
  const items = await deliveryService.pending(driver);
  assert.equal(items.length, 1);
  assert.equal('deliverySnapshot' in items[0], false);
  assert.equal('customer' in items[0], false);
  state.order.receipt.payouts = [];
  assert.equal((await deliveryService.pending(driver)).length, 0);
  await assert.rejects(deliveryService.pending({ id: 'x', role: 'employee' }), failure(403));
});

test('Repartidor toma pedido empacado una vez; otro repartidor no puede tomarlo', async () => {
  const first = await deliveryService.claim('order', driver);
  assert.equal(first.id, 'shipment');
  assert.equal(state.order.status, 'shipped');
  assert.equal(state.order.work.status, 'dispatched');
  assert.equal(state.shipment.address, 'Calle 123');
  assert.equal(state.shipment.driverId, driver.id);
  assert.equal((await deliveryService.claim('order', driver)).id, first.id);
  await assert.rejects(deliveryService.claim('order', { id: 'other', role: 'delivery' }), failure(409));
  assert.equal(state.events.length, 1);
});

test('No admite empleados, pedidos no empacados, retiros ni pagos sin evidencia', async () => {
  await assert.rejects(deliveryService.claim('order', { id: 'employee', role: 'employee' }), failure(403));
  state.order.work.status = 'picking';
  await assert.rejects(deliveryService.claim('order', driver), failure(409));
  state.order.work.status = 'packed'; state.order.fulfillmentMethod = 'pickup';
  await assert.rejects(deliveryService.claim('order', driver), failure(409));
  state.order.fulfillmentMethod = 'delivery'; state.order.receipt.payouts = [];
  await assert.rejects(deliveryService.claim('order', driver), failure(409));
  assert.equal(state.shipment, null);
});
