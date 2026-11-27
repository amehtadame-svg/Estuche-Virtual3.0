import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import app from '../../app';
import { paymentsService } from './payments.service';
import { demoCheckoutSchema, demoResolveSchema, DemoCheckout } from './payments.schema';

// Dobles de Prisma: prueban reglas y transacciones lógicas, no bloqueos de PostgreSQL.
const db = prisma as any;
const buyer = { id: '11111111-1111-4111-8111-111111111111', role: 'client' };
const key = '22222222-2222-4222-8222-222222222222';
const productId = '33333333-3333-4333-8333-333333333333';
const input = (overrides: Partial<DemoCheckout> = {}): DemoCheckout => ({
  requestKey: key, method: 'pse', outcome: 'pending', phone: '3001234567',
  address: 'Calle de prueba 123, Bogotá', items: [{ productId, quantity: 2 }], ...overrides,
});
const status = (code: number) => (error: unknown) => error instanceof HttpError && error.status === code;
let state: any;
let failReceipt = false;
let stockRace = false;

function paymentView() {
  if (!state.payment) return null;
  return { ...state.payment, receipt: { ...state.receipt, order: { ...state.order } } };
}

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_PAYMENT_SIMULATION = 'true';
  process.env.JWT_SECRET = 'test-payments-secret-not-for-real-deployment';
  failReceipt = false;
  stockRace = false;
  state = { stock: 5, order: null, receipt: null, payment: null, movements: [], events: [], cartCleared: false, cartRestored: 0, promo: null };
  db.$transaction = async (fn: any) => {
    const snapshot = { ...state, movements: [...state.movements], events: [...state.events] };
    try { return await fn(db); } catch (error) { state = snapshot; throw error; }
  };
  db.$executeRaw = async () => 1;
  db.$queryRaw = async () => [];
  db.product.findUnique = async () => ({ id: productId, price: new Prisma.Decimal('12500.25'), stock: state.stock });
  db.product.updateMany = async ({ data }: any) => {
    if (stockRace) return { count: 0 };
    state.stock -= data.stock.decrement;
    return { count: 1 };
  };
  db.product.update = async ({ data }: any) => { state.stock += data.stock.increment; return {}; };
  db.order.create = async ({ data }: any) => {
    state.order = { id: 'order-1', ...data, details: data.details.create, stockReleasedAt: null };
    return state.order;
  };
  db.order.findUnique = async () => state.order && ({
    ...state.order, receipt: state.receipt ? { ...state.receipt, payouts: state.payment ? [state.payment] : [] } : null,
  });
  db.order.update = async ({ data }: any) => { state.order = { ...state.order, ...data }; return state.order; };
  db.receipt.create = async ({ data }: any) => {
    if (failReceipt) throw new Error('Fallo de base de datos');
    state.receipt = { id: 'receipt-1', receiptNumber: 100, ...data };
    return state.receipt;
  };
  db.receipt.update = async ({ data }: any) => { state.receipt = { ...state.receipt, ...data }; return state.receipt; };
  db.payout.findUnique = async ({ where }: any) => state.payment?.transactionId === where.transactionId ? paymentView() : null;
  db.payout.findUniqueOrThrow = async () => ({ ...state.payment });
  db.payout.create = async ({ data }: any) => { state.payment = { id: 'payment-1', ...data }; return paymentView(); };
  db.payout.update = async ({ data }: any) => { state.payment = { ...state.payment, ...data }; return state.payment; };
  db.user.update = async () => ({});
  db.user.findUnique = async () => ({ ...buyer, isActive: true, deletedAt: null });
  db.inventoryMovement.create = async ({ data }: any) => { state.movements.push(data); return data; };
  db.orderEvent.create = async ({ data }: any) => { state.events.push(data); return data; };
  db.shopping.deleteMany = async () => { state.cartCleared = true; return { count: 1 }; };
  db.shopping.upsert = async ({ create }: any) => { state.cartRestored += create.quantity; return create; };
  db.promotionalCode.findFirst = async () => state.promo;
  db.promotionalCode.findUnique = async () => state.promo;
  db.promotionalCode.update = async ({ data }: any) => { state.promo = { ...state.promo, ...data }; return state.promo; };
});

