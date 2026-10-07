# Diagnóstico: por qué la base de datos "no guarda la información completa"

**Rama:** `develop` (trabajo en `arena/e068001f-estuche-virtual3-0`)
**Fecha:** 2026-10-07
**Alcance:** carga y persistencia de datos (productos, cantidades, pedidos, carrito, usuarios)

---

## 1. Resumen ejecutivo

La aplicación **sí tiene base de datos PostgreSQL** y **sí escribe en ella**, pero
hay **diez fallas** que hacen que la información parezca perderse. La causa no es
una sola: son capas distintas del sistema que fallan de forma silenciosa.

Las tres más graves:

| # | Falla | Efecto visible |
|---|-------|----------------|
| 1 | `PUT /api/products/:id` reescribía `category_id` y `supplier_id` a `NULL` | Al editar **cualquier** campo de un producto se le borraban la categoría y el proveedor |
| 2 | `DELETE /api/users/:id` hacía borrado **físico en cascada** | Al borrar un cliente desaparecían sus pedidos, detalles, envíos y recibos |
| 3 | `PUT /api/orders/:id` y `DELETE /api/orders/:id` **no exigían token** + el desplegable de estados enviaba un valor que no existe en el enum | Cambiar el estado de un pedido devolvía error 500 y el cambio no se guardaba |

Y tres fallas de entorno que explican el síntoma *"hay que volver a agregar los
datos con cada cambio"*:

| # | Falla | Efecto visible |
|---|-------|----------------|
| 4 | El `seed` se ejecutaba en **cada arranque** y reescribía rol y contraseña de los usuarios existentes | Lo que se cambiaba desde el panel se revertía al reiniciar el contenedor |
| 5 | `docker-compose.yml` usaba `network_mode: host` y no definía `VITE_API_URL` | En Docker Desktop (Windows/Mac) el backend no encontraba la BD; el frontend apuntaba a un host que no existía |
| 6 | Los paneles (`AdminDashboard`, `ClientDashboard`) mostraban **datos fijos en el código**, no consultas | Aunque la BD cambiara, la pantalla seguía mostrando "124 productos" |

> **Conclusión:** no es que la base de datos no guarde. Es que (a) varios
> endpoints escribían información incompleta o destructiva, (b) la aplicación
> mentía en pantalla porque no verificaba la respuesta del servidor, y (c) el
> arranque del contenedor revertía parte de los datos.

---

## 2. Cómo viaja la información hoy

```
Navegador (React)  ──fetch──►  API Express  ──Prisma──►  PostgreSQL (estuche_virtual)
     │                             │                          │
     │  CartContext                │  services/*.ts           │  migraciones
     │  Products.tsx               │  routes/*.ts             │  prisma/migrations
     │  Orders.tsx                 │  middlewares             │  docker: volumen ./db_data
     └─ localStorage (solo token, usuario y tema)
```

Puntos de lectura correctos: `GET /api/products`, `GET /api/orders`, `GET /api/reports/summary`.
Puntos de escritura con problemas: productos, pedidos, usuarios, carrito, pagos.

---

## 3. Fallas encontradas (detalle)

### 3.1 Backend

#### F-01 — `products.service.update()` destruía la categoría y el proveedor

`be/src/modules/products/products.service.ts`

```ts
data: {
  categoryId: data.categoryId ?? null,   // ← si el panel no lo manda, lo borra
  supplierId: data.supplierId ?? null,   // ← idem
}
```

El panel de administración **nunca** enviaba `categoryId` (el formulario solo
tenía el *nombre* de la categoría en una lista fija del frontend), así que cada
`PUT` dejaba ambos campos en `NULL`. Al recargar la página el producto aparecía
sin categoría ni proveedor: había que volver a asignarlos.

**Además:** los cambios de precio y de stock **no** se registraban en
`price_history` ni en `inventory_movements`, dos tablas que el modelo ya tiene
(RF-017 y RF-016) y que quedaban siempre vacías.

#### F-02 — No existía endpoint de movimientos de inventario

No había forma de registrar una entrada o salida de mercancía. El único camino
era editar el producto y reescribir el stock a mano, sin dejar rastro en el
kardex (HU-002, HU-003).

#### F-03 — No existía `GET /api/categories`

El esquema tiene tabla `categories` y el *frontend* tenía una lista quemada:
`['Cuadernos', 'Colores', 'Carpetas', 'Lapiceros', 'Mochilas', 'Tijeras']`,
que **no coincide** con las categorías reales de la BD
(`Cuadernos, Escritura, Arte, Oficina, Mochilas, Papeleria, Tecnologia`).
Resultado: los filtros del catálogo y el formulario de productos apuntaban a
categorías inexistentes.

