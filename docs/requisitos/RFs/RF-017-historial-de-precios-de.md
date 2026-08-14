<!--
  ¿Qué? Requisito funcional que describe el registro del historial de cambios de precio.
  ¿Para qué? Definir cómo se audita cada variación de precio de un producto.
  ¿Impacto? Permite analizar tendencias comerciales y auditar cambios de precio.
-->

# RF-017 — Historial de Precios de Productos

**Historia de usuario relacionada**: HU-029

## Descripción

El sistema debe registrar automáticamente cada modificación al precio de un producto en la tabla `historial_precios`, conservando el precio anterior y el nuevo.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | Un administrador o proveedor actualiza el precio de un producto. |
| 2 | El sistema compara el precio nuevo con el precio actualmente almacenado. |
| 3 | Si el valor cambió, se inserta un registro en `historial_precios` con el precio anterior y el nuevo. |
| 4 | El precio del producto se actualiza en `productos.precio`. |
| 5 | El historial queda disponible para consulta cronológica. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo se registra un historial si el precio realmente cambia. |
| RN-002 | El precio nuevo debe ser mayor a cero. |
| RN-003 | El historial conserva el usuario que ejecutó el cambio. |

---

## Inputs / Outputs

### Input

```json
{
  "precio_nuevo": 15900
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Precio actualizado y registrado en el historial."
}
```

### Output error (HTTP 400)

```json
{
  "error": "El precio debe ser mayor a cero."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| PATCH | `/api/productos/{id}/precio` | Sí | Actualiza el precio de un producto y registra el historial. |
| GET | `/api/productos/{id}/historial-precios` | Sí | Consulta el historial de precios del producto. |
