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
**Como** administrador,
**quiero** recibir alertas de faltantes,
**para** reaccionar a tiempo y evitar pérdidas de ventas.

---

## Criterios de Aceptación

### CA-017.1 — Disparo automático de notificación

- **Dado que** se completa una venta o salida y el stock de un producto cae por debajo de su valor crítico (`min_stock`),
- **cuando** finaliza la transacción,
- **entonces** el sistema crea una notificación interna (en el panel o por correo) alertando que el producto requiere reabastecimiento.

### CA-017.2 — Indicador global en panel superior

- **Dado que** existen alertas de bajo stock sin revisar,
- **cuando** el administrador ingresa al sistema,
- **entonces** visualiza un icono de campana con la cantidad de faltantes pendientes por atender.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/notifications/stock-alerts` | Obtiene las alertas de faltantes pendientes |

---

## Notas técnicas

- Disparador/Evento (`Domain Event`: `ProductStockDroppedBelowThreshold`) publicado al completar la venta que evalúa si se debe insertar el registro en `notifications`.
