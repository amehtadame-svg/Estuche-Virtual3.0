# HU-007 — Visualización de productos con bajo stock

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-007 |
| **Título** | Visualización de productos con bajo stock |
| **Módulo** | Inventario |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-007 |


## Historia
**Como** administrador,
**quiero** ver productos con bajo stock,
**para** evitar pérdidas de ventas reordenando antes del agotamiento.

## Criterios de Aceptación

### CA-007.1 — Filtro de umbral mínimo de stock
- **Dado que** me ubico en el listado de alertas de inventario (`/inventory/low-stock`),
- **cuando** la pantalla carga,
- **entonces** el sistema lista todos los productos cuyo stock actual sea menor o igual al valor `min_stock` predefinido por el producto.

### CA-007.2 — Indicadores visuales de advertencia
- **Dado que** un producto está en el rango de bajo stock,
- **cuando** aparece en la lista,
- **entonces** el registro se resalta en color de advertencia (ej. amarillo/naranja) indicando las unidades restantes.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/inventory/low-stock` | Consulta productos por debajo del umbral mínimo |

## Notas técnicas
- Consulta SQL: `SELECT * FROM products WHERE stock <= min_stock AND stock > 0 AND is_active = true`.
- Permitir configuración dinámica del parámetro `min_stock` individual o global.
