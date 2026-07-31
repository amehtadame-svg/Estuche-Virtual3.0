# HU-030 — Respaldo automático de información

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-030 |
| **Título** | Respaldo automático de información |
| **Módulo** | Mantenimiento |
| **Prioridad** | Alta |
| **Estado** | Por Implementar |
| **RF asociados** | RF-030 |

---

## Historia

**Como** administrador,  
**quiero** respaldo de información,  
**para** no perder datos operativos o históricos ante eventualidades o fallas del sistema.

---

## Criterios de Aceptación

### CA-030.1 — Tarea programada de respaldo

- **Dado que** el servidor se encuentra operativo,
- **cuando** se alcanza el horario programado de mantenimiento (ej. medianoche/00:00 hrs),
- **entonces** el sistema genera automáticamente un respaldo de la base de datos y lo almacena en un repositorio seguro.

### CA-030.2 — Generación manual bajo demanda

- **Dado que** estoy en la vista de configuración del sistema (`/settings/backups`),
- **cuando** presiono el botón "Generar Respaldo Ahora",
- **entonces** el sistema crea de inmediato una copia de seguridad y permite descargar el archivo comprimido resultante.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/system/backups` | Inicia la generación manual de un backup |

---

## Notas técnicas

- Tarea programada ejecutada mediante Job Cron (`CronJob`).
- Compresión del volcado SQL/Data (`pg_dump` / `mysqldump`) en archivo cifrado subido opcionalmente a un almacenamiento de objetos seguro (S3 / Cloud Storage).
