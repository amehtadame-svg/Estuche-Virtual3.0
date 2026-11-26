import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { employeeService } from './employee.service';
import { clientService } from '../client/client.service';

// Verifica la frontera HTTP con identidades simuladas; no sustituye integración con BD.
test('Fronteras HTTP separan cliente, supervisión, empleado y repartidor', async () => {
  process.env.JWT_SECRET = 'test-role-separation-only-not-production';
  const db = prisma as any;
  const originals = { user: db.user.findUnique, list: employeeService.list, people: employeeService.people, pickups: clientService.customerPickups, despatches: db.despatch.findMany };
  db.user.findUnique = async ({ where }: any) => ({ id: where.id, role: where.id, isActive: true, deletedAt: null });
  (employeeService as any).list = async (_a: any, scope: string) => ({ scope, items: [], total: 0 });
  (employeeService as any).people = async () => [];
  (clientService as any).customerPickups = async (actor: any) => { if (actor.role !== 'client') { const e: any = new Error('Prohibido'); e.status = 403; throw e; } return []; };
  db.despatch.findMany = async () => [];
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const get = async (role: string | null, path: string) => fetch(base + path, { headers: role ? { Authorization: `Bearer ${jwt.sign({ id: role }, process.env.JWT_SECRET!)}` } : {} });
  try {
    assert.equal((await get(null, '/supervision/employees')).status, 401);
    assert.equal((await get('employee', '/supervision/employees')).status, 403);
    assert.equal((await get('admin', '/supervision/employees')).status, 200);
    assert.equal((await get('employee', '/employee/employees')).status, 404);
    assert.equal((await get('employee', '/employee/orders?scope=supervision')).status, 400);
    assert.equal((await get('admin', '/supervision/orders?scope=supervision')).status, 200);
    assert.equal((await get('client', '/client/my-pickups')).status, 200);
    assert.equal((await get('client', '/employee/my-pickups')).status, 403);
    assert.equal((await get('employee', '/delivery/despatches')).status, 403);
    assert.equal((await get('delivery', '/delivery/despatches')).status, 200);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    db.user.findUnique = originals.user; (employeeService as any).list = originals.list;
    (employeeService as any).people = originals.people; (clientService as any).customerPickups = originals.pickups;
    db.despatch.findMany = originals.despatches;
  }
});
