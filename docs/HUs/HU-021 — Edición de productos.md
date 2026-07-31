# HU-021 — Edición de productos

## Identificación
Campo Valor **ID** HU-021 **Título** Edición de productos **Módulo** Inventario **Prioridad** Alta **Estado** Por Implementar **RF asociados** RF-021

---

## Historia
**Como** administrador,
**quiero** editar productos,
**para** corregir descripciones o actualizar sus características en el sistema.

---

## Criterios de Aceptación

### CA-021.1 — Edición de campos permitidos

- **Dado que** selecciono la opción de editar un producto (`/products/{id}/edit`),
- **cuando** modifico datos como nombre, descripción o categoría y presiono "Guardar Cambios",
- **entonces** el sistema actualiza la información en la base de datos y muestra confirmación.

### CA-021.2 — Conservación de historial operativo

- **Dado que** un producto es editado,
- **cuando** consulto sus movimientos históricos o ventas previas,
- **entonces** las transacciones pasadas deben conservar los valores con los que fueron ejecutadas originalmente.

---

## Endpoints
Método Ruta Descripción PUT `/api/v1/products/{id}` Reemplaza/Actualiza la información del producto

---

## Notas técnicas

- Proteger modificaciones masivas mediante validaciones strict DTO (`Data Transfer Object`).

```
