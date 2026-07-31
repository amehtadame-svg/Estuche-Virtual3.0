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

**Como** administrador o director financiero del negocio,  
**quiero** contar con un generador de reportes de ventas que me permita especificar rangos de fechas flexibles (días, semanas, meses) para calcular y presentar métricas e indicadores de rendimiento comercial,  
**para** evaluar los ingresos acumulados por ventas, medir el volumen de transacciones ejecutadas, conocer el promedio de consumo de los clientes y fundamentar la toma de decisiones estratégicas en datos estadísticos reales.

---

## Criterios de Aceptación

### CA-008.1 — Selección de rango de fechas de consulta en el reporte
- **Dado que** me ubico en el módulo de reportes de ventas (`/reports/sales`),
- **cuando** elijo una fecha de inicio y una fecha de fin en los selectores de calendario y hago clic en "Generar Reporte",
- **entonces** el sistema procesa las órdenes del período y presenta el informe consolidado en pantalla.

### CA-008.2 — Validación de coherencia en el rango de fechas seleccionadas
- **Dado que** me encuentro configurando los parámetros del reporte de ventas,
- **cuando** elijo una fecha inicial que es cronológicamente posterior a la fecha final de la consulta,
- **entonces** el sistema debe detener la ejecución de la búsqueda y desplegar el mensaje de error: "Rango no válido: La fecha de inicio no puede ser posterior a la fecha final".

### CA-008.3 — Despliegue de tarjetas con indicadores clave de rendimiento (KPIs)
- **Dado que** el reporte de ventas finaliza su cálculo exitosamente,
- **cuando** la vista renderiza los resultados,
- **entonces** debo visualizar claramente: Monto Total Facturado, Cantidad de Órdenes Procesadas, Ticket Promedio por Venta y Total de Unidades Comercializadas.

### CA-008.4 — Manejo de períodos de consulta sin actividad de ventas
- **Dado que** ejecuto el reporte en un rango de fechas en el que no se registraron ventas en la plataforma,
- **cuando** concluye la consulta en la base de datos,
- **entonces** el sistema debe presentar todos los contadores numéricos en $0.00 junto al texto: "No se registraron ventas en el período de tiempo seleccionado".


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/sales` | Retorna el reporte de ventas por rango de fechas |

---

## Notas técnicas

- Usar agregaciones en base de datos (`SUM`, `COUNT`) optimizadas con índices compuestos en `sales.created_at`.
- Retornar objeto JSON con los totales globales y el desglose en el rango de fechas solicitado.
