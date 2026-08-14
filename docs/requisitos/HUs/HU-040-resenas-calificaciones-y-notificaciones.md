<!--
  ¿Qué? Historia de usuario que describe la calificación de productos y el sistema de notificaciones del cliente.
  ¿Para qué? Formalizar la retroalimentación de compradores y mantenerlos informados sobre eventos relevantes.
  ¿Impacto? Aumenta la confianza de nuevos compradores y mejora la comunicación con el cliente.
-->

# HU-040 — Reseñas, calificaciones y notificaciones al cliente

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-040 |
| **Título** | Reseñas, calificaciones y notificaciones al cliente |
| **Módulo** | Experiencia del cliente |
| **Prioridad** | Baja |
| **Estado** | Por Implementar |
| **RF asociados** | RF-010, RF-024, RF-026 |

---

## Historia

**Como** cliente que ya recibió un pedido,
**quiero** calificar y comentar los productos que compré, y recibir notificaciones dentro de la plataforma sobre el estado de mis pedidos, promociones o respuestas a mis solicitudes de soporte,
**para** compartir mi experiencia con otros compradores y mantenerme informado sin tener que consultar manualmente cada sección.

---

## Criterios de Aceptación

### CA-040.1 — Calificar un producto comprado
- **Dado que** tengo un pedido en estado "Entregado" que incluye un producto,
- **cuando** accedo a la ficha del producto y selecciono una calificación de 1 a 5 estrellas con un comentario opcional,
- **entonces** la reseña se guarda en `reseñas` asociada a mi usuario y al producto.

### CA-040.2 — Restricción de una reseña por compra
- **Dado que** ya califiqué un producto específico,
- **cuando** intento calificarlo nuevamente,
- **entonces** el sistema lo impide, respetando la restricción `UNIQUE(id_producto, id_usuario)`.

### CA-040.3 — Notificación por cambio de estado de pedido
- **Dado que** el estado de uno de mis pedidos cambia (por ejemplo a "Enviado"),
- **cuando** el sistema procesa el evento,
- **entonces** se crea una notificación no leída visible en el ícono de campana de la interfaz.

### CA-040.4 — Envío de solicitud de soporte y notificación de respuesta
- **Dado que** envío un mensaje desde el formulario de soporte y contacto,
- **cuando** un administrador responde mi solicitud,
- **entonces** recibo una notificación indicando que mi solicitud fue atendida.

### CA-040.5 — Marcar notificaciones como leídas
- **Dado que** tengo notificaciones pendientes en mi panel,
- **cuando** las reviso,
- **entonces** el sistema actualiza `leida = true` y el contador de notificaciones se reduce.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/resenas` | Registra una reseña sobre un producto comprado |
| GET | `/api/productos/{id}/resenas` | Lista las reseñas públicas de un producto |
| GET | `/api/notificaciones` | Lista las notificaciones del usuario autenticado |
| PATCH | `/api/notificaciones/{id}` | Marca una notificación como leída |
| POST | `/api/contacto` | Envía una solicitud de soporte |

---

## Notas técnicas

- La calificación (`calificacion`) se restringe a un rango entero de 1 a 5 mediante validación en el servicio.
- Las notificaciones se generan de forma asíncrona ante eventos del sistema (cambio de estado, respuesta de soporte, nuevas promociones).
