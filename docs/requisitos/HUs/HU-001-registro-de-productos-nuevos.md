<!--
  ¿Qué? Historia de usuario que describe el alta de nuevos productos al catálogo de inventario.
  ¿Para qué? Formalizar el proceso mediante el cual el administrador incorpora artículos nuevos al sistema.
  ¿Impacto? Es la puerta de entrada del catálogo — sin este registro no hay productos disponibles para la venta.
-->

# HU-001 — Registro de productos nuevos

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-001 |
| **Título** | Registro de productos nuevos |
| **Módulo** | Inventario |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-003, RF-018|

---

## Historia

**Como** administrador general del sistema de inventarios, encargado directo de la gestión del catálogo comercial, homologación de productos y estructuración de la oferta del negocio,  
**quiero** disponer de un formulario interactivo e integral dentro del módulo administrativo que me permita capturar minuciosamente la ficha técnica completa de cada artículo nuevo (nombre comercial, código SKU único, código de barras, categoría comercial, precio de costo de adquisición, precio de venta al público con impuestos, margen de ganancia configurado, punto de reorden y stock inicial recibido en bodega),  
**para** incorporar formalmente nuevos ítems al catálogo digital activo de la empresa, asegurar la disponibilidad inmediata del producto en el punto de venta (POS), garantizar un control estricto de trazabilidad desde su primer ingreso al almacén y evitar descuadres contables o la circulación de productos sin registro fiscal o comercial.

---

## Criterios de Aceptación

### CA-001.1 — Formulario completo de alta con validación de campos obligatorios
- **Dado que** me encuentro autenticado con credenciales de administrador e ingreso al módulo de inventarios en la ruta (`/inventory/products/new`),
- **cuando** el navegador termina de renderizar todos los componentes del formulario,
- **entonces** debo visualizar claramente los campos requeridos: Nombre comercial del producto, Código SKU/Barras único, Categoría asignada, Costo de adquisición, Precio de venta al público y Stock inicial, cada uno acompañado de un indicador visual de campo obligatorio (*) y un mensaje tooltip explicativo.

### CA-001.2 — Validación estricta de reglas de negocio y restricciones numéricas
- **Dado que** me encuentro completando el formulario de registro de un nuevo producto comercial,
- **cuando** ingreso un monto numérico menor o igual a cero (0) en los campos "Precio de Venta" o "Costo de Adquisición", o coloco una cifra negativa en "Stock Inicial", y presiono el botón "Guardar Producto",
- **entonces** el sistema debe detener inmediatamente el envío, resaltar en color rojo los campos inválidos y desplegar la alerta: "El precio de venta y el costo de adquisición deben ser valores numéricos estrictamente mayores a cero, y el stock inicial no puede contener cifras negativas".

### CA-001.3 — Control de duplicidad por código de barras, SKU y nombre comercial
- **Dado que** escribo o escaneo un código SKU/Barras o un nombre comercial que ya existe asignado a otro producto en la base de datos,
- **cuando** el formulario ejecuta la validación en tiempo real al perder el foco el campo o al presionar "Guardar Producto",
- **entonces** el servidor debe rechazar la inserción del registro, cancelar la transacción en la base de datos y mostrar el mensaje: "No se puede completar el registro: Ya existe un producto almacenado con el mismo código SKU o nombre comercial dentro del sistema".

### CA-001.4 — Persistencia exitosa, notificación de estado y redirección al catálogo
- **Dado que** he completado la totalidad de los campos obligatorios y opcionales con información válida y verificada,
- **cuando** hago clic en el botón de acción principal "Guardar Producto",
- **entonces** el sistema debe almacenar el registro en la base de datos, asignar automáticamente el estado activo (`is_active = true`), registrar la marca de tiempo de creación, desplegar la notificación flotante "Producto registrado exitosamente en el catálogo" y redirigirme automáticamente a la vista principal del inventario (`/inventory`).

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
