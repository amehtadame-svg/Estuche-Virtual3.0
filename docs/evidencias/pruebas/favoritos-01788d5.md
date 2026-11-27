# Pruebas de favoritos — 26-11-2026

**Código probado:** `01788d5` de `feature/verificacion-modulo-empleados`. Ejecución local del asistente, con datos sintéticos; no constituye validación de Franck o Paula, CI ni prueba sobre Supabase. Logs normalizados solo en espacios en blanco. Los cambios de este informe no alteran código.

| Ejecución | Evidencia y resultado |
|---|---|
| Backend, en serie | [144/144, sin fallos ni omitidos](backend-01788d5.log). |
| Frontend, Node 22, en serie | [48/48, sin fallos ni omitidos](frontend-01788d5.log); incluye interfaz con JSDOM y respuestas simuladas. |
| Integración, en serie | [48/48, sin fallos ni omitidos](integracion-01788d5.log). PostgreSQL 17.12 aislado, `estuche_docs_test` local; incluye autenticación/roles, aislamiento entre clientes, unicidad concurrente, eliminación, producto inactivo y carrito. |
| Builds | [Backend](build-backend-01788d5.log) y [frontend](build-frontend-01788d5.log) correctos; frontend avisa sobre tamaño de bundle. |
| Lint frontend | [0 errores y 5 advertencias preexistentes](lint-frontend-01788d5.log). |

La primera ejecución paralela completa fue interrumpida por saturación del entorno y **no se cuenta** como pasada. Se repitieron las suites en serie con los comandos anotados en los logs. La migración inicial ya contiene la tabla y el índice único; no se agregaron migraciones ni se verificó la base remota. Falta validación manual de UX por Paula, revisión de backend por Franck y comprobación de esquema del ambiente de destino por Cristian. No se acredita todavía la aceptación de HU-035.
