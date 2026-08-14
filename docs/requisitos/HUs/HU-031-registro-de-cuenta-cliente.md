<!--
  ¿Qué? Historia de usuario que describe la creación de una cuenta nueva en Estuche Virtual.
  ¿Para qué? Formalizar la puerta de entrada de clientes y proveedores a la plataforma.
  ¿Impacto? Sin registro no existen usuarios ni pedidos — es la base de todo el flujo comercial.
-->

# HU-031 — Registro de cuenta (Cliente / Proveedor)

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-031 |
| **Título** | Registro de cuenta (Cliente / Proveedor) |
| **Módulo** | Autenticación |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-001, RF-029 |

---

## Historia

**Como** visitante interesado en comprar o vender útiles escolares,
**quiero** crear una cuenta indicando mi nombre completo, correo electrónico, teléfono, contraseña y el rol que deseo (Cliente o Proveedor),
**para** poder acceder a las funcionalidades correspondientes a mi rol dentro de la plataforma.

---

## Criterios de Aceptación

### CA-031.1 — Formulario de registro con selección de rol
- **Dado que** estoy en la página de registro (`/registro`),
- **cuando** visualizo el formulario,
- **entonces** debo encontrar campos para nombre completo, correo, teléfono, contraseña, confirmación de contraseña y el selector de tipo de cuenta (Cliente o Proveedor).

### CA-031.2 — Validación de correo único
- **Dado que** intento registrarme con un correo ya existente en el sistema,
- **cuando** envío el formulario,
- **entonces** el sistema rechaza el registro con el mensaje: "El correo electrónico ya se encuentra registrado".

### CA-031.3 — Validación de contraseña segura
- **Dado que** ingreso una contraseña con menos de 8 caracteres o sin mayúscula, minúscula y número,
- **cuando** envío el formulario,
- **entonces** debo ver un mensaje describiendo el requisito faltante.

### CA-031.4 — Envío de correo de verificación
- **Dado que** completo el registro exitosamente,
- **cuando** el sistema crea la cuenta con estado "Pendiente de verificación",
- **entonces** recibo un correo con un enlace de activación válido por 24 horas.

### CA-031.5 — Bloqueo de acceso hasta verificar el correo
- **Dado que** me registré pero no he verificado mi correo,
- **cuando** intento iniciar sesión,
- **entonces** el sistema me informa que debo verificar mi cuenta antes de continuar.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Crea la cuenta y envía el correo de verificación |
| POST | `/api/auth/verify-email` | Activa la cuenta mediante el token recibido |

---

## Notas técnicas

- La contraseña se almacena con hash bcrypt.
- El rol **Administrador** nunca se asigna desde este formulario — solo puede crearlo otro administrador.
- El registro crea la fila en la tabla `usuarios` con `rol = 'cliente'` o `'proveedor'`.