#### F-04 — `PUT /api/orders/:id` y `DELETE /api/orders/:id` sin autenticación

`be/src/modules/orders/orders.routes.ts`

```ts
router.put('/:id',    validate({...}), updateOrder);      // sin verifyToken
router.delete('/:id', validate({...}), deleteOrder);      // sin verifyToken
```

Cualquier persona (sin sesión) podía cambiar el estado de un pedido. Además el
servicio hacía `data: { ...rest, status }`, aceptando `customerId` y `total`
libres desde el cliente.

#### F-05 — El desplegable de estados enviaba un valor inválido

`fe/src/pages/Admin/Orders/Orders.tsx` ofrecía `in_transit`, que **no existe** en
el enum `OrderStatus` (`pending, paid, preparing, shipped, delivered, canceled,
returned`). PostgreSQL rechazaba el valor → 500 → *"Error al actualizar el
estado"* → **el cambio nunca se guardaba**.

#### F-06 — Cancelar un pedido no devolvía el stock

`orderService.update()` cambiaba el estado pero no reponía las unidades: el
inventario se perdía y había que reingresarlo a mano.

#### F-07 — `DELETE /api/users/:id`: borrado físico en cascada

`be/src/modules/users/users.service.ts`

```ts
await tx.orderDetail.deleteMany(...);  // se borra el detalle de la venta
await tx.despatch.deleteMany(...);     // se borran los envíos
await tx.receipt.deleteMany(...);      // se borran los recibos
await tx.order.deleteMany(...);        // se borran los pedidos
await tx.user.delete(...);             // borroado físico del usuario
```

Las tablas tienen `deleted_at` precisamente para evitar esto (borrado lógico,
C-05 / Ley 1581), pero no se usaba.

#### F-08 — Rutas de usuarios abiertas

`GET /api/users` (expone correos), `POST /api/users`, `PUT /api/users/:id`,
`PATCH /api/users/:id/role` y `DELETE /api/users/:id` **no exigían token**.
`canAssignRole(undefined, 'superadmin')` devuelve `true`, así que una petición
anónima podía crear una cuenta `superadmin` o escalar privilegios.

#### F-09 — `POST /api/payouts` no existía

El checkout (`Checkout.tsx`) enviaba el pago a `POST /api/payouts`, pero el router
solo tenía `GET /`, `GET /:id` y `PATCH /:id/status`. El pago **nunca** se
guardaba y el fallo se ignoraba en silencio (`await fetch(...)` sin comprobar).

#### F-10 — El cupón se descontaba dos veces

`Checkout.tsx` llamaba a `POST /api/promotional-codes/apply` (que incrementa
`current_uses`) y después a `POST /api/orders` (que vuelve a incrementarlo).
Cada compra consumía dos usos del cupón.

#### F-11 — El carrito se pierde si el usuario no ha iniciado sesión

`CartContext.tsx` solo sincronizaba con la BD cuando había `user`. Los artículos
agregados como invitado vivían únicamente en memoria de React: al recargar la
página o al iniciar sesión, el carrito quedaba vacío. Tampoco se comprobaba
`res.ok`, así que un error del servidor dejaba la UI mentirosa.

#### F-12 — `docker-entrypoint.sh` ejecutaba el seed en cada arranque

```sh
pnpm prisma db seed 2>/dev/null || echo "(seed skipped or already applied)"
```

Y el seed reescribía **rol y contraseña** de las cuentas existentes:

```ts
await prisma.user.update({ where: { email }, data: { role: usr.role, hashedPassword } });
```

Cada reinicio del contenedor devolvía a los usuarios al estado del seed.
También ocultaba los errores reales de las migraciones con `2>/dev/null`.

#### F-13 — `docker-compose.yml`

- `network_mode: host` en los tres servicios: **no existe en Docker Desktop para
  Windows/macOS**, así que ahí `127.0.0.1:5432` no resuelve y el backend no
  arranca ("falla la conexión a la base de datos").
- El servicio `frontend` **no** definía `VITE_API_URL`, y el proxy de Vite apunta
  a `http://localhost:4000`, que dentro de un contenedor es el propio contenedor.
- El directorio `db/init/` **no** estaba montado en
  `/docker-entrypoint-initdb.d`, por lo que `01_public_schema.sql` nunca se
  aplica (y si se aplicara a mano, rompería `prisma migrate deploy`, porque las
  tablas existirían sin `_prisma_migrations`).

#### F-14 — Dashboards con datos falsos

`AdminDashboard.tsx` y `ClientDashboard.tsx` mostraban arreglos constantes
("124 productos", "38 pedidos hoy", tarjetas de ofertas inventadas). Ninguna
consulta a la BD.

