# HU-015 — Preparación y empaque de pedidos

| Campo | Valor |
|---|---|
| Módulo | Operación de empleados |
| Prioridad | Alta |
| Estado | Implementado en el flujo revisado; validación de aceptación pendiente |
| RF asociados | RF-015 |

## Historia

**Como** empleado responsable de preparar pedidos pagados, **quiero** tomar un pedido, revisar sus productos y confirmar cada uno durante el empaque, **para** entregarlo completo y habilitar su retiro o entrega.

## Criterios de aceptación

1. Un empleado autenticado consulta la cola y toma un pedido pagado disponible. El sistema impide que dos personas lo tomen simultáneamente.
2. Al abrir **Empacar**, la pantalla muestra los productos, sus cantidades y, cuando existe, una imagen.
3. La confirmación de cada producto se guarda en el servidor; el empleado puede desmarcarla mientras prepara el pedido.
4. No se permite finalizar el empaque mientras falten productos por confirmar; el servidor vuelve a comprobarlo.
5. Solo la persona asignada o un supervisor autorizado puede modificar la preparación. El cliente y el repartidor no disponen de acciones de empaque.
6. Si se presenta una incidencia, el empleado puede registrarla para revisión por supervisión.

## Rutas y evidencia

- `POST /api/employee/orders/:id/claim`: tomar pedido.
- `PATCH /api/employee/orders/:id/picking`: confirmar cantidades.
- `POST /api/employee/orders/:id/pack`: finalizar empaque.
- `be/src/modules/employee/employee.service.ts`, `fe/src/pages/Employee/EmployeeWorkspace.tsx`, `be/tests/employee.integration.ts`.

No se asigna repartidor desde el flujo de empaque: los domicilios listos se toman por autoservicio (ver HU-037 y RF-015). Ver también [Operación de empleados](../../OPERACION_EMPLEADOS.md).
