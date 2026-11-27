<!--
  ¿Qué? Requisito funcional que describe la administración del directorio de proveedores.
  ¿Para qué? Definir el flujo de alta y mantenimiento de las fichas de proveedores.
  ¿Impacto? Vincula cada producto y movimiento de inventario con su origen comercial.
-->

# RF-015 — Gestión de Proveedores

**Historia de usuario relacionada**: HU-015

## Descripción

El sistema debe permitir a los administradores registrar, consultar, editar y asociar categorías a los proveedores del negocio.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El administrador accede al módulo de proveedores. |
| 2 | Registra nombre, teléfono, correo y dirección del proveedor. |
| 3 | El sistema valida el formato del correo electrónico. |
| 4 | El proveedor queda disponible para asociarse a productos. |
| 5 | El administrador puede asociar una o más categorías al proveedor mediante `proveedor_categoria`. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | El correo electrónico del proveedor debe tener formato válido si se proporciona. |
| RN-002 | Un proveedor puede estar asociado a múltiples categorías. |
| RN-003 | No se elimina físicamente un proveedor con productos asociados. |

---

## Inputs / Outputs

### Input

```json
{
  "nombre": "Distribuidora Escolar S.A.S",
  "telefono": "3001234567",
  "email": "contacto@distribuidora.com",
  "direccion": "Cra 10 #20-30"
}
```

### Output éxito (HTTP 201)

```json
{
  "id_proveedor": 8,
  "mensaje": "Proveedor registrado correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "El correo electrónico no tiene un formato válido."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/proveedores` | Sí (Administrador) | Lista los proveedores registrados. |
| POST | `/api/proveedores` | Sí (Administrador) | Registra un nuevo proveedor. |
| PUT | `/api/proveedores/{id}` | Sí (Administrador) | Actualiza los datos de un proveedor. |
