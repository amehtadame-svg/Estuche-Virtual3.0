<!--
  ¿Qué? Requisito funcional que describe la generación de reportes consolidados de ventas.
  ¿Para qué? Definir cómo se calcula y expone la información comercial agregada.
  ¿Impacto? Sustenta las decisiones gerenciales sobre el desempeño del negocio.
-->

# RF-027 — Reportes de Ventas

**Historia de usuario relacionada**: HU-008

## Descripción

El sistema debe consolidar diariamente la información de pedidos, pagos y devoluciones en la tabla `reportes_ventas`, y exponerla mediante consultas filtradas por rango de fechas.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | Un proceso programado se ejecuta al cierre del día. |
| 2 | El sistema consolida pedidos entregados, cancelados, total vendido y reembolsado del día. |
| 3 | Se inserta o actualiza el registro correspondiente en `reportes_ventas`. |
| 4 | El administrador consulta los reportes filtrando por rango de fechas. |
| 5 | El sistema permite exportar el reporte consolidado. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Cada fecha tiene exactamente un registro consolidado (`UNIQUE(fecha)`). |
| RN-002 | El total vendido debe corresponder a la suma de pedidos entregados del día. |

---

## Inputs / Outputs

### Input

```json
{
  "fechaInicio": "2026-08-01",
  "fechaFin": "2026-08-14"
}
```

### Output éxito (HTTP 200)

```json
[
  {
    "fecha": "2026-08-10",
    "total_vendido": 1250000,
    "total_pedidos": 34
  }
]
```

### Output error (HTTP 400)

```json
{
  "error": "El rango de fechas proporcionado no es válido."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/admin/reportes/ventas` | Sí (Administrador) | Consulta reportes consolidados por rango de fechas. |
| GET | `/api/admin/reportes/ventas/exportar` | Sí (Administrador) | Exporta el reporte en formato descargable. |
