<!--
  ¿Qué? Historia de usuario que describe la visualización del resumen diario de operación.
  ¿Para qué? Formalizar el cierre de caja y el balance general del día.
  ¿Impacto? Facilita el control diario del negocio sin esperar a reportes periódicos.
-->

# HU-025 — Visualización del resumen diario

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-025 |
| **Título** | Visualización del resumen diario |
| **Módulo** | Reportes |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-027|

---

## Historia

**Como** administrador del negocio, director de operaciones o supervisor de ventas diarias, responsable de la supervisión continua del flujo de caja, monitoreo del punto de venta y evaluación del desempeño comercial,  
**quiero** disponer de un panel de control (Dashboard) ejecutivo e interactivo que me exhiba en tiempo real las métricas e indicadores clave consolidados de la jornada en curso (ventas totales acumuladas, número de transacciones ejecutadas, ingresos por medio de pago y estimación de ganancias netas del día desde las 00:00 hrs),  
**para** evaluar de un solo vistazo la productividad y ritmo comercial del establecimiento durante el día, tomar decisiones operativas o de caja de inmediato, realizar arqueos y comparativas preliminares sin esperar al cierre definitivo de la jornada y monitorear el cumplimiento de las metas diarias de facturación.

---

## Criterios de Aceptación

### CA-025.1 — Tarjetas de métricas consolidadas del día
- **Dado que** accedo al Dashboard principal de la plataforma (`/dashboard`),
- **cuando** la pantalla carga,
- **entonces** debo visualizar tres tarjetas destacadas: "Ventas Totales de Hoy", "Ingresos Percibidos" y "Estimado de Ganancias del Día".

### CA-025.2 — Actualización dinámica ante nuevas ventas
- **Dado que** un vendedor procesa una nueva venta en la terminal de caja,
- **cuando** regreso al Dashboard principal,
- **entonces** los contadores del resumen diario incrementan su valor para reflejar la operación en tiempo real.

### CA-025.3 — Reinicio automático de contadores al cambio de fecha
- **Dado que** el reloj del servidor alcanza las 00:00 horas de un nuevo día,
- **cuando** se consulta el resumen diario,
- **entonces** los acumuladores inician automáticamente en $0.00 para la nueva jornada.

### CA-025.4 — Indicador porcentual comparativo con el día anterior
- **Dado que** observo las tarjetas de resumen diario,
- **cuando** analizo su detalle,
- **entonces** el sistema muestra un porcentaje comparativo relacionando el ritmo de ventas actual con el resultado alcanzado el día anterior a la misma hora.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/dashboard/daily-summary` | Obtiene los indicadores y totales del día actual |

---

## Notas técnicas

- Consulta optimizada filtrando desde `CURRENT_DATE 00:00:00` hasta el momento actual.
- Almacenamiento en caché de corta duración (Redis, 1 a 5 minutos) para evitar sobrecargar la base de datos con solicitudes frecuentes.
