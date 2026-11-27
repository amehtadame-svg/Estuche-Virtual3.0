import { Prisma } from '@prisma/client';
import { shippingCost } from '../../lib/shipping';
import {
  atomic,
  assertUnmanaged,
  event,
  requestLock,
} from '../employee/employee.domain';
import { prisma } from '../../lib/prisma';
import {
  assertCoupon,
  consumeCoupon,
  couponDiscount,
  normalizeCoupon,
} from '../promotional-code/promotional-code.domain';
import {
  badRequest,
  forbidden,
  notFound,
} from '../../lib/errors';
import { CreateOrderInput } from './orders.schema';

interface Requester {
  id: string;
  role: string;
}

const ADMIN_ROLES = [
  'admin',
  'superadmin',
];

const isAdmin = (
  requester: Requester | undefined
) =>
  !!requester &&
  ADMIN_ROLES.includes(requester.role);

const assertOrderAccess = (
  requester: Requester
) => {
  if (
    !requester ||
    !['client', 'admin', 'superadmin'].includes(
      requester.role
    )
  ) {
    throw forbidden(
      'No tienes permiso para operar pedidos.'
    );
  }
};

const LIST_INCLUDE = {
  details: { select: { productId: true, quantity: true, product: { select: { name: true } } } },
  work: { select: { id: true } },
  customer: {
    select: {
      fullName: true,
    },
  },
  driver: {
    select: {
      fullName: true,
    },
  },
  deliveryAddress: {
    select: {
      address: true,
      city: true,
    },
  },
  promotionalCode: {
    select: {
      code: true,
      value: true,
    },
  },
} as const;

interface PricedLine {
  productId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  subtotal: Prisma.Decimal;
}

/**
 * A-04: una sola regla de "producto comprable" para la validación previa y
 * para el descuento de stock. Un producto eliminado (deletedAt) no se vende
 * aunque todavía tenga unidades y aunque el cliente envíe su ID a mano.
 */
const ACTIVE_PRODUCT = { deletedAt: null } as const;

