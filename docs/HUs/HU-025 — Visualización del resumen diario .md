# HU-025 — Visualización del resumen diario

## Identificación
CampoValor**ID**HU-025**Título**Visualización del resumen diario**Módulo**Reportes**Prioridad**Alta**Estado**Por Implementar**RF asociados**RF-025

---

## Historia
**Como** administrador,
**quiero** ver resumen diario,
**para** tener un control rápido e inmediato de las ventas, ingresos y ganancias del día en curso.

---

## Criterios de Aceptación

### CA-025.1 — Métricas del día en curso

- **Dado que** accedo al Dashboard principal (`/dashboard`),
- **cuando** la pantalla se renderiza,
- **entonces** debo observar tres indicadores principales acumulados desde las 00:00h del día actual: Total Vendido, Total Ingresos y Estimado de Ganancias del día.

### CA-025.2 — Actualización tras nuevas ventas

- **Dado que** se completa una nueva venta en el sistema,
- **cuando** regreso al Dashboard,
- **entonces** las cifras del resumen diario se recalculan agregando la nueva transacción.

---

## Endpoints
MétodoRutaDescripciónGET`/api/v1/dashboard/daily-summary`Retorna los totales acumulados del día actual

---

## Notas técnicas

- Consulta optimizada filtrando desde `CURRENT_DATE 00:00:00` hasta el momento actual.
- Almacenamiento en caché de corta duración (Redis, 1 a 5 minutos) para evitar sobrecargar la base de datos con solicitudes frecuentes.
