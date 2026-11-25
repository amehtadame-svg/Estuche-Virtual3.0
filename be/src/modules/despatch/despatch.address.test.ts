import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDespatchSchema,
  updateDespatchSchema,
} from './despatch.schema';
import { newEmployeeOrder } from '../employee/employee.schema';

const id = '11111111-1111-4111-8111-111111111111';

const employeeOrder = (address: string) => ({
  requestKey: id,
  customerId: id,
  fulfillmentMethod: 'delivery',
  address,
  details: [{ productId: id, quantity: 1 }],
});

test('Pedido y despacho aceptan direcciones de 255, 256 y 500 caracteres sin recortarlas', () => {
  for (const length of [255, 256, 500]) {
    const address = 'A'.repeat(length);

    assert.equal(newEmployeeOrder.parse(employeeOrder(address)).address, address);
    assert.equal(createDespatchSchema.parse({ orderId: id, address }).address, address);
    assert.equal(updateDespatchSchema.parse({ address }).address, address);
  }
});

test('Pedido, creación y edición de despacho rechazan direcciones de 501 caracteres', () => {
  const address = 'A'.repeat(501);

  assert.equal(newEmployeeOrder.safeParse(employeeOrder(address)).success, false);
  assert.equal(createDespatchSchema.safeParse({ orderId: id, address }).success, false);
  assert.equal(updateDespatchSchema.safeParse({ address }).success, false);
});

test('El nuevo límite no hace obligatoria la dirección en los despachos generales', () => {
  assert.equal(createDespatchSchema.safeParse({ orderId: id }).success, true);
  assert.equal(updateDespatchSchema.safeParse({ status: 'delivered' }).success, true);
});