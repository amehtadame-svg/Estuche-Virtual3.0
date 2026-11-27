import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement as h, act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { MemoryRouter } = require('react-router-dom');

test('Envíos lleva a preparación y conserva el seguimiento y la edición', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'sessionStorage', 'localStorage', 'fetch', 'IS_REACT_ACT_ENVIRONMENT', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const originals = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true, requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window) })) Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  const id = '11111111-1111-4111-8111-1234abcd5678';
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/despatches')) return new Response(JSON.stringify([{ id, orderId: id, driverId: null, address: 'Calle 1', shipDate: null, deliveredAt: null, status: 'in_transit', order: { id }, driver: null }]), { status: 200 });
    return new Response('[]', { status: 200 });
  };
  const { default: Despatch } = await server.ssrLoadModule('/src/pages/Admin/Despatch/Despatch.tsx');
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => { root.render(h(MemoryRouter, null, h(Despatch))); });
    const link = [...document.querySelectorAll('a')].find(a => a.textContent?.includes('Preparar pedidos'));
    assert.equal(link?.getAttribute('href'), '/empleado/cola');
    assert.ok(![...document.querySelectorAll('button')].some(button => button.textContent?.includes('Nuevo envío')));
    assert.match(document.body.textContent!, /tu cuenta queda como responsable de su preparación/);
    assert.match(document.body.textContent!, /el repartidor lo toma después/);
    assert.match(document.body.textContent!, /Calle 1/);
    assert.ok([...document.querySelectorAll('button')].some(button => button.textContent?.includes('Ver archivados')));
    await act(async () => { ([...document.querySelectorAll('button')].find(button => button.textContent === 'Editar') as HTMLButtonElement).click(); });
    assert.match(document.body.textContent!, /Editar envío/);
  } finally {
    await act(async () => root.unmount());
    await server.close();
    dom.window.close();
    for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
