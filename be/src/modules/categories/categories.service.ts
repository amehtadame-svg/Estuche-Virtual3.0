import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

export const categoryService = {
  list() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async create(data: { name: string; description?: string | null }) {
    const cleanName = data.name.trim();
    const existing = await prisma.category.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });
    if (existing) {
      throw badRequest('Ya existe una categoría con ese nombre.');
    }

    return prisma.category.create({
      data: {
        name: cleanName,
        description: data.description ?? null,
      },
    });
  },

  async update(id: string, data: { name?: string; description?: string | null }) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw notFound('Categoría no encontrada.');

    if (data.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          id: { not: id },
          name: { equals: data.name.trim(), mode: 'insensitive' },
        },
      });
      if (duplicate) {
        throw badRequest('Ya existe otra categoría con ese nombre.');
      }
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
  },

  async remove(id: string) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw notFound('Categoría no encontrada.');

    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    await prisma.providerCategory.deleteMany({
      where: { categoryId: id },
    });
    await prisma.category.delete({ where: { id } });
    return null;
  },
};