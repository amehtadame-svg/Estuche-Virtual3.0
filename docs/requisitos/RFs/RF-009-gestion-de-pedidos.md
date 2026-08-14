<!--
  ¿Qué? Requisito funcional que describe la gestión y actualización de estado de los pedidos.
  ¿Para qué? Definir los estados válidos de un pedido y quién puede modificarlos.
  ¿Impacto? Permite coordinar la logística de despacho y mantener informado al cliente.
-->

# RF-009 — Gestión de Pedidos

**Historia de usuario relacionada**: HU-034

## Descripción

El sistema debe permitir que el administrador consulte, gestione y actualice el estado de los pedidos realizados por los clientes, facilitando el seguimiento de cada compra.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El administrador inicia sesión. |
| 2 | Accede al módulo de gestión de pedidos. |
| 3 | El sistema muestra el listado completo de pedidos registrados. |
| 4 | El administrador selecciona un pedido. |
| 5 | Visualiza la información detallada del pedido. |
| 6 | Actualiza el estado del pedido cuando sea necesario. |
| 7 | El sistema registra el cambio y actualiza la información mostrada al cliente. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo los administradores podrán modificar el estado de un pedido. |
| RN-002 | Los estados permitidos serán: Pendiente, En preparación, Enviado, Entregado y Cancelado. |
| RN-003 | Todo cambio de estado deberá registrarse en el historial del pedido. |
| RN-004 | El cliente podrá consultar el estado actualizado de su pedido. |
| RN-005 | El sistema permitirá filtrar pedidos por fecha, cliente o estado. |

---

## Inputs / Outputs

### Input

```json
{
  "estado": "Enviado"
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Estado del pedido actualizado correctamente."
}
```

### Output error (HTTP 404)

```json
{
  "error": "Pedido no encontrado."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/pedidos` | Sí (Administrador) | Consulta todos los pedidos registrados. |
| PUT | `/api/pedidos/{id}` | Sí (Administrador) | Actualiza el estado de un pedido. |
| GET | `/api/pedidos/filtro` | Sí (Administrador) | Filtra pedidos por estado, cliente o fecha. |
