# Propuestas de ajuste: HU-013, HU-017, HU-038 y HU-040

**Estado: borrador para revisión; no aprobado.** Cristian pidió preparar cuatro propuestas basadas en funciones existentes. La comparación usa el código de `138ade4` (favoritos en `01788d5`); la confirmación manual de favoritos comunicada después no valida estas cuatro propuestas. No se modificaron las historias ni los requisitos originales, el código, la base de datos o los pagos. Ninguna propuesta declara terminado el requisito original ni acredita aceptación académica.

**Revisiones pendientes:** Franck, reglas y backend; Paula, actores e interfaz; Cristian, entorno/despliegue cuando aplique. Consultar al profesor o responsable de alcance si las historias originales o sus criterios son obligatorios. Los nombres son responsables de revisión solicitada, no aprobaciones. Para seguridad y privacidad usar solo datos y cuentas de prueba.

## Trazabilidad de cambios propuestos

| Historia original | Propuesta separada | Naturaleza del cambio | Alcance original que permanece pendiente |
|---|---|---|---|
| [HU-013 — Venta de combos](HUs/HU-013-venta-de-combos.md) | P-013: registrar pago recibido en tienda | **Sustitución de objetivo**, no equivalencia; revisar si es aceptable para el alcance comercial. | Venta de combos en POS, descuento de componentes y comprobante detallado. La gestión de combos de HU-012 es distinta y no demuestra venta. |
| [HU-017 — Alerta de faltantes](HUs/HU-017-alerta-de-faltantes-de.md) | P-017: identificar stock bajo en la tabla | **Reducción de alcance**: consulta visual en vez de notificación proactiva. | Evento, notificación persistente, campana, contador y marcado como atendido. Posible solapamiento con [HU-007](HUs/HU-007-visualizacion-de-productos-con.md). |
| [HU-038 — Múltiples direcciones](HUs/HU-038-gestion-de-direcciones-de.md) | P-038: editar dirección y teléfono del perfil | **Reducción de alcance**: una dirección del perfil, no una agenda. | Múltiples direcciones, marcar principal, edición/eliminación de direcciones independientes y selección de una entre varias. Se solapa con CU09 de perfil. |
| [HU-040 — Reseñas y notificaciones al cliente](HUs/HU-040-resenas-calificaciones-y-notificaciones.md) | P-040: ayuda interna de empleado y administración | **Sustitución de actores y objetivo**, no equivalencia. No confundir con PQR del cliente. | Reseñas reales, calificaciones y notificaciones al cliente. |

Los identificadores `P-...` son temporales, no reemplazan identificadores HU/CU existentes. Si se decide cambiar una HU formal, documentar aprobación, conservar su contenido anterior, actualizar trazabilidad, diagramas y pruebas sin ocultar los pendientes. Los RF vigentes no cambian por este borrador: por ejemplo, [RF-023](RFs/RF-023-gestion-de-direcciones-de.md) sigue pidiendo múltiples direcciones, [RF-024](RFs/RF-024-sistema-de-resenas-y.md) reseñas y [RF-026](RFs/RF-026-sistema-de-notificaciones.md) notificaciones. Evaluar una nueva HU en vez de reutilizar un identificador si cambia de actor u objetivo.

---

## P-013 — Registrar pago recibido en tienda

**Historia propuesta.** Como empleado autorizado que creó un pedido, quiero registrar que ya recibí su pago total en efectivo o tarjeta, para que el pedido y el recibo reflejen el pago y el pedido pueda continuar su preparación.

**Actores y precondiciones.** Empleado creador del pedido; administración y superadministración pueden registrar como supervisores. Sesión válida; pedido elegible con cliente, recibo, importe positivo y reserva vigente. La persona confirma que recibió el dinero **fuera del sistema** antes de registrarlo.

**Flujo básico propuesto.** 1) Abrir un pedido elegible en el módulo operativo. 2) Seleccionar efectivo o tarjeta. 3) Confirmar que se recibió el total mostrado. 4) Enviar la referencia del intento. 5) El servidor valida propiedad/permisos, estado e importes y registra el pago; sincroniza pedido y recibo y devuelve el resultado.

**Criterios de aceptación propuestos — no aprobados.**

