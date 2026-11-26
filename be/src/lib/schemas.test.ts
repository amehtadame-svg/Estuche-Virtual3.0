import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { databaseUuidSchema, uuidParam, uuidProductParam } from './schemas';
import { addItemSchema } from '../modules/shopping/shopping.schema';
import { demoCheckoutSchema, demoKeyParams } from '../modules/payments/payments.schema';

const legacy = '10000000-0000-0000-0000-000000000001';
const v4 = 'd5770a24-c15c-4ce9-a461-bfe910580ad8';
const v7 = '019a0bcd-1234-7abc-9def-0123456789ab';
const checkout = (productId: string, requestKey = v4) => ({
  requestKey, method: 'pse', outcome: 'approved', address: 'Calle de prueba 123',
  phone: '3001234567', items: [{ productId, quantity: 1 }],
});

test('IDs históricos de PostgreSQL son válidos en carrito, pago y rutas de recursos', () => {
  // Reproduce el fallo anterior: uuid() rechaza un ID almacenado legalmente en PostgreSQL.
  assert.equal(z.string().uuid().safeParse(legacy).success, false);
  for (const id of [legacy, v4, v7]) {
    assert.equal(databaseUuidSchema.parse(id), id);
    assert.equal(uuidParam.safeParse({ id }).success, true);
    assert.equal(uuidProductParam.safeParse({ productId: id }).success, true);
    assert.equal(addItemSchema.safeParse({ productId: id, quantity: 1 }).success, true);
    assert.equal(demoCheckoutSchema.safeParse(checkout(id)).success, true);
  }
});

test('Formato hexadecimal estricto: rechaza IDs incompletos, texto, SQL y tipos incorrectos', () => {
  for (const id of ['', '123', 123, null, undefined, 'producto-1',
    '10000000000000000000000000000001', `${legacy}extra`, ` ${legacy}`,
    'z0000000-0000-0000-0000-000000000001', "'; DROP TABLE products; --"]) {
    assert.equal(databaseUuidSchema.safeParse(id).success, false);
    assert.equal(demoCheckoutSchema.safeParse({ ...checkout(legacy), items: [{ productId: id, quantity: 1 }] }).success, false);
  }
});

test('La referencia de idempotencia sigue exigiendo UUID RFC, independiente del ID de producto', () => {
  for (const key of [v4, v7]) {
    assert.equal(demoKeyParams.safeParse({ key }).success, true);
    assert.equal(demoCheckoutSchema.safeParse(checkout(legacy, key)).success, true);
  }
  assert.equal(demoKeyParams.safeParse({ key: legacy }).success, false);
  assert.equal(demoCheckoutSchema.safeParse(checkout(legacy, legacy)).success, false);
});

test('Normaliza mayúsculas y detecta el mismo producto duplicado con distinta capitalización', () => {
  assert.equal(databaseUuidSchema.parse(v7.toUpperCase()), v7);
  const result = demoCheckoutSchema.safeParse({ ...checkout(v7), items: [
    { productId: v7, quantity: 1 }, { productId: v7.toUpperCase(), quantity: 1 },
  ] });
  assert.equal(result.success, false);
});

import { createProductSchema, updateProductSchema } from '../modules/products/products.schema';
import { createComboSchema, updateComboSchema } from '../modules/combos/combos.schema';
import { createInboundSchema, createOutboundSchema } from '../modules/inventory/inventory.schema';
import { newEmployeeOrder, pickingSchema } from '../modules/employee/employee.schema';
import { createReturnSchema } from '../modules/returns/returns.schema';

test('Formularios administrativos aceptan identificadores históricos sin admitir texto arbitrario', () => {
  for (const id of [legacy, v4, v7]) {
    assert.equal(createProductSchema.safeParse({ name: 'Prueba', price: 10, categoryId: id, supplierId: id }).success, true);
    assert.equal(updateProductSchema.safeParse({ categoryId: id }).success, true);
    assert.equal(createComboSchema.safeParse({ name: 'Combo', items: [{ productId: id, quantity: 1 }] }).success, true);
    assert.equal(updateComboSchema.safeParse({ items: [{ productId: id, quantity: 1 }] }).success, true);
    assert.equal(createInboundSchema.safeParse({ productId: id, supplierId: id, quantity: 1 }).success, true);
    assert.equal(createOutboundSchema.safeParse({ productId: id, quantity: 1, reasonType: 'Otro', reason: 'Prueba' }).success, true);
    assert.equal(newEmployeeOrder.safeParse({ requestKey: v4, customerId: id, fulfillmentMethod: 'pickup', details: [{ productId: id, quantity: 1 }] }).success, true);
    assert.equal(pickingSchema.safeParse({ items: [{ detailId: id, pickedQuantity: 1 }] }).success, true);
    assert.equal(createReturnSchema.safeParse({ orderId: id, productId: id, quantity: 1, reason: 'Defecto' }).success, true);
  }
  assert.equal(createInboundSchema.safeParse({ productId: 'invalido', quantity: 1 }).success, false);
  assert.equal(newEmployeeOrder.safeParse({ requestKey: legacy, customerId: v4, fulfillmentMethod: 'pickup', details: [{ productId: v4, quantity: 1 }] }).success, false);
  assert.equal(createReturnSchema.safeParse({ orderId: v4, productId: v4, quantity: 0, reason: 'x' }).success, false);
});
