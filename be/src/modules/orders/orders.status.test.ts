import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Regresión: cambiar el estado de un pedido no era seguro ni coherente.
 *
 *  1. PUT /api/orders/:id y DELETE /api/orders/:id no exigían token: cualquiera
 *     podía modificar pedidos desde fuera de la aplicación.
 *  2. Cancelar un pedido no devolvía las unidades al inventario: el stock se
 *     perdía para siempre y había que reingresarlo a mano.
 *
 * Estas pruebas simulan el cliente de Prisma (misma técnica que orders.test.ts).
 */

// eslint-disable-next-line @typescript-eslint/no-var-require
const { prisma } = require('../../lib/prisma') as { prisma: any };
import { orderService } from './orders.service';

const ORDER_ID = '00000000-0000-7000-8000-000000000010';
const PRODUCT_ID = '00000000-0000-7000-8000-000000000001';

const ADMIN = { id: 'admin-1', role: 'admin' };
const CLIENT = { id: 'user-1', role: 'client' };
const OTHER = { id: 'user-2', role: 'client' };

function fakeTx(order: any) {
  const calls: { stockUpdates: any[]; movements: any[]; orderUpdate: any } = {
    stockUpdates: [],
    movements: [],
    orderUpdate: null,
  };

  const tx = {
    order: {
      findFirst: async () => order,
      update: async (args: any) => {
        calls.orderUpdate = args;
        return { ...order, ...args.data };
      },
    },
    product: {
      update: async (args: any) => {
        calls.stockUpdates.push(args);
        return { id: args.where.id };
      },
      updateMany: async (args: any) => {
        calls.stockUpdates.push(args);
        return { count: 1 };
      },
    },
    inventoryMovement: {
      create: async (args: any) => {
        calls.movements.push(args.data);
        return args.data;
      },
    },
  };

  (prisma as any).$transaction = async (fn: any) => fn(tx);
  return calls;
}

const PENDING_ORDER = {
  id: ORDER_ID,
  customerId: CLIENT.id,
  status: 'pending',
  deletedAt: null,
  details: [{ id: 'd-1', productId: PRODUCT_ID, quantity: 3 }],
};

test('cancelar un pedido devuelve las unidades al inventario', async () => {
  const calls = fakeTx(PENDING_ORDER);

  await orderService.update(ORDER_ID, { status: 'canceled' }, ADMIN);

  assert.strictEqual(calls.stockUpdates.length, 1, 'debe reponerse cada producto del pedido');
  assert.deepStrictEqual(calls.stockUpdates[0].data, { stock: { increment: 3 } });
  assert.strictEqual(calls.movements[0].type, 'in', 'la devolución queda en el kardex');
  assert.strictEqual(calls.movements[0].quantity, 3);
});

test('reactivar un pedido cancelado vuelve a descontar el inventario', async () => {
  const calls = fakeTx({ ...PENDING_ORDER, status: 'canceled' });

  await orderService.update(ORDER_ID, { status: 'pending' }, ADMIN);

  assert.strictEqual(calls.movements[0].type, 'out');
  assert.deepStrictEqual(calls.stockUpdates[0].data, { stock: { decrement: 3 } });
});

test('cancelar dos veces no duplica la devolución de stock', async () => {
  const calls = fakeTx({ ...PENDING_ORDER, status: 'canceled' });

  await orderService.update(ORDER_ID, { status: 'canceled' }, ADMIN);

  assert.strictEqual(calls.stockUpdates.length, 0, 'ya estaba cancelado: no se repone nada');
});

test('un cliente no puede cambiar el estado de su pedido (salvo cancelarlo)', async () => {
  fakeTx(PENDING_ORDER);

  await assert.rejects(
    orderService.update(ORDER_ID, { status: 'delivered' }, CLIENT),
    (err: any) => err.status === 403
  );
});

test('un cliente sí puede cancelar SU pedido', async () => {
  const calls = fakeTx(PENDING_ORDER);

  await orderService.update(ORDER_ID, { status: 'canceled' }, CLIENT);

  assert.strictEqual(calls.orderUpdate.data.status, 'canceled');
});

test('nadie puede modificar el pedido de otro cliente', async () => {
  fakeTx(PENDING_ORDER);

  await assert.rejects(
    orderService.update(ORDER_ID, { status: 'canceled' }, OTHER),
    (err: any) => err.status === 403
  );
});

test('el cliente solo ve sus pedidos; el personal ve todos', async () => {
  let whereClient: any = null;
  let whereAdmin: any = null;

  (prisma as any).order.findMany = async (args: any) => {
    if (args.where.customerId) whereClient = args.where;
    else whereAdmin = args.where;
    return [];
  };

  await orderService.list(CLIENT);
  await orderService.list(ADMIN);

  assert.deepStrictEqual(whereClient, {
    deletedAt: null,
    customerId: CLIENT.id,
  });
  assert.deepStrictEqual(whereAdmin, { deletedAt: null });
});

test('eliminar un pedido exige permisos de personal', async () => {
  (prisma as any).order = {
    findFirst: async () => PENDING_ORDER,
    update: async () => ({}),
  };

  await assert.rejects(
    orderService.remove(ORDER_ID, CLIENT),
    (err: any) => err.status === 403
  );
});
