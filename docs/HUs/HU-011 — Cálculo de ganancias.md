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

**Como** propietario del establecimiento, director financiero o gerente general de la empresa, responsable de la evaluación de rentabilidad comercial, toma de decisiones de inversión y control de costos,  
**quiero** disponer de un motor de cálculo financiero automatizado y configurable que determine con exactitud la utilidad neta operativa dentro de cualquier rango de fechas seleccionado, restando el costo histórico real de adquisición de los productos comercializados (COGS) del volumen de ingresos brutos obtenidos por ventas directas o de combos,  
**para** conocer con precisión el margen bruto y neto de ganancia de la empresa en tiempo real, evaluar la viabilidad financiera de las operaciones, analizar el rendimiento de las estrategias de precios implementadas, detectar líneas de productos poco rentables y tomar decisiones informadas sobre distribución de dividendos o reinversión de capital.

---

## Criterios de Aceptación

### CA-011.1 — Cálculo automatizado de la utilidad neta del período
- **Dado que** accedo a la sección de finanzas y ganancias (`/financials/profits`),
- **cuando** defino un rango de fechas y presiono "Calcular Utilidad",
- **entonces** el sistema ejecuta el cálculo restando los costos de adquisición de las mercancías vendidas al valor total acumulado de las ventas del período.

### CA-011.2 — Desglose explicativo de las cifras financieras principales
- **Dado que** se procesan los cálculos financieros del período,
- **cuando** reviso el resultado en pantalla,
- **entonces** debo visualizar claramente tres contadores: Ingresos Totales por Ventas, Costo de los Productos Vendidos (COGS) y Utilidad Neta Ganada.

### CA-011.3 — Porcentaje de margen operativo sobre ventas
- **Dado que** el sistema calcula la utilidad neta,
- **cuando** despliega las métricas en la interfaz,
- **entonces** debe mostrar el porcentaje de margen operativo logrado mediante la fórmula: `(Ganancia Neta / Ingresos Totales) * 100`.

### CA-011.4 — Resaltado de pérdida en caso de saldo negativo
- **Dado que** en un período seleccionado los costos de los productos vendidos superaron los ingresos recaudados,
- **cuando** se genera la respuesta en pantalla,
- **entonces** el sistema debe pintar la cifra en color rojo con signo negativo e indicar explícitamente el texto: "Resultado del período: Pérdida Neta".

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/financials/profits` | Retorna los cálculos de ganancias y costos |

---

## Notas técnicas

- Ganancia = ∑(Precio de Venta−Precio de Costo)×Cantidad Promocionada∑(Precio de Venta−Precio de Costo)×Cantidad Promocionada.
- Asegurar que la consulta utilice el `cost_price` registrado al momento exacto de la venta para no alterar cifras históricas.
