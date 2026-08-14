<!--
  ¿Qué? Historia de usuario que describe la visualización tabular del inventario vigente.
  ¿Para qué? Formalizar la consulta centralizada del estado actual del catálogo y sus existencias.
  ¿Impacto? Permite decisiones oportunas de reposición y evita quiebres de stock.
-->

# HU-005 — Visualización del inventario actual

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-005 |
| **Título** | Visualización del inventario actual |
| **Módulo** | Inventario |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-006|

---

## Historia

**Como** administrador del negocio, director de operaciones o supervisor de inventario, responsable de la gestión integral del activo corriente, análisis de stock y auditoría de existencias,  
**quiero** disponer de un panel tabular centralizado, paginado y con filtros avanzados que despliegue la totalidad del catálogo de productos activos con su información técnica, existencias disponibles en bodega, categorías comerciales, precios de venta al público y costos de adquisición,  
**para** supervisar en tiempo real el volumen y la valoración económica total de los activos almacenados, responder rápidamente a consultas internas o de clientes sobre disponibilidad de mercancía, prevenir quiebres de inventario y tomar decisiones oportunas sobre adquisición, redistribución y rotación de productos.

---

## Criterios de Aceptación

### CA-005.1 — Visualización de tabla de catálogo paginada
- **Dado que** accedo al módulo de inventario general en la ruta (`/inventory`),
- **cuando** la vista completa la carga inicial de datos desde el servidor,
- **entonces** debo observar una tabla paginada con las columnas: SKU, Nombre comercial, Categoría, Precio de Venta, Costo, Stock Actual e Indicador de Estado.

### CA-005.2 — Filtrado interactivo por texto y categoría
- **Dado que** me encuentro en la vista general del inventario,
- **cuando** escribo una palabra clave en el campo de búsqueda o elijo una categoría específica en el menú desplegable de filtros,
- **entonces** la tabla debe refrescar su contenido al instante, presentando únicamente los productos que concuerden con los filtros aplicados.

### CA-005.3 — Paginación eficiente del lado del servidor
- **Dado que** la base de datos alberga un número elevado de productos (ej. más de 20 registros),
- **cuando** navego haciendo clic en las opciones de paginación ("Siguiente", "Anterior", "Número de página"),
- **entonces** el sistema realiza una solicitud HTTP liviana al backend con los parámetros de paginación (`page`, `limit`), actualizando los datos de la tabla sin refrescar la página completa.

### CA-005.4 — Indicador visual de alerta por existencias críticas
- **Dado que** un producto listado en la tabla tiene un stock menor o igual al umbral crítico (ej. 5 unidades),
- **cuando** se dibuja la fila del producto en pantalla,
- **entonces** el campo del stock debe resaltarse automáticamente con una etiqueta de color distintivo (amarillo para bajo stock, rojo para producto agotado).

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/inventory` | Devuelve la lista actual del inventario |

---

## Notas técnicas
- Implementar paginación desde el servidor (`page`, `limit`).
- Incluir índices en la base de datos sobre los campos `is_active` y `name` para optimizar el rendimiento de la consulta.
