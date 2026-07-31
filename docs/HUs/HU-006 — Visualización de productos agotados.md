# HU-006 — Visualización de productos agotados

## Identificación
CampoValor**ID**HU-006**Título**Visualización de productos agotados**Módulo**Inventario**Prioridad**Media**Estado**Por Implementar**RF asociados**RF-006

---

## Historia
**Como** administrador,
**quiero** ver productos agotados,
**para** reabastecer a tiempo y no dejar de vender por falta de stock.

---

## Criterios de Aceptación

### CA-006.1 — Filtro rápido de productos sin stock

- **Dado que** estoy en el módulo de inventario (`/inventory/out-of-stock`),
- **cuando** selecciono la vista o pestaña "Agotados",
- **entonces** el sistema debe desplegar únicamente los productos cuya cantidad de stock sea igual a 0.

### CA-006.2 — Mensaje de lista vacía

- **Dado que** todos los productos del catálogo tienen al menos 1 unidad disponible,
- **cuando** consulto la sección de agotados,
- **entonces** la pantalla muestra el mensaje: "No hay productos agotados actualmente".

---

## Endpoints
MétodoRutaDescripciónGET`/api/v1/inventory/out-of-stock`Consulta productos con condición `stock = 0`

---

## Notas técnicas

- Endpoint especializado o parámetro de consulta opcional en endpoint principal: `/api/v1/products?stock=0`.
- Optimizar la consulta mediante la cláusula `WHERE stock = 0 AND is_active = true`.
