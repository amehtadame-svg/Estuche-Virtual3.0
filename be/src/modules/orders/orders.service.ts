import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../lib/errors';

interface Requester {
  id: string;
  role: string;
}

const ADMIN_ROLES = ['admin', 'superadmin'];
const isAdmin = (r: Requester | undefined) => !!r && ADMIN_ROLES.includes(r.role);

/** Estados que ya descontaron (y mantienen descontado) el inventario. */
const LIVE_STATUSES = ['pending', 'paid', 'preparing', 'shipped', 'delivered'];
/** Estados que devuelven la mercancía al inventario. */
const RESTOCK_STATUSES = ['canceled', 'returned'];

const LIST_INCLUDE = {
  customer: { select: { fullName: true } },
  driver: { select: { fullName: true } },
  deliveryAddress: { select: { address: true, city: true } },
  promotionalCode: { select: { code: true, value: true } },
} as const;

const DETAILS_INCLUDE = {
  details: { include: { product: { select: { id: true, name: true } } } },
} as const;

export const orderService = {
  /**
   * C-05 / RF-011: un cliente solo ve sus propios pedidos; el personal
   * (admin, superadmin, empleado, domiciliario) ve todos.
   */
  list(requester?: Requester) {
    return prisma.order.findMany({
      where: {
        deletedAt: null,
        ...(!isAdmin(requester) && requester ? { customerId: requester.id } : {}),
      },
      include: LIST_INCLUDE,
      orderBy: { orderDate: 'desc' },
    });
  },

  /** Pedidos del usuario autenticado (atajo para el panel del cliente). */
  listMine(customerId: string) {
    return prisma.order.findMany({
      where: { deletedAt: null, customerId },
      include: LIST_INCLUDE,
      orderBy: { orderDate: 'desc' },
    });
  },

  async getById(id: string, requester?: Requester) {
    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...LIST_INCLUDE,
        ...DETAILS_INCLUDE,
      },
    });
    if (!order) throw notFound('Pedido no encontrado.');
    if (!isAdmin(requester) && order.customerId !== requester?.id) {
      throw forbidden('No puedes consultar este pedido.');
    }
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
          const product = await tx.product.findFirst({
            where: { id: item.productId, deletedAt: null },
          });
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
            throw badRequest(`Stock insuficiente para el producto ${item.productId}.`);
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

  /**
   * Cambio de estado / edición de un pedido.
   *
   * Se controla quién puede hacerlo y, sobre todo, se mantiene el inventario
   * coherente: cancelar o devolver un pedido devuelve las unidades al stock y
   * lo deja registrado en el kardex (antes el stock se perdía para siempre).
   */
  async update(
    id: string,
    data: {
      status?: string;
      driverId?: string | null;
      deliveryAddressId?: string | null;
      promotionalCodeId?: string | null;
    },
    requester?: Requester
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, deletedAt: null },
        include: { details: true },
      });
      if (!order) throw notFound('Pedido no encontrado.');

      const admin = isAdmin(requester);
      const isDriver = requester && order.driverId === requester.id;

      if (!admin && order.customerId !== requester?.id && !isDriver) {
        throw forbidden('No puedes modificar este pedido.');
      }

      // Un cliente solo puede cancelar su pedido; el resto de transiciones es
      // tarea del personal.
      if (!admin && !isDriver && data.status !== undefined && data.status !== 'canceled') {
        throw forbidden('Solo el personal puede cambiar el estado de un pedido.');
      }

      const nextStatus = data.status ?? order.status;
      const wasLive = LIVE_STATUSES.includes(order.status);
      const willRestock = RESTOCK_STATUSES.includes(nextStatus);

      const patch: Record<string, unknown> = { updatedAt: new Date() };

      if (data.status !== undefined) patch.status = data.status as any;
      if (data.deliveryAddressId !== undefined) patch.deliveryAddressId = data.deliveryAddressId;
      if (data.promotionalCodeId !== undefined) patch.promotionalCodeId = data.promotionalCodeId;
      // Asignar domiciliario es exclusivo del personal.
      if (data.driverId !== undefined && (admin || isDriver)) patch.driverId = data.driverId;

      // Devolución de mercancía al inventario (cancelado / devuelto).
      if (willRestock && wasLive) {
        for (const detail of order.details) {
          await tx.product.update({
            where: { id: detail.productId },
            data: { stock: { increment: detail.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: detail.productId,
              type: 'in',
              quantity: detail.quantity,
              reason: `Devolución de stock - pedido ${id} (${nextStatus})`,
              userId: requester?.id ?? null,
            },
          });
        }
      }

      // Reactivar un pedido cancelado vuelve a descontar el inventario.
      if (!willRestock && !wasLive && LIVE_STATUSES.includes(nextStatus)) {
        for (const detail of order.details) {
          const updated = await tx.product.updateMany({
            where: { id: detail.productId, stock: { gte: detail.quantity } },
            data: { stock: { decrement: detail.quantity } },
          });
          if (updated.count === 0) {
            throw badRequest(
              `No hay stock suficiente para reactivar el pedido (producto ${detail.productId}).`
            );
          }
          await tx.inventoryMovement.create({
            data: {
              productId: detail.productId,
              type: 'out',
              quantity: detail.quantity,
              reason: `Reactivación de pedido ${id}`,
              userId: requester?.id ?? null,
            },
          });
        }
      }

      return tx.order.update({ where: { id }, data: patch, include: LIST_INCLUDE });
    });
  },

  // C-05: borrado lógico. Se marca deletedAt en lugar de destruir el pedido y
  // su historial (detalles, envíos, recibo). El historial contable se conserva.
  async remove(id: string, requester?: Requester) {
    const order = await prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw notFound('Pedido no encontrado.');
    if (!isAdmin(requester)) throw forbidden('Solo el personal puede eliminar pedidos.');
    await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return null;
  },

  async applyPromotionalCode(id: string, code: string, requester: Requester) {
    const order = await prisma.order.findFirst({ where: { id, deletedAt: null } });
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
