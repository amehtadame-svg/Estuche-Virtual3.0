# HU-013 — Venta de combos

## Identificación
CampoValor**ID**HU-013**Título**Venta de combos**Módulo**Ventas**Prioridad**Alta**Estado**Por Implementar**RF asociados**RF-013

---

## Historia
**Como** vendedor,
**quiero** vender combos,
**para** agilizar la atención registrando paquetes completos de forma rápida.

---

## Criterios de Aceptación

### CA-013.1 — Descuento diferido por paquete

- **Dado que** un combo escolar incluye 1 Cuaderno y 1 Lápiz,
- **cuando** selecciono el combo en el punto de venta y proceso la transacción,
- **entonces** el sistema descuenta automáticamente 1 unidad del stock de Cuadernos y 1 unidad del stock de Lápices.

### CA-013.2 — Validación de disponibilidad de componentes

- **Dado que** uno de los componentes de un combo no posee stock suficiente en inventario,
- **cuando** intento seleccionar o procesar la venta de dicho combo,
- **entonces** el sistema impide la venta indicando: "No se puede vender el combo: [Nombre de Producto] se encuentra agotado".

---

## Endpoints
MétodoRutaDescripciónPOST`/api/v1/sales/combo`Procesa la venta de un combo y sus ítems

---

## Notas técnicas

- Se debe iterar sobre la lista de componentes dentro de la misma transacción de venta.
- Bloquear en base de datos todos los productos que forman parte del combo antes de restar sus existencias.
