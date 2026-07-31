# HU-016 — Asignación de precios a productos

## Identificación
CampoValor**ID**HU-016**Título**Asignación de precios a productos**Módulo**Productos**Prioridad**Alta**Estado**Por Implementar**RF asociados**RF-016

---

## Historia
**Como** administrador,
**quiero** asignar precios a productos,
**para** controlar el valor comercial de las ventas y márgenes de ganancia.

---

## Criterios de Aceptación

### CA-016.1 — Actualización de precio de venta

- **Dado que** edito un producto desde la vista de gestión de catálogo,
- **cuando** modifico el campo "Precio de Venta" e introduzco un valor válido mayor que cero,
- **entonces** el sistema guarda el nuevo precio y lo hace efectivo de inmediato en el módulo de ventas.

### CA-016.2 — Bloqueo de precio inválido

- **Dado que** introduzco un precio de cero o valor negativo,
- **cuando** intento guardar los cambios,
- **entonces** el sistema rechaza la operación notificando: "El precio asignado debe ser superior a cero".

---

## Endpoints
MétodoRutaDescripciónPATCH`/api/v1/products/{id}/price`Modifica el valor numérico del precio

---

## Notas técnicas

- Auditar cada cambio de precio almacenando el estado anterior y el nuevo en `price_history`.

