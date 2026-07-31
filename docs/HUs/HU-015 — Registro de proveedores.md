## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-015 |
| **Título** | Registro de proveedores |
| **Módulo** | Proveedores |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-015 |

---

## Historia

**Como** administrador o encargado de suministros del negocio,  
**quiero** registrar y administrar las fichas de los proveedores comerciales incluyendo Razón Social, Identificación Fiscal (RUC/NIT), datos de contacto, dirección y teléfono,  
**para** mantener un directorio organizado de la cadena de suministro, vincular formalmente las compras y recepciones de mercancía con sus distribuidores y facilitar el rastreo de garantías.

---

## Criterios de Aceptación

### CA-015.1 — Formulario de alta de nuevo proveedor
- **Dado que** accedo al formulario de creación de proveedores (`/suppliers/new`),
- **cuando** completo Razón Social, Identificación Fiscal (RUC/NIT), Persona de Contacto, Teléfono, Correo y Dirección Comercial,
- **entonces** el sistema habilita el botón para guardar el registro.

### CA-015.2 — Control de unicidad de la Identificación Fiscal
- **Dado que** escribo una Identificación Fiscal (RUC/NIT) que ya pertenece a un proveedor previamente registrado,
- **cuando** intento guardar el registro,
- **entonces** el sistema detiene la operación informando: "Error: La identificación fiscal ingresada ya pertenece a un proveedor activo en la plataforma".

### CA-015.3 — Validación de sintaxis en el correo electrónico
- **Dado que** completo el campo de correo electrónico del proveedor,
- **cuando** introduzco una cadena con formato inválido (ej. "correo_invalido"),
- **entonces** el formulario resalta el campo indicando: "Debe ingresar una dirección de correo electrónico válida".

### CA-015.4 — Confirmación de persistencia de proveedor
- **Dado que** he completado todos los campos obligatorios con valores correctos,
- **cuando** hago clic en "Guardar Proveedor",
- **entonces** el registro se almacena en la base de datos y se muestra un mensaje confirmando el éxito de la operación.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/suppliers` | Guarda la información del nuevo proveedor |

---

## Notas técnicas

- Entidad `Supplier` con campos únicos indexados en el número de identificación fiscal (`tax_id` o `RUC`/`NIT`).
