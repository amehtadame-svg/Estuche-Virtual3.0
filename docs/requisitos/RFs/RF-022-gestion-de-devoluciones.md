<!--
  ¿Qué? Requisito funcional que describe el ciclo de vida de una solicitud de devolución.
  ¿Para qué? Definir las reglas de aprobación, rechazo y reembolso de productos devueltos.
  ¿Impacto? Soporta el proceso postventa y la confianza del cliente en la plataforma.
-->

# RF-022 — Gestión de Devoluciones

**Historia de usuario relacionada**: HU-039

## Descripción

El sistema debe permitir a los clientes solicitar la devolución de productos de pedidos entregados, y a los administradores revisar, aprobar o rechazar dichas solicitudes.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El cliente selecciona un producto de un pedido entregado y solicita la devolución con un motivo. |
| 2 | El sistema crea el registro en `devoluciones` con estado "solicitada". |
| 3 | El administrador revisa la solicitud y el estado del producto reportado. |
| 4 | El administrador aprueba o rechaza la solicitud. |
| 5 | Si se aprueba, el sistema calcula el `reembolso` y registra `fecha_resolucion`. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo se pueden solicitar devoluciones de pedidos en estado "Entregado". |
| RN-002 | La cantidad a devolver no puede superar la cantidad comprada. |
| RN-003 | Toda resolución debe quedar registrada con fecha y estado final. |

---

## Inputs / Outputs

### Input

```json
{
  "id_pedido": 120,
  "id_producto": 12,
  "cantidad": 1,
  "motivo": "Producto defectuoso"
}
```

### Output éxito (HTTP 201)

```json
{
  "estado": "solicitada",
  "mensaje": "Solicitud de devolución registrada."
}
```

### Output error (HTTP 400)

```json
{
  "error": "La cantidad a devolver supera la cantidad comprada."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/devoluciones` | Sí | Crea una solicitud de devolución. |
| PUT | `/api/admin/devoluciones/{id}` | Sí (Administrador) | Aprueba o rechaza una devolución. |
