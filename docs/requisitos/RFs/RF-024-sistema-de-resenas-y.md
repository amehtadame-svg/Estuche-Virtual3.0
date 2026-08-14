<!--
  ¿Qué? Requisito funcional que describe la calificación y comentarios de productos comprados.
  ¿Para qué? Definir las reglas para publicar reseñas verificadas de compra.
  ¿Impacto? Genera confianza en nuevos compradores mediante retroalimentación real.
-->

# RF-024 — Sistema de Reseñas y Calificaciones

**Historia de usuario relacionada**: HU-040

## Descripción

El sistema debe permitir a los clientes calificar de 1 a 5 y comentar productos que hayan comprado, evitando reseñas duplicadas por el mismo usuario sobre el mismo producto.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El cliente accede a un producto de un pedido entregado. |
| 2 | Selecciona una calificación de 1 a 5 estrellas y escribe un comentario opcional. |
| 3 | El sistema valida que el usuario no haya calificado antes ese producto. |
| 4 | La reseña se guarda y queda visible públicamente en la ficha del producto. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | La calificación debe ser un entero entre 1 y 5. |
| RN-002 | Un usuario solo puede reseñar una vez cada producto (`UNIQUE`). |
| RN-003 | Las reseñas son visibles públicamente sin necesidad de autenticación. |

---

## Inputs / Outputs

### Input

```json
{
  "id_producto": 12,
  "calificacion": 5,
  "comentario": "Excelente calidad, llegó a tiempo."
}
```

### Output éxito (HTTP 201)

```json
{
  "mensaje": "Reseña publicada correctamente."
}
```

### Output error (HTTP 409)

```json
{
  "error": "Ya has calificado este producto anteriormente."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/resenas` | Sí | Registra una reseña sobre un producto. |
| GET | `/api/productos/{id}/resenas` | No | Lista las reseñas públicas de un producto. |
