import { test } from 'node:test';
import assert from 'node:assert';

// Misma técnica que orders.test.ts: se simula el singleton de Prisma.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('../../lib/prisma') as { prisma: any };
import { receiptService } from './receipt.service';
import { HttpError } from '../../lib/errors';

test('C-02: el total de un recibo ligado a un pedido sale del pedido en BD (ignora total: 0)', async () => {
  (prisma as any).order.findUnique = async () => ({ id: 'order-1', total: 300 });
  let created: any;
  (prisma as any).receipt.create = async (args: any) => {
    created = args;
    return { id: 'r-1', ...args.data };
  };

  const receipt = await receiptService.create({
    customerId: 'user-1',
    orderId: 'order-1',
    total: 0, // el cliente manda 0; debe persistir 300
    paymentStatus: 'pending',
  });

  assert.strictEqual(receipt.total, 300);
  assert.strictEqual(created.data.total, 300);
});

test('C-02: actualizar un recibo con pedido ignora el total enviado por el cliente', async () => {
  (prisma as any).receipt.findUnique = async () => ({ id: 'r-1', orderId: 'order-1' });
  (prisma as any).order.findUnique = async () => ({ id: 'order-1', total: 300 });
  let updated: any;
  (prisma as any).receipt.update = async (args: any) => {
    updated = args;
    return { id: 'r-1', ...args.data };
  };

  const receipt = await receiptService.update('r-1', { total: 0, paymentStatus: 'paid' });

  assert.strictEqual(receipt.total, 300, 'el total debe seguir siendo el del pedido');
  assert.strictEqual(updated.data.paymentStatus, 'paid', 'el estado sí se actualiza');
});

test('C-02: recibo con pedido inexistente responde 404', async () => {
  (prisma as any).order.findUnique = async () => null;

  await assert.rejects(
    receiptService.create({ orderId: 'order-x' }),
    (err: HttpError) => err.status === 404
  );
});
