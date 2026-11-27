# Contrato de API — Estuche Virtual

| Campo | Valor |
| --- | --- |
| Versión del documento | 1.0 |
| Fecha | 2026-11-26 |
| Base local | `http://localhost:4000` (`PORT` en `be/.env`) |
| Prefijo | `/api` |
| Formato | JSON UTF-8; montos como número decimal (`12345.67`), moneda **COP** |
| Autenticación | `Authorization: Bearer <JWT>` |
| Última revisión de código | `be/src/app.ts` + rutas de cada módulo |

Este documento es el contrato que consume el frontend (Paula). Describe método,
ruta, autenticación, entradas, respuesta, errores y **efectos sobre stock,
pedidos y cupones**. Todo lo aquí escrito se verificó leyendo el router real,
no la documentación previa.

---

## 0. Convenciones

### 0.1 Autenticación y roles

El middleware `verifyToken` (`be/src/middlewares/auth.middleware.ts`):

1. Exige `Authorization: Bearer <token>`, si no → **401** `{ "message": "Token requerido" }`.
2. Verifica el JWT con `JWT_SECRET`, si falla → **401** `{ "message": "Token inválido o expirado" }`.
3. **Vuelve a leer el usuario en la base de datos.** Si no existe, está inactivo
   o tiene `deletedAt`, → **401** `{ "message": "Cuenta no disponible" }`.
4. Copia en `req.user` el `id`, `name`, `email` y el **rol vigente de la BD**
   (no el del token). Un token viejo con rol elevado no escala privilegios.

Roles: `client`, `employee`, `admin`, `superadmin`.

| Guarda | Roles admitidos | Respuesta si falla |
| --- | --- | --- |
| `verifyToken` | cualquier usuario activo | 401 |
| `verifyAdmin` | `admin`, `superadmin` | 403 `{ "message": "Acceso restringido a administradores" }` |
| `verifySuperAdmin` | `superadmin` | 403 `{ "message": "Acceso restringido a superadmin" }` |

### 0.2 Forma de los errores

Todos los errores pasan por `errorHandler` (`be/src/middlewares/error.middleware.ts`).
Los errores de negocio se ven así:

```json
{ "ok": false, "message": "Un pedido debe incluir al menos un producto." }
```

Con datos extra cuando aplica (`minimumPurchase`, `missingAmount`,
`available`, `requested`, `existingId`, `retryAfter`). Si el status es 429 y hay
`retryAfter`, se envía además la cabecera `Retry-After` (segundos).

Los errores de validación de Zod los produce el middleware `validate` y tienen
otra forma:

```json
{
  "message": "Indica una dirección para domicilio.",
  "errors": [{ "path": ["deliveryAddress"], "message": "…" }]
}
```

Un fallo no controlado responde **500** `{ "ok": false, "message": "Error interno del servidor" }`.

| Código | Significado en esta API |
| --- | --- |
| 400 | Datos inválidos o regla de negocio incumplida (stock, cupón, estado, dirección) |
| 401 | Sin token, token inválido o cuenta no disponible |
| 403 | Rol insuficiente, o el recurso pertenece a otro usuario |
| 404 | El recurso no existe (o está eliminado lógicamente) |
| 409 | Conflicto: duplicado, operación ya resuelta, recurso bloqueado |
| 423 | Cuenta bloqueada por intentos fallidos |
| 429 | Límite de peticiones (`Retry-After` cuando aplica) |
| 503 | `/api/health/ready` con la base de datos caída |

### 0.3 Listas, paginación y borrado lógico

- Los listados devuelven un **array JSON plano**, sin envoltorio `data`.
- No hay paginación por query string: se devuelve todo lo visible para el rol.
  Para pedidos el orden es `orderDate desc`; para PQR, `createdAt desc`.
- Los recursos con borrado lógico (productos, pedidos, usuarios) **no se
  destruyen**: se marca `deletedAt` y desaparecen de los listados y de las
  consultas. Un pedido eliminado ya no aparece en reportes.
- `DELETE` con éxito responde **204** sin cuerpo (pedidos, productos, usuarios,
  categorías, códigos promocionales). Recibos y devoluciones **no se eliminan**.

### 0.4 Idempotencia

Las operaciones de pago y de creación de pedido operativo aceptan una llave de
idempotencia en el cuerpo (`requestKey`, UUID v4). Repetir la misma petición con
la misma llave devuelve el resultado original en vez de duplicar el efecto. Si
la llave ya existe con **otro** contenido → **409**.

