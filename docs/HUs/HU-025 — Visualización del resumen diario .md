# HU-025 — Visualización del resumen diario

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-025 |
| **Título** | Visualización del resumen diario |
| **Módulo** | Reportes |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-025 |

---

## Historia

**Como** administrador o supervisor del negocio,  
**quiero** disponer de un panel de control (Dashboard) que exhiba en tiempo real las métricas consolidadas del día en curso (ventas acumuladas, ingresos en caja y estimación de ganancias),  
**para** evaluar de un solo vistazo el desempeño de la jornada de trabajo, tomar decisiones operativas de inmediato y realizar arqueos preliminares sin esperar al cierre de caja.

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
