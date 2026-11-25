# Informe de pruebas automatizadas — Estuche Virtual

| Campo | Valor |
| --- | --- |
| **Fecha del informe** | 2026-11-25 |
| **Commit evaluado** | `883cf20` (rama `arena/bec2ab3d-estuche-virtual3-0`, PR #84) |
| **Entorno local** | Sandbox Linux, Node.js v22.22.3, pnpm 10.12.4, TypeScript 5.5.4 |
| **CI (GitHub Actions)** | Run [45708752716](https://github.com/amehtadame-svg/Estuche-Virtual3.0/actions/runs/45708752716) — **verde (3/3 jobs)** |
| **Resultado global** | **102 pruebas: 102 pasan, 0 fallan** |

---

## 1. Resumen por suite

| Suite | Comando | Pruebas | Pasan | Fallan | Necesita BD |
| --- | --- | --- | --- | --- | --- |
| Backend unitaria | `cd be && pnpm test` | 73 | 73 | 0 | No (Prisma mockeado) |
| Frontend unitaria (C-07) | `cd fe && node --test src/modules/frontend/frontend.test.ts` | 3 | 3 | 0 | No |
| Integración (PostgreSQL) | `cd be && pnpm test:integration` | 26 | 26 | 0 | **Sí — base `*_test` separada** |
| **Total** | | **102** | **102** | **0** | |

> Nota de conteo: el patrón literal `test(` aparece 75 veces en los 11 archivos
> de módulos, pero 8 de ellas son llamadas a `regex.test(...)` dentro de
> aserciones, no declaraciones. 75 − 8 = 67 declaraciones de módulo + 6 nuevas
> en `src/lib/config.test.ts` = **73** (coincide con el reporte de `node --test`).

---

## 2. Clasificación de las pruebas

### 2.1 Unitarias backend (73) — por archivo

| # | Archivo | Pruebas | Categoría |
| --- | --- | --- | --- |
| 1 | `be/src/lib/config.test.ts` | 6 | **Configuración/arranque** — validación de `DATABASE_URL`, `JWT_SECRET` (≥32), `PORT`, `CORS_ORIGINS` + health endpoint |
| 2 | `be/src/modules/app-security/security.test.ts` | 5 | **Seguridad de app** — CORS lista blanca (sin comodín), helmet, rate-limit 429, documentación `.env-example` |
| 3 | `be/src/modules/auth/auth.test.ts` | 4 | **Autenticación** — JWT con secreto del ejemplo, usuario inactivo → 401, variable JWT única |
| 4 | `be/src/modules/despatch/despatch.address.test.ts` | 3 | **Validación de entradas** — direcciones 255/256/500 OK, 501 rechazada, dirección opcional |
| 5 | `be/src/modules/employee/employee.test.ts` | 5 | **Dominio de empleado** — permisos, bandera de simulación, evidencia de pago, esquemas, idempotencia |
| 6 | `be/src/modules/inventory/inventory.outbound.test.ts` | 6 | **Retiro de inventario (HU-003)** — cantidades inválidas, justificación, descuento atómico 50→40, exceso de stock, producto borrado |
| 7 | `be/src/modules/inventory/inventory.test.ts` | 2 | **Ingreso de inventario (HU-002)** — cantidad inválida, suma atómica 15+25=40 con movimiento `in` |
| 8 | `be/src/modules/orders/orders.test.ts` | 9 | **Pedidos (C-02/C-03)** — total calculado en servidor, descuentos, stock, movimientos, carrera de concurrencia |
| 9 | `be/src/modules/orders/permissions.test.ts` | 7 | **Autorización de pedidos** — 401 sin/inválido, CRUD cerrado, rol vigente de BD |
| 10 | `be/src/modules/products/products.test.ts` | 6 | **Productos (HU-001/C-01)** — validaciones, duplicados, creación, catálogo público |
| 11 | `be/src/modules/receipt/receipt.test.ts` | 9 | **Recibos** — totales del servidor, no-editable con pagos, sin eliminación |
| 12 | `be/src/modules/users/users.test.ts` | 11 | **Usuarios (HU-018)** — 9 rutas protegidas, verifyToken/verifyAdmin |
| | **Total backend** | **73** | |

### 2.2 Unitarias frontend (3)

| # | Prueba | Categoría |
| --- | --- | --- |
| 1 | `C-07: api.ts lee VITE_API_URL antes que cualquier fallback` | **Configuración** — prioridad de variable de entorno |
| 2 | `C-07: no hay más URLs de backend fijadas en el código` | **Configuración** — un solo fallback `localhost:4000` |
| 3 | `C-07: fe/.env-example documenta VITE_API_URL` | **Documentación viviente** |

### 2.3 Integración (26) — corren en CI con PostgreSQL 16 real

| Archivo | Pruebas | Categoría |
| --- | --- | --- |
| `be/tests/despatch-address.integration.ts` | 4 | HTTP + transacciones reales: dirección de 500 caracteres recorre el flujo completo (crear→pagar→recoger→empacar→despachar), rechazo de 501, despachos generales |
| `be/tests/employee.integration.ts` | 22 | Flujo de empleado end-to-end: permisos, reservas, pagos simulados, picking/pack/dispatch, idempotencia, liberación de stock — todo contra BD real |

**Protecciones del ambiente de pruebas:** ambos archivos abortan al importar si
`EMPLOYEE_TEST_DATABASE_URL` no apunta a `localhost` con nombre terminado en
`_test` — nunca tocan la base habitual (RH-002 de datos).

---

## 3. Cobertura de criterios de aceptación (tarea D)

Criterio: *"identificar al menos 20 pruebas unitarias distintas"* →
**76 unitarias identificadas** (73 backend + 3 frontend), 20 ejemplos
representativos:

| # | Prueba | Archivo |
| --- | --- | --- |
| 1 | Config sin variables lanza `ConfigError` con ambos mensajes | config.test.ts |
| 2 | `JWT_SECRET` < 32 caracteres es rechazado | config.test.ts |
| 3 | `GET /api/health` responde 200 sin auth | config.test.ts |
| 4 | Origen ajeno NO recibe `Access-Control-Allow-Origin` | security.test.ts |
| 5 | Helmet añade cabeceras de seguridad | security.test.ts |
| 6 | `/api/auth` responde 429 al superar el límite | security.test.ts |
| 7 | Usuario inactivo recibe 401 con token bien firmado | auth.test.ts |
| 8 | Dirección de 501 caracteres rechazada sin reservar stock | despatch.address.test.ts |
| 9 | Retiro descuenta stock 50 → 40 y crea movimiento `out` | inventory.outbound.test.ts |
| 10 | Retiro que excede el stock queda bloqueado | inventory.outbound.test.ts |
| 11 | Ingreso suma stock atómicamente (15+25=40) | inventory.test.ts |
| 12 | Total del pedido se calcula en el servidor (ignora `total: 0`) | orders.test.ts |
| 13 | Tras pedido de 3 unidades el stock baja 3 | orders.test.ts |
| 14 | Carrera de stock: pedido falla si no alcanza | orders.test.ts |
| 15 | Rutas protegidas responden 401 sin token | permissions.test.ts |
| 16 | `GET /api/products` sigue siendo público | permissions.test.ts |
| 17 | Producto duplicado por SKU/nombre rechazado (HU-001) | products.test.ts |
| 18 | Recibo con pagos no es editable | receipt.test.ts |
| 19 | Eliminar recibos no permitido | receipt.test.ts |
| 20 | `verifyAdmin` rechaza usuario con rol `client` | users.test.ts |

---

## 4. Resultado de CI del commit presentado

**Run:** https://github.com/amehtadame-svg/Estuche-Virtual3.0/actions/runs/45708752716
**Rama:** `arena/bec2ab3d-estuche-virtual3-0` → `main` (PR #84) · **2026-11-25**

| Job | Contenido | Resultado |
| --- | --- | --- |
| Backend (build + tests unitarios) | pnpm 10.12.4 + caché por lockfile → install congelado → `prisma generate` → `tsc` → 73 tests | ✅ 54 s |
| Frontend (lint + build + tests) | install congelado → ESLint 0 errores → `tsc -b + vite build` → 3 tests C-07 | ✅ 31 s |
| Integración (PostgreSQL real) | service Postgres 16 → `migrate deploy` → 26 tests de integración | ✅ 42 s |

> **GitGuardian:** el check del PR señala un incidente en el commit intermedio
> `9f62728` (literal `POSTGRES_PASSWORD: postgres` en el service de CI — una
> BD efímera, no un secreto real). Ya está mitigado en `HEAD` (auth `trust`,
> sin contraseña literal). Al hacer **squash-merge** del PR, ese commit no
> llega a `main` y el incidente queda resuelto en el árbol principal.

---

## 5. Cómo reproducir los resultados

```bash
# 1) Unitarias (sin BD)
cd be && pnpm install --frozen-lockfile && pnpm test          # → 73/73
cd ../fe && pnpm install --frozen-lockfile && node --test src/modules/frontend/frontend.test.ts  # → 3/3

# 2) Integración (BD separada)
cd be
export EMPLOYEE_TEST_DATABASE_URL=postgresql://postgres@localhost:5432/estuche_virtual_test
pnpm prisma generate && pnpm prisma migrate deploy
pnpm test:integration                                          # → 26/26
```

Opcional (mismo entorno que la CI, sin instalar Postgres localmente):

```bash
docker compose -f - up  # ver sección 6.2 de docs/INSTALACION_Y_DESPLIEGUE.md
```
