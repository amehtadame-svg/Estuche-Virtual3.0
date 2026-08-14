<!--
  ¿Qué? Requisito funcional que describe la eliminación lógica (inactivación) de productos.
  ¿Para qué? Definir cómo se retiran productos del catálogo sin perder el historial de pedidos.
  ¿Impacto? Evita romper la integridad referencial de pedidos y facturas históricas.
-->

# RF-005 — Eliminar o Inactivar Productos

**Historia de usuario relacionada**: HU-022

## Descripción

El sistema debe permitir que los administradores y los proveedores inactiven productos del catálogo cuando ya no estén disponibles. La información permanecerá almacenada para mantener la integridad del historial de pedidos.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario autorizado accede al módulo de productos. |
| 2 | Selecciona el producto que desea eliminar o inactivar. |
| 3 | El sistema solicita la confirmación de la operación. |
| 4 | El usuario confirma la acción. |
| 5 | El sistema cambia el estado del producto a **Inactivo**. |
| 6 | El producto deja de mostrarse en el catálogo público. |
| 7 | El sistema registra la acción en el historial de auditoría. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo el proveedor propietario o un administrador podrán inactivar un producto. |
| RN-002 | Los productos asociados a pedidos anteriores no serán eliminados físicamente de la base de datos. |
| RN-003 | El sistema utilizará eliminación lógica (estado inactivo). |
| RN-004 | Los productos inactivos no aparecerán en el catálogo público. |
| RN-005 | Toda inactivación deberá quedar registrada para efectos de auditoría. |

---

## Inputs / Outputs

### Input

```json
{
  "estado": "Inactivo"
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Producto inactivado correctamente."
}
```

### Output error (HTTP 404)

```json
{
  "error": "Producto no encontrado."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| PATCH | `/api/productos/{id}/inactivar` | Sí | Inactiva un producto del catálogo sin eliminarlo físicamente. |
| DELETE | `/api/productos/{id}` | Sí (Administrador) | Elimina un producto cuando sea permitido por las reglas del negocio. |
