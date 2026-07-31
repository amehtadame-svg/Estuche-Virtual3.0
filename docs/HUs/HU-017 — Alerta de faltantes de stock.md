# HU-017 — Alerta de faltantes de stock

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-017 |
| **Título** | Alerta de faltantes de stock |
| **Módulo** | Notificaciones |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-017 |

---

## Historia

**Como** administrador o encargado de almacén,  
**quiero** recibir alertas automáticas e indicadores en el panel superior cada vez que la venta o salida de un producto reduzca sus existencias por debajo del umbral mínimo de seguridad,  
**para** enterarme en tiempo real sobre situaciones críticas de inventario, emitir órdenes de reabastecimiento inmediatas y evitar pérdidas de ventas por falta de stock.

---

## Criterios de Aceptación

### CA-017.1 — Generación automática de notificación de bajo stock
- **Dado que** una transacción de venta o salida reduce el stock de un producto por debajo de su `min_stock`,
- **cuando** el movimiento se completa exitosamente,
- **entonces** el sistema crea de forma automática un evento y registro de notificación de alerta de faltante.

### CA-017.2 — Indicador numérico en la barra de navegación
- **Dado que** existen alertas de bajo stock sin revisar por el administrador,
- **cuando** el usuario navega por la plataforma,
- **entonces** visualiza un icono de campana en la barra superior con un contador en color rojo indicando el número de productos en estado crítico.

### CA-017.3 — Menú flotante de revisión rápida
- **Dado que** hago clic sobre la campana de notificaciones,
- **cuando** el menú se despliega,
- **entonces** muestra la lista de productos con stock crítico, sus existencias actuales y un botón para iniciar el reabastecimiento.

### CA-017.4 — Marcar notificación como atendida
- **Dado que** reviso una alerta dentro del menú desplegable,
- **cuando** presiono "Marcar como Atendida",
- **entonces** la notificación cambia su estado y disminuye en 1 el contador flotante de la barra superior.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/notifications/stock-alerts` | Obtiene las alertas de faltantes pendientes |

---

## Notas técnicas

- Disparador/Evento (`Domain Event`: `ProductStockDroppedBelowThreshold`) publicado al completar la venta que evalúa si se debe insertar el registro en `notifications`.