---

## 4. Evidencia: corrida contra PostgreSQL real

Se aplicaron las tres migraciones a un PostgreSQL en vivo y se reprodujeron los
escenarios (script ejecutado en la sandbox, no versionado):

```
✔ Migraciones aplicadas (esquema creado)

📦 Producto recién creado: { stock: 40, categoria: 'Cuadernos', proveedor: 'Papeleria Luna' }
🐛 Tras guardar con el servicio VIEJO  : { stock: 35, categoria: null, proveedor: null }
✅ Tras guardar con el servicio NUEVO  : { stock: 35, categoria: 'Cuadernos', proveedor: 'Papeleria Luna' }

📥 Movimiento registrado: { type: 'in', quantity: 15, reason: 'Entrada de mercancía' } | stock = 50
🛒 Pedido creado   -> stock = 48
↩️  Pedido cancelado -> stock = 50
🗑️  Usuario con borrado lógico -> pedidos conservados = 1 | usuarios activos = 0

💾 Después de "reiniciar" (nueva conexión): { productos: 1, pedidos: 1, movimientos: 1, stock: 50 }
```

El volumen `./db_data` **sí** conserva los datos entre `docker compose down` y
`up`. Lo que los borraba era el código, no Docker (y `docker compose down -v`,
que destruye el volumen: por eso la advertencia de `be/MIGRATION.md` es correcta).

---

## 5. Qué se implementó

### Backend (`be/`)

| Archivo | Cambio |
|---|---|
| `src/modules/products/products.service.ts` | Actualización **parcial** real: solo se escriben los campos que llegan. Registra `price_history` cuando cambia el precio y `inventory_movements` cuando cambia el stock. Nuevo `adjustStock()` (entrada/salida atómica con kardex). Todo en `$transaction`. |
| `src/modules/products/products.routes.ts` | Nuevo `PATCH /api/products/:id/stock` y `GET /api/products/:id`. |
| `src/modules/products/products.schema.ts` | `categoryId`/`supplierId` aceptan `null` explícito; ausente = no tocar. |
| `src/modules/categories/**` (nuevo) | CRUD de categorías; `GET` público para catálogo y formularios. |
| `src/modules/orders/orders.service.ts` | `list()` filtra por dueño (clientes) o todo (personal). `update()` valida permisos, campos permitidos y **reposición de stock** al cancelar/devolver (y descuento al reactivar). `remove()` exige rol de personal. |
| `src/modules/orders/orders.routes.ts` | `verifyToken` en **todas** las rutas; nuevo `GET /api/orders/mine`. |
| `src/modules/orders/orders.schema.ts` | `updateOrderSchema` restringido a `status`, `driverId`, `deliveryAddressId`, `promotionalCodeId`. |
| `src/modules/users/users.service.ts` | `remove()` = borrado **lógico** (`deletedAt` + `isActive=false` + correo anonimizado). `list()` excluye eliminados. `create()` ignora correos de cuentas eliminadas. |
| `src/modules/users/users.routes.ts` | Autenticación y control de rol en todas las rutas. |
| `src/modules/auth/auth.service.ts` | El registro ignora cuentas con borrado lógico (el correo queda libre sin perder el historial). |
| `src/modules/shopping/shopping.service.ts` | Valida producto activo y stock disponible al agregar/actualizar; el carrito ya no lista productos dados de baja. |
| `src/modules/promotional-code/promotional-code.service.ts` | `/apply` **resuelve** el código sin consumir usos (el consumo lo hace la creación del pedido). |
| `src/modules/payout/**` | Nuevo `POST /api/payouts`: el cliente registra el pago de su recibo; el importe sale del recibo. |
| `src/modules/receipt/receipt.service.ts` | Solo el dueño o el personal puede modificar un recibo. |
| `src/modules/reports/reports.service.ts` | El resumen devuelve cifras **reales**: productos, proveedores, recibos, pedidos de hoy, pendientes, productos por agotarse y ventas de los últimos 6 meses. |
| `src/modules/reports/reports.routes.ts` | `/summary` accesible para admin y superadmin. |
| `prisma/seed.ts` | Ya **no** reescribe roles ni contraseñas (`SEED_FORCE=true` lo fuerza). No repone stock. |
| `docker-entrypoint.sh` | Errores de migración visibles; el seed se controla con `RUN_SEED` y nunca borra datos. |

### Frontend (`fe/`)

