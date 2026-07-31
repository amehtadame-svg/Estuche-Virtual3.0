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

**Como** sistema de gestión de información,  
**quiero** estampar automáticamente marcas de tiempo estandarizadas (`created_at` / `updated_at`) en cada registro, transacción, venta o movimiento generado en la base de datos,  
**para** asegurar la precisión cronológica de la información, respaldar auditorías de seguridad, sincronizar eventos en zona horaria estandarizada y permitir el filtrado exacto por fechas.

---

## Criterios de Aceptación

### CA-023.1 — Inserción automática de marca de tiempo en la creación
- **Dado que** se procesa cualquier nuevo registro o transacción en el sistema (ej. Venta, Ingreso, Usuario),
- **cuando** la entidad se guarda en la base de datos,
- **entonces** el sistema asigna de manera automática la fecha y hora exacta en la columna `created_at`.

### CA-023.2 — Actualización automática de marca de tiempo en la edición
- **Dado que** un registro existente en la base de datos es modificado,
- **cuando** se guardan los cambios,
- **entonces** el sistema actualiza automáticamente la columna `updated_at` preservando intacta la fecha de creación original (`created_at`).

### CA-023.3 — Estandarización de zona horaria en UTC
- **Dado que** el servidor procesa marcas de tiempo,
- **cuando** almacena las fechas en la base de datos,
- **entonces** las guarda bajo el estándar universal UTC para prevenir discrepancias por zonas horarias locales.

### CA-023.4 — Formateo comprensible en la interfaz de usuario
- **Dado que** se presentan fechas y horas en los reportes o tablas de la plataforma,
- **cuando** la interfaz renderiza la información,
- **entonces** despliega las marcas de tiempo en formato local comprensible (ej. "DD/MM/AAAA HH:mm:ss").

---

## Endpoints

*(Funcionalidad interna transversal)*

---

## Notas técnicas

- Configuración de base de datos con zona horaria estandarizada en `UTC`.
- Uso de disparadores (Triggers) o decoradores ORM (ej. `@CreateDateColumn`, `@UpdateDateColumn`).