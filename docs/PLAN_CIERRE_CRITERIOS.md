# Plan de cierre de criterios

**Fecha:** 27-11-2026. Base examinada: `177fb714a836a5f5fcbd65bad71919da6e5fd1ca`, más los cambios locales de esta entrega cuando se indique. Este documento propone acciones; no es evidencia de aprobación, asignación aceptada o despliegue.

## 1. Pruebas y evidencia técnica

- **Hecho:** se añadieron y ejecutaron [25 casos unitarios aislados](evidencias/pruebas/unitarias-rubrica-2026-11-27.md), sin servidor ni base de datos. El resultado pertenece a la base indicada **más el nuevo archivo de prueba**, no al commit base por sí solo.
- **Hecho:** en el frontend de la base `177fb71`, `corepack pnpm lint`, `corepack pnpm build` y `corepack pnpm test` terminaron correctamente en Linux con Node 22.22.3 y pnpm 12.23.0. Resultado: 57/57 pruebas, 0 omitidas; lint sin errores y con 4 advertencias; build con advertencia de tamaño de bundle. No son pruebas manuales en navegador ni aceptación de UX.
- **Limitación local:** no se ejecutó la suite completa del backend, su build ni integración en esta revisión: `prisma generate` no pudo descargar el motor desde `binaries.prisma.sh` por la restricción de red del entorno. No se conectó a Supabase ni se ejecutaron migraciones.
- **CI del commit base:** [run 46027561465](https://github.com/amehtadame-svg/Estuche-Virtual3.0/actions/runs/46027561465), evento push a `main`, completado correctamente el 27-11-2026: backend, frontend e integración. Este run no incluye el nuevo archivo de pruebas. Se consultó el resultado de los trabajos, pero no se pudo descargar su log en este entorno; no se atribuyen cantidades de pruebas a ese run.
- **Pendiente:** ejecutar la CI de la entrega final y adjuntar su URL; comprobar que los 25 casos estén incluidos y registrar fallos, omitidos y cobertura cuando proceda. Efectuar recorridos manuales por rol en ambiente aislado.

## 2. Despliegue seguro — lista de comprobación

Antes de ejecutar Compose, identificar por escrito el entorno objetivo, responsable y URL de base autorizada; verificar respaldo y recuperación. El comando de backend en `docker-compose.yml` ejecuta `prisma migrate deploy` sobre `SUPABASE_DATABASE_URL`. La base local `db` no sustituye automáticamente esa URL. No pegar credenciales ni salida expandida de `docker compose config` en evidencias.

En un entorno autorizado y aislado, una persona del equipo debe registrar fecha, commit, responsable, versiones y resultados para:

1. Variables requeridas, origen CORS y dirección API del navegador; confirmar que no se exponen secretos.
2. Arranque de backend, conexión de base y respuestas de `/api/health` y `/api/health/ready`.
3. Arranque del frontend y comunicación API. El proxy Vite apunta a `localhost:4000` desde el proceso de Vite; en contenedores hay que validar y configurar el destino adecuado.
4. Recorrido cliente y por roles, incluyendo errores y permisos; sin datos reales ni pagos reales.
5. Procedimiento y responsable de respaldo y rollback, cuando el entorno lo requiera.

Todavía no hay constancia de que estas comprobaciones se hayan realizado. El Compose incluido es de desarrollo y no constituye una receta validada de producción.

## 3. Evidencias que debe aportar el equipo

| Necesario | Qué se debe recoger | Criterios |
|---|---|---|
| Tablero y Scrum | Exportación o capturas autorizadas con sprint, fechas, historias, puntos, tareas, responsables, estados y evidencia de planning poker real. | 2, 13 |
| Reunión y feedback | Acta real con participantes, fecha, retroalimentación, acuerdos y responsables aceptados. | 13 |
| Cuatro backends | [Reflexión comparativa y deuda priorizada](REFLEXION_4_BACKENDS.md): cuarto backend identificado (versión 1.6) y deuda DT-01…DT-09 priorizada. Pendiente: referencia exacta de los tres backends previos y ratificación de prioridades. | 11, 14 |
| Modelos | Revisión de MER/MR frente a `be/prisma/schema.prisma`, casos de uso, clases y diagrama de arquitectura, con validación de responsables. | 1, 5 |
| Defectos | **Registrados como issues reales en GitHub** (#103–#107, abiertos, con severidad/prioridad/estado en el cuerpo). Las etiquetas se crearon, pero la token usada no permite asignarlas ni cerrar issues (403); pendiente: etiquetar con permisos de escritura, reproducir en la versión actual, revisión real y cierre con regresión vinculada. | 9 |
| IoT, si se busca bonificación | Código del prototipo, dispositivo, protocolo, demostración del envío y recepción de datos. | 6 |

Las [issues de GitHub](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues) son un sistema disponible, pero las revisadas el 27-11-2026 no tenían etiquetas; no se ha comprobado que los hallazgos históricos estén registrados allí. No crear tickets ni atribuir severidad o responsables como hechos sin reproducirlos y acordar el proceso.

## 4. Orden sugerido

1. Obtener las referencias de los cuatro backends y los documentos reales de Scrum.
2. Reproducir defectos y abrir o vincular tickets acordados; no asumir que los hallazgos históricos siguen vigentes.
3. Validar diagramas y API contra la entrega final, y actualizar las referencias obsoletas.
4. Verificar despliegue y recorridos en un ambiente aislado, y volver a ejecutar CI para el commit final.
5. Si se decide presentar IoT, aportar una demostración real y su protocolo.
