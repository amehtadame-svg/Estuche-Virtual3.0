# HU-004 — Registro de ventas

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-004 |
| **Título** | Registro de ventas |
| **Módulo** | Ventas |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-004 |

---

## Historia

**Como** vendedor o cajero operativo del punto de venta (POS), encargado de la atención comercial directa en mostrador, agilidad en el cobro, gestión de formas de pago, cuadre de caja y emisión de comprobantes fiscales/comerciales,  
**quiero** disponer de una interfaz de terminal de ventas (POS) interactiva, intuitiva y de alta velocidad que me permita buscar o escanear productos mediante lectura óptica de códigos de barras, agregarlos a un carrito dinámico, ajustar cantidades, visualizar subtotales, calcular impuestos y descuentos aplicables, seleccionar diversos medios de pago (efectivo, tarjeta de débito/crédito, transferencia) e ingresar el monto recibido del cliente,  
**para** procesar los cobros de forma ágil y sin demoras en filas de caja, garantizar un cálculo transparente e higiénico del total acumulado y del cambio a entregar, registrar oficialmente las transacciones de ingresos en la jornada, descontar automáticamente y de forma atómica las mercancías comercializadas del inventario general y emitir el ticket o factura correspondiente para el cliente.

---

## Criterios de Aceptación

### CA-004.1 — Gestión dinámica del carrito de venta en el POS
- **Dado que** me encuentro en la interfaz del punto de venta POS (`/pos`),
- **cuando** escaneo el código de barras o busco y selecciono varios artículos para agregarlos al carrito de compra,
- **entonces** el sistema debe actualizar en tiempo real el listado de ítems, mostrando el nombre, precio unitario, cantidad solicitada, IVA/impuestos calculados y el gran total acumulado a pagar.

### CA-004.2 — Validación instantánea de stock antes de agregar al carrito
- **Dado que** intento agregar un producto o incrementar la cantidad de un ítem ya presente en el carrito,
- **cuando** la cantidad total requerida supera la cantidad disponible en el inventario real de la base de datos,
- **entonces** el sistema debe bloquear el incremento y mostrar un mensaje emergente: "Stock insuficiente: No es posible agregar más unidades del producto [Nombre del producto]".

### CA-004.3 — Procesamiento atómico de la venta y descuento de existencias
- **Dado que** el carrito contiene artículos válidos con stock suficiente y se selecciona un método de pago,
- **cuando** presiono el botón "Completar Venta",
- **entonces** el sistema debe ejecutar una transacción atómica que registre la venta (`sales`), cree el detalle de productos (`sale_items`), reste automáticamente las cantidades del inventario (`products`) y marque la orden como finalizada.

### CA-004.4 — Emisión de comprobante de venta e impresión automática
- **Dado que** la transacción de venta ha finalizado correctamente en el servidor,
- **cuando** el sistema confirma la persistencia de los datos,
- **entonces** se genera de forma inmediata la vista previa del comprobante/ticket de venta con el desglose de productos e inicia automáticamente la orden de impresión para su entrega al cliente.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/sales` | Registra la venta y actualiza inventario |

---

## Notas técnicas

- Transacción ACID obligatoria: La creación del encabezado de venta (`sales`), el detalle (`sale_items`) y la reducción de stock (`products`) deben ejecutarse en un único bloque de transacción.
- En caso de falla en alguno de los artículos, se realiza `ROLLBACK` completo.
