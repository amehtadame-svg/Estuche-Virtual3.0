<!--
  ¿Qué? Requisito funcional que describe la administración de direcciones de entrega del cliente.
  ¿Para qué? Definir cómo se registran y seleccionan las direcciones usadas en el checkout.
  ¿Impacto? Reduce fricción en el proceso de compra al reutilizar direcciones guardadas.
-->

# RF-023 — Gestión de Direcciones de Entrega

**Historia de usuario relacionada**: HU-038

## Descripción

El sistema debe permitir a los clientes registrar múltiples direcciones de entrega y designar una de ellas como principal.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El cliente accede a su módulo de direcciones. |
| 2 | Registra contacto, teléfono, dirección, ciudad y departamento. |
| 3 | El sistema guarda la dirección asociada a su usuario. |
| 4 | El cliente puede marcar una dirección como principal. |
| 5 | Al marcar una nueva dirección como principal, el sistema desmarca la anterior. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo puede existir una dirección `principal = true` por usuario. |
| RN-002 | El campo dirección es obligatorio. |
| RN-003 | Las direcciones usadas en pedidos existentes no se eliminan físicamente. |

---

## Inputs / Outputs

### Input

```json
{
  "nombre_contacto": "Juan Pérez",
  "telefono": "3001234567",
  "direccion": "Calle 10 #25-30",
  "ciudad": "Bogotá",
  "departamento": "Cundinamarca",
  "principal": true
}
```

### Output éxito (HTTP 201)

```json
{
  "mensaje": "Dirección registrada correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "El campo dirección es obligatorio."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/direcciones` | Sí | Lista las direcciones del usuario. |
| POST | `/api/direcciones` | Sí | Registra una nueva dirección. |
| PUT | `/api/direcciones/{id}` | Sí | Edita o marca una dirección como principal. |
