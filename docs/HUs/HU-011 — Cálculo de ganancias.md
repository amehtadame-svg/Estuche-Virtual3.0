# HU-011 — Cálculo de ganancias

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-011 |
| **Título** | Cálculo de ganancias |
| **Módulo** | Finanzas |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-011 |

---

## Historia
**Como** administrador,
**quiero** calcular ganancias,
**para** conocer las utilidades netas del negocio durante un período.

---

## Criterios de Aceptación

### CA-011.1 — Cálculo del margen de utilidad

- **Dado que** estoy en el módulo financiero (`/financials/profits`),
- **cuando** defino un período determinado y presiono "Calcular",
- **entonces** el sistema resta los costos de adquisición de los productos vendidos al valor total acumulado de las ventas en ese período y muestra la ganancia neta.

### CA-011.2 — Desglose de fórmula

- **Dado que** se calcula la ganancia,
- **cuando** reviso los detalles,
- **entonces** debo visualizar claramente: Ingresos Totales, Costos Totales de Productos Vendidos (COGS) y Utilidad Neta.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/financials/profits` | Retorna los cálculos de ganancias y costos |

---

## Notas técnicas

- Ganancia = ∑(Precio de Venta−Precio de Costo)×Cantidad Promocionada∑(Precio de Venta−Precio de Costo)×Cantidad Promocionada.
- Asegurar que la consulta utilice el `cost_price` registrado al momento exacto de la venta para no alterar cifras históricas.
