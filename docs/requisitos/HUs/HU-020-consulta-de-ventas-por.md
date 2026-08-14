<!--
  ¿Qué? Historia de usuario que describe la consulta de ventas realizadas por cada empleado.
  ¿Para qué? Formalizar el seguimiento del desempeño individual del personal de ventas.
  ¿Impacto? Permite evaluar productividad y detectar inconsistencias operativas.
-->

# HU-020 — Consulta de ventas por empleado

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-020 |
| **Título** | Consulta de ventas por empleado |
| **Módulo** | Reportes |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-027|

---

## Historia

**Como** administrador del negocio, director de recursos humanos o supervisor de personal de caja y fuerza de ventas, responsable directo del seguimiento del desempeño comercial, cumplimiento de metas corporativas y evaluación de la productividad del talento humano,  
**quiero** disponer de un módulo analítico especializado que me permita consultar, filtrar y consolidar informes de ventas detallados por cada vendedor de forma individual dentro de períodos de tiempo totalmente configurables (días, semanas, meses o rangos personalizados), desglosando volumen facturado, cantidad de tickets emitidos, promedio por venta e historial de órdenes procesadas,  
**para** medir de manera objetiva, cuantitativa e imparcial la productividad y eficiencia comercial del personal en caja, transparentar y calcular con exactitud comisiones, bonificaciones o incentivos económicos por metas alcanzadas, identificar cuellos de botella en la atención al cliente, comparar el rendimiento operativo entre turnos de trabajo y tomar decisiones fundamentadas sobre capacitación, reconocimientos o ajustes en la plantilla de personal.

---

## Criterios de Aceptación

### CA-020.1 — Desglose de ventas por vendedor

### CA-020.1 — Filtrado de reporte por empleado y fechas
- **Dado que** accedo al reporte de ventas por empleado (`/reports/sales-by-user`),
- **cuando** selecciono un vendedor del desplegable, defino un rango de fechas y presiono "Consultar",
- **entonces** el sistema despliega únicamente las ventas procesadas por dicho vendedor.

### CA-020.2 — Indicadores consolidados del vendedor
- **Dado que** se procesan los datos del vendedor seleccionado,
- **cuando** reviso el resumen en pantalla,
- **entonces** debo visualizar: Nombre del Vendedor, Monto Total Facturado, Número de Tickets Emitidos y Ticket Promedio.

### CA-020.3 — Comparativa global entre todos los vendedores
- **Dado que** elijo la opción "Todos los Empleados" en la consulta,
- **cuando** ejecuto el reporte,
- **entonces** el sistema presenta una tabla comparativa ordenando a los vendedores descendentemente según el monto total facturado.

### CA-020.4 — Exportación del reporte individual
- **Dado que** estoy consultando el rendimiento de un vendedor,
- **cuando** hago clic en "Exportar Reporte",
- **entonces** el sistema descarga un archivo PDF formateado listo para revisión administrativa.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/sales-by-user` | Retorna el reporte de ventas filtrado por usuario |

---

## Notas técnicas

- Filtro `WHERE user_id = :userId` sobre la tabla de ventas.
