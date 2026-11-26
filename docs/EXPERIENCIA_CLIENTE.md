# Experiencia del cliente y entrega — 26/11/2026

## Navegación
- El cliente inicia sesión en `/`. El panel de cliente fue eliminado; `/cliente`
  solo redirige a Inicio para no romper marcadores anteriores.
- **Mis pedidos** está en la navegación de Mi cuenta
  (`/mis-pedidos`). Permite buscar referencia/producto y filtrar por estado.
- El listado usa `/api/orders`: para clientes el servidor impone `customerId`
  de la sesión; no acepta un cliente seleccionado por el navegador.
- Los UUID continúan como claves internas y en las rutas/API. En pantalla se
  usan referencias cortas estables (ej. `PED-AB12CD34`). No son claves nuevas ni
  reemplazan controles de autorización. Los formularios eligen nombres/referencias,
  no piden copiar UUID.

## Entrega
- Domicilio: **$10.000 COP**.
- Gratis si el subtotal de productos **antes de cupones** es **≥ $120.000 COP**.
- Retiro en tienda y carrito vacío: sin cargo de envío.
- Los cupones descuentan productos, no el domicilio. Los descuentos fijos se
  limitan al subtotal para no crear importes negativos.
- Frontend y backend tienen pruebas de frontera. El backend usa los precios de
  BD; guarda `shipping_cost` en el pedido y usa el total final en recibo y pago.
- Los pedidos históricos mantienen su envío en cero y sus totales originales.

## Migración necesaria antes de arrancar el backend actualizado

Con las variables de entorno de la instalación configuradas:

```sh
cd be
npx prisma migrate deploy
npx prisma generate
npm run build
```

La migración `20261126160000_order_shipping_cost` agrega una columna con valor
por defecto cero. No cambia UUID, productos, stock ni importes históricos.
No ejecutar `prisma migrate reset` ni reseedear una base con datos reales.
Después, reiniciar backend y frontend (también en Codespaces).

## Cupones
- `/api/promotional-codes/validate` ya estaba montado. Un código inexistente
  devolvía 404 desde la lógica de negocio; ahora devuelve 400 con explicación.
- La comparación ignora espacios exteriores y mayúsculas/minúsculas.
- Se mantienen validaciones de actividad, fechas, compra mínima y límite de usos.
  La fecha de fin incluye todo ese día UTC, igual que el checkout.
- Si se recibe un 404 sin JSON en Codespaces, verificar que el backend que escucha
  en el puerto 4000 esté actualizado; el frontend muestra un mensaje distinguible.
- Validar no consume usos; el checkout transaccional vuelve a validar y bloquea
  el cupón para evitar exceder su límite con compras concurrentes.

## Comprobaciones

```sh
npm run build --prefix fe
npm run lint --prefix fe
npm test --prefix fe
npm run build --prefix be
npm test --prefix be
```

Las pruebas unitarias/HTTP usan dobles de Prisma. Las de integración PostgreSQL
requieren una base de pruebas y las migraciones aplicadas; no usar producción.

Resultado en el entorno de desarrollo de Arena: builds frontend/backend correctos;
33 pruebas frontend y 126 backend aprobadas. ESLint sin errores (5 advertencias
preexistentes). Se corrigió el generador UUID en Supabase mediante la migración
`uuid_v7_search_path` y se verificaron 1.000 IDs distintos. No se ejecutaron las
suites de integración PostgreSQL ni compras contra la base remota. El entorno
local no tenía conexión PostgreSQL configurada y bloqueaba el
host de descarga de motores Prisma: para compilar y probar con dobles se generó
el cliente local sin motor; esto no modifica las dependencias ni la configuración
de despliegue del proyecto. En la instalación real usar `prisma generate` normal.

## Corrección del carrito y generador UUID (seguimiento)

