import { prisma } from '../../lib/prisma';

export const productService = {
  // C-05: los productos eliminados (deletedAt) no aparecen en el catálogo.
  list() {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: {
    name: string;
    description?: string;
    price: number;
    categoryId?: string;
    supplierId?: string;
    stock?: number;
    stockMin?: number;
    imageUrl?: string;
  }) {
    const product = await prisma.product.create({
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

    if (data.imageUrl) {
      await prisma.productImage.create({
        data: { productId: product.id, url: data.imageUrl, isPrimary: true, sortOrder: 1 },
      });
    }

    return product;
  },

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      categoryId?: string;
      supplierId?: string;
      stock?: number;
      stockMin?: number;
      imageUrl?: string;
    }
  ) {
    const product = await prisma.product.update({
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

    // Si mandan una nueva URL, reemplaza la imagen principal (upsert simple).
    if (data.imageUrl) {
      const primary = await prisma.productImage.findFirst({
        where: { productId: id, isPrimary: true },
      });
      if (primary) {
        await prisma.productImage.update({ where: { id: primary.id }, data: { url: data.imageUrl } });
      } else {
        await prisma.productImage.create({
          data: { productId: id, url: data.imageUrl, isPrimary: true, sortOrder: 1 },
        });
      }
    }

    return product;
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