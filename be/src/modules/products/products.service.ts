import { prisma } from '../../lib/prisma';

export const productService = {
  list() {
    return prisma.product.findMany({
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
      where: { id },
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

  async remove(id: string) {
    await prisma.$transaction(async (tx) => {
      await tx.inventoryMovement.deleteMany({ where: { productId: id } });
      await tx.priceHistory.deleteMany({ where: { productId: id } });
      await tx.orderDetail.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });
    return null;
  },
};
