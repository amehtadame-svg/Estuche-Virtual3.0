import { prisma } from '../../lib/prisma';

const PRODUCT_INCLUDE = { select: { name: true, price: true } } as const;

export const shoppingService = {
  list(userId: string) {
    return prisma.shopping.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, name: true, price: true, stock: true, description: true } },
      },
      orderBy: { addedAt: 'asc' },
    });
  },

  async addItem(userId: string, productId: string, quantity = 1) {
    const existing = await prisma.shopping.findUnique({
      where: { userId_productId: { userId, productId } },
    });

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