import { prisma } from '../../lib/prisma';
import { conflict, notFound } from '../../lib/errors';

const productSelect = { id: true, name: true, price: true, stock: true, deletedAt: true, category: { select: { name: true } }, images: { select: { url: true, isPrimary: true }, orderBy: { sortOrder: 'asc' as const } } } as const;

export const wishlistService = {
  list(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      select: { id: true, productId: true, addedAt: true, product: { select: productSelect } },
      orderBy: [{ addedAt: 'desc' }, { id: 'desc' }],
    });
  },
  async add(userId: string, productId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null }, select: { id: true } });
    if (!product) throw notFound('Este producto ya no está disponible.');
    try {
      return await prisma.wishlist.create({
        data: { userId, productId },
        select: { id: true, productId: true, addedAt: true, product: { select: productSelect } },
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw conflict('El producto ya se encuentra en tu lista de deseos.');
      throw error;
    }
  },
  async remove(userId: string, productId: string) {
    // Idempotente y restringido al propietario; no revela listas ajenas.
    await prisma.wishlist.deleteMany({ where: { userId, productId } });
  },
};
