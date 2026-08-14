<!--
  ¿Qué? Historia de usuario que describe la administración de direcciones de entrega del cliente.
  ¿Para qué? Formalizar el registro de una o varias direcciones reutilizables al momento del checkout.
  ¿Impacto? Agiliza el proceso de compra al evitar digitar la dirección en cada pedido.
-->

# HU-038 — Gestión de direcciones de entrega

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-038 |
| **Título** | Gestión de direcciones de entrega |
| **Módulo** | Cuenta del cliente |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-023 |

---

## Historia

**Como** cliente registrado,
**quiero** registrar, editar, eliminar y marcar como principal una o varias direcciones de entrega,
**para** seleccionar rápidamente dónde debe llegar mi pedido durante el checkout.

---

## Criterios de Aceptación

### CA-038.1 — Registro de una nueva dirección
- **Dado que** accedo a "Mis direcciones" (`/cuenta/direcciones`),
- **cuando** completo contacto, teléfono, dirección, ciudad y departamento,
- **entonces** la dirección se guarda y aparece disponible para futuros pedidos.

### CA-038.2 — Marcar dirección como principal
- **Dado que** tengo más de una dirección registrada,
- **cuando** marco una de ellas como "Principal",
- **entonces** el sistema desmarca cualquier otra dirección principal previa y deja solo una activa como tal.

### CA-038.3 — Edición de una dirección existente
- **Dado que** selecciono una dirección registrada,
- **cuando** modifico alguno de sus campos y guardo,
- **entonces** los cambios se reflejan de inmediato en el listado.

### CA-038.4 — Eliminación de una dirección sin pedidos asociados
- **Dado que** una dirección no ha sido utilizada en ningún pedido,
- **cuando** presiono "Eliminar",
- **entonces** el registro se borra del listado de direcciones.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/direcciones` | Lista las direcciones del usuario autenticado |
| POST | `/api/direcciones` | Registra una nueva dirección |
| PUT | `/api/direcciones/{id}` | Edita o marca una dirección como principal |
| DELETE | `/api/direcciones/{id}` | Elimina una dirección |

---

## Notas técnicas

- Solo puede existir una dirección con `principal = true` por usuario; se controla a nivel de servicio.
- Las direcciones referenciadas por `pedidos.id_direccion` no deben eliminarse físicamente.
