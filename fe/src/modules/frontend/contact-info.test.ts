import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement as h, act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { MemoryRouter } = require('react-router-dom');

test('Encabezado y datos de contacto del cliente', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'sessionStorage', 'localStorage', 'IS_REACT_ACT_ENVIRONMENT'];
  const originals = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true })) Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  const { AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  const { CartContext } = await server.ssrLoadModule('/src/context/CartContext.tsx');
  const { default: Header } = await server.ssrLoadModule('/src/components/layout/Header.tsx');
  const { default: Footer } = await server.ssrLoadModule('/src/components/layout/Footer.tsx');
  const { default: Contact } = await server.ssrLoadModule('/src/pages/Contact/Contact.tsx');
  const root = createRoot(document.getElementById('root')!);
  try {
    const user = { id: 'cliente', name: 'Cliente', email: 'cliente@example.com', role: 'client' };
    await act(async () => root.render(h(AuthContext.Provider, { value: { user, loading: false } }, h(CartContext.Provider, { value: { totalItems: 0 } }, h(MemoryRouter, null, h(Header), h(Contact), h(Footer))))));
    assert.equal(document.querySelector('[aria-label="Buscar productos"]'), null);
    assert.ok(document.querySelector('a[href="/catalogo"]'), 'El acceso al catálogo se conserva');
    assert.equal(document.querySelector('[aria-label="Instagram de Estuche Virtual"]')?.getAttribute('href'), 'https://www.instagram.com/cfazz_384/');
    assert.equal(document.querySelector('[aria-label="Facebook de Estuche Virtual"]')?.getAttribute('href'), 'https://www.facebook.com/miguelstevechaconramirez/');
    assert.equal(document.querySelector('[aria-label="WhatsApp de Estuche Virtual"]')?.getAttribute('href'), 'https://wa.me/573219276622');
    assert.equal(document.querySelectorAll('a[href="mailto:estuchevirtual272@gmail.com"]').length, 2);
    assert.equal((document.body.textContent!.match(/\+57 321 927 6622/g) ?? []).length, 2);
    assert.ok(document.querySelector('form.contacto-campos'), 'El formulario PQR sigue visible');
  } finally {
    await act(async () => root.unmount());
    await server.close();
    dom.window.close();
    for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
