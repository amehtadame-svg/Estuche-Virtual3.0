# RF-011 — Historial de Compras

**Historia de usuario relacionada:** HU-011

## Descripción

El sistema debe permitir que los clientes autenticados consulten el historial de todas las compras realizadas, incluyendo el detalle de los productos adquiridos, el estado del pedido y la fecha de la compra.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El cliente inicia sesión. |
| 2 | Accede a la sección **Historial de Compras**. |
| 3 | El sistema consulta los pedidos asociados al usuario. |
| 4 | Se presenta el listado de compras realizadas. |
| 5 | El cliente puede seleccionar un pedido para visualizar su detalle completo. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Cada usuario únicamente podrá consultar sus propias compras. |
| RN-002 | El historial incluirá únicamente pedidos registrados. |
| RN-003 | El sistema mostrará la fecha, el estado, el total y los productos asociados a cada compra. |
| RN-004 | El historial permanecerá disponible mientras la cuenta del usuario exista. |
| RN-005 | El administrador podrá consultar el historial de cualquier usuario cuando sea necesario. |

---

## Inputs / Outputs

### Input

No aplica.

### Output éxito (HTTP 200)

```json
[
  {
    "pedido": "PED-20260001",
    "fecha": "2026-07-30",
    "estado": "Entregado",
    "total": 95000
  }
]
```

### Output error (HTTP 404)

```json
{
  "mensaje": "No existen compras registradas."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/historial` | Sí | Consulta el historial de compras del usuario autenticado. |
| GET | `/api/historial/{id}` | Sí | Consulta el detalle de una compra específica. |
