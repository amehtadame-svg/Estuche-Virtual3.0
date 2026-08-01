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

**Como** administrador del negocio, director financiero o auditor de costos y precios, responsable del resguardo de los márgenes de ganancia, supervisión de la inflación y auditoría de decisiones comerciales,  
**quiero** consultar una línea de tiempo cronológica y detallada de todas las variaciones de precios de venta comerciales y costos de adquisición asignados a un producto a lo largo de su ciclo de vida, especificando fecha y hora del cambio, valor anterior, valor nuevo, porcentaje de ajuste y usuario autorizador,  
**para** auditar las modificaciones tarifarias ejecutadas en el sistema, analizar el impacto del incremento de costos de proveedores sobre el precio final al público, justificar la evolución de las utilidades en estados financieros históricos y verificar el estricto cumplimiento de las políticas de precios fijadas por la empresa.

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
