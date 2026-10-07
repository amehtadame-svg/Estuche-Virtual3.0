import { prisma } from '../../lib/prisma';

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

export const reportService = {
  list() {
    return prisma.report.findMany({ orderBy: { date: 'desc' } });
  },

  /**
   * Resumen real del negocio, calculado desde la base de datos.
   *
   * El panel de administración mostraba cifras fijas en el código ("124
   * productos", "38 pedidos hoy"...). Ahora todo sale de consultas, de modo que
   * cualquier cambio en un producto o pedido se refleja al instante.
   */
  async getGeneralSummary() {
    const today = startOfToday();

    const [sold, paid, refunded, activeCodes, ordersToday, newCustomersToday, products, providers, receipts, orders, lowStock, pendingOrders, monthly] =
      await Promise.all([
        prisma.report.aggregate({ _sum: { totalSold: true } }),
        prisma.report.aggregate({ _sum: { totalPaid: true } }),
        prisma.report.aggregate({ _sum: { totalRefunded: true } }),
        prisma.promotionalCode.count({ where: { active: true } }),
        prisma.order.count({ where: { orderDate: { gte: today }, deletedAt: null } }),
        prisma.report.findFirst({ where: { date: today }, select: { newCustomers: true } }),
        prisma.product.count({ where: { deletedAt: null } }),
        prisma.provider.count(),
        prisma.receipt.count(),
        prisma.order.count({ where: { deletedAt: null } }),
        // Productos en o por debajo del mínimo (HU-007).
        prisma.product.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, stock: true, stockMin: true },
          orderBy: { stock: 'asc' },
          take: 10,
        }),
        prisma.order.count({ where: { deletedAt: null, status: 'pending' } }),
        // Ventas reales de los últimos 6 meses (para la gráfica del panel).
        prisma.$queryRaw<{ month: string; total: number }[]>`
          SELECT to_char(date_trunc('month', "order_date"), 'YYYY-MM') AS month,
                 COALESCE(SUM("total"), 0)::float8 AS total
          FROM "orders"
          WHERE "deleted_at" IS NULL
            AND "status" NOT IN ('canceled', 'returned')
          GROUP BY 1
          ORDER BY 1 DESC
          LIMIT 6
        `,
      ]);

    const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlySales = monthly
      .map((row) => {
        const [year, month] = row.month.split('-');
        return { month: `${MESES[Number(month) - 1]} ${year.slice(2)}`, sales: Number(row.total) };
      })
      .reverse();

    return {
      total_sold: sold._sum.totalSold ?? 0,
      total_paid: paid._sum.totalPaid ?? 0,
      total_refunded: refunded._sum.totalRefunded ?? 0,
      active_promotional_codes: activeCodes,
      orders_today: ordersToday,
      new_customers_today: newCustomersToday?.newCustomers ?? 0,
      // Cifras para las tarjetas del panel de administración.
      total_products: products,
      total_providers: providers,
      total_receipts: receipts,
      total_orders: orders,
      pending_orders: pendingOrders,
      low_stock_products: lowStock
        .filter((p) => p.stock <= p.stockMin)
        .map((p) => ({ id: p.id, name: p.name, stock: p.stock, stockMin: p.stockMin })),
      monthly_sales: monthlySales,
    };
  },
};
