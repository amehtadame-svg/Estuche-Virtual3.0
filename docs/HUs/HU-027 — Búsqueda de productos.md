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

**Como** vendedor o usuario de la plataforma,  
**quiero** contar con una función de búsqueda ágil por coincidencia parcial de nombre o escaneo de código de barras/SKU,  
**para** reducir el tiempo de localización de mercancía durante el cobro en caja o las consultas de inventario en almacén.

---

## Criterios de Aceptación

### CA-027.1 — Búsqueda por coincidencia parcial de texto
- **Dado que** utilizo la barra de búsqueda en el sistema,
- **cuando** escribo una palabra o fragmento del nombre (ej. "cuad"),
- **entonces** la lista se filtra mostrando dinámicamente los productos que coinciden con el texto ingresado.

### CA-027.2 — Búsqueda directa por lector de código de barras
- **Dado que** me encuentro en la barra de búsqueda,
- **cuando** escaneo el código de barras/SKU exacto de un producto,
- **entonces** el sistema ubica y selecciona automáticamente dicho producto.

### CA-027.3 — Respuesta ante búsquedas sin resultados
- **Dado que** introduzco un término que no coincide con ningún producto,
- **cuando** se ejecuta el filtro,
- **entonces** el sistema muestra la leyenda: "No se encontraron productos coincidentes".

### CA-027.4 — Limpieza rápida de filtros
- **Dado que** tengo una búsqueda activa en pantalla,
- **cuando** presiono el icono "X" en la barra de búsqueda,
- **entonces** el campo de texto se borra y la tabla despliega nuevamente el catálogo completo.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/products/search` | Filtra productos por coincidencia de nombre |

---

## Notas técnicas

- Consulta SQL utilizando coincidencia `LIKE '%texto%'` o Búsqueda de Texto Completo (`Full-Text Search` / `tsvector`) en la columna `name`.