---

## 1. Estado del servicio

### `GET /api/health` — público

```json
{
  "status": "ok",
  "service": "estuche-virtual-api",
  "env": "development",
  "uptimeSeconds": 42,
  "timestamp": "2026-11-26T15:00:00.000Z"
}
```

### `GET /api/health/ready` — público

`200` → `{ "status": "ready", "database": "up", "timestamp": "…" }`
`503` → `{ "status": "not-ready", "database": "down", "timestamp": "…" }`

---

## 2. Autenticación — `/api/auth`

Rate limit global del router: `RATE_LIMIT_MAX` (10) por `RATE_LIMIT_WINDOW_MS`
(15 min). Al excederse → **429** `{ "message": "Demasiados intentos. Intenta de nuevo más tarde." }`.

### `POST /api/auth/register` — público

Entrada: `email`, `password`, `fullName` y, según el esquema, `phone`/`address`.
Respuesta **201**: usuario creado y token de sesión.

### `POST /api/auth/login` — público

Entrada: `email`, `password`.
Respuesta **200**: `{ "token": "…", "user": { "id", "email", "fullName", "role" } }`.

| Error | Cuándo |
| --- | --- |
| 401 | Credenciales incorrectas |
| 423 | Cuenta bloqueada (`lockedUntil`) |
| 403 | Cuenta inactiva o eliminada |

### `GET /api/auth/me` — `verifyToken`

Respuesta **200**: datos del usuario autenticado (`role` vigente de la BD).

### `POST /api/auth/forgot-password`, `/verify-reset-token`, `/reset-password` — públicos

Flujo de recuperación por correo. `forgot-password` no revela si el correo
existe (responde igual en ambos casos).

---

## 3. Pedidos — `/api/orders`

Router completo bajo `verifyToken`. `assertOrderAccess` limita a
`client`, `admin` y `superadmin` (**403** para `employee`).

### `GET /api/orders`

- `client` → solo sus pedidos (`customerId = req.user.id`).
- `admin`/`superadmin` → todos.
- Siempre filtra `deletedAt: null`.

Respuesta **200**: array de pedidos con `details`, `work`, `customer`,
`driver`, `deliveryAddress`, `promotionalCode`.

### `GET /api/orders/:id`

**200** con el detalle (incluye `receipt.receiptNumber`, `receipt.paymentStatus`
y los `gateway` de sus pagos; **nunca** tokens de pago).
`404` si no existe o está eliminado. `403` si es de otro cliente.

### `POST /api/orders` — crea una venta

Esta es la ruta que crea pedidos de venta. **Todos los montos los calcula el
servidor**; `total` y `unitPrice` del cliente se aceptan por compatibilidad y se
ignoran.

Entrada:

```json
{
  "fulfillmentMethod": "delivery",
  "deliveryAddress": "Calle 45 #12-30, Bogotá",
  "details": [
    { "productId": "00000000-0000-7000-8000-000000000001", "quantity": 2 }
  ],
  "promotionalCode": "REGRESO10"
}
```

| Campo | Tipo | Obligatorio | Regla |
| --- | --- | --- | --- |
| `details` | array | **Sí** | ≥ 1 línea, ≤ 100, sin `productId` repetidos |
| `details[].productId` | UUID | **Sí** | Debe ser un producto **activo** (`deletedAt = null`) |
| `details[].quantity` | entero | **Sí** | 1–999 y ≤ stock disponible |
| `fulfillmentMethod` | `delivery` \| `pickup` | No (default `delivery`) | — |
| `deliveryAddress` | string | Sí si `delivery` y el perfil no tiene dirección | 8–500 caracteres; si falta se usa la del perfil |
| `deliveryAddressId` | UUID | Alternativa | Debe pertenecer al cliente |
| `promotionalCode` | string | No | Se valida completo (vigencia, estado, mínimo, usos) |
| `promotionalCodeId` | UUID | Alternativa | **No** salta la validación: se resuelve y valida igual |
| `customerId` | UUID | Solo admin | Un `client` no puede crear pedidos para otro usuario |
| `status` | string | No | Debe ser `pending`; cualquier otro → 400 |

Respuesta **201**:

```json
{
  "id": "…",
  "customerId": "…",
  "status": "pending",
  "total": "10270.00",
  "shippingCost": "10000.00",
  "fulfillmentMethod": "delivery",
  "deliverySnapshot": "Calle 45 #12-30, Bogotá",
  "promotionalCodeId": null,
  "expiresAt": "2026-11-26T16:00:00.000Z"
}
```

