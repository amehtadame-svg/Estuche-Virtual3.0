import { prisma } from '../../lib/prisma';

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

  create(data: {
    customerId?: string;
    employeeId?: string;
    orderId?: string;
    total?: number;
    paymentStatus?: string;
  }) {
    return prisma.receipt.create({
      data: {
        customerId: data.customerId,
        employeeId: data.employeeId,
        orderId: data.orderId,
        total: data.total,
        paymentStatus: data.paymentStatus as any,
      },
    });
  },

  update(
    id: string,
    data: { customerId?: string; employeeId?: string; total?: number; paymentStatus?: string }
  ) {
    return prisma.receipt.update({
      where: { id },
      data: {
        customerId: data.customerId,
        employeeId: data.employeeId,
        total: data.total,
        paymentStatus: data.paymentStatus as any,
      },
    });
  },

  async remove(id: string) {
    await prisma.receipt.delete({ where: { id } });
    return null;
  },
};