Se reprodujo en Supabase el error `42883: function gen_random_bytes(integer)` al
usar `search_path=public`. `pgcrypto` estaba instalado en `extensions`, mientras
que el generador de IDs no fijaba su ruta de búsqueda. Esto impedía insertar filas
con ID por defecto desde Prisma, aunque listar datos sí funcionara.

La migración `20261126180000_uuid_v7_search_path` reemplaza la función con una
implementación que usa `pg_catalog.gen_random_uuid` nativo (PostgreSQL >= 13),
conserva UUID v7 y fija `search_path=pg_catalog`. No modifica ninguna fila ni ID
existente. La misma corrección ya fue aplicada al proyecto activo conectado.
`prisma migrate deploy` puede ejecutarla de nuevo sin cambiar datos; conserva
además el historial de Prisma en instalaciones que despliegan desde este repo.

El frontend serializa las operaciones del carrito, espera confirmación antes de
mostrar el alta y no borra el carrito para fingir una recuperación. Las altas por
cantidad se envían en una sola petición; el servidor bloquea por usuario/producto
y usa un upsert con incremento atómico. Los errores reales conservan los artículos
y se agrupan para no generar una notificación idéntica por cada clic.

## Mi cuenta, devoluciones y pago

- Contacto, Mis pedidos y PQR salen del header del cliente. Están en Mi cuenta,
  junto con Perfil, Retiros y la nueva página `/mis-devoluciones`.
- El perfil incluye accesos rápidos, avance de datos, estados de carga/error,
  descarte de cambios, validación del celular y bloqueo de guardados repetidos.
- Devoluciones permite elegir únicamente pedidos entregados del cliente,
  producto, cantidad y motivo, y consultar el historial. El servidor valida
  propietario y unidades restantes bajo bloqueo de pedido. Resolver una
  devolución sigue siendo exclusivo del superadministrador. No se hace un
  reembolso financiero automático.
- La pasarela sigue siendo **académica**: Tarjeta, PSE y Nequi son simulados.
  Mejora la revisión de entrega, accesibilidad de métodos, imágenes de productos,
  resumen y confirmación. No captura datos bancarios ni integra pagos reales.
- Aplicar cupón envía productos/cantidades al servidor, que consulta precios
  vigentes y devuelve subtotal, ahorro, envío y total. La compra usa la misma
  validación y el mismo redondeo de descuento. Una respuesta tardía no reemplaza
  un código que ya cambió; un cupón escrito sin aplicar no se omite silenciosamente.

**Diagnóstico de cupones configurados (sin modificar sus datos):**
`BIENVENIDO20` está activo con valor **10%** y mínimo **$20.000**;
`AHORRA5000` tiene mínimo **$400.002**; `VERANO15` está inactivo y vencido.
No se cambiaron mínimos, fechas, valores ni contadores para forzar un descuento.

## Protección PQR

- Bloqueo síncrono del formulario, incluso si se dispara submit dos veces antes
  de que React actualice el botón. Mientras envía, se conserva el estado visible.
- Un PQR nuevo por cliente cada **60 segundos**, con cuenta regresiva en la UI.
- Duplicados (mismo tipo, asunto y descripción, ignorando mayúsculas y espacios)
  se rechazan con **409** y mensaje para consultar el ya enviado, incluso después
  de un minuto. No se borraron duplicados históricos.
- El servidor usa una transacción con bloqueo advisory por cliente: protege
  pestañas simultáneas, varios procesos y reinicios. El límite devuelve **429**,
  `retryAfter` en JSON y cabecera `Retry-After`.
- Errores de conexión conservan el texto; no se anuncia éxito si el servidor falla.

Se añadieron pruebas DOM para carrito, cupón, doble submit, duplicado histórico,
navegación y devolución; pruebas HTTP/unitarias para PQR, propiedad de devoluciones
y cotización; y `be/tests/customer.integration.ts` para verificar concurrencia y
UUID con PostgreSQL real en CI. Esta última exige una base **local** `_test` y no
se ejecutó en Arena por no disponer de PostgreSQL local.
