import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { orderService } from './orders.service';
import { verifyToken } from '../../middlewares/auth.middleware';
import type { Request, Response, NextFunction } from 'express';
import app from '../../app';

const db = prisma as any;
const client = { id: 'user-1', role: 'client' };
const hasStatus = (status: number) => (error: unknown) =>
  error instanceof HttpError && error.status === status;

async function withServer(run: (base: string) => Promise<void>) {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await run(base);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    );
  }
}

test('Las rutas de pedidos y recibos rechazan peticiones sin token', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  await withServer(async (base) => {
    for (const [method, path] of [
      ['GET', '/api/orders'], ['GET', `/api/orders/${id}`],
      ['POST', '/api/orders'], ['PUT', `/api/orders/${id}`],
      ['DELETE', `/api/orders/${id}`], ['POST', `/api/orders/${id}/archive`],
      ['POST', `/api/orders/${id}/unarchive`], ['PATCH', `/api/orders/${id}/apply-code`],
      ['GET', '/api/receipts'], ['POST', '/api/receipts'],
      ['PUT', `/api/receipts/${id}`], ['DELETE', `/api/receipts/${id}`],
    ]) {
      assert.equal((await fetch(base + path, { method })).status, 401, `${method} ${path}`);
    }
  });
});

test('Un cliente autenticado no puede editar ni eliminar pedidos o recibos', async () => {
  process.env.JWT_SECRET = 'test-permissions-secret-only-not-production';
  db.user.findUnique = async () => ({ ...client, isActive: true, deletedAt: null });
  const token = jwt.sign(client, process.env.JWT_SECRET);
  const id = '11111111-1111-4111-8111-111111111111';
  await withServer(async (base) => {
    for (const path of [`/api/orders/${id}`, `/api/receipts/${id}`]) {
      for (const method of ['PUT', 'DELETE']) {
        const response = await fetch(base + path, {
          method, headers: { Authorization: `Bearer ${token}` },
        });
        assert.equal(response.status, 403, `${method} ${path}`);
      }
    }
  });
});

test('El listado de cliente se filtra por propietario', async () => {
  let where: any;
  db.order.findMany = async (args: any) => { where = args.where; return []; };
  await orderService.list(client);
  assert.deepEqual(where, { deletedAt: null, customerId: client.id });
  await orderService.list({ id: 'admin-1', role: 'admin' });
  assert.deepEqual(where, { deletedAt: null });
});

test('No se puede consultar un pedido ajeno', async () => {
  db.order.findUnique = async () => ({ id: 'order-1', customerId: 'other' });
  await assert.rejects(orderService.getById('order-1', client), hasStatus(403));
});

test('Empleado no hereda permisos de pedidos', async () => {
  await assert.rejects(
    orderService.getById('order-1', { id: 'employee-1', role: 'employee' }),
    hasStatus(403),
  );
});

test('No se puede crear ni marcar un pedido pagado mediante el CRUD', async () => {
  // A-01 (Franck): un pedido sin líneas se rechaza antes de tocar la base.
  await assert.rejects(orderService.create({ status: 'paid' } as any, client), hasStatus(400));

  // Protección de Paula: ni creando ni editando se puede poner `paid`, y una
  // edición idéntica no escribe. La transacción se simula porque la prueba no
  // accede a la base real.
  const originalTransaction = db.$transaction;
  let current: { id: string; status: string; total: number; createdById: string | null; work: { id: string } | null } =
    { id: 'order-1', status: 'pending', total: 100, createdById: null, work: null };
  let writes = 0;
  const tx = {
    $queryRaw: async () => [],
    order: {
      findUnique: async () => current,
      update: async () => { writes++; return current; },
    },
    orderDetail: {
      findMany: async () => [{ unitPrice: 100, quantity: 1 }],
    },
  };
  db.$transaction = async (fn: any) => fn(tx);
  try {
    await assert.rejects(orderService.update('order-1', { status: 'paid' }), hasStatus(400));
    current = { ...current, status: 'paid' };
    const result = await orderService.update('order-1', { status: 'paid' });
    assert.ok('sinCambios' in result && result.sinCambios === true);
    await assert.rejects(orderService.update('order-1', { total: 200 }), hasStatus(409));
    current = { ...current, status: 'pending', createdById: 'empleado-1' };
    await assert.rejects(orderService.update('order-1', { total: 200 }), hasStatus(409));
    assert.equal(writes, 0);
  } finally {
    db.$transaction = originalTransaction;
  }
});

test('El rol vigente de BD prevalece sobre el rol antiguo del token', async () => {
  process.env.JWT_SECRET = 'test-permissions-secret-only-not-production';
  db.user.findUnique = async () => ({ ...client, isActive: true, deletedAt: null });
  const token = jwt.sign({ id: client.id, role: 'superadmin' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } } as Request;
  let nextCalled = false;
  await verifyToken(req, {} as Response, (() => { nextCalled = true; }) as NextFunction);
  assert.equal(nextCalled, true);
  assert.equal((req as any).user.role, 'client');
});

test('El detalle de pedido incluye productos y recibo sin exponer tokens de pago', async () => {
  let query: any;
  const ownOrder = { id: 'order-1', customerId: client.id, status: 'paid', details: [], receipt: null };
  db.order.findUnique = async (args: any) => { query = args; return ownOrder; };
  assert.deepEqual(await orderService.getById('order-1', client), ownOrder);
  assert.deepEqual(query.where, { id: 'order-1', deletedAt: null });
  assert.equal(query.include.details.select.quantity, true);
  assert.deepEqual(query.include.details.select.product, { select: { name: true } });
  assert.deepEqual(query.include.receipt.select.payouts.select, { gateway: true });
});

test('HTTP: consultar estado devuelve el pedido propio y rechaza pedidos ajenos o inexistentes', async () => {
  process.env.JWT_SECRET = 'test-order-tracking-secret-not-production';
  db.user.findUnique = async () => ({ ...client, isActive: true, deletedAt: null });
  const headers = { Authorization: `Bearer ${jwt.sign(client, process.env.JWT_SECRET)}` };
  const id = '11111111-1111-4111-8111-111111111111';
  let savedOrder: any = {
    id, customerId: client.id, status: 'preparing', total: '25000.00',
    details: [{ id: 'detail-1', product: { name: 'Cuaderno' }, quantity: 2, unitPrice: '12500.00', subtotal: '25000.00' }],
    receipt: { receiptNumber: 45, paymentStatus: 'paid', payouts: [{ gateway: 'demo-academica' }] },
  };
  db.order.findUnique = async () => savedOrder;
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/orders/${id}`, { headers });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.status, 'preparing');
    assert.equal(data.details[0].product.name, 'Cuaderno');
    assert.equal(data.receipt.receiptNumber, 45);
    savedOrder = { ...savedOrder, customerId: 'other-client' };
    assert.equal((await fetch(`${base}/api/orders/${id}`, { headers })).status, 403);
    savedOrder = null;
    assert.equal((await fetch(`${base}/api/orders/${id}`, { headers })).status, 404);
    assert.equal((await fetch(`${base}/api/orders/no-es-un-uuid`, { headers })).status, 400);
  });
});
