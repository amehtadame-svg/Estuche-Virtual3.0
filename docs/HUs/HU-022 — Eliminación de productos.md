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

**Como** administrador general de la plataforma o gestor de catálogo comercial, responsable de la depuración, mantenimiento y optimización del listado de mercancías activas en el negocio,  
**quiero** disponer de un mecanismo de eliminación segura que me permita dar de baja o desactivar productos del catálogo que hayan sido descontinuados por fabricantes, registrados por error o que ya no formen parte de la oferta comercial del establecimiento,  
**para** limpiar y depurar las listas de búsqueda del punto de venta (POS) facilitando la operación de las cajas, evitar que los vendedores intenten comercializar mercancías sin disponibilidad futura, y al mismo tiempo preservar la integridad referencial de la base de datos y los reportes contables del pasado mediante una técnica de borrado lógico (*Soft Delete*).

---

## Criterios de Aceptación

### CA-022.1 — Diálogo de confirmación de eliminación
- **Dado que** presiono la opción "Eliminar" sobre un producto en la tabla del catálogo,
- **cuando** se ejecuta la orden,
- **entonces** el sistema presenta una ventana modal de confirmación: "¿Está seguro que desea eliminar este producto? Esta acción lo removerá de los listados activos de venta".

### CA-022.2 — Aplicación de borrado lógico (Soft Delete)
- **Dado que** confirmo la eliminación de un producto con historial de ventas previo,
- **cuando** la solicitud es procesada en el servidor,
- **entonces** el sistema marca el registro como inactivo (`is_active = false`), ocultándolo sin borrar físicamente sus datos de la base de datos.

### CA-022.3 — Ocultamiento en búsquedas del punto de venta
- **Dado que** un producto ha sido desactivado/eliminado,
- **cuando** un vendedor intenta buscarlo en el terminal de caja (`/pos`),
- **entonces** el producto no aparece disponible dentro de los resultados de búsqueda.

### CA-022.4 — Protección de integridad referencial
- **Dado que** un producto tiene transacciones vinculadas en `sale_items`,
- **cuando** se solicita su borrado,
- **entonces** el sistema impide su eliminación física de la base de datos protegiendo los reportes contables del pasado.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| DELETE | `/api/v1/products/{id}` | Desactiva o remueve el producto |

---

## Notas técnicas

- Evitar el uso de `DELETE FROM products WHERE id = :id` si existen dependencias en `sale_items`. Usar columna `deleted_at IS NOT NULL` o `is_active = false`.
