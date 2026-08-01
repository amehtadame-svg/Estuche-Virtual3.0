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

**Como** vendedor en punto de venta (POS), cajero operativo o encargado de almacén, responsable de la atención rápida al cliente, cotizaciones dinámicas e inspección de existencias en mostrador,  
**quiero** disponer de un motor de búsqueda de alta velocidad e intuitivo integrado en los módulos operacionales que procese consultas por coincidencia parcial de nombre, categoría comercial o mediante la lectura óptica directa de códigos de barras y SKU,  
**para** reducir drásticamente los tiempos de respuesta y localización de productos durante el proceso de cobro en caja, evitar colas o demoras en la atención al público, prevenir errores humanos por digitación de precios o códigos incorrectos y verificar de forma instantánea la disponibilidad teórica de mercancía en bodega.

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