Efectos (dentro de **una sola transacción**; si algo falla no queda nada escrito):

1. Se crea el `Order` en `pending` con `expiresAt` (reserva).
2. Por cada línea: se descuenta `stock` con `UPDATE … WHERE stock >= cantidad AND deleted_at IS NULL`
   y se registra un `InventoryMovement` de tipo `out`.
3. Si hay cupón: se consume **un** uso (`currentUses + 1`).
4. Se escribe un `OrderEvent` `created`.

Errores esperados:

| Status | Mensaje | Causa |
| --- | --- | --- |
| 400 | `Un pedido debe incluir al menos un producto.` | `details` vacío o ausente |
| 400 | `Indica una dirección para domicilio.` | `delivery`, sin dirección en el cuerpo **y** sin dirección en el perfil |
| 400 | `El producto … ya no está disponible en el catálogo.` | Producto inexistente o eliminado |
| 400 | `Stock insuficiente para "…"…` | Cantidad > stock |
| 400 | `El producto … dejó de estar disponible o no tiene stock suficiente.` | Carrera de stock al descontar |
| 400 | `No encontramos ese cupón…` / `Este cupón ha expirado.` / `…no está activo.` / `…alcanzó su límite de usos.` / `…requiere al menos $…` | Cupón inválido |
| 400 | `El pedido debe tener un total mayor que cero.` | Descuento total |
| 403 | `No puedes crear un pedido a nombre de otro usuario.` | `customerId` ajeno |
| 403 | `La dirección no pertenece a la cuenta del cliente.` | `deliveryAddressId` ajeno |

### `PUT /api/orders/:id` — `verifyAdmin`

Actualiza `customerId`, `driverId`, `promotionalCodeId`, `deliveryAddressId`,
`total`, `status`. **400** si `status = "paid"`: ese estado solo lo pone el flujo
de pagos. **409** si el pedido lo gestiona un empleado (`OrderWork`).

### `DELETE /api/orders/:id` — `verifyAdmin`

Borrado lógico (**204**). **409** si el pedido está bajo gestión de empleado.

### `PATCH /api/orders/:id/apply-code`

Aplica un cupón a un pedido **pendiente** ya creado.

Entrada: `{ "code": "REGRESO10" }` (se normaliza: se recortan espacios y se
ignora mayúsculas).

Respuesta **200**: el pedido con `promotionalCode { code, value, type }`.

Reglas:
- El pedido debe ser del cliente o el solicitante ser admin.
- Solo en `pending`.
- Aplica también a pedidos creados por el checkout, aunque tengan
  `createdById` (esa marca solo restringe la *edición* del contenido, no esta
  operación financiera).
- **Un pedido admite un único cupón**: si ya tiene uno → 400 `Este pedido ya tiene un cupón aplicado.`
- Se validan vigencia, estado, compra mínima y usos disponibles.
- El uso se consume **una sola vez** por pedido (`currentUses + 1`).
- El `total` se recalcula: `subtotal (precios de BD) − descuento + shippingCost`.
  El envío **no** cambia: el umbral de envío gratis se mide sobre el subtotal
  antes del cupón.

| Status | Causa |
| --- | --- |
| 400 | Cupón inválido / pedido no pendiente / cupón ya aplicado |
| 403 | Pedido ajeno |
| 404 | Pedido o cupón inexistente |
| 409 | Pedido gestionado por un empleado |

---

## 4. Carrito — `/api/shopping` (todo bajo `verifyToken`)

| Método | Ruta | Entrada | Respuesta |
| --- | --- | --- | --- |
| GET | `/api/shopping` | — | 200: ítems con `product` (nombre, precio, stock, imágenes) |
| POST | `/api/shopping` | `{ productId, quantity? }` | 200/201: ítem creado o incrementado |
| PUT | `/api/shopping/:productId` | `{ quantity }` | 200: ítem actualizado; `quantity = 0` lo elimina y responde 200 |
| DELETE | `/api/shopping/:productId` | — | 200 |
| DELETE | `/api/shopping/clear` | — | 200, vacía el carrito |

Reglas: solo productos activos (`400` `Este producto ya no está disponible.`),
cantidad acumulada ≤ `min(999, stock)` (`400` `No hay suficientes unidades…`),
y bloqueo por `cart:<userId>:<productId>` para evitar dobles clics.

