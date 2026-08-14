<!--
  ¿Qué? Requisito funcional que describe la activación de cuenta mediante verificación de correo.
  ¿Para qué? Definir el mecanismo que confirma la propiedad del correo registrado.
  ¿Impacto? Reduce cuentas falsas y asegura un canal de contacto válido con cada usuario.
-->

# RF-029 — Verificación de Correo Electrónico

**Historia de usuario relacionada**: HU-031

## Descripción

El sistema debe impedir el inicio de sesión hasta que el usuario confirme su correo electrónico mediante un enlace de verificación enviado al registrarse.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario se registra y el sistema genera un token de verificación. |
| 2 | El token se envía por correo con un enlace de activación válido por 24 horas. |
| 3 | El usuario hace clic en el enlace. |
| 4 | El sistema valida el token y activa la cuenta. |
| 5 | El usuario ya puede iniciar sesión normalmente. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | El token de verificación expira en 24 horas. |
| RN-002 | Un usuario no verificado no puede iniciar sesión. |
| RN-003 | El token es de un solo uso. |

---

## Inputs / Outputs

### Input

```json
{
  "token": "a1b2c3d4-uuid"
}
```

### Output éxito (HTTP 200)

```json
{
  "mensaje": "Cuenta verificada correctamente."
}
```

### Output error (HTTP 410)

```json
{
  "error": "El enlace de verificación ha expirado."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/auth/verify-email` | No | Activa la cuenta mediante el token del correo. |
| POST | `/api/auth/resend-verification` | No | Reenvía el correo de verificación. |
