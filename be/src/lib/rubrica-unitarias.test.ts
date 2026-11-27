import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingCost } from './shipping';
import { phoneSchema } from './phone';
import { toDateKey } from './reportDate';
import { createReturnSchema } from '../modules/returns/returns.schema';
import { createProductSchema } from '../modules/products/products.schema';

// Casos de reglas y validaciones aisladas: no crean servidores ni consultan BD.
const id = '019a0bcd-1234-7abc-9def-0123456789ab';
const validReturn = { orderId: id, productId: id, quantity: 1, reason: 'Defecto' };
const validProduct = { name: 'Cuaderno', price: 1000 };

test('envío: subtotal vacío no genera cobro', () => assert.equal(shippingCost(0), 0));
test('envío: subtotal positivo inferior al umbral cobra domicilio', () => assert.equal(shippingCost(119999), 10000));
test('envío: el umbral exacto obtiene domicilio gratis', () => assert.equal(shippingCost(120000), 0));
test('envío: un subtotal superior al umbral obtiene domicilio gratis', () => assert.equal(shippingCost(120001), 0));
test('envío: retiro en tienda no cobra domicilio', () => assert.equal(shippingCost(1000, true), 0));

test('teléfono: se acepta número nacional de diez dígitos', () => assert.equal(phoneSchema.safeParse('3001234567').success, true));
test('teléfono: se acepta indicativo y diez dígitos', () => assert.equal(phoneSchema.safeParse('+57 3001234567').success, true));
test('teléfono: se rechazan nueve dígitos', () => assert.equal(phoneSchema.safeParse('300123456').success, false));
test('teléfono: se rechazan letras', () => assert.equal(phoneSchema.safeParse('30012a4567').success, false));
test('teléfono: se eliminan espacios exteriores', () => assert.equal(phoneSchema.parse(' 3001234567 '), '3001234567'));

test('fecha: antes de medianoche en Bogotá corresponde al día anterior', () => assert.equal(toDateKey('2026-11-26T04:59:59Z'), '2026-11-25'));
test('fecha: medianoche en Bogotá corresponde al día nuevo', () => assert.equal(toDateKey('2026-11-26T05:00:00Z'), '2026-11-26'));
test('fecha: una fecha de calendario se conserva', () => assert.equal(toDateKey('2026-11-26'), '2026-11-26'));
test('fecha: un valor no interpretable devuelve null', () => assert.equal(toDateKey('fecha inválida'), null));
test('fecha: un valor ausente devuelve null', () => assert.equal(toDateKey(null), null));

test('devolución: acepta el mínimo de una unidad', () => assert.equal(createReturnSchema.safeParse(validReturn).success, true));
test('devolución: rechaza cantidad cero', () => assert.equal(createReturnSchema.safeParse({ ...validReturn, quantity: 0 }).success, false));
test('devolución: rechaza cantidad fraccionaria', () => assert.equal(createReturnSchema.safeParse({ ...validReturn, quantity: 1.5 }).success, false));
test('devolución: acepta motivo de 50 caracteres', () => assert.equal(createReturnSchema.safeParse({ ...validReturn, reason: 'a'.repeat(50) }).success, true));
test('devolución: rechaza motivo de 51 caracteres', () => assert.equal(createReturnSchema.safeParse({ ...validReturn, reason: 'a'.repeat(51) }).success, false));

test('producto: acepta datos mínimos válidos', () => assert.equal(createProductSchema.safeParse(validProduct).success, true));
test('producto: rechaza nombre vacío tras recortar espacios', () => assert.equal(createProductSchema.safeParse({ ...validProduct, name: '  ' }).success, false));
test('producto: rechaza precio cero', () => assert.equal(createProductSchema.safeParse({ ...validProduct, price: 0 }).success, false));
test('producto: rechaza stock negativo', () => assert.equal(createProductSchema.safeParse({ ...validProduct, stock: -1 }).success, false));
test('producto: acepta stock cero', () => assert.equal(createProductSchema.safeParse({ ...validProduct, stock: 0 }).success, true));