test('El esquema admite solo PSE, tarjeta y Nequi; rechaza precios, datos bancarios y carrito vacío', () => {
  for (const method of ['pse', 'tarjeta', 'nequi']) assert.equal(demoCheckoutSchema.safeParse({ ...input(), method }).success, true);
  for (const invalid of [
    { ...input(), method: 'efectivo' }, { ...input(), total: 1 }, { ...input(), cardNumber: '1234' },
    { ...input(), items: [] }, { ...input(), phone: '123' }, { ...input(), address: 'a'.repeat(256) },
    { ...input(), items: [{ productId, quantity: 0 }] },
    { ...input(), items: [{ productId, quantity: 1, unitPrice: 0 }] },
    { ...input(), items: [{ productId, quantity: 1 }, { productId, quantity: 1 }] },
  ]) assert.equal(demoCheckoutSchema.safeParse(invalid).success, false);
  assert.equal(demoResolveSchema.safeParse({ outcome: 'pending' }).success, false);
});

test('Simulación deshabilitada por defecto y siempre bloqueada en producción', async () => {
  delete process.env.ENABLE_PAYMENT_SIMULATION;
  await assert.rejects(paymentsService.checkout(input(), buyer), status(403));
  process.env.ENABLE_PAYMENT_SIMULATION = 'true';
  process.env.NODE_ENV = 'production';
  await assert.rejects(paymentsService.checkout(input(), buyer), status(403));
  assert.equal(state.order, null);
});

test('El empleado no puede usar el checkout de cliente', async () => {
  await assert.rejects(paymentsService.checkout(input(), { ...buyer, role: 'employee' }), status(403));
});

test('Calcula COP desde BD, envío de $10.000 y reserva pendiente sin marcar recibo pagado', async () => {
  const result = await paymentsService.checkout(input(), buyer);
  assert.equal(result.amount.toString(), '35000.5');
  assert.equal(Number(result.shippingCost), 10000);
  assert.equal(result.currency, 'COP');
  assert.equal(result.status, 'pending');
  assert.equal(result.orderStatus, 'pending');
  assert.equal(state.receipt.paymentStatus, 'pending');
  assert.equal(state.stock, 3);
  assert.equal(state.cartCleared, true);
  assert.equal(state.payment.gateway, 'demo-academica');
  assert.equal(result.reference, `DEMO-${key}`);
});

for (const method of ['pse', 'tarjeta', 'nequi'] as const) {
  test(`Aprobación ${method}: confirma pago, recibo y pedido de forma consistente`, async () => {
    const result = await paymentsService.checkout(input({ method, outcome: 'approved' }), buyer);
    assert.equal(result.status, 'approved');
    assert.equal(result.orderStatus, 'paid');
    assert.equal(state.receipt.paymentStatus, 'paid');
    assert.ok(state.payment.confirmedAt instanceof Date);
    assert.equal(state.order.expiresAt, null);
    assert.equal(state.stock, 3);
  });
}

test('Rechazo: cancela pedido y libera inventario una sola vez', async () => {
  await paymentsService.checkout(input({ outcome: 'rejected' }), buyer);
  assert.equal(state.order.status, 'canceled');
  assert.equal(state.receipt.paymentStatus, 'voided');
  assert.equal(state.stock, 5);
  await paymentsService.resolve(key, 'rejected', buyer);
  assert.equal(state.stock, 5);
  assert.equal(state.movements.length, 2);
  assert.equal(state.cartRestored, 2);
  await assert.rejects(paymentsService.resolve(key, 'approved', buyer), status(409));
});

