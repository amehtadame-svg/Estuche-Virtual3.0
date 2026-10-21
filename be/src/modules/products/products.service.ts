import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

const NUMERIC_RULE_ALERT =
  'El precio de venta y el costo de adquisición deben ser valores numéricos estrictamente mayores a cero, y el stock inicial no puede contener cifras negativas';

const DUPLICATE_RULE_ALERT =
  'No se puede completar el registro: Ya existe un producto almacenado con el mismo código SKU o nombre comercial dentro del sistema';

export interface CreateProductInput {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  cost?: number;
  price: number;
  categoryId?: string | null;
  supplierId?: string | null;
  stock?: number;
  stockMin?: number;
  imageUrl?: string;
}

export const productService = {
  // C-05: los productos eliminados (deletedAt) no aparecen en el catálogo.
  list() {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: CreateProductInput, userId?: string) {
    const cleanName = data.name?.trim();
    const cleanSku = data.sku?.trim() || null;
    const cleanBarcode = data.barcode?.trim() || null;
    const price = Number(data.price);
    const cost = data.cost !== undefined ? Number(data.cost) : undefined;
    const stock = data.stock !== undefined ? Number(data.stock) : 0;
    const stockMin = data.stockMin !== undefined ? Number(data.stockMin) : 5;

    // CA-001.2 — Validación estricta de reglas de negocio y restricciones numéricas
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      (cost !== undefined && (!Number.isFinite(cost) || cost <= 0)) ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      throw badRequest(NUMERIC_RULE_ALERT);
    }

    // CA-001.3 — Control de duplicidad por código de barras, SKU y nombre comercial
    const orConditions: any[] = [{ name: { equals: cleanName, mode: 'insensitive' } }];
    if (cleanSku) orConditions.push({ sku: { equals: cleanSku, mode: 'insensitive' } });
    if (cleanBarcode) orConditions.push({ barcode: { equals: cleanBarcode, mode: 'insensitive' } });

    if (typeof prisma.product.findFirst === 'function') {
      const duplicate = await prisma.product.findFirst({
        where: {
          deletedAt: null,
          OR: orConditions,
        },
      });
      if (duplicate) {
        throw badRequest(DUPLICATE_RULE_ALERT);
      }
    }

    const product = await prisma.product.create({
      data: {
        name: cleanName,
        sku: cleanSku,
        barcode: cleanBarcode,
        description: data.description ?? null,
        cost: cost ?? 0,
        price,
        categoryId: data.categoryId || null,
        supplierId: data.supplierId || null,
        stock,
        stockMin,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    if (data.imageUrl && data.imageUrl.trim() !== '') {
      await prisma.productImage.create({
        data: { productId: product.id, url: data.imageUrl.trim(), isPrimary: true, sortOrder: 1 },
      });
    }

    if (stock > 0 && prisma.inventoryMovement && typeof prisma.inventoryMovement.create === 'function') {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'in',
          quantity: stock,
          reason: 'Stock inicial de registro de producto (HU-001)',
          userId: userId ?? null,
        },
      });
    }

    return product;
  },

  async update(
    id: string,
    data: Partial<CreateProductInput>,
    userId?: string
  ) {
    if (
      (data.price !== undefined && Number(data.price) <= 0) ||
      (data.cost !== undefined && Number(data.cost) <= 0) ||
      (data.stock !== undefined && Number(data.stock) < 0)
    ) {
      throw badRequest(NUMERIC_RULE_ALERT);
    }

    const cleanName = data.name?.trim();
    const cleanSku = data.sku !== undefined ? data.sku?.trim() || null : undefined;
    const cleanBarcode = data.barcode !== undefined ? data.barcode?.trim() || null : undefined;

    if (typeof prisma.product.findFirst === 'function') {
      const orConditions: any[] = [];
      if (cleanName) orConditions.push({ name: { equals: cleanName, mode: 'insensitive' } });
      if (cleanSku) orConditions.push({ sku: { equals: cleanSku, mode: 'insensitive' } });
      if (cleanBarcode) orConditions.push({ barcode: { equals: cleanBarcode, mode: 'insensitive' } });

      if (orConditions.length > 0) {
        const duplicate = await prisma.product.findFirst({
          where: {
            id: { not: id },
            deletedAt: null,
            OR: orConditions,
          },
        });
        if (duplicate) {
          throw badRequest(DUPLICATE_RULE_ALERT);
        }
      }
    }

    const existing =
      typeof prisma.product.findUnique === 'function'
        ? await prisma.product.findUnique({ where: { id, deletedAt: null } })
        : null;

    const product = await prisma.product.update({
      where: { id, deletedAt: null },
      data: {
        ...(cleanName !== undefined ? { name: cleanName } : {}),
        ...(cleanSku !== undefined ? { sku: cleanSku } : {}),
        ...(cleanBarcode !== undefined ? { barcode: cleanBarcode } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.cost !== undefined ? { cost: Number(data.cost) } : {}),
        ...(data.price !== undefined ? { price: Number(data.price) } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
        ...(data.supplierId !== undefined ? { supplierId: data.supplierId || null } : {}),
        ...(data.stock !== undefined ? { stock: Number(data.stock) } : {}),
        ...(data.stockMin !== undefined ? { stockMin: Number(data.stockMin) } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    // Si cambió el precio, registrar en PriceHistory (prepara HU-016 y HU-029)
    if (
      existing &&
      data.price !== undefined &&
      Number(existing.price) !== Number(data.price) &&
      prisma.priceHistory &&
      typeof prisma.priceHistory.create === 'function'
    ) {
      await prisma.priceHistory.create({
        data: {
          productId: id,
          previousPrice: existing.price,
          newPrice: Number(data.price),
          userId: userId ?? null,
        },
      });
    }

    // Si mandan una nueva URL, reemplaza la imagen principal (upsert simple).
    if (data.imageUrl && data.imageUrl.trim() !== '') {
      const primary = await prisma.productImage.findFirst({
        where: { productId: id, isPrimary: true },
      });
      if (primary) {
        await prisma.productImage.update({
          where: { id: primary.id },
          data: { url: data.imageUrl.trim() },
        });
      } else {
        await prisma.productImage.create({
          data: { productId: id, url: data.imageUrl.trim(), isPrimary: true, sortOrder: 1 },
        });
      }
    }

    return product;
  },

  // C-05: borrado lógico. Se marca deletedAt en lugar de destruir el producto
  // y su historial (inventoryMovements, priceHistory, orderDetails, recibos).
  // El historial contable y de ventas se conserva intacto.
  async remove(id: string) {
    const existing =
      typeof prisma.product.findUnique === 'function'
        ? await prisma.product.findUnique({ where: { id, deletedAt: null } })
        : { id };
    if (!existing) throw notFound('Producto no encontrado.');

    await prisma.product.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return null;
  },
};