<!-- Informe histórico de inspección estática; ver nota de actualización. -->
# Auditoria conjunta de rutas de historias de usuario

> Informe histórico: los resultados corresponden al commit indicado. HU-009, HU-015 y HU-037 se redefinieron posteriormente; sus filas y detalles no representan una nueva auditoría funcional. Consulte las historias actuales y la auditoría de requisitos.

- Commit local de referencia: `7d6de1d`; rama: `docs/modelos-arquitectura-evidencias`.
- HUs inspeccionadas: **40**.
- Declaraciones literales backend analizadas: **97**.
- Modo: **solo informe; HUs sin modificar**.
- Sustituciones de prefijo verificadas en esta ejecucion: **0**, en **0** archivos.

## Alcance y limites

- Se comparan metodo y patron de ruta de las tablas de endpoints con app.ts y routers locales.
- Es inspeccion estatica, no una revision completa de criterios de aceptacion ni prueba funcional.
- No se modifican estados, criterios de negocio, roles ni referencias frontend.
- Las rutas dinamicas, proxies, consultas y equivalencias semanticas requieren revision adicional.
- Sin coincidencia literal NO significa necesariamente funcionalidad inexistente.
- Coincidencia de ruta NO acredita permisos, validacion, transaccion ni contrato completo.
- Los estados originales se muestran como declaraciones documentales, no como aceptacion.
- Se conservan las correcciones previas de HU-001 y HU-012 y sus notas.

## Resumen por HU

| HU | Estado escrito original | Resultado de rutas |
|---|---|---|
| [HU-001](HUs/HU-001-registro-de-productos-nuevos.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-002](HUs/HU-002-registro-de-ingreso-de.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-003](HUs/HU-003-registro-de-salida-de.md) | implementado | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-004](HUs/HU-004-registro-de-ventas.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-005](HUs/HU-005-visualizacion-del-inventario-actual.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-006](HUs/HU-006-visualizacion-de-productos-agotados.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-007](HUs/HU-007-visualizacion-de-productos-con.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-008](HUs/HU-008-generacion-de-reportes-de.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-009](HUs/HU-009-generacion-de-reportes-de.md) | Alcance actualizado | Nueva definición; revisión de aceptación pendiente |
| [HU-010](HUs/HU-010-visualizacion-del-historial-de.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-011](HUs/HU-011-calculo-de-ganancias.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-012](HUs/HU-012-registro-de-combos-escolares.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-013](HUs/HU-013-venta-de-combos.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-014](HUs/HU-014-identificacion-de-productos-mas.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-015](HUs/HU-015-preparacion-y-empaque.md) | Alcance actualizado | Nueva definición; revisión de aceptación pendiente |
| [HU-016](HUs/HU-016-asignacion-de-precios-a.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-017](HUs/HU-017-alerta-de-faltantes-de.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-018](HUs/HU-018-control-de-usuarios-y.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-019](HUs/HU-019-inicio-de-sesion.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-020](HUs/HU-020-consulta-de-ventas-por.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-021](HUs/HU-021-edicion-de-productos.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-022](HUs/HU-022-eliminacion-de-productos.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-023](HUs/HU-023-registro-de-fecha-y.md) | Por Implementar | Sin endpoint en tabla reconocible; revision funcional pendiente |
| [HU-024](HUs/HU-024-exportacion-de-reportes.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-025](HUs/HU-025-visualizacion-del-resumen-diario.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-026](HUs/HU-026-registro-de-perdidas.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-027](HUs/HU-027-busqueda-de-productos.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-028](HUs/HU-028-categorizacion-de-productos.md) | Por Implementar | Rutas declaradas coinciden; funcionalidad sin certificar |
| [HU-029](HUs/HU-029-visualizacion-del-historial-de.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-030](HUs/HU-030-respaldo-automatico-de-informacion.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-031](HUs/HU-031-registro-de-cuenta-cliente.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-032](HUs/HU-032-agregar-productos-al-carrito.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-033](HUs/HU-033-finalizar-compra-seleccion-de.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-034](HUs/HU-034-gestion-de-pedidos-por.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-035](HUs/HU-035-historial-de-compras-y.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-036](HUs/HU-036-gestion-de-ofertas-promociones.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-037](HUs/HU-037-seguimiento-de-envio-y.md) | Alcance actualizado | Nueva definición; revisión de aceptación pendiente |
| [HU-038](HUs/HU-038-gestion-de-direcciones-de.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-039](HUs/HU-039-solicitud-y-gestion-de.md) | Por Implementar | Requiere contraste adicional de contrato |
| [HU-040](HUs/HU-040-resenas-calificaciones-y-notificaciones.md) | Por Implementar | Requiere contraste adicional de contrato |

