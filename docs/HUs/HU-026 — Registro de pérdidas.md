# HU-026 — Registro de pérdidas

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-026 |
| **Título** | Registro de pérdidas |
| **Módulo** | Inventario |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-026 |

---

## Historia

**Como** administrador o responsable de inventarios,  
**quiero** registrar formalmente la baja de mercancía mermada por daños, caducidad, roturas o extravío, ingresando la cantidad de unidades afectadas y la justificación aclaratoria del caso,  
**para** descontar las existencias reales mermadas del almacén, registrar la pérdida financiera correspondiente y mantener la transparencia del stock.

---

## Criterios de Aceptación

### CA-026.1 — Declaración de baja por merma o pérdida
- **Dado que** accedo al módulo de pérdidas de inventario (`/inventory/losses`),
- **cuando** selecciono un producto, indico la cantidad de unidades dañadas o extraviadas y elijo el motivo (ej. Vencimiento, Daño, Robo),
- **entonces** se habilita la opción para procesar la baja.

### CA-026.2 — Justificación de texto obligatoria para el registro
- **Dado que** estoy declarando una pérdida de mercancía en el formulario,
- **cuando** dejo vacío el campo de observación/nota aclaratoria y presiono "Guardar Pérdida",
- **entonces** el sistema detiene la operación informando: "Debe ingresar una nota o justificación obligatoria sobre la pérdida".

### CA-026.3 — Descuento automático de existencias en el inventario
- **Dado que** confirmo la declaración de una pérdida de 3 unidades sobre un producto,
- **cuando** el sistema guarda la transacción,
- **entonces** las existencias del producto en la base de datos se reducen de forma inmediata en 3 unidades.

### CA-026.4 — Registro del impacto financiero del descuadre
- **Dado que** se procesa el registro de una pérdida de mercancía,
- **cuando** la base de datos almacena el movimiento,
- **entonces** calcula el costo contable de la pérdida multiplicando las unidades descontadas por el costo de adquisición del producto.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/inventory/losses` | Registra la merma y descuenta del stock |

---

## Notas técnicas

- Descuento de stock en la tabla `products` e inserción del registro correspondiente en `inventory_losses` indicando la razón y el ID del usuario autorizador.
