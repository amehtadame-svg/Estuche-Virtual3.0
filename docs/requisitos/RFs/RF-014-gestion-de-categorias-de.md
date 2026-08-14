<!--
  ¿Qué? Requisito funcional que describe la administración de categorías del catálogo.
  ¿Para qué? Definir cómo se crean y mantienen las categorías que clasifican los productos.
  ¿Impacto? Ordena el catálogo y habilita el filtrado por categoría en la tienda.
-->

# RF-014 — Gestión de Categorías de Productos

**Historia de usuario relacionada**: HU-028

## Descripción

El sistema debe permitir que los administradores creen, editen y eliminen categorías de productos, garantizando que cada producto pertenezca a una categoría válida.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El administrador accede al módulo de categorías. |
| 2 | Registra el nombre y la descripción de una nueva categoría. |
| 3 | El sistema valida que el nombre no esté duplicado. |
| 4 | La categoría queda disponible para asociarse a productos. |
| 5 | El administrador puede editar el nombre o la descripción de una categoría existente. |
| 6 | Al intentar eliminar una categoría con productos asociados, el sistema lo impide. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | El nombre de la categoría debe ser único. |
| RN-002 | No se puede eliminar una categoría que tenga productos asociados. |
| RN-003 | Todo producto debe pertenecer exactamente a una categoría. |

---

## Inputs / Outputs

### Input

```json
{
  "nombre": "Escolar",
  "descripcion": "Útiles y materiales escolares"
}
```

### Output éxito (HTTP 201)

```json
{
  "id_categoria": 4,
  "mensaje": "Categoría creada correctamente."
}
```

### Output error (HTTP 409)

```json
{
  "error": "Ya existe una categoría con ese nombre."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/categorias` | No | Lista todas las categorías. |
| POST | `/api/categorias` | Sí (Administrador) | Crea una nueva categoría. |
| PUT | `/api/categorias/{id}` | Sí (Administrador) | Edita una categoría existente. |
| DELETE | `/api/categorias/{id}` | Sí (Administrador) | Elimina una categoría sin productos asociados. |
