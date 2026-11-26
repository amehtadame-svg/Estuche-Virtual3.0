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

const SECOND = {
  id: '00000000-0000-7000-8000-000000000002',
  name: 'Lápiz HB',
  price: 50,
  stock: 10,
};

const ADDRESS = 'Calle 45 #12-30, Bogotá';

function fakeTx(
  overrides: Record<string, any> = {}
) {
  const calls: {
    orderCreate: any;
    orderUpdate: any[];
    createMany: any;
    updateMany: any[];
    movements: any[];
    events: any[];
    couponUpdates: any[];
    locks: string[];
  } = {
    orderCreate: null,
    orderUpdate: [],
    createMany: null,
    updateMany: [],
    movements: [],
    events: [],
    couponUpdates: [],
    locks: [],
  };

  const tx = {
    $queryRaw: async () => [],
    $executeRaw: async (_strings: any, ...values: any[]) => {
      calls.locks.push(String(values[0]));
      return 1;
    },

    user: {
      findUnique: async () => ({
        address: ADDRESS,
      }),
    },

    deliveryAddress: {
      findFirst: async () => null,
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
      findFirst: async () => null,
      update: async (args: any) => {
        calls.couponUpdates.push(args);
        return {};
      },
      updateMany: async (args: any) => {
        calls.couponUpdates.push(args);
        return { count: 1 };
      },
    },

    order: {
      create: async (args: any) => {
        calls.orderCreate = args;

        return {
          id: 'order-1',
          shippingCost: args.data.shippingCost,
          ...args.data,
        };
      },
      update: async (args: any) => {
        calls.orderUpdate.push(args);
        return { id: 'order-1', ...args.data };
      },
      findUnique: async () => ({
        id: 'order-1',
        customerId: 'user-1',
        status: 'pending',
        shippingCost: 10000,
        promotionalCodeId: null,
        details: [],
      }),
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

    orderEvent: {
      create: async (args: any) => {
        calls.events.push(args.data);
        return { id: `e-${calls.events.length}`, ...args.data };
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
    _fn: any,
    _options?: any
  ) => _fn(tx);
}

const requester = {
  id: 'user-1',
  role: 'client',
};

const hasStatus = (status: number) => (error: unknown) =>
  error instanceof HttpError && error.status === status;

const line = (quantity = 3) => ({
  productId: PRODUCT.id,
  quantity,
});

/** Los montos viajan como Prisma.Decimal: se comparan por valor. */
const money = (value: any) => Number(value);

test(
  'C-02: el total se calcula en el servidor (ignora total: 0 y unitPrice del cliente)',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          deliveryAddress: ADDRESS,
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
      money(order.total),
      10300,
      'incluye envío: el total debe ser 3 × 100 (precio en BD), no 0'
    );

    assert.deepStrictEqual(
      calls.orderCreate.data.details.create[0],
      {
        productId: PRODUCT.id,
        quantity: 3,
        unitPrice: new (require('@prisma/client').Prisma.Decimal)(100),
        subtotal: new (require('@prisma/client').Prisma.Decimal)(300),
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
          code: 'PROMO10',
          active: true,
          type: 'percentage',
          value: 10,
          minPurchase: 0,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2099-01-01'),
          maxUses: null,
          currentUses: 0,
        }),
        updateMany: async () => ({ count: 1 }),
      },
    });

    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          deliveryAddress: ADDRESS,
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
      money(order.total),
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
          code: 'FIJO50',
          active: true,
          type: 'fixed',
          value: 50,
          minPurchase: 0,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2099-01-01'),
          maxUses: null,
          currentUses: 0,
        }),
        updateMany: async () => ({ count: 1 }),
      },
    });

    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          deliveryAddress: ADDRESS,
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
      money(order.total),
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
          deliveryAddress: ADDRESS,
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
  'A-01: un pedido sin líneas se rechaza antes de tocar la base de datos',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    for (const payload of [{}, { total: 999999 }, { details: [] }]) {
      await assert.rejects(
        orderService.create(
          { deliveryAddress: ADDRESS, ...payload } as any,
          requester
        ),
        (err: HttpError) =>
          err.status === 400 &&
          /al menos un producto/.test(err.message)
      );
    }

    assert.strictEqual(calls.orderCreate, null, 'no debe crear el pedido');
    assert.strictEqual(calls.movements.length, 0);
  }
);

