# Guía de Migración — Estuche Virtual 3.0 (UUID v7 + seguridad)

> Estado: las migraciones ya están **creadas y validadas** end-to-end contra PostgreSQL 17.
> Solo necesitas apuntar `DATABASE_URL` a tu base y aplicarlas.

---

## 1. Qué cambió respecto a la versión anterior

| Aspecto | Antes | Ahora |
|---|---|---|
| IDs (PK y FK) | `Int autoincrement` | `String @db.Uuid` (UUID v7) |
| Tipos en código | `Number(req.params.id)` | string (UUID) |
| Contraseña | `password` | `password_hash` (`@map("password")`) + `password_updated_at` |
| Login | sin protección | anti fuerza bruta (`intentos_fallidos`, `bloqueado_hasta`) |
| Auditoría | — | tabla `eventos_seguridad` |
| Roles / estados | texto libre | `enum` (rechaza valores inválidos en BD) |
| Dinero (COP) | `Decimal(10,2)` | `Decimal(14,2)` |
| `subtotal` | `DEFAULT` con refs a columnas (**inválido en PG**) | se calcula en la app |
| Facturas | PK = id | PK UUID + `numero_factura` secuencial (DIAN) |
| Cupones | sin control de concurrencia | `version` (optimistic lock) |
| Cumplimiento | — | `consentimiento_datos` + `deleted_at` (Ley 1581) |

---

## 2. Migraciones incluidas (ya validadas)

```
prisma/migrations/
├── migration_lock.toml
├── 20260813000000_uuid_v7_function/migration.sql   # crea uuid_generate_v7()
└── 20260814044514_init/migration.sql                # crea todas las tablas
```

- La función `uuid_generate_v7()` se crea **primero** (timestamp más temprano), por lo que
  los `DEFAULT` de las tablas ya la encuentran disponible.
- Se re-aplica sola con `prisma migrate reset` (no hay que tocar nada manual).

---

## 3. Puesta en marcha

### Requisitos
- PostgreSQL 13+ (para `pgcrypto` / `gen_random_bytes`).
- Node 18+ y dependencias instaladas (`npm install` o `pnpm install` en `be/`).

### Desarrollo (tu PC)
```bash
cd be
cp .env-example .env          # ajusta DATABASE_URL y JWT_SECRET
npm install
npx prisma migrate deploy     # aplica las 2 migraciones
npx prisma generate
npm run dev
```

### Producción / staging
```bash
npx prisma migrate deploy     # no interactivo; aplica solo lo pendiente
npx prisma generate
```

> ⚠️ Usa `prisma migrate`, **nunca `prisma db push`**: `db push` ignora las migraciones
> y no crearía `uuid_generate_v7()`, rompiendo todos los `INSERT`.

---

## 4. Cambios en el código (ya aplicados)

- **`auth.controller.ts`**: usa `password_hash`; bloqueo tras N intentos fallidos
  (`LOGIN_MAX_INTENTOS`, por defecto 5); registra cada intento en `eventos_seguridad`.
- **Todos los controladores**: `req.params.id` se usa como **string** (sin `Number()`).
- **`pedidos.schema.ts`**: validación de IDs como `z.string().uuid()` y `estado` como enum.
- **`usuarios.controller.ts`**: creación con `password_hash`, `consentimiento_datos`,
  `password_updated_at`.
- **`db/users.ts`** (mock): `id: string`, `password_hash`.
- **`.env-example`**: corregido a `JWT_SECRET` (antes `JWT_ACCESS_SECRET`, que el código no leía).

Variables de entorno nuevas (opcionales):
```
LOGIN_MAX_INTENTOS=5
LOGIN_BLOQUEO_MINUTOS=15
```

---

## 5. Notas importantes

- **El frontend** debe enviar/recibir los IDs como strings (UUID). Actualiza rutas,
  formularios y cualquier comparación de IDs.
- **`facturas.numero_factura`** sigue siendo secuencial (requerido por DIAN).
- **`subtotal`** ahora se calcula en la app (`crearPedido`, `crearDetalle`), no en la BD,
  porque PostgreSQL no permite `DEFAULT` que referencie otras columnas.

---

## 6. Verificación rápida
```bash
psql "$DATABASE_URL" -c "SELECT uuid_generate_v7();"     # debe devolver un UUID con '7' en la 3ra grupo
psql "$DATABASE_URL" -c "\dt"                            # lista las tablas
```
Un UUID v7 válido empieza por `017`–`019` (timestamp actual) y lleva la versión `7`.
