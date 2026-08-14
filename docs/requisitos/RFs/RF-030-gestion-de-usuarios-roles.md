<!--
  ¿Qué? Requisito funcional que describe la administración de cuentas internas y sus roles.
  ¿Para qué? Definir cómo el administrador controla el acceso de cada usuario al sistema.
  ¿Impacto? Protege la información sensible mediante control de acceso basado en roles.
-->

# RF-030 — Gestión de Usuarios, Roles y Permisos

**Historia de usuario relacionada**: HU-018

## Descripción

El sistema debe permitir a un administrador consultar todos los usuarios registrados, cambiar su rol (cliente, proveedor, repartidor, administrador) y activar o desactivar su acceso.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El administrador accede al módulo de usuarios. |
| 2 | Consulta el listado completo con filtros por rol o estado. |
| 3 | Selecciona un usuario y modifica su rol si es necesario. |
| 4 | El sistema valida que solo un administrador pueda asignar el rol "administrador". |
| 5 | El cambio queda registrado para fines de auditoría. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo un administrador puede asignar el rol "administrador" a otro usuario. |
| RN-002 | Un usuario no puede desactivar su propia cuenta de administrador. |
| RN-003 | Todo cambio de rol queda registrado en el historial de auditoría. |

---

## Inputs / Outputs

### Input

```json
{
  "rol": "repartidor"
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Rol de usuario actualizado correctamente."
}
```

### Output error (HTTP 403)

```json
{
  "error": "No tiene permisos para asignar el rol solicitado."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/admin/usuarios` | Sí (Administrador) | Lista todos los usuarios registrados. |
| PUT | `/api/admin/usuarios/{id}/rol` | Sí (Administrador) | Actualiza el rol de un usuario. |
