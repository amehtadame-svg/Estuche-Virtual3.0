<!--
  ¿Qué? Requisito funcional que describe la gestión de la lista de deseos del cliente.
  ¿Para qué? Definir cómo se guardan productos de interés sin agregarlos al carrito.
  ¿Impacto? Favorece la recompra y el seguimiento de productos de interés del cliente.
-->

# RF-025 — Lista de Deseos

**Historia de usuario relacionada**: HU-035

## Descripción

El sistema debe permitir a los clientes agregar y remover productos de una lista de deseos personal, evitando duplicados.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El cliente visualiza la ficha de un producto. |
| 2 | Presiona el ícono de "Guardar para después". |
| 3 | El sistema valida que el producto no esté ya en la lista de deseos del usuario. |
| 4 | El producto se agrega a `lista_deseos`. |
| 5 | El cliente puede remover productos de su lista en cualquier momento. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Un producto no puede repetirse en la lista de deseos del mismo usuario (`UNIQUE`). |
| RN-002 | La lista de deseos es privada y solo visible para su propietario. |

---

## Inputs / Outputs

### Input

```json
{
  "id_producto": 12
}
```

### Output éxito (HTTP 201)

```json
{
  "mensaje": "Producto agregado a la lista de deseos."
}
```

### Output error (HTTP 409)

```json
{
  "error": "El producto ya se encuentra en tu lista de deseos."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/lista-deseos` | Sí | Lista los productos guardados por el usuario. |
| POST | `/api/lista-deseos` | Sí | Agrega un producto a la lista de deseos. |
| DELETE | `/api/lista-deseos/{id}` | Sí | Elimina un producto de la lista de deseos. |
