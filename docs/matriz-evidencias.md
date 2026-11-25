# Matriz de criterios y evidencias — Estuche Virtual

## Propósito

Relacionar los 14 criterios de la rúbrica del profesor con evidencia
verificable, responsables propuestos y trabajo pendiente.

**Base técnica inicial:** `main@7e50dc9`.

La rúbrica fue aportada mediante una fotografía. Su archivo original
todavía debe incorporarse al repositorio como evidencia de referencia.

## Reglas de interpretación

- Un enlace al código demuestra que existe un archivo, no que funcione.
- Una pantalla o tabla no demuestra que una historia esté terminada.
- Los responsables indicados son propuestas, no asignaciones aceptadas.
- No se trasladan resultados de pruebas de otro commit como evidencia actual.
- Cada ejecución debe registrar commit, ambiente, fecha y resultado.
- Los pendientes no se consideran criterios aprobados.

## Matriz de seguimiento

| # | Criterio del profesor | Evidencia disponible | Responsable propuesto | Estado | Qué falta para cerrar |
|---|---|---|---|---|---|
| 1 | Documentación general: diagramas, MER, MR, UML, casos de uso y clases | [Índice documental](README.md), [modelo Prisma](../be/prisma/schema.prisma) | Coordinación documental; revisión Franck y Paula | Parcial | Incorporar modelos, diagramas y revisiones; alinear requisitos. |
| 2 | Informes Scrum: backlog, sprints, HUs puntuadas, tareas y sprint poker | [HUs existentes](requisitos/HUs/) | Equipo; roles Scrum por confirmar | Pendiente de evidencia | Recuperar tablero, fechas, selección de historias, estimaciones y método real utilizado. |
| 3 | Inicialización del backend sin errores: mensajes, estados y variables | [Inicio del backend](../be/src/index.ts), [scripts](../be/package.json) | Franck y Cristian | Pendiente de ejecución | Registrar arranque, errores controlados, conexión y estados en esta versión. |
| 4 | Variables de entorno y despliegue apropiado de backend y frontend | [Docker Compose](../docker-compose.yml), [configuración frontend](../fe/vite.config.ts) | Cristian | Pendiente de validación | Documentar variables sin secretos y adjuntar ejecución real de ambos componentes. |
| 5 | Diagrama de arquitectura que evidencie los aprendizajes previos | Código y configuración disponibles; diagrama por incorporar | Franck y Cristian | Pendiente | Elaborar arquitectura lógica y despliegue, justificar decisiones y revisar. |
| 6 | Bonificación IoT: prototipo funcional, datos y protocolo explicado | Sin evidencia incorporada | Por asignar si aplica | No acreditado | Declarar bonificación no reclamada o aportar prototipo, ingesta y protocolo demostrables. |
| 7 | Plan de pruebas: alcance, niveles y ambiente separado | Plan por incorporar | Coordinación de pruebas; apoyo técnico del equipo | Pendiente | Redactar plan y demostrar ambiente separado del desarrollo. |
| 8 | Informe de pruebas unitarias automatizadas: mínimo 20 casos distintos | [Pruebas en módulos backend](../be/src/modules/), [script de ejecución](../be/package.json) | Franck; ejecutor por registrar | Pendiente de ejecución | Identificar al menos 20 unitarias distintas y guardar resultados del commit probado. |
| 9 | Reporte de ejecución y defectos en sistema con severidad y estado | Sin reporte ni tickets enlazados en esta matriz | Coordinación de pruebas por asignar | Pendiente | Ejecutar, registrar defectos reales y enlazar tickets, correcciones y regresión. |
| 10 | Frontend: pantallas, rutas, navegación, colores, UX y UI | [Rutas frontend](../fe/src/App.tsx), [pantallas](../fe/src/pages/) | Paula; ejecutor por registrar | Pendiente de recorrido | Probar navegación, botones, formularios, permisos, diseño y estados de error. |
| 11 | README actualizado con pruebas y API del cuarto backend documentada | [README general](../README.md), [módulos API](../be/src/modules/) | Cristian, Franck y Paula | Parcial | Actualizar guía, pruebas y API; confirmar a qué entrega corresponde el cuarto backend. |
| 12 | Manejo del repositorio con ramas y commits | Historial Git disponible; rama documental creada desde main | Equipo | Pendiente de consolidación | Enlazar commits, PRs y revisiones; documentar prácticas realmente utilizadas. |
| 13 | Feedback del equipo, trabajo dividido y asignación de tareas | Sin actas ni aceptaciones incorporadas | Equipo | Pendiente de evidencia | Recopilar feedback y registrar tareas y responsables reales. |
| 14 | Comparación de los cuatro backends y deuda técnica priorizada | Backend actual disponible; versiones anteriores no documentadas aquí | Equipo | Pendiente | Identificar las cuatro versiones, comparar con evidencia y priorizar deuda. |

## Registro de nuevas evidencias

Al incorporar una evidencia, registrar:

- Criterio relacionado.
- Archivo o URL real.
- Commit al que corresponde.
- Fecha y ambiente, si es una ejecución.
- Autor o ejecutor.
- Resultado y limitaciones.
- Revisor, cuando corresponda.

## Criterio de cierre documental

Cada fila debe enlazar evidencia real o una limitación claramente
declarada. La cobertura documental no equivale a aprobación académica.
