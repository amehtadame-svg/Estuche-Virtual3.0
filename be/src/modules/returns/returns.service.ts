import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

export const returnService = {
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
