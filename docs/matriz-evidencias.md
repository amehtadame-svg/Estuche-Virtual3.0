# Matriz de criterios y evidencias — Estuche Virtual

**Fuente:** transcripción preexistente de 14 criterios. La fotografía original no está disponible en el repositorio ni en este encargo; pedirla y contrastar texto y orden antes de declarar cobertura completa. La evidencia técnica se refiere al commit `6af297a`, salvo indicación distinta. Todos los responsables son personas a quienes se solicita revisión o responsables propuestos, no aprobaciones ni tareas aceptadas. Un enlace no prueba aceptación académica.

| # | Criterio transcrito del profesor | Evidencia disponible o limitación | Responsable de revisión / propuesto | Estado y cierre pendiente |
|---|---|---|---|---|
| 1 | Documentación general: diagramas, MER, MR, UML, casos de uso y clases | [Índice](README.md), [modelos y diagramas](MODELOS_Y_VALIDACION.md) | Franck (datos/flujo), Paula (actores/UX), Cristian (despliegue) | Parcial: vistas de datos incompletas; falta cotejo y aprobación. |
| 2 | Informes Scrum: backlog, sprints, HUs puntuadas, tareas y sprint poker | [Propuesta/plantillas](scrum/README.md); tablero y actas no recibidos | Equipo; roles por confirmar | Evidencia histórica pendiente: exportación, fechas, tareas, responsables, método y estimaciones reales. |
| 3 | Inicialización backend sin errores: mensajes, estados y variables | [Guía técnica](INSTALACION_Y_DESPLIEGUE.md), [configuración](../be/src/index.ts) | Franck y Cristian | Pendiente: ejecución integrada, estado de BD y captura de logs sin secretos. |
| 4 | Variables de entorno y despliegue backend y frontend | [Compose](../docker-compose.yml), [guía técnica](INSTALACION_Y_DESPLIEGUE.md) | Cristian | Parcial: configuración inspeccionada; validar entorno y arranque de ambos componentes. |
| 5 | Diagrama de arquitectura que evidencie aprendizajes previos | [Arquitectura y despliegue](MODELOS_Y_VALIDACION.md) | Franck y Cristian | Parcial: diagramas existentes; justificar y validar frente a entorno real. |
| 6 | Bonificación IoT: prototipo funcional, datos y protocolo | No se recibió evidencia de prototipo, ingesta o protocolo. | Por confirmar si aplica | No acreditado; no se afirma que el equipo renunció. |
| 7 | Plan de pruebas: alcance, niveles y ambiente separado | [Plan](PLAN_PRUEBAS.md), [ambiente y logs](evidencias/pruebas/README.md) | Coordinación de pruebas por confirmar | Parcial: plan propuesto y base aislada utilizada; aprobar plan y ampliar pruebas UI. |
| 8 | Informe de pruebas unitarias automatizadas: mínimo 20 casos distintos | [Backend 144 casos](evidencias/pruebas/backend-6af297a.log), [resultados](evidencias/pruebas/README.md) | Franck; ejecutor local documentado | Suite contiene más de 20 casos diferenciados, con dobles/HTTP y lógica: falta clasificar estrictamente las unitarias y validar rúbrica. |
| 9 | Reporte de ejecución y defectos en sistema con severidad y estado | [Resultados reales](evidencias/pruebas/README.md), [hallazgos locales](REGISTRO_DEFECTOS.md) | Coordinación de pruebas por confirmar | Parcial: sin acceso a sistema de tickets; crear/enlazar tickets reales y ejecutar regresiones. |
| 10 | Frontend: pantallas, rutas, navegación, colores, UX y UI | [Rutas](../fe/src/App.tsx), [experiencia](EXPERIENCIA_CLIENTE.md) | Paula | Pendiente recorrido real y validación de diseño, errores, permisos y accesibilidad. |
| 11 | README actualizado con pruebas y API del cuarto backend | [README](../README.md), [API](API.md), [pruebas](evidencias/pruebas/README.md) | Franck, Cristian y Paula | Parcial: falta identificar cuál es el «cuarto backend» y aprobación de la guía. |
| 12 | Manejo del repositorio con ramas y commits | [Guía](INSTALACION_Y_DESPLIEGUE.md), historial local: `72ec50b`, `bbdf3af`, `6af297a` | Equipo | Parcial: confirmar política, PR/reviews y protección; cambios actuales no implican merge a main. |
| 13 | Feedback del equipo, trabajo dividido y asignación de tareas | [Plantilla](scrum/RETROSPECTIVA.md); sin feedback ni asignaciones aceptadas recibidos | Equipo | Pendiente: actas y tareas reales con autor y fecha. |
| 14 | Comparación de los cuatro backends y deuda técnica priorizada | [Backlog propuesto](scrum/PRODUCT_BACKLOG.md), [auditoría](AUDITORIA_REQUISITOS_FUNCIONALES.md) | Equipo | No acreditado: identificar cuatro versiones, fuentes y criterios; priorizar deuda en sesión real. |

## Regla de cierre

Adjuntar evidencia auténtica o registrar limitación explícita, versión y fecha. Obtener validación de cada responsable y aprobación académica por los canales correspondientes; cobertura documental no equivale a aceptación. No atribuir resultados históricos a commits posteriores ni presentar una propuesta como trabajo realizado.
