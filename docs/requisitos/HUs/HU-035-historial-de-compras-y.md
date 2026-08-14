<!--
  ¿Qué? Historia de usuario que describe el panel del cliente con sus compras pasadas y productos guardados.
  ¿Para qué? Formalizar el acceso del cliente a su historial de actividad comercial en la plataforma.
  ¿Impacto? Mejora la experiencia de recompra y la fidelización del cliente.
-->

# HU-035 — Historial de compras y lista de deseos (panel del cliente)

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-035 |
| **Título** | Historial de compras y lista de deseos (panel del cliente) |
| **Módulo** | Cuenta del cliente |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-011, RF-025 |

---

## Historia

**Como** cliente autenticado,
**quiero** consultar el historial completo de mis compras anteriores y gestionar una lista de productos que deseo comprar más adelante,
**para** hacer seguimiento a mis pedidos pasados y no perder de vista los productos que me interesan.

---

## Criterios de Aceptación

### CA-035.1 — Listado del historial de compras
- **Dado que** accedo a "Mis compras" (`/cuenta/historial`),
- **cuando** la sección termina de cargar,
- **entonces** veo cada pedido con su número, fecha, estado y total.

### CA-035.2 — Detalle de un pedido pasado
- **Dado que** selecciono un pedido de mi historial,
- **cuando** el sistema consulta el detalle,
- **entonces** veo los productos comprados, cantidades, precios y el estado del envío.

### CA-035.3 — Agregar producto a la lista de deseos
- **Dado que** estoy viendo la ficha de un producto,
- **cuando** presiono el ícono de "Guardar para después",
- **entonces** el producto se agrega a mi lista de deseos sin afectar el carrito.

### CA-035.4 — Mover producto de la lista de deseos al carrito
- **Dado que** tengo un producto en mi lista de deseos con stock disponible,
- **cuando** presiono "Agregar al carrito" desde la lista de deseos,
- **entonces** el producto se agrega al carrito y permanece también en la lista de deseos.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/historial` | Consulta el historial de compras del usuario autenticado |
| GET | `/api/lista-deseos` | Consulta la lista de deseos del usuario |
| POST | `/api/lista-deseos` | Agrega un producto a la lista de deseos |
| DELETE | `/api/lista-deseos/{id}` | Elimina un producto de la lista de deseos |

---

## Notas técnicas

- Restricción `UNIQUE(id_usuario, id_producto)` en `lista_deseos` evita duplicados.
- El historial solo expone pedidos donde `id_cliente` coincide con el usuario autenticado.