test(
  'A-02: domicilio sin dirección se rechaza y no crea registros',
  async () => {
    const { tx, calls } = fakeTx({
      user: { findUnique: async () => ({ address: null }) },
    });
    stubTransaction(tx);

    await assert.rejects(
      orderService.create({ details: [line()] }, requester),
      (err: HttpError) => err.status === 400 && /dirección para domicilio/i.test(err.message)
    );

    assert.strictEqual(calls.orderCreate, null);
  }
);

test(
  'A-02: retiro en tienda no exige dirección y no cobra envío',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    const order = await orderService.create(
      {
        fulfillmentMethod: 'pickup',
        details: [{ productId: PRODUCT.id, quantity: 1 }],
      },
      requester
    );

    assert.strictEqual(money(order.shippingCost), 0);
    assert.strictEqual(money(order.total), 100);
    assert.strictEqual(order.deliverySnapshot, null);
    assert.strictEqual(calls.orderCreate.data.fulfillmentMethod, 'pickup');
  }
);

test(
  'A-03: una cantidad inválida no descuenta stock ni crea el pedido',
  async () => {
    for (const quantity of [0, -2]) {
      const { tx, calls } = fakeTx();
      stubTransaction(tx);

      await assert.rejects(
        orderService.create(
          { deliveryAddress: ADDRESS, details: [{ productId: PRODUCT.id, quantity }] },
          requester
        ),
        hasStatus(400),
        `cantidad ${quantity}`
      );

      assert.strictEqual(calls.orderCreate, null);
      assert.strictEqual(calls.updateMany.length, 0);
    }
  }
);

test(
  'A-04: un producto eliminado no se puede comprar aunque tenga stock',
  async () => {
    const { tx, calls } = fakeTx({
      product: {
        // La BD responde null porque el where incluye deletedAt: null
        findUnique: async ({ where }: any) => {
          assert.strictEqual(where.deletedAt, null, 'debe filtrar productos activos');
          return null;
        },
      },
    });

    stubTransaction(tx);

    await assert.rejects(
      orderService.create({ deliveryAddress: ADDRESS, details: [line()] }, requester),
      (err: HttpError) => err.status === 400 && /ya no está disponible/.test(err.message)
    );

    assert.strictEqual(calls.orderCreate, null);
  }
);

test(
  'A-04: el descuento de stock también exige producto activo',
  async () => {
    const { tx, calls } = fakeTx({
      product: {
        findUnique: async () => PRODUCT,
        updateMany: async (args: any) => {
          calls.updateMany.push(args);
          return { count: 1 };
        },
      },
    });

    stubTransaction(tx);

    await orderService.create(
      { deliveryAddress: ADDRESS, details: [line(1)] },
      requester
    );

    assert.strictEqual(calls.updateMany[0].where.deletedAt, null);
  }
);

test(
  'A-05: un promotionalCodeId inventado no salta la validación del cupón',
  async () => {
    const { tx, calls } = fakeTx({
      promotionalCode: {
        findUnique: async () => null,
        updateMany: async () => ({ count: 1 }),
      },
    });

    stubTransaction(tx);

    await assert.rejects(
      orderService.create(
        {
          deliveryAddress: ADDRESS,
          promotionalCodeId: '11111111-1111-4111-8111-111111111111',
          details: [line()],
        },
        requester
      ),
      (err: HttpError) => err.status === 400 && /cupón/i.test(err.message)
    );

    assert.strictEqual(calls.orderCreate, null, 'el pedido no se crea');
  }
);

