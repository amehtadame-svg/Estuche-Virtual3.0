# HU-018 — Control de usuarios y permisos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-018 |
| **Título** | Control de usuarios y permisos |
| **Módulo** | Seguridad |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-018 |

---

## Historia

**Como** administrador del sistema,  
**quiero** administrar las cuentas de los empleados del negocio y asignarles roles con permisos de acceso específicos (Administrador, Vendedor, Almacenero),  
**para** restringir el acceso a módulos delicados (como informes financieros, eliminación de productos o configuración de respaldos), prevenir operaciones no autorizadas y resguardar la seguridad del sistema.

---

## Criterios de Aceptación

### CA-018.1 — Creación de cuentas y asignación de rol
- **Dado que** accedo al panel de gestión de usuarios (`/settings/users`),
- **cuando** creo un nuevo usuario introduciendo Nombre, Correo, Contraseña y selecciono su Rol (ej. Vendedor),
- **entonces** la cuenta se guarda vinculada estrictamente a los permisos de dicho rol.

### CA-018.2 — Restricción de navegación por rol no autorizado
- **Dado que** un empleado inicia sesión con el rol "Vendedor",
- **cuando** intenta navegar manualmente hacia una URL administrativa (ej. `/financials/profits`),
- **entonces** el sistema detiene la carga y muestra el mensaje: "Acceso denegado: No posee los permisos requeridos para consultar este módulo".

### CA-018.3 — Ocultamiento dinámico de menús de navegación
- **Dado que** un usuario ingresa al sistema con sus credenciales,
- **cuando** el menú lateral se renderiza,
- **entonces** únicamente presenta los accesos directos a los módulos expresamente autorizados para su rol.

### CA-018.4 — Desactivación preventiva de usuarios
- **Dado que** el administrador selecciona la cuenta de un empleado inactivo,
- **cuando** hace clic en "Desactivar Usuario",
- **entonces** la cuenta pasa a estado inactivo y el sistema invalida inmediatamente todas sus sesiones activas.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/users` | Crea un usuario y le asigna un rol |

---

## Notas técnicas

- Implementación de RBAC (Role-Based Access Control) mediante middlewares/guards en los endpoints.
