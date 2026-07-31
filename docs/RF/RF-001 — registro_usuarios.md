# RF-001 — Registro de Usuarios

**Historia de usuario relacionada:** HU-001

## Descripción

El sistema debe permitir el registro de nuevos usuarios con los roles **Cliente** y **Proveedor** mediante un formulario de registro. Una vez completado el registro, el usuario recibirá un correo electrónico de verificación para activar su cuenta. Hasta que el correo sea verificado, el usuario no podrá iniciar sesión en la plataforma.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario accede al formulario de registro desde la página principal. |
| 2 | El usuario selecciona el tipo de cuenta (Cliente o Proveedor). |
| 3 | El usuario diligencia el formulario con sus datos personales. |
| 4 | El sistema valida que todos los campos obligatorios estén completos y tengan un formato válido. |
| 5 | El sistema verifica que el correo electrónico no se encuentre registrado previamente. |
| 6 | Si el correo ya existe, el sistema informa al usuario y cancela el registro. |
| 7 | Si la información es válida, la contraseña es cifrada antes de almacenarse. |
| 8 | El sistema registra al usuario con estado **Pendiente de verificación**. |
| 9 | El sistema genera un enlace de verificación y lo envía al correo electrónico registrado. |
| 10 | El usuario accede al enlace recibido para verificar su cuenta. |
| 11 | El sistema cambia el estado de la cuenta a **Activa**. |
| 12 | El usuario ya puede iniciar sesión en la plataforma. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | El correo electrónico debe tener un formato válido. |
| RN-002 | El correo electrónico debe ser único dentro del sistema. |
| RN-003 | El nombre completo debe contener entre 2 y 100 caracteres. |
| RN-004 | La contraseña debe tener mínimo 8 caracteres. |
| RN-005 | La contraseña debe contener al menos una letra mayúscula. |
| RN-006 | La contraseña debe contener al menos una letra minúscula. |
| RN-007 | La contraseña debe contener al menos un número. |
| RN-008 | La contraseña debe almacenarse utilizando un algoritmo de cifrado seguro (bcrypt). |
| RN-009 | Solo los usuarios con correo verificado podrán iniciar sesión en el sistema. |
| RN-010 | El enlace de verificación tendrá una vigencia máxima de 24 horas. |
| RN-011 | Los únicos roles permitidos para el registro son **Cliente** y **Proveedor**. El rol **Administrador** únicamente podrá ser creado por otro administrador autorizado. |

---

## Inputs / Outputs

### Input (Formulario)

```json
{
  "nombreCompleto": "string",
  "correo": "string",
  "telefono": "string",
  "password": "string",
  "rol": "Cliente | Proveedor"
}
```

### Output éxito (HTTP 201)

```json
{
  "id": 1,
  "nombreCompleto": "Juan Pérez",
  "correo": "juan@email.com",
  "rol": "Cliente",
  "estado": "Pendiente de verificación",
  "mensaje": "Se ha enviado un correo para verificar la cuenta."
}
```

### Output error (HTTP 400)

```json
{
  "error": "Los datos ingresados no son válidos."
}
```

### Output error (HTTP 409)

```json
{
  "error": "El correo electrónico ya se encuentra registrado."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/auth/register` | No | Registra un nuevo usuario con rol Cliente o Proveedor. |
| POST | `/api/auth/verify-email` | No | Verifica la cuenta mediante el enlace enviado al correo electrónico. |
