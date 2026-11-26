<!--
  ¿Qué? Historia de usuario que describe la creación de una cuenta nueva en Estuche Virtual.
  ¿Para qué? Formalizar la puerta de entrada de clientes a la plataforma.
  ¿Impacto? Sin registro no existen usuarios ni pedidos — es la base de todo el flujo comercial.
-->

# HU-031 — Registro de cuenta de cliente

> La verificación de correo indicada aquí sigue pendiente: actualmente el registro de cliente inicia sesión sin activación previa.

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-031 |
| **Título** | Registro de cuenta de cliente |
| **Módulo** | Autenticación |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-001, RF-029 |

---

## Historia

**Como** visitante interesado en comprar útiles escolares,
**quiero** crear una cuenta indicando mi nombre completo, correo electrónico y contraseña,
**para** poder acceder a las funcionalidades correspondientes a mi rol dentro de la plataforma.

---

## Criterios de Aceptación

### CA-031.1 — Formulario de registro de cliente
- **Dado que** estoy en la página de registro (`/registro`),
- **cuando** visualizo el formulario,
- **entonces** debo encontrar campos para nombre completo, correo, contraseña y confirmación de contraseña.

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
| POST | `/api/auth/register` | Crea la cuenta de cliente; envío de verificación pendiente |
| POST | `/api/auth/verify-email` | Ruta requerida para activación; no implementada actualmente |

---

## Notas técnicas

- La contraseña se almacena con hash bcrypt.
- El rol **Administrador** nunca se asigna desde este formulario — solo puede crearlo otro administrador.
- El registro crea la fila en la tabla `usuarios` con el rol de cliente.
