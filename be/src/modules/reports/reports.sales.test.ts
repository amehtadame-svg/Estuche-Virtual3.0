import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { orderService } from '../orders/orders.service';
import { reportService } from './reports.service';

/**
 * B-03: ¿una venta nueva aparece en los reportes?
 *
 * Prueba de regresión de punta a punta con dobles de Prisma: la orden creada
 * por POST /api/orders entra en el cálculo de /api/reports sin pasos manuales.
 * La consulta de reportes lee `orders` filtrando `deletedAt: null` y cuenta
 * `total` en totalSold y las unidades en productsSold.
 */
const db = prisma as any;

test('B-03: una venta nueva alimenta los reportes del día sin pasos manuales', async () => {
  const stored: any[] = [];

  // ── Doble de la transacción de pedidos ─────────────────────────────────
  db.$transaction = async (fn: any) => fn({
    $queryRaw: async () => [],
    $executeRaw: async () => 1,
    user: { findUnique: async () => ({ address: 'Calle 1 #2-3' }) },
    product: {
      findUnique: async () => ({
        id: 'product-1',
        name: 'Cuaderno',
        price: new Prisma.Decimal(100),
        stock: 10,
      }),
      updateMany: async () => ({ count: 1 }),
    },
    order: {
      create: async ({ data }: any) => {
        const order = {
          id: 'order-1',
          orderDate: new Date(),
          status: data.status,
          total: data.total,
          deletedAt: null,
          details: data.details.create,
        };
        stored.push(order);
        return order;
      },
    },
    inventoryMovement: { create: async () => ({}) },
    orderEvent: { create: async () => ({}) },
    promotionalCode: {},
  });

  const created = await orderService.create(
    {
      deliveryAddress: 'Calle 1 #2-3, Bogotá',
      details: [{ productId: 'product-1', quantity: 2 }],
    },
    { id: 'client-1', role: 'client' }
  );

  assert.equal(Number(created.total), 10200, '200 + 10000 de envío');

  // ── Doble de las consultas del reporte ─────────────────────────────────
  db.order.findMany = async ({ where }: any) => {
    assert.equal(where.deletedAt, null, 'el reporte ignora pedidos eliminados');
    return stored;
  };
  db.receipt.findMany = async () => [];
  db.payout.findMany = async () => [];
  db.orderReturn.findMany = async () => [];
  db.user.findMany = async () => [];

  const rows = await reportService.list();
  const today = new Date().toISOString().slice(0, 10);
  const row = rows.find((item) => item.date === today);

  assert.ok(row, 'debe existir la fila del día de la venta');
  assert.equal(row!.totalOrders, 1);
  assert.equal(row!.totalSold, 10200);
  assert.equal(row!.productsSold, 2);
});

test('B-03: un pedido cancelado cuenta como cancelado y no suma venta', async () => {
  const today = new Date();

  db.order.findMany = async () => [
    {
      id: 'order-canceled',
      orderDate: today,
      status: 'canceled',
      total: 5000,
      details: [{ quantity: 1 }],
    },
  ];
  db.receipt.findMany = async () => [];
  db.payout.findMany = async () => [];
  db.orderReturn.findMany = async () => [];
  db.user.findMany = async () => [];

  const rows = await reportService.list();
  const row = rows.find((item) => item.date === today.toISOString().slice(0, 10));

  assert.ok(row);
  assert.equal(row!.canceledOrders, 1);
  assert.equal(row!.totalSold, 0);
  assert.equal(row!.productsSold, 0);
});
