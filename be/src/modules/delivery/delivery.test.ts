import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import app from '../../app';
import { prisma } from '../../lib/prisma';

// Doble transaccional: no prueba el bloqueo PostgreSQL.
test('Confirmar entrega exige repartidor asignado, pago y estado operativo; reintentar es idempotente', async () => {
  process.env.JWT_SECRET = 'test-delivery-secret-not-for-production';
  const db = prisma as any;
  const id = '11111111-1111-4111-8111-111111111111';
  const state: any = {
    shipment: { id, orderId: id, driverId: 'driver', status: 'in_transit' },
    order: { id, status: 'shipped', total: new Prisma.Decimal(100), work: { status: 'dispatched' }, receipt: { total: new Prisma.Decimal(100), paymentStatus: 'paid', payouts: [{ status: 'approved', amount: new Prisma.Decimal(100), currency: 'COP', confirmedAt: new Date() }] } },
    events: [],
  };
  db.user.findUnique = async ({ where }: any) => ({ id: where.id, role: where.id === 'employee' ? 'employee' : 'delivery', isActive: true, deletedAt: null });
  db.$transaction = async (fn: any) => fn(db);
  db.$queryRaw = async () => [];
  db.order.findUnique = async () => state.order;
  db.order.update = async ({ data }: any) => Object.assign(state.order, data);
  db.orderWork.update = async ({ data }: any) => Object.assign(state.order.work, data);
  db.orderEvent.create = async ({ data }: any) => { state.events.push(data); return data; };
  db.despatch.findUnique = async () => state.shipment;
  db.despatch.update = async ({ data }: any) => Object.assign(state.shipment, data);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/delivery/despatches/${id}/confirm`;
  const post = (actor: string) => fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${jwt.sign({ id: actor }, process.env.JWT_SECRET!)}`, 'Content-Type': 'application/json' }, body: '{}' });
  try {
    assert.equal((await post('employee')).status, 403);
    assert.equal((await post('other')).status, 404);
    state.order.receipt.payouts = [];
    assert.equal((await post('driver')).status, 409);
    assert.equal(state.shipment.status, 'in_transit');
    state.order.receipt.payouts = [{ status: 'approved', amount: new Prisma.Decimal(100), currency: 'COP', confirmedAt: new Date() }];
    assert.equal((await post('driver')).status, 200);
    assert.equal((await post('driver')).status, 200);
    assert.equal(state.shipment.status, 'delivered');
    assert.equal(state.order.status, 'delivered');
    assert.equal(state.order.work.status, 'completed');
    assert.deepEqual(state.events.map((e: any) => e.action), ['delivery_confirmed']);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
