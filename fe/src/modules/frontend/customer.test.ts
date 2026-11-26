import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement as h, act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { MemoryRouter, useLocation } = require('react-router-dom');
const id = '11111111-1111-4111-8111-1234abcd5678';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

test('Experiencia de cliente: referencias, pedidos, imágenes y carrito', async t => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'sessionStorage', 'localStorage', 'fetch', 'IS_REACT_ACT_ENVIRONMENT', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const originals = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true, requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window) })) Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  const { AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  const { CartProvider } = await server.ssrLoadModule('/src/context/CartContext.tsx');
  const { default: MyOrders } = await server.ssrLoadModule('/src/pages/MyOrders/MyOrders.tsx');
  const { default: Shopping } = await server.ssrLoadModule('/src/pages/Shopping/Shopping.tsx');
  const { default: Login } = await server.ssrLoadModule('/src/pages/Login/Login.tsx');
  const { shippingCost } = await server.ssrLoadModule('/src/lib/shipping.ts');
  const { orderReference, referenceText } = await server.ssrLoadModule('/src/lib/reference.ts');
  const root = createRoot(document.getElementById('root')!);
  const user = { id: 'buyer', name: 'Cliente de prueba', email: 'cliente@example.com', role: 'client' };
  function Location() { return h('output', { id: 'location' }, useLocation().pathname); }
  const mount = async (Component: typeof MyOrders, cart = false, initialPath = '/') => {
    await act(async () => { root.render(h(AuthContext.Provider, { value: { user, loading: false, login: async () => ({ ok: true }) } }, h(MemoryRouter, { key: Math.random(), initialEntries: [initialPath] }, cart ? h(CartProvider, null, h(Component)) : h(Component), h(Location)))); });
  };
  try {
    await t.test('Reglas de envío y referencia visual consistente sin UUID completo', () => {
      assert.equal(shippingCost(119999), 10000);
      assert.equal(shippingCost(120000), 0);
      assert.equal(orderReference(id), 'PED-ABCD5678');
      assert.equal(referenceText('Stock inicial de registro de producto (HU-001)'), 'Stock inicial de registro de producto');
      assert.equal(referenceText('Anotación del usuario HU-001'), 'Anotación del usuario HU-001');
      assert.equal(fs.readFileSync(new URL('../../lib/shipping.ts', import.meta.url), 'utf8'), fs.readFileSync(new URL('../../../../be/src/lib/shipping.ts', import.meta.url), 'utf8'));
    });
    await t.test('Mis pedidos muestra compras propias, referencia legible y enlace al seguimiento', async () => {
      globalThis.fetch = async () => json([
        { id, total: 35000, status: 'paid', orderDate: '2026-11-26T10:00:00Z', fulfillmentMethod: 'delivery', details: [{ quantity: 2, product: { name: 'Cuaderno lavanda' } }] },
        { id: '22222222-2222-4222-8222-abcdef123456', total: 25000, status: 'canceled', orderDate: null, fulfillmentMethod: 'pickup', details: [] },
      ]);
      await mount(MyOrders);
      assert.match(document.body.textContent!, /PED-ABCD5678/);
      assert.match(document.body.textContent!, /Cuaderno lavanda/);
      assert.ok(!document.body.textContent!.includes(id));
      assert.ok(document.querySelector(`a[href="/pedidos/${id}"]`));
      const select = document.querySelector('select')!;
      await act(async () => { select.value = 'paid'; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
      assert.equal(document.querySelectorAll('.my-order-card').length, 1);
      assert.match(document.body.textContent!, /1 pedido/);
    });
    await t.test('Lista vacía y fallo de servidor son estados distintos y permiten reintentar', async () => {
      globalThis.fetch = async () => json([], 200);
      await mount(MyOrders);
      assert.match(document.body.textContent!, /Aún no has realizado pedidos/);
      globalThis.fetch = async () => json({}, 500);
      await mount(MyOrders);
      assert.match(document.querySelector('[role="alert"]')!.textContent!, /No pudimos/);
      assert.ok([...document.querySelectorAll('button')].some(button => button.textContent === 'Reintentar'));
    });
    await t.test('Carrito recargado conserva foto/categoría y requiere confirmar antes de vaciar', async () => {
      let deletes = 0;
      globalThis.fetch = async (_url, options) => {
        if (options?.method === 'DELETE') { deletes++; return new Response(null, { status: 204 }); }
        return json([{ productId: id, quantity: 2, product: { name: 'Cuaderno lavanda', price: 10000, category: { name: 'Cuadernos' }, images: [{ url: 'https://example.com/cuaderno.png', isPrimary: true }] } }]);
      };
      await mount(Shopping, true);
      assert.equal(document.querySelector('.carrito-item img')!.getAttribute('src'), 'https://example.com/cuaderno.png');
      assert.match(document.body.textContent!, /Cuadernos/);
      assert.equal(document.querySelector('progress')!.value, 20000);
      assert.ok(document.querySelector('.carrito-btn-vaciar svg'));
      await act(async () => { (document.querySelector('.carrito-btn-vaciar') as HTMLButtonElement).click(); });
      assert.ok(document.querySelector('[role="dialog"]'));
      assert.equal(deletes, 0);
      await act(async () => { [...document.querySelectorAll('button')].find(button => button.textContent === 'Sí, vaciar carrito')!.click(); });
      assert.equal(deletes, 1);
      assert.match(document.body.textContent!, /Tu carrito está vacío/);
    });
    await t.test('Inicio de sesión de cliente lleva a Inicio y no al antiguo panel', async () => {
      localStorage.setItem('user', JSON.stringify(user));
      await mount(Login, false, '/login');
      const form = document.querySelector('form')!;
      await act(async () => { form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); });
      assert.equal(document.getElementById('location')!.textContent, '/');
      const source = fs.readFileSync(new URL('../../pages/Login/Login.tsx', import.meta.url), 'utf8');
      assert.ok(!source.includes("navigate('/cliente')"));
    });
  } finally {
    await act(async () => root.unmount());
    await server.close();
    dom.window.close();
    for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
