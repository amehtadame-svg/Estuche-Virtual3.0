import { test } from 'node:test';
import assert from 'node:assert';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('../../lib/prisma') as { prisma: any };
import { inventoryService } from './inventory.service';
import { HttpError } from '../../lib/errors';

const PRODUCT_ID = '00000000-0000-7000-8000-000000000010';

test('HU-002 (CA-002.3): rechaza cantidad menor o igual a cero o decimal', async () => {
  await assert.rejects(
    inventoryService.registerInbound({ productId: PRODUCT_ID, quantity: 0 }),
    (err: HttpError) =>
      err.status === 400 &&
      /La cantidad de mercancía a ingresar debe ser un número entero mayor a cero/.test(
        err.message
      )
  );

  await assert.rejects(
    inventoryService.registerInbound({ productId: PRODUCT_ID, quantity: -5 }),
    (err: HttpError) => err.status === 400
  );
});

test('HU-002 (CA-002.2 y CA-002.4): suma stock atómicamente (15 + 25 = 40) y crea movimiento in', async () => {
  const origTx = prisma.$transaction;
  let updateArgs: any = null;
  let movementArgs: any = null;

  prisma.$transaction = async (fn: any) =>
    fn({
      product: {
        findUnique: async () => ({
          id: PRODUCT_ID,
          name: 'Cuaderno Cosido 100 Hojas',
          stock: 15,
          cost: 7500,
          deletedAt: null,
        }),
        update: async (args: any) => {
          updateArgs = args;
          return {
            id: PRODUCT_ID,
            name: 'Cuaderno Cosido 100 Hojas',
            stock: 15 + args.data.stock.increment,
            cost: args.data.cost ?? 7500,
          };
        },
      },
      inventoryMovement: {
        create: async (args: any) => {
          movementArgs = args;
          return { id: 'mov-in-1', ...args.data };
        },
      },
    });

  try {
    const res = await inventoryService.registerInbound(
      {
        productId: PRODUCT_ID,
        quantity: 25,
        unitCost: 7800,
        invoiceNumber: 'FAC-2026-001',
        reason: 'Compra lote escolar',
      },
      'admin-user-1'
    );

    assert.strictEqual(res.previousStock, 15);
    assert.strictEqual(res.newStock, 40, '15 + 25 debe actualizar el stock a 40 unidades');
    assert.deepStrictEqual(updateArgs.data.stock, { increment: 25 });
    assert.strictEqual(movementArgs.data.type, 'in');
    assert.strictEqual(movementArgs.data.quantity, 25);
    assert.strictEqual(movementArgs.data.userId, 'admin-user-1');
    assert.match(movementArgs.data.reason, /FAC-2026-001/);
  } finally {
    prisma.$transaction = origTx;
  }
});