import { test } from 'node:test';
import assert from 'node:assert';

const { prisma } =
  require('../../lib/prisma') as {
    prisma: any;
  };

import { orderService } from './orders.service';
import { HttpError } from '../../lib/errors';

const PRODUCT = {
  id:
    '00000000-0000-7000-8000-000000000001',
  name: 'Cuaderno Cosido 100 hojas',
  price: 100,
  stock: 10,
};

function fakeTx(
  overrides: Record<string, any> = {}
) {
  const calls: {
    orderCreate: any;
    createMany: any;
    updateMany: any[];
    movements: any[];
  } = {
    orderCreate: null,
    createMany: null,
    updateMany: [],
    movements: [],
  };

  const tx = {
    user: {
      findUnique: async () => ({
        address: 'Dirección de prueba',
      }),
    },

    product: {
      findUnique: async () => PRODUCT,

      updateMany: async (args: any) => {
        calls.updateMany.push(args);

        return {
          count: 1,
        };
      },
    },

    promotionalCode: {
      findUnique: async () => null,
      update: async () => ({}),
    },

    order: {
      create: async (args: any) => {
        calls.orderCreate = args;

        return {
          id: 'order-1',
          ...args.data,
        };
      },
    },

    orderDetail: {
      createMany: async (args: any) => {
        calls.createMany = args;

        return {
          count: args.data.length,
        };
      },
    },

    inventoryMovement: {
      create: async (args: any) => {
        calls.movements.push(args.data);

        return {
          id: `m-${calls.movements.length}`,
          ...args.data,
        };
      },
    },

    ...overrides,
  };

  return {
    tx,
    calls,
  };
}

function stubTransaction(tx: any) {
  prisma.$transaction = async (
    fn: any
  ) => fn(tx);
}

const requester = {
  id: 'user-1',
  role: 'client',
};

test(
  'C-02: el total se calcula en el servidor (ignora total: 0 y unitPrice del cliente)',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          total: 0,
          details: [
            {
              productId: PRODUCT.id,
              quantity: 3,
              unitPrice: 1,
            },
          ],
        } as any,
        requester
      );

    assert.strictEqual(
      order.total,
      10300,
      'incluye envío: el total debe ser 3 × 100 (precio en BD), no 0'
    );

    assert.deepStrictEqual(
      calls.createMany.data[0],
      {
        orderId: 'order-1',
        productId: PRODUCT.id,
        quantity: 3,
        unitPrice: 100,
        subtotal: 300,
      }
    );
  }
);

test(
  'C-02: descuento porcentual se aplica sobre el total calculado por el servidor',
  async () => {
    const { tx } = fakeTx({
      promotionalCode: {
        findUnique: async () => ({
          id: 'promo-1',
          active: true,
          type: 'percentage',
          value: 10,
        }),
        update: async () => ({}),
      },
    });

    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          promotionalCodeId: 'promo-1',
          details: [
            {
              productId: PRODUCT.id,
              quantity: 3,
            },
          ],
        },
        requester
      );

    assert.strictEqual(
      order.total,
      10270,
      '300 - 10% + 10000 de envío = 10270'
    );
  }
);

test(
  'C-02: descuento fijo se aplica sobre el total calculado por el servidor',
  async () => {
    const { tx } = fakeTx({
      promotionalCode: {
        findUnique: async () => ({
          id: 'promo-2',
          active: true,
          type: 'fixed',
          value: 50,
        }),
        update: async () => ({}),
      },
    });

    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          promotionalCodeId: 'promo-2',
          details: [
            {
              productId: PRODUCT.id,
              quantity: 3,
            },
          ],
        },
        requester
      );

    assert.strictEqual(
      order.total,
      10250,
      '300 - 50 + 10000 de envío = 10250'
    );
  }
);

test(
  'C-02: valida stock contra la BD antes de crear el pedido',
  async () => {
    const { tx } = fakeTx({
      product: {
        findUnique: async () => ({
          ...PRODUCT,
          stock: 2,
        }),
      },
    });

    stubTransaction(tx);

    await assert.rejects(
      orderService.create(
        {
          details: [
            {
              productId: PRODUCT.id,
              quantity: 3,
            },
          ],
        },
        requester
      ),
      (err: HttpError) =>
        err.status === 400 &&
        /Stock insuficiente/.test(
          err.message
        )
    );
  }
);

test(
  'C-02: pedido sin detalles queda en cero (ningún precio del cliente)',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          total: 999999,
        } as any,
        requester
      );

    assert.strictEqual(
      order.total,
      0
    );

    assert.strictEqual(
      calls.createMany,
      null
    );
  }
);

test(
  'C-03: tras un pedido de 3 unidades el stock baja 3 (criterio HECHO CUANDO)',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    await orderService.create(
      {
        details: [
          {
            productId: PRODUCT.id,
            quantity: 3,
          },
        ],
      },
      requester
    );

    assert.strictEqual(
      calls.updateMany.length,
      1,
      'debe llamarse un descuento por producto'
    );

    assert.deepStrictEqual(
      calls.updateMany[0],
      {
        where: {
          id: PRODUCT.id,
          stock: {
            gte: 3,
          },
        },
        data: {
          stock: {
            decrement: 3,
          },
        },
      }
    );
  }
);

test(
  'C-03: se registra un InventoryMovement por producto vendido (RF-016)',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          details: [
            {
              productId: PRODUCT.id,
              quantity: 2,
            },
            {
              productId:
                '00000000-0000-7000-8000-000000000002',
              quantity: 1,
            },
          ],
        },
        requester
      );

    assert.strictEqual(
      calls.movements.length,
      2,
      'un movimiento por cada producto'
    );

    assert.deepStrictEqual(
      calls.movements[0],
      {
        productId: PRODUCT.id,
        type: 'out',
        quantity: 2,
        reason:
          `Venta - pedido ${order.id}`,
        userId: 'user-1',
      }
    );

    assert.strictEqual(
      calls.movements[1].quantity,
      1
    );

    assert.strictEqual(
      calls.movements[1].productId,
      '00000000-0000-7000-8000-000000000002'
    );
  }
);

test(
  'C-03: si el stock ya no alcanza al descontar (carrera), el pedido falla',
  async () => {
    const { tx } = fakeTx({
      product: {
        findUnique: async () => PRODUCT,
        updateMany: async () => ({
          count: 0,
        }),
      },
    });

    stubTransaction(tx);

    await assert.rejects(
      orderService.create(
        {
          details: [
            {
              productId: PRODUCT.id,
              quantity: 3,
            },
          ],
        },
        requester
      ),
      (err: HttpError) =>
        err.status === 400 &&
        /Stock insuficiente/.test(
          err.message
        )
    );
  }
);

test(
  'C-03: un pedido sin detalles no descuenta stock ni registra movimientos',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    await orderService.create(
      {},
      requester
    );

    assert.strictEqual(
      calls.updateMany.length,
      0
    );

    assert.strictEqual(
      calls.movements.length,
      0
    );
  }
);