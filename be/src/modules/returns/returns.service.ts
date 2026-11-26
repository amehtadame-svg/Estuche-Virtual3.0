import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';
import { atomic, lockOrder } from '../employee/employee.domain';

export const returnService = {
  async create(data: { orderId: string; productId: string; quantity: number; reason: string }) {
    return atomic(async (tx) => {
      const order = await lockOrder(tx, data.orderId);
      if (order.status !== 'delivered' || !order.customerId) {
        throw badRequest('Solo se pueden registrar devoluciones de pedidos entregados con cliente.');
      }
      const purchased = order.details.filter(d => d.productId === data.productId).reduce((sum, d) => sum + d.quantity, 0);
      const prior = await tx.orderReturn.aggregate({
        where: { orderId: order.id, productId: data.productId, status: { not: 'rejected' } },
        _sum: { quantity: true },
      });
      if (!purchased || data.quantity > purchased - (prior._sum.quantity ?? 0)) {
        throw badRequest('La cantidad supera las unidades disponibles para devolver de este pedido.');
      }
      return tx.orderReturn.create({ data: { ...data, customerId: order.customerId } });
    });
  },

  list() {
    return prisma.orderReturn.findMany({
      include: {
        customer: { select: { fullName: true, email: true } },
        product: { select: { name: true } },
        order: { select: { id: true } },
      },
      orderBy: { id: 'desc' },
    });
  },

  async getById(id: string) {
    const returnRequest = await prisma.orderReturn.findUnique({
      where: { id },
      include: {
        customer: { select: { fullName: true, email: true } },
        product: { select: { name: true, price: true } },
        order: { select: { id: true, total: true } },
      },
    });
    if (!returnRequest) throw notFound('Devolución no encontrada');
    return returnRequest;
  },

  resolve(id: string, data: { status: string; refund?: number; productCondition?: string }) {
    return prisma.orderReturn.update({
      where: { id },
      data: {
        status: data.status as any,
        productCondition: data.productCondition ?? undefined,
        refund: data.refund ?? undefined,
        resolvedAt: new Date(),
      },
    });
  },
};
