import { Prisma } from '@prisma/client';
import { assertCoupon, normalizeCoupon, couponDiscount } from './promotional-code.domain';
import { shippingCost } from '../../lib/shipping';
import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

export const promotionalCodeService = {
  list() {
    return prisma.promotionalCode.findMany({ orderBy: { code: 'asc' } });
  },

  create(data: {
    code: string;
    description?: string;
    type: string;
    value: number;
    minPurchase?: number;
    startDate: Date;
    endDate: Date;
    maxUses?: number;
    active?: boolean;
  }) {
    return prisma.promotionalCode.create({
      data: {
        code: normalizeCoupon(data.code),
        description: data.description,
        type: data.type as any,
        value: data.value,
        minPurchase: data.minPurchase,
        startDate: data.startDate,
        endDate: data.endDate,
        maxUses: data.maxUses,
        active: data.active,
      },
    });
  },

  update(id: string, data: any) {
    return prisma.promotionalCode.update({ where: { id }, data });
  },

  async toggleActive(id: string) {
    const current = await prisma.promotionalCode.findUnique({ where: { id } });
    if (!current) throw notFound('Código promocional no encontrado');
    return prisma.promotionalCode.update({ where: { id }, data: { active: !current.active } });
  },

  async remove(id: string) {
    await prisma.promotionalCode.delete({ where: { id } });
    return null;
  },

  // Valida si un código puede usarse para un total dado (no consume usos).
  async validate(code: string, total?: number) {
    const promo = await prisma.promotionalCode.findFirst({ where: { code: { equals: normalizeCoupon(code), mode: 'insensitive' } } });
    assertCoupon(promo, total);
    return promo;
  },

  async quote(code: string, items: { productId: string; quantity: number }[], actor: { id: string; role: string }) {
    if (!['client', 'admin', 'superadmin'].includes(actor.role)) throw badRequest('Tu cuenta no puede aplicar cupones a compras.');
    const products = await prisma.product.findMany({ where: { id: { in: items.map(item => item.productId) }, deletedAt: null }, select: { id: true, price: true, stock: true } });
    let amount = new Prisma.Decimal(0);
    for (const item of items) {
      const product = products.find(product => product.id === item.productId);
      if (!product || Number(product.price) <= 0 || product.stock < item.quantity) throw badRequest('Actualiza tu carrito: un producto ya no está disponible en esa cantidad.');
      amount = amount.plus(new Prisma.Decimal(product.price).mul(item.quantity));
    }
    const subtotal = amount.toNumber();
    const promo = await promotionalCodeService.validate(code, subtotal);
    const discountAmount = couponDiscount(amount, promo).toNumber();
    const delivery = shippingCost(subtotal);
    return { code: promo.code, type: promo.type, value: Number(promo.value), subtotal, discountAmount, shippingCost: delivery, total: amount.minus(discountAmount).plus(delivery).toDecimalPlaces(2).toNumber() };
  },

  // Compatibilidad: validar no consume usos. Solo el checkout transaccional los consume.
  async apply(code: string) {
    const promo = await promotionalCodeService.validate(code);
    return { id: promo.id };
  },
};
