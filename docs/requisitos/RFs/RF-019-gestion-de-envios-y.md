<!--
  ¿Qué? Requisito funcional que describe la creación y actualización de estados de envío.
  ¿Para qué? Definir el flujo logístico posterior a la confirmación de un pedido.
  ¿Impacto? Habilita la visibilidad del proceso de entrega para clientes y repartidores.
-->

# RF-019 — Gestión de Envíos y Seguimiento de Pedido

**Historia de usuario relacionada**: HU-037

## Descripción

El sistema debe crear un envío cuando un pedido pasa a estado "En preparación" y permitir que el repartidor asignado actualice su estado hasta la entrega.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | Un pedido cambia a estado "En preparación". |
| 2 | El sistema crea un registro en `envios` con estado "en camino" y asigna un repartidor. |
| 3 | El cliente puede consultar el estado del envío desde el detalle de su pedido. |
| 4 | El repartidor actualiza el estado del envío conforme avanza la entrega. |
| 5 | Al marcar "Entregado", el sistema registra `fecha_entregado` y actualiza el pedido asociado. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Todo envío debe estar asociado a un único pedido. |
| RN-002 | Solo el repartidor asignado puede actualizar el estado de su envío. |
| RN-003 | El estado "Entregado" es un estado final. |

---

## Inputs / Outputs

### Input

```json
{
  "estado": "entregado"
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Estado del envío actualizado correctamente."
}
```

### Output error (HTTP 403)

```json
{
  "error": "No tiene permisos para actualizar este envío."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/envios/{idPedido}` | Sí | Consulta el envío asociado a un pedido. |
| PUT | `/api/envios/{id}` | Sí (Repartidor) | Actualiza el estado de un envío. |
