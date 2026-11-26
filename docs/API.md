# API — referencia de operaciones principales

**Base:** inspección estática de `6af297a`, 26-11-2026. Referencia parcial pendiente de validación de Franck; para lista y condiciones completas consultar [`app.ts`](../be/src/app.ts) y los `*.routes.ts`, schemas y servicios de cada módulo. No es una especificación OpenAPI completa ni garantiza funcionamiento integral.

La base relativa es `/api`. Las rutas protegidas requieren `Authorization: Bearer <token>`; se consulta el rol vigente en BD. Cada ruta y servicio aplica además sus reglas de rol y propiedad; no asumir que todas las rutas comparten permisos. Nunca incluir tokens en evidencias. Errores y esquema preciso deben verificarse en la ruta concreta.

| Área | Métodos y rutas | Condición y alcance |
|---|---|---|
| Salud | `GET /api/health`, `GET /api/health/ready` | Salud y disponibilidad de BD. |
| Simulación de pagos | `GET /api/payments/config`; `POST /api/payments/demo/checkout`; `GET /api/payments/demo/:key`; `POST /api/payments/demo/:key/resolve` | Token obligatorio. Simulación habilitada por configuración; no procesa dinero real. Checkout usa requestKey idempotente, servidor recalcula y reserva stock en transacción. |
| Empleado | `GET /api/employee/orders`; `POST /api/employee/orders/:id/claim`; `PATCH /api/employee/orders/:id/picking`; `POST /api/employee/orders/:id/pack` | Rutas staff con reglas adicionales de operación y propiedad; consultar [operación](OPERACION_EMPLEADOS.md). |
| Pago en tienda | `POST /api/employee/orders/:id/store-payment` | Registro por personal autorizado con `requestKey` y método; no es checkout en línea ni cobro bancario. |
| Domicilios | `GET /api/delivery/pending-orders`; `POST /api/delivery/pending-orders/:id/claim`; `GET /api/delivery/despatches`; `POST /api/delivery/despatches/:id/confirm` | Token y rol `delivery`; el repartidor toma por autoservicio pedidos elegibles y confirma sus entregas. |
| Ayuda interna | `GET /api/support/threads`; `GET /api/support/threads/:id`; `POST /api/support/threads`; `POST /api/support/threads/:id/messages` | Permisos por rol y titularidad; no se afirma envío de correo. |
| Cupón | `POST /api/promotional-codes/validate` | Validación y cotización no consumen el cupón; checkout vuelve a validar. |

## Contrato del checkout de demostración

[`payments.schema.ts`](../be/src/modules/payments/payments.schema.ts): `requestKey` UUID, `method` (`tarjeta`, `pse`, `nequi`), `outcome` (`approved`, `rejected`, `pending`), `address` (5–255 caracteres), `phone` (celular colombiano de 10 dígitos empezando por 3), `items` (1–100 productos únicos con `productId` y `quantity` 1–999), `code` opcional. El cuerpo es estricto. Resolución posterior acepta `outcome` aprobado o rechazado. La respuesta y los conflictos dependen del servicio; [detalle de simulación](PAGOS_DEMOSTRACION.md).

[Plan y pruebas](PLAN_PRUEBAS.md) | [Guía técnica](INSTALACION_Y_DESPLIEGUE.md) | [Mapa completo de módulos](../be/src/modules/).
