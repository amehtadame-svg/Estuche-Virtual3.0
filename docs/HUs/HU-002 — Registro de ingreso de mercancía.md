# HU-002 — Registro de ingreso de mercancía

## Identificación
CampoValor**ID**HU-002**Título**Registro de ingreso de mercancía**Módulo**Inventario**Prioridad**Alta**Estado**Por Implementar**RF asociados**RF-002

---

## Historia
**Como** administrador,
**quiero** registrar ingreso de mercancía,
**para** actualizar el inventario y mantener las cantidades reales al día.

---

## Criterios de Aceptación

### CA-002.1 — Formulario de recepción de lote

- **Dado que** estoy en la vista de ingreso de mercancía (`/inventory/inbound`),
- **cuando** selecciono un producto existente e ingreso una cantidad a sumar,
- **entonces** el sistema calcula y muestra una vista previa del stock resultante.

### CA-002.2 — Suma automática del stock

- **Dado que** el producto seleccionado tiene un stock actual de 10 unidades,
- **cuando** registro un ingreso de 15 unidades y confirmo la operación,
- **entonces** el stock total del producto en base de datos pasa automáticamente a 25 unidades.

### CA-002.3 — Validación de cantidad de ingreso

- **Dado que** estoy registrando una entrada de mercancía,
- **cuando** ingreso una cantidad menor o igual a cero,
- **entonces** el botón de envío se deshabilita y se muestra el mensaje: "La cantidad ingresada debe ser mayor a 0".

---

## Endpoints
MétodoRutaDescripciónPOST`/api/v1/inventory/inbound`Procesa la entrada y suma stock al producto

---

## Notas técnicas

- Realizar actualización de stock de manera atómica con consultas SQL tipo `UPDATE products SET stock = stock + :qty WHERE id = :id`.
- Se genera un registro de auditoría en la tabla `inventory_movements` asociando el tipo de movimiento como `INBOUND`.
