import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { returnService } from './returns.service';

const db = prisma as any;
const actor = { id: 'buyer', role: 'client' };
let order: any;
let prior: number;
let created: any;
beforeEach(() => {
  order = { id: 'order', customerId: 'buyer', status: 'delivered', details: [{ productId: 'product', quantity: 3 }] };
  prior = 0; created = null;
  db.$transaction = async (fn: any) => fn(db);
  db.$queryRaw = async () => [];
  db.order.findUnique = async () => order;
  db.orderReturn.aggregate = async () => ({ _sum: { quantity: prior } });
  db.orderReturn.create = async ({ data }: any) => { created = data; return { id: 'return', ...data }; };
  db.orderReturn.findUnique = async () => ({ id: 'return', customerId: 'buyer' });
});
const input = { orderId: 'order', productId: 'product', quantity: 2, reason: 'Producto defectuoso' };
const status = (code: number) => (error: unknown) => error instanceof HttpError && error.status === code;

test('La devolución de cliente usa el propietario del pedido, no un customerId del navegador', async () => {
  await returnService.create(input, actor);
  assert.equal(created.customerId, 'buyer');
});
test('Rechaza pedidos ajenos, no entregados o cantidades ya solicitadas', async () => {
  await assert.rejects(returnService.create(input, { ...actor, id: 'other' }), status(403));
  order.status = 'shipped';
  await assert.rejects(returnService.create(input, actor), status(400));
  order.status = 'delivered'; prior = 2;
  await assert.rejects(returnService.create(input, actor), status(400));
  assert.equal(created, null);
});
test('El listado y el detalle no revelan devoluciones de otros clientes', async () => {
  let where: unknown;
  db.orderReturn.findMany = async (args: any) => { where = args.where; return []; };
  await returnService.list(actor);
  assert.deepEqual(where, { customerId: 'buyer' });
  await returnService.list({ id: 'super', role: 'superadmin' });
  assert.deepEqual(where, {});
  await assert.rejects(returnService.getById('return', { ...actor, id: 'other' }), status(403));
});
test('HTTP: solo superadmin puede resolver una devolución, el cliente no puede aprobar la suya', async () => {
  process.env.JWT_SECRET = 'returns-tests-not-for-production-secret';
  db.user.findUnique = async () => ({ ...actor, isActive: true, deletedAt: null });
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/returns/11111111-1111-4111-8111-111111111111/resolve`;
    const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign(actor, process.env.JWT_SECRET!)}` }, body: JSON.stringify({ status: 'approved' }) });
    assert.equal(response.status, 403);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
