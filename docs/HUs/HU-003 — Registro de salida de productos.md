# HU-003 — Registro de salida de productos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-003 |
| **Título** | Registro de salida de productos |
| **Módulo** | Inventario |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-003 |

---

## Historia

**Como** supervisor de inventarios o administrador de almacén, responsable del resguardo, custodia física, ordenamiento y concordancia de las existencias teóricas y reales en bodega,  
**quiero** disponer de una funcionalidad dedicada que me permita registrar manualmente los retiros o salidas de productos del almacén que no correspondan a ventas comerciales directas (tales como transferencias entre sucursales, consumo interno administrativo, muestras comerciales o mermas por daño), especificando las cantidades a retirar y la justificación obligatoria,  
**para** descontar en tiempo real las existencias teóricas del sistema, evitar sobrestimaciones de disponibilidad en la tienda, mantener exactitud plena entre los recuentos físicos y digitales, y dejar respaldada cada salida manual con su respectivo motivo de auditoría.

---

## Criterios de Aceptación

### CA-003.1 — Formulario de salida manual con motivo de retiro obligatorio
- **Dado que** accedo a la interfaz de salidas de almacén (`/inventory/outbound`),
- **cuando** selecciono un producto e indico la cantidad de unidades a retirar junto con la selección obligatoria del motivo del egreso (ej. Traslado, Muestra, Consumo interno),
- **entonces** el sistema valida que los campos estén correctos y habilita el botón para procesar la salida.

### CA-003.2 — Descuento en tiempo real y actualización de stock disponible
- **Dado que** el producto seleccionado registra un stock actual de 50 unidades en la base de datos,
- **cuando** confirmo la salida manual de 10 unidades y presiono "Procesar Salida",
- **entonces** el sistema descuenta la cantidad indicada y actualiza las existencias visibles a 40 unidades en la tabla general de productos.

### CA-003.3 — Bloqueo de egreso por sobrestock o existencias insuficientes
- **Dado que** un producto seleccionado posee únicamente 5 unidades disponibles en el inventario real,
- **cuando** intento ingresar y procesar una salida manual por una cantidad superior (ej. 10 unidades),
- **entonces** el sistema debe denegar la operación, detener el guardado y mostrar la advertencia: "No se puede procesar la salida: La cantidad solicitada excede el stock actual disponible en el almacén (Disponible: 5 unidades)".

### CA-003.4 — Confirmación de seguridad previa a la afectación
- **Dado que** he ingresado una salida de mercancía válida en el formulario,
- **cuando** hago clic en el botón de procesamiento,
- **entonces** el sistema debe presentar una ventana modal de confirmación mostrando el resumen del retiro y solicitando la revalidación del usuario antes de alterar permanentemente la base de datos.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/inventory/outbound` | Registra la salida y resta del stock |

---

## Notas técnicas
- Aplicar validación de condición de carrera (race condition) o bloqueo optimista/pesimista (`SELECT FOR UPDATE`) para evitar que el stock sea menor que cero.
- Registrar el movimiento en `inventory_movements` con el tipo `OUTBOUND`.
