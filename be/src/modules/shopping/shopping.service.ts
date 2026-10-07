import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

const PRODUCT_INCLUDE = { select: { name: true, price: true } } as const;

export const shoppingService = {
  list(userId: string) {
    return prisma.shopping.findMany({
      // Un producto dado de baja no debe seguir apareciendo en el carrito.
      where: { userId, product: { deletedAt: null } },
      include: {
        product: { select: { id: true, name: true, price: true, stock: true, description: true } },
      },
      orderBy: { addedAt: 'asc' },
    });
  },

  async addItem(userId: string, productId: string, quantity = 1) {
    // El carrito solo admite productos activos y con stock disponible: así el
    // checkout no falla al final por un producto agotado o dado de baja.
    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw notFound('El producto ya no está disponible.');

    const existing = await prisma.shopping.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > product.stock) {
      throw badRequest(
        `Solo hay ${product.stock} unidad(es) disponible(s) de "${product.name}".`
      );
    }

    if (existing) {
      return prisma.shopping.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity: existing.quantity + quantity },
        include: { product: PRODUCT_INCLUDE },
      });
    }

    return prisma.shopping.create({
      data: { userId, productId, quantity },
      include: { product: PRODUCT_INCLUDE },
    });
  },

  // Returns the updated item, or null if quantity <= 0 (the item is removed).
  async updateQuantity(userId: string, productId: string, quantity: number) {
    if (!quantity || quantity < 1) {
      await prisma.shopping.delete({
        where: { userId_productId: { userId, productId } },
      });
      return null;
    }

    // No se puede pedir más de lo que hay en bodega.
    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (product && quantity > product.stock) {
      throw badRequest(
        `Solo hay ${product.stock} unidad(es) disponible(s) de "${product.name}".`
      );
    }

    return prisma.shopping.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
      include: { product: PRODUCT_INCLUDE },
    });
  },

  async removeItem(userId: string, productId: string) {
    await prisma.shopping.delete({
      where: { userId_productId: { userId, productId } },
    });
    return null;
  },

  async clear(userId: string) {
    await prisma.shopping.deleteMany({ where: { userId } });
    return null;
  },
};