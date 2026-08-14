<!--
  ¿Qué? Requisito funcional que describe el canal de soporte y contacto con el usuario.
  ¿Para qué? Definir cómo se capturan y gestionan las solicitudes de los usuarios.
  ¿Impacto? Es el canal formal de atención al cliente de la plataforma.
-->

# RF-010 — Soporte y Contacto

**Historia de usuario relacionada**: HU-040

## Descripción

El sistema debe permitir que los usuarios envíen consultas, solicitudes, sugerencias o reportes mediante un formulario de contacto. Cada mensaje será almacenado y notificado al administrador para su posterior gestión.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario accede a la sección de contacto. |
| 2 | Diligencia el formulario con la información solicitada. |
| 3 | El sistema valida que todos los campos obligatorios estén completos. |
| 4 | El sistema registra la solicitud en la base de datos. |
| 5 | El administrador recibe una notificación del nuevo mensaje. |
| 6 | El sistema informa al usuario que su solicitud fue enviada correctamente. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | El nombre del usuario será obligatorio. |
| RN-002 | El correo electrónico deberá tener un formato válido. |
| RN-003 | El asunto del mensaje será obligatorio. |
| RN-004 | El mensaje deberá contener al menos 10 caracteres. |
| RN-005 | Todos los mensajes quedarán registrados para su seguimiento. |
| RN-006 | El administrador podrá consultar el historial de mensajes recibidos. |

---

## Inputs / Outputs

### Input

```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@email.com",
  "asunto": "Consulta sobre un pedido",
  "mensaje": "Deseo conocer el estado de mi compra."
}
```

### Output éxito (HTTP 201)

```json
{
  "mensaje": "La solicitud fue enviada correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "Información incompleta o inválida."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/contacto` | No | Envía una solicitud mediante el formulario de contacto. |
| GET | `/api/contacto` | Sí (Administrador) | Consulta las solicitudes registradas. |
