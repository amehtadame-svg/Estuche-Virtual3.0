# Operación: empleados, supervisión, clientes y repartidores

## Acceso y responsabilidades

- **Empleado**: `/empleado`. Puede crear pedidos para clientes, consultar los pedidos propios, tomar pedidos pagados de la cola, preparar y empacar, reportar incidencias, dejar domicilios listos para que los tome un repartidor, confirmar retiros mediante código y registrar movimientos de inventario. No puede consultar la supervisión, resolver incidencias, reasignar ni cancelar reservas.
- **Administrador y superadministrador**: pueden entrar a `/empleado` y utilizar las acciones de supervisión; el registro de pagos simulados sigue restringido a superadministrador y al entorno de pruebas configurado.
- **Cliente**: `/cliente/retiros`, para generar un código de retiro de un pedido propio que esté listo. El código anterior queda invalidado al generar uno nuevo.
- **Repartidor**: `/repartidor`. Ve hasta 100 pedidos pagados, empacados y disponibles en «Pedidos pendientes» y puede tomar uno. En «Mis entregas» ve hasta 100 envíos que tomó y puede confirmar que el cliente los recibió. Los datos del cliente y la dirección se muestran solo después de tomar el pedido. No puede editar la dirección ni reasignar el envío; las incidencias o devoluciones requieren gestión administrativa fuera de esta vista.

El servidor comprueba el rol y, cuando corresponde, la asignación o propiedad; ocultar un botón no es el mecanismo de seguridad. Administradores y superadministradores conservan sus paneles y acciones generales anteriores.

El carrito y las acciones de compra no se muestran a empleados ni repartidores; al crear pedidos o movimientos de inventario el empleado elige productos en un catálogo con búsqueda por nombre e imágenes.

## Empaque y ayuda interna

El empleado toma un pedido pagado, abre **Empacar** y confirma cada producto con su botón. Se ve la fotografía cuando existe y la cantidad solicitada. Cada confirmación se guarda de inmediato; solo cuando todas las líneas están confirmadas se habilita **Finalizar empacado**. El servidor sigue verificando cantidades e incidencias.

En **Ayuda con el jefe**, el empleado puede iniciar solicitudes y responder. Tanto administrador como superadministrador pueden abrir **Ayuda empleados** para leer y responder en la misma conversación. Los demás empleados no tienen acceso a solicitudes ajenas. La bandeja es interna: **no envía correo ni avisos automáticos**; hay que abrirla o actualizarla para consultar respuestas. Se muestran hasta 100 conversaciones recientes.

## Pago recibido en tienda

El empleado que creó el pedido, o un administrador/superadministrador, puede registrar el pago **total** en efectivo o tarjeta mientras la reserva esté vigente. Debe verificar físicamente que lo recibió antes de confirmar. Es un registro manual: **no procesa tarjetas ni integra una pasarela**. El servidor toma el importe del pedido y del recibo, crea evidencia del pago en COP y sincroniza ambos estados antes de habilitar la cola pagada. No acepta precios ni importes proporcionados por el navegador. Si hay otro pago pendiente, aprobado o reembolsado, o los importes no coinciden, rechaza el registro para revisión financiera. Se usa una referencia idempotente para reintentos y bloqueo transaccional para evitar duplicaciones.

Los recibos de pedidos nuevos de empleados incluyen sus líneas de producto; el envío puede hacer que la suma de estas líneas sea inferior al total. No se han rellenado líneas faltantes de recibos históricos.

## Contrato API y despliegue

La separación cambia rutas: deben desplegarse frontend y backend compatibles juntos; no hay alias para las rutas antiguas.

- `/api/employee`: operaciones del empleado, actividad y movimientos propios, pago en tienda `POST /orders/:id/store-payment` (`requestKey` UUID y `method` `cash|card`).
- `/api/support/threads`: conversación interna del empleado y administración; creación exclusiva de empleado, lecturas y respuestas restringidas por rol y propietario.
- `/api/client/my-pickups` y `POST /api/client/orders/:id/pickup-code`: retiro del comprador.
- `/api/supervision`: pedidos de supervisión, empleados, actividad y movimientos del equipo, `resolve`, `reassign`, `cancel` y `simulate-payment`. Exige admin/superadmin; la simulación exige superadmin y configuración de desarrollo/pruebas.
- `GET /api/delivery/pending-orders` y `POST /api/delivery/pending-orders/:id/claim`: lista y toma de domicilios empacados por el repartidor. La asignación se serializa para evitar que dos repartidores tomen el mismo pedido.
- `/api/delivery/despatches` y `POST /api/delivery/despatches/:id/confirm`: repartidor asignado. La confirmación vuelve a validar el estado de despacho, preparación y pago dentro de una transacción.

La bandeja de ayuda requiere aplicar la migración `20261127000000_employee_support`, que crea dos tablas. Compose ejecuta migraciones automáticamente al iniciar el backend: revisar la base configurada y hacer respaldo antes de desplegar. El checkout de cliente existente y sus rutas no se sustituyen por el registro en tienda.

## Limitaciones y comprobaciones pendientes

- El registro de pago es manual y no sustituye conciliación bancaria, terminal de tarjeta ni comprobante externo; un registro erróneo debe tratarse como incidencia financiera.
- La cancelación/vencimiento existente libera inventario y anula el recibo, pero no cambia automáticamente pagos pendientes. Su posterior aprobación por el flujo de la aplicación se bloquea; un cobro externo incierto requiere conciliación manual. No se alteró el estado de pasarela por seguridad.
- Las pruebas transaccionales necesitan PostgreSQL aislado y migrado, con `EMPLOYEE_TEST_DATABASE_URL` apuntando a una base cuyo nombre termine en `_test`. No usar la base habitual ni compartir credenciales en el chat. Algunas suites exigen además un servidor local; consultar la validación de cada archivo. Ejecutar con `pnpm test:integration` desde `be` y verificar restricciones de cada suite.
- La aplicación de código promocional del CRUD de pedidos no recalcula actualmente el total del recibo; no se modificó el flujo de descuentos ni el checkout de demostración en este cambio.
