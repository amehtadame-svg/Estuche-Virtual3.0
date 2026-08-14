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
        code: data.code,
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
    const promo = await prisma.promotionalCode.findFirst({ where: { code: code.trim() } });
    if (!promo) throw notFound('Código inválido');
    if (!promo.active) throw badRequest('Este código ya no está activo');

    const now = new Date();
    if (promo.startDate && now < promo.startDate) throw badRequest('Este código aún no está disponible');
    if (promo.endDate && now > promo.endDate) throw badRequest('Este código ha expirado');
    if (promo.minPurchase && total !== undefined && total < Number(promo.minPurchase)) {
      throw badRequest(`Compra mínima de $${promo.minPurchase.toLocaleString()} requerida`);
    }
    if (promo.maxUses !== null && promo.currentUses !== null && promo.currentUses >= promo.maxUses) {
      throw badRequest('Este código alcanzó su límite de usos');
    }
    return promo;
  },

  // Aplica el código: incrementa el contador de usos y devuelve el id.
  async apply(code: string) {
    const promo = await prisma.promotionalCode.findFirst({ where: { code: code.trim() } });
    if (!promo) throw notFound('Código inválido');

    await prisma.promotionalCode.update({
      where: { id: promo.id },
      data: { currentUses: { increment: 1 } },
    });
    return { id: promo.id };
  },
};
