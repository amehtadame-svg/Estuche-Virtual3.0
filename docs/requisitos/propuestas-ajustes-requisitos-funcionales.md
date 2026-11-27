# Propuestas de ajuste de requisitos funcionales

**Estado:** borrador para revisión, no aprobado ni implementado como cambio de alcance. Comparación documental basada en código de `138ade4` y pruebas de `01788d5`; no refleja cambios posteriores que puedan existir en otros clones. Este documento no modifica los 30 RF originales, historias, código, pagos ni base de datos. No presentar la existencia de rutas, modelos o tests como aceptación del requisito completo.

Se preparó siguiendo las [propuestas de cuatro historias](propuestas-ajustes-hu-013-017-038-040.md). Franck debe revisar reglas y backend; Paula, actores e interfaz; Cristian, el entorno cuando corresponda. Estos nombres indican revisiones pendientes, no aprobaciones. El profesor o responsable académico debe confirmar si los requisitos obligatorios pueden cambiar. Conservar los requisitos originales y registrar las funciones pendientes incluso si se aprueba un alcance menor.

## Inventario de los 30 RF

Clasificación inicial para priorizar, no certificación. Para el detalle de criterios, límites y evidencia consultar la [auditoría histórica](../AUDITORIA_REQUISITOS_FUNCIONALES.md). Sus resultados se refieren al commit indicado en ese informe, salvo la actualización de favoritos señalada aquí.

