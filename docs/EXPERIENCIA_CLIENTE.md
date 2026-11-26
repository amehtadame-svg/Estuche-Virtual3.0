# Experiencia del cliente y entrega — 26/11/2026

## Navegación
- El cliente inicia sesión en `/`. El panel de cliente fue eliminado; `/cliente`
  solo redirige a Inicio para no romper marcadores anteriores.
- **Mis pedidos** está en el menú principal y en la navegación de Mi cuenta
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
23 pruebas frontend y 114 backend aprobadas. ESLint sin errores (5 advertencias
preexistentes). No se ejecutaron migraciones ni pruebas de integración sobre una
base remota. El entorno no tenía conexión PostgreSQL configurada y bloqueaba el
host de descarga de motores Prisma: para compilar y probar con dobles se generó
el cliente local sin motor; esto no modifica las dependencias ni la configuración
de despliegue del proyecto. En la instalación real usar `prisma generate` normal.
