# HU-013 — Venta de combos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-013 |
| **Título** | Venta de combos |
| **Módulo** | Ventas |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-013 |

---

## Historia

**Como** vendedor del punto de venta (POS),  
**quiero** buscar, agregar y cobrar combos o paquetes escolares en la pantalla de caja de manera directa,  
**para** atender con rapidez las solicitudes de promociones en momentos de alta afluencia de clientes y asegurar que las existencias individuales de cada producto integrante del paquete se descuenten de forma automática del inventario.

---

## Criterios de Aceptación

### CA-013.1 — Selección e inclusión de combos en el carrito POS
- **Dado que** me encuentro procesando cobros en el terminal de venta (`/pos`),
- **cuando** selecciono un combo promocional registrado previamente,
- **entonces** el paquete se incorpora al carrito de compras con su precio especial predeterminado.

### CA-013.2 — Descuento diferido de stock de cada ítem del paquete
- **Dado que** un combo escolar vendido incluye 2 Cuadernos y 1 Lápiz en su composición,
- **cuando** se finaliza y cobra la venta de 1 combo,
- **entonces** el sistema descuenta automáticamente 2 unidades de Cuadernos y 1 unidad de Lápices del stock de la base de datos.

### CA-013.3 — Bloqueo de venta por falta de stock en algún componente
- **Dado que** uno de los productos integrantes de un paquete no posee existencias suficientes en la bodega,
- **cuando** intento agregar o cobrar el combo en el punto de venta,
- **entonces** el sistema bloquea la acción notificando: "No se puede vender el combo: El producto componente [Nombre del producto] no posee suficiente stock disponible".

### CA-013.4 — Desglose explicativo de ítems en el comprobante impreso
- **Dado que** se completa la venta de un paquete promocional,
- **cuando** el sistema genera e imprime el ticket de venta,
- **entonces** muestra el nombre del combo seguido del detalle de los artículos que lo componían para claridad del cliente.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/sales/combo` | Procesa la venta descontando los componentes del combo |

---

## Notas técnicas

- Se debe iterar sobre la lista de componentes dentro de la misma transacción de venta.
- Bloquear en base de datos todos los productos que forman parte del combo antes de restar sus existencias.
