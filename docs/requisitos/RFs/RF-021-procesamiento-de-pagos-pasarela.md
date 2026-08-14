<!--
  ¿Qué? Requisito funcional que describe la integración con la pasarela de pagos.
  ¿Para qué? Definir cómo se procesa, confirma o rechaza el pago de un pedido.
  ¿Impacto? Es el componente crítico que habilita las transacciones económicas de la plataforma.
-->

# RF-021 — Procesamiento de Pagos (Pasarela)

**Historia de usuario relacionada**: HU-033

## Descripción

El sistema debe enviar la solicitud de cobro a la pasarela de pagos configurada, registrar el resultado en `pagos` y actualizar el estado del pedido según la respuesta recibida.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El cliente confirma el pedido y selecciona un método de pago. |
| 2 | El sistema crea un registro en `pagos` con estado "pendiente". |
| 3 | Se envía la solicitud a la pasarela con el monto y el método seleccionado. |
| 4 | La pasarela responde de forma síncrona o mediante webhook. |
| 5 | Si el pago es aprobado, se actualiza `pagos.estado = 'aprobado'` y se dispara la generación de factura. |
| 6 | Si el pago es rechazado, se actualiza `pagos.estado = 'rechazado'` y el pedido permanece pendiente de pago. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | El `id_transaccion` devuelto por la pasarela debe ser único en el sistema. |
| RN-002 | El monto enviado a la pasarela debe coincidir exactamente con el total del pedido. |
| RN-003 | Un pedido no puede tener más de un pago aprobado. |

---

## Inputs / Outputs

### Input

```json
{
  "id_pedido": 120,
  "metodo_pago": "tarjeta",
  "monto": 95000
}
```

### Output éxito (HTTP 200)

```json
{
  "estado": "aprobado",
  "id_transaccion": "TRX-88213"
}
```

### Output error (HTTP 402)

```json
{
  "error": "El pago fue rechazado por la pasarela."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/pagos` | Sí | Procesa el pago de un pedido. |
| POST | `/api/pagos/webhook` | No | Recibe confirmaciones asíncronas de la pasarela. |
