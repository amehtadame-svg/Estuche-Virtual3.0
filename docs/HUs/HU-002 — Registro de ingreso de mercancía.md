# HU-002 — Registro de ingreso de mercancía

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-002 |
| **Título** | Registro de ingreso de mercancía |
| **Módulo** | Inventario |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-002 |

---

## Historia

**Como** encargado de recepción de mercancía o administrador del almacén central, responsable de la recepción física, verificación de pedidos a proveedores y custodia del stock,  
**quiero** utilizar un módulo especializado para registrar las recepciones de nuevos lotes de mercancía que ingresan al almacén, indicando las cantidades exactas recibidas, el número de factura o guía de remisión del proveedor y observaciones del estado de la entrega,  
**para** incrementar de forma matemática y atómica las existencias disponibles en el sistema en tiempo real, mantener sincronizado el inventario físico con los registros digitales, actualizar el costo promedio ponderado de los productos e ir alimentando la bitácora inmutable de recepciones para futuras auditorías.

---

## Criterios de Aceptación

### CA-002.1 — Búsqueda interactiva y pre-cargado del producto a reabastecer
- **Dado que** me encuentro en la pantalla de recepción e ingreso de mercancía (`/inventory/inbound`),
- **cuando** busco un producto escribiendo su nombre o escaneando su código SKU/Barras y lo selecciono del listado predictivo,
- **entonces** el sistema debe mostrar la ficha resumida del producto en pantalla, indicando su imagen descriptiva, categoría, costo de adquisición actual registrado y la cantidad exacta de existencias físicas disponibles al momento en bodega.

### CA-002.2 — Suma automática y actualización atómica en base de datos
- **Dado que** el producto seleccionado cuenta con un stock previo de 15 unidades registradas en la plataforma,
- **cuando** introduzco la cantidad recibida de 25 unidades en el campo "Cantidad a Ingresar" y presiono "Confirmar Ingreso",
- **entonces** el sistema debe ejecutar la suma matemática en el servidor de forma inmediata, actualizando el valor total en la entidad del producto a 40 unidades sin generar lecturas sucias ni inconsistencias por concurrencia.

### CA-002.3 — Validación de valores ingresados y restricción de ceros
- **Dado que** estoy completando la información en el formulario de entrada de lote,
- **cuando** intento enviar el registro dejando el campo de cantidad en blanco o colocando un valor menor o igual a cero (0),
- **entonces** el botón de procesamiento debe deshabilitarse y el sistema desplegará el mensaje de error: "La cantidad de mercancía a ingresar debe ser un número entero mayor a cero".

### CA-002.4 — Auditoría de recepción e historial de movimientos
- **Dado que** la solicitud de ingreso de mercancía ha sido procesada de manera correcta por la base de datos,
- **cuando** el sistema confirma el cambio de estado,
- **entonces** se genera de manera automática e inalterable una entrada en la tabla de movimientos de inventario (`inventory_movements`), guardando la fecha, hora exacta, usuario responsable, lote de recibimiento y cantidad adicionada.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/inventory/inbound` | Registra el ingreso y actualiza el stock |

---

## Notas técnicas

- Realizar actualización de stock de manera atómica con consultas SQL tipo `UPDATE products SET stock = stock + :qty WHERE id = :id`.
- Se genera un registro de auditoría en la tabla `inventory_movements` asociando el tipo de movimiento como `INBOUND`.
