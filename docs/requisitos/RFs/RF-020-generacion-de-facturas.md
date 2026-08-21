<!--
  ¿Qué? Requisito funcional que describe la generación automática del recibo de un pedido.
  ¿Para qué? Definir cómo y cuándo se emite el comprobante formal de una compra.
  ¿Impacto? Es el documento legal y contable que respalda cada venta realizada.
-->

# RF-020 — Generación de Recibos

**Historia de usuario relacionada**: HU-033

## Descripción

El sistema debe generar automáticamente un recibo cuando el pago de un pedido es confirmado, consolidando el detalle de productos, cantidades y totales.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | Un pago es confirmado por la pasarela para un pedido determinado. |
| 2 | El sistema crea el registro en `receipts` asociado al pedido y al cliente. |
| 3 | Se generan los `receipt_items` a partir de los `order_details`. |
| 4 | El estado del recibo se establece como "pagado". |
| 5 | El cliente puede consultar o descargar su recibo. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Cada pedido genera exactamente un recibo (`UNIQUE(order_id)`). |
| RN-002 | El total del recibo debe coincidir con la suma de sus detalles. |
| RN-003 | Un recibo no puede generarse sin un pago confirmado. |

---

## Inputs / Outputs

### Input

```json
No aplica (proceso automático disparado por confirmación de pago).
```

### Output éxito (HTTP 201)

```json
{
  "id": "01912345-6789-7000-8000-000000000000",
  "paymentStatus": "paid",
  "total": 95000
}
```

### Output error (HTTP 409)

```json
{
  "error": "Ya existe un recibo para este pedido."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/receipts` | Sí (admin) | Lista los recibos emitidos. |
| GET | `/api/orders/{id}` | Sí | Consulta del pedido, que incluye el recibo asociado. |
