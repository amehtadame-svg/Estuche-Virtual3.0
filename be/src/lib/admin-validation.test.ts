import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phoneSchema } from './phone';
import { toDateKey } from './reportDate';
import { createProductSchema } from '../modules/products/products.schema';
import { createReturnSchema } from '../modules/returns/returns.schema';

const id = '019a0bcd-1234-7abc-9def-0123456789ab';

test('Teléfonos locales o con indicativo: 10 dígitos nacionales sin letras', () => {
  for (const phone of ['', '3001234567', '+57 3001234567', '+1 3475551234']) assert.equal(phoneSchema.safeParse(phone).success, true, phone);
  for (const phone of ['300123456', '+57 300123456', '30012a4567', '+573001234567', '300123456789']) assert.equal(phoneSchema.safeParse(phone).success, false, phone);
});

test('Motivo de devolución tiene un máximo de 50 caracteres', () => {
  const data = { orderId: id, productId: id, quantity: 1 };
  assert.equal(createReturnSchema.safeParse({ ...data, reason: 'a'.repeat(50) }).success, true);
  assert.equal(createReturnSchema.safeParse({ ...data, reason: 'a'.repeat(51) }).success, false);
});

test('Reportes respetan el día calendario de Bogotá', () => {
  assert.equal(toDateKey('2026-11-26T04:59:00Z'), '2026-11-25');
  assert.equal(toDateKey('2026-11-26T05:00:00Z'), '2026-11-26');
  assert.equal(toDateKey('2026-11-26'), '2026-11-26');
  assert.equal(toDateKey('no es fecha'), null);
});

test('Productos rechazan importes o cantidades que exceden los límites de PostgreSQL', () => {
  assert.equal(createProductSchema.safeParse({ name: 'Prueba', price: 100, stock: 2147483647 }).success, true);
  assert.equal(createProductSchema.safeParse({ name: 'Prueba', price: 100, stock: 2147483648 }).success, false);
  assert.equal(createProductSchema.safeParse({ name: 'Prueba', price: 1000000000000 }).success, false);
});
