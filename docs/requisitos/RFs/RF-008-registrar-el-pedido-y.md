<!--
  ¿Qué? Requisito funcional que describe el registro del pedido y la selección del método de pago.
  ¿Para qué? Definir el flujo de checkout que convierte un carrito en un pedido formal.
  ¿Impacto? Es el paso que concreta la venta y genera el ingreso del negocio.
-->

# RF-008 — Registrar el Pedido y Seleccionar el Método de Pago

**Historia de usuario relacionada**: HU-033

## Descripción

El sistema debe permitir que el cliente confirme su compra, registre el pedido, genere un número único de identificación y seleccione el método de pago disponible.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El cliente revisa el contenido del carrito. |
| 2 | Selecciona la opción **Finalizar compra**. |
| 3 | El sistema valida nuevamente el inventario disponible. |
| 4 | El cliente selecciona el método de pago. |
| 5 | El sistema genera un número único para el pedido. |
| 6 | El pedido queda registrado con estado **Pendiente**. |
| 7 | El sistema confirma la creación del pedido. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo podrán registrarse pedidos de usuarios autenticados. |
| RN-002 | El pedido deberá tener al menos un producto. |
| RN-003 | El inventario será descontado únicamente después de confirmar el pedido. |
| RN-004 | Cada pedido tendrá un número único de identificación. |
| RN-005 | El cliente deberá seleccionar un método de pago antes de finalizar la compra. |
| RN-006 | El sistema conservará el historial de todos los pedidos registrados. |

---

## Inputs / Outputs

### Input

```json
{
  "metodoPago": "Tarjeta",
  "direccionEntrega": "Calle 10 #25-30"
}
```

### Output éxito (HTTP 201)

```json
{
  "pedido": "PED-20260001",
  "estado": "Pendiente",
  "mensaje": "Pedido registrado correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "No existen productos en el carrito."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/pedidos` | Sí | Registra un nuevo pedido. |
| GET | `/api/pedidos/{id}` | Sí | Consulta el detalle de un pedido. |
