# Guía de instalación y despliegue — Estuche Virtual

> Guía para que **cualquier miembro del equipo** pueda clonar, configurar,
> ejecutar y probar el proyecto siguiendo únicamente este documento.
> Última verificación: **2026-11-25** (commit `883cf20`, CI verde).

---

## 1. Requisitos previos

| Requisito | Versión mínima | Verificación |
| --- | --- | --- |
| Git | 2.x | `git --version` |
| Node.js | 20 (backend/docker) o 22 (tests del frontend) | `node --version` |
| pnpm | **10.12.4** (exacta, RT-001) | `pnpm --version` |
| Docker + Docker Compose | cualquier versión reciente | `docker compose version` |
| PostgreSQL | 16 (si corres sin Docker) | `psql --version` |

Instalar pnpm con la versión exacta (obligatorio en todo el equipo):

```bash
corepack enable
corepack prepare pnpm@10.12.4 --activate
```

> ⚠️ **RT-001**: el proyecto usa pnpm con versiones exactas. No usar npm ni yarn
> en ningún directorio (rompe los `pnpm-lock.yaml`).

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/amehtadame-svg/Estuche-Virtual3.0.git
cd Estuche-Virtual3.0
```

---

## 3. Variables de entorno

Los archivos `.env` **nunca se suben al repo** (están en `.gitignore`). Cada
entorno se configura copiando los `.env-example`:

```bash
cp .env-example .env          # raíz: variables de Docker Compose
cp be/.env-example be/.env    # backend nativo (opcional si usas Docker)
cp fe/.env-example fe/.env    # frontend (opcional)
```

### 3.1 Variables de la raíz (`.env`)

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `SUPABASE_DATABASE_URL` | **Sí** (producción) | URL `postgresql://` de Supabase en modo *Session pooler* (puerto 5432). Se obtiene del dashboard de Supabase → Connect → ORM → Prisma. |
| `JWT_SECRET` | **Sí** | Generar con `openssl rand -base64 32` (mínimo 32 caracteres; el backend valida esto al arrancar). |
| `LOCAL_DATABASE_URL` | No | Base local de respaldo (fase offline). Por defecto apunta al servicio `db` del compose. |
| `EMAIL_USER` / `EMAIL_PASS` | No (dev) | **Sí en producción**: contraseña de aplicación de Gmail (16 caracteres, `myaccount.google.com/apppasswords`). Sin ellas, en desarrollo se usa una cuenta Ethereal de prueba (el enlace del correo aparece en los logs). |
| `CORS_ORIGINS` | No | Lista blanca separada por comas. **Nunca `*`**. Añade el origen de tu equipo si accedes desde otra máquina (p. ej. `http://192.168.1.20:5173`). |

### 3.2 Variables del backend (`be/.env`, solo nativo)

Todas las de la sección anterior más: `PORT` (4000), `RATE_LIMIT_MAX`,
`RATE_LIMIT_WINDOW_MS`, `EMPLOYEE_RESERVATION_MINUTES`,
`RESERVATION_EXPIRY_INTERVAL_MINUTES`, `RESET_TOKEN_MINUTES`,
`LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES`, `SMTP_*`.

> El backend **valida la configuración al arrancar**: si falta `DATABASE_URL`,
> `JWT_SECRET` (<32) o `PORT` es inválido, termina con un mensaje que indica
> exactamente qué corregir. Luego hace un ping real a la base con reintentos
> antes de servir tráfico.

### 3.3 Variables del frontend (`fe/.env`)

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base del backend. **Prioridad**: 1) valor explícito que no apunte a localhost (Docker/producción), 2) detección automática de plataforma (Arena/e2b, Codespaces), 3) `localhost:4000` (desarrollo local). |

---

## 4. Ejecución con Docker Compose (recomendada)

```bash
docker compose up --build
```

Esto levanta:

| Servicio | Puerto | Descripción |
| --- | --- | --- |
| `db` | 5432 | PostgreSQL 16 con healthcheck (solo si no defines `SUPABASE_DATABASE_URL`… ver nota) |
| `backend` | 4000 | `prisma generate` → `prisma migrate deploy` → `pnpm dev` |
| `frontend` | 5173 | Vite dev server con proxy `/api` → backend |

