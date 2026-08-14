import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../lib/errors';

interface Requester {
  id: string;
  role: string;
}

const ADMIN_ROLES = ['admin', 'superadmin'];
const isAdmin = (r: Requester | undefined) => !!r && ADMIN_ROLES.includes(r.role);

const LIST_INCLUDE = {
  customer: { select: { fullName: true } },
  driver: { select: { fullName: true } },
  deliveryAddress: { select: { address: true, city: true } },
  promotionalCode: { select: { code: true, value: true } },
} as const;

export const orderService = {
  list() {
    return prisma.order.findMany({ include: LIST_INCLUDE, orderBy: { orderDate: 'desc' } });
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { fullName: true } },
        deliveryAddress: { select: { address: true, city: true } },
      },
    });
    if (!order) throw notFound('Pedido no encontrado.');
    return order;
  },

  async create(
    data: {
      deliveryAddressId?: string;
      promotionalCodeId?: string;
      total?: number;
      status?: string;
      details?: { productId: string; quantity: number; unitPrice: number }[];
    },
    requester: Requester
  ) {
    const { deliveryAddressId, promotionalCodeId, total, status, details } = data;
    const customerId = requester.id;

    return prisma.$transaction(async (tx) => {
      let finalCodeId = promotionalCodeId ?? null;

      if (promotionalCodeId) {
        const code = await tx.promotionalCode.findUnique({ where: { id: promotionalCodeId } });
        if (!code || !code.active) throw badRequest('El código promocional no está activo.');
        await tx.promotionalCode.update({
          where: { id: promotionalCodeId },
          data: { currentUses: { increment: 1 } },
        });
        finalCodeId = promotionalCodeId;
      }

      const newOrder = await tx.order.create({
        data: {
          customerId,
          deliveryAddressId: deliveryAddressId ?? null,
          promotionalCodeId: finalCodeId,
          total: total ?? 0,
          status: (status ?? 'pending') as any,
        },
      });

      if (Array.isArray(details) && details.length > 0) {
        for (const item of details) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw badRequest(`Producto ${item.productId} no encontrado.`);
          if (product.stock < item.quantity) {
            throw badRequest(
              `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}.`
            );
          }
        }
        await tx.orderDetail.createMany({
          data: details.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })),
        });
      }

      return newOrder;
    });
  },

  update(id: string, data: any) {
    const { status, ...rest } = data;
    return prisma.order.update({
      where: { id },
      data: { ...rest, status: status as any },
    });
  },

  async remove(id: string) {
    await prisma.$transaction(async (tx) => {
      await tx.orderDetail.deleteMany({ where: { orderId: id } });
      await tx.despatch.deleteMany({ where: { orderId: id } });
      await tx.receipt.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });
    return null;
  },

  async applyPromotionalCode(id: string, code: string, requester: Requester) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw notFound('Pedido no encontrado.');

    const isOwner = order.customerId === requester?.id;
    if (!isOwner && !isAdmin(requester)) throw forbidden('No puedes modificar este pedido.');

    const promo = await prisma.promotionalCode.findFirst({ where: { code: String(code).trim() } });
    if (!promo) throw notFound('Código promocional no encontrado.');

    await prisma.promotionalCode.update({
      where: { id: promo.id },
      data: { currentUses: { increment: 1 } },
    });
    await prisma.order.update({ where: { id }, data: { promotionalCodeId: promo.id } });

    return prisma.order.findUnique({
      where: { id },
      include: { promotionalCode: { select: { code: true, value: true, type: true } } },
    });
  },
};
