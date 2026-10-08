import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, test } from 'node:test';
import express, { type Express } from 'express';
import { createApp } from '../app';
import { IncidentStore } from '../data/incidents.data';
import type { Incident } from '../models/incident.model';
import type { RequestInfo } from '../models/request.model';
import { requestInfoMiddleware } from '../middlewares/request-info.middleware';

interface IncidentListResponse {
  ok: boolean;
  total: number;
  data: Incident[];
}

interface IncidentResponse {
  ok: boolean;
  data: Incident;
}

interface ErrorResponse {
  ok: boolean;
  message: string;
}

const store = new IncidentStore();
let server!: Server;
let baseUrl = '';

async function openServer(app: Express): Promise<{ server: Server; url: string }> {
  const listeningServer = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    listeningServer.once('error', reject);
    listeningServer.once('listening', resolve);
  });

  const address = listeningServer.address() as AddressInfo | null;
  if (!address) {
    throw new Error('Test server did not provide an address');
  }

  return {
    server: listeningServer,
    url: `http://127.0.0.1:${address.port}`,
  };
}

async function closeServer(target: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    target.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function jsonOptions(
  method: string,
  body: unknown,
  token?: string,
): RequestInit {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return { method, headers, body: JSON.stringify(body) };
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function send(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${baseUrl}${path}`, options);
}

before(async () => {
  const running = await openServer(createApp(store));
  server = running.server;
  baseUrl = running.url;
});

after(async () => {
  await closeServer(server);
});

beforeEach(() => {
  store.reset();
});

test('GET /api/incidents devuelve los cinco incidentes iniciales', async () => {
  const response = await send('/api/incidents');
  const body = await readJson<IncidentListResponse>(response);

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.total, 5);
  assert.equal(body.data.length, 5);
});

test('GET /api/incidents/:id devuelve el incidente existente', async () => {
  const response = await send('/api/incidents/1');
  const body = await readJson<IncidentResponse>(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.id, 1);
  assert.equal(body.data.title, 'Proyector sin señal');
});

test('GET /api/incidents/:id devuelve 404 cuando no existe', async () => {
  const response = await send('/api/incidents/999');
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 404);
  assert.deepEqual(body, { ok: false, message: 'Incident not found' });
});

test('validateId rechaza IDs no enteros positivos', async () => {
  for (const id of ['abc', '-3', '4.5', '0', '9007199254740992']) {
    const response = await send(`/api/incidents/${id}`);
    const body = await readJson<ErrorResponse>(response);

    assert.equal(response.status, 400, `ID rechazado: ${id}`);
    assert.equal(body.message, 'Invalid incident id');
  }
});

test('POST crea un incidente y el servidor controla id, status y createdAt', async () => {
  const response = await send(
    '/api/incidents',
    jsonOptions(
      'POST',
      {
        title: 'Pantalla con parpadeos',
        description: 'El monitor presenta parpadeos constantes.',
        reporter: 'Miguel Torres',
        location: 'Oficina 407',
        priority: 'MEDIUM',
        estimatedMinutes: 35,
        id: 700,
        status: 'RESOLVED',
        createdAt: '2000-01-01T00:00:00.000Z',
      },
      'technician-token',
    ),
  );
  const body = await readJson<IncidentResponse>(response);

  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.equal(body.data.id, 6);
  assert.equal(body.data.status, 'OPEN');
  assert.notEqual(body.data.createdAt, '2000-01-01T00:00:00.000Z');
  assert.equal(body.data.title, 'Pantalla con parpadeos');
});

test('POST rechaza los datos sin título', async () => {
  const response = await send(
    '/api/incidents',
    jsonOptions(
      'POST',
      {
        description: 'Detalle',
        reporter: 'Ana Torres',
        location: 'Piso 2',
        priority: 'HIGH',
        estimatedMinutes: 40,
      },
      'technician-token',
    ),
  );
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 400);
  assert.match(body.message, /title/);
});

test('POST rechaza una prioridad no permitida', async () => {
  const response = await send(
    '/api/incidents',
    jsonOptions(
      'POST',
      {
        title: 'Falla de prueba',
        description: 'Descripción',
        reporter: 'Ana Torres',
        location: 'Piso 2',
        priority: 'SUPER_IMPORTANT',
        estimatedMinutes: 40,
      },
      'technician-token',
    ),
  );
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 400);
  assert.match(body.message, /Invalid priority/);
});

test('POST rechaza minutos negativos, cero, texto y valores mayores a 480', async () => {
  const invalidValues: unknown[] = [-1, 0, '40', 481];

  for (const estimatedMinutes of invalidValues) {
    const response = await send(
      '/api/incidents',
      jsonOptions(
        'POST',
        {
          title: 'Falla de prueba',
          description: 'Descripción',
          reporter: 'Ana Torres',
          location: 'Piso 2',
          priority: 'HIGH',
          estimatedMinutes,
        },
        'technician-token',
      ),
    );

    assert.equal(response.status, 400, `Minutos rechazados: ${estimatedMinutes}`);
  }
});

test('POST rechaza incidentes CRITICAL con más de 60 minutos', async () => {
  const response = await send(
    '/api/incidents',
    jsonOptions(
      'POST',
      {
        title: 'Servidor principal detenido',
        description: 'El servicio de autenticación no responde.',
        reporter: 'Ana Torres',
        location: 'Centro de datos',
        priority: 'CRITICAL',
        estimatedMinutes: 61,
      },
      'technician-token',
    ),
  );
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 400);
  assert.match(body.message, /CRITICAL/);
});

test('PUT actualiza los campos permitidos y conserva campos del servidor', async () => {
  const original = store.findById(1);
  assert.ok(original);

  const response = await send(
    '/api/incidents/1',
    jsonOptions(
      'PUT',
      {
        title: 'Pantalla sin imagen',
        description: 'El monitor dejó de mostrar imagen.',
        location: 'Oficina 407',
        priority: 'HIGH',
        estimatedMinutes: 60,
        id: 999,
        status: 'RESOLVED',
        createdAt: '2000-01-01T00:00:00.000Z',
      },
      'technician-token',
    ),
  );
  const body = await readJson<IncidentResponse>(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.id, 1);
  assert.equal(body.data.status, original.status);
  assert.equal(body.data.createdAt, original.createdAt);
  assert.equal(body.data.reporter, original.reporter);
  assert.equal(body.data.title, 'Pantalla sin imagen');
});

test('PUT de un incidente inexistente devuelve 404', async () => {
  const response = await send(
    '/api/incidents/999',
    jsonOptions(
      'PUT',
      {
        title: 'Falla',
        description: 'Descripción',
        location: 'Piso 2',
        priority: 'LOW',
        estimatedMinutes: 30,
      },
      'technician-token',
    ),
  );

  assert.equal(response.status, 404);
});

test('PATCH permite la transición OPEN a IN_PROGRESS', async () => {
  const response = await send(
    '/api/incidents/1/status',
    jsonOptions('PATCH', { status: 'IN_PROGRESS' }, 'technician-token'),
  );
  const body = await readJson<IncidentResponse>(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.status, 'IN_PROGRESS');
});

test('PATCH permite la transición IN_PROGRESS a RESOLVED', async () => {
  const response = await send(
    '/api/incidents/2/status',
    jsonOptions('PATCH', { status: 'RESOLVED' }, 'technician-token'),
  );
  const body = await readJson<IncidentResponse>(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.status, 'RESOLVED');
});

test('PATCH rechaza regresar de RESOLVED a OPEN', async () => {
  const response = await send(
    '/api/incidents/4/status',
    jsonOptions('PATCH', { status: 'OPEN' }, 'technician-token'),
  );
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 400);
  assert.match(body.message, /Invalid status transition/);
});

test('PATCH rechaza un estado que no pertenece al modelo', async () => {
  const response = await send(
    '/api/incidents/1/status',
    jsonOptions('PATCH', { status: 'CLOSED' }, 'technician-token'),
  );

  assert.equal(response.status, 400);
});

test('DELETE sin token responde 401', async () => {
  const response = await send('/api/incidents/1', { method: 'DELETE' });
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 401);
  assert.equal(body.message, 'Unauthorized');
});

test('DELETE con technician-token responde 403', async () => {
  const response = await send('/api/incidents/1', {
    method: 'DELETE',
    headers: { authorization: 'Bearer technician-token' },
  });
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 403);
  assert.equal(body.message, 'Forbidden');
});

test('DELETE con instructor-token elimina y responde 204 sin body', async () => {
  const response = await send('/api/incidents/1', {
    method: 'DELETE',
    headers: { authorization: 'Bearer instructor-token' },
  });

  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.equal(store.findById(1), undefined);
});

test('una ruta inexistente responde 404 con Route not found', async () => {
  const response = await send('/api/planets');
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 404);
  assert.deepEqual(body, { ok: false, message: 'Route not found' });
});

test('GET /critical devuelve solo incidentes CRITICAL', async () => {
  const response = await send('/api/incidents/critical');
  const body = await readJson<IncidentListResponse>(response);

  assert.equal(response.status, 200);
  assert.equal(body.total, 1);
  assert.ok(body.data.every((incident) => incident.priority === 'CRITICAL'));
});

test('GET /pending omite los incidentes RESOLVED', async () => {
  const response = await send('/api/incidents/pending');
  const body = await readJson<IncidentListResponse>(response);

  assert.equal(response.status, 200);
  assert.equal(body.total, 4);
  assert.ok(body.data.every((incident) => incident.status !== 'RESOLVED'));
});

test('GET /stats calcula las métricas a partir de los datos actuales', async () => {
  const response = await send('/api/incidents/stats');
  const body = await readJson<{
    ok: boolean;
    data: {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      critical: number;
      averageEstimatedMinutes: number;
    };
  }>(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body.data, {
    total: 5,
    open: 3,
    inProgress: 1,
    resolved: 1,
    critical: 1,
    averageEstimatedMinutes: 40,
  });
});

test('las operaciones de escritura requieren un token válido', async () => {
  const response = await send(
    '/api/incidents',
    jsonOptions('POST', {
      title: 'Falla',
      description: 'Descripción',
      reporter: 'Ana Torres',
      location: 'Piso 2',
      priority: 'LOW',
      estimatedMinutes: 30,
    }),
  );

  assert.equal(response.status, 401);
});

test('el error middleware responde 400 ante JSON malformado', async () => {
  const response = await send('/api/incidents', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer technician-token',
    },
    body: '{json-incompleto',
  });
  const body = await readJson<ErrorResponse>(response);

  assert.equal(response.status, 400);
  assert.equal(body.message, 'Invalid JSON body');
});

test('requestInfoMiddleware agrega timestamp, method y path al request', async () => {
  const infoApp = express();
  infoApp.use(requestInfoMiddleware);
  infoApp.get('/inspect', (req, res) => {
    res.status(200).json(req.requestInfo);
  });

  const running = await openServer(infoApp);
  try {
    const response = await fetch(`${running.url}/inspect?source=test`);
    const info = await readJson<RequestInfo>(response);

    assert.equal(response.status, 200);
    assert.equal(info.method, 'GET');
    assert.equal(info.path, '/inspect');
    assert.ok(Number.isFinite(Date.parse(info.timestamp)));
  } finally {
    await closeServer(running.server);
  }
});
