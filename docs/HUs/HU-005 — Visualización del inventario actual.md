# HU-005 — Visualización del inventario actual

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-005 |
| **Título** | Visualización del inventario actual |
| **Módulo** | Inventario |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-005 |

---

## Historia
**Como** administrador,  
**quiero** ver el inventario actual,  
**para** saber qué productos hay disponibles inmediatamente para la venta.

---

## Criterios de Aceptación

### CA-005.1 — Listado general de existencias
- **Dado que** accedo al panel principal de inventario (`/inventory`),
- **cuando** se carga la vista,
- **entonces** debo ver una tabla paginada con la lista actualizada de todos los productos activos con su ID, nombre, precio y stock actual.

### CA-005.2 — Actualización en tiempo real o bajo demanda
- **Dado que** se realiza una venta o un registro de mercancía en otra terminal,
- **cuando** presiono el botón "Refrescar" o navego en la tabla,
- **entonces** se muestran las cantidades reflejando exactamente la base de datos.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/inventory` | Devuelve la lista actual del inventario |

---

## Notas técnicas
- Implementar paginación desde el servidor (`page`, `limit`).
- Incluir índices en la base de datos sobre los campos `is_active` y `name` para optimizar el rendimiento de la consulta.
