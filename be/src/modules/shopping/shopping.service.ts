import { atomic, requestLock } from '../employee/employee.domain';
import { badRequest } from '../../lib/errors';
import { prisma } from '../../lib/prisma';

const PRODUCT_INCLUDE = { select: { name: true, price: true } } as const;

export const shoppingService = {
  list(userId: string) {
    return prisma.shopping.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, name: true, price: true, stock: true, description: true, category: { select: { name: true } }, images: { orderBy: { sortOrder: 'asc' } } } },
      },
      orderBy: { addedAt: 'asc' },
    });
  },

  async addItem(userId: string, productId: string, quantity = 1) {
    return atomic(async tx => {
      await requestLock(tx, `cart:${userId}:${productId}`);
      const product = await tx.product.findUnique({ where: { id: productId, deletedAt: null } });
      if (!product) throw badRequest('Este producto ya no está disponible.');
      const current = await tx.shopping.findUnique({ where: { userId_productId: { userId, productId } } });
      if ((current?.quantity ?? 0) + quantity > Math.min(999, product.stock)) throw badRequest('No hay suficientes unidades disponibles para agregar esa cantidad.');
      return tx.shopping.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, quantity },
        update: { quantity: { increment: quantity } }, include: { product: PRODUCT_INCLUDE },
      });
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