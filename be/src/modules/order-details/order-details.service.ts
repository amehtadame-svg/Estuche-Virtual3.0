import { prisma } from '../../lib/prisma';

export const orderDetailService = {
  list() {
    return prisma.orderDetail.findMany({
      include: {
        order: { select: { id: true } },
        product: { select: { name: true } },
      },
      orderBy: { id: 'desc' },
    });
  },

  create(data: { orderId: string; productId: string; quantity: number; unitPrice: number }) {
    return prisma.orderDetail.create({
      data: {
        orderId: data.orderId,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        subtotal: data.quantity * data.unitPrice,
      },
    });
  },

  update(id: string, data: { orderId?: string; productId?: string; quantity?: number; unitPrice?: number }) {
    return prisma.orderDetail.update({ where: { id }, data });
  },

  async remove(id: string) {
    await prisma.orderDetail.delete({ where: { id } });
    return null;
  },
};
