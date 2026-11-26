# RF-015 — Preparación y entrega de pedidos

**Historias relacionadas:** HU-015 y HU-037.

## Descripción

El sistema debe permitir que un empleado autorizado prepare un pedido pagado, confirme sus productos y finalice el empaque. Para pedidos a domicilio empacados, un repartidor autenticado puede tomar el pedido disponible y confirmar la entrega de los envíos asignados a su cuenta.

## Flujo

1. El empleado toma un pedido pagado de la cola.
2. Revisa y confirma cada producto. El servidor guarda el avance.
3. Finaliza el empaque cuando todas las cantidades estén completas.
4. Si es domicilio, el pedido aparece en la lista de pendientes del repartidor sin dirección ni datos personales del comprador.
5. Un repartidor lo toma mediante autoservicio. El servidor asigna la entrega y crea el envío dentro de una transacción.
6. El repartidor consulta sus entregas y confirma la recepción por parte del cliente.

## Reglas

- El pedido debe estar pagado y habilitado para preparación; solo la persona asignada o un supervisor puede preparar y empacar.
- El empaque exige confirmar todos los productos y sus cantidades.
- Solo pedidos a domicilio empacados y disponibles pueden tomarse. No hay asignación manual desde el módulo del empleado.
- El repartidor solo puede confirmar los envíos asignados a él; se validan el pago y el estado de pedido y envío.
- Los datos personales y la dirección se muestran después de tomar el pedido.
- Una toma concurrente se serializa y no genera asignaciones duplicadas.

## Rutas

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/employee/orders/:id/claim` | Personal operativo autorizado |
| PATCH | `/api/employee/orders/:id/picking` | Responsable o supervisor |
| POST | `/api/employee/orders/:id/pack` | Responsable o supervisor |
| GET | `/api/delivery/pending-orders` | Repartidor |
| POST | `/api/delivery/pending-orders/:id/claim` | Repartidor |
| GET | `/api/delivery/despatches` | Repartidor |
| POST | `/api/delivery/despatches/:id/confirm` | Repartidor asignado |

**Estado:** implementado en el flujo revisado; las pruebas de integración cubren permisos, empaque y concurrencia. No sustituye pruebas de aceptación en el entorno de despliegue. Ver [operación](../../OPERACION_EMPLEADOS.md).
