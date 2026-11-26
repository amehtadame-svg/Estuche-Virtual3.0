# RF-025 — Lista de deseos

**Historia relacionada:** [HU-035](../HUs/HU-035-historial-de-compras-y.md). **Estado:** implementación propuesta con pruebas automatizadas; validación funcional de Franck y Paula pendiente, no se declara aceptada.

## Alcance

El cliente autenticado puede guardar y quitar productos desde Inicio, catálogo y ficha; consulta su lista privada en `/mis-favoritos`, en Mi cuenta. La lista usa `Wishlist` y persiste en PostgreSQL. Los visitantes deben iniciar sesión; empleados, repartidores y roles administrativos no tienen acceso a la lista de clientes. No modifica el carrito al guardar o quitar. La opción de agregar desde favoritos conserva el producto en la lista (HU-035.4).

- Un producto no se repite para un usuario; la unicidad también se impone en base de datos.
- Solo se consulta o modifica la lista del usuario del token; no se acepta un `userId` del navegador.
- Productos eliminados lógicamente se muestran como no disponibles y se pueden quitar; agotados no se agregan al carrito. No se permite guardar un producto inexistente o eliminado.
- La interfaz informa errores y permite recargar; las vistas usan el mismo estado durante la sesión. Para cambios en otras pestañas, actualizar la lista.

## API

`GET /api/lista-deseos` lista filas con producto, precio, imágenes y estado; `POST /api/lista-deseos` recibe `{"productId":"<UUID>"}` y devuelve 201 con la fila creada; duplicado 409, producto no disponible 404 y parámetros inválidos 400. `DELETE /api/lista-deseos/{productId}` devuelve 204 y es idempotente, incluso si no existe en la lista propia. Requieren token y rol `client` (401 sin sesión, 403 para otros roles). `Cache-Control: no-store` en respuestas autenticadas. El identificador en DELETE es de **producto**, no de fila.

## Base y verificación

No se creó migración: la tabla y el índice único ya aparecen en la [migración inicial](../../../be/prisma/migrations/20260814053836_init/migration.sql) y en el [modelo Prisma](../../../be/prisma/schema.prisma). La disponibilidad del esquema de la base remota **no se comprobó**. Antes de desplegar, Cristian debe verificar el destino y las migraciones ya aplicadas; no ejecutar migraciones sin respaldo y autorización.

Pruebas: [`wishlist.integration.ts`](../../../be/tests/wishlist.integration.ts) usa PostgreSQL local `_test`; [`wishlist.test.ts`](../../../fe/src/modules/frontend/wishlist.test.ts) usa JSDOM y respuestas simuladas. Las pruebas no sustituyen la validación real de interfaz de Paula ni de backend de Franck.
