import { test } from 'node:test';
import assert from 'node:assert';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('../../lib/prisma') as { prisma: any };
import { inventoryService } from './inventory.service';
import { HttpError } from '../../lib/errors';

const PRODUCT_ID = '00000000-0000-7000-8000-000000000010';

const buildTx = (stock: number) => {
  const captured: { update?: any; movement?: any } = {};
  const tx = {
    product: {
      findUnique: async () => ({
        id: PRODUCT_ID,
        name: 'Cuaderno Cosido 100 Hojas',
        stock,
        cost: 7500,
        deletedAt: null,
      }),
      update: async (args: any) => {
        captured.update = args;
        return {
          id: PRODUCT_ID,
          name: 'Cuaderno Cosido 100 Hojas',
          stock: stock - args.data.stock.decrement,
        };
      },
    },
    inventoryMovement: {
      create: async (args: any) => {
        captured.movement = args;
        return { id: 'mov-out-1', ...args.data };
      },
    },
  };
  return { tx, captured };
};

const withTx = async (stock: number, fn: (captured: any) => Promise<void>) => {
  const origTx = prisma.$transaction;
  const { tx, captured } = buildTx(stock);
  prisma.$transaction = async (cb: any) => cb(tx);
  try {
    await fn(captured);
  } finally {
    prisma.$transaction = origTx;
  }
};

test('HU-003 (CA-003.1): rechaza cantidad inválida (0, negativa o decimal)', async () => {
  for (const quantity of [0, -5, 2.5]) {
    await assert.rejects(
      inventoryService.registerOutbound({
        productId: PRODUCT_ID,
        quantity,
        reasonType: 'Traslado entre sucursales',
        reason: 'Envío a la sede norte',
      }),
      (err: HttpError) =>
        err.status === 400 && /La cantidad a retirar debe ser un número entero mayor a cero/.test(err.message)
    );
  }
});

test('HU-003 (CA-003.1): exige el motivo del retiro y la justificación', async () => {
  await assert.rejects(
    inventoryService.registerOutbound({
      productId: PRODUCT_ID,
      quantity: 2,
      reasonType: '',
      reason: 'Envío a la sede norte',
    }),
    (err: HttpError) => err.status === 400 && /justificación del retiro es obligatoria/.test(err.message)
  );

  await assert.rejects(
    inventoryService.registerOutbound({
      productId: PRODUCT_ID,
      quantity: 2,
      reasonType: 'Muestra comercial',
      reason: '   ',
    }),
    (err: HttpError) => err.status === 400
  );
});

test('HU-003 (CA-003.2 y auditoría): descuenta stock 50 → 40 y crea movimiento type out', async () => {
  await withTx(50, async (captured) => {
    const res = await inventoryService.registerOutbound(
      {
        productId: PRODUCT_ID,
        quantity: 10,
        reasonType: 'Traslado entre sucursales',
        reason: 'Traslado a la sede norte',
      },
      'admin-user-1'
    );

    assert.strictEqual(res.previousStock, 50);
    assert.strictEqual(res.newStock, 40, '50 - 10 debe dejar el stock en 40 unidades');
    assert.deepStrictEqual(captured.update.data.stock, { decrement: 10 });
    assert.strictEqual(captured.movement.data.type, 'out');
    assert.strictEqual(captured.movement.data.quantity, 10);
    assert.strictEqual(captured.movement.data.userId, 'admin-user-1');
    assert.match(captured.movement.data.reason, /Traslado entre sucursales/);
    assert.match(captured.movement.data.reason, /Traslado a la sede norte/);
  });
});

test('HU-003 (CA-003.3): bloquea la salida si excede el stock disponible', async () => {
  await withTx(5, async (captured) => {
    await assert.rejects(
      inventoryService.registerOutbound({
        productId: PRODUCT_ID,
        quantity: 10,
        reasonType: 'Consumo interno',
        reason: 'Papelería para oficina',
      }),
      (err: HttpError) =>
        err.status === 400 &&
        /La cantidad solicitada excede el stock actual disponible en el almacén \(Disponible: 5 unidades\)/.test(
          err.message
        )
    );

    assert.strictEqual(captured.update, undefined, 'no debe actualizar el producto');
    assert.strictEqual(captured.movement, undefined, 'no debe crear el movimiento');
  });
});

test('HU-003 (CA-003.3): permite retirar exactamente todo el stock (5 de 5 → 0)', async () => {
  await withTx(5, async (captured) => {
    const res = await inventoryService.registerOutbound({
      productId: PRODUCT_ID,
      quantity: 5,
      reasonType: 'Merma por daño',
      reason: 'Caja mojada en bodega',
    });

    assert.strictEqual(res.newStock, 0);
    assert.deepStrictEqual(captured.update.data.stock, { decrement: 5 });
  });
});

test('HU-003: rechaza producto inexistente o eliminado', async () => {
  const origTx = prisma.$transaction;
  prisma.$transaction = async (cb: any) =>
    cb({
      product: { findUnique: async () => null },
      inventoryMovement: { create: async () => ({}) },
    });

  try {
    await assert.rejects(
      inventoryService.registerOutbound({
        productId: PRODUCT_ID,
        quantity: 1,
        reasonType: 'Otro',
        reason: 'Ajuste manual',
      }),
      (err: HttpError) => err.status === 404
    );
  } finally {
    prisma.$transaction = origTx;
  }
});