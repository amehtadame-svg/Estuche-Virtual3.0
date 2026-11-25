import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, conflict, notFound } from '../../lib/errors';

const MIN_ITEMS_ALERT =
  'Un combo o paquete promocional debe estar integrado por al menos dos productos del catálogo';
const PRICE_ALERT = 'El precio total del combo debe ser un monto numérico positivo mayor a cero';
const DISCOUNT_ALERT =
  'El descuento aplicado no puede ser negativo ni igualar o superar el valor total de los productos';
const PRODUCTS_ALERT =
  'Uno o más productos del combo no existen o fueron eliminados del catálogo';

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface CreateComboInput {
  name: string;
  description?: string | null;
  price?: number;
  discountPercent?: number;
  discountAmount?: number;
  items: { productId: string; quantity: number }[];
}

export interface UpdateComboInput {
  name?: string;
  description?: string | null;
  price?: number;
  discountPercent?: number;
  discountAmount?: number;
  isActive?: boolean;
  items?: { productId: string; quantity: number }[];
}

const mergeItems = (items: { productId: string; quantity: number }[]) => {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  return merged;
};

const comboInclude = {
  items: {
    include: { product: { select: { id: true, name: true, sku: true, price: true, stock: true } } },
  },
} satisfies Prisma.ComboInclude;

const enrichCombo = <
  T extends {
    price: Prisma.Decimal | number | string;
    items: { quantity: number; product: { stock: number; price: Prisma.Decimal | number | string } }[];
  },
>(
  combo: T
) => {
  const availableStock = combo.items.length
    ? Math.min(...combo.items.map((i) => Math.floor(i.product.stock / i.quantity)))
    : 0;
  const regularPrice = round2(
    combo.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)
  );
  const comboPrice = round2(Number(combo.price));
  const discountAmount = round2(Math.max(0, regularPrice - comboPrice));
  const discountPercent =
    regularPrice > 0 && discountAmount > 0
      ? Number(((discountAmount / regularPrice) * 100).toFixed(1))
      : 0;

  return {
    ...combo,
    availableStock,
    regularPrice,
    discountAmount,
    discountPercent,
  };
};

const resolveComboPrice = (
  regularPrice: number,
  input: { price?: number; discountAmount?: number; discountPercent?: number }
): number => {
  if (input.discountAmount !== undefined) {
    const amt = Number(input.discountAmount);
    if (!Number.isFinite(amt) || amt < 0 || (regularPrice > 0 && amt >= regularPrice)) {
      throw badRequest(DISCOUNT_ALERT);
    }
    if (input.price === undefined) {
      return round2(regularPrice - amt);
    }
  }

  if (input.discountPercent !== undefined) {
    const pct = Number(input.discountPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct >= 100) {
      throw badRequest(DISCOUNT_ALERT);
    }
    if (input.price === undefined) {
      const amt = Math.round(regularPrice * (pct / 100));
      return round2(regularPrice - amt);
    }
  }

  if (input.price !== undefined) {
    return round2(Number(input.price));
  }

  return round2(regularPrice);
};

export const comboService = {
  async list() {
    const combos = await prisma.combo.findMany({
      where: { deletedAt: null },
      include: comboInclude,
      orderBy: { createdAt: 'desc' },
    });
    return combos.map(enrichCombo);
  },

  async create(data: CreateComboInput, userId?: string) {
    if (data.price !== undefined) {
      const explicitPrice = Number(data.price);
      if (!Number.isFinite(explicitPrice) || explicitPrice <= 0) throw badRequest(PRICE_ALERT);
    }

    const merged = mergeItems(data.items ?? []);
    if (merged.size < 2) throw badRequest(MIN_ITEMS_ALERT);

    const ids = [...merged.keys()];
    const catalogProducts = await prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, price: true },
    });
    if (catalogProducts.length !== ids.length) throw badRequest(PRODUCTS_ALERT);

    const priceMap = new Map(catalogProducts.map((p) => [p.id, Number(p.price)]));
    const regularPrice = round2(
      ids.reduce((sum, id) => sum + (priceMap.get(id) ?? 0) * (merged.get(id) ?? 0), 0)
    );

    const price = resolveComboPrice(regularPrice, data);
    if (!Number.isFinite(price) || price <= 0) throw badRequest(PRICE_ALERT);

    const total = await prisma.combo.count();
    for (let attempt = 0; attempt < 5; attempt++) {
      const sku = `COMBO-${String(total + 1 + attempt).padStart(6, '0')}`;
      try {
        const created = await prisma.combo.create({
          data: {
            sku,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            price,
            isActive: true,
            createdBy: userId ?? null,
            items: {
              create: ids.map((productId) => ({ productId, quantity: merged.get(productId)! })),
            },
          },
          include: comboInclude,
        });
        return enrichCombo(created);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
        throw err;
      }
    }
    throw conflict('No se pudo generar un SKU único para el combo. Intenta de nuevo.');
  },

  async update(id: string, data: UpdateComboInput) {
    const existing = await prisma.combo.findFirst({
      where: { id, deletedAt: null },
      include: comboInclude,
    });
    if (!existing) throw notFound('Combo no encontrado.');

    if (data.price !== undefined) {
      const explicitPrice = Number(data.price);
      if (!Number.isFinite(explicitPrice) || explicitPrice <= 0) throw badRequest(PRICE_ALERT);
    }
    if (data.name !== undefined && !data.name.trim()) {
      throw badRequest('El nombre del combo es obligatorio');
    }

    const merged = data.items !== undefined ? mergeItems(data.items) : null;
    let regularPrice = round2(
      existing.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)
    );

    if (merged) {
      if (merged.size < 2) throw badRequest(MIN_ITEMS_ALERT);
      const ids = [...merged.keys()];
      const catalogProducts = await prisma.product.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: { id: true, price: true },
      });
      if (catalogProducts.length !== ids.length) throw badRequest(PRODUCTS_ALERT);
      const priceMap = new Map(catalogProducts.map((p) => [p.id, Number(p.price)]));
      regularPrice = round2(
        ids.reduce((sum, pid) => sum + (priceMap.get(pid) ?? 0) * (merged.get(pid) ?? 0), 0)
      );
    }

    const hasPricingPatch =
      data.price !== undefined ||
      data.discountAmount !== undefined ||
      data.discountPercent !== undefined;

    const nextPrice = hasPricingPatch ? resolveComboPrice(regularPrice, data) : undefined;
    if (nextPrice !== undefined && (!Number.isFinite(nextPrice) || nextPrice <= 0)) {
      throw badRequest(PRICE_ALERT);
    }

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (merged) {
        await tx.comboItem.deleteMany({ where: { comboId: id } });
        await tx.comboItem.createMany({
          data: [...merged].map(([productId, quantity]) => ({ comboId: id, productId, quantity })),
        });
      }
      return tx.combo.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
          ...(nextPrice !== undefined ? { price: nextPrice } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        include: comboInclude,
      });
    });

    return enrichCombo(updated);
  },

  async remove(id: string) {
    const existing = await prisma.combo.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw notFound('Combo no encontrado.');

    await prisma.combo.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return null;
  },
};