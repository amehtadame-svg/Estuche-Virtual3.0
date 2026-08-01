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

**Como** administrador del sistema o responsable de la seguridad de la información y gestión de identidades, encargado de la asignación de responsabilidades y protección del sistema,  
**quiero** contar con un módulo de gestión de usuarios y roles que me permita crear cuentas de acceso para el personal, configurar perfiles de permisos granulados (RBAC) otorgando o restringiendo acceso a módulos específicos (ventas, inventario, reportes financieros, mantenimientos), y gestionar el estado activo/inactivo de cada usuario,  
**para** garantizar que cada empleado interactúe estrictamente dentro del marco de sus funciones laborales, prevenir la manipulación o eliminación no autorizada de información contable o de inventario, proteger datos confidenciales del negocio, cumplir con normativas de seguridad de la información y mantener un registro de auditoría atribuible a cada cuenta.

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
