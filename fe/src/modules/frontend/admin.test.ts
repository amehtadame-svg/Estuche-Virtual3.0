import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('Los formularios administrativos aceptan teléfonos de 10 dígitos con indicativo', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { splitPhone, validPhone } = await server.ssrLoadModule('/src/lib/phone.ts');
    assert.deepEqual(splitPhone('+57 3001234567'), { code: '57', number: '3001234567' });
    assert.deepEqual(splitPhone('3001234567'), { code: '57', number: '3001234567' });
    for (const value of ['', '3001234567', '+57 3001234567', '+1 3475551234']) assert.equal(validPhone(value), true);
    for (const value of ['+57300123', 'abc3001234567', '+573001234567']) assert.equal(validPhone(value), false);
  } finally { await server.close(); }
});

test('El campo telefónico conserva el indicativo separado y solo admite diez números', async () => {
  const { JSDOM } = await import('jsdom');
  const { createElement: h, act, useState } = await import('react');
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', legacy: { proxySsrExternalModules: true } });
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const names = ['window', 'document', 'navigator', 'HTMLElement', 'IS_REACT_ACT_ENVIRONMENT'];
  const original = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  const { createRoot } = await import('react-dom/client');
  const { default: PhoneInput } = await server.ssrLoadModule('/src/components/ui/PhoneInput.tsx');
  const root = createRoot(document.getElementById('root')!);
  function Form() { const [value, setValue] = useState(''); return h('div', null, h(PhoneInput, { value, onChange: setValue }), h('output', null, value)); }
  try {
    await act(async () => { root.render(h(Form)); });
    const phone = document.querySelector<HTMLInputElement>('[aria-label="Número de teléfono"]')!;
    assert.equal(phone.maxLength, 10);
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => { setter.call(phone, '30a0123456789'); phone.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
    assert.equal(phone.value, '3001234567');
    assert.equal(document.querySelector('output')?.textContent, '+57 3001234567');
  } finally {
    await act(async () => root.unmount());
    await server.close(); dom.window.close();
    for (const [name, descriptor] of original) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