## Detalle de las 40 HUs (o inventario local encontrado)

### HU-001 — Registro de productos nuevos

Historia: [documento](HUs/HU-001-registro-de-productos-nuevos.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/products` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/products` | [be/src/modules/products/products.routes.ts](../../be/src/modules/products/products.routes.ts) |

### HU-002 — Registro de ingreso de mercancía

Historia: [documento](HUs/HU-002-registro-de-ingreso-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/inventory/inbound` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/inventory/inbound` | [be/src/modules/inventory/inventory.routes.ts](../../be/src/modules/inventory/inventory.routes.ts) |

### HU-003 — Registro de salida de productos

Historia: [documento](HUs/HU-003-registro-de-salida-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/inventory/outbound` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/inventory/outbound` | [be/src/modules/inventory/inventory.routes.ts](../../be/src/modules/inventory/inventory.routes.ts) |

### HU-004 — Registro de ventas

Historia: [documento](HUs/HU-004-registro-de-ventas.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/v1/sales` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-005 — Visualización del inventario actual

Historia: [documento](HUs/HU-005-visualizacion-del-inventario-actual.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/inventory` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-006 — Visualización de productos agotados

Historia: [documento](HUs/HU-006-visualizacion-de-productos-agotados.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/inventory/out-of-stock` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-007 — Visualización de productos con bajo stock

Historia: [documento](HUs/HU-007-visualizacion-de-productos-con.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/inventory/low-stock` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-008 — Generación de reportes de ventas

Historia: [documento](HUs/HU-008-generacion-de-reportes-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/reports/sales` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-009 — Consulta de ingresos de inventario (alcance actualizado)

Historia: [documento](HUs/HU-009-generacion-de-reportes-de.md). La revisión anterior no aplica al alcance actual. Referencia: `GET /api/inventory/movements?type=in`; verificación funcional adicional pendiente.

### HU-010 — Visualización del historial de movimientos

Historia: [documento](HUs/HU-010-visualizacion-del-historial-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/inventory/movements` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/inventory/movements` | [be/src/modules/inventory/inventory.routes.ts](../../be/src/modules/inventory/inventory.routes.ts) |

### HU-011 — Cálculo de ganancias

Historia: [documento](HUs/HU-011-calculo-de-ganancias.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/financials/profits` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-012 — Registro de combos escolares

Historia: [documento](HUs/HU-012-registro-de-combos-escolares.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/combos` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/combos` | [be/src/modules/combos/combos.routes.ts](../../be/src/modules/combos/combos.routes.ts) |

### HU-013 — Venta de combos

Historia: [documento](HUs/HU-013-venta-de-combos.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/v1/sales/combo` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-014 — Identificación de productos más vendidos

Historia: [documento](HUs/HU-014-identificacion-de-productos-mas.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/reports/top-selling` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-015 — Preparación y empaque de pedidos (alcance actualizado)

Historia: [documento](HUs/HU-015-preparacion-y-empaque.md). Revisión de rutas previa no aplicable al alcance actual. Rutas de referencia: `POST /api/employee/orders/:id/claim`, `PATCH /api/employee/orders/:id/picking` y `POST /api/employee/orders/:id/pack`; verificación funcional adicional pendiente.

### HU-016 — Asignación de precios a productos

Historia: [documento](HUs/HU-016-asignacion-de-precios-a.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| PATCH | `/api/v1/products/{id}/price` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-017 — Alerta de faltantes de stock

Historia: [documento](HUs/HU-017-alerta-de-faltantes-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/notifications/stock-alerts` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-018 — Control de usuarios y permisos

Historia: [documento](HUs/HU-018-control-de-usuarios-y.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/users` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/users` | [be/src/modules/users/users.routes.ts](../../be/src/modules/users/users.routes.ts) |

### HU-019 — Inicio de sesión

Historia: [documento](HUs/HU-019-inicio-de-sesion.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/auth/login` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/auth/login` | [be/src/modules/auth/auth.routes.ts](../../be/src/modules/auth/auth.routes.ts) |

### HU-020 — Consulta de ventas por empleado

Historia: [documento](HUs/HU-020-consulta-de-ventas-por.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/reports/sales-by-user` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-021 — Edición de productos

Historia: [documento](HUs/HU-021-edicion-de-productos.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| PUT | `/api/products/{id}` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/products/{id}` | [be/src/modules/products/products.routes.ts](../../be/src/modules/products/products.routes.ts) |

### HU-022 — Eliminación de productos

Historia: [documento](HUs/HU-022-eliminacion-de-productos.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| DELETE | `/api/products/{id}` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/products/{id}` | [be/src/modules/products/products.routes.ts](../../be/src/modules/products/products.routes.ts) |

### HU-023 — Registro de fecha y hora en transacciones

Historia: [documento](HUs/HU-023-registro-de-fecha-y.md).

Sin tabla de endpoints reconocible; no se concluye ausencia de implementacion.

### HU-024 — Exportación de reportes

Historia: [documento](HUs/HU-024-exportacion-de-reportes.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/reports/export` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-025 — Visualización del resumen diario

Historia: [documento](HUs/HU-025-visualizacion-del-resumen-diario.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/dashboard/daily-summary` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-026 — Registro de pérdidas

Historia: [documento](HUs/HU-026-registro-de-perdidas.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/v1/inventory/losses` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-027 — Búsqueda de productos

Historia: [documento](HUs/HU-027-busqueda-de-productos.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/products/search` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-028 — Categorización de productos

Historia: [documento](HUs/HU-028-categorizacion-de-productos.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/categories` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/categories` | [be/src/modules/categories/categories.routes.ts](../../be/src/modules/categories/categories.routes.ts) |

### HU-029 — Visualización del historial de precios

Historia: [documento](HUs/HU-029-visualizacion-del-historial-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/v1/products/{id}/price-history` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-030 — Respaldo automático de información

Historia: [documento](HUs/HU-030-respaldo-automatico-de-informacion.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/v1/system/backups` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-031 — Registro de cuenta de cliente

Historia: [documento](HUs/HU-031-registro-de-cuenta-cliente.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/auth/register` | Declaracion coincidente; ejecucion y semantica pendientes | `/api/auth/register` | [be/src/modules/auth/auth.routes.ts](../../be/src/modules/auth/auth.routes.ts) |
| POST | `/api/auth/verify-email` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-032 — Agregar productos al carrito de compras

Historia: [documento](HUs/HU-032-agregar-productos-al-carrito.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/carrito` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| GET | `/api/carrito` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| DELETE | `/api/carrito/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-033 — Finalizar compra, selección de pago y facturación

Historia: [documento](HUs/HU-033-finalizar-compra-seleccion-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/pedidos` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| POST | `/api/pagos` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| GET | `/api/facturas/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-034 — Gestión de pedidos por el administrador

Historia: [documento](HUs/HU-034-gestion-de-pedidos-por.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/admin/pedidos` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| PUT | `/api/admin/pedidos/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-035 — Historial de compras y lista de deseos (panel del cliente)

Historia: [documento](HUs/HU-035-historial-de-compras-y.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/historial` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| GET | `/api/lista-deseos` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| POST | `/api/lista-deseos` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| DELETE | `/api/lista-deseos/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-036 — Gestión de ofertas, promociones y cupones de descuento

Historia: [documento](HUs/HU-036-gestion-de-ofertas-promociones.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/descuentos` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| PUT | `/api/descuentos/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| POST | `/api/descuentos/validar` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-037 — Seguimiento y entrega (alcance actualizado)

Historia: [documento](HUs/HU-037-seguimiento-de-envio-y.md). La revisión anterior no aplica al alcance actual. Rutas de referencia: `GET /api/delivery/pending-orders`, `POST /api/delivery/pending-orders/:id/claim`, `GET /api/delivery/despatches` y `POST /api/delivery/despatches/:id/confirm`; verificación adicional pendiente.

### HU-038 — Gestión de direcciones de entrega

Historia: [documento](HUs/HU-038-gestion-de-direcciones-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| GET | `/api/direcciones` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| POST | `/api/direcciones` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| PUT | `/api/direcciones/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| DELETE | `/api/direcciones/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-039 — Solicitud y gestión de devoluciones

Historia: [documento](HUs/HU-039-solicitud-y-gestion-de.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/devoluciones` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| GET | `/api/admin/devoluciones` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| PUT | `/api/admin/devoluciones/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

### HU-040 — Reseñas, calificaciones y notificaciones al cliente

Historia: [documento](HUs/HU-040-resenas-calificaciones-y-notificaciones.md).

| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |
|---|---|---|---|---|
| POST | `/api/resenas` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| GET | `/api/productos/{id}/resenas` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| GET | `/api/notificaciones` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| PATCH | `/api/notificaciones/{id}` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |
| POST | `/api/contacto` | Sin coincidencia literal en routers analizados; revisar contrato | Por determinar | Sin coincidencia literal |

## Pendientes comunes

- HU-001: criterio de redireccion, is_active y restricciones de datos requieren comprobacion aparte.
- Los roles y las rutas deben contrastarse con el código actual; HU-031 fue actualizada después de esta auditoría.
- No renombrar rutas de carrito o pedidos sin revisar campos, permisos y comportamiento.
- No convertir un endpoint ausente en uno inventado de reportes, respaldos, resenas, notificaciones o pagos.
- Ejecutar pruebas y obtener confirmacion por HU antes de declarar terminado.
