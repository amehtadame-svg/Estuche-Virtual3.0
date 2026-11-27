import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { supportService } from './support.service';
import { newThreadSchema, replySchema } from './support.schema';

const db = prisma as any;
const employee = { id: 'one', role: 'employee' };
const other = { id: 'two', role: 'employee' };
const admin = { id: 'boss', role: 'admin' };
const superadmin = { id: 'super', role: 'superadmin' };
const denied = (status: number) => (err: unknown) => err instanceof HttpError && err.status === status;
let threads: any[];
beforeEach(() => {
  threads = [];
  db.$transaction = async (fn: any) => fn(db);
  db.supportThread.create = async ({ data }: any) => { const t = { id: 'thread-1', creatorId: data.creatorId, subject: data.subject, messages: [{ ...data.messages.create }] }; threads.push(t); return t; };
  db.supportThread.findMany = async ({ where }: any) => threads.filter(t => !where.creatorId || t.creatorId === where.creatorId);
  db.supportThread.findFirst = async ({ where }: any) => threads.find(t => t.id === where.id && (!where.creatorId || t.creatorId === where.creatorId)) ?? null;
  db.supportThread.update = async ({ where }: any) => threads.find(t => t.id === where.id);
  db.supportMessage.create = async ({ data }: any) => { const t = threads.find(t => t.id === data.threadId); t.messages.push(data); return data; };
});

test('Esquemas de ayuda validan campos y evitan destinatarios arbitrarios', () => {
  assert.equal(newThreadSchema.safeParse({ subject: 'Ayuda', body: 'Necesito ayuda' }).success, true);
  assert.equal(newThreadSchema.safeParse({ subject: 'Ayuda', body: 'hola' }).success, false);
  assert.equal(newThreadSchema.safeParse({ subject: 'Ayuda', body: 'Necesito ayuda', recipientId: 'otro' }).success, false);
  assert.equal(replySchema.safeParse({ body: 'Gracias' }).success, true);
  assert.equal(replySchema.safeParse({ body: 'x'.repeat(2001) }).success, false);
});

test('Empleado y administradores conversan; otros empleados y roles no ven la solicitud', async () => {
  const t = await supportService.create('Ayuda', 'Necesito ayuda', employee);
  assert.equal((await supportService.list(employee)).length, 1);
  assert.equal((await supportService.list(admin)).length, 1);
  assert.equal((await supportService.list(superadmin)).length, 1);
  assert.equal((await supportService.list(other)).length, 0);
  await assert.rejects(supportService.get(t.id, other), denied(404));
  await assert.rejects(supportService.reply(t.id, 'Mensaje ajeno', other), denied(404));
  await assert.rejects(supportService.list({ id: 'client', role: 'client' }), denied(403));
  await assert.rejects(supportService.list({ id: 'driver', role: 'delivery' }), denied(403));
  await assert.rejects(supportService.create('Ayuda', 'Mensaje de admin', admin), denied(403));
  await supportService.reply(t.id, 'Estamos revisando', admin);
  await supportService.reply(t.id, 'Gracias por responder', employee);
  const thread = await supportService.get(t.id, superadmin);
  assert.equal(thread.messages.length, 3);
  assert.equal(thread.messages[1].senderId, admin.id);
  assert.equal(thread.messages[2].senderId, employee.id);
});