**Codespaces**: no hace falta `.env`; crea los mismos nombres como *Codespaces
secrets* y Compose los usa automáticamente.

Verificación:

```bash
curl http://localhost:4000/api/health         # {"status":"ok",...}
curl http://localhost:4000/api/health/ready   # {"status":"ready","database":"up",...} (o 503 si la BD no responde)
```

### Acceso desde otro equipo de la red

1. El frontend ya escucha en `0.0.0.0` (`pnpm dev --host 0.0.0.0` en compose).
2. Añade el origen del visitante a `CORS_ORIGINS` en `.env`
   (p. ej. `http://192.168.1.20:5173`) y reinicia el backend.
3. Abre `http://<IP-de-la-máquina>:5173` desde el otro equipo.
4. Si el otro equipo necesita apuntar a un backend distinto, define
   `VITE_API_URL=http://<IP-del-backend>:4000` en `fe/.env`.

---

## 5. Ejecución nativa (sin Docker)

### Backend

```bash
cd be
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy     # aplica migraciones a DATABASE_URL
pnpm seed                      # opcional: datos de demostración
pnpm dev                       # http://localhost:4000
```

### Frontend

```bash
cd fe
pnpm install --frozen-lockfile
pnpm dev                       # http://localhost:5173 (proxy /api → :4000)
```

### Semilla (seed)

```bash
cd be && pnpm seed
```

Crea usuarios de demostración con dominio `.test` (RFC 2606, no existen):

| Rol | Email | Contraseña |
| --- | --- | --- |
| Superadmin | `superadmin@estuche.test` | `SuperAdmin123!` |
| Admin | `admin@estuche.test` | `Admin123!` |
| Empleado | `empleado@estuche.com` | `Empleado123!` |
| Cliente | `cliente@estuche.com` | `Cliente123!` |

> El seed está **bloqueado contra Supabase** por defecto para no tocar la base
> principal; solo corre contra bases locales. `ALLOW_SEED_SUPABASE=1` lo
> desbloquea a conciencia (no recomendado).

---

## 6. Pruebas

### 6.1 Suite unitaria (no necesita base de datos)

```bash
cd be && pnpm test        # 73 tests: unitarios de módulos + config/health
cd fe && node --test src/modules/frontend/frontend.test.ts   # 3 tests (C-07)
```

> En Node 20 el test del frontend no corre (es `.ts` con type-stripping
> nativo); usa Node ≥ 22 para ese comando, o déjalo a la CI.

### 6.2 Suite de integración (PostgreSQL real, **ambiente separado**)

Los tests de integración exigen una base **exclusiva** cuyo nombre termine en
`_test` y en `localhost`; se niegan a correr contra cualquier otra (protección
contra destrucción de datos):

```bash
cd be
export EMPLOYEE_TEST_DATABASE_URL=postgresql://postgres@localhost:5432/estuche_virtual_test
pnpm prisma migrate deploy        # con DATABASE_URL = esa misma base
pnpm test:integration             # 26 tests: despatch + employee
```

O en una terminal dedicada:

```bash
docker run --rm -p 5433:5432 -e POSTGRES_USER=postgres -e POSTGRES_DB=estuche_virtual_test -e POSTGRES_HOST_AUTH_METHOD=trust postgres:16-alpine
```

(y apunta `EMPLOYEE_TEST_DATABASE_URL` a `localhost:5433/estuche_virtual_test`).

### 6.3 Lint (obligatorio antes de cada PR, RH-001)

```bash
cd fe && pnpm lint      # ESLint 9 flat config — 0 errores exigidos
```

---

## 7. Integración continua (CI)

El workflow `.github/workflows/ci.yml` corre en cada PR y en cada push a
`main` con tres jobs:

1. **Backend**: `pnpm install --frozen-lockfile` → `prisma generate` →
   `pnpm build` (tsc) → `pnpm test` (73 tests).
2. **Frontend**: `pnpm install --frozen-lockfile` → `pnpm lint` (0 errores) →
   `pnpm build` → tests C-07. (Node 22 por el test `.ts`.)
