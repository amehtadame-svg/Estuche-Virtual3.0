# RF-002 — Autenticación y Redirección según Rol

**Historia de usuario relacionada:** HU-002

## Descripción

El sistema debe permitir que los usuarios autenticados inicien sesión utilizando su correo electrónico y contraseña. Una vez validadas las credenciales, el sistema redirigirá al usuario al panel correspondiente según su rol (**Administrador, Proveedor o Cliente**).

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario accede al formulario de inicio de sesión. |
| 2 | El usuario ingresa su correo electrónico y contraseña. |
| 3 | El sistema valida que los campos obligatorios hayan sido diligenciados correctamente. |
| 4 | El sistema verifica que el usuario exista en la base de datos. |
| 5 | El sistema valida que la contraseña ingresada coincida con la almacenada. |
| 6 | El sistema verifica que la cuenta se encuentre activa y con el correo electrónico verificado. |
| 7 | Si la autenticación es exitosa, el sistema crea la sesión del usuario. |
| 8 | El sistema identifica el rol asociado al usuario. |
| 9 | El usuario es redirigido automáticamente al panel correspondiente a su rol. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo los usuarios registrados podrán iniciar sesión. |
| RN-002 | El correo electrónico debe encontrarse previamente verificado. |
| RN-003 | Si las credenciales son incorrectas, el sistema denegará el acceso. |
| RN-004 | Después de varios intentos fallidos consecutivos, la cuenta podrá bloquearse temporalmente. |
| RN-005 | Cada usuario será redirigido únicamente al panel correspondiente a su rol. |
| RN-006 | Los usuarios no podrán acceder a módulos restringidos para otros roles. |

---

## Inputs / Outputs

### Input (Formulario)

```json
{
  "correo": "string",
  "password": "string"
}
```

### Output éxito (HTTP 200)

```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "rol": "Cliente",
  "token": "jwt",
  "mensaje": "Inicio de sesión exitoso."
}
```

### Output error (HTTP 401)

```json
{
  "error": "Correo electrónico o contraseña incorrectos."
}
```

### Output error (HTTP 403)

```json
{
  "error": "La cuenta aún no ha sido verificada."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/auth/login` | No | Autentica al usuario y genera la sesión. |
| POST | `/api/auth/logout` | Sí | Finaliza la sesión del usuario. |
