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
    await prisma.$transaction(async (tx) => {
      // Desvincula las categorías y productos antes de borrar el proveedor,
      // porque sus relaciones usan onDelete: NoAction en la base de datos.
      await tx.providerCategory.deleteMany({ where: { providerId: id } });
      await tx.product.updateMany({ where: { supplierId: id }, data: { supplierId: null } });
      await tx.provider.delete({ where: { id } });
    });
    return null;
  },
};
