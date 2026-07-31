# HU-020 — Consulta de ventas por empleado

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-020 |
| **Título** | Consulta de ventas por empleado |
| **Módulo** | Reportes |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-020 |

---

## Historia

**Como** administrador,
**quiero** ver ventas por empleado,
**para** controlar y evaluar el desempeño comercial de cada trabajador.

---

## Criterios de Aceptación

### CA-020.1 — Desglose de ventas por vendedor

- **Dado que** accedo al reporte de empleados (`/reports/sales-by-user`),
- **cuando** selecciono un empleado específico y un rango de fechas,
- **entonces** el sistema despliega el número de transacciones atendidas y el monto acumulado total.

### CA-020.2 — Comparativa de vendedores

- **Dado que** solicito el reporte general de rendimiento,
- **cuando** se carga el gráfico,
- **entonces** se visualiza la comparativa entre todos los usuarios del sistema.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/sales-by-user` | Retorna el reporte de ventas filtrado por usuario |

---

## Notas técnicas

- Filtro `WHERE user_id = :userId` sobre la tabla de ventas.
