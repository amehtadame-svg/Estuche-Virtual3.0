# HU-014 — Identificación de productos más vendidos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-014 |
| **Título** | Identificación de productos más vendidos |
| **Módulo** | Reportes |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-014 |

---

## Historia
**Como** administrador,
**quiero** saber productos más vendidos,
**para** planificar de manera más eficiente las decisiones de compra e inventario.

---

## Criterios de Aceptación

### CA-014.1 — Reporte de ranking

- **Dado que** accedo al reporte de rotación (`/reports/top-selling`),
- **cuando** consulto el listado por un rango de fechas,
- **entonces** el sistema ordena los productos en forma descendente según la cantidad total de unidades vendidas.

### CA-014.2 — Límite de resultados

- **Dado que** solicito la consulta rápida del dashboard,
- **cuando** la vista renderiza,
- **entonces** se muestran los 10 productos más vendidos (Top 10) acompañados por un gráfico comparativo.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/top-selling` | Consulta y ordena los productos con mayor rotación |

---

## Notas técnicas

- Consulta de agrupación SQL: `SELECT product_id, SUM(quantity) as total_qty FROM sale_items GROUP BY product_id ORDER BY total_qty DESC LIMIT 10`.