---

## 5. Códigos promocionales — `/api/promotional-codes`

### `POST /api/promotional-codes/validate` — `verifyToken` (cliente incluido)

Dos modos:

1. **Cotización con carrito** (recomendado por el frontend):

```json
{ "code": "REGRESO10", "items": [{ "productId": "…", "quantity": 2 }] }
```

Respuesta **200**:

```json
{
  "code": "REGRESO10",
  "type": "percentage",
  "value": 10,
  "subtotal": 60000,
  "discountAmount": 6000,
  "shippingCost": 10000,
  "total": 64000
}
```

2. **Validación con total explícito**: `{ "code": "…", "total": 60000 }` → **200**
   con el cupón. Este modo es orientativo: el cobro siempre se recalcula en el
   checkout.

**Validar NO consume usos.** Solo el checkout (`POST /api/orders` o
`POST /api/payments/demo/checkout`) los consume.

Errores (**400**, todos con `message` descriptivo): inexistente,
inactivo, fuera de vigencia, por debajo de la compra mínima (incluye
`minimumPurchase` y `missingAmount`), sin usos disponibles, descuento mal
configurado, producto eliminado o sin stock (`Actualiza tu carrito…`).

### `POST /api/promotional-codes/apply` — `verifyToken`

Compatibilidad: valida el código y devuelve `{ "id": "…" }`. **No** consume usos
ni modifica pedidos. Para aplicar de verdad usa `PATCH /api/orders/:id/apply-code`.

### Resto del módulo — `verifySuperAdmin`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/` | 200: todos los cupones |
| POST | `/` | 201: `code, description?, type, value, minPurchase?, startDate, endDate, maxUses?, active?` |
| PUT | `/:id` | 200: cupón actualizado |
| PATCH | `/:id/toggle` | 200: alterna `active` |
| DELETE | `/:id` | 204 |

---

## 6. Pagos (demostración académica) — `/api/payments`

> **Advertencia:** es una **simulación**. No hay cobro real, no se piden números
> de tarjeta, CVV, claves ni credenciales financieras. Requiere
> `ENABLE_PAYMENT_SIMULATION=true` y `NODE_ENV` `development` o `test`; en
> producción responde deshabilitado.

Router bajo `verifyToken` + rate limit de 60 peticiones/minuto (**429**
`Demasiados intentos de pago. Espera un minuto.`).

### `GET /api/payments/config`

```json
{
  "enabled": true,
  "simulated": true,
  "currency": "COP",
  "shipping": {
    "deliveryFee": 10000,
    "freeFrom": 120000,
    "basis": "subtotal_before_discount"
  }
}
```

### `POST /api/payments/demo/checkout`

```json
{
  "requestKey": "22222222-2222-4222-8222-222222222222",
  "method": "tarjeta",
  "outcome": "approved",
  "address": "Calle de prueba 123, Bogotá",
  "phone": "3001234567",
  "code": "REGRESO10",
  "items": [{ "productId": "…", "quantity": 2 }]
}
```

- `method`: `tarjeta` | `pse` | `nequi`. **Es una etiqueta de la simulación**: no
  se guarda ningún dato de medio de pago, solo el nombre del método en
  `Payout.method`.
- `outcome`: `approved` | `rejected` | `pending`.
- `items`: 1–100 líneas, sin productos repetidos, cantidades 1–999.
- `phone`: celular colombiano de 10 dígitos (`^3\d{9}$`).
- `requestKey`: UUID; es la llave de idempotencia.

Respuesta **200**:

```json
{
  "simulated": true,
  "message": "Demostración académica: no hubo ningún cobro real.",
  "reference": "DEMO-22222222-2222-4222-8222-222222222222",
  "status": "approved",
  "method": "tarjeta",
  "amount": "12500.25",
  "shippingCost": "10000.00",
  "currency": "COP",
  "orderId": "…",
  "orderStatus": "paid",
  "receiptNumber": 100,
  "expiresAt": null
}
```

Efectos: crea `Order` + `OrderDetail` + `Receipt` + `ReceiptItem` + `Payout`,
descuenta stock, registra movimientos `out`, vacía el carrito de esos productos
y actualiza `User.phone`/`User.address`. Un cupón consume **un** uso.

Errores: 400 (producto no disponible, stock, cupón, total ≤ 0), 403 (rol),
404 (pago ajeno), 409 (`La reserva venció o el pedido ya no admite pagos.`,
`El pedido requiere revisión financiera.`, referencia de otro intento).

