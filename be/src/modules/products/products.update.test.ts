import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Regresión: la actualización de un producto era DESTRUCTIVA.
 *
 * products.service.update escribía `categoryId: data.categoryId ?? null` y
 * `supplierId: data.supplierId ?? null`. Como el panel de administración nunca
 * enviaba esos campos, cada vez que se guardaba un producto se le borraban la
 * categoría y el proveedor: por eso "había que volver a agregar los datos".
 *
 * Estas pruebas usan la misma técnica que orders.test.ts: se simula el
 * singleton de Prisma, así que no necesitan una base de datos.
 */

// eslint-disable-next-line @typescript-eslint/no-var-require
const { prisma } = require('../../lib/prisma') as { prisma: any };
import { productService } from './products.service';

const PRODUCT_ID = '00000000-0000-7000-8000-000000000001';
const CATEGORY_ID = '00000000-0000-7000-8000-0000000000aa';
const SUPPLIER_ID = '00000000-0000-7000-8000-0000000000bb';

const CURRENT = {
  id: PRODUCT_ID,
  name: 'Cuaderno cosido 100 hojas',
  description: 'Cuaderno universitario',
  price: 10000,
  stock: 10,
  stockMin: 5,
  categoryId: CATEGORY_ID,
  supplierId: SUPPLIER_ID,
  deletedAt: null,
};

function fakeTx(current: any = CURRENT) {
  const calls: { update: any; history: any[]; movements: any[] } = {
    update: null,
    history: [],
    movements: [],
  };

  const tx = {
    product: {
      findFirst: async () => current,
      update: async (args: any) => {
        calls.update = args;
        return { ...current, ...args.data };
      },
    },
    priceHistory: {
      create: async (args: any) => {
        calls.history.push(args.data);
        return args.data;
      },
    },
    inventoryMovement: {
      create: async (args: any) => {
        calls.movements.push(args.data);
        return args.data;
      },
    },
    productImage: {
      findFirst: async () => ({ id: 'img-1' }),
      update: async () => ({}),
      create: async () => ({}),
    },
  };

  (prisma as any).$transaction = async (fn: any) => fn(tx);
  return calls;
}

test('guardar un producto NO borra su categoría ni su proveedor', async () => {
  const calls = fakeTx();

  // El panel envía solo nombre, precio y stock (no manda categoryId).
  await productService.update(PRODUCT_ID, { name: 'Cuaderno cosido', price: 12000, stock: 8 });

  assert.ok(calls.update, 'debe llamarse a product.update');
  assert.ok(
    !('categoryId' in calls.update.data),
    'categoryId no debe aparecer en el patch si el cliente no lo envió'
  );
  assert.ok(
    !('supplierId' in calls.update.data),
    'supplierId no debe aparecer en el patch si el cliente no lo envió'
  );
  assert.strictEqual(calls.update.data.name, 'Cuaderno cosido');
});

test('un cambio de precio queda registrado en price_history (RF-017)', async () => {
  const calls = fakeTx();

  await productService.update(PRODUCT_ID, { price: 15000 }, { id: 'user-1' });

  assert.strictEqual(calls.history.length, 1, 'debe guardarse un registro de historial');
  assert.strictEqual(Number(calls.history[0].previousPrice), 10000);
  assert.strictEqual(Number(calls.history[0].newPrice), 15000);
  assert.strictEqual(calls.history[0].userId, 'user-1');
});

test('un cambio de stock queda registrado como movimiento de inventario (RF-016)', async () => {
  const calls = fakeTx();

  await productService.update(PRODUCT_ID, { stock: 25 }, { id: 'user-1' });

  assert.strictEqual(calls.movements.length, 1);
  assert.strictEqual(calls.movements[0].productId, PRODUCT_ID);
  assert.strictEqual(calls.movements[0].quantity, 15, 'de 10 a 25 son 15 unidades');
  assert.strictEqual(calls.movements[0].type, 'adjustment');
});

test('guardar sin cambios de precio ni stock no genera registros fantasma', async () => {
  const calls = fakeTx();

  await productService.update(PRODUCT_ID, { name: 'Mismo precio y stock' });

  assert.strictEqual(calls.history.length, 0);
  assert.strictEqual(calls.movements.length, 0);
});

test('enviar categoryId null sí limpia la relación (borrado explícito)', async () => {
  const calls = fakeTx();

  await productService.update(PRODUCT_ID, { categoryId: null });

  assert.strictEqual(calls.update.data.categoryId, null);
});

test('no se puede dejar el stock en negativo', async () => {
  fakeTx();

  await assert.rejects(
    productService.update(PRODUCT_ID, { stock: -5 }),
    (err: any) => err.status === 400
  );
});

test('el ajuste de inventario suma/resta y siempre queda en el kardex', async () => {
  const calls = fakeTx();

  const product = await productService.adjustStock(PRODUCT_ID, { delta: 5, reason: 'Compra a proveedor' }, { id: 'user-9' });
  assert.strictEqual(product.stock, 15, '10 + 5 = 15');
  assert.strictEqual(calls.movements[0].type, 'in');
  assert.strictEqual(calls.movements[0].quantity, 5);
  assert.strictEqual(calls.movements[0].reason, 'Compra a proveedor');
  assert.strictEqual(calls.movements[0].userId, 'user-9');

  const callsOut = fakeTx();
  const salida = await productService.adjustStock(PRODUCT_ID, { delta: -4 }, { id: 'user-9' });
  assert.strictEqual(salida.stock, 6, '10 - 4 = 6');
  assert.strictEqual(callsOut.movements[0].type, 'out');
  assert.strictEqual(callsOut.movements[0].quantity, 4);
});

test('el ajuste de inventario no permite dejar stock negativo', async () => {
  fakeTx({ ...CURRENT, stock: 2 });

  await assert.rejects(
    productService.adjustStock(PRODUCT_ID, { delta: -10 }),
    (err: any) => err.status === 400
  );
});

test('un ajuste de 0 unidades se rechaza', async () => {
  fakeTx();

  await assert.rejects(
    productService.adjustStock(PRODUCT_ID, { delta: 0 }),
    (err: any) => err.status === 400
  );
});