test(
  'A-05: un cupón vencido se rechaza por ID y por código',
  async () => {
    const expired = {
      id: 'promo-x',
      code: 'VIEJO',
      active: true,
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      startDate: new Date('2000-01-01'),
      endDate: new Date('2001-01-01'),
      maxUses: null,
      currentUses: 0,
    };

    for (const payload of [
      { promotionalCodeId: expired.id },
      { promotionalCode: expired.code },
    ]) {
      const { tx } = fakeTx({
        promotionalCode: {
          findUnique: async () => expired,
          findFirst: async () => ({ id: expired.id }),
          updateMany: async () => ({ count: 1 }),
        },
      });

      stubTransaction(tx);

      await assert.rejects(
        orderService.create(
          { deliveryAddress: ADDRESS, details: [line()], ...payload } as any,
          requester
        ),
        (err: HttpError) => err.status === 400 && /expirado/.test(err.message)
      );
    }
  }
);

test(
  'A-07: el cupón se consume una sola vez y el uso queda bloqueado por asesoría',
  async () => {
    const { tx, calls } = fakeTx({
      promotionalCode: {
        findUnique: async () => ({
          id: 'promo-1',
          code: 'PROMO10',
          active: true,
          type: 'percentage',
          value: 10,
          minPurchase: 0,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2099-01-01'),
          maxUses: 5,
          currentUses: 0,
        }),
        updateMany: async (args: any) => {
          calls.couponUpdates.push(args);
          return { count: 1 };
        },
      },
    });

    stubTransaction(tx);

    await orderService.create(
      { deliveryAddress: ADDRESS, promotionalCodeId: 'promo-1', details: [line()] },
      requester
    );

    assert.strictEqual(calls.couponUpdates.length, 1, 'un único consumo');
    assert.deepStrictEqual(calls.couponUpdates[0].data, { currentUses: { increment: 1 } });
    assert.strictEqual(calls.couponUpdates[0].where.active, true);
    assert.ok(
      calls.locks.some(key => key.includes('coupon:promo-1')),
      'debe tomar el bloqueo del cupón'
    );
  }
);

