# Pasarela académica de pagos

## Alcance

Simulador propio integrado al checkout de Estuche Virtual. Permite demostrar
**PSE, tarjeta y Nequi**, con moneda **COP** y **envío gratis**. No usa una cuenta
externa, no llama a bancos y no es una integración oficial de esos servicios.
No solicita números de tarjeta, CVV, claves, OTP ni credenciales financieras.

**Usar una base de demostración.** Aunque no mueve dinero, sí guarda pedidos,
recibos, pagos y movimientos de inventario en la base configurada. Las ventas
simuladas aprobadas también pueden aparecer en los reportes existentes.

## Activación

La funcionalidad está apagada por defecto. No requiere nuevas migraciones,
pero sí tener aplicadas las migraciones existentes del proyecto, incluido el
módulo de operaciones de empleados de noviembre de 2026.

En `be/.env` para ejecución nativa, o `.env` de la raíz para Docker Compose:

```dotenv
NODE_ENV=development
ENABLE_PAYMENT_SIMULATION=true
```

Completa también la conexión a tu base de demostración y `JWT_SECRET` siguiendo
la guía de instalación. No pegues secretos en el chat ni los subas al repositorio.
Reinicia el backend tras cambiar estas variables. Con Compose:

```bash
docker compose up -d --build backend frontend
```

Con ejecución nativa, desde `be/`:

```bash
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy
pnpm dev
```

Y desde `fe/`, en otra terminal:

```bash
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
```

La simulación solo se permite con `NODE_ENV=development` o `test` y la bandera
exactamente en `true`. **En producción permanece bloqueada**, aunque la bandera
esté activa. El frontend consulta esta disponibilidad y deshabilita el botón si
no puede verificarla. No hacen falta credenciales de Wompi, PayU u otra pasarela.

## Guion para una exposición

1. Inicia sesión como cliente y añade un producto con stock al carrito.
2. Abre el checkout y añade la dirección y un celular colombiano de prueba
   (por ejemplo `3001234567`; no es necesario que sea un número real).
3. Elige tarjeta, PSE o Nequi. No se piden datos bancarios.
4. Elige el resultado que quieres demostrar y pulsa **Simular pago**:
   - **Aprobado:** pedido y recibo pagados en el simulador; stock descontado.
   - **Rechazado:** pedido cancelado, recibo anulado y stock restituido.
   - **Pendiente:** pedido/recibo pendientes, stock reservado durante 30 minutos.
5. En la pantalla de resultado se muestran importe confirmado por el servidor,
   referencia `DEMO-…`, pedido, número de recibo y aviso de simulación.
6. Un pendiente se puede aprobar o rechazar con los botones de demostración
   mientras la reserva esté vigente. **Consultar estado** vuelve a leer la BD.
7. Una vez terminado, **Volver al catálogo** permite comenzar otra compra.

Si hay un corte de conexión, usa **Reintentar el mismo pago** o recarga la página.
El intento original se conserva en `sessionStorage`, separado por usuario, para
recuperar el resultado sin duplicar pedidos. No cierres la pestaña ni borres ese
almacenamiento durante un intento sin resultado conocido. La recuperación
automática es de la misma pestaña; no es un historial de pagos entre dispositivos.

Los pendientes vencidos se bloquean para pago inmediatamente. La liberación de
stock utiliza el job existente de reservas: por defecto se ejecuta cada 5 minutos
con el backend activo. Si está desactivado, ejecuta `pnpm employee:expire` desde
`be/` con la configuración de la base de demostración. El vencimiento no convierte
un pago en aprobado ni simula una notificación bancaria.

## Integridad y permisos

- Sesión obligatoria; solo roles cliente, administrador o superadmin pueden
  comprar para sí mismos. Solo el propietario recupera o resuelve su pago.
- El servidor consulta precios, stock, vigencia, mínimo y límite del descuento.
  No admite importes, precios unitarios ni datos bancarios enviados por el cliente.
- Pedido, detalles, recibo, pago, perfil, carrito y movimientos se escriben en una
  transacción. Un error revierte la compra completa.
- La referencia de intento tiene bloqueo transaccional y unicidad; reutilizarla
  con otros datos devuelve conflicto. Los resultados definitivos no se pueden
  cambiar desde este simulador.
- Las reservas usan descuentos de stock condicionales. Las confirmaciones y
  rechazos bloquean el pedido para evitar confirmaciones o devoluciones dobles.
- Un descuento consume un uso por pedido creado, incluso si luego se rechaza o
  vence. Los reintentos de la misma referencia no consumen usos adicionales.
- Los pagos quedan identificados con `gateway=demo-academica`, método seleccionado,
  `currency=COP` y referencia `DEMO-…`. Los eventos también indican simulación.

## API (requiere Bearer token)

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/payments/config` | Disponibilidad, moneda, envío y marca de simulación |
| POST | `/api/payments/demo/checkout` | Crear compra y resultado de demostración |
| GET | `/api/payments/demo/:key` | Recuperar resultado del propio intento |
| POST | `/api/payments/demo/:key/resolve` | Aprobar o rechazar un pendiente propio |

`checkout` acepta `requestKey` (UUID), `method` (`tarjeta`, `pse`, `nequi`),
`outcome` (`approved`, `rejected`, `pending`), `phone`, `address`, `items`
(`productId`, `quantity`) y `code` opcional. `resolve` solo acepta `outcome`
`approved` o `rejected`. `:key` es el UUID sin el prefijo `DEMO-`.

## Validación automatizada

```bash
cd be
pnpm build
pnpm test
cd ../fe
pnpm build
pnpm lint
node --test src/modules/frontend/frontend.test.ts
```

Se añadieron 16 pruebas unitarias/HTTP con dobles de Prisma: métodos, esquema
estricto, controles de entorno y acceso, importes, estados, reintentos,
propiedad, descuentos, stock y rollback lógico.

`be/tests/payments.integration.ts` añade pruebas con PostgreSQL real de
idempotencia concurrente, confirmaciones/rechazos simultáneos, competencia por
stock y vencimiento. Se incluye en `pnpm test:integration` y utiliza
`PAYMENT_TEST_DATABASE_URL` (o la variable existente `EMPLOYEE_TEST_DATABASE_URL`).
Por seguridad exige host local y una base cuyo nombre termine en `_test`.
La CI ya configura esta última variable y aplica las migraciones.

**Validación en esta sesión:** compilaron backend y frontend; pasaron las pruebas
unitarias/HTTP y las pruebas existentes del frontend; ESLint sin errores (con
advertencias preexistentes en pantallas administrativas). No se ejecutó la suite
contra PostgreSQL real ni el recorrido completo en navegador: este entorno no
tiene una base de pruebas configurada y restringe la descarga del motor nativo
de Prisma. Para compilar y ejecutar los dobles se generó localmente el cliente
sin motor. Esto no cambia el código ni los comandos normales de instalación.

## Evolución a una pasarela oficial

Para validar una integración bancaria real en sandbox será necesario elegir un
proveedor, crear su cuenta y configurar sus credenciales por variables de
entorno. Ese trabajo debe incluir creación de sesiones desde el backend,
webhooks autenticados y verificación del importe, moneda y referencia con el
proveedor. No basta con cambiar esta bandera ni confiar en un resultado enviado
por el navegador. No reutilices este endpoint de simulación para cobros reales.
