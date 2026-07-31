# HU-010 — Visualización del historial de movimientos

## Identificación

- **ID:** HU-010
- **Título:** Visualización del historial de movimientos
- **Módulo:** Auditoría
- **Prioridad:** Media
- **Estado:** Por Implementar
- **RF asociados:** RF-010

---

## Historia

**Como** administrador,  
**quiero** ver historial de movimientos,  
**para** realizar auditorías sobre las entradas y salidas de stock registradas.

---

## Criterios de Aceptación

### CA-010.1 — Bitácora completa de movimientos

- **Dado que** estoy en la vista de historial de movimientos (`/inventory/history`),
- **cuando** consulto la bitácora,
- **entonces** el sistema presenta un listado con fecha, hora, tipo de movimiento (Entrada, Salida, Venta, Pérdida), cantidad modificada y el usuario responsable.

### CA-010.2 — Filtro por producto específico

- **Dado que** selecciono un producto en el buscador del historial,
- **cuando** aplico el filtro,
- **entonces** el sistema despliega únicamente la cronología completa de cambios de stock referentes a ese producto.

---

## Endpoints

- **GET** `/api/v1/inventory/movements` — Consulta los logs de movimientos de stock

---

## Notas técnicas

- Colección / tabla `inventory_movements` inmutable (Append-only pattern).
- Sin operaciones de actualización o eliminación en esta tabla para asegurar integridad de la auditoría.
