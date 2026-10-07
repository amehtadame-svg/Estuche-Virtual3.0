import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Regresión: borrar un usuario destruía su historial.
 *
 * `userService.remove` hacía un borrado FÍSICO en cascada: se llevaba por
 * delante los pedidos del cliente, sus detalles, envíos y recibos. Al borrar
 * una cuenta se perdía toda la información de ventas y había que volver a
 * cargar datos. Ahora solo se marca `deletedAt` (borrado lógico).
 */

// eslint-disable-next-line @typescript-eslint/no-var-require
const { prisma } = require('../../lib/prisma') as { prisma: any };
import { userService } from './users.service';

const USER_ID = '00000000-0000-7000-8000-000000000001';
const SUPERADMIN = { id: 'admin-1', role: 'superadmin' };

function fakePrisma() {
  const calls: { userUpdate: any; deleted: string[]; orderDetailDeletes: number; despatchDeletes: number; receiptDeletes: number; orderDeletes: number } = {
    userUpdate: null,
    deleted: [],
    orderDetailDeletes: 0,
    despatchDeletes: 0,
    receiptDeletes: 0,
    orderDeletes: 0,
  };

  (prisma as any).user = {
    findFirst: async () => ({ id: USER_ID, email: 'cliente@estuche.com' }),
    findUnique: async () => ({ id: USER_ID, email: 'cliente@estuche.com' }),
    update: async (args: any) => {
      calls.userUpdate = args;
      return { id: USER_ID, ...args.data };
    },
    delete: async (args: any) => {
      calls.deleted.push(args.where.id);
      return { id: USER_ID };
    },
  };

  (prisma as any).order = {
    findMany: async () => [{ id: 'order-1' }],
    deleteMany: async () => {
      calls.orderDeletes += 1;
      return { count: 1 };
    },
    updateMany: async () => ({ count: 0 }),
  };
  (prisma as any).orderDetail = {
    deleteMany: async () => {
      calls.orderDetailDeletes += 1;
      return { count: 1 };
    },
  };
  (prisma as any).despatch = {
    deleteMany: async () => {
      calls.despatchDeletes += 1;
      return { count: 1 };
    },
  };
  (prisma as any).receipt = {
    deleteMany: async () => {
      calls.receiptDeletes += 1;
      return { count: 1 };
    },
  };

  return calls;
}

test('borrar un usuario hace borrado lógico, no físico', async () => {
  const calls = fakePrisma();

  await userService.remove(USER_ID, SUPERADMIN);

  assert.strictEqual(calls.deleted.length, 0, 'NO debe llamarse a user.delete');
  assert.ok(calls.userUpdate, 'debe actualizarse el usuario');
  assert.ok(calls.userUpdate.data.deletedAt instanceof Date, 'debe marcarse deletedAt');
  assert.strictEqual(calls.userUpdate.data.isActive, false, 'la cuenta queda inactiva');
});

test('borrar un usuario conserva sus pedidos, detalles, envíos y recibos', async () => {
  const calls = fakePrisma();

  await userService.remove(USER_ID, SUPERADMIN);

  assert.strictEqual(calls.orderDeletes, 0, 'los pedidos deben conservarse');
  assert.strictEqual(calls.orderDetailDeletes, 0, 'los detalles deben conservarse');
  assert.strictEqual(calls.despatchDeletes, 0, 'los envíos deben conservarse');
  assert.strictEqual(calls.receiptDeletes, 0, 'los recibos deben conservarse');
});

test('solo un superadmin puede borrar usuarios', async () => {
  fakePrisma();

  await assert.rejects(
    userService.remove(USER_ID, { id: 'x', role: 'client' }),
    (err: any) => err.status === 403
  );
  await assert.rejects(
    userService.remove(USER_ID, { id: 'x', role: 'admin' }),
    (err: any) => err.status === 403
  );
});

test('el listado de usuarios excluye las cuentas con borrado lógico', async () => {
  let where: any = null;
  fakePrisma();
  (prisma as any).user.findMany = async (args: any) => {
    where = args.where;
    return [];
  };

  await userService.list();

  assert.deepStrictEqual(where, { deletedAt: null });
});
