# HU-027 — Búsqueda de productos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-027 |
| **Título** | Búsqueda de productos |
| **Módulo** | Inventario |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-027 |

---

## Historia
**Como** administrador,
**quiero** buscar productos,
**para** agilizar los procesos de consulta, edición y venta dentro del sistema.

---

## Criterios de Aceptación

### CA-027.1 — Búsqueda por coincidencia parcial de nombre

- **Dado que** utilizo la barra de búsqueda de productos,
- **cuando** escribo una palabra o fragmento del nombre (ej. "Cuad"),
- **entonces** el sistema filtra dinámicamente y muestra los productos que coinciden con el texto ingresado.

### CA-027.2 — Búsqueda sin coincidencias

- **Dado que** escribo un texto que no coincide con ningún producto,
- **cuando** el sistema realiza el filtro,
- **entonces** la interfaz muestra el mensaje: "No se encontraron productos coincidentes".

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/products/search` | Filtra productos por coincidencia de nombre |

---

## Notas técnicas

- Consulta SQL utilizando coincidencia `LIKE '%texto%'` o Búsqueda de Texto Completo (`Full-Text Search` / `tsvector`) en la columna `name`.
