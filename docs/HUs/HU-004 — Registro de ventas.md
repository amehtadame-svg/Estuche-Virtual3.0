# HU-004 — Registro de ventas

## Identificación
CampoValor**ID**HU-004**Título**Registro de ventas**Módulo**Ventas**Prioridad**Alta**Estado**Por Implementar**RF asociados**RF-004

---

## Historia
**Como** vendedor,
**quiero** registrar ventas,
**para** llevar el control diario de las operaciones y el stock comercializado.

---

## Criterios de Aceptación

### CA-004.1 — Interfaz del punto de venta (POS)

- **Dado que** estoy en la pantalla de terminal de caja (`/pos`),
- **cuando** agrego productos al carrito de venta,
- **entonces** se visualiza la lista de ítems, cantidades, precio unitario y el monto total calculado en tiempo real.

### CA-004.2 — Confirmación de la venta e impacto en stock

- **Dado que** he seleccionado uno o varios productos con disponibilidad suficiente,
- **cuando** procesar el pago y presionar "Finalizar Venta",
- **entonces** el sistema registra la venta en la base de datos, descuenta el stock de los productos vendidos y genera el ticket de venta.

### CA-004.3 — Alerta por falta de stock durante la venta

- **Dado que** intento agregar al carrito una cantidad superior al stock disponible de un producto,
- **cuando** modifico la cantidad en la venta,
- **entonces** el sistema notifica: "Stock insuficiente para el producto seleccionado".

---

## Endpoints
MétodoRutaDescripciónPOST`/api/v1/sales`Procesa la venta, genera orden y ajusta stock

---

## Notas técnicas

- Transacción ACID obligatoria: La creación del encabezado de venta (`sales`), el detalle (`sale_items`) y la reducción de stock (`products`) deben ejecutarse en un único bloque de transacción.
- En caso de falla en alguno de los artículos, se realiza `ROLLBACK` completo.