### `GET /api/payments/demo/:key` y `POST /api/payments/demo/:key/resolve`

Consulta y resuelve un intento propio (`{ "outcome": "approved" | "rejected" }`).
Aprobar deja el pedido `paid`; rechazar lo pasa a `canceled`, **devuelve el
stock**, registra movimientos `in` y restaura el carrito para reintentar. La
resolución es definitiva: repetirla → **409**.

---

### 6.4 Qué se guarda y qué es simulación (B-02)

| Dato | ¿Se guarda? | Dónde / por qué |
| --- | --- | --- |
| Método elegido por el cliente | **Sí** | `Payout.method` = `tarjeta` \| `pse` \| `nequi` |
| Método del pago en tienda | **Sí** | `Payout.method` = `cash` \| `card` (personal de tienda) |
| Monto, moneda, estado | **Sí** | `Payout.amount`, `currency`, `status` |
| Número de tarjeta, CVV, OTP, claves Nequi | **No** | El formulario ni los pide: el checkout lo advierte en pantalla |
| Datos bancarios PSE | **No** | No hay redirección a un banco real |
| Token de la pasarela | **Sí, sintético** | `Payout.gatewayToken` = huella del intento, no un token real |
| Identificador del intento | **Sí** | `Payout.transactionId` (`requestKey`), único e idempotente |

**Simulación:** todo el cobro. `POST /api/payments/demo/checkout` está
bloqueado fuera de desarrollo (`ENABLE_PAYMENT_SIMULATION` + entorno no
productivo). El **pago en tienda** (`POST /api/employee/orders/:id/store-payment`)
no procesa tarjetas: registra un cobro que ya ocurrió físicamente y sincroniza
el recibo.

## 7. Recibos — `/api/receipts` (todo bajo `verifyToken`)

| Método | Ruta | Roles | Notas |
| --- | --- | --- | --- |
| GET | `/api/receipts` | autenticado | Listado con cliente, empleado y pedido |
| POST | `/api/receipts` | client/admin/superadmin | Cliente solo de pedidos propios |
| PUT | `/api/receipts/:id` | autenticado | No editable si tiene pagos |
| DELETE | `/api/receipts/:id` | — | **409**: eliminación deshabilitada |

Reglas del servidor:

- `total` y `customerId` de un recibo ligado a pedido se toman **del pedido**;
  el valor enviado en la petición se ignora.
- Un recibo nuevo siempre nace `pending`: enviar `paymentStatus: "paid"` → **400**.
- `paymentStatus` y `employeeId` **no** se cambian por esta vía → **400**
  (`El estado financiero solo puede cambiar desde el flujo de pagos.`).
- Un recibo con pagos registrados → **409** (`No se puede editar un recibo con pagos…`).
- Un pedido admite **un** recibo; el segundo intento → **409**
  (`El pedido ya tiene un recibo asociado.`).
- Cliente sin `orderId` propio → **403** (`Los clientes deben indicar un pedido propio.`).

---

## 8. Inventario — `/api/inventory` (`verifyToken` + `verifyAdmin`)

| Método | Ruta | Entrada |
| --- | --- | --- |
| GET | `/api/inventory/movements` | — |
| GET | `/api/inventory/outbound/reasons` | — |
| POST | `/api/inventory/inbound` | `{ productId, quantity, reasonDetail? }` |
| POST | `/api/inventory/outbound` | `{ productId, quantity, reasonDetail }` |

- Cantidades enteras > 0. `reasonDetail` de al menos 3 caracteres.
- Solo productos activos: un producto eliminado → **404**
  `Producto no encontrado en el catálogo activo.`
- Descuento atómico con `WHERE stock >= cantidad AND deleted_at IS NULL`: si no
  alcanza → **400** con `available` y `requested`.
- Cada movimiento queda auditado con el usuario que lo hizo.

---

## 9. Contacto — `/api/pqr/contact` (B-01)

**Decisión acordada:** el formulario público de Contacto **no** usa un envío de
correo suelto; se registra como **PQR de tipo `petition`** del cliente
autenticado. Así entra al mismo flujo, SLA y bandeja que el resto de PQR, y el
cliente puede seguir la respuesta en *Mis PQR*.

`POST /api/pqr/contact` — `verifyToken`, rol `client` (rate limit 10/min).

