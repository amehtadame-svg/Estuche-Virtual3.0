<!--
  ¿Qué? Historia de usuario que describe la administración del ciclo de vida de los pedidos.
  ¿Para qué? Formalizar el seguimiento operativo de cada compra desde que se genera hasta que se entrega.
  ¿Impacto? Permite mantener informados a los clientes y coordinar la logística de despacho.
-->

# HU-034 — Gestión de pedidos por el administrador

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-034 |
| **Título** | Gestión de pedidos por el administrador |
| **Módulo** | Pedidos |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-009 |

---

## Historia

**Como** administrador de la plataforma,
**quiero** consultar el listado completo de pedidos, filtrarlos por estado o cliente, y actualizar su estado,
**para** coordinar el despacho de mercancía y mantener informados a los clientes sobre sus compras.

---

## Criterios de Aceptación

### CA-034.1 — Listado de pedidos
- **Dado que** accedo al módulo de gestión de pedidos (`/admin/pedidos`),
- **cuando** la vista termina de cargar,
- **entonces** veo una tabla paginada con número de pedido, cliente, fecha, total y estado actual.

### CA-034.2 — Filtro por estado y cliente
- **Dado que** me encuentro en el listado de pedidos,
- **cuando** aplico un filtro por estado ("Pendiente", "En preparación", "Enviado", "Entregado", "Cancelado") o busco por cliente,
- **entonces** la tabla se actualiza mostrando solo los pedidos que cumplen el criterio.

### CA-034.3 — Actualización de estado de un pedido
- **Dado que** selecciono un pedido y cambio su estado,
- **cuando** confirmo la acción,
- **entonces** el sistema actualiza `pedidos.estado`, registra `updated_at` y notifica al cliente del cambio.

### CA-034.4 — Bloqueo de transición inválida
- **Dado que** un pedido ya se encuentra en estado "Entregado" o "Cancelado",
- **cuando** intento moverlo a un estado anterior del flujo,
- **entonces** el sistema rechaza el cambio con el mensaje: "Transición de estado no permitida".


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/pedidos` | Lista todos los pedidos con filtros |
| PUT | `/api/admin/pedidos/{id}` | Actualiza el estado de un pedido |

---

## Notas técnicas

- Los estados válidos y sus transiciones deben validarse en el servicio, no solo en el frontend.
- Cada cambio de estado dispara una notificación (ver HU-040).
