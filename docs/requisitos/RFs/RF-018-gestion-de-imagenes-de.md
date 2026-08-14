<!--
  ¿Qué? Requisito funcional que describe la administración de imágenes asociadas a un producto.
  ¿Para qué? Definir cómo se cargan, ordenan y designa la imagen principal de cada producto.
  ¿Impacto? La calidad visual del catálogo influye directamente en la decisión de compra.
-->

# RF-018 — Gestión de Imágenes de Producto

**Historia de usuario relacionada**: HU-001

## Descripción

El sistema debe permitir cargar una o varias imágenes por producto, definir cuál es la imagen principal y su orden de visualización.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El proveedor o administrador sube una o varias imágenes para un producto. |
| 2 | El sistema valida el formato (JPG, PNG, WEBP) y el tamaño máximo permitido. |
| 3 | Las imágenes se almacenan y se registran en `imagenes_producto`. |
| 4 | El usuario puede marcar una imagen como principal (`principal = true`). |
| 5 | El sistema garantiza que solo exista una imagen principal por producto. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo se aceptan formatos JPG, PNG o WEBP. |
| RN-002 | El peso máximo por imagen es 5 MB. |
| RN-003 | Solo puede existir una imagen `principal = true` por producto. |

---

## Inputs / Outputs

### Input

```json
{
  "id_producto": 12,
  "url": "https://cdn.estuchevirtual.com/prod12-a.jpg",
  "principal": true
}
```

### Output éxito (HTTP 201)

```json
{
  "mensaje": "Imagen agregada correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "El formato de la imagen no es válido."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/productos/{id}/imagenes` | Sí | Sube una imagen para el producto. |
| PATCH | `/api/imagenes/{id}/principal` | Sí | Marca una imagen como principal. |
| DELETE | `/api/imagenes/{id}` | Sí | Elimina una imagen del producto. |
