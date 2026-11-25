import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';

const target =
  process.env.EMPLOYEE_TEST_DATABASE_URL;

if (
  !target ||
  !new URL(target).pathname.endsWith('_test')
) {
  throw new Error(
    'Define EMPLOYEE_TEST_DATABASE_URL con una base exclusiva cuyo nombre termine en _test. Nunca uses tu base habitual.'
  );
}

process.env.DATABASE_URL = target;

process.env.JWT_SECRET =
  'employee-integration-secret-not-for-production-2026';

process.env.NODE_ENV = 'test';
process.env.ENABLE_PAYMENT_SIMULATION = 'true';

const {
  prisma: db,
} = require('../src/lib/prisma');

const app =
  require('../src/app').default;

const {
  employeeService,
} = require('../src/modules/employee/employee.service');

test(
  'Empleado: integración HTTP y transacciones reales en PostgreSQL',
  async (t) => {
    const run =
      randomUUID().slice(0, 8);

    const users: Record<
      string,
      {
        id: string;
        token: string;
      }
    > = {};

    for (
      const [name, role] of Object.entries({
        first: 'employee',
        second: 'employee',
        third: 'employee',
        admin: 'admin',
        super: 'superadmin',
        customer: 'client',
        other: 'client',
        driver: 'delivery',
      })
    ) {
      const user =
        await db.user.create({
          data: {
            email:
              `${run}-${name}@employee.test`,
            fullName:
              `Test ${name}`,
            role,
            hashedPassword:
              'not-a-login-password',
            phone: '3001234567',
            isActive: true,
          },
        });

      users[name] = {
        id: user.id,
        token: jwt.sign(
          {
            id: user.id,
            role,
          },
          process.env.JWT_SECRET!
        ),
      };
    }

    const product =
      await db.product.create({
        data: {
          name: `Producto ${run}`,
          price: '12500.50',
          cost: '5000',
          stock: 100,
          stockMin: 5,
        },
      });

    const scarce =
      await db.product.create({
        data: {
          name: `Escaso ${run}`,
          price: '1000',
          stock: 5,
        },
      });

    const server = createServer(app);

    await new Promise<void>((resolve) =>
      server.listen(
        0,
        '127.0.0.1',
        resolve
      )
    );

    const base =
      `http://127.0.0.1:${
        (server.address() as AddressInfo).port
      }/api`;

    async function request(
      who: string | null,
      path: string,
      body?: unknown,
      method =
        body === undefined
          ? 'GET'
          : 'POST'
    ) {
      const response = await fetch(
        base + path,
        {
          method,
          headers: {
            'Content-Type':
              'application/json',
            ...(
              who
                ? {
                    Authorization:
                      `Bearer ${users[who].token}`,
                  }
                : {}
            ),
          },
          body:
            body === undefined
              ? undefined
              : JSON.stringify(body),
        }
      );

      return {
        status: response.status,
        body: await response
          .json()
          .catch(() => null),
      };
    }

    const payload = (extra = {}) => ({
      requestKey: randomUUID(),
      customerId: users.customer.id,
      fulfillmentMethod: 'pickup',
      details: [
        {
          productId: product.id,
          quantity: 2,
        },
      ],
      ...extra,
    });

    let pickupOrder: any;
    let deliveryOrder: any;
    let owner = 'first';
    let foreign = 'second';

    try {
      await t.test(
        'Sin sesión y cliente no obtienen funciones de empleado',
        async () => {
          assert.equal(
            (
              await request(
                null,
                '/employee/summary'
              )
            ).status,
            401
          );

          assert.equal(
            (
              await request(
                'customer',
                '/employee/summary'
              )
            ).status,
            403
          );

          assert.equal(
            (
              await request(
                'first',
                '/users'
              )
            ).status,
            403
          );

          assert.equal(
            (
              await request(
                'first',
                '/employee/employees'
              )
            ).status,
            403
          );
        }
      );

      await t.test(
        'Campos de precio, costo, responsable o estado arbitrarios son rechazados',
        async () => {
          for (
            const extra of [
              { total: 1 },
              { status: 'paid' },
              {
                createdById:
                  users.super.id,
              },
              {
                promotionalCodeId:
                  randomUUID(),
              },
            ]
          ) {
            assert.equal(
              (
                await request(
                  'first',
                  '/employee/orders',
                  payload(extra)
                )
              ).status,
              400
            );
          }

          assert.equal(
            (
              await request(
                'first',
                '/employee/inventory',
                {
                  requestKey: randomUUID(),
                  productId: product.id,
                  type: 'in',
                  quantity: 1,
                  reason:
                    'Ingreso de prueba',
                  unitCost: 1,
                }
              )
            ).status,
            400
          );
        }
      );

      let originalPayload: any;

      await t.test(
        'Crear pedido y recibo juntos conserva comprador, creador, precios y una sola reserva',
        async () => {
          originalPayload = payload();

          const result = await request(
            'first',
            '/employee/orders',
            originalPayload
          );

          assert.equal(
            result.status,
            201,
            JSON.stringify(result.body)
          );

          pickupOrder = result.body;

          assert.equal(
            pickupOrder.customerId,
            users.customer.id
          );

          assert.equal(
            pickupOrder.createdById,
            users.first.id
          );

          assert.equal(
            pickupOrder.total,
            '25001'
          );

          assert.equal(
            pickupOrder.receipt.paymentStatus,
            'pending'
          );

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).stock,
            98
          );

          assert.equal(
            await db.receipt.count({
              where: {
                orderId: pickupOrder.id,
              },
            }),
            1
          );
        }
      );

      await t.test(
        'Reintento con la misma referencia no duplica y datos diferentes devuelven conflicto',
        async () => {
          const repeat = await request(
            'first',
            '/employee/orders',
            originalPayload
          );

          assert.equal(
            repeat.status,
            201
          );

          assert.equal(
            repeat.body.id,
            pickupOrder.id
          );

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).stock,
            98
          );

          assert.equal(
            (
              await request(
                'first',
                '/employee/orders',
                {
                  ...originalPayload,
                  customerId:
                    users.other.id,
                }
              )
            ).status,
            409
          );
        }
      );

      await t.test(
        'Pedido sin pago no aparece en cola y no puede tomarse',
        async () => {
          const list = await request(
            'first',
            '/employee/orders?scope=available'
          );

          assert.equal(
            list.status,
            200
          );

          assert.ok(
            !list.body.items.some(
              (order: any) =>
                order.id === pickupOrder.id
            )
          );

          assert.equal(
            (
              await request(
                'first',
                `/employee/orders/${pickupOrder.id}/claim`,
                {}
              )
            ).status,
            409
          );
        }
      );

      await t.test(
        'La edición general no altera un pedido operativo ni sus detalles o recibo',
        async () => {
          assert.equal(
            (
              await request(
                'admin',
                `/orders/${pickupOrder.id}`,
                { total: 1 },
                'PUT'
              )
            ).status,
            409
          );

          assert.equal(
            (
              await request(
                'admin',
                `/order-details/${pickupOrder.details[0].id}`,
                { quantity: 1 },
                'PUT'
              )
            ).status,
            409
          );

          assert.equal(
            (
              await request(
                'admin',
                `/receipts/${pickupOrder.receipt.id}`,
                { total: 1 },
                'PUT'
              )
            ).status,
            409
          );

          assert.equal(
            (
              await request(
                'admin',
                `/orders/${pickupOrder.id}`,
                undefined,
                'DELETE'
              )
            ).status,
            409
          );
        }
      );

      await t.test(
        'Simulación requiere SuperAdmin y bandera explícita',
        async () => {
          const path =
            `/employee/orders/${pickupOrder.id}/simulate-payment`;

          assert.equal(
            (
              await request(
                'first',
                path,
                {
                  requestKey: randomUUID(),
                  result: 'approved',
                }
              )
            ).status,
            403
          );

          process.env.ENABLE_PAYMENT_SIMULATION =
            'false';

          assert.equal(
            (
              await request(
                'super',
                path,
                {
                  requestKey: randomUUID(),
                  result: 'approved',
                }
              )
            ).status,
            403
          );

          process.env.ENABLE_PAYMENT_SIMULATION =
            'true';
        }
      );

      await t.test(
        'Pago simulado aprobado coordina pedido y recibo sin duplicar',
        async () => {
          const data = {
            requestKey: randomUUID(),
            result: 'approved',
          };

          const path =
            `/employee/orders/${pickupOrder.id}/simulate-payment`;

          assert.equal(
            (
              await request(
                'super',
                path,
                data
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                'super',
                path,
                data
              )
            ).status,
            200
          );

          const saved =
            await db.order.findUnique({
              where: {
                id: pickupOrder.id,
              },
              include: {
                receipt: {
                  include: {
                    payouts: true,
                  },
                },
              },
            });

          assert.equal(
            saved.status,
            'paid'
          );

          assert.equal(
            saved.receipt.paymentStatus,
            'paid'
          );

          assert.equal(
            saved.receipt.payouts.length,
            1
          );

          const list = await request(
            'second',
            '/employee/orders?scope=available'
          );

          const available =
            list.body.items.find(
              (order: any) =>
                order.id === pickupOrder.id
            );

          assert.ok(available);

          assert.equal(
            available.customer,
            undefined
          );
        }
      );

      await t.test(
        'Dos empleados compiten por el mismo pedido: solo uno gana',
        async () => {
          const results =
            await Promise.all(
              ['first', 'second'].map(
                (who) =>
                  request(
                    who,
                    `/employee/orders/${pickupOrder.id}/claim`,
                    {}
                  )
              )
            );

          assert.deepEqual(
            results
              .map((result) => result.status)
              .sort(),
            [200, 409]
          );

          owner =
            results[0].status === 200
              ? 'first'
              : 'second';

          foreign =
            owner === 'first'
              ? 'second'
              : 'first';

          assert.equal(
            await db.orderWork.count({
              where: {
                orderId: pickupOrder.id,
              },
            }),
            1
          );

          assert.equal(
            (
              await request(
                'third',
                `/employee/orders/${pickupOrder.id}`
              )
            ).status,
            403
          );
        }
      );

      await t.test(
        'No se prepara un pedido ajeno ni se exceden cantidades; no se empaca incompleto',
        async () => {
          const path =
            `/employee/orders/${pickupOrder.id}`;

          assert.equal(
            (
              await request(
                foreign,
                path + '/picking',
                {
                  items: [
                    {
                      detailId:
                        pickupOrder.details[0].id,
                      pickedQuantity: 2,
                    },
                  ],
                },
                'PATCH'
              )
            ).status,
            403
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/picking',
                {
                  items: [
                    {
                      detailId:
                        pickupOrder.details[0].id,
                      pickedQuantity: 3,
                    },
                  ],
                },
                'PATCH'
              )
            ).status,
            400
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/pack',
                {}
              )
            ).status,
            409
          );

          assert.equal(
            (
              await request(
                'customer',
                path + '/pickup-code',
                {}
              )
            ).status,
            409
          );
        }
      );

      await t.test(
        'Incidencia bloquea y solo administración la resuelve con trazabilidad',
        async () => {
          const path =
            `/employee/orders/${pickupOrder.id}`;

          assert.equal(
            (
              await request(
                owner,
                path + '/incident',
                {
                  note:
                    'Revisar embalaje dañado',
                }
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/pack',
                {}
              )
            ).status,
            409
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/resolve',
                {
                  note:
                    'Intento no autorizado',
                }
              )
            ).status,
            403
          );

          assert.equal(
            (
              await request(
                'admin',
                path + '/resolve',
                {
                  note:
                    'Se verificó y sustituyó el embalaje',
                }
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                'admin',
                path + '/reassign',
                {
                  assigneeId:
                    users.third.id,
                  note:
                    'Cambio de turno autorizado',
                }
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/pack',
                {}
              )
            ).status,
            403
          );

          owner = 'third';
        }
      );

      await t.test(
        'Recogida y empaque no vuelven a descontar existencias ni exponen el hash',
        async () => {
          const path =
            `/employee/orders/${pickupOrder.id}`;

          assert.equal(
            (
              await request(
                owner,
                path + '/picking',
                {
                  items: [
                    {
                      detailId:
                        pickupOrder.details[0].id,
                      pickedQuantity: 2,
                    },
                  ],
                },
                'PATCH'
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/pack',
                {}
              )
            ).status,
            200
          );

          const result =
            await request(owner, path);

          assert.equal(
            result.body.work.pickupCodeHash,
            undefined
          );

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).stock,
            98
          );
        }
      );

      await t.test(
        'Código de retiro solo para comprador; código incorrecto no entrega',
        async () => {
          const path =
            `/employee/orders/${pickupOrder.id}`;

          assert.equal(
            (
              await request(
                'other',
                path + '/pickup-code',
                {}
              )
            ).status,
            403
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/pickup-code',
                {}
              )
            ).status,
            403
          );

          const result =
            await request(
              'customer',
              path + '/pickup-code',
              {}
            );

          assert.equal(
            result.status,
            200
          );

          assert.equal(
            result.body.code.length,
            16
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/pickup',
                {
                  code:
                    '0000000000000000',
                  recipientName:
                    'Cliente test',
                }
              )
            ).status,
            400
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/pickup',
                {
                  code: result.body.code,
                  recipientName:
                    'Cliente test',
                }
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                owner,
                path + '/pickup',
                {
                  code: result.body.code,
                  recipientName:
                    'Cliente test',
                }
              )
            ).status,
            409
          );

          assert.equal(
            (
              await db.order.findUnique({
                where: {
                  id: pickupOrder.id,
                },
              })
            ).status,
            'delivered'
          );

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).stock,
            98
          );
        }
      );

      await t.test(
        'Domicilio exige dirección; rechazo de pago no habilita preparación',
        async () => {
          assert.equal(
            (
              await request(
                'first',
                '/employee/orders',
                payload({
                  fulfillmentMethod:
                    'delivery',
                })
              )
            ).status,
            400
          );

          const result = await request(
            'first',
            '/employee/orders',
            payload({
              fulfillmentMethod:
                'delivery',
              address:
                'Calle 10 # 20-30, Bogotá',
            })
          );

          assert.equal(
            result.status,
            201
          );

          deliveryOrder = result.body;

          assert.equal(
            (
              await request(
                'super',
                `/employee/orders/${deliveryOrder.id}/simulate-payment`,
                {
                  requestKey: randomUUID(),
                  result: 'rejected',
                }
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                'first',
                `/employee/orders/${deliveryOrder.id}/claim`,
                {}
              )
            ).status,
            409
          );
        }
      );

      await t.test(
        'Despacho validado crea un solo envío y entrega final coordina estados',
        async () => {
          const path =
            `/employee/orders/${deliveryOrder.id}`;

          assert.equal(
            (
              await request(
                'super',
                path + '/simulate-payment',
                {
                  requestKey: randomUUID(),
                  result: 'approved',
                }
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                'first',
                path + '/claim',
                {}
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                'first',
                path + '/picking',
                {
                  items: [
                    {
                      detailId:
                        deliveryOrder.details[0].id,
                      pickedQuantity: 2,
                    },
                  ],
                },
                'PATCH'
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                'first',
                path + '/pack',
                {}
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                'first',
                path + '/dispatch',
                {
                  driverId:
                    users.customer.id,
                }
              )
            ).status,
            400
          );

          for (let i = 0; i < 2; i++) {
            assert.equal(
              (
                await request(
                  'first',
                  path + '/dispatch',
                  {
                    driverId:
                      users.driver.id,
                  }
                )
              ).status,
              200
            );
          }

          const shipments =
            await db.despatch.findMany({
              where: {
                orderId:
                  deliveryOrder.id,
              },
            });

          assert.equal(
            shipments.length,
            1
          );

          assert.equal(
            (
              await request(
                'admin',
                '/despatches',
                {
                  orderId:
                    deliveryOrder.id,
                  driverId:
                    users.driver.id,
                }
              )
            ).status,
            409
          );

          assert.equal(
            (
              await request(
                'first',
                `/despatches/${shipments[0].id}`,
                {
                  status: 'delivered',
                },
                'PUT'
              )
            ).status,
            403
          );

          const result = await request(
            'admin',
            `/despatches/${shipments[0].id}`,
            {
              status: 'delivered',
            },
            'PUT'
          );

          assert.equal(
            result.status,
            200,
            JSON.stringify(result.body)
          );

          assert.equal(
            (
              await db.orderWork.findUnique({
                where: {
                  orderId:
                    deliveryOrder.id,
                },
              })
            ).status,
            'completed'
          );
        }
      );

      await t.test(
        'Cancelación pendiente libera reserva exactamente una vez',
        async () => {
          const before =
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).stock;

          const result = await request(
            'second',
            '/employee/orders',
            payload()
          );

          assert.equal(
            result.status,
            201
          );

          const path =
            `/employee/orders/${result.body.id}/cancel`;

          assert.equal(
            (
              await request(
                'second',
                path,
                {
                  note:
                    'Cliente canceló pedido',
                }
              )
            ).status,
            403
          );

          for (let i = 0; i < 2; i++) {
            assert.equal(
              (
                await request(
                  'admin',
                  path,
                  {
                    note:
                      'Cliente canceló pedido',
                  }
                )
              ).status,
              200
            );
          }

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).stock,
            before
          );
        }
      );

      await t.test(
        'Reservas vencidas no admiten pagos y se liberan por tarea del servidor',
        async () => {
          const result = await request(
            'first',
            '/employee/orders',
            payload()
          );

          await db.order.update({
            where: {
              id: result.body.id,
            },
            data: {
              expiresAt: new Date(
                Date.now() - 60000
              ),
            },
          });

          assert.equal(
            (
              await request(
                'super',
                `/employee/orders/${result.body.id}/simulate-payment`,
                {
                  requestKey: randomUUID(),
                  result: 'approved',
                }
              )
            ).status,
            409
          );

          const before =
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).stock;

          await employeeService.cancel(
            result.body.id,
            'Reserva vencida en prueba',
            null,
            true
          );

          await employeeService.cancel(
            result.body.id,
            'Reintento de expiración',
            null,
            true
          );

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).stock,
            before + 2
          );
        }
      );

      await t.test(
        'Movimientos idempotentes y retiros concurrentes nunca dejan stock negativo',
        async () => {
          const inbound = {
            requestKey: randomUUID(),
            productId: scarce.id,
            type: 'in',
            quantity: 3,
            reason:
              'Recepción de mercancía de prueba',
          };

          for (let i = 0; i < 2; i++) {
            assert.equal(
              (
                await request(
                  'first',
                  '/employee/inventory',
                  inbound
                )
              ).status,
              201
            );
          }

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: scarce.id,
                },
              })
            ).stock,
            8
          );

          const results =
            await Promise.all(
              ['first', 'second'].map(
                (who) =>
                  request(
                    who,
                    '/employee/inventory',
                    {
                      requestKey:
                        randomUUID(),
                      productId:
                        scarce.id,
                      type: 'out',
                      quantity: 6,
                      reason:
                        'Retiro concurrente justificado',
                    }
                  )
              )
            );

          assert.deepEqual(
            results
              .map((result) => result.status)
              .sort(),
            [201, 409]
          );

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: scarce.id,
                },
              })
            ).stock,
            2
          );

          assert.equal(
            (
              await db.product.findUnique({
                where: {
                  id: product.id,
                },
              })
            ).cost.toString(),
            '5000'
          );
        }
      );

      await t.test(
        'Pedidos nuevos del checkout conservan snapshot y se protegen contra cancelación sin liberar stock',
        async () => {
          await db.user.update({
            where: {
              id: users.customer.id,
            },
            data: {
              address:
                'Carrera 15 # 80-20, Bogotá',
            },
          });

          const result = await request(
            'customer',
            '/orders',
            {
              total: 1,
              details: [
                {
                  productId: product.id,
                  quantity: 1,
                  unitPrice: 1,
                },
              ],
            }
          );

          assert.equal(
            result.status,
            201,
            JSON.stringify(result.body)
          );

          const saved =
            await db.order.findUnique({
              where: {
                id: result.body.id,
              },
            });

          assert.equal(
            saved.createdById,
            users.customer.id
          );

          assert.ok(saved.expiresAt);

          assert.ok(
            saved.deliverySnapshot.includes(
              'Carrera 15'
            )
          );

          assert.equal(
            saved.total.toString(),
            '12500.5'
          );

          assert.equal(
            (
              await request(
                'admin',
                `/orders/${saved.id}`,
                {
                  status: 'canceled',
                },
                'PUT'
              )
            ).status,
            409
          );

          const receipt =
            await request(
              'customer',
              '/receipts',
              {
                orderId: saved.id,
                total: 1,
              }
            );

          assert.equal(
            receipt.status,
            201,
            JSON.stringify(receipt.body)
          );

          assert.equal(
            (
              await request(
                'super',
                `/employee/orders/${saved.id}/simulate-payment`,
                {
                  requestKey: randomUUID(),
                  result: 'approved',
                }
              )
            ).status,
            200
          );

          assert.equal(
            (
              await request(
                'first',
                `/employee/orders/${saved.id}/claim`,
                {}
              )
            ).status,
            200
          );
        }
      );

      await t.test(
        'Cuenta desactivada pierde acceso aunque conserve token',
        async () => {
          await db.user.update({
            where: {
              id: users.second.id,
            },
            data: {
              isActive: false,
            },
          });

          assert.equal(
            (
              await request(
                'second',
                '/employee/summary'
              )
            ).status,
            401
          );
        }
      );

      await t.test(
        'Resumen, actividad, buscadores y supervisión consultan datos reales',
        async () => {
          for (
            const path of [
              '/summary',
              '/activity',
              '/movements',
              `/customers?q=${run}`,
              `/products?q=${run}`,
              '/drivers',
              '/orders?scope=mine',
            ]
          ) {
            const response =
              await request(
                'first',
                `/employee${path}`
              );

            assert.equal(
              response.status,
              200,
              path +
                JSON.stringify(
                  response.body
                )
            );
          }

          assert.equal(
            (
              await request(
                'first',
                '/employee/orders?scope=supervision'
              )
            ).status,
            403
          );

          assert.equal(
            (
              await request(
                'admin',
                '/employee/orders?scope=supervision'
              )
            ).status,
            200
          );
        }
      );
    } finally {
      server.closeAllConnections();

      await new Promise<void>((resolve) =>
        server.close(() => resolve())
      );

      const ids = Object.values(users).map(
        (user) => user.id
      );

      const orderIds = (
        await db.order.findMany({
          where: {
            createdById: {
              in: ids,
            },
          },
          select: {
            id: true,
          },
        })
      ).map((order: any) => order.id);

      const receiptIds = (
        await db.receipt.findMany({
          where: {
            orderId: {
              in: orderIds,
            },
          },
          select: {
            id: true,
          },
        })
      ).map((receipt: any) => receipt.id);

      await db.payout.deleteMany({
        where: {
          receiptId: {
            in: receiptIds,
          },
        },
      });

      await db.receipt.deleteMany({
        where: {
          id: {
            in: receiptIds,
          },
        },
      });

      await db.despatch.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await db.orderEvent.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await db.orderWork.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await db.orderDetail.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await db.order.deleteMany({
        where: {
          id: {
            in: orderIds,
          },
        },
      });

      await db.inventoryMovement.deleteMany({
        where: {
          productId: {
            in: [
              product.id,
              scarce.id,
            ],
          },
        },
      });

      await db.product.deleteMany({
        where: {
          id: {
            in: [
              product.id,
              scarce.id,
            ],
          },
        },
      });

      await db.user.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      await db.$disconnect();
    }
  }
);