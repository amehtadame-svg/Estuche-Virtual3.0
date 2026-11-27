import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement as h, act } from 'react';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { MemoryRouter } = require('react-router-dom');
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const product = { id: '11111111-1111-4111-8111-111111111111', name: 'Cuaderno', price: '5000', stock: 3, deletedAt: null, category: { name: 'Cuadernos' }, images: [] };
const saved = { id: '22222222-2222-4222-8222-222222222222', productId: product.id, addedAt: null, product };

test('Favoritos: sincronización, carrito, privacidad y errores', async t => {
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'localStorage', 'fetch', 'CustomEvent', 'IS_REACT_ACT_ENVIRONMENT'];
  const original = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent, IS_REACT_ACT_ENVIRONMENT: true })) Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  const { createRoot } = await import('react-dom/client');
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const { AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  const { CartContext } = await server.ssrLoadModule('/src/context/CartContext.tsx');
  const { WishlistProvider } = await server.ssrLoadModule('/src/context/WishlistContext.tsx');
  const { default: FavoriteButton } = await server.ssrLoadModule('/src/components/wishlist/FavoriteButton.tsx');
  const { default: Wishlist } = await server.ssrLoadModule('/src/pages/Wishlist/Wishlist.tsx');
  const root = createRoot(document.getElementById('root')!);
  const lists: Record<string, unknown[]> = { ana: [], bea: [] };
  let addToCart = 0; let failNextGet = false; let postCount = 0;
  const cart = { add: async () => { addToCart++; return true; }, items: [] };
  globalThis.fetch = async (_url, options) => {
    const token = dom.window.localStorage.getItem('token') ?? '';
    const method = options?.method ?? 'GET';
    if (method === 'GET') { if (failNextGet) { failNextGet = false; throw new TypeError('offline'); } return json(lists[token] ?? []); }
    if (method === 'POST') { postCount++; lists[token] = [saved]; return json(saved, 201); }
    if (method === 'DELETE') { lists[token] = []; return new Response(null, { status: 204 }); }
    throw new Error('unexpected request');
  };
  const render = async (user: {id: string; role: string} | null, showList = false) => {
    if (user) dom.window.localStorage.setItem('token', user.id); else dom.window.localStorage.removeItem('token');
    await act(async () => { root.render(h(AuthContext.Provider, { value: { user, loading: false } }, h(CartContext.Provider, { value: cart }, h(MemoryRouter, null, h(WishlistProvider, null, h(FavoriteButton, { productId: product.id, productName: product.name, className: 'heart-one' }), h(FavoriteButton, { productId: product.id, productName: product.name, className: 'heart-two' }), showList ? h(Wishlist) : null))))); });
  };
  const click = async (selector: string) => { const button = document.querySelector<HTMLButtonElement>(selector); assert.ok(button, selector); await act(async () => { button.click(); }); };
  try {
    await t.test('Ambos corazones se sincronizan y la lista comparte el estado', async () => {
      await render({ id: 'ana', role: 'client' }, true);
      assert.match(document.body.textContent!, /Tu lista está vacía/);
      await click('.heart-one');
      assert.equal(postCount, 1);
      assert.equal(document.querySelector('.heart-one')?.getAttribute('aria-pressed'), 'true');
      assert.equal(document.querySelector('.heart-two')?.getAttribute('aria-pressed'), 'true');
      assert.match(document.body.textContent!, /Cuaderno/);
    });
    await t.test('Agregar al carrito no elimina favoritos', async () => {
      await click('.wishlist-actions .ui-btn--primary');
      assert.equal(addToCart, 1);
      assert.equal(lists.ana.length, 1);
      assert.ok(document.querySelector('.wishlist-card'));
    });
    await t.test('Otra cuenta no ve la lista y la primera la recupera', async () => {
      await render({ id: 'bea', role: 'client' }, true);
      assert.match(document.body.textContent!, /Tu lista está vacía/);
      assert.equal(document.querySelector('.heart-one')?.getAttribute('aria-pressed'), 'false');
      await render({ id: 'ana', role: 'client' }, true);
      assert.equal(document.querySelector('.heart-two')?.getAttribute('aria-pressed'), 'true');
      await click('.wishlist-actions button[aria-label]');
      assert.equal(lists.ana.length, 0);
      assert.match(document.body.textContent!, /Tu lista está vacía/);
    });
    await t.test('Error de carga ofrece reintento y roles operativos no ven corazones', async () => {
      failNextGet = true;
      await render({ id: 'bea', role: 'client' }, true);
      if (!document.querySelector('[role="alert"]')) await click('.wishlist-heading button');
      assert.match(document.querySelector('[role="alert"]')!.textContent!, /No pudimos/);
      await click('[role="alert"] button');
      assert.match(document.body.textContent!, /Tu lista está vacía/);
      await render({ id: 'staff', role: 'employee' }, false);
      assert.equal(document.querySelector('.heart-one'), null);
    });
    await t.test('Un resultado tardío de otra sesión no cambia la lista actual y se bloquea el doble clic', async () => {
      await render({ id: 'ana', role: 'client' });
      const normalFetch = globalThis.fetch;
      let resolvePost!: (value: Response) => void;
      let posts = 0;
      globalThis.fetch = async (url, options) => {
        if (options?.method === 'POST') { posts++; return new Promise<Response>(resolve => { resolvePost = resolve; }); }
        return normalFetch(url, options);
      };
      const heart = document.querySelector<HTMLButtonElement>('.heart-one')!;
      await act(async () => { heart.click(); heart.click(); });
      assert.equal(posts, 1);
      await render({ id: 'bea', role: 'client' });
      assert.equal(document.querySelector('.heart-one')?.getAttribute('aria-pressed'), 'false');
      await act(async () => { resolvePost(json(saved, 201)); });
      assert.equal(document.querySelector('.heart-one')?.getAttribute('aria-pressed'), 'false');
      globalThis.fetch = normalFetch;
    });
  } finally {
    await act(async () => root.unmount()); await server.close(); dom.window.close();
    for (const [name, descriptor] of original) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