1. Un empleado autorizado registra una única operación de pago total para su pedido elegible y el pedido y recibo quedan pagados.
2. El servidor usa el total del pedido y rechaza un importe enviado por el navegador; cliente, repartidor y otro empleado no autorizado no pueden registrar ese pago.
3. Un reintento con la misma referencia y datos no duplica el registro; una referencia reutilizada con datos incompatibles o un pago adicional se rechaza.
4. Una reserva vencida, importes inconsistentes o un pago incompatible impiden registrar la operación. Se muestra el error y no se promete conciliación automática.

**Excepciones y resultado.** Si la validación falla, no se registra otro pago; el caso requiere revisión. No procesa dinero, tarjetas ni pasarela; no cambia el checkout académico. No es evidencia de venta de combos. Usar pedidos sintéticos para la prueba: el registro modifica datos.

**Evidencia técnica.** [Servicio](../../be/src/modules/employee/store-payment.service.ts), [ruta](../../be/src/modules/employee/employee.routes.ts), [interfaz](../../fe/src/pages/Employee/EmployeeWorkspace.tsx), [prueba de integración](../../be/tests/employee.integration.ts) y [ejecución aislada de `01788d5`](../evidencias/pruebas/favoritos-01788d5.md). Las pruebas existentes no equivalen a aprobación de este texto. Relación propuesta con [RF-009](RFs/RF-009-gestion-de-pedidos.md) y pago en tienda; [RF-021](RFs/RF-021-procesamiento-de-pagos-pasarela.md) sigue sin acreditar pasarela real.

---

## P-017 — Identificar stock bajo en productos

**Historia propuesta.** Como administrador o superadministrador, quiero ver el stock actual y mínimo de los productos en la tabla administrativa, para identificar artículos agotados o con existencias bajas al consultar el catálogo.

**Precondiciones.** Sesión administrativa y datos de productos disponibles; la persona abre `/admin/productos`. No depende de una alerta automática.

**Flujo básico propuesto.** 1) Abrir la lista administrativa. 2) Consultar cantidad actual y mínimo en cada fila. 3) Identificar «Agotado» si la cantidad es cero y «Bajo» para cantidades positivas que no superen el mínimo. 4) Consultar de nuevo cuando se necesite información actualizada.

**Criterios de aceptación propuestos — no aprobados.**

1. La fila muestra el stock actual y su mínimo.
2. Con stock cero muestra «Agotado»; con stock positivo menor o igual al mínimo muestra «Bajo»; por encima del mínimo no muestra esas etiquetas.
3. La pantalla administrativa requiere el rol previsto; errores y disponibilidad se comprueban en un ambiente de prueba.
4. La consulta no afirma crear notificaciones ni modificar existencias.

**Límites y solapamiento.** No supone listado exclusivo de faltantes, campana, contador, push, persistencia o marcar como atendido. Comparar con HU-007 para evitar documentar dos historias idénticas; HU-007 tiene criterios adicionales de filtro, orden y sugerencia que este caso no cubre.

**Evidencia técnica.** [Tabla y comparación de stock](../../fe/src/pages/Admin/Products/Products.tsx), [rutas protegidas](../../fe/src/App.tsx), [productos backend](../../be/src/modules/products/products.routes.ts). Referencia relacionada: [RF-016](RFs/RF-016-gestion-de-inventario-y.md), que conserva sus reglas propias. **Pendiente:** prueba manual de fronteras y revisión Franck/Paula; la existencia del código no certifica la historia.

---

## P-038 — Actualizar datos de contacto y dirección del perfil

**Historia propuesta.** Como cliente autenticado, quiero editar mi teléfono y la única dirección almacenada en mi perfil, para mantener actualizados mis datos de contacto.

**Precondiciones.** Sesión del cliente y acceso a `/perfil`. La UI permite además editar el nombre. Este caso no define una libreta de direcciones ni cambia pedidos históricos.

**Flujo básico propuesto.** 1) Abrir el perfil. 2) Consultar los valores actuales. 3) Cambiar teléfono y/o dirección. 4) Guardar. 5) Si la validación y la petición son correctas, consultar de nuevo el perfil y ver los datos guardados.

**Criterios de aceptación propuestos — no aprobados.**

1. El cliente puede consultar y actualizar los datos admitidos de su propio perfil; la interfaz valida el teléfono antes de guardar.
2. Tras un guardado exitoso y una nueva consulta, se muestra la dirección y el teléfono actualizados.
3. Un cliente no puede modificar el perfil de otro cliente; el backend también admite administración según su propia regla de permisos.
4. Si ocurre un error, la interfaz informa el problema y no presenta un guardado fallido como exitoso.

