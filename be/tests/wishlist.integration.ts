import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';

const target = process.env.EMPLOYEE_TEST_DATABASE_URL;
const url = target ? new URL(target) : null;
if (!url || !['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Se requiere una base PostgreSQL local exclusiva terminada en _test.');
process.env.DATABASE_URL = target;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'wishlist-local-integration-test-secret-2026';
const { prisma: db } = require('../src/lib/prisma');
const app = require('../src/app').default;

test('RF-025: lista privada y persistente con HTTP y PostgreSQL aislado', async t => {
  const run = randomUUID();
  const users: Record<string, { id: string; token: string }> = {};
  const ids: string[] = [];
  const server = createServer(app);
  try {
    for (const [name, role] of Object.entries({ ana: 'client', bea: 'client', employee: 'employee', driver: 'delivery', admin: 'admin', superadmin: 'superadmin' })) {
      const user = await db.user.create({ data: { email: `${run}-${name}@wishlist.test`, fullName: name, role, hashedPassword: 'not-a-login-password' } });
      users[name] = { id: user.id, token: jwt.sign({ id: user.id }, process.env.JWT_SECRET!) };
    }
    for (const name of ['A', 'B']) {
      const product = await db.product.create({ data: { name: `${run}-${name}`, price: 5000, stock: 3 } }); ids.push(product.id);
    }
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/lista-deseos`;
    async function req(who: string | null, method = 'GET', path = '', body?: unknown) {
      const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(who ? { Authorization: `Bearer ${users[who].token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, cache: response.headers.get('cache-control'), body: response.status === 204 ? null : await response.json() };
    }
    await t.test('Exige sesión y rol cliente en lectura y escritura', async () => {
      assert.equal((await req(null)).status, 401);
      for (const role of ['employee', 'driver', 'admin', 'superadmin']) {
        assert.equal((await req(role)).status, 403);
        assert.equal((await req(role, 'POST', '', { productId: ids[0] })).status, 403);
        assert.equal((await req(role, 'DELETE', `/${ids[0]}`)).status, 403);
      }
    });
    await t.test('Valida UUID y no acepta usuario externo ni producto inexistente', async () => {
      assert.equal((await req('ana', 'POST', '', { productId: '12' })).status, 400);
      assert.equal((await req('ana', 'POST', '', { productId: ids[0], userId: users.bea.id })).status, 400);
      assert.equal((await req('ana', 'POST', '', { productId: randomUUID() })).status, 404);
      assert.equal((await req('ana', 'DELETE', '/incorrecto')).status, 400);
    });
    await t.test('Altas concurrentes: una fila y conflicto 409 sin tocar el carrito', async () => {
      const outcomes = await Promise.all(Array.from({ length: 8 }, () => req('ana', 'POST', '', { productId: ids[0] })));
      assert.deepEqual(outcomes.map(x => x.status).sort(), [201, 409, 409, 409, 409, 409, 409, 409]);
      assert.equal(await db.wishlist.count({ where: { userId: users.ana.id, productId: ids[0] } }), 1);
      assert.equal(await db.shopping.count({ where: { userId: users.ana.id } }), 0);
      const saved = await req('ana'); assert.equal(saved.cache, 'no-store'); assert.equal(saved.body[0].product.name, `${run}-A`);
    });
    await t.test('Listas separadas y eliminación limitada a la cuenta', async () => {
      assert.equal((await req('bea')).body.length, 0);
      assert.equal((await req('bea', 'POST', '', { productId: ids[0] })).status, 201);
      assert.equal((await req('bea', 'DELETE', `/${ids[0]}`)).status, 204);
      assert.equal((await req('bea', 'DELETE', `/${ids[0]}`)).status, 204);
      assert.equal((await req('bea')).body.length, 0);
      assert.equal((await req('ana')).body.length, 1);
    });
    await t.test('Agregar al carrito conserva el favorito', async () => {
      const response = await fetch(base.replace('/lista-deseos', '/shopping'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.ana.token}` }, body: JSON.stringify({ productId: ids[0], quantity: 1 }) });
      assert.ok(response.ok);
      assert.equal(await db.shopping.count({ where: { userId: users.ana.id, productId: ids[0] } }), 1);
      assert.equal((await req('ana')).body.length, 1);
    });
    await t.test('Producto inactivado sigue visible para quitarlo y no permite nuevas altas', async () => {
      await db.product.update({ where: { id: ids[0] }, data: { deletedAt: new Date() } });
      assert.ok((await req('ana')).body[0].product.deletedAt);
      assert.equal((await req('bea', 'POST', '', { productId: ids[0] })).status, 404);
      assert.equal((await req('ana', 'DELETE', `/${ids[0]}`)).status, 204);
      assert.equal((await req('ana')).body.length, 0);
    });
    await t.test('El estado en base persiste entre consultas y no comparte productos', async () => {
      assert.equal((await req('ana', 'POST', '', { productId: ids[1] })).status, 201);
      assert.equal((await req('ana')).body[0].productId, ids[1]);
      assert.equal((await req('bea')).body.length, 0);
    });
  } finally {
    if (server.listening) await new Promise<void>(resolve => server.close(() => resolve()));
    await db.shopping.deleteMany({ where: { userId: { in: Object.values(users).map(user => user.id) } } });
    await db.wishlist.deleteMany({ where: { userId: { in: Object.values(users).map(user => user.id) } } });
    await db.product.deleteMany({ where: { id: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: Object.values(users).map(user => user.id) } } });
    await db.$disconnect();
  }
});
