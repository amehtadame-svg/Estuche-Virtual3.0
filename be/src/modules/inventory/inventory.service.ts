import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

const QUANTITY_RULE_ALERT =
  'La cantidad de mercancía a ingresar debe ser un número entero mayor a cero';

export interface InboundInput {
  productId: string;
  quantity: number;
  unitCost?: number;
  supplierId?: string | null;
  invoiceNumber?: string | null;
  reason?: string | null;
}

export const inventoryService = {
  listMovements(type?: 'in' | 'out' | 'adjustment') {
    return prisma.inventoryMovement.findMany({
      where: type ? { type } : undefined,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            stock: true,
            cost: true,
            price: true,
            category: { select: { name: true } },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  },

  async registerInbound(data: InboundInput, userId?: string) {
    const qty = Number(data.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw badRequest(QUANTITY_RULE_ALERT);
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId, deletedAt: null },
      });

      if (!product) {
        throw notFound('Producto no encontrado en el catálogo activo.');
      }

      const updateData: Record<string, any> = {
        stock: { increment: qty },
      };

      if (data.unitCost !== undefined && Number(data.unitCost) > 0) {
        updateData.cost = Number(data.unitCost);
      }
      if (data.supplierId) {
        updateData.supplierId = data.supplierId;
      }

      // CA-002.2: Suma matemática y actualización atómica en base de datos
      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: updateData,
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      });

      // Construir detalle de auditoría con factura/lote, costo y motivo
      const parts: string[] = ['Ingreso de mercancía'];
      if (data.invoiceNumber?.trim()) parts.push(`Factura/Lote: ${data.invoiceNumber.trim()}`);
      if (data.unitCost && Number(data.unitCost) > 0) {
        parts.push(`Costo unit.: $${Number(data.unitCost).toLocaleString()}`);
      }
      if (data.reason?.trim()) parts.push(data.reason.trim());

      // CA-002.4: Auditoría de recepción en inventory_movements
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: 'in',
          quantity: qty,
          reason: parts.join(' · ').slice(0, 500),
          userId: userId ?? null,
        },
        include: {
          product: { select: { id: true, name: true, sku: true, stock: true } },
          user: { select: { id: true, fullName: true } },
        },
      });

      return {
        product: updatedProduct,
        movement,
        previousStock: product.stock,
        newStock: updatedProduct.stock,
      };
    });
  },
};