**Límites y solapamiento.** Es una única dirección en perfil, no CRUD de varias ni dirección principal. La dirección de entrega de cada pedido se trata en su propio flujo; no afirmar que un cambio de perfil edita pedidos anteriores. Este caso se solapa con CU09 «Editar perfil propio»: considerar ampliar ese caso en vez de duplicarlo. RF-023 continúa vigente sin cambio hasta decisión explícita.

**Evidencia técnica.** [Pantalla de perfil](../../fe/src/pages/Profile/Profile.tsx), [ruta de perfil](../../be/src/modules/users/users.routes.ts), [servicio y regla de propiedad](../../be/src/modules/users/users.service.ts), [schema de validación](../../be/src/modules/users/users.schema.ts). **Pendiente:** recorrer guardado, error y aislamiento en ambiente de pruebas; validación Franck/Paula.

---

## P-040 — Conversación de ayuda interna

**Historia propuesta.** Como empleado, quiero iniciar una conversación interna y consultar las respuestas de administración, para recibir apoyo sobre mi trabajo sin exponer mi solicitud a otros empleados.

**Actores y precondiciones.** Empleado autenticado inicia solicitud; administrador o superadministrador la consulta y responde. No es el módulo de PQR del cliente. El empleado puede consultar y responder en sus conversaciones propias.

**Flujo básico propuesto.** 1) Abrir «Ayuda con el jefe». 2) Escribir asunto y mensaje válidos y enviar. 3) Administración abre «Ayuda empleados», revisa y responde. 4) El empleado vuelve a abrir o actualizar la conversación y lee la respuesta; puede contestar.

**Criterios de aceptación propuestos — no aprobados.**

1. El empleado crea una conversación con asunto y mensaje válidos y puede verla en su bandeja.
2. Un empleado diferente no puede consultar ni responder una conversación ajena; cliente y repartidor no acceden a esta bandeja interna.
3. Administrador y superadministrador pueden consultar y responder; el empleado propietario puede leer y responder.
4. Los errores de validación o permisos se comunican; no se afirma envío de correo, push o notificación automática.

**Límites.** Se muestran hasta 100 conversaciones recientes; no hay notificación automática de respuesta. No implementa reseñas ni calificaciones y no reemplaza el derecho del cliente a consultar PQR. [RF-024](RFs/RF-024-sistema-de-resenas-y.md) y [RF-026](RFs/RF-026-sistema-de-notificaciones.md) continúan pendientes según la auditoría.

**Evidencia técnica.** [Rutas](../../be/src/modules/support/support.routes.ts), [servicio y reglas](../../be/src/modules/support/support.service.ts), [pruebas con dobles](../../be/src/modules/support/support.test.ts), [prueba de integración](../../be/tests/employee.integration.ts), [panel](../../fe/src/pages/Support/SupportPanel.tsx), [ejecución aislada de `01788d5`](../evidencias/pruebas/favoritos-01788d5.md). **Pendiente:** validar experiencia con empleado, admin y superadmin; aprobación Franck/Paula.

---

## Siguientes pasos propuestos

1. Revisar cada historia por separado y decidir si se acepta el cambio de alcance o si la función existente se documenta como un caso nuevo. No reutilizar HU-013 o HU-040 como si conservaran el mismo significado.
2. Confirmar con el profesor las obligaciones académicas; mantener los RF e historias originales hasta esa decisión. Conservar explícitamente lo pendiente aun si se aprueba un alcance reducido.
3. Tras la decisión, actualizar las historias y la matriz de rastreo, revisar superposiciones con HU-007/CU09 y actualizar los diagramas y criterios de aceptación.
4. Agregar al diagrama del cliente un caso para favoritos, asociado a [HU-035](HUs/HU-035-historial-de-compras-y.md) y [RF-025](RFs/RF-025-lista-de-deseos.md); no declarar completada HU-035 en conjunto.
5. Franck y Paula revisan flujos y permisos; Cristian verifica el entorno. Adjuntar evidencias reales, fecha, commit y resultados, sin secretos ni datos reales.

No hay constancia en este documento de aprobación del profesor o integrantes. Estos borradores no requieren operaciones en Supabase ni cambios en tablas.
