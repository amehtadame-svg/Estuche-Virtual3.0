# HU-026 — Registro de pérdidas

## Identificación
CampoValor**ID**HU-026**Título**Registro de pérdidas**Módulo**Inventario**Prioridad**Media**Estado**Por Implementar**RF asociados**RF-026

---

## Historia
**Como** administrador,
**quiero** registrar pérdidas,
**para** controlar errores, daños o robos descontando del stock los productos faltantes.

---

## Criterios de Aceptación

### CA-026.1 — Declaración de pérdida o merma

- **Dado que** estoy en el formulario de pérdidas (`/inventory/losses`),
- **cuando** elijo un producto, especifico las unidades perdidas y el motivo (ej. "Dañado", "Robo", "Vencido"),
- **entonces** el sistema registra la pérdida y descuenta las unidades del inventario actual.

### CA-026.2 — Justificación obligatoria

- **Dado que** intento registrar una pérdida sin indicar el motivo,
- **cuando** presiono "Guardar Registro",
- **entonces** el sistema indica: "Debe ingresar una justificación para la merma o pérdida".

---

## Endpoints
MétodoRutaDescripciónPOST`/api/v1/inventory/losses`Procesa la baja por pérdida y descuenta stock

---

## Notas técnicas

- Descuento de stock en la tabla `products` e inserción del registro correspondiente en `inventory_losses` indicando la razón y el ID del usuario autorizador.
