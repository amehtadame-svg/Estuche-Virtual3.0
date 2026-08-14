import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

export const payoutService = {
  list() {
    return prisma.payout.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        receipt: { select: { receiptNumber: true, total: true } },
      },
      orderBy: { id: 'desc' },
    });
  },

  async getById(id: string) {
    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true } },
        receipt: { select: { receiptNumber: true, total: true, paymentStatus: true } },
      },
    });
    if (!payout) throw notFound('Pago no encontrado');
    return payout;
  },

  updateStatus(id: string, status: string, confirmedAt?: Date) {
    return prisma.payout.update({
      where: { id },
      data: {
        status: status as any,
        confirmedAt: confirmedAt ?? (status === 'approved' ? new Date() : null),
      },
    });
  },
};
