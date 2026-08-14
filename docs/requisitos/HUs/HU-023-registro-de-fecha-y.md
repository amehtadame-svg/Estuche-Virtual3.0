<!--
  ¿Qué? Historia de usuario que describe el registro automático de fecha y hora en cada transacción.
  ¿Para qué? Formalizar la marca temporal exacta de cada movimiento del sistema.
  ¿Impacto? Es indispensable para la trazabilidad y la auditoría de operaciones.
-->

# HU-023 — Registro de fecha y hora en transacciones

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-023 |
| **Título** | Registro de fecha y hora |
| **Módulo** | Sistema |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-009|

---

## Historia

**Como** sistema central de gestión de información, arquitectura de base de datos e infraestructura de auditoría operativa, responsable de garantizar la inmutabilidad, trazabilidad y secuencia temporal de todas las entidades y eventos del software,  
**quiero** estampar automáticamente marcas de tiempo estandarizadas, precisas e inalterables (`created_at` para la creación inicial y `updated_at` para modificaciones) en cada registro, transacción comercial, movimiento de almacén o acción de usuario efectuada en la plataforma,  
**para** asegurar la precisión cronológica estricta de la información registrada, respaldar auditorías de seguridad informática y controles forenses, sincronizar eventos bajo un estándar único de zona horaria (UTC) y posibilitar la generación de reportes e inspecciones temporales con exactitud de segundos.

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
