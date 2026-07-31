# HU-029 — Visualización del historial de precios

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-029 |
| **Título** | Visualización del historial de precios |
| **Módulo** | Auditoría |
| **Prioridad** | Baja |
| **Estado** | Por Implementar |
| **RF asociados** | RF-029 |

---

## Historia

**Como** administrador o auditor del negocio,  
**quiero** visualizar la línea de tiempo de cambios de precios asignados a un producto comercial especificando fecha, valor previo, valor nuevo y usuario responsable,  
**para** auditar los ajustes aplicados, analizar las fluctuaciones de tarifas en el tiempo y resolver discrepancias en el cálculo de márgenes históricos.

---

## Criterios de Aceptación

### CA-029.1 — Línea de tiempo de cambios de precio
- **Dado que** me encuentro en el detalle de un producto y presiono "Historial de Precios" (`/products/{id}/price-history`),
- **cuando** la vista carga,
- **entonces** observo una tabla cronológica con todos los precios de venta asignados históricamente al producto.

### CA-029.2 — Detalle de información almacenada
- **Dado que** consulto el historial de precios,
- **cuando** reviso los registros,
- **entonces** cada fila muestra: Fecha y Hora del Cambio, Precio Anterior, Precio Nuevo, Porcentaje de Variación y Usuario que aplicó el cambio.

### CA-029.3 — Filtro por rango de fechas
- **Dado que** me ubico en el historial de precios de un producto,
- **cuando** especifico un rango de fechas,
- **entonces** la lista presenta únicamente las variaciones de precio ocurridas dentro de ese período.

### CA-029.4 — Inmutabilidad de los datos de historial
- **Dado que** observo la tabla de auditoría de precios,
- **cuando** reviso la interfaz,
- **entonces** confirmo que no existen opciones para alterar o borrar los registros de precios pasados.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/products/{id}/price-history` | Retorna las variaciones históricas del precio |

---

## Notas técnicas

- Cada actualización sobre el campo `price` en la tabla `products` dispara una inserción secundaria automática hacia la tabla `price_history`.