test('Una referencia repetida no crea otro pedido ni descuenta stock otra vez', async () => {
  const first = await paymentsService.checkout(input(), buyer);
  const second = await paymentsService.checkout(input(), buyer);
  assert.deepEqual(first, second);
  assert.equal(state.stock, 3);
  assert.equal(state.movements.length, 1);
  await assert.rejects(paymentsService.checkout(input({ method: 'nequi' }), buyer), status(409));
});

test('Solo el propietario puede recuperar, reutilizar o resolver el pago', async () => {
  await paymentsService.checkout(input(), buyer);
  const other = { ...buyer, id: 'otro-cliente' };
  await assert.rejects(paymentsService.get(key, other), status(404));
  await assert.rejects(paymentsService.resolve(key, 'approved', other), status(404));
  await assert.rejects(paymentsService.checkout(input(), other), status(404));
  assert.equal(state.payment.status, 'pending');
});

test('Un pendiente puede aprobarse; una segunda confirmación no duplica movimientos', async () => {
  await paymentsService.checkout(input(), buyer);
  await paymentsService.resolve(key, 'approved', buyer);
  await paymentsService.resolve(key, 'approved', buyer);
  assert.equal(state.events.filter((e: any) => e.action === 'demo_payment_approved').length, 1);
  assert.equal(state.stock, 3);
});

test('Bloquea reservas vencidas o canceladas y pagos de importe inconsistente', async () => {
  await paymentsService.checkout(input(), buyer);
  state.order = { ...state.order, expiresAt: new Date(0) };
  await assert.rejects(paymentsService.resolve(key, 'approved', buyer), status(409));
  state.order = { ...state.order, expiresAt: new Date(Date.now() + 60000), status: 'canceled' };
  await assert.rejects(paymentsService.resolve(key, 'approved', buyer), status(409));
  state.order = { ...state.order, status: 'pending' };
  state.payment = { ...state.payment, amount: new Prisma.Decimal(1) };
  await assert.rejects(paymentsService.resolve(key, 'approved', buyer), status(409));
});

test('Stock insuficiente o carrera de inventario abortan la compra', async () => {
  state.stock = 1;
  await assert.rejects(paymentsService.checkout(input(), buyer), status(400));
  state.stock = 5;
  stockRace = true;
  await assert.rejects(paymentsService.checkout(input(), buyer), status(400));
  assert.equal(state.order, null);
});

test('Un fallo del recibo revierte el pedido, stock y movimientos de la transacción', async () => {
  failReceipt = true;
  await assert.rejects(paymentsService.checkout(input(), buyer), /Fallo de base de datos/);
  assert.equal(state.order, null);
  assert.equal(state.stock, 5);
  assert.equal(state.movements.length, 0);
});

test('Valida descuento vigente y mínimo en servidor; consume un solo uso por referencia', async () => {
  state.promo = {
    id: 'promo-1', active: true, type: 'percentage', value: new Prisma.Decimal(10),
    minPurchase: 20000, startDate: new Date('2020-01-01'), endDate: new Date('2099-01-01'),
    maxUses: 1, currentUses: 0,
  };
  const result = await paymentsService.checkout(input({ code: 'DEMO10' }), buyer);
  assert.equal(result.amount.toString(), '32500.45');
  await paymentsService.checkout(input({ code: 'DEMO10' }), buyer);
  assert.equal(state.promo.currentUses, 1);
  await assert.rejects(paymentsService.checkout(input({ code: 'DEMO10', requestKey: 'otra-referencia' }), buyer), status(400));
});

