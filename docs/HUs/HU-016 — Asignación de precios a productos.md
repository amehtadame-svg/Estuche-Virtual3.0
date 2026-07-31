# HU-016 — Asignación de precios a productos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-016 |
| **Título** | Asignación de precios a productos |
| **Módulo** | Productos |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-016 |

---

## Historia

**Como** administrador general del sistema,  
**quiero** modificar y asignar los precios de venta comerciales de cualquier producto del catálogo,  
**para** ajustar las tarifas comerciales ante cambios en los costos de adquisición de proveedores, implementar cambios de precios por campañas u oferta y asegurar que el punto de venta aplique siempre los precios vigentes.

---

## Criterios de Aceptación

### CA-016.1 — Modificación de precio de venta al público
- **Dado que** selecciono la ficha o fila de un producto del catálogo,
- **cuando** edito el valor del campo "Precio de Venta" ingresando un número positivo y presiono "Guardar Precio",
- **entonces** el sistema actualiza la tarifa del producto en la base de datos de forma inmediata.

### CA-016.2 — Bloqueo de precios menores o iguales a cero
- **Dado que** me encuentro modificando el precio de un producto,
- **cuando** introduzco una cifra menor o igual a cero (0),
- **entonces** el sistema rechaza el valor notificando: "El precio de venta debe ser un número positivo mayor a cero".

### CA-016.3 — Advertencia preventiva por precio menor al costo
- **Dado que** un producto tiene registrado un costo de adquisición de $10.00,
- **cuando** intento fijarle un precio de venta comercial de $8.00,
- **entonces** el sistema despliega una alerta de advertencia: "Atención: El precio asignado ($8.00) es inferior al costo de adquisición ($10.00). ¿Desea confirmar la operación?".

### CA-016.4 — Actualización en tiempo real en el punto de venta
- **Dado que** se ha guardado exitosamente el nuevo precio de un producto,
- **cuando** un vendedor selecciona dicho producto en el terminal del punto de venta (`/pos`),
- **entonces** el artículo se carga automáticamente reflejando la nueva tarifa actualizada.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| PATCH | `/api/v1/products/{id}/price` | Modifica el precio asignado al producto |

---

## Notas técnicas

- Auditar cada cambio de precio almacenando el estado anterior y el nuevo en `price_history`.

