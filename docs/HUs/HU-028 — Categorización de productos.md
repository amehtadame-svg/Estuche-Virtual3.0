# HU-028 — Categorización de productos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-028 |
| **Título** | Categorización de productos |
| **Módulo** | Inventario |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-028 |

---

## Historia

**Como** administrador de catálogo,  
**quiero** crear y estructurar categorías o departamentos comerciales para agrupar los productos del inventario,  
**para** mantener una organización coherente del catálogo, agilizar los filtros en el punto de venta y evaluar reportes segmentados por familia de productos.

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