| Archivo | Cambio |
|---|---|
| `src/context/CartContext.tsx` | Carrito de invitado en `localStorage`, **merge** automático al iniciar sesión, verificación de `res.ok`, reversión del cambio si el servidor lo rechaza y mensaje de error visible. |
| `src/pages/Admin/Products/Products.tsx` | Categorías y proveedores reales desde la BD (por UUID), control de errores del servidor, recarga tras guardar y botones **+/−** de ajuste de inventario. |
| `src/pages/Admin/Orders/Orders.tsx` | Estados válidos del enum (etiquetas en español), `PUT` autenticado, reversión si falla, recarga desde la BD. |
| `src/pages/Admin/{Provider,Despatch,OrderDetails,Receipt}` | Todas las operaciones comprueban `res.ok`, muestran el mensaje del backend y recargan desde la BD en lugar de mutar el estado local. |
| `src/pages/Checkout/Checkout.tsx` | Un solo consumo de cupón; errores visibles en perfil y recibo. |
| `src/pages/Product/Product.tsx` | Una sola petición con la cantidad elegida (antes hacía N peticiones de 1 unidad). |
| `src/pages/Admin/AdminDashboard.tsx` | Cifras, gráfica de ventas, últimos pedidos y alertas de stock **reales**. |
| `src/pages/ClientDashboard/ClientDashboard.tsx` | "Mis pedidos" con el historial real (`GET /api/orders/mine`). |
| `src/api/api.ts` | Se añade `API.categories`. |
| `vite.config.ts` | El destino del proxy se configura con `VITE_PROXY_TARGET` (imprescindible dentro de Docker). |

### Infraestructura

- `docker-compose.yml`: red `bridge` propia (funciona en Linux, Windows y Mac),
  `DATABASE_URL` por nombre de servicio (`db:5432`), `VITE_API_URL` para el
  navegador y `VITE_PROXY_TARGET=http://backend:4000` para el proxy de Vite,
  healthcheck de la BD y `depends_on` con condición.

---

## 6. Puesta en marcha correcta

```bash
# 1. Variables de entorno
cp be/.env-example be/.env      # ajusta JWT_SECRET con al menos 32 caracteres
cp fe/.env-example fe/.env      # VITE_API_URL=http://localhost:4000

# 2. Levantar todo (aplica migraciones y seed idempotente)
docker compose up -d --build

# 3. Verificar
docker compose logs -f backend  # "✅ Migrations applied successfully!"
curl http://localhost:4000/api/products
```

**Reglas para no perder datos:**

1. ✅ `docker compose up/down` — los datos sobreviven (volumen `./db_data`).
2. ❌ `docker compose down -v` — **borra el volumen** y con él toda la BD.
3. ❌ `prisma migrate reset` / `prisma db push` — el esquema lo gobiernan las
   migraciones de `be/prisma/migrations`.
4. ✅ El seed es idempotente: se puede ejecutar tantas veces como se quiera.
5. ❌ No cargues `db/init/01_public_schema.sql` a mano sobre una BD ya migrada:
   crearía las tablas sin registrar `_prisma_migrations` y el siguiente
   `migrate deploy` fallaría. Si heredaste una BD de Supabase, usa
   `db/baseline.sh` para marcar las migraciones como aplicadas.

---

## 7. Verificación

```bash
cd be && pnpm test      # 46 pruebas, incluidas 21 nuevas de regresión
cd fe && pnpm build     # compila sin errores
```

Pruebas nuevas:

- `products.update.test.ts` (9): guardar un producto no borra su categoría ni su
  proveedor; historial de precios; kardex; rechazo de stock negativo; ajustes.
- `orders.status.test.ts` (8): cancelar repone el inventario, reactivar lo
  descuenta, permisos por rol, el cliente solo ve sus pedidos.
- `users.soft-delete.test.ts` (4): el borrado es lógico y conserva pedidos.
- `products.test.ts`: se añadieron 15 rutas a la auditoría C-01 (pedidos,
  usuarios, pagos, `PATCH /products/:id/stock`, `/reports/summary`).

---

## 8. Recomendaciones pendientes (fuera de este cambio)

1. **Índice único parcial**: PostgreSQL no impide dos correos iguales si uno
   está eliminado lógicamente. Añadir
   `CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE deleted_at IS NULL;`
2. **`Get /api/products` con paginación**: hoy devuelve toda la tabla y el
   catálogo filtra en el cliente.
3. **Tabla `reports`**: nadie la genera; el resumen se calcula al vuelo. Un job
   diario (o un trigger) permitiría el histórico que pide HU-008/HU-025.
4. **`order.updatedAt`**: no es `@updatedAt` en el esquema, hay que asignarlo a
   mano (ya se hace en `orderService.update`).
5. **Pruebas de integración con BD real**: las actuales simulan el cliente de
   Prisma. Un esquema efímero con `prisma migrate deploy` daría más cobertura.