3. **Integración**: service container **PostgreSQL 16** con base
   `estuche_virtual_test` → `prisma migrate deploy` → `pnpm test:integration`
   (26 tests contra BD real).

La caché de pnpm usa `cache-dependency-path` apuntando a
`be/pnpm-lock.yaml` y `fe/pnpm-lock.yaml` (no hay lockfile en la raíz).

---

## 8. Diferencias entre desarrollo y producción

| Aspecto | Desarrollo | Producción |
| --- | --- | --- |
| Servidor | `pnpm dev` (nodemon + ts-node, auto-reload) | `pnpm build` + `pnpm start` (`dist/index.js`) o Docker |
| Base de datos | Supabase o Postgres local (`db` del compose) | Supabase (Session pooler) con migraciones en cada deploy (`prisma migrate deploy`) |
| Correo | Ethereal (enlace en logs) o Gmail con contraseña de aplicación | **Obligatorio** `EMAIL_USER`/`EMAIL_PASS` reales — si faltan, el backend rechaza arrancar el envío |
| `NODE_ENV` | `development` | `production` |
| Seed | Permitido (dominios `.test`) | No ejecutar contra la base principal |
| Vencimiento de reservas | Cada 5 min (`RESERVATION_EXPIRY_INTERVAL_MINUTES`) | Idem; `0` lo apaga |
| CORS | `localhost:5173` | Dominios reales listados en `CORS_ORIGINS` |
| Errores | Mensajes detallados en consola | Igual (logs del contenedor); nunca exponer secretos |

### Checklist de despliegue a producción

1. `JWT_SECRET` fuerte (≥32) y `SUPABASE_DATABASE_URL` definidos.
2. `EMAIL_USER`/`EMAIL_PASS` configurados (el arranque los valida en producción).
3. `CORS_ORIGINS` con el dominio real (sin `*`).
4. `docker compose up --build` (o pipeline equivalente): ejecuta
   `prisma migrate deploy` automáticamente antes de servir.
5. Verificar `GET /api/health/ready` → `200 {"status":"ready"}`.
6. No ejecutar `pnpm seed` contra la base de producción.

---

## 9. Solución de problemas

| Síntoma | Causa / solución |
| --- | --- |
| `❌ Configuración inválida: Falta DATABASE_URL…` | Copia `.env-example` → `.env` y rellena (sección 3). |
| `No se pudo conectar a la base de datos tras 5 intentos` | Revisa la URL y que el servidor Postgres/Supabase esté arriba. |
| `pnpm: command not found` | `corepack enable && corepack prepare pnpm@10.12.4 --activate`. |
| `Usa EMPLOYEE_TEST_DATABASE_URL con una base local exclusiva terminada en _test` | Los tests de integración protegen tu base habitual; define la variable (sección 6.2). |
| Puerto ocupado | Cambia `PORT` (backend) o el mapeo del compose. |
| Correo no llega | En dev, revisa los logs (Ethereal). En prod, verifica la contraseña de aplicación de Gmail (sección 3.1). |
| `VITE_API_URL` apunta mal | Prioridad documentada en `fe/.env-example`; en local no hace falta definirla. |

---

## 10. Flujo de Git y convención de commits

- Ramas: solo `main` y `dev` (más ramas de trabajo/PR). **Nunca** se hace
  push directo a `main` (RH-002) y **nunca** `--force-push`.
- Todo cambio entra por **pull request** con CI verde y revisión.
- Convención de commits (Conventional Commits):

  ```
  <tipo>(<ámbito>): <descripción en imperativo, sin punto final>

  tipo: feat | fix | docs | test | ci | refactor | chore | style
  ámbito: be | fe | ci | docs | seed | env  (opcional)
  ```

  Ejemplos: `fix(be): validar JWT_SECRET de al menos 32 caracteres`,
  `ci: añadir service de PostgreSQL para tests de integración`.

- **Protección de rama `main`**: requiere PR + checks verdes antes de merge
  (configurado en Settings → Branches; verificar periódicamente con
  `gh api repos/amehtadame-svg/Estuche-Virtual3.0/branches/main/protection`).
