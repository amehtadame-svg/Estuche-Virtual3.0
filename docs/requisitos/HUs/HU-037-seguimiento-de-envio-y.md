<!--
  ¿Qué? Historia de usuario que describe el seguimiento del envío de un pedido confirmado.
  ¿Para qué? Formalizar la visibilidad del proceso de entrega para el cliente y el repartidor.
  ¿Impacto? Reduce las consultas de soporte relacionadas con "¿dónde está mi pedido?".
-->

# HU-037 — Seguimiento de envío y estado del pedido

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-037 |
| **Título** | Seguimiento de envío y estado del pedido |
| **Módulo** | Logística |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-019 |

---

## Historia

**Como** cliente con un pedido confirmado, o repartidor asignado a un envío,
**quiero** consultar el estado del envío de mi pedido, y como repartidor, actualizar dicho estado a medida que avanza la entrega,
**para** conocer en todo momento en qué etapa se encuentra mi compra, o gestionar mis entregas asignadas.

---

## Criterios de Aceptación

### CA-037.1 — Creación automática del envío
- **Dado que** un pedido cambia a estado "En preparación",
- **cuando** el sistema procesa el cambio,
- **entonces** se crea un registro en `envios` con estado "en camino" y se asigna un repartidor disponible.

### CA-037.2 — Consulta de estado por el cliente
- **Dado que** accedo al detalle de mi pedido,
- **cuando** reviso la sección de envío,
- **entonces** veo el estado actual ("en camino", "entregado"), la dirección de entrega y la fecha estimada.

### CA-037.3 — Actualización de estado por el repartidor
- **Dado que** soy el repartidor asignado a un envío,
- **cuando** marco el pedido como "Entregado",
- **entonces** el sistema registra `fecha_entregado` y notifica al cliente.

### CA-037.4 — Listado de entregas asignadas al repartidor
- **Dado que** inicio sesión como repartidor,
- **cuando** accedo a mi panel de entregas,
- **entonces** veo únicamente los envíos donde `id_repartidor` corresponde a mi usuario.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/envios/{idPedido}` | Consulta el estado de envío de un pedido |
| PUT | `/api/envios/{id}` | Actualiza el estado de un envío (repartidor) |
| GET | `/api/envios/mis-entregas` | Lista los envíos asignados al repartidor autenticado |

---

## Notas técnicas

- `envios.id_repartidor` referencia a `usuarios` con `rol = 'repartidor'`.
- El cambio a "Entregado" es irreversible desde la interfaz del repartidor.
