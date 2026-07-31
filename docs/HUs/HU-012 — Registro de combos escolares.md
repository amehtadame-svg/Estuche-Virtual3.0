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

**Como** administrador del catálogo comercial,  
**quiero** agrupar múltiples productos individuales existentes en el inventario para crear paquetes promocionales o combos escolares asignándoles un precio global preferencial,  
**para** impulsar las ventas por paquete en temporadas de alta demanda, ofrecer precios competitivos a los clientes y agilizar la selección de conjuntos de productos en el punto de venta.

---

## Criterios de Aceptación

### CA-012.1 — Formulario de empaquetado de productos
- **Dado que** me ubico en la interfaz de creación de paquetes y combos (`/combos/new`),
- **cuando** asigno un nombre al combo, selecciono dos o más productos del catálogo especificando las cantidades de cada uno y fijo el precio de venta global del paquete,
- **entonces** el sistema valida los componentes y habilita el botón de guardado.

### CA-012.2 — Validación de cantidad mínima de productos componentes
- **Dado que** me encuentro diseñando un combo promocional,
- **cuando** intento guardar la definición del combo con un solo producto o sin ítems asociados,
- **entonces** el sistema debe detener la acción e informar: "Un combo o paquete promocional debe estar integrado por al menos dos productos del catálogo".

### CA-012.3 — Control de precio total de combo válido
- **Dado que** estoy especificando el precio comercial de un paquete,
- **cuando** introduzco un precio total menor o igual a cero (0),
- **entonces** el sistema rechaza el valor notificando: "El precio total del combo debe ser un monto numérico positivo mayor a cero".

### CA-012.4 — Asignación de SKU de paquete y activación comercial
- **Dado que** confirmo el guardado exitoso del combo,
- **cuando** el backend procesa la solicitud,
- **entonces** genera un código SKU promocional único, establece el estado activo y pone el combo a disposición en el punto de venta.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/combos` | Crea la agrupación del combo y sus ítems |

---

## Notas técnicas

- Entidad `Combo` con relación de uno a muchos hacia `ComboItem` (`combo_id`, `product_id`, `quantity`).
- Los combos no poseen stock físico individual; el stock disponible se calcula dinámicamente según la disponibilidad de sus productos componentes.
