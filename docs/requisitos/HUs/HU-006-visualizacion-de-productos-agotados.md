<!--
  ¿Qué? Historia de usuario que describe la visualización de productos sin existencias.
  ¿Para qué? Formalizar la identificación inmediata de artículos agotados.
  ¿Impacto? Previene la venta de productos sin stock y agiliza la reposición.
-->

# HU-006 — Visualización de productos agotados

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-006 |
| **Título** | Visualización de productos agotados |
| **Módulo** | Inventario |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-016|

---

## Historia

**Como** encargado de compras, analista de inventarios o jefe de almacén, responsable de evitar quiebres de stock y garantizar el flujo continuo de abastecimiento,  
**quiero** filtrar y consultar una vista consolidada de alta prioridad que me exponga exclusivamente aquellos productos activos del catálogo cuyas existencias registradas en bodega hayan alcanzado exactamente las cero (0) unidades,  
**para** identificar de manera inmediata la mercancía completamente desabastecida, priorizar la elaboración y emisión urgente de órdenes de compra a proveedores, prevenir la pérdida continua de ingresos por ventas no concretadas en el punto de venta y mantener la continuidad operativa del catálogo.

---

## Criterios de Aceptación

### CA-006.1 — Filtro estricto de productos con existencias en cero
- **Dado que** me ubico en el módulo de inventario e ingreso a la pestaña "Agotados" (`/inventory/out-of-stock`),
- **cuando** la consulta se ejecuta contra la base de datos,
- **entonces** la pantalla debe mostrar un listado exclusivo de los productos cuyo valor en la columna de stock sea exactamente igual a cero (0).

### CA-006.2 — Mensaje descriptivo para catálogo sin desabasto
- **Dado que** todos los productos activos dentro del sistema tienen existencias disponibles (stock > 0),
- **cuando** consulto la sección de productos agotados,
- **entonces** la pantalla debe mostrar un contenedor informativo con el mensaje: "Excelente: En este momento no existen productos agotados en el inventario".

### CA-006.3 — Redirección a reabastecimiento rápido
- **Dado que** estoy revisando la lista de productos en estado agotado,
- **cuando** presiono el botón "Reabastecer" situado en la fila de un producto específico,
- **entonces** el sistema debe redirigirme al formulario de ingreso de mercancía (`/inventory/inbound`) con los datos de dicho producto seleccionados por defecto.

### CA-006.4 — Exportación de reporte de mercancía desabastecida
- **Dado que** visualizo el listado de productos agotados en pantalla,
- **cuando** hago clic en el botón "Exportar Lista",
- **entonces** el sistema debe descargar un documento formateado en Excel o PDF con el detalle de los artículos agotados para su entrega al departamento de compras.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/inventory/out-of-stock` | Consulta productos con cantidad cero |

---

## Notas técnicas

- Endpoint especializado o parámetro de consulta opcional en endpoint principal: `/api/v1/products?stock=0`.
- Optimizar la consulta mediante la cláusula `WHERE stock = 0 AND is_active = true`.
