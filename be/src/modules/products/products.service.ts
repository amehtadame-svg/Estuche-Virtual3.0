import { prisma } from '../../lib/prisma';

export const productService = {
  // C-05: los productos eliminados (deletedAt) no aparecen en el catálogo.
  list() {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  create(data: {
    name: string;
    description?: string;
    price: number;
    categoryId?: string;
    supplierId?: string;
    stock?: number;
    stockMin?: number;
  }) {
    return prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId ?? null,
        supplierId: data.supplierId ?? null,
        stock: data.stock ?? 0,
        stockMin: data.stockMin ?? 5,
      },
    });
  },

  update(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      categoryId?: string;
      supplierId?: string;
      stock?: number;
      stockMin?: number;
    }
  ) {
    return prisma.product.update({
      where: { id, deletedAt: null },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId ?? null,
        supplierId: data.supplierId ?? null,
        stock: data.stock,
        stockMin: data.stockMin,
      },
    });
  },

  // C-05: borrado lógico. Se marca deletedAt en lugar de destruir el producto
  // y su historial (inventoryMovements, priceHistory, orderDetails, recibos).
  // El historial contable y de ventas se conserva intacto.
  async remove(id: string) {
    await prisma.product.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return null;
  },
};