```json
{
  "name": "Ana Pérez",
  "email": "ana@example.com",
  "topic": "envio",
  "subject": "Pedido retrasado",
  "message": "Quisiera saber cuándo llegará mi pedido a Medellín."
}
```

| Campo | Regla |
| --- | --- |
| `name` | 2–150 |
| `email` | correo válido, ≤ 255 |
| `topic` | `pedido` \| `producto` \| `envio` \| `devolucion` \| `otro` |
| `subject` | 5–160, opcional (si falta se usa la etiqueta del tema) |
| `message` | 20–5000 |

Respuesta **201**:

```json
{
  "id": "…",
  "status": "received",
  "createdAt": "2026-11-26T15:00:00.000Z",
  "message": "Recibimos tu mensaje. Puedes seguir su respuesta en Mis PQR."
}
```

Errores: 401 sin sesión; 403 si el rol no es `client`; 409 si es idéntico a un
PQR reciente; 429 si se envía otro en el mismo minuto (con `Retry-After`).

> **Para el frontend:** si no hay sesión, la página redirige a `/login`. El correo
> del formulario se guarda en el cuerpo del PQR para trazabilidad, pero la
> cuenta dueña del PQR es siempre la sesión autenticada.

### Resto de PQR — `/api/pqr`

| Método | Ruta | Roles | Notas |
| --- | --- | --- | --- |
| GET | `/` | client (propios) / admin / superadmin (todos) | `createdAt desc` |
| GET | `/:id` | dueño o staff | 403 si es de otra persona |
| POST | `/` | `client` | `{ type, subject, description }`; anti-duplicado y 1/min |
| PATCH | `/:id` | `admin`/`superadmin` | `{ status, response? }`; notifica por correo |

`type`: `petition` | `complaint` | `claim`.
`status`: `received` | `in_progress` | `answered` | `closed`.

---

## 10. Operaciones de empleado — `/api/employee`

Router bajo `verifyToken`; las rutas de gestión exigen rol de staff
(`employee`, `admin`, `superadmin`). Es el flujo operativo real (recepción,
picking, empaque, despacho, retiro en tienda), separado del CRUD administrativo.

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/my-pickups` | Pedidos de retiro del cliente autenticado |
| POST | `/orders/:id/pickup-code` | Código de retiro (rate limit 10/min) |
| GET | `/summary` | Resumen operativo |
| GET | `/drivers`, `/employees` | Catálogos |
| GET | `/orders` | Cola operativa |
| POST | `/orders` | Crea pedido con `requestKey` (idempotente) |
| GET | `/orders/:id` | Detalle operativo |
| POST | `/orders/:id/claim` | Toma el pedido |
| PATCH | `/orders/:id/picking` | `{ items: [{ detailId, pickedQuantity }] }` |
| POST | `/orders/:id/pack`, `/incident`, `/resolve`, `/reassign` | Empaque e incidencias |
| POST | `/orders/:id/dispatch` | Despacho a domicilio |
| POST | `/orders/:id/pickup` | Entrega en tienda |
| POST | `/orders/:id/cancel` | Cancela y libera stock |
| POST | `/orders/:id/simulate-payment` | Pago simulado de demostración |
| POST | `/inventory` | Movimiento de inventario operativo |

**Regla de dirección (A-02 aplicada al flujo operativo):** en `POST /orders`,
`fulfillmentMethod: "delivery"` exige `address` (8–500 caracteres) y
`fulfillmentMethod: "pickup"` **no** la exige. La misma regla vive en
`newEmployeeOrder` y se prueba en `despatch.address.test.ts`.

Mientras un pedido tenga `OrderWork`, el CRUD de `/api/orders` no puede
modificarlo ni eliminarlo (**409**).

---

## 11. Reportes — `/api/reports`

### `GET /api/reports/admin-dashboard` — `verifyToken` + `verifyAdmin`

Totales para el panel administrativo.

### `GET /api/reports` y `GET /api/reports/summary` — `verifySuperAdmin`

Filtros opcionales `from` y `to` (`YYYY-MM-DD`; `from > to` → **400**).

Respuesta **200** (una fila por día):

```json
{
  "id": "report-2026-11-26",
  "date": "2026-11-26",
  "totalOrders": 3,
  "deliveredOrders": 1,
  "canceledOrders": 0,
  "totalSold": 45200,
  "totalPaid": 45200,
  "totalRefunded": 0,
  "productsSold": 7,
  "newCustomers": 1
}
```

**¿Una venta nueva actualiza los reportes?** Sí, sin pasos manuales. El cálculo
lee `orders` (con `deletedAt: null`) y `receipts`/`payouts`/`returns` en el
momento de la consulta. Un pedido `pending` ya suma en `totalOrders`,
`totalSold` y `productsSold`; `canceled` solo cuenta en `canceledOrders`; el
dinero efectivamente pagado se toma de `Payout` aprobados y de `Receipt` en
`paid`, evitando el doble conteo. Verificado con
`be/src/modules/reports/reports.sales.test.ts`.

---

## 12. Módulos agregados en `main` (posteriores al contrato inicial)

Estos módulos llegaron con la integración de `main` y **no** estaban en la
primera versión del contrato. Todos usan `verifyToken` salvo que se indique.

### 12.1 Lista de deseos — `/api/lista-deseos`

| Método | Ruta | Rol | Entrada | Éxito | Errores |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/` | cualquiera autenticado | — | `200` array de productos | `401` |
| `POST` | `/` | cualquiera autenticado | `{ productId: uuid }` (`.strict()`) | `201` | `400` producto inexistente o ya guardado, `401` |
| `DELETE` | `/:productId` | cualquiera autenticado | — | `204` | `401`, `404` |

