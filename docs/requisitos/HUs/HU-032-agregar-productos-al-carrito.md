<!--
  ¿Qué? Historia de usuario que describe la adición de productos al carrito de compras del cliente.
  ¿Para qué? Formalizar la selección previa de artículos antes de confirmar una compra.
  ¿Impacto? Es el paso intermedio obligatorio entre navegar el catálogo y generar un pedido.
-->

# HU-032 — Agregar productos al carrito de compras

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-032 |
| **Título** | Agregar productos al carrito de compras |
| **Módulo** | Compras |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-007 |

---

## Historia

**Como** cliente registrado navegando el catálogo,
**quiero** agregar productos al carrito indicando la cantidad deseada, y poder modificar o quitar artículos ya agregados,
**para** reunir los artículos que deseo comprar antes de finalizar mi pedido.

---

## Criterios de Aceptación

### CA-032.1 — Agregar producto disponible al carrito
- **Dado que** consulto la ficha de un producto con stock disponible,
- **cuando** presiono "Agregar al carrito" indicando la cantidad,
- **entonces** el producto se agrega al carrito y el contador del ícono del carrito se actualiza.

### CA-032.2 — Validación de stock antes de agregar
- **Dado que** intento agregar una cantidad mayor a la disponible en `productos.stock`,
- **cuando** presiono "Agregar al carrito",
- **entonces** el sistema muestra el mensaje: "Stock insuficiente para este producto" y no agrega el ítem.

### CA-032.3 — Actualización de cantidad de un producto ya presente
- **Dado que** un producto ya está en mi carrito,
- **cuando** vuelvo a agregarlo desde el catálogo,
- **entonces** el sistema suma la cantidad al registro existente en `carrito` en lugar de duplicar la fila.

### CA-032.4 — Eliminar producto del carrito
- **Dado que** estoy visualizando el contenido del carrito (`/carrito`),
- **cuando** presiono el ícono de eliminar sobre un producto,
- **entonces** el ítem se remueve y el total del carrito se recalcula automáticamente.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/carrito` | Agrega un producto al carrito |
| GET | `/api/carrito` | Consulta el contenido del carrito del usuario autenticado |
| DELETE | `/api/carrito/{id}` | Elimina un producto del carrito |

---

## Notas técnicas

- Restricción `UNIQUE(id_usuario, id_producto)` en la tabla `carrito` evita filas duplicadas.
- El total se recalcula en el cliente y se revalida en el servidor antes del checkout.
