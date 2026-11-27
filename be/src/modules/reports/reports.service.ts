import { prisma } from '../../lib/prisma';
import { badRequest } from '../../lib/errors';
import { toDateKey } from '../../lib/reportDate';
export { toDateKey } from '../../lib/reportDate';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DESPATCH_STATUS_ES: Record<string, string> = {
  in_transit: 'en camino',
  delivered: 'entregado',
  returned: 'devuelto',
  canceled: 'cancelado',
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface DailyReportRow {
  id: string;
  date: string;
  totalOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
  totalSold: number;
  totalPaid: number;
  totalRefunded: number;
  productsSold: number;
  newCustomers: number;
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

const createEmptyDay = (date: string): DailyReportRow => ({
  id: `report-${date}`,
  date,
  totalOrders: 0,
  deliveredOrders: 0,
  canceledOrders: 0,
  totalSold: 0,
  totalPaid: 0,
  totalRefunded: 0,
  productsSold: 0,
  newCustomers: 0,
});

const validateDateRange = (filter?: DateRangeFilter) => {
  const from = filter?.from?.trim() || undefined;
  const to = filter?.to?.trim() || undefined;
  if (from && to && from > to) {
    throw badRequest('Rango no válido: La fecha de inicio no puede ser posterior a la fecha final');
  }
  return { from, to };
};

async function computeDailyMap(preseedRecentDays: boolean) {
  const [orders, receipts, payouts, returns, clients] = await Promise.all([
    prisma.order.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        orderDate: true,
        status: true,
        total: true,
        details: { select: { quantity: true } },
      },
    }),
    prisma.receipt.findMany({
      select: {
        id: true,
        orderId: true,
        date: true,
        total: true,
        paymentStatus: true,
      },
    }),
    prisma.payout.findMany({
      select: {
        id: true,
        receiptId: true,
        status: true,
        amount: true,
        paidAt: true,
        confirmedAt: true,
      },
    }),
    prisma.orderReturn.findMany({
      select: {
        id: true,
        orderId: true,
        status: true,
        refund: true,
        requestedAt: true,
        resolvedAt: true,
      },
    }),
    prisma.user.findMany({
      where: { role: 'client', deletedAt: null },
      select: { id: true, createdAt: true },
    }),
  ]);

  const dailyMap = new Map<string, DailyReportRow>();
  const ensureDay = (key: string): DailyReportRow => {
    let row = dailyMap.get(key);
    if (!row) {
      row = createEmptyDay(key);
      dailyMap.set(key, row);
    }
    return row;
  };

  if (preseedRecentDays) {
    const today = toDateKey(new Date())!;
    const noon = new Date(`${today}T12:00:00Z`);
    for (let offset = 0; offset < 6; offset++) {
      const d = new Date(noon.getTime() - offset * 86400000);
      const key = toDateKey(d);
      if (key) ensureDay(key);
    }
  }

  const receiptOrderIds = new Set<string>();
  const receiptToOrder = new Map<string, string | null>();
  for (const r of receipts) {
    receiptToOrder.set(r.id, r.orderId ?? null);
    if (r.orderId) receiptOrderIds.add(r.orderId);
  }

  // 1. Órdenes y unidades vendidas
  for (const order of orders) {
    const key = toDateKey(order.orderDate);
    if (!key) continue;
    const day = ensureDay(key);
    day.totalOrders += 1;

    if (order.status === 'delivered') day.deliveredOrders += 1;
    if (order.status === 'canceled') {
      day.canceledOrders += 1;
    } else {
      day.totalSold = round2(day.totalSold + Number(order.total ?? 0));
      const units = (order.details ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
      day.productsSold += units;

      if ((order.status === 'paid' || order.status === 'delivered') && !receiptOrderIds.has(order.id)) {
        day.totalPaid = round2(day.totalPaid + Number(order.total ?? 0));
      }
    }
  }

  // 2. Pagos aprobados y recibos pagados (sin duplicar un mismo recibo)
  const approvedReceiptIds = new Set<string>();
  for (const payout of payouts) {
    if (payout.status !== 'approved') continue;
    if (payout.receiptId) approvedReceiptIds.add(payout.receiptId);
    const key = toDateKey(payout.confirmedAt ?? payout.paidAt);
    if (!key) continue;
    const day = ensureDay(key);
    day.totalPaid = round2(day.totalPaid + Number(payout.amount ?? 0));
  }

  for (const receipt of receipts) {
    if (receipt.paymentStatus !== 'paid') continue;
    if (approvedReceiptIds.has(receipt.id)) continue;
    const key = toDateKey(receipt.date);
    if (!key) continue;
    const day = ensureDay(key);
    day.totalPaid = round2(day.totalPaid + Number(receipt.total ?? 0));
  }

  // 3. Reembolsos (devoluciones resueltas + pagos reembolsados no cubiertos)
  const refundedOrderIds = new Set<string>();
  for (const ret of returns) {
    const refundVal = Number(ret.refund ?? 0);
    if ((ret.status === 'refunded' || ret.status === 'approved') && refundVal > 0) {
      if (ret.orderId) refundedOrderIds.add(ret.orderId);
      const key = toDateKey(ret.resolvedAt ?? ret.requestedAt);
      if (!key) continue;
      const day = ensureDay(key);
      day.totalRefunded = round2(day.totalRefunded + refundVal);
    }
  }

  for (const payout of payouts) {
    if (payout.status !== 'refunded') continue;
    const linkedOrderId = receiptToOrder.get(payout.receiptId);
    if (linkedOrderId && refundedOrderIds.has(linkedOrderId)) continue;
    const key = toDateKey(payout.confirmedAt ?? payout.paidAt);
    if (!key) continue;
    const day = ensureDay(key);
    day.totalRefunded = round2(day.totalRefunded + Number(payout.amount ?? 0));
  }

  // 4. Clientes nuevos registrados por fecha
  for (const client of clients) {
    const key = toDateKey(client.createdAt);
    if (!key) continue;
    const day = ensureDay(key);
    day.newCustomers += 1;
  }

  return dailyMap;
}

