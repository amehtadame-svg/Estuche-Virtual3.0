# HU-003 — Registro de salida de productos

## Identificación
- ID: HU-003
- Título: Registro de salida de productos
- Módulo: Inventario
- Prioridad: Alta
- Estado: Por Implementar
- RF asociados: RF-003

---

## Historia
Como administrador, quiero registrar salida de productos, para controlar lo vendido o retirado físicamente del almacén.

---

## Criterios de Aceptación

### CA-003.1 — Formulario de salida manual
- Dado que accedo al módulo de salida manual de inventario (`/inventory/outbound`),
- cuando elijo un producto y defino la cantidad a retirar junto con un motivo,
- entonces el sistema valida que haya disponibilidad suficiente.

### CA-003.2 — Descuento automático de inventario
- Dado que un producto cuenta con un stock de 20 unidades,
- cuando registro una salida de 5 unidades,
- entonces el sistema descuenta el stock dejando la existencia total en 15 unidades.

### CA-003.3 — Bloqueo de salida por sobrestock
- Dado que un producto cuenta con 3 unidades en stock,
- cuando intento registrar una salida de 5 unidades,
- entonces el sistema impide el registro y muestra el error: "La cantidad a retirar excede el stock actual disponible".

---

## Endpoints
- Método: POST
- Ruta: `/api/v1/inventory/outbound`
- Descripción: Procesa la salida manual y reduce el stock

---

## Notas técnicas
- Aplicar validación de condición de carrera (race condition) o bloqueo optimista/pesimista (`SELECT FOR UPDATE`) para evitar que el stock sea menor que cero.
- Registrar el movimiento en `inventory_movements` con el tipo `OUTBOUND`.
