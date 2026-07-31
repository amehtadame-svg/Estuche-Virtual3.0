# HU-023 — Registro de fecha y hora en transacciones

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-023 |
| **Título** | Registro de fecha y hora |
| **Módulo** | Sistema |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-023 |

---

## Historia

**Como** sistema,  
**quiero** registrar fecha y hora en cada operación,  
**para** garantizar un control de auditoría cronológico y preciso.

---

## Criterios de Aceptación

### CA-023.1 — Inserción automática de timestamp

- **Dado que** se procesa cualquier movimiento (venta, ajuste de stock, creación de usuario),
- **cuando** la transacción es persistida,
- **entonces** el sistema incluye de manera automática la marca de tiempo exacta (`created_at` / `updated_at`) en formato Estándar ISO 8601.

### CA-023.2 — Inmutabilidad de la marca de tiempo de creación

- **Dado que** un movimiento fue registrado con su marca de tiempo,
- **cuando** se consulta dicho registro en el futuro,
- **entonces** el campo `created_at` se mantiene inalterado.

---

## Endpoints

*(Funcionalidad interna transversal)*

---

## Notas técnicas

- Configuración de base de datos con zona horaria estandarizada en `UTC`.
- Uso de disparadores (Triggers) o decoradores ORM (ej. `@CreateDateColumn`, `@UpdateDateColumn`).