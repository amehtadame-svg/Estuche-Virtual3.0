import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../../lib/errors';
import {
  Actor,
  assertStaff,
  assertSupervisor,
  isSupervisor,
  atomic,
  requestLock,
  lockOrder,
  orderInclude,
  publicOrder,
  financiallyPaid,
  assertOperational,
  assertOwner,
  fingerprint,
  event,
  simulationEnabled,
} from './employee.domain';
import {
  NewEmployeeOrder,
  InventoryInput,
} from './employee.schema';

const productSelect = {
  id: true,
  name: true,
  sku: true,
  price: true,
  stock: true,
  stockMin: true,
} as const;

const perPage = 20;

export const employeeService = {
  async customers(
    actor: Actor,
    q: string,
    page: number
  ) {
    assertStaff(actor);

    return prisma.user.findMany({
      where: {
        role: 'client',
        isActive: true,
        deletedAt: null,
        OR: [
          {
            fullName: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
      },
      orderBy: [
        { fullName: 'asc' },
        { id: 'asc' },
      ],
      skip: (page - 1) * perPage,
      take: perPage,
    });
  },

  async products(
    actor: Actor,
    q: string,
    page: number
  ) {
    assertStaff(actor);

    return prisma.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            sku: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: productSelect,
      orderBy: [
        { name: 'asc' },
        { id: 'asc' },
      ],
      skip: (page - 1) * perPage,
      take: perPage,
    });
  },

  async people(
    actor: Actor,
    role: 'employee' | 'delivery'
  ) {
    assertStaff(actor);

    if (role === 'employee') {
      assertSupervisor(actor);
    }

    return prisma.user.findMany({
      where: {
        role,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
      },
      orderBy: {
        fullName: 'asc',
      },
      take: 100,
    });
  },

  async create(
    data: NewEmployeeOrder,
    actor: Actor
  ) {
    assertStaff(actor);

    const quantities = new Map<string, number>();

    for (const item of data.details) {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) +
          item.quantity
      );
    }

    const lines = [...quantities]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

    if (
      lines.some((line) => line.quantity > 100000)
    ) {
      throw badRequest('Cantidad total excesiva.');
    }

    const hash = fingerprint({
      customerId: data.customerId,
      fulfillmentMethod: data.fulfillmentMethod,
      address:
        data.fulfillmentMethod === 'delivery'
          ? data.address
          : null,
      lines,
    });

    return atomic(async (tx) => {
      await requestLock(tx, data.requestKey);

      const existing = await tx.order.findUnique({
        where: {
          requestKey: data.requestKey,
        },
        include: orderInclude,
      });

      if (existing) {
        if (
          existing.createdById !== actor.id ||
          existing.requestHash !== hash
        ) {
          throw conflict(
            'La referencia de operación ya fue usada para otros datos.'
          );
        }

        return publicOrder(existing);
      }

      const customer = await tx.user.findFirst({
        where: {
          id: data.customerId,
          role: 'client',
          isActive: true,
          deletedAt: null,
        },
      });

      if (!customer) {
        throw badRequest(
          'Selecciona un cliente activo.'
        );
      }

      let total = new Prisma.Decimal(0);

      const details: {
        productId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        subtotal: Prisma.Decimal;
      }[] = [];

      for (const item of lines) {
        await tx.$queryRaw`
          SELECT id FROM products
          WHERE id = ${item.productId}::uuid
          FOR UPDATE
        `;

        const product =
          await tx.product.findUnique({
            where: {
              id: item.productId,
              deletedAt: null,
            },
          });

        if (
          !product ||
          product.stock < item.quantity ||
          new Prisma.Decimal(product.price).lte(0)
        ) {
          throw badRequest(
            'Producto no disponible o existencias insuficientes.'
          );
        }

        const updated =
          await tx.product.updateMany({
            where: {
              id: product.id,
              deletedAt: null,
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

        if (!updated.count) {
          throw conflict(
            'Las existencias cambiaron; actualiza el pedido.'
          );
        }

        const subtotal = new Prisma.Decimal(
          product.price
        )
          .times(item.quantity)
          .toDecimalPlaces(2);

        total = total.plus(subtotal);

        details.push({
          ...item,
          unitPrice: new Prisma.Decimal(
            product.price
          ),
          subtotal,
        });
      }

      const minutes = Math.min(
        10080,
        Math.max(
          5,
          Number(
            process.env.EMPLOYEE_RESERVATION_MINUTES
          ) || 60
        )
      );

      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          createdById: actor.id,
          requestKey: data.requestKey,
          requestHash: hash,
          fulfillmentMethod:
            data.fulfillmentMethod,
          deliverySnapshot:
            data.fulfillmentMethod === 'delivery'
              ? data.address
              : null,
          expiresAt: new Date(
            Date.now() + minutes * 60000
          ),
          total,
          status: 'pending',
          details: {
            create: details,
          },
          receipt: {
            create: {
              customerId: customer.id,
              employeeId: actor.id,
              total,
              paymentStatus: 'pending',
            },
          },
        },
      });

      for (const item of details) {
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'out',
            quantity: item.quantity,
            userId: actor.id,
            reason: `Reserva de pedido ${order.id}`,
          },
        });
      }

      await event(
        tx,
        order.id,
        actor.id,
        'created',
        `Modalidad: ${data.fulfillmentMethod}`
      );

      return publicOrder(
        await tx.order.findUniqueOrThrow({
          where: {
            id: order.id,
          },
          include: orderInclude,
        })
      );
    });
  },

  async available() {
    const candidates =
      await prisma.order.findMany({
        where: {
          deletedAt: null,
          stockReleasedAt: null,
          status: 'paid',
          work: null,
          receipt: {
            is: {
              paymentStatus: 'paid',
            },
          },
        },
        include: orderInclude,
        orderBy: [
          { orderDate: 'asc' },
          { id: 'asc' },
        ],
      });

    return candidates.filter(
      (order) =>
        order.details.length > 0 &&
        (
          order.fulfillmentMethod === 'pickup' ||
          !!order.deliverySnapshot ||
          !!order.deliveryAddressId
        ) &&
        financiallyPaid(order)
    );
  },

  async list(
    actor: Actor,
    scope: 'available' | 'mine' | 'supervision',
    page: number
  ) {
    assertStaff(actor);

    if (scope === 'available') {
      const orders = await this.available();

      return {
        total: orders.length,
        page,
        items: orders
          .slice(
            (page - 1) * perPage,
            page * perPage
          )
          .map((order) => ({
            id: order.id,
            total: order.total,
            orderDate: order.orderDate,
            fulfillmentMethod:
              order.fulfillmentMethod,
            itemCount: order.details.length,
          })),
      };
    }

    if (scope === 'supervision') {
      assertSupervisor(actor);
    }

    const where: Prisma.OrderWhereInput =
      scope === 'mine'
        ? {
            deletedAt: null,
            OR: [
              {
                work: {
                  is: {
                    assigneeId: actor.id,
                  },
                },
              },
              {
                createdById: actor.id,
              },
            ],
          }
        : {
            deletedAt: null,
            OR: [
              {
                createdById: {
                  not: null,
                },
              },
              {
                work: {
                  isNot: null,
                },
              },
            ],
          };

    const [total, items] = await Promise.all([
      prisma.order.count({
        where,
      }),
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: [
          { orderDate: 'desc' },
          { id: 'asc' },
        ],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return {
      total,
      page,
      items: items.map(publicOrder),
    };
  },

  async summary(actor: Actor) {
    assertStaff(actor);

    const [
      available,
      picking,
      packed,
      blocked,
      lowStock,
      recent,
    ] = await Promise.all([
      this.available(),

      prisma.orderWork.count({
        where: {
          assigneeId: actor.id,
          status: 'picking',
          order: {
            deletedAt: null,
            status: 'preparing',
          },
        },
      }),

      prisma.orderWork.count({
        where: {
          assigneeId: actor.id,
          status: 'packed',
          order: {
            deletedAt: null,
            status: 'preparing',
          },
        },
      }),

      prisma.orderWork.count({
        where: {
          assigneeId: actor.id,
          status: 'blocked',
        },
      }),

      prisma.product.findMany({
        where: {
          deletedAt: null,
          stock: {
            lte: prisma.product.fields.stockMin,
          },
        },
        select: productSelect,
        orderBy: {
          stock: 'asc',
        },
        take: 10,
      }),

      this.activity(actor, 1),
    ]);

    return {
      available: available.length,
      picking,
      packed,
      blocked,
      lowStock,
      recent,
      supervisor: isSupervisor(actor),
      paymentSimulation:
        actor.role === 'superadmin' &&
        simulationEnabled(),
    };
  },

  async detail(
    id: string,
    actor: Actor
  ) {
    assertStaff(actor);

    const order = await prisma.order.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: orderInclude,
    });

    if (!order) {
      throw notFound();
    }

    if (
      !isSupervisor(actor) &&
      order.work?.assigneeId !== actor.id &&
      order.createdById !== actor.id
    ) {
      throw forbidden(
        'Toma el pedido antes de consultar los datos del cliente.'
      );
    }

    const events =
      await prisma.orderEvent.findMany({
        where: {
          orderId: id,
        },
        select: {
          id: true,
          action: true,
          note: true,
          createdAt: true,
          actor: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

    const shipments =
      await prisma.despatch.findMany({
        where: {
          orderId: id,
        },
        select: {
          id: true,
          status: true,
        },
      });

    return {
      ...publicOrder(order),
      events,
      shipments,
    };
  },

  async claim(
    id: string,
    actor: Actor
  ) {
    assertStaff(actor);

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOperational(order);

      if (order.work) {
        if (
          order.work.assigneeId === actor.id &&
          order.work.status === 'picking'
        ) {
          return {
            message:
              'El pedido ya está asignado a tu cuenta.',
          };
        }

        throw conflict(
          'Otro empleado ya tomó este pedido.'
        );
      }

      if (order.status !== 'paid') {
        throw conflict(
          'El pedido ya no está disponible.'
        );
      }

      await tx.orderWork.create({
        data: {
          orderId: id,
          assigneeId: actor.id,
        },
      });

      await tx.order.update({
        where: {
          id,
        },
        data: {
          status: 'preparing',
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'claimed'
      );

      return {
        message: 'Pedido asignado.',
      };
    });
  },

  // Devuelve un pedido a Pagado sin modificar sus pagos ni inventario.
  async undoPreparation(id: string, actor: Actor) {
    assertSupervisor(actor);
    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);
      if (order.status !== 'preparing' || !order.work || order.work.status !== 'picking' ||
          order.work.packedAt || order.work.completedAt || order.work.pickupCodeHash || order.work.incident) {
        throw conflict('Solo se puede deshacer una preparación activa que aún no esté empacada.');
      }
      if (order.stockReleasedAt || !financiallyPaid(order) || !order.details.length) {
        throw conflict('El pago o la reserva requieren revisión antes de deshacer la preparación.');
      }
      if (order.details.some((item) => item.pickedQuantity !== 0)) {
        throw conflict('La recogida ya comenzó. Revisa el pedido en Operaciones antes de deshacer la preparación.');
      }
      if (await tx.despatch.count({ where: { orderId: id } })) {
        throw conflict('El pedido tiene un envío registrado. No se puede deshacer la preparación.');
      }
      await tx.orderWork.delete({ where: { orderId: id } });
      await tx.order.update({ where: { id }, data: { status: 'paid' } });
      await event(tx, id, actor.id, 'preparation_undone', `Preparación deshecha; responsable anterior: ${order.work.assigneeId}. Pago e inventario conservados.`);
      return { message: 'Preparación deshecha. El pedido vuelve a Pagado.' };
    });
  },

  async picking(
    id: string,
    items: {
      detailId: string;
      pickedQuantity: number;
    }[],
    actor: Actor
  ) {
    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOwner(order, actor);
      assertOperational(order);

      if (order.work!.status !== 'picking') {
        throw conflict(
          'El pedido no está en preparación.'
        );
      }

      if (
        new Set(
          items.map((item) => item.detailId)
        ).size !== items.length
      ) {
        throw badRequest(
          'No repitas una línea de preparación.'
        );
      }

      for (const item of items) {
        const detail = order.details.find(
          (line) => line.id === item.detailId
        );

        if (
          !detail ||
          item.pickedQuantity > detail.quantity
        ) {
          throw badRequest(
            'Cantidad recogida inválida.'
          );
        }

        await tx.orderDetail.update({
          where: {
            id: detail.id,
          },
          data: {
            pickedQuantity: item.pickedQuantity,
          },
        });
      }

      await event(
        tx,
        id,
        actor.id,
        'picking_updated'
      );

      return {
        message: 'Recogida guardada.',
      };
    });
  },

  async pack(
    id: string,
    actor: Actor
  ) {
    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOwner(order, actor);
      assertOperational(order);

      if (order.work!.status === 'packed') {
        return {
          message: 'Pedido ya empacado.',
        };
      }

      if (
        order.work!.status !== 'picking' ||
        order.details.some(
          (detail) =>
            detail.pickedQuantity !==
            detail.quantity
        )
      ) {
        throw conflict(
          'Completa la recogida y resuelve las incidencias antes de empacar.'
        );
      }

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          status: 'packed',
          packedAt: new Date(),
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'packed'
      );

      return {
        message: 'Pedido empacado.',
      };
    });
  },

  async incident(
    id: string,
    note: string,
    actor: Actor
  ) {
    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOwner(order, actor);
      assertOperational(order);

      if (
        !['picking', 'packed', 'blocked'].includes(
          order.work!.status
        )
      ) {
        throw conflict(
          'No se puede bloquear este pedido.'
        );
      }

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          status: 'blocked',
          incident: note,
          packedAt: null,
          pickupCodeHash: null,
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'incident',
        note
      );

      return {
        message:
          'Incidencia registrada. Administración debe resolverla; no se descontó más inventario.',
      };
    });
  },

  async resolve(
    id: string,
    note: string,
    actor: Actor
  ) {
    assertSupervisor(actor);

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOperational(order);

      if (order.work?.status !== 'blocked') {
        throw conflict(
          'No hay incidencia bloqueante.'
        );
      }

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          status: 'picking',
          incident: null,
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'incident_resolved',
        note
      );

      return {
        message:
          'Incidencia resuelta; revisa la recogida antes de empacar.',
      };
    });
  },

  async reassign(
    id: string,
    assigneeId: string,
    note: string,
    actor: Actor
  ) {
    assertSupervisor(actor);

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOperational(order);

      if (
        !order.work ||
        !['picking', 'packed', 'blocked'].includes(
          order.work.status
        )
      ) {
        throw conflict(
          'No es posible reasignar este pedido.'
        );
      }

      const employee = await tx.user.findFirst({
        where: {
          id: assigneeId,
          role: 'employee',
          isActive: true,
          deletedAt: null,
        },
      });

      if (!employee) {
        throw badRequest(
          'Selecciona un empleado activo.'
        );
      }

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          assigneeId,
          pickupCodeHash: null,
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'reassigned',
        `${order.work.assigneeId} -> ${assigneeId}: ${note}`.slice(
          0,
          500
        )
      );

      return {
        message: 'Responsable actualizado.',
      };
    });
  },

  async dispatch(
    id: string,
    driverId: string,
    actor: Actor
  ) {
    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOwner(order, actor);

      if (
        order.work!.status === 'dispatched' &&
        order.status === 'shipped'
      ) {
        if (order.driverId !== driverId) {
          throw conflict(
            'El pedido ya fue despachado con otro repartidor.'
          );
        }

        return {
          message: 'Despacho ya registrado.',
        };
      }

      assertOperational(order);

      if (
        order.fulfillmentMethod !== 'delivery' ||
        order.work!.status !== 'packed'
      ) {
        throw conflict(
          'El pedido debe ser de domicilio y estar empacado.'
        );
      }

      const address =
        order.deliverySnapshot ||
        (
          await tx.deliveryAddress.findUnique({
            where: {
              id:
                order.deliveryAddressId ??
                '00000000-0000-4000-8000-000000000000',
            },
          })
        )?.address;

      if (!address) {
        throw conflict(
          'El pedido no tiene dirección de entrega.'
        );
      }

      const driver = await tx.user.findFirst({
        where: {
          id: driverId,
          role: 'delivery',
          isActive: true,
          deletedAt: null,
        },
      });

      if (!driver) {
        throw badRequest(
          'Selecciona un repartidor activo.'
        );
      }

      if (
        await tx.despatch.count({
          where: {
            orderId: id,
          },
        })
      ) {
        throw conflict(
          'El pedido ya tiene un envío; requiere revisión administrativa.'
        );
      }

      await tx.despatch.create({
        data: {
          orderId: id,
          driverId,
          address,
          status: 'in_transit',
        },
      });

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          status: 'dispatched',
          completedAt: new Date(),
        },
      });

      await tx.order.update({
        where: {
          id,
        },
        data: {
          status: 'shipped',
          driverId,
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'dispatched',
        `Repartidor: ${driver.fullName}`
      );

      return {
        message:
          'Entrega al repartidor registrada; no equivale a entrega al cliente.',
      };
    });
  },

  async customerPickups(actor: Actor) {
    if (actor.role !== 'client') {
      throw forbidden();
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: actor.id,
        deletedAt: null,
        fulfillmentMethod: 'pickup',
      },
      select: {
        id: true,
        total: true,
        status: true,
        orderDate: true,
        work: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
      take: 50,
    });

    return orders;
  },

  async issuePickupCode(
    id: string,
    actor: Actor
  ) {
    if (actor.role !== 'client') {
      throw forbidden(
        'Solo el cliente comprador obtiene el código.'
      );
    }

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      if (order.customerId !== actor.id) {
        throw forbidden();
      }

      assertOperational(order);

      if (
        order.fulfillmentMethod !== 'pickup' ||
        order.work?.status !== 'packed'
      ) {
        throw conflict(
          'El retiro todavía no está listo.'
        );
      }

      const code = randomBytes(8)
        .toString('hex')
        .toUpperCase();

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          pickupCodeHash: fingerprint(code),
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'pickup_code_issued'
      );

      return {
        code,
        message:
          'Muestra este código al retirar. Generar otro invalida el anterior.',
      };
    });
  },

  async pickup(
    id: string,
    code: string,
    recipientName: string,
    actor: Actor
  ) {
    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      assertOwner(order, actor);

      if (order.work!.status === 'completed') {
        throw conflict(
          'Este pedido ya fue entregado. No registres otro retiro.'
        );
      }

      assertOperational(order);

      if (
        order.fulfillmentMethod !== 'pickup' ||
        order.work!.status !== 'packed'
      ) {
        throw conflict(
          'El pedido no está listo para retiro.'
        );
      }

      if (
        !order.work!.pickupCodeHash ||
        order.work!.pickupCodeHash !==
          fingerprint(code.toUpperCase())
      ) {
        throw badRequest(
          'Código de retiro incorrecto o invalidado.'
        );
      }

      await tx.orderWork.update({
        where: {
          orderId: id,
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
          pickupCodeHash: null,
        },
      });

      await tx.order.update({
        where: {
          id,
        },
        data: {
          status: 'delivered',
        },
      });

      await event(
        tx,
        id,
        actor.id,
        'picked_up',
        `Recibe: ${recipientName}`
      );

      return {
        message: 'Retiro registrado.',
      };
    });
  },

  async inventory(
    data: InventoryInput,
    actor: Actor
  ) {
    assertStaff(actor);

    const hash = fingerprint({
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
    });

    return atomic(async (tx) => {
      await requestLock(tx, data.requestKey);

      const previous =
        await tx.inventoryMovement.findUnique({
          where: {
            requestKey: data.requestKey,
          },
        });

      if (previous) {
        if (
          previous.userId !== actor.id ||
          previous.requestHash !== hash
        ) {
          throw conflict(
            'La referencia de movimiento ya fue utilizada.'
          );
        }

        return {
          id: previous.id,
          message:
            'Movimiento ya registrado; no se duplicó.',
        };
      }

      await tx.$queryRaw`
        SELECT id FROM products
        WHERE id = ${data.productId}::uuid
        FOR UPDATE
      `;

      const product =
        await tx.product.findUnique({
          where: {
            id: data.productId,
            deletedAt: null,
          },
        });

      if (!product) {
        throw notFound(
          'Producto no encontrado.'
        );
      }

      const updated =
        await tx.product.updateMany({
          where: {
            id: product.id,
            ...(
              data.type === 'out'
                ? {
                    stock: {
                      gte: data.quantity,
                    },
                  }
                : {}
            ),
          },
          data: {
            stock:
              data.type === 'out'
                ? {
                    decrement: data.quantity,
                  }
                : {
                    increment: data.quantity,
                  },
          },
        });

      if (!updated.count) {
        throw conflict(
          'Existencias insuficientes para el retiro.'
        );
      }

      const movement =
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: data.type,
            quantity: data.quantity,
            reason: data.reason,
            userId: actor.id,
            requestKey: data.requestKey,
            requestHash: hash,
          },
        });

      const current =
        await tx.product.findUniqueOrThrow({
          where: {
            id: product.id,
          },
          select: productSelect,
        });

      return {
        id: movement.id,
        product: current,
        message: 'Movimiento registrado.',
      };
    });
  },

  async movements(
    actor: Actor,
    page: number
  ) {
    assertStaff(actor);

    return prisma.inventoryMovement.findMany({
      where: isSupervisor(actor)
        ? {}
        : {
            userId: actor.id,
          },
      select: {
        id: true,
        type: true,
        quantity: true,
        reason: true,
        date: true,
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { id: 'asc' },
      ],
      skip: (page - 1) * perPage,
      take: perPage,
    });
  },

  async activity(
    actor: Actor,
    page: number
  ) {
    assertStaff(actor);

    return prisma.orderEvent.findMany({
      where: isSupervisor(actor)
        ? {}
        : {
            actorId: actor.id,
          },
      select: {
        id: true,
        orderId: true,
        action: true,
        note: true,
        createdAt: true,
        actor: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'asc' },
      ],
      skip: (page - 1) * perPage,
      take: perPage,
    });
  },

  async cancel(
    id: string,
    note: string,
    actor: Actor | null,
    expiredOnly = false
  ) {
    if (actor) {
      assertSupervisor(actor);
    } else if (!expiredOnly) {
      throw forbidden();
    }

    return atomic(async (tx) => {
      const order = await lockOrder(tx, id);

      if (!order.createdById) {
        throw conflict(
          'Esta operación requiere un pedido con registro de creador; los pedidos históricos necesitan revisión.'
        );
      }

      if (order.stockReleasedAt) {
        return {
          message: 'Reserva ya liberada.',
        };
      }

      if (
        order.status !== 'pending' ||
        order.work ||
        order.receipt?.payouts.some(
          (payment) =>
            payment.status === 'approved' ||
            payment.status === 'refunded'
        )
      ) {
        throw conflict(
          'No se puede cancelar automáticamente un pedido con pago o preparación.'
        );
      }

      if (
        expiredOnly &&
        (
          !order.expiresAt ||
          order.expiresAt > new Date()
        )
      ) {
        throw conflict(
          'La reserva no ha vencido.'
        );
      }

      for (
        const detail of [...order.details].sort(
          (a, b) =>
            a.productId.localeCompare(
              b.productId
            )
        )
      ) {
        await tx.product.update({
          where: {
            id: detail.productId,
          },
          data: {
            stock: {
              increment: detail.quantity,
            },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: detail.productId,
            type: 'in',
            quantity: detail.quantity,
            userId: actor?.id,
            reason:
              `Liberación de reserva ${id}`,
          },
        });
      }

      await tx.order.update({
        where: {
          id,
        },
        data: {
          status: 'canceled',
          stockReleasedAt: new Date(),
        },
      });

      if (order.receipt) {
        await tx.receipt.update({
          where: {
            id: order.receipt.id,
          },
          data: {
            paymentStatus: 'voided',
          },
        });
      }

      await event(
        tx,
        id,
        actor?.id ?? null,
        expiredOnly ? 'expired' : 'canceled',
        note
      );

      return {
        message:
          'Pedido cancelado y reserva liberada una sola vez.',
      };
    });
  },
};