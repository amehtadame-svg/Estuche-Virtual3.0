<!--
  ¿Qué? Historia de usuario que describe el proceso de devolución de un producto adquirido.
  ¿Para qué? Formalizar el canal por el cual el cliente solicita reembolso o cambio de un producto.
  ¿Impacto? Fortalece la confianza del cliente y da soporte al servicio postventa.
-->

# HU-039 — Solicitud y gestión de devoluciones

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-039 |
| **Título** | Solicitud y gestión de devoluciones |
| **Módulo** | Postventa |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-022 |

---

## Historia

**Como** cliente con un pedido entregado, o administrador gestionando dichas solicitudes,
**quiero** solicitar la devolución de un producto indicando el motivo, y como administrador, revisar y resolver esa solicitud,
**para** obtener un reembolso o cambio cuando el producto no cumple mis expectativas.

---

## Criterios de Aceptación

### CA-039.1 — Solicitud de devolución desde el historial de compras
- **Dado que** tengo un pedido en estado "Entregado",
- **cuando** selecciono un producto y elijo "Solicitar devolución", indicando cantidad, motivo y estado del producto,
- **entonces** se crea el registro en `devoluciones` con estado "solicitada".

### CA-039.2 — Revisión de la solicitud por el administrador
- **Dado que** existen devoluciones en estado "solicitada",
- **cuando** el administrador accede al módulo de devoluciones,
- **entonces** puede visualizar el motivo, el producto y aprobar o rechazar la solicitud.

### CA-039.3 — Aprobación y cálculo del reembolso
- **Dado que** el administrador aprueba una devolución,
- **cuando** confirma la acción,
- **entonces** el sistema calcula el `reembolso` según el precio pagado y actualiza el estado a "aprobada".

### CA-039.4 — Rechazo de una solicitud
- **Dado que** el administrador determina que la solicitud no cumple la política de devoluciones,
- **cuando** la rechaza indicando un motivo,
- **entonces** el estado cambia a "rechazada" y se notifica al cliente.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/devoluciones` | Crea una solicitud de devolución |
| GET | `/api/admin/devoluciones` | Lista las solicitudes de devolución |
| PUT | `/api/admin/devoluciones/{id}` | Aprueba o rechaza una devolución |

---

## Notas técnicas

- `devoluciones.fecha_resolucion` se completa únicamente al aprobar o rechazar.
- Una devolución aprobada no reintegra automáticamente el stock salvo que el `estado_producto` sea "bueno".