export const reportService = {
  async list(filter?: DateRangeFilter): Promise<DailyReportRow[]> {
    const { from, to } = validateDateRange(filter);
    const hasFilter = Boolean(from || to);
    const dailyMap = await computeDailyMap(!hasFilter);

    return [...dailyMap.values()]
      .filter((row) => (!from || row.date >= from) && (!to || row.date <= to))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async getGeneralSummary(filter?: DateRangeFilter) {
    const { from, to } = validateDateRange(filter);
    const [dailyMap, activeCodes] = await Promise.all([
      computeDailyMap(true),
      prisma.promotionalCode.count({ where: { active: true } }),
    ]);

    const todayKey = toDateKey(new Date()) ?? '';
    const todayRow = dailyMap.get(todayKey);

    const rows = [...dailyMap.values()].filter(
      (row) => (!from || row.date >= from) && (!to || row.date <= to)
    );

    let totalSold = 0;
    let totalPaid = 0;
    let totalRefunded = 0;
    let totalOrders = 0;
    let deliveredOrders = 0;
    let canceledOrders = 0;
    let productsSold = 0;

    for (const row of rows) {
      totalSold = round2(totalSold + row.totalSold);
      totalPaid = round2(totalPaid + row.totalPaid);
      totalRefunded = round2(totalRefunded + row.totalRefunded);
      totalOrders += row.totalOrders;
      deliveredOrders += row.deliveredOrders;
      canceledOrders += row.canceledOrders;
      productsSold += row.productsSold;
    }

    const effectiveOrders = Math.max(0, totalOrders - canceledOrders);

    return {
      total_sold: totalSold,
      total_paid: totalPaid,
      total_refunded: totalRefunded,
      active_promotional_codes: activeCodes,
      orders_today: todayRow?.totalOrders ?? 0,
      new_customers_today: todayRow?.newCustomers ?? 0,
      total_orders: totalOrders,
      delivered_orders: deliveredOrders,
      canceled_orders: canceledOrders,
      products_sold: productsSold,
      average_ticket: effectiveOrders > 0 ? round2(totalSold / effectiveOrders) : 0,
    };
  },

  async getAdminDashboard() {
    const [
      products,
      receiptsCount,
      providersCount,
      orders,
      recentReceipts,
      recentDespatches,
      recentMovements,
    ] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, stock: true, stockMin: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.receipt.count(),
      prisma.provider.count(),
      prisma.order.findMany({
        where: { deletedAt: null },
        include: { customer: { select: { fullName: true } } },
        orderBy: { orderDate: 'desc' },
      }),
      prisma.receipt.findMany({
        take: 6,
        orderBy: { date: 'desc' },
        select: { id: true, receiptNumber: true, total: true, paymentStatus: true, date: true },
      }),
      prisma.despatch.findMany({
        take: 6,
        orderBy: { shipDate: 'desc' },
        select: { id: true, status: true, shipDate: true, deliveredAt: true },
      }),
      prisma.inventoryMovement.findMany({
        take: 6,
        orderBy: { date: 'desc' },
        include: { product: { select: { name: true } } },
      }),
    ]);

    const now = new Date();
    const todayKey = toDateKey(now) ?? '';
    const ordersToday = orders.filter((o) => toDateKey(o.orderDate) === todayKey).length;
    const salesToday = round2(
      orders
        .filter((o) => toDateKey(o.orderDate) === todayKey && o.status !== 'canceled')
        .reduce((sum, o) => sum + Number(o.total ?? 0), 0)
    );
    const lowStockProducts = products.filter((p) => p.stock <= p.stockMin).length;

    const monthlyBuckets: { key: string; month: string; sales: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyBuckets.push({
        key,
        month: MONTH_NAMES[d.getMonth()],
        sales: 0,
        orders: 0,
      });
    }
    const bucketMap = new Map(monthlyBuckets.map((b) => [b.key, b]));

    for (const order of orders) {
      if (!order.orderDate || order.status === 'canceled') continue;
      const d = new Date(order.orderDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.sales = round2(bucket.sales + Number(order.total ?? 0));
        bucket.orders += 1;
      }
    }

    const recentOrders = orders.slice(0, 5).map((o) => ({
      id: o.id,
      number: `PED-${o.id.slice(0, 6).toUpperCase()}`,
      customer: o.customer?.fullName ?? 'Cliente general',
      date: toDateKey(o.orderDate) ?? '—',
      total: Number(o.total ?? 0),
      status: o.status,
    }));

    const candidates: { id: string; icon: string; text: string; date: string; ts: number }[] = [];

    for (const o of orders.slice(0, 5)) {
      const ts = o.orderDate ? new Date(o.orderDate).getTime() : 0;
      if (!ts) continue;
      const num = `PED-${o.id.slice(0, 6).toUpperCase()}`;
      const who = o.customer?.fullName ?? 'Cliente';
      candidates.push({
        id: `ord-${o.id}`,
        icon: '🛒',
        text: `Pedido ${num} de ${who} ($${Number(o.total ?? 0).toLocaleString('es-CO')})`,
        date: new Date(ts).toISOString(),
        ts,
      });
    }

    for (const r of recentReceipts) {
      const ts = r.date ? new Date(r.date).getTime() : 0;
      if (!ts) continue;
      const recCode = `REC-${String(r.receiptNumber).padStart(3, '0')}`;
      const verb = r.paymentStatus === 'paid' ? 'pagado' : 'generado';
      candidates.push({
        id: `rec-${r.id}`,
        icon: '🧾',
        text: `Recibo ${recCode} ${verb} ($${Number(r.total ?? 0).toLocaleString('es-CO')})`,
        date: new Date(ts).toISOString(),
        ts,
      });
    }

    for (const d of recentDespatches) {
      const rawDate = d.deliveredAt ?? d.shipDate;
      const ts = rawDate ? new Date(rawDate).getTime() : 0;
      if (!ts) continue;
      const envCode = `ENV-${d.id.slice(0, 6).toUpperCase()}`;
      const st = DESPATCH_STATUS_ES[d.status] ?? d.status;
      candidates.push({
        id: `des-${d.id}`,
        icon: '🚚',
        text: `Envío ${envCode} marcado como ${st}`,
        date: new Date(ts).toISOString(),
        ts,
      });
    }

    for (const m of recentMovements) {
      const ts = m.date ? new Date(m.date).getTime() : 0;
      if (!ts) continue;
      const prodName = m.product?.name ?? 'producto';
      const label =
        m.type === 'in'
          ? `Ingreso de +${m.quantity} uds. en "${prodName}"`
          : m.type === 'out'
            ? `Salida de −${m.quantity} uds. en "${prodName}"`
            : `Ajuste de inventario (${m.quantity} uds.) en "${prodName}"`;
      candidates.push({
        id: `mov-${m.id}`,
        icon: m.type === 'in' ? '📥' : '📤',
        text: label,
        date: new Date(ts).toISOString(),
        ts,
      });
    }

    if (candidates.length === 0) {
      for (const p of products.slice(0, 5)) {
        const ts = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        if (!ts) continue;
        candidates.push({
          id: `prd-${p.id}`,
          icon: '📦',
          text: `Producto "${p.name}" registrado en catálogo`,
          date: new Date(ts).toISOString(),
          ts,
        });
      }
    }

    candidates.sort((a, b) => b.ts - a.ts);

    const recentActivity = candidates.slice(0, 6).map(({ id, icon, text, date }) => ({
      id,
      icon,
      text,
      date,
    }));

    return {
      stats: {
        totalProducts: products.length,
        ordersToday,
        totalReceipts: receiptsCount,
        totalProviders: providersCount,
        salesToday,
        lowStockProducts,
      },
      monthlySales: monthlyBuckets.map(({ month, sales, orders: count }) => ({
        month,
        sales,
        orders: count,
      })),
      recentOrders,
      recentActivity,
    };
  },
};