test('Rutas HTTP: exigen sesión, validan entradas y permiten al cliente completar una demo', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/payments`;
  const headers = { Authorization: `Bearer ${jwt.sign(buyer, process.env.JWT_SECRET!)}`, 'Content-Type': 'application/json' };
  try {
    for (const [path, method] of [['/config', 'GET'], [`/demo/${key}`, 'GET'], ['/demo/checkout', 'POST'], [`/demo/${key}/resolve`, 'POST']]) {
      assert.equal((await fetch(base + path, { method })).status, 401);
    }
    assert.equal((await fetch(`${base}/config`, { headers }).then((r) => r.json())).enabled, true);
    assert.equal((await fetch(`${base}/demo/checkout`, { method: 'POST', headers, body: JSON.stringify({ ...input(), total: 1 }) })).status, 400);
    const checkout = await fetch(`${base}/demo/checkout`, { method: 'POST', headers, body: JSON.stringify(input()) });
    assert.equal(checkout.status, 200);
    assert.equal((await checkout.json()).status, 'pending');
    const resolve = await fetch(`${base}/demo/${key}/resolve`, { method: 'POST', headers, body: JSON.stringify({ outcome: 'approved' }) });
    assert.equal(resolve.status, 200);
    assert.equal((await resolve.json()).orderStatus, 'paid');
    assert.equal((await fetch(`${base}/demo/not-a-uuid`, { headers })).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('HTTP: un producto con UUID histórico puede agregarse al carrito, editarse y pagarse sin migrar su ID', async () => {
  const legacyId = '10000000-0000-0000-0000-000000000001';
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const headers = { Authorization: `Bearer ${jwt.sign(buyer, process.env.JWT_SECRET!)}`, 'Content-Type': 'application/json' };
  let cartItem: any = null;
  const lookedUp: string[] = [];
  db.shopping.findUnique = async () => cartItem;
  db.shopping.upsert = async ({ create, update }: any) => { cartItem = cartItem ? { ...cartItem, quantity: cartItem.quantity + update.quantity.increment } : { id: 'cart-1', ...create }; return cartItem; };
  db.shopping.update = async ({ where, data }: any) => {
    assert.equal(where.userId_productId.productId, legacyId);
    cartItem = { ...cartItem, ...data };
    return cartItem;
  };
  db.product.findUnique = async ({ where }: any) => {
    lookedUp.push(where.id);
    return { id: legacyId, price: new Prisma.Decimal('12500.25'), stock: state.stock };
  };
  try {
    const add = await fetch(`${base}/shopping`, { method: 'POST', headers, body: JSON.stringify({ productId: legacyId, quantity: 1 }) });
    assert.equal(add.status, 201);
    assert.equal((await add.json()).productId, legacyId);
    const edit = await fetch(`${base}/shopping/${legacyId}`, { method: 'PUT', headers, body: JSON.stringify({ quantity: 2 }) });
    assert.equal(edit.status, 200);
    assert.equal((await edit.json()).quantity, 2);
    const body = input({ items: [{ productId: legacyId, quantity: 2 }], outcome: 'approved' });
    const pay = await fetch(`${base}/payments/demo/checkout`, { method: 'POST', headers, body: JSON.stringify(body) });
    assert.equal(pay.status, 200);
    assert.equal((await pay.json()).status, 'approved');
    assert.deepEqual(lookedUp, [legacyId, legacyId]);
    assert.equal(state.order.details[0].productId, legacyId);
    assert.equal(state.stock, 3);
    const retry = await fetch(`${base}/payments/demo/checkout`, { method: 'POST', headers, body: JSON.stringify(body) });
    assert.equal(retry.status, 200);
    assert.equal(state.stock, 3);
    const invalid = await fetch(`${base}/payments/demo/checkout`, {
      method: 'POST', headers, body: JSON.stringify(input({ items: [{ productId: 'no-es-un-id', quantity: 1 }] })),
    });
    assert.equal(invalid.status, 400);
    assert.deepEqual((await invalid.json()).errors[0].path, ['items', 0, 'productId']);
    assert.equal(state.stock, 3);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Rechazar un pendiente restaura carrito y stock una sola vez; consultar no cambia el resultado', async () => {
  await paymentsService.checkout(input(), buyer);
  assert.equal(state.cartRestored, 0);
  const result = await paymentsService.resolve(key, 'rejected', buyer);
  assert.equal(result.status, 'rejected');
  assert.equal(state.stock, 5);
  assert.equal(state.cartRestored, 2);
  await paymentsService.get(key, buyer);
  await paymentsService.resolve(key, 'rejected', buyer);
  assert.equal(state.cartRestored, 2);
  assert.equal(state.stock, 5);
});

test('Después de un rechazo puede comprarse con otra referencia sin reutilizar el resultado anterior', async () => {
  const old = await paymentsService.checkout(input({ outcome: 'rejected' }), buyer);
  assert.equal(old.status, 'rejected');
  assert.equal(state.stock, 5);
  const next = await paymentsService.checkout(input({ requestKey: '44444444-4444-4444-8444-444444444444', outcome: 'approved' }), buyer);
  assert.notEqual(next.reference, old.reference);
  assert.equal(next.status, 'approved');
  assert.equal(state.stock, 3);
  assert.equal(state.cartRestored, 2);
});

test('Un fallo restaurando carrito revierte el rechazo completo y permite confirmarlo después', async () => {
  await paymentsService.checkout(input(), buyer);
  const restore = db.shopping.upsert;
  db.shopping.upsert = async () => { throw new Error('Fallo restaurando carrito'); };
  await assert.rejects(paymentsService.resolve(key, 'rejected', buyer), /Fallo restaurando carrito/);
  assert.equal(state.stock, 3);
  assert.equal(state.payment.status, 'pending');
  assert.equal(state.order.status, 'pending');
  assert.equal(state.receipt.paymentStatus, 'pending');
  db.shopping.upsert = restore;
  await paymentsService.resolve(key, 'rejected', buyer);
  assert.equal(state.stock, 5);
  assert.equal(state.cartRestored, 2);
});

for (const [subtotal, expectedShipping] of [[119999, 10000], [120000, 0], [120001, 0]]) {
  test(`Envío del checkout para subtotal ${subtotal}: ${expectedShipping} COP`, async () => {
    db.product.findUnique = async () => ({ id: productId, price: new Prisma.Decimal(subtotal), stock: 5 });
    const result = await paymentsService.checkout(input({ items: [{ productId, quantity: 1 }] }), buyer);
    assert.equal(Number(result.shippingCost), expectedShipping);
    assert.equal(Number(result.amount), subtotal + expectedShipping);
    assert.equal(Number(state.order.shippingCost), expectedShipping);
    assert.equal(Number(state.receipt.total), Number(result.amount));
    assert.equal(Number(state.payment.amount), Number(result.amount));
  });
}

test('El cupón no descuenta el domicilio ni elimina el beneficio de envío gratis', async () => {
  db.product.findUnique = async () => ({ id: productId, price: new Prisma.Decimal(120000), stock: 5 });
  state.promo = { id: 'promo-1', active: true, type: 'percentage', value: new Prisma.Decimal(10), minPurchase: 0,
    startDate: new Date('2020-01-01'), endDate: new Date('2099-01-01'), maxUses: null, currentUses: 0 };
  const result = await paymentsService.checkout(input({ code: ' demo10 ', items: [{ productId, quantity: 1 }] }), buyer);
  assert.equal(Number(result.amount), 108000);
  assert.equal(Number(result.shippingCost), 0);
});

test('Un descuento fijo mayor al subtotal nunca produce un envío negativo', async () => {
  state.promo = { id: 'promo-1', active: true, type: 'fixed', value: new Prisma.Decimal(50000), minPurchase: 0,
    startDate: new Date('2020-01-01'), endDate: new Date('2099-01-01'), maxUses: null, currentUses: 0 };
  const result = await paymentsService.checkout(input({ code: 'FIJO' }), buyer);
  assert.equal(Number(result.amount), 10000);
  assert.equal(Number(result.shippingCost), 10000);
});
