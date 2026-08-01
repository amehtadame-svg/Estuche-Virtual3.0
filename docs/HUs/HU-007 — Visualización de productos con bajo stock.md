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

---

## Historia

**Como** administrador del negocio o encargado de suministros y reposición, responsable de la planificación de compras y la gestión del stock de seguridad,  
**quiero** contar con una pantalla de monitoreo preventivo que liste automáticamente todos los productos cuyas existencias actuales se encuentren en o por debajo de su punto de reorden (stock mínimo parametrizado),  
**para** generar pedidos de reposición con suficiente margen de tiempo antes de que los productos lleguen al agotamiento total, mantener una disponibilidad ininterrumpida de la mercancía de mayor demanda, optimizar la gestión del flujo de caja destinado a compras y proteger la satisfacción del cliente.

---

## Criterios de Aceptación

### CA-007.1 — Listado dinámico basado en el umbral mínimo individual
- **Dado que** accedo a la vista de alertas de bajo stock (`/inventory/low-stock`),
- **cuando** el sistema procesa la solicitud,
- **entonces** debe retornar únicamente los productos cuyo valor de `stock` actual sea menor o igual al parámetro `min_stock` configurado para dicho artículo, y que mantengan un stock mayor a cero.

### CA-007.2 — Modificación directa del parámetro de stock mínimo
- **Dado que** estoy revisando la tabla de productos con bajo stock,
- **cuando** modifico el número del campo "Stock Mínimo" directamente en la fila del producto y guardo,
- **entonces** el sistema actualiza esa regla en la base de datos y recalcula de inmediato si el producto debe seguir figurando en el listado de alertas.

### CA-007.3 — Ordenamiento prioritario por grado de escasez
- **Dado que** la lista de bajo stock despliega múltiples productos,
- **cuando** se cargan los registros en pantalla,
- **entonces** el sistema debe ordenarlos automáticamente de forma ascendente en función de sus unidades disponibles (los productos con menor stock en la parte superior).

### CA-007.4 — Columna calculada de sugerencia de compra
- **Dado que** analizo los ítems mostrados en la vista de bajo stock,
- **cuando** reviso las columnas del reporte,
- **entonces** debo visualizar una columna calculada denominada "Unidades a Solicitar" que corresponda a la fórmula: `(Stock Máximo Deseado - Stock Actual)`.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/inventory/low-stock` | Consulta productos por debajo del umbral mínimo |

---

## Notas técnicas

- Consulta SQL: `SELECT * FROM products WHERE stock <= min_stock AND stock > 0 AND is_active = true`.
- Permitir configuración dinámica del parámetro `min_stock` individual o global.
