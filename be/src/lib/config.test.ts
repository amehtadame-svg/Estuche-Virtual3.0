import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { loadConfig, ConfigError } from './config';

/**
 * Tests unitarios de la validación de arranque (sección B:
 * "validar configuración y conexión a BD al iniciar").
 */

test('config: sin variables obligatorias lanza ConfigError con ambos mensajes', () => {
  assert.throws(
    () => loadConfig({}),
    (error: unknown) => {
      assert.ok(error instanceof ConfigError);
      assert.match(error.message, /DATABASE_URL/);
      assert.match(error.message, /JWT_SECRET/);
      return true;
    },
  );
});

test('config: DATABASE_URL con esquema distinto a postgres es rechazada', () => {
  assert.throws(
    () =>
      loadConfig({
        DATABASE_URL: 'mysql://user:pass@host/db',
        JWT_SECRET: 'x'.repeat(40),
      }),
    (error: unknown) => {
      assert.ok(error instanceof ConfigError);
      assert.match(error.message, /postgresql:\/\//);
      return true;
    },
  );
});

test('config: JWT_SECRET con menos de 32 caracteres es rechazado', () => {
  assert.throws(
    () =>
      loadConfig({
        DATABASE_URL: 'postgresql://user:pass@host:5432/db',
        JWT_SECRET: 'secreto-corto',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ConfigError);
      assert.match(error.message, /32/);
      return true;
    },
  );
});

test('config: PORT inválido es rechazado', () => {
  assert.throws(
    () =>
      loadConfig({
        DATABASE_URL: 'postgresql://user:pass@host:5432/db',
        JWT_SECRET: 'x'.repeat(40),
        PORT: 'no-numero',
      }),
    ConfigError,
  );
});

test('config: valores válidos producen la configuración esperada', () => {
  const config = loadConfig({
    DATABASE_URL: 'postgresql://user:pass@host:5432/db',
    JWT_SECRET: 'x'.repeat(40),
    PORT: '4100',
    CORS_ORIGINS: 'http://localhost:5173, http://otro:5173',
    NODE_ENV: 'production',
  });

  assert.equal(config.port, 4100);
  assert.equal(config.nodeEnv, 'production');
  assert.deepEqual(config.corsOrigins, [
    'http://localhost:5173',
    'http://otro:5173',
  ]);
});

test('health: GET /api/health responde 200 con status ok (sin auth)', async () => {
  // El endpoint no toca la BD, así que funciona también sin base.
  const app = require('../app').default;
  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      status: string;
      service: string;
      uptimeSeconds: number;
    };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'estuche-virtual-api');
    assert.ok(typeof body.uptimeSeconds === 'number');
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
