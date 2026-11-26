import { shippingCost } from '../../lib/shipping';
import {
  atomic,
  assertUnmanaged,
} from '../employee/employee.domain';
import { prisma } from '../../lib/prisma';
import {
  badRequest,
  forbidden,
  notFound,
} from '../../lib/errors';

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
    data: {
      deliveryAddressId?: string;
      promotionalCodeId?: string;
      status?: string;
      details?: {
        productId: string;
        quantity: number;
      }[];
    },
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

    const {
      deliveryAddressId,
      promotionalCodeId,
      details,
    } = data;

    const customerId = requester.id;

    return prisma.$transaction(async (tx) => {
      let deliverySnapshot: string | null =
        null;

      if (deliveryAddressId) {
        const address =
          await tx.deliveryAddress.findFirst({
            where: {
              id: deliveryAddressId,
              userId: requester.id,
            },
          });

        if (!address) {
          throw forbidden(
            'La dirección no pertenece a tu cuenta.'
          );
        }

        deliverySnapshot = [
          address.address,
          address.city,
          address.state,
        ]
          .filter(Boolean)
          .join(', ');
      } else {
        const customer =
          await tx.user.findUnique({
            where: {
              id: customerId,
            },
            select: {
              address: true,
            },
          });

        deliverySnapshot =
          customer?.address ?? null;
      }

      const items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }[] = [];

      let total = 0;

      if (
        Array.isArray(details) &&
        details.length > 0
      ) {
        for (const item of details) {
          const product =
            await tx.product.findUnique({
              where: {
                id: item.productId,
              },
            });

          if (!product) {
            throw badRequest(
              `Producto ${item.productId} no encontrado.`
            );
          }

          if (
            product.stock < item.quantity
          ) {
            throw badRequest(
              `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}.`
            );
          }

          const unitPrice = Number(
            product.price
          );

          const subtotal =
            unitPrice * item.quantity;

          items.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            subtotal,
          });

          total += subtotal;
        }
      }

      const deliveryFee = shippingCost(total);
      let finalCodeId =
        promotionalCodeId ?? null;

      if (promotionalCodeId) {
        const code =
          await tx.promotionalCode.findUnique({
            where: {
              id: promotionalCodeId,
            },
          });

        if (!code || !code.active) {
          throw badRequest(
            'El código promocional no está activo.'
          );
        }

        if (code.type === 'percentage') {
          total =
            total *
            (1 - Number(code.value) / 100);
        } else if (code.type === 'fixed') {
          total = Math.max(
            0,
            total - Number(code.value)
          );
        }

        await tx.promotionalCode.update({
          where: {
            id: promotionalCodeId,
          },
          data: {
            currentUses: {
              increment: 1,
            },
          },
        });

        finalCodeId = promotionalCodeId;
      }

      total =
        Math.round((Math.max(0, total) + deliveryFee) * 100) / 100;

      const newOrder =
        await tx.order.create({
          data: {
            customerId,
            createdById: requester.id,
            deliverySnapshot,
            expiresAt: new Date(
              Date.now() +
                Math.min(
                  10080,
                  Math.max(
                    5,
                    Number(
                      process.env
                        .EMPLOYEE_RESERVATION_MINUTES
                    ) || 60
                  )
                ) *
                  60000
            ),
            deliveryAddressId:
              deliveryAddressId ?? null,
            promotionalCodeId:
              finalCodeId,
            total,
            shippingCost: deliveryFee,
            status: 'pending',
          },
        });

      if (items.length > 0) {
        for (const item of items) {
          const updated =
            await tx.product.updateMany({
              where: {
                id: item.productId,
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

          if (updated.count === 0) {
            throw badRequest(
              `Stock insuficiente para el producto ${item.productId}.`
            );
          }

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'out',
              quantity: item.quantity,
              reason:
                `Venta - pedido ${newOrder.id}`,
              userId: customerId,
            },
          });
        }

        await tx.orderDetail.createMany({
          data: items.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        });
      }

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
      await assertUnmanaged(tx, id);

      const order = await tx.order.findUnique({
        where: {
          id,
          deletedAt: null,
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

      const promo =
        await tx.promotionalCode.findFirst({
          where: {
            code: String(code).trim(),
          },
        });

      if (!promo) {
        throw notFound(
          'Código promocional no encontrado.'
        );
      }

      await tx.promotionalCode.update({
        where: {
          id: promo.id,
        },
        data: {
          currentUses: {
            increment: 1,
          },
        },
      });

      await tx.order.update({
        where: {
          id,
        },
        data: {
          promotionalCodeId: promo.id,
        },
      });

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