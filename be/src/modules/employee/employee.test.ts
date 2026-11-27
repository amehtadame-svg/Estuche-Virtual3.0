import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import {
  assertStaff,
  assertSupervisor,
  financiallyPaid,
  simulationEnabled,
  fingerprint,
} from './employee.domain';
import {
  newEmployeeOrder,
  inventorySchema,
} from './employee.schema';

test(
  'Empleado no hereda permisos de supervisión y cliente no es personal',
  () => {
    assert.doesNotThrow(() =>
      assertStaff({
        id: 'one',
        role: 'employee',
      })
    );

    assert.throws(() =>
      assertSupervisor({
        id: 'one',
        role: 'employee',
      })
    );

    assert.throws(() =>
      assertStaff({
        id: 'two',
        role: 'client',
      })
    );
  }
);

test(
  'La simulación está cerrada por defecto y también en producción con bandera activa',
  () => {
    const previous = {
      mode: process.env.NODE_ENV,
      flag:
        process.env.ENABLE_PAYMENT_SIMULATION,
    };

    try {
      process.env.ENABLE_PAYMENT_SIMULATION =
        'true';

      process.env.NODE_ENV = 'production';

      assert.equal(
        simulationEnabled(),
        false
      );

      delete process.env.NODE_ENV;

      assert.equal(
        simulationEnabled(),
        false
      );

      process.env.NODE_ENV = 'development';

      assert.equal(
        simulationEnabled(),
        true
      );

      delete process.env.ENABLE_PAYMENT_SIMULATION;

      assert.equal(
        simulationEnabled(),
        false
      );
    } finally {
      if (previous.mode === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV =
          previous.mode;
      }

      if (previous.flag === undefined) {
        delete process.env.ENABLE_PAYMENT_SIMULATION;
      } else {
        process.env.ENABLE_PAYMENT_SIMULATION =
          previous.flag;
      }
    }
  }
);

test(
  'Recibo pagado sin evidencia no habilita; pago incompleto o reembolsado tampoco',
  () => {
    const payment = {
      id: 'p',
      amount: new Prisma.Decimal(100),
      currency: 'COP',
      status: 'approved',
      confirmedAt: new Date(),
    };

    const order: any = {
      total: new Prisma.Decimal(100),
      receipt: {
        total: new Prisma.Decimal(100),
        paymentStatus: 'paid',
        payouts: [],
      },
    };

    assert.equal(
      financiallyPaid(order),
      false
    );

    order.receipt.payouts = [
      payment,
    ];

    assert.equal(
      financiallyPaid(order),
      true
    );

    order.receipt.payouts = [
      {
        ...payment,
        amount: new Prisma.Decimal(90),
      },
    ];

    assert.equal(
      financiallyPaid(order),
      false
    );

    order.receipt.payouts = [
      payment,
      {
        ...payment,
        status: 'refunded',
      },
    ];

    assert.equal(
      financiallyPaid(order),
      false
    );
  }
);

test(
  'Esquemas de empleado no aceptan precios, costos, ni cantidades inválidas',
  () => {
    const id =
      '11111111-1111-4111-8111-111111111111';

    const data = {
      requestKey: id,
      customerId: id,
      fulfillmentMethod: 'pickup',
      details: [
        {
          productId: id,
          quantity: 1,
        },
      ],
    };

    assert.equal(
      newEmployeeOrder.safeParse(data).success,
      true
    );

    assert.equal(
      newEmployeeOrder.safeParse({
        ...data,
        total: 1,
      }).success,
      false
    );

    assert.equal(
      newEmployeeOrder.safeParse({
        ...data,
        fulfillmentMethod: 'delivery',
      }).success,
      false
    );

    assert.equal(
      inventorySchema.safeParse({
        requestKey: id,
        productId: id,
        type: 'out',
        quantity: -1,
        reason: 'Retiro',
      }).success,
      false
    );
  }
);

test(
  'Las referencias de idempotencia comparan huellas de los datos',
  () => {
    assert.equal(
      fingerprint({ amount: 10 }),
      fingerprint({ amount: 10 })
    );

    assert.notEqual(
      fingerprint({ amount: 10 }),
      fingerprint({ amount: 11 })
    );
  }
);
test('Empleado acepta identificadores históricos de PostgreSQL sin debilitar la clave de operación', () => {
  const { pickingSchema, reassignSchema, dispatchSchema } = require('./employee.schema');
  const legacy = '10000000-0000-0000-0000-000000000001';
  const key = '11111111-1111-4111-8111-111111111111';
  const input = { requestKey: key, customerId: legacy, fulfillmentMethod: 'pickup', details: [{ productId: legacy, quantity: 1 }] };
  assert.equal(newEmployeeOrder.safeParse(input).success, true);
  assert.equal(newEmployeeOrder.safeParse({ ...input, requestKey: legacy }).success, false);
  assert.equal(newEmployeeOrder.safeParse({ ...input, customerId: 'invalid' }).success, false);
  assert.equal(newEmployeeOrder.safeParse({ ...input, details: [{ productId: 'invalid', quantity: 1 }] }).success, false);
  assert.equal(inventorySchema.safeParse({ requestKey: key, productId: legacy, type: 'in', quantity: 1, reason: 'Compra' }).success, true);
  assert.equal(pickingSchema.safeParse({ items: [{ detailId: legacy, pickedQuantity: 1 }] }).success, true);
  assert.equal(dispatchSchema.safeParse({ driverId: legacy }).success, true);
  assert.equal(reassignSchema.safeParse({ assigneeId: legacy, note: 'Cambio de turno' }).success, true);
  assert.equal(newEmployeeOrder.parse({ ...input, customerId: legacy.toUpperCase() }).customerId, legacy);
});
