import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Defensa explícita: nunca probar escrituras sobre Supabase ni sobre la base habitual.
const target = process.env.EMPLOYEE_TEST_DATABASE_URL;
if (!target) throw new Error('Define EMPLOYEE_TEST_DATABASE_URL con una base local exclusiva terminada en _test.');
const url = new URL(target);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Se requiere PostgreSQL local terminado en _test.');
process.env.DATABASE_URL = target;
const { prisma: db } = require('../src/lib/prisma');
const { pqrService } = require('../src/modules/pqr/pqr.service');
const { shoppingService } = require('../src/modules/shopping/shopping.service');

test('Cliente: UUID sin pgcrypto en search_path, carrito concurrente y PQR sin duplicados', async t => {
  const run = randomUUID();
  const buyer = await db.user.create({ data: { email: `${run}@customer.test`, fullName: 'Prueba de cliente', hashedPassword: 'not-for-login', role: 'client' } });
  const product = await db.product.create({ data: { name: `Carrito ${run}`, price: 10000, stock: 20 } });
  const actor = { id: buyer.id, role: 'client' };
  const input = { type: 'petition', subject: 'Consulta de entrega', description: 'Necesito información sobre la entrega del pedido.' };
  try {
    await t.test('Genera UUID v7 únicos con search_path restringido al de Prisma', async () => {
      await db.$transaction(async (tx: any) => {
        await tx.$executeRawUnsafe('SET LOCAL search_path TO public');
        const rows = await tx.$queryRawUnsafe('SELECT public.uuid_generate_v7()::text AS id FROM generate_series(1, 100)');
        assert.equal(new Set(rows.map((row: any) => row.id)).size, 100);
        for (const row of rows) assert.match(row.id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      });
    });
    await t.test('Diez altas simultáneas crean una fila y suman las diez unidades', async () => {
      await Promise.all(Array.from({ length: 10 }, () => shoppingService.addItem(buyer.id, product.id, 1)));
      const items = await shoppingService.list(buyer.id);
      assert.equal(items.length, 1); assert.equal(items[0].quantity, 10);
      assert.equal(items[0].product.name, `Carrito ${run}`);
    });
    await t.test('Doble envío y pestañas simultáneas crean solo un PQR', async () => {
      const results = await Promise.allSettled([pqrService.create(input, actor), pqrService.create(input, actor)]);
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      assert.equal(await db.pqrRequest.count({ where: { customerId: buyer.id } }), 1);
      await assert.rejects(pqrService.create({ ...input, subject: 'Otro asunto' }, actor), (error: any) => error.status === 429);
      await db.pqrRequest.updateMany({ where: { customerId: buyer.id }, data: { createdAt: new Date(Date.now() - 61000) } });
      await assert.rejects(pqrService.create(input, actor), (error: any) => error.status === 409);
      await pqrService.create({ ...input, subject: 'Otro asunto' }, actor);
      assert.equal(await db.pqrRequest.count({ where: { customerId: buyer.id } }), 2);
    });
  } finally {
    await db.pqrRequest.deleteMany({ where: { customerId: buyer.id } });
    await db.shopping.deleteMany({ where: { userId: buyer.id } });
    await db.product.delete({ where: { id: product.id } });
    await db.user.delete({ where: { id: buyer.id } });
    await db.$disconnect();
  }
});
