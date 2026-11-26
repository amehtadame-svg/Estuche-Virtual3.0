# HU-037 — Seguimiento y entrega de pedidos

| Campo | Valor |
|---|---|
| Módulo | Logística |
| Prioridad | Media |
| Estado | Implementado en el flujo revisado; validación de aceptación pendiente |
| RF asociados | RF-015 y RF-019 |

## Historia

**Como** cliente, quiero consultar el estado de mi pedido. **Como** repartidor, quiero tomar un pedido a domicilio empacado y confirmar su entrega, para gestionar mis entregas asignadas.

## Criterios de aceptación

1. Un pedido a domicilio pagado y empacado aparece disponible para los repartidores. Antes de tomarlo no muestra dirección ni datos personales.
2. El repartidor toma el pedido por autoservicio; el sistema lo asigna y crea el envío. Si otra persona lo tomó primero, la operación se rechaza.
3. La vista de entregas solo muestra los envíos asignados a la cuenta del repartidor.
4. El repartidor puede confirmar la entrega, y se actualizan los estados del envío y del pedido.
5. El cliente puede consultar el estado del pedido propio. La confirmación no implica una notificación automática adicional.

## Rutas y evidencia

- `GET /api/delivery/pending-orders` y `POST /api/delivery/pending-orders/:id/claim`.
- `GET /api/delivery/despatches` y `POST /api/delivery/despatches/:id/confirm`.
- `GET /api/orders/:id` para consultar el pedido autorizado.
- `be/src/modules/delivery/`, `fe/src/pages/Delivery/`, `fe/src/pages/OrderStatus/` y `be/tests/employee.integration.ts`.

Las asignaciones son por autoservicio; empleados no asignan repartidores manualmente. Ver [Operación de empleados](../../OPERACION_EMPLEADOS.md).
