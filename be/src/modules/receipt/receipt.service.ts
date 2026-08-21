import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

export const receiptService = {
  list() {
    return prisma.receipt.findMany({
      include: {
        customer: { select: { fullName: true } },
        employee: { select: { fullName: true } },
        order: { select: { id: true, total: true } },
      },
      orderBy: { date: 'desc' },
    });
  },

  // C-02: el total de un recibo ligado a un pedido sale siempre del pedido
  // (calculado por el servidor), nunca del cuerpo de la petición.
  async create(data: {
    customerId?: string;
    employeeId?: string;
    orderId?: string;
    total?: number;
    paymentStatus?: string;
  }) {
    let total = data.total;
    if (data.orderId) {
      const order = await prisma.order.findUnique({ where: { id: data.orderId } });
      if (!order) throw notFound('Pedido no encontrado.');
      total = Number(order.total);
    }

    return prisma.receipt.create({
      data: {
        customerId: data.customerId,
        employeeId: data.employeeId,
        orderId: data.orderId,
        total,
        paymentStatus: data.paymentStatus as any,
      },
    });
  },

  async update(
    id: string,
    data: { customerId?: string; employeeId?: string; total?: number; paymentStatus?: string }
  ) {
    const existing = await prisma.receipt.findUnique({ where: { id } });
    if (!existing) throw notFound('Recibo no encontrado.');

    // Si el recibo está ligado a un pedido, su total siempre refleja el del
    // pedido en BD, aunque el cliente intente enviar otro valor (C-02).
    let total = data.total;
    if (existing.orderId) {
      const order = await prisma.order.findUnique({ where: { id: existing.orderId } });
      if (order) total = Number(order.total);
    }

    return prisma.receipt.update({
      where: { id },
      data: {
        customerId: data.customerId,
        employeeId: data.employeeId,
        total,
        paymentStatus: data.paymentStatus as any,
      },
    });
  },

  async remove(id: string) {
    await prisma.receipt.delete({ where: { id } });
    return null;
  },
};
