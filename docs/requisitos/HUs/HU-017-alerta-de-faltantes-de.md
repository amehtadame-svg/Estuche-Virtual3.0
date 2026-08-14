<!--
  ¿Qué? Historia de usuario que describe las alertas automáticas por faltantes de stock.
  ¿Para qué? Formalizar la notificación proactiva cuando un producto alcanza su punto de reorden.
  ¿Impacto? Evita que el negocio se quede sin productos de alta rotación.
-->

# HU-017 — Alerta de faltantes de stock

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-017 |
| **Título** | Alerta de faltantes de stock |
| **Módulo** | Notificaciones |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-016|

---

## Historia

**Como** administrador del establecimiento, jefe de bodega o encargado de reposición de mercancía, responsable del monitoreo constante de niveles de inventario y prevención de quiebres de stock,  
**quiero** que la plataforma genere e impulse notificaciones automáticas en tiempo real e indicadores visuales destacados en la barra de navegación cada vez que una transacción de venta o salida manual provoque que el stock de un producto caiga por debajo de su umbral mínimo de seguridad parametrizado (punto de reorden),  
**para** ser alertado de forma proactiva sin depender de revisiones o reportes manuales periódicos, reaccionar de manera inmediata emitiendo solicitudes o pedidos de reabastecimiento a proveedores, evitar la pérdida de oportunidades de venta por falta de existencias y mantener un flujo comercial ininterrumpido en la tienda.

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
