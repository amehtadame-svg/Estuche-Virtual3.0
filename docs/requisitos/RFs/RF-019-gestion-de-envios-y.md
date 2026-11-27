# RF-019 — Gestión de envíos y seguimiento

**Historia relacionada:** HU-037. Complementa el flujo de preparación y entrega descrito en RF-015.

## Descripción y flujo

1. El empleado termina de empacar un pedido a domicilio pagado.
2. El repartidor consulta pedidos disponibles y toma uno por autoservicio. Solo entonces el sistema asigna el repartidor y crea el envío en tránsito; no existe asignación manual desde el empleado.
3. El repartidor consulta sus envíos asignados y confirma la entrega al cliente.
4. El servidor valida titularidad, pago y estados; registra la fecha y actualiza el envío, pedido y preparación.
5. El cliente puede consultar el estado de su pedido.

## Reglas

- Antes de tomar el pedido, la lista no expone los datos personales ni la dirección.
- La toma es transaccional y evita asignaciones simultáneas duplicadas.
- El repartidor solo confirma entregas asignadas a su cuenta. Una confirmación repetida del mismo envío entregado es idempotente.
- La vista del repartidor no permite editar la dirección, reasignar el envío ni gestionar devoluciones.
- No se acredita una notificación automática al cliente al confirmar.

## Rutas

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/delivery/pending-orders` | Repartidor |
| POST | `/api/delivery/pending-orders/:id/claim` | Repartidor |
| GET | `/api/delivery/despatches` | Repartidor |
| POST | `/api/delivery/despatches/:id/confirm` | Repartidor asignado |
| GET | `/api/orders/:id` | Cliente propietario o personal autorizado según servicio |

**Estado:** implementado en el flujo revisado; falta validación de aceptación en el entorno de despliegue. Evidencia: `be/src/modules/delivery/`, `fe/src/pages/Delivery/` y `fe/src/pages/OrderStatus/OrderStatus.tsx`.
