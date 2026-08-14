<!--
  ¿Qué? Historia de usuario que describe el registro de pérdidas de inventario.
  ¿Para qué? Formalizar la baja de productos dañados, vencidos o extraviados.
  ¿Impacto? Mantiene la exactitud del inventario frente a mermas reales del negocio.
-->

# HU-026 — Registro de pérdidas

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-026 |
| **Título** | Registro de pérdidas |
| **Módulo** | Inventario |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-016|

---

## Historia

**Como** administrador del negocio o supervisor general de inventarios, responsable directo del control de mermas, auditoría de existencias físicas y mitigación de fugas de capital,  
**quiero** contar con una funcionalidad dedicada dentro del módulo de inventario que me permita declarar y registrar formalmente la baja de mercancías averiadas, caducadas, rotas, mermadas o extraviadas, ingresando obligatoriamente la cantidad exacta de unidades afectadas, el motivo específico del retiro y una nota de justificación aclaratoria,  
**para** descontar las existencias físicas mermadas del stock general en tiempo real, reflejar con absoluta veracidad el estado del almacén, registrar el impacto contable y financiero de la pérdida sobre el patrimonio de la empresa y mantener una bitácora transparente para fines de auditoría interna y control operativo.

---

## Criterios de Aceptación

### CA-026.1 — Formulario completo de declaración y selección de motivos
- **Dado que** me encuentro autenticado con perfil de Administrador o Supervisor e ingreso al módulo de mermas e inventario en la ruta (`/inventory/losses`),
- **cuando** la pantalla de declaración se carga completamente en el navegador,
- **entonces** debo visualizar un formulario interactivo que me permita buscar y seleccionar un producto del catálogo activo, indicar el número de unidades mermadas y elegir de un menú desplegable el motivo estandarizado del retiro (ej. "Producto Caducado", "Mercancía Dañada/Rota", "Robo/Hurto", "Error de Empaque" o "Ajuste de Inventario").

### CA-026.2 — Validación de justificación textual obligatoria y bloqueo de envío
- **Dado que** me encuentro completando el registro de baja por pérdida dentro del formulario,
- **cuando** dejo en blanco el campo de texto observacional "Justificación de la Pérdida" o coloco un texto con menos de 10 caracteres y presiono el botón "Guardar Pérdida",
- **entonces** el sistema debe detener inmediatamente el procesamiento de la solicitud, enfocar el campo en color rojo y desplegar el mensaje de error: "Debe ingresar una justificación aclaratoria obligatoria de al menos 10 caracteres explicando detalladamente la causa de la pérdida de mercancía".

### CA-026.3 — Descuento automático en tiempo real y bloqueo por sobrestock
- **Dado que** confirmo el registro de una baja por pérdida de 5 unidades para un producto que registra 20 unidades en existencia en la base de datos,
- **cuando** el servidor procesa y valida la solicitud,
- **entonces** las existencias del producto deben reducirse inmediatamente a 15 unidades en el catálogo activo; si la cantidad a mermar ingresada es superior a las existencias disponibles (ej. intentar descontar 25 unidades de 20 disponibles), el sistema debe denegar la operación notificando: "No se puede procesar la pérdida: La cantidad declarada excede las existencias físicas registradas en el almacén".

### CA-026.4 — Registro del impacto contable e historial inmutable en auditoría
- **Dado que** la declaración de pérdida ha sido procesada y guardada exitosamente en la plataforma,
- **cuando** el sistema confirma la transacción en la base de datos,
- **entonces** debe calcular de forma automática el impacto económico total multiplicando las unidades mermadas por el costo de adquisición registrado del producto, guardar la transacción en la tabla `inventory_losses` y generar un registro inalterable en la bitácora de auditoría (`inventory_movements`) indicando fecha, hora exacta, usuario autorizador, costo financiero afectado y motivo de la baja.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/inventory/losses` | Registra la merma y descuenta del stock |

---

## Notas técnicas

- Descuento de stock en la tabla `products` e inserción del registro correspondiente en `inventory_losses` indicando la razón y el ID del usuario autorizador.
