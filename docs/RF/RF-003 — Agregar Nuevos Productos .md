# RF-003 — Agregar Nuevos Productos

**Historia de usuario relacionada:** HU-003

## Descripción

El sistema debe permitir que los proveedores registren nuevos productos en la plataforma. Todo producto agregado permanecerá en estado **Pendiente de aprobación** hasta que un administrador lo revise y autorice su publicación en el catálogo.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El proveedor inicia sesión en el sistema. |
| 2 | Accede al módulo de gestión de productos. |
| 3 | Selecciona la opción **Agregar producto**. |
| 4 | Diligencia la información requerida del producto. |
| 5 | El sistema valida que todos los campos obligatorios estén completos. |
| 6 | El sistema registra el producto con estado **Pendiente de aprobación**. |
| 7 | El administrador recibe una notificación indicando que existe un nuevo producto por revisar. |
| 8 | El administrador aprueba o rechaza el producto. |
| 9 | Si el producto es aprobado, se publica automáticamente en el catálogo. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo los proveedores autenticados podrán registrar productos. |
| RN-002 | El nombre del producto es obligatorio. |
| RN-003 | El precio debe ser mayor que cero. |
| RN-004 | La cantidad en inventario debe ser igual o superior a cero. |
| RN-005 | Todo producto debe pertenecer a una categoría. |
| RN-006 | Ningún producto será visible hasta ser aprobado por un administrador. |
| RN-007 | El administrador podrá aprobar o rechazar cualquier producto registrado. |

---

## Inputs / Outputs

### Input (Formulario)

```json
{
  "nombre": "string",
  "descripcion": "string",
  "precio": 0,
  "stock": 0,
  "categoria": "string",
  "imagen": "archivo"
}
```

### Output éxito (HTTP 201)

```json
{
  "id": 25,
  "estado": "Pendiente de aprobación",
  "mensaje": "Producto registrado correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "Información del producto incompleta."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/productos` | Sí | Registra un nuevo producto. |
| PUT | `/api/productos/{id}/aprobar` | Sí (Administrador) | Aprueba un producto pendiente. |

---

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
