<!--
  ¿Qué? Historia de usuario que describe la administración de códigos de descuento y promociones.
  ¿Para qué? Formalizar la creación de incentivos comerciales aplicables durante el checkout.
  ¿Impacto? Es una herramienta clave para campañas de temporada (regreso a clases).
-->

# HU-036 — Gestión de ofertas, promociones y cupones de descuento

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-036 |
| **Título** | Gestión de ofertas, promociones y cupones de descuento |
| **Módulo** | Marketing |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-012 |

---

## Historia

**Como** administrador de la plataforma,
**quiero** crear, editar y desactivar códigos de descuento con un porcentaje o valor fijo, un rango de vigencia y un número máximo de usos,
**para** impulsar las ventas en fechas estratégicas y fidelizar clientes.

---

## Criterios de Aceptación

### CA-036.1 — Creación de un nuevo cupón
- **Dado que** accedo al módulo de descuentos y completo código, tipo, valor, fecha de inicio y fecha de fin,
- **cuando** presiono "Guardar",
- **entonces** el cupón queda registrado en `descuentos` con `activo = true`.

### CA-036.2 — Aplicación de un cupón válido en el checkout
- **Dado que** ingreso un código de cupón vigente durante el checkout,
- **cuando** el sistema lo valida,
- **entonces** el descuento se refleja inmediatamente en el total del pedido.

### CA-036.3 — Rechazo de cupón expirado o agotado
- **Dado que** ingreso un código cuya fecha de fin ya pasó o cuyos `usos_actuales` alcanzaron `usos_maximos`,
- **cuando** intento aplicarlo,
- **entonces** el sistema muestra: "Este cupón ya no se encuentra disponible".

### CA-036.4 — Desactivación manual de una promoción
- **Dado que** una promoción activa ya no debe aplicarse,
- **cuando** el administrador la desactiva desde el panel,
- **entonces** el campo `activo` cambia a `false` y el cupón deja de aceptarse de inmediato.


---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/descuentos` | Crea un nuevo cupón o promoción |
| PUT | `/api/descuentos/{id}` | Actualiza o desactiva un cupón |
| POST | `/api/descuentos/validar` | Valida un código de cupón durante el checkout |

---

## Notas técnicas

- El campo `usos_actuales` se incrementa de forma atómica al confirmarse el pedido, nunca antes.
- El descuento no puede ser inferior al 1% ni superior al 100% cuando el tipo es porcentual.
