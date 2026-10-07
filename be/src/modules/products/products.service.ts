import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

/** Usuario que ejecuta la operación (para auditoría de precio e inventario). */
export interface Actor {
  id: string | null;
}

export interface ProductStockAdjustment {
  /** Unidades a sumar (+) o restar (-) del stock actual. */
  delta: number;
  reason?: string;
}

const decimalToNumber = (value: unknown): number => Number(value ?? 0);

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
  supplier: { select: { id: true, name: true } },
  images: { orderBy: { sortOrder: 'asc' } },
} as const;

export const productService = {
  // C-05: los productos eliminados (deletedAt) no aparecen en el catálogo.
  list() {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw notFound('Producto no encontrado.');
    return product;
  },

  async create(
    data: {
      name: string;
      description?: string;
      price: number;
      categoryId?: string | null;
      supplierId?: string | null;
      stock?: number;
      stockMin?: number;
      imageUrl?: string;
    },
    actor?: Actor
  ) {
    const stock = data.stock ?? 0;

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          // Solo se escribe la relación si el cliente la envía. Nunca se
          // fuerza a null: eso borraba la categoría/proveedor en cada guardado.
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
          ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
          stock,
          stockMin: data.stockMin ?? 5,
        },
        include: PRODUCT_INCLUDE,
      });

      if (data.imageUrl) {
        await tx.productImage.create({
          data: { productId: product.id, url: data.imageUrl, isPrimary: true, sortOrder: 1 },
        });
      }

      // RF-016: todo ingreso inicial de mercancía queda registrado.
      if (stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: 'in',
            quantity: stock,
            reason: 'Stock inicial del producto',
            userId: actor?.id ?? null,
          },
        });
      }

      // RF-017: historial de precios.
      await tx.priceHistory.create({
        data: {
          productId: product.id,
          previousPrice: data.price,
          newPrice: data.price,
          userId: actor?.id ?? null,
        },
      });

      return product;
    });
  },

  /**
   * Actualización PARCIAL.
   *
   * Antes este método escribía `categoryId: data.categoryId ?? null`, de modo
   * que cualquier guardado del panel (que no envía la relación) borraba la
   * categoría y el proveedor del producto. Ahora solo se tocan los campos que
   * llegan en el cuerpo de la petición.
   */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      categoryId?: string | null;
      supplierId?: string | null;
      stock?: number;
      stockMin?: number;
      imageUrl?: string;
    },
    actor?: Actor
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.product.findFirst({ where: { id, deletedAt: null } });
      if (!current) throw notFound('Producto no encontrado.');

      const nextPrice = data.price !== undefined ? data.price : decimalToNumber(current.price);
      const nextStock = data.stock !== undefined ? data.stock : current.stock;

      if (nextStock < 0) throw badRequest('El stock no puede ser negativo.');

      const product = await tx.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
          ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
          ...(data.stock !== undefined ? { stock: data.stock } : {}),
          ...(data.stockMin !== undefined ? { stockMin: data.stockMin } : {}),
        },
        include: PRODUCT_INCLUDE,
      });

      // RF-017: si el precio cambió, se guarda el historial.
      if (data.price !== undefined && decimalToNumber(current.price) !== nextPrice) {
        await tx.priceHistory.create({
          data: {
            productId: id,
            previousPrice: decimalToNumber(current.price),
            newPrice: nextPrice,
            userId: actor?.id ?? null,
          },
        });
      }

      // RF-016: si el stock cambió, se registra el movimiento de inventario.
      if (data.stock !== undefined && current.stock !== nextStock) {
        await tx.inventoryMovement.create({
          data: {
            productId: id,
            type: 'adjustment',
            quantity: Math.abs(nextStock - current.stock),
            reason:
              nextStock > current.stock
                ? `Ajuste manual de inventario: ${current.stock} → ${nextStock}`
                : `Ajuste manual de inventario: ${current.stock} → ${nextStock}`,
            userId: actor?.id ?? null,
          },
        });
      }

      // Si mandan una nueva URL, reemplaza la imagen principal (upsert simple).
      if (data.imageUrl) {
        const primary = await tx.productImage.findFirst({
          where: { productId: id, isPrimary: true },
        });
        if (primary) {
          await tx.productImage.update({ where: { id: primary.id }, data: { url: data.imageUrl } });
        } else {
          await tx.productImage.create({
            data: { productId: id, url: data.imageUrl, isPrimary: true, sortOrder: 1 },
          });
        }
      }

      return product;
    });
  },

  /**
   * Entrada / salida de mercancía (HU-002, HU-003, RF-016).
   * Actualiza el stock y deja el movimiento registrado en la misma transacción,
   * de modo que el inventario y su kardex nunca quedan desincronizados.
   */
  async adjustStock(id: string, { delta, reason }: ProductStockAdjustment, actor?: Actor) {
    if (!Number.isInteger(delta) || delta === 0) {
      throw badRequest('La cantidad a ajustar debe ser un entero distinto de cero.');
    }

    return prisma.$transaction(async (tx) => {
      const current = await tx.product.findFirst({ where: { id, deletedAt: null } });
      if (!current) throw notFound('Producto no encontrado.');

      const nextStock = current.stock + delta;
      if (nextStock < 0) {
        throw badRequest(
          `No hay stock suficiente para retirar ${Math.abs(delta)} unidad(es). Disponible: ${current.stock}.`
        );
      }

      const product = await tx.product.update({
        where: { id },
        data: { stock: nextStock },
        include: PRODUCT_INCLUDE,
      });

      await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: delta > 0 ? 'in' : 'out',
          quantity: Math.abs(delta),
          reason: reason?.trim() || (delta > 0 ? 'Entrada de mercancía' : 'Salida de mercancía'),
          userId: actor?.id ?? null,
        },
      });

      return product;
    });
  },

  // C-05: borrado lógico. Se marca deletedAt en lugar de destruir el producto
  // y su historial (inventoryMovements, priceHistory, orderDetails, recibos).
  // El historial contable y de ventas se conserva intacto.
  async remove(id: string) {
    const current = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!current) throw notFound('Producto no encontrado.');
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return null;
  },
};
