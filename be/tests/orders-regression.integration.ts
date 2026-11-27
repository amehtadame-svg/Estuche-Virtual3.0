import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';

/**
 * Regresión de los fallos prioritarios de la sección A contra PostgreSQL REAL:
 * - A-01: pedido vacío rechazado, sin dejar registros.
 * - A-02: domicilio sin dirección rechazado; retiro sin dirección aceptado.
 * - A-03: cantidades inválidas rechazadas.
 * - A-04: producto eliminado no comprable (ni por ID).
 * - A-05/A-06/A-07: cupón validado, consumido una sola vez, límite respetado
 *   incluso con dos checkouts simultáneos (bloqueo de asesoría real).
 */

const target = process.env.EMPLOYEE_TEST_DATABASE_URL;
const url = target ? new URL(target) : null;

const safe =
  !!url &&
  ['postgres:', 'postgresql:'].includes(url.protocol) &&
  ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
  url.pathname.endsWith('_test');

if (safe) {
  process.env.DATABASE_URL = target;
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_PAYMENT_SIMULATION = 'true';
  process.env.JWT_SECRET = 'orders-regression-integration-test-only-2026';
}

const { prisma: db } = require('../src/lib/prisma');
const app = require('../src/app').default;

// Si el runner ejecuta varios *.integration.ts en un mismo proceso, este
// archivo debe omitirse en vez de abortar las demás suites.
test(
  'Regresión de pedidos y cupones contra PostgreSQL real',
  { skip: !safe && 'EMPLOYEE_TEST_DATABASE_URL no apunta a una base local *_test' },
  async () => {
  const run = randomUUID();
  const server = createServer(app);
  let productId: string | undefined;
  let deletedProductId: string | undefined;
  let couponId: string | undefined;
  let otherCouponId: string | undefined;
  let staleCouponId: string | undefined;
  let adminId: string | undefined;

  try {
    const user = await db.user.create({
      data: {
        email: `${run}@orders.test`,
        fullName: 'Cliente regresión',
        role: 'client',
        hashedPassword: 'not-a-login-password',
        isActive: true,
        address: 'Calle 1 #2-3, Bogotá',
      },
    });
    const token = jwt.sign({ id: user.id, role: 'client' }, process.env.JWT_SECRET!);

    // El PUT de pedidos exige rol admin y un usuario real en la BD.
    const admin = await db.user.create({
      data: {
        email: `${run}@admin.orders.test`,
        fullName: 'Admin regresión',
        role: 'admin',
        hashedPassword: 'not-a-login-password',
        isActive: true,
      },
    });
    adminId = admin.id;
    const adminToken = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET!);

    const product = await db.product.create({
      data: { name: `Regresión ${run}`, price: '1000.00', cost: '500.00', stock: 10 },
    });
    productId = product.id;

    const coupon = await db.promotionalCode.create({
      data: {
        code: `REG${run.slice(0, 8)}`.toUpperCase(),
        type: 'percentage',
        value: '10.00',
        minPurchase: '0.00',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2099-01-01'),
        maxUses: 1,
        currentUses: 0,
        active: true,
      },
    });
    couponId = coupon.id;

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    const post = (body: unknown) =>
      fetch(`${base}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

    // ── A-01: pedido vacío ───────────────────────────────────────────────
    for (const payload of [{}, { details: [] }, { total: 5000 }]) {
      const response = await post(payload);
      assert.equal(response.status, 400, `payload vacío ${JSON.stringify(payload)}`);
    }
    assert.equal(await db.order.count({ where: { customerId: user.id } }), 0,
      'un pedido inválido no debe crear registros');

    // ── A-02: domicilio sin dirección / retiro sin dirección ─────────────
    await db.user.update({ where: { id: user.id }, data: { address: null } });

    const noAddress = await post({ details: [{ productId: product.id, quantity: 1 }] });
    assert.equal(noAddress.status, 400);
    assert.match((await noAddress.json()).message, /dirección/i);

    // Con dirección en el perfil, el domicilio no necesita enviarla de nuevo.
    await db.user.update({ where: { id: user.id }, data: { address: 'Calle 1 #2-3, Bogotá' } });
    const fromProfile = await post({ details: [{ productId: product.id, quantity: 1 }] });
    assert.equal(fromProfile.status, 201, 'usa la dirección del perfil');
    assert.match((await fromProfile.json()).deliverySnapshot, /Calle 1/);

    const pickup = await post({
      fulfillmentMethod: 'pickup',
      details: [{ productId: product.id, quantity: 1 }],
    });
    assert.equal(pickup.status, 201, 'el retiro no exige domicilio');
    const pickupOrder = await pickup.json();
    assert.equal(Number(pickupOrder.shippingCost), 0);

    // ── A-03: cantidades inválidas ───────────────────────────────────────
    for (const quantity of [0, -1]) {
      const response = await post({
        deliveryAddress: 'Calle 1 #2-3, Bogotá',
        details: [{ productId: product.id, quantity }],
      });
      assert.equal(response.status, 400, `cantidad ${quantity}`);
    }

    // ── A-04: producto eliminado ─────────────────────────────────────────
    const deletedProduct = await db.product.create({
      data: {
        name: `Eliminado ${run}`,
        price: '1000.00',
        cost: '500.00',
        stock: 10,
        deletedAt: new Date(),
      },
    });
    deletedProductId = deletedProduct.id;

    const deleted = await post({
      deliveryAddress: 'Calle 1 #2-3, Bogotá',
      details: [{ productId: deletedProduct.id, quantity: 1 }],
    });
    assert.equal(deleted.status, 400);
    assert.match((await deleted.json()).message, /ya no está disponible/);
    const deletedRow = await db.product.findUnique({ where: { id: deletedProduct.id } });
    assert.equal(deletedRow!.stock, 10, 'el stock del producto eliminado no cambia');

    // ── A-04: la condición sigue activa al descontar stock ───────────────
    const stillAlive = await post({
      deliveryAddress: 'Calle 1 #2-3, Bogotá',
      details: [{ productId: productId, quantity: 2 }],
    });
    assert.equal(stillAlive.status, 201);
    const sold = await db.product.findUnique({ where: { id: productId } });
    assert.equal(sold!.stock, 6, '10 − 1 (retiro) − 1 (perfil) − 2 (domicilio) = 6');

    // ── A-07: dos checkouts simultáneos con maxUses = 1 ──────────────────
    const race = await Promise.all([
      post({
        deliveryAddress: 'Calle 1 #2-3, Bogotá',
        promotionalCodeId: coupon.id,
        details: [{ productId, quantity: 1 }],
      }),
      post({
        deliveryAddress: 'Calle 1 #2-3, Bogotá',
        promotionalCodeId: coupon.id,
        details: [{ productId, quantity: 1 }],
      }),
    ]);

    const accepted = race.filter((response) => response.status === 201);
    const rejected = race.filter((response) => response.status === 400);
    assert.equal(accepted.length, 1, 'solo una compra puede usar el último uso');
    assert.equal(rejected.length, 1, 'la otra se rechaza con 400');
    assert.match((await rejected[0].json()).message, /límite de usos/);

    const afterRace = await db.promotionalCode.findUnique({ where: { id: coupon.id } });
    assert.equal(afterRace!.currentUses, 1, 'el cupón se consume exactamente una vez');

    // ── A-05: el ID suelto no salta la validación ────────────────────────
    await db.promotionalCode.update({ where: { id: coupon.id }, data: { active: false } });
    const inactive = await post({
      deliveryAddress: 'Calle 1 #2-3, Bogotá',
      promotionalCodeId: coupon.id,
      details: [{ productId, quantity: 1 }],
    });
    assert.equal(inactive.status, 400);
    assert.match((await inactive.json()).message, /no está activo/);

    // ── A-06: el mismo pedido no acepta dos cupones ──────────────────────
    await db.promotionalCode.update({ where: { id: coupon.id }, data: { active: true } });
    const other = await db.promotionalCode.create({
      data: {
        code: `OTRO${run.slice(0, 6)}`.toUpperCase(),
        type: 'fixed',
        value: '100.00',
        minPurchase: '0.00',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2099-01-01'),
        maxUses: null,
        currentUses: 0,
        active: true,
      },
    });

    otherCouponId = other.id;

    const target = await post({
      deliveryAddress: 'Calle 1 #2-3, Bogotá',
      details: [{ productId, quantity: 1 }],
    });
    const targetOrder = await target.json();

    const first = await fetch(`${base}/api/orders/${targetOrder.id}/apply-code`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: other.code }),
    });
    assert.equal(first.status, 200);
    const applied = await first.json();
    assert.equal(Number(applied.total), Number(targetOrder.total) - 100);

    const second = await fetch(`${base}/api/orders/${targetOrder.id}/apply-code`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: coupon.code }),
    });
    assert.equal(second.status, 400);
    assert.match((await second.json()).message, /ya tiene un cupón/);

    const couponUntouched = await db.promotionalCode.findUnique({ where: { id: coupon.id } });
    assert.equal(couponUntouched!.currentUses, 1, 'el segundo intento no consume el cupón');

    // ── A-05: editar el pedido (PUT) no puede saltarse la validación ─────
    const staleCoupon = await db.promotionalCode.create({
      data: {
        code: `VIEJO${run.slice(0, 6)}`.toUpperCase(),
        type: 'fixed',
        value: '100.00',
        minPurchase: '0.00',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2099-01-01'),
        maxUses: 10,
        currentUses: 0,
        active: false,
      },
    });
    staleCouponId = staleCoupon.id;

    const editable = await post({
      deliveryAddress: 'Calle 1 #2-3, Bogotá',
      details: [{ productId, quantity: 1 }],
    });
    const editableOrder = await editable.json();

    // La edición general (PUT) está reservada a pedidos sin flujo operativo:
    // `assertUnmanaged` rechaza con 409 todo pedido con `createdById`. Para
    // ejercitar la validación del cupón se simula un pedido heredado.
    await db.order.update({ where: { id: editableOrder.id }, data: { createdById: null } });

    const viaPut = await fetch(`${base}/api/orders/${editableOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ promotionalCodeId: staleCoupon.id }),
    });
    assert.equal(viaPut.status, 400, 'un cupón inactivo no puede colarse por PUT');
    assert.match((await viaPut.json()).message, /no está activo/);

    const staleAfter = await db.promotionalCode.findUnique({ where: { id: staleCoupon.id } });
    assert.equal(staleAfter!.currentUses, 0, 'el cupón inválido no consume usos');

    const unchanged = await db.order.findUnique({ where: { id: editableOrder.id } });
    assert.equal(unchanged!.promotionalCodeId, null, 'el pedido no queda con cupón');

  } finally {
    if (server.listening) {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // Limpieza: el orden respeta las claves foráneas.
    if (productId || deletedProductId) {
      await db.inventoryMovement.deleteMany({
        where: { productId: { in: [productId, deletedProductId].filter(Boolean) } },
      });
      await db.orderDetail.deleteMany({
        where: { productId: { in: [productId, deletedProductId].filter(Boolean) } },
      });
    }
    const user = await db.user.findFirst({ where: { email: `${run}@orders.test` } });
    if (user) {
      await db.orderEvent.deleteMany({ where: { order: { customerId: user.id } } });
      await db.order.deleteMany({ where: { customerId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
    await db.product.deleteMany({
      where: { id: { in: [productId, deletedProductId].filter(Boolean) } },
    });
    await db.promotionalCode.deleteMany({
      where: { id: { in: [couponId, otherCouponId, staleCouponId].filter(Boolean) as string[] } },
    });
    if (adminId) await db.user.deleteMany({ where: { id: adminId } });
  }
});
