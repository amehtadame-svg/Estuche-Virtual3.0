<!--
  ¿Qué? Requisito funcional que describe la adición de productos al carrito de compras.
  ¿Para qué? Definir cómo se valida el stock antes de reservar un producto en el carrito.
  ¿Impacto? Evita que el cliente arme un pedido con productos sin disponibilidad real.
-->

# RF-007 — Agregar Productos al Carrito de Compras

**Historia de usuario relacionada**: HU-032

## Descripción

El sistema debe permitir que los clientes agreguen productos al carrito de compras, verificando previamente la disponibilidad del inventario para evitar pedidos con cantidades superiores al stock existente.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El cliente inicia sesión en la plataforma. |
| 2 | Consulta el catálogo de productos. |
| 3 | Selecciona un producto. |
| 4 | Indica la cantidad que desea comprar. |
| 5 | El sistema verifica la disponibilidad del inventario. |
| 6 | Si existe stock suficiente, el producto es agregado al carrito. |
| 7 | El sistema actualiza el total del carrito de compras. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo los clientes autenticados podrán agregar productos al carrito. |
| RN-002 | La cantidad solicitada no podrá superar el stock disponible. |
| RN-003 | Si el producto ya existe en el carrito, el sistema actualizará la cantidad. |
| RN-004 | El carrito conservará los productos mientras la sesión permanezca activa. |
| RN-005 | El sistema recalculará automáticamente el valor total del carrito después de cada modificación. |

---

## Inputs / Outputs

### Input

```json
{
  "productoId": 15,
  "cantidad": 2
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Producto agregado al carrito correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "La cantidad solicitada supera el inventario disponible."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/carrito` | Sí | Agrega un producto al carrito de compras. |
| GET | `/api/carrito` | Sí | Consulta los productos agregados al carrito. |
| DELETE | `/api/carrito/{id}` | Sí | Elimina un producto del carrito. |
