# HU-028 — Categorización de productos

## Identificación
CampoValor
**ID** HU-028  
**Título** Categorización de productos  
**Módulo** Inventario  
**Prioridad** Media  
**Estado** Por Implementar  
**RF asociados** RF-028

---

## Historia
**Como** administrador,  
**quiero** categorizar productos,  
**para** mantener organizada la mercancía agrupada por tipos o departamentos.

---

## Criterios de Aceptación

### CA-028.1 — Asignación de categoría a un producto

- **Dado que** estoy creando o editando un producto,  
- **cuando** elijo una categoría del desplegable (ej. "Papelería", "Oficina", "Escolar"),  
- **entonces** el producto queda enlazado formalmente a esa categoría.

### CA-028.2 — Filtrado por categoría

- **Dado que** consulto el catálogo general,  
- **cuando** selecciono un filtro de categoría,  
- **entonces** el sistema despliega únicamente los productos asociados a dicha categoría.

---

## Endpoints
Método | Ruta | Descripción
--- | --- | ---
GET | `/api/v1/categories` | Obtiene el listado de categorías activas
POST | `/api/v1/categories` | Crea una nueva categoría dentro del sistema

---

## Notas técnicas

- Entidad `Category` relacionada de uno a muchos con la entidad `Product` mediante la clave foránea `category_id`.
