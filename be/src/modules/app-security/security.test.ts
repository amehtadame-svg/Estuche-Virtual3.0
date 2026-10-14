import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

/**
 * C-06 — CORS abierto, sin cabeceras de seguridad y sin rate limiting.
 *   RNF-001.3: máx. 10 req/15 min por IP en /api/auth (configurable por env).
 *   RNF-001.4: CORS con orígenes explícitos, nunca comodín en producción.
 */

// Configuración de prueba: debe setearse ANTES de importar la app.
process.env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:3000';
process.env.RATE_LIMIT_MAX = '2';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.JWT_SECRET = 'test-secret-min-32-characters-long!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../../app').default;

let server: Server;
let base: string;

before(async () => {
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

after(() => new Promise<void>((resolve) => server.close(() => resolve())));

test('C-06/RNF-001.4: un origen de la lista blanca recibe Access-Control-Allow-Origin', async () => {
  const res = await fetch(base + '/api/products', {
    headers: { Origin: 'http://localhost:5173' },
  });
  assert.strictEqual(
    res.headers.get('access-control-allow-origin'),
    'http://localhost:5173'
  );
});

test('C-06/RNF-001.4: un origen ajeno NO recibe Access-Control-Allow-Origin (nada de comodín)', async () => {
  const res = await fetch(base + '/api/products', {
    headers: { Origin: 'http://malicioso.example' },
  });
  assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
});

test('C-06: helmet añade cabeceras de seguridad HTTP', async () => {
  const res = await fetch(base + '/api/products');
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
});

test('C-06/RNF-001.3: /api/auth limita peticiones por IP y responde 429 al superar el límite', async () => {
  // 1ª y 2ª petición: pasan (responden 400 por body inválido, no importa).
  for (let i = 0; i < 2; i++) {
    const res = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.notStrictEqual(res.status, 429, `la petición ${i + 1} no debe estar limitada`);
  }

  // 3ª petición desde la misma IP: 429 con cabeceras RateLimit.
  const third = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.strictEqual(third.status, 429);
  assert.ok(third.headers.get('ratelimit-remaining') !== null, 'debe incluir cabecera RateLimit');
});

test('C-06: el .env-example documenta CORS_ORIGINS', () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), '.env-example'), 'utf8');
  assert.match(content, /^CORS_ORIGINS=.*$/m);
});
