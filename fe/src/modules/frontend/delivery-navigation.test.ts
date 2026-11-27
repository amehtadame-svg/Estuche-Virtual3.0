import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement as h, act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { MemoryRouter } = require('react-router-dom');

test('El catálogo no aparece en el menú de repartidor y se conserva para clientes', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'sessionStorage', 'localStorage', 'IS_REACT_ACT_ENVIRONMENT'];
  const originals = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true })) Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  const { AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  const { CartContext } = await server.ssrLoadModule('/src/context/CartContext.tsx');
  const { default: Header } = await server.ssrLoadModule('/src/components/layout/Header.tsx');
  const root = createRoot(document.getElementById('root')!);
  async function render(role: string | null) {
    const user = role ? { id: 'u', name: 'Usuario', email: 'test@example.com', role } : null;
    await act(async () => { root.render(h(AuthContext.Provider, { value: { user, loading: false } }, h(CartContext.Provider, { value: { totalItems: 0 } }, h(MemoryRouter, null, h(Header))))); });
  }
  try {
    await render('delivery');
    assert.equal(document.querySelector('nav[aria-label="Navegación principal"] a[href="/catalogo"]'), null);
    assert.ok(document.querySelector('nav a[href="/repartidor"]'));
    await render('client');
    assert.ok(document.querySelector('nav a[href="/catalogo"]'));
    await render(null);
    assert.ok(document.querySelector('nav a[href="/catalogo"]'));
    await render('employee');
    assert.ok(document.querySelector('nav a[href="/catalogo"]'));
  } finally {
    await act(async () => root.unmount());
    await server.close();
    dom.window.close();
    for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