test(
  'A-07: dos compras simultáneas no superan el límite de usos',
  async () => {
    // El incremento condicional falla en la segunda compra: count 0.
    let attempts = 0;
    const { tx } = fakeTx({
      promotionalCode: {
        findUnique: async () => ({
          id: 'promo-1',
          code: 'ULTIMO',
          active: true,
          type: 'fixed',
          value: 10,
          minPurchase: 0,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2099-01-01'),
          maxUses: 1,
          currentUses: 0,
        }),
        updateMany: async () => {
          attempts += 1;
          return { count: attempts === 1 ? 1 : 0 };
        },
      },
    });

    stubTransaction(tx);

    await orderService.create(
      { deliveryAddress: ADDRESS, promotionalCodeId: 'promo-1', details: [line(1)] },
      requester
    );

    await assert.rejects(
      orderService.create(
        { deliveryAddress: ADDRESS, promotionalCodeId: 'promo-1', details: [line(1)] },
        requester
      ),
      (err: HttpError) => err.status === 400 && /límite de usos/.test(err.message)
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
        deliveryAddress: ADDRESS,
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
          deletedAt: null,
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
    (tx.product as any).findUnique = async ({ where }: any) =>
      where.id === SECOND.id ? SECOND : PRODUCT;
    stubTransaction(tx);

    const order =
      await orderService.create(
        {
          deliveryAddress: ADDRESS,
          details: [
            {
              productId: PRODUCT.id,
              quantity: 2,
            },
            {
              productId: SECOND.id,
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
      SECOND.id
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
          deliveryAddress: ADDRESS,
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
        /dejó de estar disponible|Stock insuficiente/.test(
          err.message
        )
    );
  }
);

test(
  'A-06: aplicar un cupón a un pedido lo consume una vez y recalcula el total',
  async () => {
    const { tx, calls } = fakeTx({
      order: {
        findUnique: async ({ where }: any) => {
          if (where.include) return { total: 10300, promotionalCode: null };
          return {
            id: 'order-1',
            customerId: 'user-1',
            status: 'pending',
            shippingCost: 10000,
            promotionalCodeId: null,
            details: [{ unitPrice: 100, quantity: 3 }],
          };
        },
        update: async (args: any) => {
          calls.orderUpdate.push(args);
          return {};
        },
      },
      promotionalCode: {
        findFirst: async () => ({
          id: 'promo-1',
          code: 'PROMO10',
          active: true,
          type: 'percentage',
          value: 10,
          minPurchase: 0,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2099-01-01'),
          maxUses: null,
          currentUses: 0,
        }),
        findUnique: async () => ({
          id: 'promo-1',
          code: 'PROMO10',
          active: true,
          type: 'percentage',
          value: 10,
          minPurchase: 0,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2099-01-01'),
          maxUses: null,
          currentUses: 0,
        }),
        updateMany: async (args: any) => {
          calls.couponUpdates.push(args);
          return { count: 1 };
        },
      },
    });

    stubTransaction(tx);

    await orderService.applyPromotionalCode('order-1', ' promO10 ', requester);

    assert.strictEqual(calls.couponUpdates.length, 1);
    assert.deepStrictEqual(
      { ...calls.orderUpdate[0].data, total: money(calls.orderUpdate[0].data.total) },
      { promotionalCodeId: 'promo-1', total: 10270 }
    );
  }
);

test(
  'A-06: no se consume un segundo cupón en el mismo pedido',
  async () => {
    const { tx, calls } = fakeTx({
      order: {
        findUnique: async () => ({
          id: 'order-1',
          customerId: 'user-1',
          status: 'pending',
          shippingCost: 0,
          promotionalCodeId: 'promo-ya',
          details: [{ unitPrice: 100, quantity: 1 }],
        }),
      },
    });

    stubTransaction(tx);

    await assert.rejects(
      orderService.applyPromotionalCode('order-1', 'OTRO', requester),
      (err: HttpError) => err.status === 400 && /ya tiene un cupón/.test(err.message)
    );

    assert.strictEqual(calls.couponUpdates.length, 0, 'no debe consumir otro cupón');
  }
);

test(
  'A-02: domicilio sin dirección en el cuerpo usa la dirección del perfil',
  async () => {
    const { tx, calls } = fakeTx();
    stubTransaction(tx);

    const order = await orderService.create(
      { details: [line(1)] },
      requester
    );

    assert.equal(
      order.deliverySnapshot,
      ADDRESS,
      'la dirección del servidor completa los datos que el cliente ya guardó'
    );
    assert.notStrictEqual(calls.orderCreate, null);
  }
);

test(
  'A-06: un cliente puede aplicar un cupón a un pedido creado por el checkout',
  async () => {
    // Regresión: el pedido del checkout lleva createdById, y la regla de
    // "pedido operativo" no debe impedir esta operación financiera.
    const promo = {
      id: 'promo-1',
      code: 'PROMO10',
      active: true,
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2099-01-01'),
      maxUses: null,
      currentUses: 0,
    };

    const { tx, calls } = fakeTx({
      order: {
        findUnique: async ({ where }: any) => {
          if (where.include && where.include.promotionalCode) {
            return { total: 10270, promotionalCode: { code: promo.code } };
          }
          return {
            id: 'order-1',
            customerId: 'user-1',
            createdById: 'user-1',
            status: 'pending',
            shippingCost: 10000,
            promotionalCodeId: null,
            details: [{ unitPrice: 100, quantity: 3 }],
          };
        },
        update: async (args: any) => {
          calls.orderUpdate.push(args);
          return {};
        },
      },
      promotionalCode: {
        findFirst: async () => promo,
        findUnique: async () => promo,
        updateMany: async (args: any) => {
          calls.couponUpdates.push(args);
          return { count: 1 };
        },
      },
    });

    stubTransaction(tx);

    await orderService.applyPromotionalCode('order-1', 'PROMO10', requester);

    assert.strictEqual(calls.couponUpdates.length, 1, 'el cupón se consume una vez');
  }
);
