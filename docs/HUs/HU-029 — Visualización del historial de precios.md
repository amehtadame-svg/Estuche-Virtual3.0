# HU-029 — Visualización del historial de precios

## Identificación
CampoValor**ID**HU-029**Título**Visualización del historial de precios**Módulo**Auditoría**Prioridad**Baja**Estado**Por Implementar**RF asociados**RF-029

---

## Historia
**Como** administrador,
**quiero** ver historial de precios,
**para** llevar un control financiero del incremento o variación de los costos de mis productos.

---

## Criterios de Aceptación

### CA-029.1 — Timeline de cambios de precio

- **Dado que** accedo al detalle de historial de un producto (`/products/{id}/price-history`),
- **cuando** se carga la vista,
- **entonces** el sistema muestra una línea de tiempo con cada precio anterior, el nuevo valor modificado, la fecha de cambio y el usuario que lo autorizó.

---

## Endpoints
MétodoRutaDescripciónGET`/api/v1/products/{id}/price-history`Consulta los registros históricos de precio

---

## Notas técnicas

- Cada actualización sobre el campo `price` en la tabla `products` dispara una inserción secundaria automática hacia la tabla `price_history`.
