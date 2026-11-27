import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement as h, act } from 'react';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { MemoryRouter } = require('react-router-dom');
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const product = { id: '11111111-1111-4111-8111-111111111111', name: 'Cuaderno', price: 30000, category: 'Cuadernos', icon: '📦' };

test('Acciones de cliente: carrito, cupón, PQR y navegación', async t => {
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'sessionStorage', 'localStorage', 'fetch', 'CustomEvent', 'IS_REACT_ACT_ENVIRONMENT'];
  const originals = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, CustomEvent: dom.window.CustomEvent, sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true })) Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  const { createRoot } = await import('react-dom/client');
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const { AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  const { CartProvider } = await server.ssrLoadModule('/src/context/CartContext.tsx');
  const { useCart } = await server.ssrLoadModule('/src/hooks/useCart.ts');
  const { default: ClientPqr } = await server.ssrLoadModule('/src/pages/PQR/ClientPqr.tsx');
  const { default: Checkout } = await server.ssrLoadModule('/src/pages/Checkout/Checkout.tsx');
  const { default: Header } = await server.ssrLoadModule('/src/components/layout/Header.tsx');
  const { default: AccountNav } = await server.ssrLoadModule('/src/components/layout/AccountNav.tsx');
  const { default: Returns } = await server.ssrLoadModule('/src/pages/Returns/CustomerReturns.tsx');
  const root = createRoot(document.getElementById('root')!);
  const user = { id: 'buyer', name: 'Ana Cliente', role: 'client' };
  let cart: ReturnType<typeof import('../../hooks/useCart').useCart>;
  function Capture() { cart = useCart(); return null; }
  const mount = async (Component = Capture, initial = '/') => {
    await act(async () => root.render(h(AuthContext.Provider, { value: { user, loading: false } }, h(MemoryRouter, { key: Math.random(), initialEntries: [initial] }, h(CartProvider, null, h(Capture), h(Component))))));
  };
  const fill = async (selector: string, value: string) => {
    await act(async () => {
      const element = document.querySelector(selector)! as HTMLInputElement;
      assert.ok(element, selector);
      const prototype = element.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
      element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
  };
  try {
    await t.test('Altas rápidas se serializan y suman cantidades sin recuperar ni vaciar el carrito', async () => {
      let requests = 0; let active = 0; let maxActive = 0;
      globalThis.fetch = async (_url, options) => {
        if (!options?.method) return json([]);
        requests++; active++; maxActive = Math.max(active, maxActive);
        await Promise.resolve(); active--;
        return json({});
      };
      await mount();
      await act(async () => { await Promise.all([cart.add(product), cart.add(product), cart.add(product, 3)]); });
      assert.equal(requests, 3); assert.equal(maxActive, 1); assert.equal(cart.totalItems, 5);
      assert.equal(cart.items[0].quantity, 5);
    });
    await t.test('Un error no confirma un alta y la misma notificación no se repite por artículo', async () => {
      let notices = 0;
      const listener = () => { notices++; };
      window.addEventListener('estuche:notification', listener);
      globalThis.fetch = async (_url, options) => !options?.method ? json([]) : json({ message: 'Stock insuficiente' }, 400);
      try {
        await mount();
        await act(async () => { assert.equal(await cart.add(product), false); assert.equal(await cart.add(product), false); });
        assert.equal(cart.items.length, 0); assert.equal(notices, 1);
      } finally { window.removeEventListener('estuche:notification', listener); }
    });
    await t.test('PQR: doble submit solo hace un POST y comienza un minuto de espera', async () => {
      let posts = 0; let release!: () => void;
      globalThis.fetch = async (url, options) => {
        if (String(url).endsWith('/shopping')) return json([]);
        if (options?.method === 'POST') { posts++; await new Promise<void>(resolve => { release = resolve; }); return json({ id: 'pqr-1' }, 201); }
        return json(posts ? [{ id: 'pqr-1', type: 'petition', subject: 'Consulta de mi pedido', description: 'Necesito consultar el estado de mi pedido.', status: 'received', createdAt: new Date().toISOString(), response: null }] : []);
      };
      await mount(ClientPqr);
      await fill('#pqr-subject', 'Consulta de mi pedido');
      await fill('#pqr-description', 'Necesito consultar el estado de mi pedido.');
      const form = document.querySelector('form')!;
      await act(async () => { form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); });
      assert.equal(posts, 1);
      assert.equal((document.querySelector('button[type="submit"]') as HTMLButtonElement).disabled, true);
      await act(async () => release());
      assert.match(document.body.textContent!, /Podrás enviar otro en/);
      assert.equal(posts, 1);
    });
    await t.test('Cupón cotiza los productos reales y muestra descuento exacto, no un éxito falso', async () => {
      let request: unknown;
      globalThis.fetch = async (url, options) => {
        const path = String(url);
        if (path.endsWith('/config')) return json({ enabled: true });
        if (path.endsWith('/users/buyer')) return json({ phone: '3001234567', address: 'Calle 123 Bogotá' });
        if (path.endsWith('/shopping')) return json([{ productId: product.id, quantity: 2, product: { ...product, category: { name: product.category } } }]);
        if (path.endsWith('/validate')) { request = JSON.parse(String(options?.body)); return json({ code: 'ESTUCHE10', subtotal: 60000, discountAmount: 6000, shippingCost: 10000, total: 64000 }); }
        throw new Error(`Petición inesperada ${path}`);
      };
      await mount(Checkout);
      await fill('#checkout-coupon', ' estuche10 ');
      await act(async () => { [...document.querySelectorAll('button')].find(button => button.textContent === 'Aplicar')!.click(); });
      assert.deepEqual(request, { code: 'estuche10', items: [{ productId: product.id, quantity: 2 }] });
      assert.match(document.body.textContent!, /ESTUCHE10 aplicado/);
      assert.match(document.querySelector('.pago-total')!.textContent!, /64\.000/);
      assert.match(document.querySelector('.pago-linea-descuento')!.textContent!, /6\.000/);
      await fill('#checkout-coupon', 'OTRO');
      assert.ok(!document.body.textContent!.includes('ESTUCHE10 aplicado'));
    });
    await t.test('PQR idéntico histórico avisa que ya fue enviado sin hacer otro POST', async () => {
      let posts = 0;
      globalThis.fetch = async (url, options) => {
        if (options?.method === 'POST') { posts++; return json({}); }
        if (String(url).endsWith('/shopping')) return json([]);
        return json([{ id: 'old', type: 'petition', subject: 'Consulta de mi pedido', description: 'Necesito consultar el estado de mi pedido.', status: 'received', createdAt: new Date(Date.now() - 120000).toISOString(), response: null }]);
      };
      await mount(ClientPqr);
      await fill('#pqr-subject', 'CONSULTA   de mi pedido');
      await fill('#pqr-description', 'Necesito consultar el estado de mi pedido.');
      await act(async () => { document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); });
      assert.equal(posts, 0);
      assert.match(document.querySelector('[role="alert"]')!.textContent!, /Ya enviaste este PQR/);
    });
    await t.test('Una respuesta tardía del cupón no se aplica si el cliente cambió el código', async () => {
      let release!: (value: Response) => void;
      globalThis.fetch = async url => {
        const path = String(url);
        if (path.endsWith('/config')) return json({ enabled: true });
        if (path.endsWith('/users/buyer')) return json({ phone: '3001234567', address: 'Calle 123 Bogotá' });
        if (path.endsWith('/shopping')) return json([{ productId: product.id, quantity: 2, product: { ...product, category: { name: product.category } } }]);
        if (path.endsWith('/validate')) return new Promise<Response>(resolve => { release = resolve; });
        throw new Error(path);
      };
      await mount(Checkout);
      await fill('#checkout-coupon', 'ANTERIOR');
      await act(async () => { [...document.querySelectorAll('button')].find(button => button.textContent === 'Aplicar')!.click(); });
      await fill('#checkout-coupon', 'NUEVO');
      await act(async () => release(json({ code: 'ANTERIOR', subtotal: 60000, discountAmount: 6000, shippingCost: 10000, total: 64000 })));
      assert.ok(!document.body.textContent!.includes('ANTERIOR aplicado'));
      assert.match(document.querySelector('.pago-total')!.textContent!, /70\.000/);
    });
    await t.test('Devolución de un pedido entregado permite elegir producto y no duplica un doble envío', async () => {
      let posts = 0; let release!: () => void;
      const orderId = '22222222-2222-4222-8222-222222222222';
      globalThis.fetch = async (url, options) => {
        const path = String(url);
        if (options?.method === 'POST') { posts++; await new Promise<void>(resolve => { release = resolve; }); return json({ id: 'return-id' }, 201); }
        if (path.endsWith('/shopping')) return json([]);
        if (path.endsWith('/orders')) return json([{ id: orderId, status: 'delivered' }]);
        if (path.endsWith(`/orders/${orderId}`)) return json({ id: orderId, status: 'delivered', details: [{ productId: product.id, quantity: 2, product: { name: product.name } }] });
        return json([]);
      };
      await mount(Returns);
      await act(async () => { const select = document.querySelector('select')!; select.value = orderId; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
      await act(async () => { const select = document.querySelectorAll('select')[1]; select.value = product.id; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
      await fill('textarea', 'El producto llegó defectuoso');
      await act(async () => { const form = document.querySelector('form')!; form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); });
      assert.equal(posts, 1);
      await act(async () => release());
      assert.match(document.querySelector('[role="status"]')!.textContent!, /Recibimos tu solicitud/);
    });
    await t.test('Header y Mi cuenta conservan accesos del cliente y devoluciones', async () => {
      globalThis.fetch = async () => json([]);
      function Navigation() { return h('div', null, h(Header), h(AccountNav)); }
      await mount(Navigation);
      const header = document.querySelector('header')!;
      for (const target of ['/Contacto', '/mis-pedidos', '/cliente/pqr']) assert.ok(header.querySelector(`a[href="${target}"]`), `Falta ${target} en el encabezado`);
      const nav = document.querySelector('.account-nav')!;
      for (const target of ['/Contacto', '/mis-pedidos', '/cliente/pqr', '/mis-devoluciones']) assert.ok(nav.querySelector(`a[href="${target}"]`));
    });
    await t.test('Empleado y repartidor no cargan ni modifican el carrito y no ven enlaces públicos restringidos', async () => {
      let requests = 0;
      globalThis.fetch = async () => { requests++; return json([]); };
      for (const role of ['employee', 'delivery']) {
        user.role = role;
        await mount(Header);
        const header = document.querySelector('header')!;
        for (const target of ['/Contacto', '/Nosotros']) assert.ok(!header.querySelector(`a[href="${target}"]`));
        assert.ok(!header.querySelector('.cart-btn'));
        await act(async () => { assert.equal(await cart.add(product), false); assert.equal(await cart.clear(), false); });
        assert.equal(cart.totalItems, 0);
      }
      assert.equal(requests, 0);
      user.role = 'client';
    });
    await t.test('Devoluciones tiene estado vacío y no ofrece pedidos que aún no se entregaron', async () => {
      globalThis.fetch = async url => String(url).endsWith('/orders') ? json([{ id: 'order', status: 'paid' }]) : json([]);
      await mount(Returns);
      assert.match(document.body.textContent!, /Aún no tienes pedidos entregados/);
      assert.match(document.body.textContent!, /Todavía no has solicitado devoluciones/);
    });
  } finally {
    await act(async () => root.unmount()); await server.close(); dom.window.close();
    for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
