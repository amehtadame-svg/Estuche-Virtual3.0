import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../lib/errors';

interface Requester {
  id: string;
  role: string;
}

const ADMIN_ROLES = ['admin', 'superadmin'];
const isAdmin = (r: Requester | undefined) => !!r && ADMIN_ROLES.includes(r.role);

const LIST_INCLUDE = {
  customer: { select: { fullName: true } },
  driver: { select: { fullName: true } },
  deliveryAddress: { select: { address: true, city: true } },
  promotionalCode: { select: { code: true, value: true } },
} as const;

export const orderService = {
  list() {
    // C-05: los pedidos eliminados lógicamente no aparecen en las listas.
    return prisma.order.findMany({
      where: { deletedAt: null },
      include: LIST_INCLUDE,
      orderBy: { orderDate: 'desc' },
    });
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { fullName: true } },
        deliveryAddress: { select: { address: true, city: true } },
      },
    });
    if (!order) throw notFound('Pedido no encontrado.');
    return order;
  },

  async create(
    data: {
      deliveryAddressId?: string;
      promotionalCodeId?: string;
      status?: string;
      details?: { productId: string; quantity: number }[];
    },
    requester: Requester
  ) {
    const { deliveryAddressId, promotionalCodeId, status, details } = data;
    const customerId = requester.id;

    return prisma.$transaction(async (tx) => {
      // C-02: precios y totales los calcula el servidor desde product.price.
      // Lo que envíe el cliente (total, unitPrice) se ignora por completo.
      const items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }[] = [];
      let total = 0;

      if (Array.isArray(details) && details.length > 0) {
        for (const item of details) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw badRequest(`Producto ${item.productId} no encontrado.`);
          if (product.stock < item.quantity) {
            throw badRequest(
              `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}.`
            );
          }
          const unitPrice = Number(product.price);
          const subtotal = unitPrice * item.quantity;
          items.push({ productId: item.productId, quantity: item.quantity, unitPrice, subtotal });
          total += subtotal;
        }
      }

      let finalCodeId = promotionalCodeId ?? null;

      if (promotionalCodeId) {
        const code = await tx.promotionalCode.findUnique({ where: { id: promotionalCodeId } });
        if (!code || !code.active) throw badRequest('El código promocional no está activo.');
        if (code.type === 'percentage') {
          total = total * (1 - Number(code.value) / 100);
        } else if (code.type === 'fixed') {
          total = Math.max(0, total - Number(code.value));
        }
        await tx.promotionalCode.update({
          where: { id: promotionalCodeId },
          data: { currentUses: { increment: 1 } },
        });
        finalCodeId = promotionalCodeId;
      }

      total = Math.round(total * 100) / 100;

      const newOrder = await tx.order.create({
        data: {
          customerId,
          deliveryAddressId: deliveryAddressId ?? null,
          promotionalCodeId: finalCodeId,
          total,
          status: (status ?? 'pending') as any,
        },
      });

      if (items.length > 0) {
        for (const item of items) {
          // C-03 / RN-003 (RF-008): el inventario se descuenta al confirmar el
          // pedido. updateMany con condición de stock es atómico: si dos pedidos
          // compiten por las últimas unidades, solo uno gana (la validación
          // previa solo sirve para dar un mensaje claro al usuario).
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw badRequest(
              `Stock insuficiente para el producto ${item.productId}.`
            );
          }

          // C-03 / RF-016: registrar el movimiento de inventario de la venta.
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'out',
              quantity: item.quantity,
              reason: `Venta - pedido ${newOrder.id}`,
              userId: customerId,
            },
          });
        }

        await tx.orderDetail.createMany({
          data: items.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        });
      }

      return newOrder;
    });
  },

  update(id: string, data: any) {
    const { status, ...rest } = data;
    return prisma.order.update({
      where: { id, deletedAt: null },
      data: { ...rest, status: status as any },
    });
  },

  // C-05: borrado lógico. Se marca deletedAt en lugar de destruir el pedido y
  // su historial (detalles, envíos, recibo). El historial contable se conserva.
  async remove(id: string) {
    await prisma.order.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return null;
  },

  async applyPromotionalCode(id: string, code: string, requester: Requester) {
    const order = await prisma.order.findUnique({ where: { id, deletedAt: null } });
    if (!order) throw notFound('Pedido no encontrado.');

    const isOwner = order.customerId === requester?.id;
    if (!isOwner && !isAdmin(requester)) throw forbidden('No puedes modificar este pedido.');

    const promo = await prisma.promotionalCode.findFirst({ where: { code: String(code).trim() } });
    if (!promo) throw notFound('Código promocional no encontrado.');

    await prisma.promotionalCode.update({
      where: { id: promo.id },
      data: { currentUses: { increment: 1 } },
    });
    await prisma.order.update({ where: { id }, data: { promotionalCodeId: promo.id } });

    return prisma.order.findUnique({
      where: { id },
      include: { promotionalCode: { select: { code: true, value: true, type: true } } },
    });
  },
};
