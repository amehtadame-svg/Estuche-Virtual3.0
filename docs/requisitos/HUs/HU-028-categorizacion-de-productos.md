<!--
  ¿Qué? Historia de usuario que describe la categorización de productos del catálogo.
  ¿Para qué? Formalizar la organización de artículos en categorías comerciales.
  ¿Impacto? Facilita la navegación del catálogo y el análisis por línea de producto.
-->

# HU-028 — Categorización de productos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-028 |
| **Título** | Categorización de productos |
| **Módulo** | Inventario |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-014|

---

## Historia

**Como** administrador del catálogo comercial o arquitecto de información de productos, responsable de la estructuración, navegabilidad, taxonomía y ordenamiento comercial de la oferta del negocio,  
**quiero** crear, modificar y administrar una estructura jerárquica de categorías y departamentos comerciales que me permita clasificar y agrupar la totalidad de los artículos del inventario en familias de mercancías afines,  
**para** mantener un catálogo limpio, lógico y bien organizado, agilizar los filtros de selección en las pantallas del punto de venta (POS), facilitar la navegación de los usuarios operativos y hacer posible la emisión de reportes financieros, de inventario y de rotación comercial segmentados por sectores de productos.

---

## Criterios de Aceptación

### CA-028.1 — Creación de nuevas categorías
- **Dado que** estoy en el módulo de categorías (`/categories`),
- **cuando** creo una nueva categoría ingresando su nombre y descripción y presiono guardar,
- **entonces** la categoría se agrega a la lista de opciones del sistema.

### CA-028.2 — Asignación de categoría a un producto
- **Dado que** creo o edito un producto,
- **cuando** elijo una categoría del desplegable y guardo el producto,
- **entonces** el producto queda enlazado formalmente a dicha categoría.

### CA-028.3 — Filtrado de catálogo por categoría
- **Dado que** consulto el catálogo general,
- **cuando** elijo una categoría en el filtro lateral,
- **entonces** la pantalla exhibe únicamente los productos vinculados a esa categoría.

### CA-028.4 — Bloqueo de borrado de categorías en uso
- **Dado que** intento eliminar una categoría que posee productos asociados,
- **cuando** presiono eliminar,
- **entonces** el sistema rechaza la acción informando: "No se puede eliminar la categoría porque existen productos asignados a ella".

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/categories` | Crea y asigna categorías de productos |

---

## Notas técnicas

- Entidad `Category` relacionada de uno a muchos con la entidad `Product` mediante la clave foránea `category_id`.
