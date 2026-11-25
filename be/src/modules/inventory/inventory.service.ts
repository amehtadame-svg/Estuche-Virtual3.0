import { prisma } from '../../lib/prisma';
import {
  badRequest,
  notFound,
} from '../../lib/errors';

const QUANTITY_RULE_ALERT =
  'La cantidad de mercancía a ingresar debe ser un número entero mayor a cero';

const OUTBOUND_QUANTITY_RULE_ALERT =
  'La cantidad a retirar debe ser un número entero mayor a cero';

const REASON_RULE_ALERT =
  'La justificación del retiro es obligatoria';

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
  listMovements(
    type?: 'in' | 'out' | 'adjustment'
  ) {
    return prisma.inventoryMovement.findMany({
      where: type
        ? {
            type,
          }
        : undefined,
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
            category: {
              select: {
                name: true,
              },
            },
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
      orderBy: {
        date: 'desc',
      },
    });
  },

  async registerInbound(
    data: InboundInput,
    userId?: string
  ) {
    const qty = Number(
      data.quantity
    );

    if (
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      throw badRequest(
        QUANTITY_RULE_ALERT
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const product =
          await tx.product.findUnique({
            where: {
              id: data.productId,
              deletedAt: null,
            },
          });

        if (!product) {
          throw notFound(
            'Producto no encontrado en el catálogo activo.'
          );
        }

        const updateData:
          Record<string, any> = {
            stock: {
              increment: qty,
            },
          };

        if (
          data.unitCost !== undefined &&
          Number(data.unitCost) > 0
        ) {
          updateData.cost = Number(
            data.unitCost
          );
        }

        if (data.supplierId) {
          updateData.supplierId =
            data.supplierId;
        }

        const updatedProduct =
          await tx.product.update({
            where: {
              id: data.productId,
            },
            data: updateData,
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              supplier: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

        const parts: string[] = [
          'Ingreso de mercancía',
        ];

        if (
          data.invoiceNumber?.trim()
        ) {
          parts.push(
            `Factura/Lote: ${data.invoiceNumber.trim()}`
          );
        }

        if (
          data.unitCost &&
          Number(data.unitCost) > 0
        ) {
          parts.push(
            `Costo unit.: $${Number(
              data.unitCost
            ).toLocaleString()}`
          );
        }

        if (data.reason?.trim()) {
          parts.push(
            data.reason.trim()
          );
        }

        const movement =
          await tx.inventoryMovement.create({
            data: {
              productId: data.productId,
              type: 'in',
              quantity: qty,
              reason: parts
                .join(' · ')
                .slice(0, 500),
              userId: userId ?? null,
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  stock: true,
                },
              },
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          });

        return {
          product: updatedProduct,
          movement,
          previousStock:
            product.stock,
          newStock:
            updatedProduct.stock,
        };
      }
    );
  },

  async registerOutbound(
    data: OutboundInput,
    userId?: string
  ) {
    const qty = Number(
      data.quantity
    );

    if (
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      throw badRequest(
        OUTBOUND_QUANTITY_RULE_ALERT
      );
    }

    const reasonType =
      typeof data.reasonType === 'string'
        ? data.reasonType.trim()
        : '';

    const reasonDetail =
      typeof data.reason === 'string'
        ? data.reason.trim()
        : '';

    if (!reasonType) {
      throw badRequest(
        REASON_RULE_ALERT
      );
    }

    if (reasonDetail.length < 3) {
      throw badRequest(
        REASON_RULE_ALERT
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const product =
          await tx.product.findUnique({
            where: {
              id: data.productId,
              deletedAt: null,
            },
          });

        if (!product) {
          throw notFound(
            'Producto no encontrado en el catálogo activo.'
          );
        }

        if (product.stock < qty) {
          throw badRequest(
            `No se puede procesar la salida: La cantidad solicitada excede el stock actual disponible en el almacén (Disponible: ${product.stock} unidades)`,
            {
              available: product.stock,
              requested: qty,
            }
          );
        }

        const changed =
          await tx.product.updateMany({
            where: {
              id: data.productId,
              deletedAt: null,
              stock: {
                gte: qty,
              },
            },
            data: {
              stock: {
                decrement: qty,
              },
            },
          });

        if (!changed.count) {
          throw badRequest(
            'La cantidad solicitada excede el stock actual disponible en el almacén.'
          );
        }

        const updatedProduct =
          await tx.product.findUniqueOrThrow({
            where: {
              id: data.productId,
            },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              supplier: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

        const auditDetail =
          `Salida manual · Motivo: ${reasonType} · ${reasonDetail}`;

        const movement =
          await tx.inventoryMovement.create({
            data: {
              productId: data.productId,
              type: 'out',
              quantity: qty,
              reason: auditDetail.slice(
                0,
                500
              ),
              userId: userId ?? null,
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  stock: true,
                },
              },
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          });

        return {
          product: updatedProduct,
          movement,
          previousStock:
            product.stock,
          newStock:
            updatedProduct.stock,
        };
      }
    );
  },
};