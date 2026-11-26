import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement as h, act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';
import type { PaymentResult } from '../../pages/Checkout/useDemoPayment';

type Hook = ReturnType<typeof import('../../pages/Checkout/useDemoPayment').useDemoPayment>;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { MemoryRouter } = require('react-router-dom');
const input = {
  method: 'nequi' as const, outcome: 'approved' as const, address: 'Calle de prueba 123',
  phone: '3001234567', items: [{ productId: '10000000-0000-0000-0000-000000000001', quantity: 2 }],
};
const key = '22222222-2222-4222-8222-222222222222';
const storageKey = 'estuche-demo-payment:buyer';
const payment = (status: PaymentResult['status'] = 'pending'): PaymentResult => ({
  reference: `DEMO-${key}`, status, method: 'nequi', amount: '25000', currency: 'COP',
  orderId: '11111111-1111-4111-8111-111111111111',
  orderStatus: status === 'approved' ? 'paid' : status === 'rejected' ? 'canceled' : 'pending',
  receiptNumber: 45, expiresAt: status === 'pending' ? new Date(Date.now() + 1800000).toISOString() : null,
});
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// DOM realista con API simulada: prueba hooks, clics y almacenamiento, no servicios bancarios.
test('Regresiones de pagos: reintentos, recuperación, consultas y pantalla de resultado', async (t) => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'sessionStorage', 'localStorage', 'fetch', 'IS_REACT_ACT_ENVIRONMENT'];
  const originals = new Map(globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const { useDemoPayment, isPaymentClosed } = await server.ssrLoadModule('/src/pages/Checkout/useDemoPayment.ts');
  const { default: Result } = await server.ssrLoadModule('/src/pages/Checkout/DemoPaymentResult.tsx');
  async function setup(saved?: PaymentResult) {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
    for (const [name, value] of Object.entries({
      window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
      HTMLElement: dom.window.HTMLElement, sessionStorage: dom.window.sessionStorage,
      localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true,
    })) Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
    if (saved) sessionStorage.setItem(storageKey, JSON.stringify({ ...input, requestKey: key }));
    const root = createRoot(document.getElementById('root')!);
    let hook: Hook;
    let fetched = saved || payment();
    let posts: { requestKey: string }[] = [];
    let failPost = false;
    let failGet = false;
    const defaultFetch: typeof fetch = async (url, options) => {
      if (String(url).endsWith('/config')) return json({ enabled: true });
      if (String(url).endsWith('/checkout')) {
        const body = JSON.parse(String(options?.body)) as { requestKey: string };
        posts.push(body);
        if (failPost) throw new TypeError('Failed to fetch');
        return json({ ...fetched, reference: `DEMO-${body.requestKey}` });
      }
      if (failGet) throw new TypeError('Failed to fetch');
      return json(fetched);
    };
    globalThis.fetch = defaultFetch;
    function Harness({ buyer = 'buyer', showResult = false }: { buyer?: string; showResult?: boolean }) {
      hook = useDemoPayment(buyer);
      return showResult && hook.result ? h(Result, {
        result: hook.result, processing: hook.processing, action: hook.action, error: hook.error,
        notice: hook.notice, lastCheckedAt: hook.lastCheckedAt,
        onRefresh: () => { void hook.refresh(); }, onResolve: (outcome: 'approved' | 'rejected') => { void hook.resolve(outcome); },
        onRetry: () => { hook.reset(); }, onLeave: () => { hook.reset(); },
      }) : h('p', null, 'Formulario disponible');
    }
    const mount = async (buyer = 'buyer', showResult = false) => {
      await act(async () => { root.render(h(MemoryRouter, null, h(Harness, { buyer, showResult }))); });
    };
    const cleanup = async () => { await act(async () => root.unmount()); dom.window.close(); };
    return { dom, root, mount, cleanup, get hook() { return hook!; }, get posts() { return posts; },
      set fetched(value: PaymentResult) { fetched = value; },
      set failPost(value: boolean) { failPost = value; }, set failGet(value: boolean) { failGet = value; },
      clearPosts() { posts = []; }, defaultFetch };
  }
  try {
    await t.test('rechazo -> reintento con referencia nueva; la sesión no queda bloqueada', async () => {
      const env = await setup();
      try {
        await env.mount();
        env.fetched = payment('rejected');
        await act(async () => { await env.hook.start(input); });
        assert.equal(env.hook.result?.status, 'rejected');
        assert.equal(sessionStorage.getItem(storageKey), null);
        await act(async () => { assert.equal(env.hook.reset(), true); });
        env.fetched = payment('approved');
        await act(async () => { await env.hook.start(input); });
        assert.equal(env.hook.result?.status, 'approved');
        assert.equal(env.posts.length, 2);
        assert.notEqual(env.posts[0].requestKey, env.posts[1].requestKey);
      } finally { await env.cleanup(); }
    });
    await t.test('comprobante rechazado de una versión anterior no bloquea otra compra al volver', async () => {
      const env = await setup(payment('rejected'));
      try {
        await env.mount();
        assert.equal(env.hook.enabled, true);
        assert.equal(env.hook.result, null);
        assert.equal(sessionStorage.getItem(storageKey), null);
        env.fetched = payment('approved');
        await act(async () => { await env.hook.start(input); });
        assert.notEqual(env.posts[0].requestKey, key);
      } finally { await env.cleanup(); }
    });
    await t.test('pendiente se recupera; no permite borrar o duplicar un intento sin resolver', async () => {
      const env = await setup(payment());
      try {
        await env.mount();
        assert.equal(env.hook.result?.status, 'pending');
        assert.equal(env.hook.reset(), false);
        assert.equal(await env.hook.start(input), null);
        assert.equal(env.posts.length, 0);
        assert.ok(sessionStorage.getItem(storageKey));
      } finally { await env.cleanup(); }
    });
    await t.test('consulta muestra carga, fecha y confirmación aunque el estado no cambie', async () => {
      const env = await setup(payment());
      try {
        await env.mount('buyer', true);
        let release!: (response: Response) => void;
        globalThis.fetch = async () => new Promise<Response>((resolve) => { release = resolve; });
        const button = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Consultar estado del pago'))!;
        await act(async () => { button.click(); });
        assert.match(document.body.textContent!, /Consultando pago/);
        assert.equal(env.hook.action, 'refresh');
        assert.equal(button.disabled, true);
        await act(async () => { release(json(payment())); });
        assert.match(document.body.textContent!, /No hay cambios/);
        assert.match(document.body.textContent!, /Última consulta/);
        assert.equal(env.hook.processing, false);
        env.fetched = payment('rejected');
        globalThis.fetch = env.defaultFetch;
        await act(async () => { await env.hook.refresh(); });
        assert.match(document.body.textContent!, /El pago fue rechazado/);
        assert.equal(sessionStorage.getItem(storageKey), null);
        await act(async () => { [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Reintentar pago'))!.click(); });
        assert.match(document.body.textContent!, /Formulario disponible/);
      } finally { await env.cleanup(); }
    });
    await t.test('fallo de consulta conserva el comprobante y permite volver a consultar', async () => {
      const env = await setup(payment());
      try {
        await env.mount();
        env.failGet = true;
        await act(async () => { await env.hook.refresh(); });
        assert.match(env.hook.error, /No se pudo conectar/);
        assert.equal(env.hook.result?.status, 'pending');
        assert.equal(env.hook.processing, false);
        env.failGet = false;
        await act(async () => { await env.hook.refresh(); });
        assert.equal(env.hook.error, '');
        assert.match(env.hook.notice, /Consulta completada/);
      } finally { await env.cleanup(); }
    });
    await t.test('corte de red y doble clic reutilizan una sola referencia, no otra compra', async () => {
      const env = await setup();
      try {
        await env.mount();
        env.failPost = true;
        await act(async () => { await Promise.all([env.hook.start(input), env.hook.start(input)]); });
        assert.equal(env.posts.length, 1);
        assert.equal(env.hook.retrying, true);
        assert.equal(env.hook.reset(), false);
        assert.ok(sessionStorage.getItem(storageKey));
        env.failPost = false;
        env.fetched = payment('approved');
        await act(async () => { await env.hook.start({ ...input, method: 'pse' }); });
        assert.equal(env.posts[0].requestKey, env.posts[1].requestKey);
        assert.equal(env.hook.result?.status, 'approved');
      } finally { await env.cleanup(); }
    });
    await t.test('validación rechazada libera el formulario; recuperar 404 reusa la referencia original', async () => {
      const env = await setup();
      try {
        await env.mount();
        globalThis.fetch = async () => json({ errors: [{ path: ['phone'], message: 'Revisa el celular.' }] }, 400);
        await act(async () => { await env.hook.start(input); });
        assert.equal(env.hook.error, 'Revisa el celular.');
        assert.equal(env.hook.retrying, false);
        assert.equal(sessionStorage.getItem(storageKey), null);
      } finally { await env.cleanup(); }
      const recovered = await setup(payment());
      try {
        globalThis.fetch = async (url) => String(url).endsWith('/config') ? json({ enabled: true }) : json({}, 404);
        await recovered.mount();
        assert.equal(recovered.hook.retrying, true);
        assert.equal(recovered.hook.reset(), false);
        globalThis.fetch = recovered.defaultFetch;
        recovered.fetched = payment('approved');
        await act(async () => { await recovered.hook.start(input); });
        assert.equal(recovered.posts[0].requestKey, key);
        assert.equal(recovered.hook.result?.status, 'approved');
      } finally { await recovered.cleanup(); }
    });
    await t.test('respuesta tardía de otra sesión no reemplaza el pago del usuario actual', async () => {
      const env = await setup();
      try {
        await env.mount();
        let release!: (response: Response) => void;
        globalThis.fetch = async (url, options) => String(url).endsWith('/checkout')
          ? new Promise<Response>((resolve) => { release = resolve; }) : env.defaultFetch(url, options);
        let operation!: Promise<PaymentResult | null>;
        await act(async () => { operation = env.hook.start(input); });
        await env.mount('buyer2');
        await act(async () => { release(json(payment('approved'))); await operation; });
        assert.equal(env.hook.result, null);
        assert.equal(env.hook.enabled, true);
        assert.equal(env.hook.processing, false);
      } finally { await env.cleanup(); }
    });
    await t.test('checkout completo: rechazo conserva carrito, reintenta aprobado y una compra nueva no muestra el resultado viejo', async () => {
      const env = await setup();
      const { AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
      const { CartProvider } = await server.ssrLoadModule('/src/context/CartContext.tsx');
      const { default: Checkout } = await server.ssrLoadModule('/src/pages/Checkout/Checkout.tsx');
      const cart = [{ productId: input.items[0].productId, quantity: 2, product: { name: 'Cuaderno de prueba', price: '12500', category: { name: 'Cuadernos' } } }];
      let serverCart = [...cart];
      const posted: { requestKey: string; outcome: PaymentResult['status'] }[] = [];
      let currentPayment = payment();
      let deleteCalls = 0;
      globalThis.fetch = async (url, options) => {
        const path = String(url);
        if (options?.method === 'DELETE') { deleteCalls++; return json({}); }
        if (path.endsWith('/config')) return json({ enabled: true });
        if (path.endsWith('/users/buyer')) return json({ phone: input.phone, address: input.address });
        if (path.endsWith('/shopping')) return json(serverCart);
        if (path.endsWith('/checkout')) {
          const body = JSON.parse(String(options?.body)) as { requestKey: string; outcome: PaymentResult['status'] };
          posted.push(body);
          currentPayment = { ...payment(body.outcome), reference: `DEMO-${body.requestKey}` };
          serverCart = body.outcome === 'rejected' ? [...cart] : [];
          return json(currentPayment);
        }
        if (path.endsWith('/resolve')) {
          currentPayment = { ...currentPayment, ...payment('rejected') };
          serverCart = [...cart];
          return json(currentPayment);
        }
        return json(currentPayment);
      };
      const mountCheckout = async (visit: string) => {
        await act(async () => { env.root.render(h(MemoryRouter, { key: visit },
          h(AuthContext.Provider, { value: { user: { id: 'buyer', name: 'Cliente', role: 'client' }, loading: false } },
            h(CartProvider, null, h(Checkout))))); });
      };
      const choose = async (outcome: string) => { await act(async () => {
        const select = document.querySelector('#demo-outcome') as HTMLSelectElement;
        assert.ok(select);
        select.value = outcome;
        select.dispatchEvent(new env.dom.window.Event('change', { bubbles: true }));
      }); };
      const click = async (text: string) => { await act(async () => {
        const button = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes(text));
        assert.ok(button, `Falta el botón ${text}`);
        assert.equal(button.disabled, false);
        button.click();
      }); };
      try {
        await mountCheckout('first');
        await choose('rejected');
        await click('Simular pago por');
        assert.match(document.body.textContent!, /El pago fue rechazado/);
        assert.equal(serverCart.length, 1);
        await click('Reintentar pago');
        assert.match(document.body.textContent!, /Cuaderno de prueba/);
        assert.equal((document.querySelector('#demo-outcome') as HTMLSelectElement).value, 'approved');
        await click('Simular pago por');
        assert.match(document.body.textContent!, /Tu pago fue aprobado/);
        assert.notEqual(posted[0].requestKey, posted[1].requestKey);
        assert.equal(serverCart.length, 0);
        assert.equal(deleteCalls, 0, 'No borrar el carrito desde frontend después de que el backend ya lo sincronizó');
        serverCart = [...cart];
        await mountCheckout('next-visit');
        assert.ok(document.querySelector('#demo-outcome'));
        assert.doesNotMatch(document.body.textContent!, /Tu pago fue aprobado/);
        await choose('pending');
        await click('Simular pago por');
        assert.match(document.body.textContent!, /Tu pago está pendiente/);
        await click('Simular rechazo');
        await click('Reintentar pago');
        assert.match(document.body.textContent!, /Cuaderno de prueba/);
        assert.equal(serverCart[0].quantity, 2);
      } finally { await env.cleanup(); }
    });
    await t.test('vencimiento bloquea simulación, pero permite comenzar otra compra sin fingir aprobación', () => {
      assert.equal(isPaymentClosed(payment()), false);
      assert.equal(isPaymentClosed({ ...payment(), expiresAt: new Date(0).toISOString() }), true);
      assert.equal(isPaymentClosed(payment('rejected')), true);
    });
  } finally {
    await server.close();
    for (const name of globals) {
      const descriptor = originals.get(name);
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
