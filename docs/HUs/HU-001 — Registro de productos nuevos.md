# HU-001 — Registro de productos nuevos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-001 |
| **Título** | Registro de productos nuevos |
| **Módulo** | Inventario |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-001 |

---

## Historia
**Como** administrador,
**quiero** registrar productos nuevos,
**para** llevar el control del inventario y ofertar nuevo stock a los clientes.

---

## Criterios de Aceptación

### CA-001.1 — Campos obligatorios del formulario

- **Dado que** me encuentro en el módulo de inventario en la vista de registro (`/inventory/products/new`),
- **cuando** visualizo el formulario,
- **entonces** debo observar los campos requeridos: nombre del producto, precio unitario de venta y cantidad inicial de stock.

### CA-001.2 — Validación de datos del producto

- **Dado que** estoy completando el formulario de nuevo producto,
- **cuando** ingreso un precio menor o igual a cero o una cantidad de stock negativa,
- **entonces** el sistema debe mostrar el mensaje de validación: "El precio y el stock deben ser valores positivos".

### CA-001.3 — Registro exitoso en base de datos

- **Dado que** he ingresado un nombre válido, precio mayor a cero y un stock inicial válido,
- **cuando** hago clic en el botón "Guardar Producto",
- **entonces** el producto se persiste en la base de datos y se muestra la notificación: "Producto registrado exitosamente".

### CA-001.4 — Control de duplicados por nombre o código

- **Dado que** intento registrar un producto con un nombre idéntico a uno previamente guardado,
- **cuando** confirmo la creación,
- **entonces** el sistema debe retornar el mensaje de error: "Ya existe un producto con el mismo nombre registrado".

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/products` | Guarda los datos del nuevo producto en la BD |

---

## Notas técnicas

- Operación envuelta en transacción mediante `ProductService`.
- Validación de unicidad sobre el campo de búsqueda rápida `name` indexado.
- El campo `stock` debe inicializarse en la entidad `Product` garantizando restricciones de integridad (`CHECK stock >= 0`).
