## Identificación

CampoValor  
**ID** HU-015  
**Título** Registro de proveedores  
**Módulo** Proveedores  
**Prioridad** Media  
**Estado** Por Implementar  
**RF asociados** RF-015

---

## Historia

**Como** administrador,  
**quiero** registrar proveedores,  
**para** organizar las compras y mantener un directorio actualizado de suministros.

---

## Criterios de Aceptación

### CA-015.1 — Registro de datos clave

- **Dado que** estoy en el formulario de registro de proveedor (`/suppliers/new`),
- **cuando** completo la razón social, número de identificación fiscal, teléfono y correo electrónico,
- **entonces** el sistema almacena correctamente la información del proveedor.

### CA-015.2 — Validación de documento de identificación duplicado

- **Dado que** un proveedor ya existe registrado con un número fiscal determinado,
- **cuando** intento volver a usar el mismo número,
- **entonces** el sistema emite un error: "El proveedor con este número de identificación ya se encuentra registrado".

---

## Endpoints

Método Ruta Descripción  
POST `/api/v1/suppliers` Guarda la información de un nuevo proveedor

---

## Notas técnicas

- Entidad `Supplier` con campos únicos indexados en el número de identificación fiscal (`tax_id` o `RUC`/`NIT`).
