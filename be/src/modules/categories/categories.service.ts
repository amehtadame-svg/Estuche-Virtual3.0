import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

export const categoryService = {
  list() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
  },

  async getById(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw notFound('Categoría no encontrada.');
    return category;
  },

  async create(data: { name: string; description?: string }) {
    const existing = await prisma.category.findFirst({ where: { name: data.name } });
    if (existing) throw badRequest('Ya existe una categoría con ese nombre.');
    return prisma.category.create({ data });
  },

  async update(id: string, data: { name?: string; description?: string }) {
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) throw notFound('Categoría no encontrada.');
    return prisma.category.update({ where: { id }, data });
  },

  /**
   * Solo permite borrar categorías sin productos asociados: así el catálogo
   * nunca queda con productos huérfanos (RF-014).
   */
  async remove(id: string) {
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) throw notFound('Categoría no encontrada.');

    const products = await prisma.product.count({ where: { categoryId: id, deletedAt: null } });
    if (products > 0) {
      throw badRequest(
        `La categoría tiene ${products} producto(s) asociado(s). Reasígnalos antes de eliminarla.`
      );
    }

    await prisma.category.delete({ where: { id } });
    return null;
  },
};
