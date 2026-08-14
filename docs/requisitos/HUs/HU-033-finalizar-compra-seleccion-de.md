<!--
  ¿Qué? Historia de usuario que describe el proceso de checkout: confirmación del pedido, pago y generación de la factura.
  ¿Para qué? Formalizar la conversión del carrito de compras en un pedido pagado y facturado.
  ¿Impacto? Es el momento en que se concreta la venta y se descuenta el inventario real.
-->

# HU-033 — Finalizar compra, selección de pago y facturación

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-033 |
| **Título** | Finalizar compra, selección de pago y facturación |
| **Módulo** | Pedidos |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-008, RF-020, RF-021 |

---

## Historia

**Como** cliente con productos válidos en mi carrito,
**quiero** confirmar mi pedido, seleccionar una dirección de entrega y un método de pago, y recibir mi factura,
**para** completar mi compra de forma segura y contar con un comprobante de la transacción.

---

## Criterios de Aceptación

### CA-033.1 — Resumen de checkout
- **Dado que** presiono "Finalizar compra" desde el carrito,
- **cuando** el sistema revalida el stock de cada producto,
- **entonces** se muestra el resumen del pedido con subtotal, descuentos aplicables y total a pagar.

### CA-033.2 — Selección de dirección y método de pago
- **Dado que** estoy en la pantalla de checkout,
- **cuando** elijo una dirección de entrega registrada y un método de pago (tarjeta, PSE, contraentrega),
- **entonces** el botón "Confirmar pedido" se habilita.

### CA-033.3 — Creación atómica del pedido
- **Dado que** confirmo el pedido con stock disponible para todos los productos,
- **cuando** el sistema procesa la solicitud,
- **entonces** se crea el registro en `pedidos` con estado "pendiente", su `detalle_pedido` y se descuenta el stock de cada producto en una única transacción.

### CA-033.4 — Generación de factura
- **Dado que** el pago fue confirmado por la pasarela,
- **cuando** el sistema recibe la confirmación,
- **entonces** se genera automáticamente el registro en `facturas` y `detalle_factura` asociado al pedido, con `estado_pago = 'pagado'`.

### CA-033.5 — Pago rechazado
- **Dado que** la pasarela de pago rechaza la transacción,
- **cuando** el sistema recibe la respuesta negativa,
- **entonces** el pedido permanece en estado "pendiente de pago" y se informa al cliente que puede reintentar.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/pedidos` | Crea el pedido a partir del carrito |
| POST | `/api/pagos` | Procesa el pago del pedido |
| GET | `/api/facturas/{id}` | Consulta la factura generada |

---

## Notas técnicas

- Transacción ACID obligatoria entre `pedidos`, `detalle_pedido` y el descuento en `productos.stock`.
- `pagos.id_transaccion` almacena el identificador único devuelto por la pasarela.
