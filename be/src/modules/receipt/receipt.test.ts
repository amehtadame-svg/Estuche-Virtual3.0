import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma';
import { receiptService } from './receipt.service';
import { HttpError } from '../../lib/errors';

const db = prisma as any;
const client = { id: 'user-1', role: 'client' };
const order = {
  id: 'order-1', customerId: client.id, total: 300,
  status: 'pending', deletedAt: null,
};

const hasStatus = (status: number) => (error: unknown) =>
  error instanceof HttpError && error.status === status;

test('El recibo propio toma cliente, total y estado del servidor', async () => {
  db.order.findUnique = async () => order;
  db.receipt.create = async ({ data }: any) => ({ id: 'r-1', ...data });
  const result = await receiptService.create({
    orderId: order.id, total: 0, employeeId: 'otro-usuario',
  }, client);
  assert.equal(result.total, 300);
  assert.equal(result.customerId, client.id);
  assert.equal(result.paymentStatus, 'pending');
  assert.equal(result.employeeId, null);
});

test('Un cliente no puede crear recibos de pedidos ajenos', async () => {
  db.order.findUnique = async () => ({ ...order, customerId: 'other' });
  await assert.rejects(
    receiptService.create({ orderId: order.id }, client), hasStatus(403),
  );
});

test('Un cliente no puede crear recibos sin pedido', async () => {
  await assert.rejects(receiptService.create({ total: 100 }, client), hasStatus(403));
});

test('No se puede crear un recibo pagado desde la petición', async () => {
  await assert.rejects(
    receiptService.create({ orderId: order.id, paymentStatus: 'paid' }, client),
    hasStatus(400),
  );
});

test('Pedido inexistente devuelve 404 al crear recibo', async () => {
  db.order.findUnique = async () => null;
  await assert.rejects(
    receiptService.create({ orderId: 'missing' }, client), hasStatus(404),
  );
});

test('Editar un recibo ligado a pedido conserva el total del servidor', async () => {
  db.receipt.findUnique = async () => ({
    id: 'r-1', orderId: order.id, customerId: client.id,
    paymentStatus: 'pending', employeeId: null, _count: { payouts: 0 },
  });
  db.order.findUnique = async () => order;
  db.receipt.update = async ({ data }: any) => ({ id: 'r-1', ...data });
  const result = await receiptService.update('r-1', { total: 0 });
  assert.equal(result.total, 300);
});

test('No se puede marcar un recibo pagado mediante edición', async () => {
  db.receipt.findUnique = async () => ({
    id: 'r-1', paymentStatus: 'pending', _count: { payouts: 0 },
  });
  await assert.rejects(
    receiptService.update('r-1', { paymentStatus: 'paid' }), hasStatus(400),
  );
});

test('Un recibo con pagos no es editable', async () => {
  db.receipt.findUnique = async () => ({
    id: 'r-1', paymentStatus: 'pending', _count: { payouts: 1 },
  });
  await assert.rejects(receiptService.update('r-1', { total: 1 }), hasStatus(409));
});

test('No se permite eliminar recibos', async () => {
  await assert.rejects(receiptService.remove('r-1'), hasStatus(409));
});
