import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { contactService, pqrService } from './pqr.service';
import app from '../../app';

const db = prisma as any;
const actor = { id: '11111111-1111-4111-8111-111111111111', role: 'client' };
const input = { type: 'petition' as const, subject: 'Consulta de mi pedido', description: 'Necesito consultar la entrega de mi pedido.' };
let rows: any[];
let locks: string[];
beforeEach(() => {
  rows = []; locks = [];
  let pending = Promise.resolve();
  db.$transaction = (fn: any) => { const result = pending.then(() => fn(db)); pending = result.catch(() => undefined); return result; };
  db.$executeRaw = async (_sql: unknown, key: string) => { locks.push(key); return 1; };
  db.pqrRequest.findMany = async ({ where }: any) => rows.filter(row => row.customerId === where.customerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  db.pqrRequest.create = async ({ data }: any) => { const row = { id: `pqr-${rows.length}`, ...data, createdAt: new Date() }; rows.push(row); return row; };
  db.user.findUnique = async () => ({ ...actor, isActive: true, deletedAt: null });
  process.env.JWT_SECRET = 'pqr-unit-test-secret-not-for-production';
});
const status = (code: number) => (error: unknown) => error instanceof HttpError && error.status === code;

test('Dos solicitudes simultáneas del mismo PQR crean una sola fila bajo bloqueo por cliente', async () => {
  const results = await Promise.allSettled([pqrService.create(input, actor), pqrService.create(input, actor)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(rows.length, 1);
  assert.deepEqual(locks, [`pqr:${actor.id}`, `pqr:${actor.id}`]);
  assert.ok(results.some(result => result.status === 'rejected' && status(409)(result.reason)));
});
test('Bloquea el mismo contenido aunque cambien espacios/mayúsculas y haya pasado el minuto', async () => {
  await pqrService.create(input, actor);
  rows[0].createdAt = new Date(Date.now() - 120000);
  await assert.rejects(pqrService.create({ ...input, subject: '  CONSULTA   DE MI PEDIDO ', description: `  ${input.description.toUpperCase()}  ` }, actor), status(409));
  assert.equal(rows.length, 1);
});
test('Un PQR diferente exige un minuto; después del minuto se permite sin afectar a otro cliente', async () => {
  await pqrService.create(input, actor);
  await assert.rejects(pqrService.create({ ...input, subject: 'Otra solicitud diferente' }, actor), error => status(429)(error) && Number((error as HttpError).details?.retryAfter) <= 60);
  rows[0].createdAt = new Date(Date.now() - 60001);
  await pqrService.create({ ...input, subject: 'Otra solicitud diferente' }, actor);
  await pqrService.create(input, { id: 'other', role: 'client' });
  assert.equal(rows.length, 3);
});
test('HTTP: el límite persiste en servidor, informa Retry-After y mantiene duplicados en 409', async () => {
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/pqr`;
    const headers = { Authorization: `Bearer ${jwt.sign(actor, process.env.JWT_SECRET!)}`, 'Content-Type': 'application/json' };
    assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify(input) })).status, 201);
    assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify(input) })).status, 409);
    const limited = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...input, subject: 'Otro asunto distinto' }) });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('B-01: el formulario de contacto crea un PQR de petición del cliente autenticado', async () => {
  const result = await contactService.submit(
    {
      name: 'Ana Pérez',
      email: 'ana@example.com',
      topic: 'envio',
      message: 'Quisiera saber cuándo llegará mi pedido a Medellín.',
    },
    actor
  );

  assert.equal(result.status, 'received');
  const stored = rows[0];
  assert.equal(stored.type, 'petition');
  assert.equal(stored.customerId, actor.id);
  assert.equal(stored.subject, 'Envíos y entregas');
  assert.match(stored.description, /Ana Pérez/);
  assert.match(stored.description, /ana@example\.com/);
  assert.match(stored.description, /Medellín/);
});

test('B-01: un usuario que no es cliente no puede enviar el formulario de contacto', async () => {
  await assert.rejects(
    contactService.submit(
      { name: 'X', email: 'x@example.com', message: 'Mensaje de prueba suficientemente largo.' },
      { id: actor.id, role: 'employee' }
    ),
    (error: unknown) => error instanceof HttpError && error.status === 403
  );
});
