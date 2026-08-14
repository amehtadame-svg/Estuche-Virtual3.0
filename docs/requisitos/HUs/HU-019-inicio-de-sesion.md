<!--
  ¿Qué? Historia de usuario que describe el inicio de sesión de los usuarios del sistema.
  ¿Para qué? Formalizar el acceso autenticado a la plataforma según el rol del usuario.
  ¿Impacto? Es la puerta de entrada obligatoria a cualquier funcionalidad protegida del sistema.
-->

# HU-019 — Inicio de sesión

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-019 |
| **Título** | Inicio de sesión |
| **Módulo** | Autenticación |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-002, RF-028|

---

## Historia


**Como** usuario registrado en la plataforma (vendedor de caja, encargado de almacén, auditor o administrador general), responsable de ejecutar operaciones dentro del sistema,  
**quiero** disponer de un portal de inicio de sesión seguro donde pueda ingresar mi correo electrónico corporativo registrado y mi contraseña encriptada, con validación de credenciales en tiempo real y protección contra intentos fallidos,  
**para** autenticar de forma inequívoca mi identidad ante el servidor, obtener un token de sesión seguro, acceder a las herramientas y vistas autorizadas para mi rol de usuario, iniciar formalmente mi jornada operativa y asegurar que todas mis acciones queden registradas con mi firma digital dentro de los logs del sistema.

---

## Criterios de Aceptación

### CA-019.1 — Autenticación exitosa y redirección por rol
- **Dado que** me encuentro en la pantalla de login (`/login`),
- **cuando** introduzco mi correo registrado y contraseña correcta y presiono "Iniciar Sesión",
- **entonces** el sistema me autentica correctamente y me redirige a la vista principal según mi rol.

### CA-019.2 — Rechazo por credenciales erróneas
- **Dado que** estoy en el formulario de inicio de sesión,
- **cuando** introduzco un correo no registrado o una contraseña equivocada,
- **entonces** el sistema detiene el ingreso y despliega la advertencia: "Usuario o contraseña incorrectos".

### CA-019.3 — Bloqueo de acceso a cuentas desactivadas
- **Dado que** ingreso credenciales correctas pertenecientes a una cuenta en estado inactivo,
- **cuando** presiono "Iniciar Sesión",
- **entonces** el sistema bloquea el acceso informando: "Su cuenta se encuentra desactivada. Por favor contacte al administrador".

### CA-019.4 — Emisión y almacenamiento de Token de sesión
- **Dado que** las credenciales han sido validadas correctamente,
- **cuando** el backend responde a la autenticación,
- **entonces** emite un Token JWT firmado y lo almacena de forma segura para firmar las peticiones del usuario.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Autentica al usuario e inicia la sesión |

---

## Notas técnicas

- Generación de token JWT firmado con expiración corta (p. ej. 8 horas).
- Encriptación de contraseñas mediante algoritmo `bcrypt` o `Argon2`.
