# HU-018 — Control de usuarios y permisos

## Identificación
CampoValor**ID**HU-018**Título**Control de usuarios y permisos**Módulo**Seguridad**Prioridad**Alta**Estado**Por Implementar**RF asociados**RF-018

---

## Historia
**Como** administrador,
**quiero** controlar usuarios,
**para** definir los roles del personal, limitar permisos y prevenir errores o accesos no autorizados.

---

## Criterios de Aceptación

### CA-018.1 — Creación de usuarios y asignación de rol

- **Dado que** accedo a la administración de usuarios (`/settings/users`),
- **cuando** creo una nueva cuenta y le asigno el rol "Vendedor" o "Administrador",
- **entonces** el sistema guarda el usuario aplícándole las restricciones del rol elegido.

### CA-018.2 — Denegación de acceso por falta de permisos

- **Dado que** un usuario con rol "Vendedor" intenta acceder a una ruta administrativa (ej. `/reports/financials`),
- **cuando** la aplicación intenta cargar la vista,
- **entonces** el sistema bloquea el paso y muestra el mensaje: "No tiene permisos suficientes para acceder a este módulo".

---

## Endpoints
MétodoRutaDescripciónPOST`/api/v1/users`Registra un nuevo usuario con rol explícitoGET`/api/v1/roles`Retorna el catálogo de roles disponibles

---

## Notas técnicas

- Implementación de RBAC (Role-Based Access Control) mediante middlewares/guards en los endpoints.
