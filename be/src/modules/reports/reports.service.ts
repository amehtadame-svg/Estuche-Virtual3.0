import { prisma } from '../../lib/prisma';

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

export const reportService = {
  list() {
    return prisma.report.findMany({ orderBy: { date: 'desc' } });
  },

  async getGeneralSummary() {
    const [sold, paid, refunded, activeCodes, ordersToday, newCustomersToday] = await Promise.all([
      prisma.report.aggregate({ _sum: { totalSold: true } }),
      prisma.report.aggregate({ _sum: { totalPaid: true } }),
      prisma.report.aggregate({ _sum: { totalRefunded: true } }),
      prisma.promotionalCode.count({ where: { active: true } }),
      prisma.order.count({ where: { orderDate: { gte: startOfToday() } } }),
      prisma.report.findFirst({ where: { date: startOfToday() }, select: { newCustomers: true } }),
    ]);

    return {
      total_sold: sold._sum.totalSold ?? 0,
      total_paid: paid._sum.totalPaid ?? 0,
      total_refunded: refunded._sum.totalRefunded ?? 0,
      active_promotional_codes: activeCodes,
      orders_today: ordersToday,
      new_customers_today: newCustomersToday?.newCustomers ?? 0,
    };
  },
};