**Efecto:** favoritos privados por usuario. No toca stock, pedidos ni cupones.

### 12.2 Soporte (hilos) — `/api/support`

| Método | Ruta | Rol | Entrada | Éxito | Errores |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/threads` | autenticado | — | `200` hilos propios (staff: los asignados) | `401` |
| `GET` | `/threads/:id` | autenticado + dueño | — | `200` hilo con mensajes | `403`, `404` |
| `POST` | `/threads` | autenticado | `{ subject, body }` | `201` | `400`, `429` (límite de escritura) |
| `POST` | `/threads/:id/messages` | autenticado + dueño | `{ body }` | `201` | `400`, `403`, `429` |

**Efecto:** solo mensajería. No modifica pedidos.

### 12.3 Operaciones de supervisión — `/api/supervision` (`verifyAdmin`)

| Método | Ruta | Entrada | Éxito | Efecto |
| --- | --- | --- | --- | --- |
| `GET` | `/employees` | — | `200` | lista de empleados |
| `GET` | `/orders?page=&scope=supervision` | — | `200` | pedidos en supervisión |
| `POST` | `/orders/:id/resolve` | `{ note }` | `200` | resuelve la incidencia |
| `POST` | `/orders/:id/reassign` | `{ note, assigneeId }` | `200` | reasigna el pedido |
| `POST` | `/orders/:id/cancel` | `{ note }` | `200` | cancela y **libera el stock** |
| `POST` | `/orders/:id/simulate-payment` | `{ requestKey, result }` | `200` | simula el pago |
| `GET` | `/movements` \| `/activity` | `?page=` | `200` | auditoría paginada |

**Errores:** `400` consulta inválida, `403` sin rol, `404` pedido inexistente,
`409` estado incompatible.

### 12.4 Repartidor — `/api/delivery` (rol `delivery` obligatorio)

| Método | Ruta | Entrada | Éxito | Efecto |
| --- | --- | --- | --- | --- |
| `GET` | `/pending-orders` | — | `200` | pedidos sin asignar |
| `POST` | `/pending-orders/:id/claim` | cuerpo vacío | `200` | el repartidor se autoasigna |
| `GET` | `/despatches` | — | `200` | envíos en tránsito propios |
| `POST` | `/despatches/:id/confirm` | cuerpo vacío | `200` | confirma la entrega |

**Errores:** `403` si el rol no es `delivery` o el despacho es de otro
repartidor, `404`, `409` si ya fue confirmado. **Nota:** las rutas con
"cuerpo vacío" rechazan cualquier campo enviado.

### 12.5 Recogida por el cliente — `/api/client`

| Método | Ruta | Rol | Éxito | Efecto |
| --- | --- | --- | --- | --- |
| `GET` | `/my-pickups` | autenticado | `200` pedidos listos para recoger | — |
| `POST` | `/orders/:id/pickup-code` | dueño del pedido | `200` `{ code }` | emite el código de recogida |

**Errores:** `403` pedido ajeno, `404`, `409` pedido no listo, `429` (10/min).
El código tiene 16 caracteres hexadecimales y se valida en
`POST /api/employee/orders/:id/pickup` junto con el nombre de quien recoge.

### 12.6 Operaciones nuevas de empleado — `/api/employee`

Requieren rol `employee` o `supervisor` (`assertStaff`).

| Método | Ruta | Entrada | Efecto |
| --- | --- | --- | --- |
| `GET` | `/summary` | — | resumen del turno |
| `GET` | `/customers?q=` \| `/products?q=` | — | búsqueda para crear pedidos |
| `GET` | `/orders?page=&scope=` | — | lista paginada |
| `POST` | `/orders` | `{ requestKey, customerId, fulfillmentMethod, address?, details[1..100] }` | crea pedido + recibo y **reserva stock** |
| `GET` | `/orders/:id` | — | detalle |
| `POST` | `/orders/:id/claim` | cuerpo vacío | toma el pedido |
| `PATCH` | `/orders/:id/picking` | `{ items: [{ detailId, pickedQuantity }] }` | confirma el empaque **por producto** |
| `POST` | `/orders/:id/pack` | — | cierra el empaque |
| `POST` | `/orders/:id/incident` | `{ note }` | reporta incidencia |
| `POST` | `/orders/:id/pickup` | `{ code, recipientName }` | entrega en tienda |
| `POST` | `/orders/:id/store-payment` | `{ requestKey, method, … }` | registra **pago en tienda** |
| `POST` | `/inventory` | `{ requestKey, productId, type, quantity, reason }` | movimiento de inventario |

**Validaciones del alta de pedido** (`POST /orders`):
`fulfillmentMethod` en `delivery|pickup`; `address` obligatoria (8–500) **solo**
en domicilio; `details` con 1..100 líneas y `quantity` entera 1..100000; el
cuerpo es `.strict()`. El stock se bloquea con `FOR UPDATE` y se descuenta con
`deletedAt: null`, así que **no se venden productos eliminados**.

**Efectos sobre stock:** descuento al crear (`type: 'out'`), devolución al
cancelar o rechazar el pago, y ajuste manual vía `POST /inventory`.

---

## 13. Otros módulos (referencia rápida)


| Módulo | Base | Autenticación | Notas |
| --- | --- | --- | --- |
| Productos | `/api/products` | GET público; escritura `verifyAdmin` | `DELETE` = borrado lógico; los eliminados no salen en catálogo ni se pueden comprar |
| Categorías | `/api/categories` | GET público; escritura `verifyAdmin` | — |
| Combos | `/api/combos` | `verifyToken` + `verifyAdmin` | — |
| Proveedores | `/api/providers` | `verifyToken` + `verifyAdmin` | — |
| Despachos | `/api/despatches` | `verifyToken` + `verifyAdmin` | `address` opcional, ≤ 500 caracteres |
| Detalle de pedido | `/api/order-details` | `verifyToken` + `verifyAdmin` | CRUD administrativo |
| Payouts | `/api/payouts` | `verifyToken` + `verifySuperAdmin` | `PATCH /:id/status` |
| Devoluciones | `/api/returns` | `verifyToken` | Crear: `client` (propias) o `superadmin`; resolver: `superadmin` |
| Usuarios | `/api/users` | `verifyToken` (+`verifyAdmin` / `verifySuperAdmin`) | — |

---

## 14. Pendientes y límites conocidos

1. **Contacto** ya tiene endpoint real (`POST /api/pqr/contact`) y crea un PQR.
   No envía un correo independiente: la notificación ocurre cuando el staff
   responde el PQR.
2. **Métodos de pago**: se guarda solo el identificador del método
   (`tarjeta`/`pse`/`nequi`) en `Payout.method`. **No** se guardan números de
   tarjeta, CVV, OTP ni credenciales bancarias: toda la pasarela es simulación
   académica deshabilitada en producción.
3. **Paginación**: los listados no paginan. Con volúmenes grandes de pedidos o
   movimientos habrá que añadir `page`/`limit` (cambio compatible si se mantiene
   el array como respuesta por defecto).
4. **Cupones en la edición de pedidos**: `PUT /api/orders/:id` valida el cupón
   (vigencia, estado, compra mínima, usos) y **consume** un uso, igual que el
   checkout. Antes se guardaba cualquier `promotionalCodeId` sin validar.
5. **Vigencia de cupones**: se compara por **día calendario de Colombia**
   (`America/Bogota`), no por UTC. Un cupón que vence hoy sigue siendo válido
   hasta la medianoche local.
6. **OpenAPI**: este Markdown es la fuente de verdad. Si se requiere
   `openapi.yaml` para generadores de clientes, se puede derivar de aquí.
