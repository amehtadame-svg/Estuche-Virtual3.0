import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement as h, act, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { MemoryRouter } = require('react-router-dom');
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test('Experiencia de empleado y repartidor', async t => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, legacy: { proxySsrExternalModules: true } });
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'sessionStorage', 'localStorage', 'fetch', 'IS_REACT_ACT_ENVIRONMENT', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const original = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true, requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window) })) Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  const { AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  const { CartContext } = await server.ssrLoadModule('/src/context/CartContext.tsx');
  const { default: Header } = await server.ssrLoadModule('/src/components/layout/Header.tsx');
  const { default: CatalogPicker } = await server.ssrLoadModule('/src/pages/Employee/ProductCatalogPicker.tsx');
  const { default: Delivery } = await server.ssrLoadModule('/src/pages/Delivery/DeliveryWorkspace.tsx');
  const { default: EmployeeWorkspace } = await server.ssrLoadModule('/src/pages/Employee/EmployeeWorkspace.tsx');
  const { default: SupportPanel } = await server.ssrLoadModule('/src/pages/Support/SupportPanel.tsx');
  const { default: AdminUsers } = await server.ssrLoadModule('/src/pages/Admin/Users/AdminUsers.tsx');
  const root = createRoot(document.getElementById('root')!);
  const mount = async (component: ReactElement, role: string | null = 'employee', path = '/') => {
    const user = role ? { id: role, role, name: 'Prueba', email: 'demo@example.test' } : null;
    await act(async () => root.render(h(AuthContext.Provider, { value: { user, loading: false } }, h(CartContext.Provider, { value: { items: [], totalItems: 0, add: () => {} } }, h(MemoryRouter, { key: Math.random(), initialEntries: [path] }, component)))));
  };
  try {
    await t.test('Carrito visible para cliente y visitante, oculto para empleado y repartidor', async () => {
      for (const role of ['employee', 'delivery']) {
        await mount(h(Header), role);
        assert.equal(document.querySelector('[aria-label="Ver carrito"]'), null);
        assert.equal(document.querySelector('a[href="/Nosotros"]'), null);
        assert.equal(document.querySelector('a[href="/Contacto"]'), null);
      }
      for (const role of ['client', null]) {
        await mount(h(Header), role);
        assert.ok(document.querySelector('[aria-label="Ver carrito"]'));
      }
    });
    await t.test('Catálogo emergente muestra fotos, filtra por nombre y selecciona productos', async () => {
      let pickedId = '';
      globalThis.fetch = async () => json([{ id: 'a', name: 'Cuaderno azul', price: 12000, stock: 4, images: [{ url: 'https://example.test/cuaderno.jpg', isPrimary: true }] }, { id: 'b', name: 'Lápiz rojo', price: 1000, stock: 2 }]);
      await mount(h(CatalogPicker, { forOrder: true, onSelect: (product: { id: string }) => { pickedId = product.id; } }));
      await act(async () => { (document.querySelector('button') as HTMLButtonElement).click(); });
      assert.ok(document.querySelector('[role="dialog"]'));
      assert.equal(document.querySelector('img')?.getAttribute('src'), 'https://example.test/cuaderno.jpg');
      assert.match(document.body.textContent!, /Cuaderno azul/);
      const input = document.querySelector('input[type="search"]') as HTMLInputElement;
      await act(async () => {
        const propsKey = Object.keys(input).find(key => key.startsWith('__reactProps$'))!;
        (input as unknown as Record<string, { onChange: (event: { target: { value: string } }) => void }>)[propsKey].onChange({ target: { value: 'Lápiz' } });
      });
      assert.match(document.body.textContent!, /Lápiz rojo/);
      assert.doesNotMatch(document.body.textContent!, /Cuaderno azul/);
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Seleccionar')!.click(); });
      assert.equal(pickedId, 'b');
      assert.equal(document.querySelector('[role="dialog"]'), null);
    });
    await t.test('Repartidor toma un pendiente y ve los datos en sus entregas', async () => {
      let assigned = false;
      let confirmed = false;
      dom.window.confirm = () => true;
      globalThis.fetch = async (url, options) => {
        const path = String(url);
        if (path.includes('/pending-orders/') && options?.method === 'POST') { assigned = true; return json({ id: 'shipment' }); }
        if (path.endsWith('/despatches/shipment/confirm') && options?.method === 'POST') { confirmed = true; return json({}); }
        if (path.endsWith('/pending-orders')) return json(assigned ? [] : [{ id: '11111111-1111-4111-8111-1234abcd5678', orderDate: '2026-11-26', itemCount: 1 }]);
        if (path.endsWith('/despatches')) return json(assigned && !confirmed ? [{ id: 'shipment', address: 'Calle 123', order: { id: '11111111-1111-4111-8111-1234abcd5678', customer: { fullName: 'Cliente Prueba', phone: '300' } } }] : []);
        return json({}, 404);
      };
      await mount(h(Delivery), 'delivery');
      assert.match(document.body.textContent!, /Pedidos pendientes/);
      assert.doesNotMatch(document.body.textContent!, /Calle 123/);
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Tomar pedido')!.click(); });
      assert.match(document.body.textContent!, /Mis entregas/);
      assert.match(document.body.textContent!, /Calle 123/);
      assert.ok([...document.querySelectorAll('button')].some(b => b.textContent === 'Confirmar entrega'));
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Confirmar entrega')!.click(); });
      assert.equal(confirmed, true);
      assert.match(document.body.textContent!, /Entrega confirmada/);
    });

    await t.test('Repartidor distingue fallo de carga y permite volver a consultar', async () => {
      let fail = true;
      globalThis.fetch = async () => fail ? json({ message: 'Error de conexión' }, 500) : json([]);
      await mount(h(Delivery), 'delivery');
      assert.ok(document.querySelector('[role="alert"]'));
      assert.doesNotMatch(document.body.textContent!, /No hay pedidos disponibles/);
      fail = false;
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Actualizar')!.click(); });
      assert.match(document.body.textContent!, /No hay pedidos disponibles/);
      assert.match(document.body.textContent!, /No tienes entregas asignadas/);
    });
    await t.test('Usuarios de administración filtran sin exponer roles adicionales y usan diálogo accesible', async () => {
      let fail = true;
      globalThis.fetch = async () => fail ? json({}, 500) : json([
        { id: '1', fullName: 'Ana Cliente', email: 'ana@test.co', role: 'client', isActive: true },
        { id: '2', fullName: 'Mario Empleado', email: 'mario@test.co', role: 'employee', isActive: true },
        { id: '3', fullName: 'Cuenta privada', email: 'privado@test.co', role: 'superadmin', isActive: true },
      ]);
      await mount(h(AdminUsers), 'admin');
      assert.match(document.body.textContent!, /No se pudo cargar la lista de usuarios/);
      fail = false;
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Reintentar')!.click(); });
      assert.match(document.querySelector('.usuarios-table')!.textContent!, /Ana Cliente/);
      assert.doesNotMatch(document.querySelector('.usuarios-table')!.textContent!, /Cuenta privada/);
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Empleado')!.click(); });
      assert.match(document.querySelector('.usuarios-table')!.textContent!, /Mario Empleado/);
      assert.doesNotMatch(document.querySelector('.usuarios-table')!.textContent!, /Ana Cliente/);
      const search = document.querySelector('input[aria-label="Buscar usuarios"]')!;
      const key = Object.keys(search).find(k => k.startsWith('__reactProps$'))!;
      await act(async () => { (search as unknown as Record<string, { onChange: (event: { target: { value: string } }) => void }>)[key].onChange({ target: { value: 'nadie' } }); });
      assert.match(document.querySelector('.usuarios-table')!.textContent!, /No se encontraron usuarios/);
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Nuevo usuario'))!.click(); });
      assert.ok(document.querySelector('[role="dialog"]'));
      assert.deepEqual([...document.querySelectorAll('#admin-user-role option')].map(option => (option as HTMLOptionElement).value), ['client', 'employee']);
      await act(async () => { (document.querySelector('[aria-label="Cerrar ventana"]') as HTMLButtonElement).click(); });
      assert.equal(document.querySelector('[role="dialog"]'), null);
    });
    await t.test('Empacar muestra imagen, confirma el producto y finaliza solo al completar', async () => {
      let picked = 0;
      let packed = false;
      const id = '11111111-1111-4111-8111-1234abcd5678';
      const job = () => ({ id, total: '1000', status: 'preparing', fulfillmentMethod: 'pickup', orderDate: '2026-11-26', customer: { fullName: 'Prueba' }, work: { status: packed ? 'packed' : 'picking', assigneeId: 'employee', assignee: { fullName: 'Empleado' } }, details: [{ id: 'line', quantity: 2, pickedQuantity: picked, product: { name: 'Cuaderno azul', images: [{ url: 'https://example.test/foto.png', isPrimary: true }] } }], events: [], shipments: [] });
      globalThis.fetch = async (url, options) => {
        const path = String(url);
        if (path.endsWith('/summary')) return json({ available: 0, picking: 1, packed: 0, blocked: 0, lowStock: [], recent: [], supervisor: false, paymentSimulation: false });
        if (path.includes('/orders?scope=')) return json({ items: [job()], total: 1 });
        if (path.endsWith('/picking') && options?.method === 'PATCH') { picked = JSON.parse(String(options.body)).items[0].pickedQuantity; return json({ message: 'Guardado' }); }
        if (path.endsWith('/pack') && options?.method === 'POST') { packed = true; return json({ message: 'Empacado' }); }
        if (path.endsWith(`/orders/${id}`)) return json(job());
        return json({}, 404);
      };
      await mount(h(EmployeeWorkspace), 'employee', '/empleado/pedidos');
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Empacar')!.click(); });
      assert.equal(document.querySelector('.emp-pack-item img')?.getAttribute('src'), 'https://example.test/foto.png');
      const finish = () => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Finalizar empacado')!;
      assert.equal(finish().disabled, true);
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Confirmar producto')!.click(); });
      assert.equal(picked, 2);
      assert.equal(finish().disabled, false);
      await act(async () => { finish().click(); });
      assert.equal(packed, true);
    });
    await t.test('Ayuda interna permite crear una solicitud', async () => {
      const creator = { id: 'employee', fullName: 'Empleado', role: 'employee' };
      let created = false;
      globalThis.fetch = async (url, options) => {
        if (options?.method === 'POST') { created = true; return json({ id: 'thread', subject: 'Ayuda turno', creator, messages: [{ id: 'one', body: 'Necesito apoyo', createdAt: '2026-11-26', sender: creator }] }, 201); }
        if (String(url).endsWith('/threads')) return json(created ? [{ id: 'thread', subject: 'Ayuda turno', creator, updatedAt: '2026-11-26', _count: { messages: 1 } }] : []);
        return json({}, 404);
      };
      await mount(h(SupportPanel), 'employee');
      const change = (input: Element, value: string) => {
        const key = Object.keys(input).find(k => k.startsWith('__reactProps$'))!;
        (input as unknown as Record<string, { onChange: (event: { target: { value: string } }) => void }>)[key].onChange({ target: { value } });
      };
      await act(async () => { change(document.querySelector('input')!, 'Ayuda turno'); change(document.querySelector('textarea')!, 'Necesito apoyo'); });
      await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Enviar solicitud')!.click(); });
      assert.equal(created, true);
      assert.match(document.body.textContent!, /Solicitud enviada/);
      assert.match(document.body.textContent!, /Necesito apoyo/);
    });
  } finally {
    await act(async () => root.unmount());
    await server.close(); dom.window.close();
    for (const [name, descriptor] of original) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
