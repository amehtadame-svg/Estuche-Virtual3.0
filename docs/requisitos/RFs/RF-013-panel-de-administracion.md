<!--
  ¿Qué? Requisito funcional que describe el panel exclusivo de administración de la plataforma.
  ¿Para qué? Definir el alcance de las funciones administrativas centralizadas.
  ¿Impacto? Concentra el control operativo de usuarios, productos, pedidos y promociones.
-->

# RF-013 — Panel de Administración

**Historia de usuario relacionada**: HU-018

## Descripción

El sistema debe proporcionar un panel exclusivo para administradores, desde el cual se podrá gestionar usuarios, productos, pedidos, promociones y consultar reportes del funcionamiento general de la plataforma. El acceso estará protegido mediante autenticación y una clave de seguridad adicional.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El administrador inicia sesión en la plataforma. |
| 2 | El sistema valida sus credenciales y permisos. |
| 3 | Se solicita la clave de seguridad para acceder al panel administrativo. |
| 4 | El sistema verifica la clave ingresada. |
| 5 | Si la validación es correcta, se concede el acceso al panel de administración. |
| 6 | El administrador podrá gestionar usuarios, productos, pedidos y promociones. |
| 7 | El sistema permitirá consultar indicadores y reportes del funcionamiento de la plataforma. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | El acceso al panel estará restringido exclusivamente a administradores. |
| RN-002 | Será obligatorio validar una clave de seguridad adicional para ingresar al panel. |
| RN-003 | El administrador podrá gestionar usuarios, productos, pedidos y promociones. |
| RN-004 | El sistema registrará todas las acciones administrativas para fines de auditoría. |
| RN-005 | Los reportes deberán mostrar información actualizada del sistema. |
| RN-006 | Los administradores no podrán eliminar registros que afecten la integridad histórica de la información. |

---

## Inputs / Outputs

### Input

```json
{
  "claveSeguridad": "********"
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Acceso autorizado al panel administrativo."
}
```

### Output error (HTTP 403)

```json
{
  "error": "Clave de seguridad incorrecta."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/admin/login` | Sí (Administrador) | Valida la clave de seguridad para acceder al panel administrativo. |
| GET | `/api/admin/dashboard` | Sí (Administrador) | Consulta la información general del panel de administración. |
| GET | `/api/admin/reportes` | Sí (Administrador) | Genera reportes administrativos del sistema. |
