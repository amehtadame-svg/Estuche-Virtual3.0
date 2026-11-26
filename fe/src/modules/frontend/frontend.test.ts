import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const FE_ROOT = path.resolve(process.cwd(), '..', 'fe');
const apiSource = fs.readFileSync(path.join(FE_ROOT, 'src/api/api.ts'), 'utf8');

test('C-07: api.ts lee VITE_API_URL antes que cualquier fallback', () => {
  const varIndex = apiSource.indexOf('import.meta.env.VITE_API_URL');
  const fallbackIndex = apiSource.indexOf("return 'http://localhost:4000';");

  assert.ok(varIndex >= 0, 'api.ts debe usar import.meta.env.VITE_API_URL');
  assert.ok(fallbackIndex >= 0, 'debe conservar un fallback de desarrollo');
  assert.ok(
    varIndex < fallbackIndex,
    'VITE_API_URL debe evaluarse antes que el fallback a localhost'
  );
});

test('C-07: no hay más URLs de backend fijadas en el código del frontend', () => {
  // Solo debe existir el fallback de desarrollo (return); las menciones en
  // comentarios de documentación son válidas.
  const codeLines = apiSource
    .split('\n')
    .filter((l) => l.includes('localhost:4000'))
    .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'));

  assert.strictEqual(codeLines.length, 1, 'solo debe existir el fallback de desarrollo');
  assert.match(codeLines[0], /return/, 'ese único uso debe ser el return del fallback');
});

test('C-07: fe/.env-example documenta VITE_API_URL', () => {
  const envExample = fs.readFileSync(path.join(FE_ROOT, '.env-example'), 'utf8');
  assert.match(envExample, /^VITE_API_URL=.*$/m, 'debe definir VITE_API_URL');
});

test('El comprobante enlaza al detalle del pedido asociado, sin depender de un callback vacío', async () => {
  const { createServer } = await import('vite');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const server = await createServer({
    server: { middlewareMode: true }, appType: 'custom',
    legacy: { proxySsrExternalModules: true },
  });
  try {
    const { createRequire } = await import('node:module');
    const { MemoryRouter } = createRequire(import.meta.url)('react-router-dom');
    const { default: DemoPaymentResult } = await server.ssrLoadModule('/src/pages/Checkout/DemoPaymentResult.tsx');
    const id = '11111111-1111-4111-8111-111111111111';
    for (const status of ['approved', 'pending', 'rejected']) {
      const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(DemoPaymentResult, {
        result: {
          reference: 'DEMO-test', status, method: 'nequi', amount: '25000', currency: 'COP',
          orderId: id, orderStatus: status === 'approved' ? 'paid' : 'pending', receiptNumber: 45,
          expiresAt: null,
        },
        processing: false, error: '', onResolve() {}, onRefresh() {}, onLeave() {},
      })));
      assert.match(html, new RegExp(`href="/pedidos/${id}"`));
      assert.match(html, /Ver estado del pedido/);
      assert.match(html, /Consultar estado del pago/);
    }
  } finally {
    await server.close();
  }
});

test('El destino del comprobante existe y está protegido para los roles que pueden comprar', () => {
  const app = fs.readFileSync(path.join(FE_ROOT, 'src/App.tsx'), 'utf8');
  assert.match(app, /<ProtectedRoute allowedRoles=\{\['client', 'admin', 'superadmin'\]\} \/>[\s\S]*?path="\/pedidos\/:id" element=\{<OrderStatus \/>\}/);
});

test('El error del pago distingue un producto inválido de una referencia inválida', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { paymentErrorMessage } = await server.ssrLoadModule('/src/pages/Checkout/paymentFormat.ts');
    assert.match(paymentErrorMessage({ errors: [{ path: ['items', 1, 'productId'], message: 'Invalid UUID' }] }), /producto 2 del carrito/);
    assert.match(paymentErrorMessage({ errors: [{ path: ['requestKey'], message: 'Invalid UUID' }] }), /referencia del intento/);
    assert.equal(paymentErrorMessage({ message: 'Stock insuficiente.' }), 'Stock insuficiente.');
    assert.equal(paymentErrorMessage({ errors: [{ path: ['phone'], message: 'Introduce un celular colombiano.' }] }), 'Introduce un celular colombiano.');
    assert.equal(paymentErrorMessage(null), 'No se pudo registrar el pago.');
    assert.equal(paymentErrorMessage({ errors: ['respuesta inesperada'] }), 'No se pudo registrar el pago.');
  } finally {
    await server.close();
  }
});