export const orderService = {
  list(requester: Requester) {
    assertOrderAccess(requester);

    return prisma.order.findMany({
      where: {
        deletedAt: null,
        ...(
          !isAdmin(requester)
            ? {
                customerId: requester.id,
              }
            : {}
        ),
      },
      include: LIST_INCLUDE,
      orderBy: {
        orderDate: 'desc',
      },
    });
  },

  async getById(
    id: string,
    requester: Requester
  ) {
    assertOrderAccess(requester);

    const order = await prisma.order.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            fullName: true,
          },
        },
        deliveryAddress: {
          select: {
            address: true,
            city: true,
          },
        },
        details: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
            product: { select: { name: true } },
          },
          orderBy: { id: 'asc' },
        },
        receipt: {
          select: {
            receiptNumber: true,
            paymentStatus: true,
            payouts: {
              select: { gateway: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw notFound(
        'Pedido no encontrado.'
      );
    }

    if (
      !isAdmin(requester) &&
      order.customerId !== requester.id
    ) {
      throw forbidden(
        'No puedes consultar este pedido.'
      );
    }

    return order;
  },

  async create(
    data: CreateOrderInput,
    requester: Requester
  ) {
    assertOrderAccess(requester);

    if (
      data.status &&
      data.status !== 'pending'
    ) {
      throw badRequest(
        'Los pedidos nuevos deben quedar pendientes.'
      );
    }

    const fulfillmentMethod = data.fulfillmentMethod ?? 'delivery';
    const isPickup = fulfillmentMethod === 'pickup';

    // A-01: nunca se crea un pedido sin líneas (validación explícita además
    // del esquema, porque el servicio puede invocarse desde otros módulos).
    if (!Array.isArray(data.details) || data.details.length === 0) {
      throw badRequest('Un pedido debe incluir al menos un producto.');
    }

    // A-02: domicilio exige una dirección, pero sirve la del perfil del
    // cliente. Solo se rechaza si tampoco hay dirección guardada (se comprueba
    // más abajo, ya con el cliente leído).

    const customerId = isAdmin(requester) && data.customerId
      ? data.customerId
      : requester.id;

    // Un cliente solo puede comprar para sí mismo.
    if (!isAdmin(requester) && data.customerId && data.customerId !== requester.id) {
      throw forbidden('No puedes crear un pedido a nombre de otro usuario.');
    }

    return atomic(async (tx) => {
      const customer = await tx.user.findUnique({
        where: { id: customerId },
        select: { address: true },
      });

      if (!customer) {
        throw notFound('Cliente no encontrado.');
      }

      let deliverySnapshot: string | null = null;

      if (isPickup) {
        deliverySnapshot = null;
      } else if (data.deliveryAddressId) {
        const address = await tx.deliveryAddress.findFirst({
          where: {
            id: data.deliveryAddressId,
            userId: customerId,
          },
        });

        if (!address) {
          throw forbidden('La dirección no pertenece a la cuenta del cliente.');
        }

        deliverySnapshot = [address.address, address.city, address.state]
          .filter(Boolean)
          .join(', ');
      } else {
        deliverySnapshot = data.deliveryAddress?.trim() || customer.address || null;
      }

      if (!isPickup && !deliverySnapshot) {
        throw badRequest('Indica una dirección para domicilio.');
      }

      // En retiro no se registra dirección de entrega.
      if (isPickup) deliverySnapshot = null;

      // ── A-01/A-03: validación de líneas y producto activo ───────────────
      const lines: PricedLine[] = [];
      let subtotal = new Prisma.Decimal(0);

      for (const item of data.details) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, ...ACTIVE_PRODUCT },
        });

        // A-04: mismo mensaje si no existe o si está eliminado.
        if (!product) {
          throw badRequest(
            `El producto ${item.productId} ya no está disponible en el catálogo.`
          );
        }

        if (item.quantity < 1) {
          throw badRequest(
            `La cantidad de "${product.name}" debe ser al menos 1.`
          );
        }

        if (product.stock < item.quantity) {
          throw badRequest(
            `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}.`
          );
        }

        if (Number(product.price) <= 0) {
          throw badRequest(
            `El producto "${product.name}" no tiene un precio de venta válido.`
          );
        }

        // El precio SIEMPRE viene de la BD, nunca del cuerpo de la petición.
        const unitPrice = new Prisma.Decimal(product.price);
        const lineSubtotal = unitPrice.mul(item.quantity).toDecimalPlaces(2);

        lines.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          subtotal: lineSubtotal,
        });

        subtotal = subtotal.plus(lineSubtotal);
      }

      // ── A-05/A-06/A-07: cupón ───────────────────────────────────────────
      // El umbral de envío se calcula sobre el subtotal ANTES del descuento.
      const deliveryFee = new Prisma.Decimal(
        shippingCost(subtotal.toNumber(), isPickup)
      );
      let total = subtotal;
      let promotionalCodeId: string | null = null;

      if (data.promotionalCodeId || data.promotionalCode) {
        // A-05: el ID suelto no salta la validación. Si llega un ID, primero
        // se resuelve al código y se valida con las mismas reglas.
        let promoId = data.promotionalCodeId;

        if (!promoId && data.promotionalCode) {
          const found = await tx.promotionalCode.findFirst({
            where: {
              code: { equals: normalizeCoupon(data.promotionalCode), mode: 'insensitive' },
            },
            select: { id: true },
          });
          promoId = found?.id;
        }

        if (!promoId) {
          throw badRequest('No encontramos ese cupón. Revisa el código e intenta de nuevo.');
        }

        // Bloqueo + relectura + incremento condicional dentro del lock.
        const promo = await consumeCoupon(tx, promoId, subtotal.toNumber());

        total = subtotal.minus(couponDiscount(subtotal, promo));
        promotionalCodeId = promo.id;
      }

      total = Prisma.Decimal.max(0, total).plus(deliveryFee).toDecimalPlaces(2);

      if (total.lte(0)) {
        throw badRequest('El pedido debe tener un total mayor que cero.');
      }

      const minutes = Math.min(
        10080,
        Math.max(
          5,
          Number(process.env.EMPLOYEE_RESERVATION_MINUTES) || 60
        )
      );

      const newOrder = await tx.order.create({
        data: {
          customerId,
          createdById: requester.id,
          fulfillmentMethod,
          deliverySnapshot,
          expiresAt: new Date(Date.now() + minutes * 60000),
          deliveryAddressId: isPickup ? null : data.deliveryAddressId ?? null,
          promotionalCodeId,
          total,
          shippingCost: deliveryFee,
          status: 'pending',
          details: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              subtotal: line.subtotal,
            })),
          },
        },
      });

      // ── A-04: el descuento de stock vuelve a exigir producto activo ──────
      for (const line of lines) {
        const updated = await tx.product.updateMany({
          where: {
            id: line.productId,
            ...ACTIVE_PRODUCT,
            stock: { gte: line.quantity },
          },
          data: { stock: { decrement: line.quantity } },
        });

        if (updated.count === 0) {
          throw badRequest(
            `El producto ${line.productId} dejó de estar disponible o no tiene stock suficiente.`
          );
        }

        await tx.inventoryMovement.create({
          data: {
            productId: line.productId,
            type: 'out',
            quantity: line.quantity,
            reason: `Venta - pedido ${newOrder.id}`,
            userId: requester.id,
          },
        });
      }

      await event(
        tx,
        newOrder.id,
        requester.id,
        'created',
        `Modalidad: ${fulfillmentMethod}`
      );

      return newOrder;
    });
  },

  update(
    id: string,
    data: any
  ) {
    const {
      status,
      ...rest
    } = data;

    if (status === 'paid') {
      throw badRequest(
        'El estado pagado solo puede establecerse desde el flujo de pagos.'
      );
    }

    return atomic(async (tx) => {
      await assertUnmanaged(tx, id);

      // A-05: cambiar el cupón desde la edición NO puede saltarse la
      // validación (vigencia, estado, compra mínima, usos). Antes se guardaba
      // cualquier `promotionalCodeId` que llegara en el cuerpo.
      if (rest.promotionalCodeId) {
        const order = await tx.order.findUnique({
          where: { id, deletedAt: null },
          include: {
            details: { select: { unitPrice: true, quantity: true } },
          },
        });

        if (!order) {
          throw notFound('Pedido no encontrado.');
        }

        // No se puede poner el mismo cupón dos veces (ni consumirlo de nuevo).
        if (order.promotionalCodeId === rest.promotionalCodeId) {
          throw badRequest('Este pedido ya tiene ese cupón aplicado.');
        }

        const subtotal = order.details.reduce(
          (sum, line) =>
            sum.plus(new Prisma.Decimal(line.unitPrice).mul(line.quantity)),
          new Prisma.Decimal(0)
        );

        const promo = await consumeCoupon(
          tx,
          rest.promotionalCodeId,
          subtotal.toNumber()
        );

        // Se recalcula el total con el descuento. El envío ya está en el
        // pedido y no cambia: el umbral se mide sobre el subtotal sin cupón.
        rest.promotionalCodeId = promo.id;
        rest.total = Prisma.Decimal.max(
          0,
          subtotal.minus(couponDiscount(subtotal, promo))
        )
          .plus(new Prisma.Decimal(order.shippingCost))
          .toDecimalPlaces(2);
      }

      return tx.order.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          ...rest,
          status: status as any,
        },
      });
    });
  },

  async remove(id: string) {
    return atomic(async (tx) => {
      await assertUnmanaged(tx, id);

      await tx.order.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return null;
    });
  },

  async applyPromotionalCode(
    id: string,
    code: string,
    requester: Requester
  ) {
    assertOrderAccess(requester);

    return atomic(async (tx) => {
      // Se aplica antes de la regla de "pedido operativo" porque aplicar un
      // cupón es una operación financiera del cliente sobre su propia compra,
      // no una edición del contenido del pedido. El pedido se sigue bloqueando
      // aquí (FOR UPDATE) para que dos PATCH no consuman el cupón dos veces.
      await requestLock(tx, `order:${id}`);

      const order = await tx.order.findUnique({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          details: { select: { unitPrice: true, quantity: true } },
        },
      });

      if (!order) {
        throw notFound(
          'Pedido no encontrado.'
        );
      }

      const isOwner =
        order.customerId === requester.id;

      if (
        !isOwner &&
        !isAdmin(requester)
      ) {
        throw forbidden(
          'No puedes modificar este pedido.'
        );
      }

      if (order.status !== 'pending') {
        throw badRequest(
          'Solo se pueden aplicar descuentos a pedidos pendientes.'
        );
      }

      // A-06: consumir dos veces el mismo cupón sobre el mismo pedido no es válido.
      if (order.promotionalCodeId) {
        throw badRequest(
          'Este pedido ya tiene un cupón aplicado.'
        );
      }

      const promo = await tx.promotionalCode.findFirst({
        where: {
          code: { equals: normalizeCoupon(code), mode: 'insensitive' },
        },
      });

      // A-05: misma validación que el checkout (vigencia, estado, mínimo, usos).
      const subtotal = order.details.reduce(
        (sum, line) => sum.plus(new Prisma.Decimal(line.unitPrice).mul(line.quantity)),
        new Prisma.Decimal(0)
      );

      assertCoupon(promo, subtotal.toNumber());

      const consumed = await consumeCoupon(tx, promo.id, subtotal.toNumber());

      // Se recalcula el total con el descuento. El envío ya está en el pedido
      // y no cambia: el umbral se mide sobre el subtotal antes del cupón.
      const total = Prisma.Decimal.max(0, subtotal.minus(couponDiscount(subtotal, consumed)))
        .plus(new Prisma.Decimal(order.shippingCost))
        .toDecimalPlaces(2);

      await tx.order.update({
        where: { id },
        data: {
          promotionalCodeId: consumed.id,
          total,
        },
      });

      await event(
        tx,
        order.id,
        requester.id,
        'coupon_applied',
        `Cupón ${consumed.code}`
      );

      return tx.order.findUnique({
        where: {
          id,
        },
        include: {
          promotionalCode: {
            select: {
              code: true,
              value: true,
              type: true,
            },
          },
        },
      });
    });
  },
};
