# RF-004 — Editar Información de Productos

**Historia de usuario relacionada:** HU-004

## Descripción

El sistema debe permitir que los proveedores actualicen la información de los productos registrados y que los administradores puedan modificar cualquier producto cuando sea necesario.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario autorizado accede al módulo de productos. |
| 2 | Selecciona el producto que desea modificar. |
| 3 | El sistema muestra la información actual del producto. |
| 4 | El usuario realiza las modificaciones necesarias. |
| 5 | El sistema valida los datos ingresados. |
| 6 | Si la información es válida, se actualizan los datos del producto. |
| 7 | El sistema confirma la actualización realizada. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo el proveedor propietario o un administrador podrán editar el producto. |
| RN-002 | El nombre del producto no podrá quedar vacío. |
| RN-003 | El precio deberá ser mayor que cero. |
| RN-004 | La cantidad disponible no podrá ser negativa. |
| RN-005 | Toda modificación deberá quedar registrada en el historial del sistema. |

---

## Inputs / Outputs

### Input (Formulario)

```json
{
  "nombre": "string",
  "descripcion": "string",
  "precio": 0,
  "stock": 0,
  "categoria": "string"
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Producto actualizado correctamente."
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
| PUT | `/api/productos/{id}` | Sí | Actualiza la información de un producto existente. |
