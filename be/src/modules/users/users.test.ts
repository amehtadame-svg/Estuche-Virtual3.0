import { test } from 'node:test';
import assert from 'node:assert';
import type { NextFunction, Request, Response } from 'express';

import router from './users.routes';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';

/**
 * HU-018 · Control de usuarios y permisos.
 *
 * Verifica la matriz de permisos recorriendo las capas reales del router de
 * Express (sin base de datos ni servidor HTTP).
 */

type Layer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: { name: string; handle: unknown }[];
  };
};

const layers = (router as unknown as { stack: Layer[] }).stack.filter((l) => !!l.route);

const findRoute = (path: string, method: string) =>
  layers.find((l) => l.route!.path === path && l.route!.methods[method.toLowerCase()]);

const guardsOf = (path: string, method: string): string[] => {
  const route = findRoute(path, method);
  if (!route) throw new Error(`No existe la ruta ${method.toUpperCase()} ${path}`);
  return route.route!.stack
    .filter((s) => s.name !== 'asyncHandler' && s.name !== 'handle')
    .map((s) => (s.name === 'handle' ? 'inline' : s.name));
};

const has = (path: string, method: string, guard: string) => guardsOf(path, method).includes(guard);

test('HU-018: GET /api/users exige token y rol administrador', () => {
  assert.ok(has('/', 'GET', verifyToken.name), 'GET / debe exigir verifyToken');
  assert.ok(has('/', 'GET', verifyAdmin.name), 'GET / debe exigir verifyAdmin');
});

test('HU-018: crear usuario exige token (antes era público)', () => {
  assert.ok(has('/', 'POST', verifyToken.name));
  assert.ok(has('/', 'POST', verifyAdmin.name));
});

test('HU-018: cambiar rol exige token (antes era público)', () => {
  assert.ok(has('/:id/role', 'PATCH', verifyToken.name));
  assert.ok(has('/:id/role', 'PATCH', verifyAdmin.name));
});

test('HU-018: editar usuario exige token (antes era público)', () => {
  assert.ok(has('/:id', 'PUT', verifyToken.name));
  assert.ok(has('/:id', 'PUT', verifyAdmin.name));
});

test('HU-018: eliminar usuario exige token y ser superadmin', () => {
  assert.ok(has('/:id', 'DELETE', verifyToken.name));
  assert.ok(has('/:id', 'DELETE', 'verifySuperAdmin'));
});

test('HU-018: preview-delete exige token y ser superadmin', () => {
  assert.ok(has('/:id/preview-delete', 'GET', verifyToken.name));
  assert.ok(has('/:id/preview-delete', 'GET', 'verifySuperAdmin'));
});

test('HU-018: activar/desactivar cuenta exige token y rol administrador', () => {
  assert.ok(has('/:id/status', 'PATCH', verifyToken.name));
  assert.ok(has('/:id/status', 'PATCH', verifyAdmin.name));
});

test('HU-018: ninguna ruta de usuarios queda sin verifyToken', () => {
  const publicas: string[] = [];

  for (const layer of layers) {
    const route = layer.route!;
    for (const method of Object.keys(route.methods)) {
      const guards = guardsOf(route.path, method);
      if (!guards.includes(verifyToken.name)) {
        publicas.push(`${method.toUpperCase()} /${route.path}`);
      }
    }
  }

  assert.deepStrictEqual(publicas, [], `Rutas sin autenticación: ${publicas.join(', ')}`);
});

test('HU-018: el router expone las 9 rutas documentadas', () => {
  const registradas = layers
    .map((l) => `${Object.keys(l.route!.methods)[0].toUpperCase()} ${l.route!.path}`)
    .sort();

  assert.deepStrictEqual(registradas, [
    'DELETE /:id',
    'GET /',
    'GET /:id',
    'GET /:id/preview-delete',
    'PATCH /:id/profile',
    'PATCH /:id/role',
    'PATCH /:id/status',
    'POST /',
    'PUT /:id',
  ]);
});

test('HU-018: verifyToken rechaza petición sin cabecera Authorization', async () => {
  const req = { headers: {} } as Request;
  let status = 0;
  let body: unknown = null;

  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as Response;

  await verifyToken(req, res, (() => {
    throw new Error('no debería llamar a next()');
  }) as NextFunction);

  assert.strictEqual(status, 401);
  assert.deepStrictEqual(body, { message: 'Token requerido' });
});

test('HU-018: verifyAdmin rechaza a un usuario con rol client', () => {
  const req = { user: { id: 'u1', role: 'client' } } as unknown as Request;
  let status = 0;

  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json() {
      return this;
    },
  } as unknown as Response;

  verifyAdmin(req, res, (() => {
    throw new Error('no debería llamar a next()');
  }) as NextFunction);

  assert.strictEqual(status, 403);
});