import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

/**
 * C-04 — El secreto JWT se firmaba con JWT_SECRET ?? JWT_ACCESS_SECRET y se
 * verificaba solo con JWT_SECRET; el .env-example publicaba únicamente
 * JWT_ACCESS_SECRET, así que quien seguía la documentación veía fallar todas
 * las rutas protegidas con 401.
 *
 * Criterio de la auditoría: "iniciar sesión y llamar a una ruta protegida
 * funciona con el .env-example tal cual".
 */

const BE_ROOT = path.resolve(process.cwd());
const envExamplePath = path.join(BE_ROOT, '.env-example');

function secretFromEnvExample(): string {
  const content = fs.readFileSync(envExamplePath, 'utf8');
  const line = content.split('\n').find((l) => l.startsWith('JWT_SECRET='));
  assert.ok(line, 'el .env-example debe definir JWT_SECRET');
  return line.split('=')[1].trim();
}

test('C-04: el .env-example publica JWT_SECRET y no JWT_ACCESS_SECRET', () => {
  const content = fs.readFileSync(envExamplePath, 'utf8');
  assert.match(content, /^JWT_SECRET=.*$/m, 'debe existir JWT_SECRET');
  assert.doesNotMatch(content, /JWT_ACCESS_SECRET/, 'no debe quedar JWT_ACCESS_SECRET');
});

test('C-04: el código no referencia JWT_ACCESS_SECRET (firma y verificación usan la misma variable)', () => {
  for (const file of ['src/modules/auth/auth.service.ts', 'src/middlewares/auth.middleware.ts']) {
    const source = fs.readFileSync(path.join(BE_ROOT, file), 'utf8');
    assert.doesNotMatch(source, /JWT_ACCESS_SECRET/, `${file} no debe usar JWT_ACCESS_SECRET`);
    assert.match(source, /JWT_SECRET/, `${file} debe usar JWT_SECRET`);
  }
});

test('C-04: un token firmado con el secreto del .env-example pasa verifyToken', async () => {
  // Simula exactamente el flujo real con .env-example tal cual: el backend
  // carga el .env (JWT_SECRET), el login firma con ese secreto...
  const secret = secretFromEnvExample();
  process.env.JWT_SECRET = secret;

  // ...y verifyToken lo verifica con el mismo secreto (misma variable).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { verifyToken } = require('../../middlewares/auth.middleware');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { prisma } = require('../../lib/prisma') as { prisma: any };

  const token = jwt.sign({ id: 'user-1', role: 'client' }, secret, { expiresIn: '8h' });

  // Usuario activo en BD: verifyToken debe continuar con next().
  (prisma as any).user.findUnique = async () => ({
    id: 'user-1',
    isActive: true,
    deletedAt: null,
  });

  let nextCalled = false;
  const req = { headers: { authorization: `Bearer ${token}` } } as any;
  const res = {
    status: () => res,
    json: () => {},
  } as any;

  await verifyToken(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true, 'la firma es válida y el usuario está activo: debe continuar');
  assert.strictEqual((req as any).user.id, 'user-1');
});

test('C-04: un usuario inactivo recibe 401 aunque el token esté bien firmado (C-10)', async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { verifyToken } = require('../../middlewares/auth.middleware');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { prisma } = require('../../lib/prisma') as { prisma: any };

  const token = jwt.sign({ id: 'user-2', role: 'client' }, process.env.JWT_SECRET!, {
    expiresIn: '8h',
  });
  (prisma as any).user.findUnique = async () => ({ id: 'user-2', isActive: false, deletedAt: null });

  let statusCode = 0;
  const req = { headers: { authorization: `Bearer ${token}` } } as any;
  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: () => {},
  } as any;

  await verifyToken(req, res, () => {
    throw new Error('no debería continuar');
  });

  assert.strictEqual(statusCode, 401);
});
