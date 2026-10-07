import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../lib/errors';

interface Requester {
  id: string;
  role: string;
}

const ADMIN_ROLES = ['admin', 'superadmin'];

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

  /**
   * Registra el pago de un recibo.
   *
   * Antes no existía POST /api/payouts: el checkout enviaba el pago y la ruta
   * no existía, así que ningún pago quedaba grabado en la base de datos.
   * El importe siempre sale del recibo (C-02), nunca del cuerpo.
   */
  async create(
    data: {
      receiptId: string;
      gateway: string;
      transactionId: string;
      status?: string;
      method?: string;
      currency?: string;
      confirmedAt?: Date;
    },
    requester: Requester
  ) {
    const receipt = await prisma.receipt.findUnique({ where: { id: data.receiptId } });
    if (!receipt) throw notFound('Recibo no encontrado.');

    const isOwner = receipt.customerId === requester.id;
    if (!isOwner && !ADMIN_ROLES.includes(requester.role)) {
      throw forbidden('No puedes registrar el pago de este recibo.');
    }

    const existing = await prisma.payout.findUnique({
      where: { transactionId: data.transactionId },
    });
    if (existing) throw badRequest('Esa transacción ya fue registrada.');

    const payout = await prisma.payout.create({
      data: {
        receiptId: receipt.id,
        userId: receipt.customerId ?? requester.id,
        gateway: data.gateway,
        transactionId: data.transactionId,
        status: (data.status ?? 'pending') as any,
        method: data.method ?? null,
        amount: receipt.total,
        currency: data.currency ?? 'COP',
        paidAt: new Date(),
        confirmedAt: data.confirmedAt ?? (data.status === 'approved' ? new Date() : null),
      },
      include: { receipt: { select: { receiptNumber: true, total: true } } },
    });

    // El recibo refleja el pago realizado.
    if (data.status === 'approved' || data.status === 'pending') {
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          paymentStatus: data.status === 'approved' ? 'paid' : 'pending',
        },
      });
    }

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
