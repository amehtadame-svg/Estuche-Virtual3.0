import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import app from '../../app';
import { promotionalCodeService } from './promotional-code.service';

const db = prisma as any;
let promo: any;
let query: any;
beforeEach(() => {
  process.env.JWT_SECRET = 'coupon-test-secret-not-for-production';
  promo = { id: 'coupon', code: 'ESTUCHE10', active: true, type: 'percentage', value: 10,
    startDate: new Date('2020-01-01'), endDate: new Date('2099-01-01'), minPurchase: 50000, maxUses: 10, currentUses: 0 };
  db.promotionalCode.findFirst = async (args: any) => { query = args; return promo; };
  db.user.findUnique = async () => ({ id: 'buyer', role: 'client', isActive: true, deletedAt: null });
});
const invalid = (message: RegExp) => (error: unknown) => error instanceof HttpError && error.status === 400 && message.test(error.message);

test('Valida cupón ignorando espacios y mayúsculas, sin consumir usos', async () => {
  const result = await promotionalCodeService.validate(' estuche10 ', 50000);
  assert.equal(result.code, 'ESTUCHE10');
  assert.deepEqual(query.where.code, { equals: 'estuche10', mode: 'insensitive' });
  assert.equal(result.currentUses, 0);
});

test('Un cupón inexistente es un error de negocio 400, no un endpoint 404', async () => {
  promo = null;
  await assert.rejects(promotionalCodeService.validate('NOEXISTE', 50000), invalid(/No encontramos/));
});

test('El último día del cupón sigue siendo válido durante todo el día UTC', async () => {
  promo.endDate = new Date(new Date().toISOString().slice(0, 10));
  assert.equal((await promotionalCodeService.validate('ESTUCHE10', 50000)).id, 'coupon');
});

for (const [field, value, message] of [
  ['active', false, /activo/], ['minPurchase', 60000, /requiere al menos/],
  ['currentUses', 10, /límite/], ['endDate', new Date('2000-01-01'), /expirado/],
  ['startDate', new Date('2098-01-01'), /disponible/],
] as const) {
  test(`Rechaza cupón que incumple ${field}`, async () => {
    promo[field] = value;
    await assert.rejects(promotionalCodeService.validate('ESTUCHE10', 50000), invalid(message));
  });
}

test('POST /api/promotional-codes/validate responde a un cliente autenticado', async () => {
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const token = jwt.sign({ id: 'buyer', role: 'client' }, process.env.JWT_SECRET!);
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/promotional-codes/validate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: 'estuche10', total: 50000 }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json() as any).code, 'ESTUCHE10');
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});

test('La cotización usa precios de BD, devuelve ahorro y envío; validar no consume usos', async () => {
  db.product.findMany = async () => [{ id: 'product', price: 30000, stock: 10 }];
  const result = await promotionalCodeService.quote('ESTUCHE10', [{ productId: 'product', quantity: 2 }], { id: 'buyer', role: 'client' });
  assert.deepEqual(result, { code: 'ESTUCHE10', type: 'percentage', value: 10, subtotal: 60000, discountAmount: 6000, shippingCost: 10000, total: 64000 });
  assert.equal(promo.currentUses, 0);
});
test('Un descuento no afecta el umbral de envío gratis ni excede el subtotal', async () => {
  db.product.findMany = async () => [{ id: 'product', price: 120000, stock: 10 }];
  const result = await promotionalCodeService.quote('ESTUCHE10', [{ productId: 'product', quantity: 1 }], { id: 'buyer', role: 'client' });
  assert.equal(result.shippingCost, 0);
  assert.equal(result.total, 108000);
  promo.type = 'fixed'; promo.value = 999999;
  const fixed = await promotionalCodeService.quote('ESTUCHE10', [{ productId: 'product', quantity: 1 }], { id: 'buyer', role: 'client' });
  assert.equal(fixed.total, 0);
  assert.equal(fixed.discountAmount, 120000);
});
test('No cotiza productos eliminados ni cantidades sin stock', async () => {
  db.product.findMany = async () => [];
  await assert.rejects(promotionalCodeService.quote('ESTUCHE10', [{ productId: 'missing', quantity: 1 }], { id: 'buyer', role: 'client' }), invalid(/Actualiza tu carrito/));
});
