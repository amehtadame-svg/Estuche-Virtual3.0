import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

const QUANTITY_RULE_ALERT =
  'La cantidad de mercancía a ingresar debe ser un número entero mayor a cero';

const OUTBOUND_QUANTITY_RULE_ALERT =
  'La cantidad a retirar debe ser un número entero mayor a cero';

const REASON_RULE_ALERT = 'La justificación del retiro es obligatoria';

export interface InboundInput {
  productId: string;
  quantity: number;
  unitCost?: number;
  supplierId?: string | null;
  invoiceNumber?: string | null;
  reason?: string | null;
}

export interface OutboundInput {
  productId: string;
  quantity: number;
  reasonType: string;
  reason: string;
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

  /**
   * HU-003 · Registro de salida manual de productos.
   *
   * CA-003.1: exige motivo del egreso y justificación.
   * CA-003.2: descuenta el stock en la misma transacción (atómico).
   * CA-003.3: bloquea la salida si la cantidad excede el stock disponible.
   * CA-003.4: devuelve el resumen que la UI muestra en el modal de confirmación.
   */
  async registerOutbound(data: OutboundInput, userId?: string) {
    const qty = Number(data.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw badRequest(OUTBOUND_QUANTITY_RULE_ALERT);
    }

    const reasonType = typeof data.reasonType === 'string' ? data.reasonType.trim() : '';
    const reasonDetail = typeof data.reason === 'string' ? data.reason.trim() : '';

    if (!reasonType) {
      throw badRequest(REASON_RULE_ALERT);
    }
    if (reasonDetail.length < 3) {
      throw badRequest(REASON_RULE_ALERT);
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId, deletedAt: null },
      });

      if (!product) {
        throw notFound('Producto no encontrado en el catálogo activo.');
      }

      // CA-003.3: bloqueo de egreso por existencias insuficientes
      if (product.stock < qty) {
        throw badRequest(
          `No se puede procesar la salida: La cantidad solicitada excede el stock actual disponible en el almacén (Disponible: ${product.stock} unidades)`,
          { available: product.stock, requested: qty }
        );
      }

      // CA-003.2: descuento atómico del stock
      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: { stock: { decrement: qty } },
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      });

      // Auditoría del egreso en inventory_movements (type: 'out')
      const auditDetail = `Salida manual · Motivo: ${reasonType} · ${reasonDetail}`;

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: 'out',
          quantity: qty,
          reason: auditDetail.slice(0, 500),
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