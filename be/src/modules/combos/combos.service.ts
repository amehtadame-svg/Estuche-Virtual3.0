import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, conflict, notFound } from '../../lib/errors';

const MIN_ITEMS_ALERT =
  'Un combo o paquete promocional debe estar integrado por al menos dos productos del catálogo';
const PRICE_ALERT = 'El precio total del combo debe ser un monto numérico positivo mayor a cero';
const PRODUCTS_ALERT =
  'Uno o más productos del combo no existen o fueron eliminados del catálogo';

export interface CreateComboInput {
  name: string;
  description?: string | null;
  price: number;
  items: { productId: string; quantity: number }[];
}

export interface UpdateComboInput {
  name?: string;
  description?: string | null;
  price?: number;
  isActive?: boolean;
  items?: { productId: string; quantity: number }[];
}

// Si repiten un producto, se suman sus cantidades (3 + 2 cuadernos = 5)
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

// Un combo no tiene stock propio: se calcula con sus productos componentes.
// Ej.: 2 cuadernos + 1 lápiz, con 10 cuadernos y 3 lápices → alcanza para 3 combos.
const withAvailableStock = <T extends { items: { quantity: number; product: { stock: number } }[] }>(
  combo: T
) => ({
  ...combo,
  availableStock: combo.items.length
    ? Math.min(...combo.items.map((i) => Math.floor(i.product.stock / i.quantity)))
    : 0,
});

export const comboService = {
  async list() {
    const combos = await prisma.combo.findMany({
      where: { deletedAt: null },
      include: comboInclude,
      orderBy: { createdAt: 'desc' },
    });
    return combos.map(withAvailableStock);
  },

  async create(data: CreateComboInput, userId?: string) {
    const price = Number(data.price);

    // CA-012.3: precio válido
    if (!Number.isFinite(price) || price <= 0) throw badRequest(PRICE_ALERT);

    const merged = mergeItems(data.items ?? []);

    // CA-012.2: mínimo dos productos distintos
    if (merged.size < 2) throw badRequest(MIN_ITEMS_ALERT);

    // Todos los productos deben existir y no estar eliminados
    const ids = [...merged.keys()];
    const found = await prisma.product.count({ where: { id: { in: ids }, deletedAt: null } });
    if (found !== ids.length) throw badRequest(PRODUCTS_ALERT);

    // CA-012.4: SKU único generado por el sistema. Se cuentan también los combos
    // eliminados para no reutilizar nunca un SKU; si dos admins crean a la vez
    // y chocan (P2002), se reintenta con el siguiente número.
    const total = await prisma.combo.count();
    for (let attempt = 0; attempt < 5; attempt++) {
      const sku = `COMBO-${String(total + 1 + attempt).padStart(6, '0')}`;
      try {
        return await prisma.combo.create({
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
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
        throw err;
      }
    }
    throw conflict('No se pudo generar un SKU único para el combo. Intenta de nuevo.');
  },

  async update(id: string, data: UpdateComboInput) {
    const existing = await prisma.combo.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw notFound('Combo no encontrado.');

    if (data.price !== undefined) {
      const price = Number(data.price);
      if (!Number.isFinite(price) || price <= 0) throw badRequest(PRICE_ALERT);
    }
    if (data.name !== undefined && !data.name.trim()) {
      throw badRequest('El nombre del combo es obligatorio');
    }

    // Si mandan items, reemplazan por completo la composición anterior
    const merged = data.items !== undefined ? mergeItems(data.items) : null;
    if (merged) {
      if (merged.size < 2) throw badRequest(MIN_ITEMS_ALERT);
      const ids = [...merged.keys()];
      const found = await prisma.product.count({ where: { id: { in: ids }, deletedAt: null } });
      if (found !== ids.length) throw badRequest(PRODUCTS_ALERT);
    }

    return prisma.$transaction(async (tx) => {
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
          ...(data.price !== undefined ? { price: Number(data.price) } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        include: comboInclude,
      });
    });
  },

  // Borrado lógico, igual que en productos: se conserva el historial.
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