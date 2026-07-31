# HU-019 — Inicio de sesión

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-019 |
| **Título** | Inicio de sesión |
| **Módulo** | Autenticación |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-019 |

---

## Historia
**Como** vendedor,
**quiero** iniciar sesión,
**para** acceder al sistema y registrar mis ventas diarias.

---

## Criterios de Aceptación

### CA-019.1 — Autenticación exitosa

- **Dado que** estoy en la página de inicio de sesión (`/login`),
- **cuando** ingreso mi usuario/correo y contraseña correcta y presiono "Ingresar",
- **entonces** el sistema me autentica correctamente y me redirige al dashboard según mi rol.

### CA-019.2 — Credenciales inválidas

- **Dado que** ingreso una contraseña o usuario incorrectos,
- **cuando** intento acceder,
- **entonces** el sistema impide el acceso y muestra la alerta: "Usuario o contraseña incorrectos".

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Autentica al usuario e inicia la sesión |

---

## Notas técnicas

- Generación de token JWT firmado con expiración corta (p. ej. 8 horas).
- Encriptación de contraseñas mediante algoritmo `bcrypt` o `Argon2`.
