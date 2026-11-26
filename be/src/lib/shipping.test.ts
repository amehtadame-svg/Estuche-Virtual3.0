import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingCost } from './shipping';

test('Domicilio de 10000 COP, gratis desde 120000; carrito vacío y retiro no pagan envío', () => {
  assert.equal(shippingCost(0), 0);
  assert.equal(shippingCost(119999.99), 10000);
  assert.equal(shippingCost(120000), 0);
  assert.equal(shippingCost(150000), 0);
  assert.equal(shippingCost(50000, true), 0);
});
