# HU-010 — Visualización del historial de movimientos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-010 |
| **Título** | Visualización del historial de movimientos |
| **Módulo** | Auditoría |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-010 |

---

## Historia

**Como** auditor del sistema o supervisor de operaciones de inventario,  
**quiero** consultar una bitácora inalterable y cronológica con el registro de todos los movimientos de entrada, salida, venta, ajuste o pérdida aplicados al inventario,  
**para** realizar auditorías detalladas sobre el stock, rastrear la trazabilidad histórica de cualquier mercancía, detectar irregularidades o descuadres y verificar qué usuario autorizó y ejecutó cada transacción.

---

## Criterios de Aceptación

### CA-010.1 — Presentación de bitácora cronológica e inmutable
- **Dado que** me dirijo a la pantalla de historial de movimientos de auditoría (`/inventory/history`),
- **cuando** la interfaz completa su carga,
- **entonces** debo observar una bitácora ordenada cronológicamente que detalle: Fecha/Hora exacta, Producto, Categoría de movimiento (Entrada/Salida/Venta/Merma), Cantidad modificada y Nombre del usuario responsable.

### CA-010.2 — Filtro especializado de trazabilidad por producto
- **Dado que** necesito consultar los movimientos históricos de un producto en particular,
- **cuando** selecciono dicho producto en el buscador del historial,
- **entonces** la bitácora se actualiza mostrando únicamente las transacciones que hayan afectado el stock de ese producto específico.

### CA-010.3 — Filtro por tipo de movimiento operativo
- **Dado que** me encuentro revisando el historial de auditoría,
- **cuando** selecciono un filtro por el tipo de movimiento "Pérdidas/Mermas",
- **entonces** el sistema presenta únicamente los registros de salida atribuidos a ese motivo específico.

### CA-010.4 — Garantía de inmutabilidad y ausencia de acciones de edición
- **Dado que** estoy consultando los registros de auditoría en el historial,
- **cuando** interactúo con la interfaz,
- **entonces** confirmo que el sistema no posee ningún botón, opción o menú que permita modificar, alterar o eliminar los registros históricos presentados.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/inventory/movements` | Muestra la bitácora de movimientos de stock |

---

## Notas técnicas

- Colección / tabla `inventory_movements` inmutable (Append-only pattern).
- Sin operaciones de actualización o eliminación en esta tabla para asegurar integridad de la auditoría.
