import { prisma } from '../../lib/prisma';

export const despatchService = {
  list() {
    return prisma.despatch.findMany({
      include: {
        order: { select: { id: true, customer: { select: { fullName: true } } } },
        driver: { select: { fullName: true } },
      },
      orderBy: { id: 'desc' },
    });
  },

  create(data: { orderId: string; driverId?: string; address?: string; status?: string }) {
    return prisma.despatch.create({
      data: {
        orderId: data.orderId,
        driverId: data.driverId || null,
        address: data.address ?? null,
        status: (data.status ?? 'in_transit') as any,
      },
    });
  },

  update(
    id: string,
    data: { driverId?: string; address?: string; status?: string; deliveredAt?: Date }
  ) {
    return prisma.despatch.update({
      where: { id },
      data: {
        driverId: data.driverId || null,
        address: data.address ?? null,
        status: (data.status ?? 'in_transit') as any,
        deliveredAt: data.deliveredAt ?? null,
      },
    });
  },

  async remove(id: string) {
    await prisma.despatch.delete({ where: { id } });
    return null;
  },
};
