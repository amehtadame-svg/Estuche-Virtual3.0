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

**Como** gerente de compras, analista de inteligencia comercial o administrador general del negocio, responsable del análisis de demanda, rotación de mercancía e inversión en inventario,  
**quiero** disponer de un módulo de analítica que procese y presente un ranking interactivo (Top 10 / Top 20) de los productos que registran la mayor cantidad de unidades comercializadas en un período de tiempo seleccionable, ordenados descendentemente y respaldados por gráficos comparativos e indicadores de volumen e ingresos,  
**para** identificar con absoluta precisión los artículos de alta rotación comercial (productos estrella), asegurar su reabastecimiento prioritario antes de llegar a situaciones de bajo stock, optimizar la disposición física de mercancías en estanterías o vitrinas de alto impacto, planificar campañas publicitarias focalizadas y negociar mejores precios y condiciones de crédito con proveedores clave.

---

## Criterios de Aceptación

### CA-014.1 — Ranking de productos ordenado por unidades vendidas
- **Dado que** accedo al reporte de rotación de mercancía (`/reports/top-selling`),
- **cuando** elijo un rango de fechas y ejecuto la consulta,
- **entonces** el sistema presenta el ranking de productos ordenados de mayor a menor según la cantidad total de unidades vendidas.

### CA-014.2 — Gráfico comparativo visual del Top 10
- **Dado que** consulto el ranking de alta rotación,
- **cuando** la pantalla muestra los resultados,
- **entonces** se despliega un gráfico de barras comparativo resaltando los 10 productos con mayor volumen comercializado en el período.

### CA-014.3 — Filtro del ranking por categoría comercial
- **Dado que** me encuentro analizando el reporte de productos más vendidos,
- **cuando** aplico un filtro por categoría (ej. "Papelería"),
- **entonces** el ranking se recalcula inmediatamente exponiendo únicamente los artículos pertenecientes a dicha categoría.

### CA-014.4 — Exportación del reporte de rotación comercial
- **Dado que** he consultado el ranking de ventas,
- **cuando** presiono el botón "Exportar Ranking",
- **entonces** el sistema descarga un archivo en formato PDF conteniendo la lista del ranking y sus totales.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/top-selling` | Consulta y ordena los productos con mayor rotación |

---

## Notas técnicas

- Consulta de agrupación SQL: `SELECT product_id, SUM(quantity) as total_qty FROM sale_items GROUP BY product_id ORDER BY total_qty DESC LIMIT 10`.
