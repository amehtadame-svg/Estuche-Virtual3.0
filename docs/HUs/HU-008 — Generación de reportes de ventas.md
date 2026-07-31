# HU-008 — Generación de reportes de ventas

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-008 |
| **Título** | Generación de reportes de ventas |
| **Módulo** | Reportes |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-008 |

---

## Historia
**Como** administrador,
**quiero** generar reportes de ventas,
**para** analizar ganancias y medir el desempeño del negocio por períodos.

---

## Criterios de Aceptación

### CA-008.1 — Filtrado por rango de fechas

- **Dado que** estoy en el módulo de reportes (`/reports/sales`),
- **cuando** selecciono una fecha inicial y una fecha final y presiono "Generar Reporte",
- **entonces** el sistema muestra la suma total de dinero vendido, la cantidad de transacciones e ítems comercializados.

### CA-008.2 — Validación de rango de fechas incoherente

- **Dado que** selecciono una fecha inicial posterior a la fecha final,
- **cuando** solicito el reporte,
- **entonces** el sistema muestra una advertencia: "La fecha inicial no puede ser posterior a la fecha final".

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/sales` | Retorna el reporte de ventas por rango de fechas |

---

## Notas técnicas

- Usar agregaciones en base de datos (`SUM`, `COUNT`) optimizadas con índices compuestos en `sales.created_at`.
- Retornar objeto JSON con los totales globales y el desglose en el rango de fechas solicitado.
