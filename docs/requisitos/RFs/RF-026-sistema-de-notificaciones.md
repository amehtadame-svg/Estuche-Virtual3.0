<!--
  ¿Qué? Requisito funcional que describe la generación y consulta de notificaciones del usuario.
  ¿Para qué? Definir los eventos del sistema que generan una notificación visible.
  ¿Impacto? Mantiene al usuario informado sin depender exclusivamente del correo electrónico.
-->

# RF-026 — Sistema de Notificaciones

**Historia de usuario relacionada**: HU-040

## Descripción

El sistema debe generar notificaciones internas ante eventos relevantes (cambio de estado de pedido, respuesta de soporte, nuevas promociones) y permitir marcarlas como leídas.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | Ocurre un evento relevante para el usuario (cambio de estado, respuesta de soporte, promoción). |
| 2 | El sistema genera un registro en `notificaciones` con título, mensaje y tipo. |
| 3 | El usuario visualiza el contador de notificaciones no leídas. |
| 4 | Al abrir una notificación, el sistema la marca como leída. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Toda notificación pertenece a un único usuario. |
| RN-002 | Una notificación inicia siempre con `leida = false`. |
| RN-003 | El tipo de notificación debe pertenecer a un catálogo predefinido (pedido, soporte, promoción). |

---

## Inputs / Outputs

### Input

```json
No aplica (generado internamente por eventos del sistema).
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Notificación marcada como leída."
}
```

### Output error (HTTP 404)

```json
{
  "error": "Notificación no encontrada."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/notificaciones` | Sí | Lista las notificaciones del usuario autenticado. |
| PATCH | `/api/notificaciones/{id}` | Sí | Marca una notificación como leída. |
