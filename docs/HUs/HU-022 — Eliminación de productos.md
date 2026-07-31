# HU-022 — Eliminación de productos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-022 |
| **Título** | Eliminación de productos |
| **Módulo** | Inventario |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-022 |

---

## Historia

**Como** administrador,
**quiero** eliminar productos,
**para** limpiar el inventario removiendo los que ya no están disponibles o descontinuados.

---

## Criterios de Aceptación

### CA-022.1 — Eliminación lógica (Soft Delete)

- **Dado que** selecciono la opción "Eliminar" sobre un producto con historial de ventas,
- **cuando** confirmo el mensaje de advertencia,
- **entonces** el sistema realiza un borrado lógico (cambiando `is_active = false`), ocultándolo de los listados activos de ventas sin borrar su historial.

### CA-022.2 — Intentos de venta de producto desactivado

- **Dado que** un producto ha sido desactivado/eliminado,
- **cuando** se busca en el punto de venta,
- **entonces** no aparece disponible para ser comercializado.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| DELETE | `/api/v1/products/{id}` | Desactiva lógicamente el producto del sistema |

---

## Notas técnicas

- Evitar el uso de `DELETE FROM products WHERE id = :id` si existen dependencias en `sale_items`. Usar columna `deleted_at IS NOT NULL` o `is_active = false`.