| RF | Requisito | Situación registrada / propuesta |
|---|---|---|
| 001 | Registro | Parcial: el registro no acredita verificación de correo. |
| 002 | Autenticación | Parcial: autenticación y redirección no acreditan el requisito de correo verificado. |
| 003 | Productos | Flujo de alta revisado; aceptación integral pendiente. |
| 004 | Edición de productos | Parcial: auditoría integral de cambios pendiente. |
| 005 | Eliminación/inactivación | Parcial: eliminación lógica; auditoría por acción pendiente. |
| 006 | Catálogo y búsqueda | Parcial: filtros y criterios completos por validar. |
| 007 | Carrito | Parcial/diferente: también existe carrito temporal de visitantes; empleados y repartidores excluidos. |
| 008 | Pedido y pago | Parcial/diferente: el checkout académico reserva antes de confirmación; no es pasarela real. |
| 009 | Pedidos | Parcial/diferente: incluye operación de empleados y repartidores con permisos por acción. |
| 010 | Soporte/contacto | **P-RF-010:** PQR de clientes como alcance alternativo; el formulario público no se acredita. |
| 011 | Historial | Flujo principal revisado; comprobación integral pendiente. |
| 012 | Ofertas | Parcial: cupones no prueban todas las promociones automáticas descritas. |
| 013 | Panel administrativo | Parcial/diferente: clave adicional y auditoría integral no acreditadas. |
| 014 | Categorías | Parcial con riesgo: el borrado desasocia productos; no ajustar la regla sin decisión. |
| 015 | Preparación y entrega | Flujo operativo revisado; aceptación pendiente. |
| 016 | Inventario | Parcial/diferente: [indicador visual propuesto](propuestas-ajustes-hu-013-017-038-040.md#p-017--identificar-stock-bajo-en-productos) es adicional; no reemplaza trazabilidad de movimientos. |
| 017 | Historial de precios | Registro de cambios revisado; interfaz de consulta y cobertura completa pendientes. |
| 018 | Imágenes | **P-RF-018:** URL de imagen principal, sin carga de archivos ni galería. |
| 019 | Envíos | Autoservicio del repartidor revisado; aceptación pendiente. |
| 020 | Recibos | **P-RF-020:** recibo pendiente en checkout académico, no factura fiscal ni recibo creado solo tras pagar. |
| 021 | Pasarela | Simulación y registro en tienda no equivalen a pasarela real. No modificar pagos sin autorización. |
| 022 | Devoluciones | Flujo principal revisado con diferencias de rol; sin reembolso financiero automático. |
| 023 | Direcciones | **P-RF-023:** dirección única del perfil, no agenda de direcciones. |
| 024 | Reseñas | No acreditado: reseñas reales permanecen pendientes. Véase P-RF-N1 como funcionalidad distinta. |
| 025 | Favoritos | Se agregó persistencia y existen [pruebas](../evidencias/pruebas/favoritos-01788d5.md); Cristian comunicó que ya funciona en su entorno. Aceptación Franck/Paula y cobertura integral pendientes. |
| 026 | Notificaciones | No acreditado: no sustituir lectura de estado o ayuda interna por notificaciones automáticas. |
| 027 | Reportes | **P-RF-027:** consulta dinámica, no consolidación programada/exportación. |
| 028 | Recuperación de contraseña | Parcial/diferente: duración/configuración y persistencia según auditoría. |
| 029 | Verificación de correo | No acreditado; no sustituirlo por login ni afirmar que se verificó correo. |
| 030 | Usuarios y roles | Parcial/diferente: permisos y auditoría integral pendientes. |

---

## P-RF-010 — Solicitudes PQR de clientes autenticados

**Objetivo propuesto.** El cliente autenticado crea y consulta sus PQR; administración y superadministración consultan y actualizan las solicitudes autorizadas. Es un ajuste de alcance respecto al formulario público del RF-010, no equivale a él.

**Proceso.** Cliente elige tipo, asunto y descripción; el servidor valida y registra la solicitud asociada a la sesión. El cliente consulta las propias. Administración puede revisar, cambiar estado y guardar respuesta. Si hay nueva respuesta, el servicio intenta enviar un correo; el guardado puede tener éxito aunque falle el envío, por lo que no se garantiza entrega ni notificación interna.

**Reglas propuestas.** Solo clientes crean PQR; cada cliente consulta los propios; admin/superadmin gestionan. El servidor valida `type`, asunto de 5–160 y descripción de 20–5000 caracteres. Se rechazan duplicados y se limita el envío frecuente. Los errores no deben presentarse como éxito.

**Rutas observadas.** `GET /api/pqr`, `GET /api/pqr/:id`, `POST /api/pqr`, `PATCH /api/pqr/:id` según permisos. Ver [rutas](../../be/src/modules/pqr/pqr.routes.ts), [servicio](../../be/src/modules/pqr/pqr.service.ts), [validaciones](../../be/src/modules/pqr/pqr.schema.ts), [cliente](../../fe/src/pages/PQR/ClientPqr.tsx) y [pruebas de integración](../../be/tests/customer.integration.ts).

**Qué no cubre.** El formulario público de Contacto sigue siendo un hallazgo: muestra éxito sin guardar/enviar; debe corregirse o identificarse claramente, no ocultarse cambiando el RF. No se acredita notificación automática al administrador ni recepción efectiva del correo. PQR del cliente y ayuda interna de empleados son funciones separadas. Revisión y prueba UI pendientes.

---

## P-RF-018 — Asociar una URL de imagen principal

**Objetivo propuesto.** Permitir a administración registrar o actualizar una URL de imagen principal dentro del alta o edición de un producto.

**Proceso y reglas.** La persona autorizada abre el formulario de producto y, si aporta una URL, el backend valida su formato y longitud, y registra o actualiza la imagen principal. En la interfaz se intenta mostrar la imagen. Una URL sintácticamente válida no garantiza que el recurso exista o sea seguro.

**Rutas observadas.** `POST /api/products` y `PUT /api/products/:id`; ver [rutas](../../be/src/modules/products/products.routes.ts), [schema](../../be/src/modules/products/products.schema.ts), [servicio](../../be/src/modules/products/products.service.ts) y [formulario](../../fe/src/pages/Admin/Products/Products.tsx). Contrato, roles y errores concretos sujetos a revisión de Franck.

**Qué no cubre.** Carga de archivos, validación real de tamaño o formato de imagen, galería múltiple, orden de imágenes ni eliminación de imágenes. No interpretar campo vacío como una función documentada de borrado. El RF-018 original sigue pendiente hasta una decisión; probar URL válida, inválida y no disponible sin archivos de clientes.

---

## P-RF-020 — Recibo del checkout académico

**Objetivo propuesto.** En el checkout académico, crear un recibo pendiente con el pedido y sus líneas dentro de la operación transaccional, y actualizar su estado al resolverse la simulación de pago.

**Reglas propuestas.** El servidor calcula importes con datos de BD, conserva la relación entre pedido y recibo y devuelve información según los permisos aplicables. El cargo por envío puede hacer que la suma de líneas de producto sea menor que el total del recibo. El flujo y sus fallos deben validarse sin dinero ni datos financieros reales.

**Rutas observadas.** `POST /api/payments/demo/checkout`, `GET /api/payments/demo/:key` y resolución posterior `POST /api/payments/demo/:key/resolve`; consulta de pedido autorizada en `/api/orders/:id`. Fuentes: [servicio de pagos](../../be/src/modules/payments/payments.service.ts), [rutas](../../be/src/modules/payments/payments.routes.ts), [secuencia](mer/secuencia-compra.svg) y [pruebas de integración](../../be/tests/payments.integration.ts).

**Qué no cubre.** No es una factura fiscal, un cobro real ni evidencia de pasarela bancaria; no acredita creación solo después de pagar ni descarga universal del recibo. No modificar la implementación de pagos. [RF-020 original](RFs/RF-020-generacion-de-facturas.md) y [RF-021](RFs/RF-021-procesamiento-de-pagos-pasarela.md) conservan sus exigencias hasta decisión aprobada.

---

## P-RF-023 — Datos de contacto y dirección única de perfil

**Objetivo propuesto.** Permitir a una persona autenticada consultar y modificar los campos permitidos de su perfil, incluida una dirección y teléfono; cliente accede a sus propios datos. El backend también admite administración según sus reglas.

**Proceso y reglas.** En perfil se muestran datos; se editan y validan los campos admitidos; `PATCH /api/users/:id/profile` actualiza el perfil autorizado. Una nueva consulta permite comprobar persistencia. Se debe comprobar manejo de error y aislamiento en pruebas antes de aceptar.

**Evidencia.** [Rutas](../../be/src/modules/users/users.routes.ts), [validación](../../be/src/modules/users/users.schema.ts), [autorización/servicio](../../be/src/modules/users/users.service.ts), [interfaz](../../fe/src/pages/Profile/Profile.tsx). Se relaciona con [P-038](propuestas-ajustes-hu-013-017-038-040.md#p-038--actualizar-datos-de-contacto-y-dirección-del-perfil) y CU09; no contarlo dos veces como funciones distintas.

**Qué no cubre.** No es una agenda con múltiples direcciones, direcciones principales ni CRUD de dirección separado. No afirma que cambiar el perfil modifique pedidos históricos. RF-023 sigue vigente en su forma original mientras no se apruebe otra cosa.

---

## P-RF-027 — Consulta dinámica de reportes

**Objetivo propuesto.** El superadministrador consulta información calculada dinámicamente y la filtra por rango de fechas en pantalla. La ruta de resumen del panel administrativo para admin/superadmin es una funcionalidad distinta.

**Proceso y reglas.** El usuario autorizado solicita desde/hasta (`from`, `to`); el servidor rechaza un rango invertido y devuelve datos calculados desde pedidos, recibos, pagos, devoluciones y clientes. La interfaz muestra cifras y tablas. **Importante:** el cálculo de `totalSold` incluye pedidos no cancelados; no equivale a ventas solo de pedidos entregados ni debe presentarse como conciliación financiera certificada.

**Rutas observadas.** `GET /api/reports?from=...&to=...` y `GET /api/reports/summary?from=...&to=...`, restringidas a superadministración; `GET /api/reports/admin-dashboard` también admite administración. Ver [rutas](../../be/src/modules/reports/reports.routes.ts), [cálculos](../../be/src/modules/reports/reports.service.ts), [controlador](../../be/src/modules/reports/reports.controller.ts) y [pantalla](../../fe/src/pages/SuperAdmin/Reports/Reports.tsx).

**Qué no cubre.** No se acredita consolidación diaria programada en tabla, exportación Excel/PDF, datos exclusivamente de pedidos entregados ni exactitud contable completa. Si se conserva RF-027 original, estas diferencias siguen pendientes. Validar cálculos con datos sintéticos y las definiciones de métricas con Franck.

---

## Funcionalidad nueva candidata: ayuda interna de empleados

**P-RF-N1 (identificador provisional, no sustituye automáticamente RF-024 ni RF-026).** Un empleado puede crear y consultar su conversación de ayuda; administrador y superadministrador pueden consultar y responder. Otros empleados no pueden acceder a conversaciones ajenas; no se promete notificación o correo automático. Ver [P-040](propuestas-ajustes-hu-013-017-038-040.md#p-040--conversación-de-ayuda-interna), [rutas](../../be/src/modules/support/support.routes.ts), [servicio](../../be/src/modules/support/support.service.ts), [pruebas](../../be/src/modules/support/support.test.ts) y [prueba de integración](../../be/tests/employee.integration.ts).

La ayuda interna cambia actor y objetivo frente a reseñas y notificaciones al cliente: **no es una sustitución equivalente**. Si se aprueba documentarla como RF propio, asignar identificador y relación con HU sin borrar RF-024 ni RF-026 ni contarla dos veces respecto a P-RF-010.

## Funcionalidad nueva candidata: registro manual de pago en tienda

**P-RF-N2 (identificador provisional).** Registrar un pago total ya recibido físicamente, con permisos, estado e idempotencia, sin procesar tarjetas ni modificar el checkout. Ver [P-013](propuestas-ajustes-hu-013-017-038-040.md#p-013--registrar-pago-recibido-en-tienda), [servicio](../../be/src/modules/employee/store-payment.service.ts) y [prueba de integración](../../be/tests/employee.integration.ts). No demuestra la venta de combos ni el RF-021 de pasarela real. La aprobación documental no autoriza cambios de código o pagos.

## Decisiones antes de aplicar cambios formales

1. Franck y Paula contrastan reglas, actores, validaciones y pruebas; Cristian revisa despliegue. Registrar sus respuestas reales, no suponerlas.
2. Consultar si el profesor admite cambios y qué RF/HU son obligatorios. No sustituir seguridad, respaldo o funcionalidades pendientes solo para aparentar cumplimiento.
3. Si se acepta una propuesta, versionar el contenido anterior, justificar el cambio, decidir identificadores y dependencias, y actualizar HUs, diagramas, API, matriz y pruebas conjuntamente.
4. Mantener visibles los pendientes: reseñas/notificaciones reales, múltiples direcciones, pasarela real, verificación de correo y respaldo. La confirmación de favoritos no valida los demás requisitos.
5. Usar solo datos de prueba, sin migraciones, borrados o pagos reales. Esta revisión no modifica Supabase.
