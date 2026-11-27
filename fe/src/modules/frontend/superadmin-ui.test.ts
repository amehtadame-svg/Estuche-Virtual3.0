import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h, act } from 'react';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test('Pagos y devoluciones del superadministrador', async t => {
  const names = ['window', 'document', 'navigator', 'HTMLElement', 'localStorage', 'fetch', 'CustomEvent', 'requestAnimationFrame', 'cancelAnimationFrame', 'IS_REACT_ACT_ENVIRONMENT'];
  const originals = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent, requestAnimationFrame: (fn: FrameRequestCallback) => setTimeout(fn, 0), cancelAnimationFrame: clearTimeout, IS_REACT_ACT_ENVIRONMENT: true })) Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  const { createRoot } = await import('react-dom/client');
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const { default: Payout } = await server.ssrLoadModule('/src/pages/SuperAdmin/Payout/Payout.tsx');
  const { default: Returns } = await server.ssrLoadModule('/src/pages/SuperAdmin/Returns/Returns.tsx');
  const root = createRoot(document.getElementById('root')!);
  try {
    await t.test('pagos no muestra columna ni selector de acciones', async () => {
      globalThis.fetch = async () => json([{ id: 'p1', transactionId: 't1', user: { fullName: 'Ana', email: 'ana@example.com' }, status: 'pending', gateway: 'demo', amount: 100, currency: 'COP' }]);
      await act(async () => root.render(h(Payout)));
      assert.equal(document.querySelectorAll('.tabla-pagos th').length, 8);
      assert.doesNotMatch(document.querySelector('.tabla-pagos')!.textContent!, /Acciones/);
      assert.equal(document.querySelector('.tabla-pagos select'), null);
      assert.match(document.querySelector('.tabla-pagos')!.textContent!, /Pendiente/);
    });
    await t.test('devoluciones distingue error y permite reintentar y resolver', async () => {
      let fail = true;
      const returned = { id: 'r1', status: 'requested', productCondition: 'damaged', refund: 0, quantity: 1, reason: 'Roto', requestedAt: '2026-01-01', customer: { fullName: 'Ana', email: 'ana@example.com' }, product: { name: 'Cuaderno' } };
      let patches = 0;
      globalThis.fetch = async (url, options) => {
        if (String(url).endsWith('/api/orders')) return json([]);
        if (options?.method === 'PATCH') { patches++; return json({}); }
        return fail ? json({}, 500) : json([returned]);
      };
      await act(async () => root.render(h(Returns)));
      assert.match(document.body.textContent!, /No se pudieron cargar las devoluciones/);
      assert.doesNotMatch(document.body.textContent!, /No hay devoluciones para mostrar/);
      fail = false;
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Reintentar')!.click(); });
      assert.match(document.querySelector('.tabla-devoluciones')!.textContent!, /Dañado/);
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Resolver')!.click(); });
      assert.ok(document.querySelector('[role="dialog"]'));
      assert.match(document.querySelector('[role="dialog"]')!.textContent!, /no ejecuta un reembolso/);
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Confirmar resolución')!.click(); });
      assert.equal(patches, 1);
      assert.equal(document.querySelector('[role="dialog"]'), null);
    });
  } finally {
    await act(async () => root.unmount());
    await server.close(); dom.window.close();
    for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
