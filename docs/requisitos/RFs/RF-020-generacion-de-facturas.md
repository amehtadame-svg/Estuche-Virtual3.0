<!--
  ¿Qué? Requisito funcional que describe la generación automática de la factura de un pedido.
  ¿Para qué? Definir cómo y cuándo se emite el comprobante formal de una compra.
  ¿Impacto? Es el documento legal y contable que respalda cada venta realizada.
-->

# RF-020 — Generación de Facturas

**Historia de usuario relacionada**: HU-033

## Descripción

El sistema debe generar automáticamente una factura cuando el pago de un pedido es confirmado, consolidando el detalle de productos, cantidades y totales.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | Un pago es confirmado por la pasarela para un pedido determinado. |
| 2 | El sistema crea el registro en `facturas` asociado al pedido y al cliente. |
| 3 | Se genera el `detalle_factura` a partir del `detalle_pedido`. |
| 4 | El estado de la factura se establece como "pagado". |
| 5 | El cliente puede consultar o descargar su factura. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Cada pedido genera exactamente una factura (`UNIQUE(id_pedido)`). |
| RN-002 | El total de la factura debe coincidir con la suma de sus detalles. |
| RN-003 | Una factura no puede generarse sin un pago confirmado. |

---

## Inputs / Outputs

### Input

```json
No aplica (proceso automático disparado por confirmación de pago).
```

### Output éxito (HTTP 201)

```json
{
  "id_factura": 55,
  "estado_pago": "pagado",
  "total": 95000
}
```

### Output error (HTTP 409)

```json
{
  "error": "Ya existe una factura para este pedido."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/facturas/{id}` | Sí | Consulta el detalle de una factura. |
| GET | `/api/facturas/pedido/{idPedido}` | Sí | Consulta la factura asociada a un pedido. |
