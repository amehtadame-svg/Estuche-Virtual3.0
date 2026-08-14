<!--
  ¿Qué? Requisito funcional que describe el proceso de recuperación de contraseña olvidada.
  ¿Para qué? Definir el mecanismo seguro de restablecimiento de credenciales.
  ¿Impacto? Evita que un usuario quede bloqueado permanentemente por olvido de contraseña.
-->

# RF-028 — Recuperación de Contraseña

**Historia de usuario relacionada**: HU-019

## Descripción

El sistema debe permitir a un usuario solicitar el restablecimiento de su contraseña mediante un enlace enviado a su correo electrónico registrado.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario solicita recuperación indicando su correo electrónico. |
| 2 | El sistema verifica si el correo existe, sin revelar esta información en la respuesta. |
| 3 | Si existe, se genera un token de restablecimiento de un solo uso, válido por 1 hora. |
| 4 | El usuario recibe el enlace y define una nueva contraseña. |
| 5 | El sistema invalida el token utilizado y actualiza la contraseña cifrada. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | El token de restablecimiento expira en 1 hora. |
| RN-002 | El token es de un solo uso. |
| RN-003 | La respuesta de la solicitud es idéntica exista o no el correo (anti-enumeración). |

---

## Inputs / Outputs

### Input

```json
{
  "correo": "juan@email.com"
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Si el correo existe, recibirás instrucciones para continuar."
}
```

### Output error (HTTP 400)

```json
{
  "error": "El token de restablecimiento es inválido o ha expirado."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/auth/forgot-password` | No | Solicita el enlace de restablecimiento. |
| POST | `/api/auth/reset-password` | No | Establece una nueva contraseña usando el token. |
