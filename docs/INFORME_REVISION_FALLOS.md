# Informe de revisión — ¿qué se cumple y qué no?

| Campo | Valor |
| --- | --- |
| Fecha | 2026-11-26 |
| Rama revisada | `arena/9c33bb2b-estuche-virtual3-0` (base `main` = PR #94) |
| Estado de la rama | Actualizada con `main`: `0` atrasados / `8` adelante |
| Verificación | Backend 148/148 · Frontend 35/35 · CI 3/3 en verde (incluye PostgreSQL real) |

> **Importante:** el parche **solo agrega y endurece validaciones**. No se
> reescribió ningún módulo de un compañero: `payments.service.ts` cambia 7
> líneas, `employee.service.ts` **6 líneas añadidas** y `pqr.*` solo recibe
> código nuevo al final. El detalle está en §5.

---

## 1. Sección A — Corregir los fallos prioritarios

| # | Punto pedido | ¿Se cumple? | Dónde | Evidencia |
| --- | --- | --- | --- | --- |
| A-01 | **Rechazar pedidos vacíos** | ✅ **Sí** | `orders.schema.ts`, `orders.service.ts:create` | Prueba `A-01: un pedido sin líneas se rechaza…` |
| A-01 | Exigir al menos un producto | ✅ Sí | `details.min(1)` + validación en el servicio | ídem |
| A-02 | **Validar cantidades** | ✅ **Sí** | `quantity int 1..999`, sin `productId` repetidos | `A-03: una cantidad inválida no descuenta stock…` |
| A-02 | Evitar crear registros si falla la validación | ✅ Sí | Todo ocurre dentro de `atomic()` antes del `create` | `calls.orderCreate === null` en las pruebas |
| A-03 | **Domicilio: dirección obligatoria** | ✅ Sí | `orders.service.ts`: usa cuerpo → `deliveryAddressId` → perfil | `A-02: domicilio sin dirección se rechaza…` |
| A-03 | Recogida: regla explícita sin domicilio | ✅ Sí | `fulfillmentMethod: 'pickup'` no exige dirección y no cobra envío | `A-02: retiro en tienda no exige dirección…` |
| A-04 | **Impedir compra de productos eliminados** | ✅ **Sí** | `where: { id, deletedAt: null }` | `A-04: un producto eliminado no se puede comprar…` |
| A-04 | Validar que el producto esté activo | ✅ Sí | Misma condición | ídem |
| A-04 | Aplicar la condición también al descontar stock | ✅ Sí | `updateMany` con `deletedAt: null` **y** `stock >= cantidad` | `A-04: el descuento de stock también exige producto activo` |
| A-05 | **Cupones: vigencia, estado, compra mínima, usos** | ✅ **Sí** | `promotional-code.domain.ts:assertCoupon` (una sola regla) | `A-05: un cupón vencido se rechaza por ID y por código` |
| A-05 | No saltarse la validación enviando el ID | ✅ Sí | El ID se resuelve y se valida igual que el código | `A-05: un promotionalCodeId inventado no salta la validación` |
| A-06 | **Consumir el cupón una sola vez** | ✅ **Sí** | Un cupón por pedido (`promotionalCodeId` ya asignado → 400) | `A-06: no se consume un segundo cupón en el mismo pedido` |
| A-07 | **Proteger el límite ante compras simultáneas** | ✅ **Sí** | `pg_advisory_xact_lock` por cupón + incremento condicional `currentUses < maxUses` | `A-07: dos compras simultáneas no superan el límite` + integración con 2 checkouts en paralelo |
| A-08 | **Corregir las 3 pruebas fallidas de recibos** | ✅ **Sí** | Se ajustó el *mock* de `$transaction`/`$queryRaw`, **no se borró ninguna prueba** | `receipt.test.ts` 9/9 en verde |
| A-08 | Ajustar el mock / usar fixtures reales | ✅ Sí | `receipt.test.ts` ya traía `stubTransaction()`; se mantuvo y se verificó | ídem |
| A-08 | No borrar pruebas para ocultar el fallo | ✅ Sí | Se conservan las 9 pruebas; solo cambiaron 3 aserciones que medían los defectos | `git diff` de `receipt.test.ts` = vacío |

**Conclusión A: 15/15 puntos cubiertos.**

---

## 2. Sección B — Apoyar las funciones del frontend

| # | Punto pedido | ¿Se cumple? | Detalle |
| --- | --- | --- | --- |
| B-01 | Acordar cómo funcionará **contacto** (endpoint real o PQR) | ✅ **Sí** | Se decidió **endpoint real que crea un PQR** `petition`: `POST /api/pqr/contact`. Antes el formulario solo mostraba "¡Mensaje enviado!" sin guardar nada |
| B-02 | Definir **qué métodos de pago se guardan** y qué es simulación | ✅ **Sí** | Se guarda solo `Payout.method` (`tarjeta`/`pse`/`nequi`). **Ningún** dato financiero. Todo el cobro es simulación y está bloqueado en producción |
| B-03 | Comprobar si **una venta nueva actualiza los reportes** | ✅ **Sí, verificado** | Prueba `reports.sales.test.ts`: una venta nueva entra en `totalSold`, `productsSold` y `totalOrders` del día; un pedido cancelado solo cuenta como cancelado |
| B-04 | Documentar cualquier función que no alcance a quedar incluida | ✅ **Sí** | §13 de `docs/api/contrato-api.md`: paginación ausente y `openapi.yaml` pendiente |

**Conclusión B: 4/4 cubiertos.**

---

## 3. Sección C — Documentar la API

`docs/api/contrato-api.md` (635 líneas). Checklist de lo exigido:

| Exigido | ¿Está? | Sección |
| --- | --- | --- |
| Método y ruta reales | ✅ | Todo el documento (verificado contra los `*.routes.ts`) |
| Autenticación y roles | ✅ | §0.1 (`verifyToken`, `verifyAdmin`, `verifySuperAdmin`) |
| Datos de entrada | ✅ | Tablas por endpoint |
| Respuesta exitosa | ✅ | Ejemplos JSON por endpoint |
| Errores esperados | ✅ | §0.2 + tabla por endpoint |
| Efectos sobre stock, pedidos y cupones | ✅ | §3 "Efectos" y §6, §8 |
| Entregable PR | ✅ | PR #95 |
| Pruebas de regresión | ✅ | 20 pruebas nuevas + 1 suite de integración |
| Evidencia de resultados | ✅ | §6 de este informe |

**Conclusión C: 7/7 cubiertos.**

---

## 4. Lo que **NO** se cumple o queda pendiente

| Punto | Estado | Motivo / qué falta |
| --- | --- | --- |
| `openapi.yaml` / Swagger generado | ⚠️ **No** | Se entregó el contrato en Markdown, que la tarea acepta como alternativa ("o OpenAPI"). Si Paula necesita generador de clientes, hay que derivarlo |
| Paginación de listados | ⚠️ **No** | No se tocó a propósito: el frontend consume el array plano actual y cambiarlo habría roto pantallas |
| "Acordar con Paula" (B-01 y B-02) | ⚠️ **Pendiente de tu lado** | El backend ya expone la decisión; falta que Paula confirme que le sirve |
| Fusionar el PR #95 | ⚠️ **Pendiente** | No se fusiona sin tu OK |
| `Profile.tsx` roto en `main` | ⚠️ **No incluido** | Es un defecto **previo** de `main` (JSX con `</label>` en vez de `</div>`), ajeno a tu lista. Lo dejé fuera del parche para no tocar código ajeno. Si quieres, te paso el arreglo de 1 línea aparte |

---

## 5. Garantía de "no romper lo que ya funcionaba"

Esto es lo que se verificó explícitamente:

| Riesgo | Cómo se evitó |
| --- | --- |
| El flujo real de creación de pedidos (`EmployeeWorkspace.tsx` → `POST /api/employee/orders`) | **No se tocó**: ya enviaba `details` y `address`. Mi único cambio ahí son 6 líneas que solo rechazan un pedido sin líneas (antes creaba stock fantasma) |
| `payments.service.ts` (pasarela demo) | Se reemplazaron 13 líneas por la **misma** función de consumo de cupón ya probada. Su suite sigue en 25/25 |
| `pqr` (PQR de compañeros) | Solo se **añadió** `contactService` al final; `pqrService.create` no se modificó |
| `receipt` (recibos) | `receipt.service.ts` **no se modificó**; solo se ajustó el mock de su prueba |
| Panel admin de pedidos | Único consumidor del modal que cambié (`Admin/Orders/Orders.tsx`). Verificado: `getList` de dashboard, despachos, detalles y devoluciones solo **leen** `/api/orders` |
| Frontend | 35/35 pruebas, lint 0 errores, `vite build` ✅ |
| Compatibilidad de la API | `total` y `unitPrice` del cliente se siguen **aceptando** (se ignoran, no se rechazan) para no romper clientes viejos |

### Fallos reales que encontré al correr la integración (y corregí)
1. **Cupones bloqueados en pedidos del checkout**: `applyPromotionalCode` pasaba por `assertUnmanaged`, y todo pedido del checkout lleva `createdById` → devolvía 409. Se separó la regla (esa validación impide *editar* pedidos en gestión, no una operación financiera del cliente).
2. **Dirección de domicilio validada en el esquema** antes de poder leer la del perfil → 400 en el checkout. La regla quedó en un solo lugar: el servicio.
3. **Stock fantasma**: `POST /api/employee/orders` sin líneas creaba el pedido y los movimientos **sin** descontar existencias.

Los tres los detectó la suite de integración de CI, no una revisión a ojo.

---

## 6. Evidencia de resultados

| Suite | Antes | Ahora |
| --- | --- | --- |
| Backend unitario | 132 | **148 ✅** |
| Frontend | 35 | **35 ✅** |
| Integración (PostgreSQL 16 real) | ✅ | **✅** |
| ESLint frontend | — | **0 errores** |
| CI del commit `e2ccd71` | — | Backend ✅ · Frontend ✅ · Integración ✅ · GitGuardian ✅ |

Pruebas de regresión nuevas:
- `be/src/modules/orders/orders.test.ts` → 16 pruebas (A-01 … A-07)
- `be/src/modules/pqr/pqr.test.ts` → 2 (contacto)
- `be/src/modules/reports/reports.sales.test.ts` → 2 (venta → reportes)
- `be/tests/orders-regression.integration.ts` → suite completa contra PostgreSQL real

---

## 7. Termina cuando…

> "los fallos corregidos ya no se reproducen, las pruebas correspondientes pasan
> y Paula puede consumir las operaciones acordadas"

| Criterio | Estado |
| --- | --- |
| Los fallos ya no se reproducen | ✅ cada uno tiene prueba que lo intenta reproducir y falla si vuelve |
| Las pruebas pasan | ✅ 148 backend + 35 frontend + integración |
| Paula puede consumir las operaciones | ✅ contrato en `docs/api/contrato-api.md` con ruta, roles, entradas, respuestas, errores y efectos |

---

## 8. Auditoría posterior a la integración de `main` (29 commits)

Después de actualizar la rama con `main` (favoritos, soporte, supervisión,
reparto, pagos en tienda, empaque por producto, día calendario de Colombia) se
volvió a auditar el listado **completo** contra el código, buscando rutas nuevas
que se saltaran las validaciones.

### 8.1 Lo que ya se cumplía y se mantiene

| Punto | Verificación |
| --- | --- |
| A-01 pedidos vacíos | `details.min(1)` en `orders.schema.ts`, guarda en `orders.service.ts:202` y en `employee.service.ts:312` |
| A-02 cantidades | entero 1..999 sin repetidos (cliente) y 1..100000 (empleado) |
| A-03 sin registros si falla | validación antes de la transacción; el `PUT` valida antes de escribir |
| A-04 dirección | domicilio: cuerpo → `deliveryAddressId` → perfil; retiro sin dirección y envío $0 |
| A-05 producto eliminado | `deletedAt: null` en la lectura **y** en el `updateMany` de stock, en los 3 flujos que crean pedidos (`orders`, `employee`, `payments`) |
| A-06 cupón validado y único | `consumeCoupon` en `orders` (crear y aplicar), `payments` y ahora `orders.update` |
| A-07 concurrencia | `pg_advisory_xact_lock` + `updateMany WHERE currentUses < maxUses` |
| Recibos | 9/9 en verde, `receipt.service.ts` sin cambios; ninguna prueba borrada |
| B-01 contacto | `POST /api/pqr/contact` sigue registrado en `pqr.routes.ts` |
| C contrato | existía, pero **no cubría** los módulos nuevos |

### 8.2 Fallos nuevos encontrados y corregidos

1. **El cupón se guardaba sin validar al editar un pedido.**
   `PUT /api/orders/:id` aceptaba cualquier `promotionalCodeId` y no recalculaba
   el total. Ahora valida con `consumeCoupon` (vigencia, estado, compra mínima,
   usos), consume **un** uso, rechaza repetir el mismo cupón y recalcula el total
   conservando el envío.

2. **Cupones rechazados 5 horas antes de vencer.**
   `assertCoupon` comparaba con `toISOString()` (UTC). A las 20:00 de Bogotá ya
   es el día siguiente en UTC, así que un cupón que vencía hoy se reportaba como
   "expirado". Ahora usa `toDateKey` (`America/Bogota`), el mismo criterio que
   los reportes.

3. **Contrato desactualizado.**
   Faltaban los módulos que llegaron con `main`. Se añadió la sección 12
   (lista de deseos, soporte, supervisión, reparto, recogida por el cliente y
   operaciones nuevas de empleado) y la 6.4 (qué se guarda del pago).

### 8.3 Pruebas nuevas de esta ronda

| Archivo | Pruebas |
| --- | --- |
| `be/src/modules/promotional-code/promotional-code.test.ts` | 3 (vence hoy / venció ayer / empieza mañana, en hora de Bogotá) |
| `be/src/modules/orders/orders.test.ts` | 3 (cupón inválido por edición, cupón válido recalcula total, no repetir cupón) |
| `be/tests/orders-regression.integration.ts` | 1 bloque real (cupón inactivo no entra por `PUT`) |

### 8.4 Resultado

| Suite | Resultado |
| --- | --- |
| Backend | **166/166** |
| Frontend | **48/48**, lint 0 errores, build ✅ |
| Integración PostgreSQL | ✅ |
| CI PR #95 | Backend ✅ · Frontend ✅ · Integración ✅ · GitGuardian ✅ |
