import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * C-01 — Guard de autenticación en los cinco módulos que no lo tenían:
 * products, provider, receipt, despatch y order-details.
 *
 * Criterio de la auditoría: "POST /api/products sin token responde 401".
 * verifyToken responde 401 antes de consultar la base de datos, por lo que
 * esta prueba no necesita una BD real.
 */

process.env.JWT_SECRET = 'test-secret-min-32-characters-long!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../../app').default;

let server: Server;
let base: string;

before(async () => {
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

after(() => new Promise<void>((resolve) => server.close(() => resolve())));

const UUID = '00000000-0000-7000-8000-000000000000';

// Todas las rutas de escritura que C-01 exige proteger.
const WRITE_ROUTES: Array<{ label: string; method: string; path: string }> = [
  { label: 'crear producto', method: 'POST', path: '/api/products' },
  { label: 'editar producto', method: 'PUT', path: `/api/products/${UUID}` },
  { label: 'borrar producto', method: 'DELETE', path: `/api/products/${UUID}` },
  { label: 'crear proveedor', method: 'POST', path: '/api/providers' },
  { label: 'listar proveedores', method: 'GET', path: '/api/providers' },
  { label: 'editar proveedor', method: 'PUT', path: `/api/providers/${UUID}` },
  { label: 'borrar proveedor', method: 'DELETE', path: `/api/providers/${UUID}` },
  { label: 'crear factura', method: 'POST', path: '/api/receipts' },
  { label: 'listar facturas', method: 'GET', path: '/api/receipts' },
  { label: 'editar factura', method: 'PUT', path: `/api/receipts/${UUID}` },
  { label: 'borrar factura', method: 'DELETE', path: `/api/receipts/${UUID}` },
  { label: 'crear envío', method: 'POST', path: '/api/despatches' },
  { label: 'listar envíos', method: 'GET', path: '/api/despatches' },
  { label: 'editar envío', method: 'PUT', path: `/api/despatches/${UUID}` },
  { label: 'borrar envío', method: 'DELETE', path: `/api/despatches/${UUID}` },
  { label: 'crear detalle de pedido', method: 'POST', path: '/api/order-details' },
  { label: 'listar detalles de pedido', method: 'GET', path: '/api/order-details' },
  { label: 'editar detalle de pedido', method: 'PUT', path: `/api/order-details/${UUID}` },
  { label: 'borrar detalle de pedido', method: 'DELETE', path: `/api/order-details/${UUID}` },
];

test('C-01: las rutas protegidas responden 401 sin token', async () => {
  for (const { label, method, path } of WRITE_ROUTES) {
    const res = await fetch(base + path, { method });
    assert.strictEqual(
      res.status,
      401,
      `${method} ${path} (${label}) debería responder 401 sin token y respondió ${res.status}`,
    );
  }
});

test('C-01: las rutas protegidas responden 401 con token inválido', async () => {
  for (const { method, path } of WRITE_ROUTES) {
    const res = await fetch(base + path, {
      method,
      headers: { Authorization: 'Bearer token-invalido-abcdef' },
    });
    assert.strictEqual(
      res.status,
      401,
      `${method} ${path} debería responder 401 con token inválido y respondió ${res.status}`,
    );
  }
});

test('C-01: GET /api/products sigue siendo público (catálogo sin sesión)', async () => {
  const res = await fetch(base + '/api/products');
  // No debe estar bloqueado por autenticación: sin BD la ruta puede fallar con
  // otro código (p. ej. 500), pero jamás 401 por falta de token.
  assert.notStrictEqual(res.status, 401);
});
