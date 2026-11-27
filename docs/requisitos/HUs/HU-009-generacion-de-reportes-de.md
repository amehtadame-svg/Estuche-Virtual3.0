# HU-009 — Consulta de ingresos de inventario

| Campo | Valor |
|---|---|
| Módulo | Inventario |
| Prioridad | Media |
| Estado | Implementado en el flujo revisado; validación de aceptación pendiente |
| RF asociados | RF-016 |

## Historia

**Como** administrador, **quiero** consultar el historial de ingresos de mercancía, **para** revisar los movimientos que incrementaron las existencias.

## Criterios de aceptación

1. En Ingresos se muestra una lista de movimientos de entrada con el producto, cantidad, fecha y motivo cuando esté disponible.
2. Cada fila corresponde a un movimiento; un producto puede aparecer más de una vez.
3. La consulta requiere una cuenta con permisos administrativos.

## Rutas y alcance

`GET /api/inventory/movements?type=in` alimenta el historial. Evidencia: `be/src/modules/inventory/inventory.routes.ts`, `fe/src/pages/Admin/Inventory/InventoryInbound.tsx`.

Este historial no equivale a un reporte financiero de compras ni certifica filtros por fechas o exportación. No se alteraron los movimientos existentes.
