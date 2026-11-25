import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';

const target = process.env.EMPLOYEE_TEST_DATABASE_URL;
const url = target ? new URL(target) : null;

if (
  !url ||
  !['postgres:', 'postgresql:'].includes(url.protocol) ||
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !url.pathname.endsWith('_test')
) {
  throw new Error('Usa EMPLOYEE_TEST_DATABASE_URL con una base local exclusiva terminada en _test. Nunca uses tu base habitual.');
}

process.env.DATABASE_URL = target;
process.env.NODE_ENV = 'test';
process.env.ENABLE_PAYMENT_SIMULATION = 'true';
process.env.JWT_SECRET = 'address-integration-local-test-only-2026';

const { prisma: db } = require('../src/lib/prisma');
const app = require('../src/app').default;

test('Direcciones de despacho: validación HTTP y persistencia real', async (t) => {
  const run = randomUUID();
  const users: Record<string, { id: string; token: string }> = {};
  let productId: string | undefined;
  const server = createServer(app);

  try {
    for (const [name, role] of Object.entries({
      worker: 'employee', supervisor: 'superadmin', customer: 'client', driver: 'delivery',
    })) {
      const user = await db.user.create({
        data: {
          email: `${run}-${name}@address.test`,
          fullName: `Test ${name}`,
          role,
          hashedPassword: 'not-a-login-password',
          isActive: true,
        },
      });
      users[name] = {
        id: user.id,
        token: jwt.sign({ id: user.id, role }, process.env.JWT_SECRET!),
      };
    }

    const product = await db.product.create({
      data: { name: `Direcciones ${run}`, price: '10000', cost: '5000', stock: 10 },
    });
    productId = product.id;

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

    async function request(who: string, path: string, body: unknown, method = 'POST') {
      const response = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${users[who].token}`,
        },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    }

    const payload = (address: string) => ({
      requestKey: randomUUID(),
      customerId: users.customer.id,
      fulfillmentMethod: 'delivery',
      address,
      details: [{ productId, quantity: 1 }],
    });

    await t.test('500 caracteres: crear, pagar, recoger, empacar y despachar sin truncar ni duplicar', async () => {
      const address = 'A'.repeat(500);
      const created = await request('worker', '/employee/orders', payload(address));
      assert.equal(created.status, 201, JSON.stringify(created.body));
      const orderId = created.body.id;
      const path = `/employee/orders/${orderId}`;

      const paid = await request('supervisor', `${path}/simulate-payment`, {
        requestKey: randomUUID(), result: 'approved',
      });
      assert.equal(paid.status, 200, JSON.stringify(paid.body));
      assert.equal((await request('worker', `${path}/claim`, {})).status, 200);
      const picking = await request('worker', `${path}/picking`, {
        items: [{ detailId: created.body.details[0].id, pickedQuantity: 1 }],
      }, 'PATCH');
      assert.equal(picking.status, 200, JSON.stringify(picking.body));
      assert.equal((await request('worker', `${path}/pack`, {})).status, 200);

      for (let attempt = 0; attempt < 2; attempt++) {
        const dispatched = await request('worker', `${path}/dispatch`, { driverId: users.driver.id });
        assert.equal(dispatched.status, 200, JSON.stringify(dispatched.body));
      }

      const shipments = await db.despatch.findMany({ where: { orderId } });
      assert.equal(shipments.length, 1);
      assert.equal(shipments[0].address, address);
      const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { work: true } });
      assert.equal(order.deliverySnapshot, address);
      assert.equal(order.status, 'shipped');
      assert.equal(order.work.status, 'dispatched');
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock, 9);
    });

    await t.test('501 caracteres: el pedido se rechaza sin reservar stock', async () => {
      const result = await request('worker', '/employee/orders', payload('A'.repeat(501)));
      assert.equal(result.status, 400, JSON.stringify(result.body));
      assert.equal(await db.order.count({ where: { createdById: users.worker.id } }), 1);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock, 9);
    });

    await t.test('501 caracteres: crear o editar un despacho general devuelve 400', async () => {
      const body = { address: 'A'.repeat(501) };
      const created = await request('supervisor', '/despatches', { orderId: randomUUID(), ...body });
      const updated = await request('supervisor', `/despatches/${randomUUID()}`, body, 'PUT');
      assert.equal(created.status, 400, JSON.stringify(created.body));
      assert.equal(updated.status, 400, JSON.stringify(updated.body));
    });
  } finally {
    try {
      if (server.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
          server.closeIdleConnections();
        });
      }
      const userIds = Object.values(users).map((user) => user.id);
      const orders = await db.order.findMany({ where: { createdById: { in: userIds } }, select: { id: true } });
      const orderIds = orders.map((order: { id: string }) => order.id);
      const receipts = await db.receipt.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } });
      const receiptIds = receipts.map((receipt: { id: string }) => receipt.id);
      await db.payout.deleteMany({ where: { receiptId: { in: receiptIds } } });
      await db.receipt.deleteMany({ where: { id: { in: receiptIds } } });
      await db.despatch.deleteMany({ where: { orderId: { in: orderIds } } });
      await db.orderEvent.deleteMany({ where: { orderId: { in: orderIds } } });
      await db.orderWork.deleteMany({ where: { orderId: { in: orderIds } } });
      await db.orderDetail.deleteMany({ where: { orderId: { in: orderIds } } });
      await db.order.deleteMany({ where: { id: { in: orderIds } } });
      if (productId) {
        await db.inventoryMovement.deleteMany({ where: { productId } });
        await db.product.delete({ where: { id: productId } });
      }
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    } finally {
      await db.$disconnect();
    }
  }
});