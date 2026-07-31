# HU-012 — Registro de combos escolares

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-012 |
| **Título** | Registro de combos escolares |
| **Módulo** | Productos |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-012 |

---

## Historia
**Como** administrador,
**quiero** registrar combos escolares,
**para** vender paquetes completos agrupando varios productos individuales a un precio especial.

---

## Criterios de Aceptación

### CA-012.1 — Creación de un combo

- **Dado que** estoy en la sección de combos (`/combos/new`),
- **cuando** asigno un nombre al combo, selecciono dos o más productos individuales con sus respectivas cantidades y fijo un precio total del paquete,
- **entonces** el sistema guarda el combo asociando los productos al paquete.

### CA-012.2 — Validación de combo con al menos 2 productos

- **Dado que** intento guardar un combo con solo 1 producto o sin ítems,
- **cuando** presiono "Guardar Combo",
- **entonces** el sistema muestra el error: "Un combo debe incluir al menos dos productos".

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/combos` | Crea la agrupación del combo y sus ítems |

---

## Notas técnicas

- Entidad `Combo` con relación de uno a muchos hacia `ComboItem` (`combo_id`, `product_id`, `quantity`).
- Los combos no poseen stock físico individual; el stock disponible se calcula dinámicamente según la disponibilidad de sus productos componentes.
