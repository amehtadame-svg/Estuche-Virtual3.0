import { prisma } from '../../lib/prisma';

export const providerService = {
  list() {
    return prisma.provider.findMany({
      include: {
        providerCategories: { include: { category: { select: { name: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  },

  create(data: { name: string; phone?: string; email?: string; address?: string }) {
    return prisma.provider.create({ data });
  },

  update(id: string, data: { name?: string; phone?: string; email?: string; address?: string }) {
    return prisma.provider.update({ where: { id }, data });
  },

  async remove(id: string) {
    await prisma.product.updateMany({ where: { supplierId: id }, data: { supplierId: null } });
    await prisma.provider.delete({ where: { id } });
    return null;
  },
};
