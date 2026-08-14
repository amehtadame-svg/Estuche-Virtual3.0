<!--
  ¿Qué? Requisito funcional que describe el control de entradas, salidas y ajustes de inventario.
  ¿Para qué? Definir cómo se actualiza el stock de forma atómica y trazable.
  ¿Impacto? Es la base de la exactitud entre el inventario real y el registrado en el sistema.
-->

# RF-016 — Gestión de Inventario y Movimientos de Stock

**Historia de usuario relacionada**: HU-002

## Descripción

El sistema debe registrar cada entrada, salida o pérdida de mercancía como un movimiento en `movimientos_inventario`, actualizando el `stock` del producto de forma atómica.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario autorizado selecciona un producto y el tipo de movimiento (entrada, salida, pérdida). |
| 2 | Indica la cantidad y, si aplica, el motivo del movimiento. |
| 3 | El sistema valida que la cantidad sea mayor a cero. |
| 4 | Para salidas o pérdidas, el sistema valida que el stock actual sea suficiente. |
| 5 | El sistema actualiza `productos.stock` de forma atómica. |
| 6 | Se inserta el registro en `movimientos_inventario` con fecha, tipo, cantidad y usuario responsable. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | La cantidad del movimiento debe ser un número entero mayor a cero. |
| RN-002 | No se permite que el stock resultante sea negativo. |
| RN-003 | Todo movimiento debe registrar el usuario que lo ejecuta. |
| RN-004 | Los tipos de movimiento válidos son: entrada, salida, pérdida. |

---

## Inputs / Outputs

### Input

```json
{
  "id_producto": 12,
  "tipo": "entrada",
  "cantidad": 25,
  "motivo": "Reposición de stock"
}
```

### Output éxito (HTTP 201)

```json
{
  "stock_actual": 40,
  "mensaje": "Movimiento registrado correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "Stock insuficiente para procesar la salida solicitada."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/inventario/movimientos` | Sí | Registra un movimiento de inventario. |
| GET | `/api/inventario/movimientos` | Sí | Consulta el historial de movimientos. |
| GET | `/api/inventario/bajo-stock` | Sí | Lista productos con stock igual o menor a `stock_minimo`. |
