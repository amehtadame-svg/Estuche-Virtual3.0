# HU-021 — Edición de productos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-021 |
| **Título** | Edición de productos |
| **Módulo** | Inventario |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-021 |

---

## Historia

**Como** administrador del catálogo comercial, especialista de inventarios o responsable de la gestión de información de productos, encargado de la integridad, calidad y actualización constante de la base de datos de mercancías,  
**quiero** contar con un formulario de modificación integral dentro del panel administrativo que me permita actualizar los datos técnicos, nombres comerciales, descripciones extendidas, códigos SKU/barras auxiliares, imágenes descriptivas, unidades de medida y categorías asignadas a cualquier producto previamente registrado,  
**para** corregir errores tipográficos o imprecisiones en las fichas técnicas, adaptar la información de los artículos ante cambios del fabricante o proveedor, mantener la consistencia y calidad de los datos del catálogo en los puntos de venta y canales digitales, sin alterar ni corromper las transacciones históricas de venta previamente registradas.

---

## Criterios de Aceptación

### CA-021.1 — Formulario de modificación pre-cargado
- **Dado que** selecciono la opción "Editar" sobre un producto en la tabla del catálogo (`/products/{id}/edit`),
- **cuando** la pantalla carga,
- **entonces** el formulario se presenta con todos los datos actuales del producto pre-cargados en sus respectivos campos.

### CA-021.2 — Guardado de modificaciones válidas
- **Dado que** cambio campos como Nombre, Descripción o Categoría con datos válidos,
- **cuando** presiono "Guardar Cambios",
- **entonces** el sistema actualiza la información en la base de datos y despliega una notificación de éxito.

### CA-021.3 — Control de duplicidad en edición
- **Dado que** modifico el SKU o Nombre de un producto,
- **cuando** introduzco un valor que pertenece a otro producto activo,
- **entonces** el sistema detiene la actualización informando: "No se puede guardar: El código SKU o Nombre ya está siendo utilizado por otro producto".

### CA-021.4 — Inmutabilidad de existencias desde la edición
- **Dado que** me encuentro en el formulario de edición de datos de un producto,
- **cuando** reviso los campos disponibles,
- **entonces** el campo de stock se presenta deshabilitado/bloqueado (los cambios de stock requieren el módulo de movimientos o recepciones).

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| PUT | `/api/v1/products/{id}` | Guarda las modificaciones del producto |

---

## Notas técnicas

- Proteger modificaciones masivas mediante validaciones strict DTO (`Data Transfer Object`).

```
