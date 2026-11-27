# Registro local de hallazgos y defectos

Este archivo es una **preparación local**, no acredita que existan tickets en una herramienta ni que alguien haya aceptado la asignación. Basado en inspección del commit `6af297a` y la [auditoría](AUDITORIA_REQUISITOS_FUNCIONALES.md); reproducir en entorno aislado antes de cerrar o priorizar. Severidades y prioridades son propuestas, responsables sin asignar. No incluir datos de clientes ni credenciales.

**Actualización 27-11-2026:** los 5 hallazgos se registraron como **issues reales en GitHub** (sistema de seguimiento del proyecto), abiertos, con severidad, prioridad y estado descritos en el cuerpo de cada issue (D-01→#103, D-02→#104, D-03→#105, D-04→#106, D-05→#107). Las etiquetas `defecto`, `severidad:*` y `prioridad-*` ya existen en el repositorio, pero la token de integración usada en esta revisión **permite crear issues pero no asignar etiquetas ni cerrarlos** (HTTP 403 «Resource not accessible by integration»): la severidad y el estado quedan como texto en cada issue y en esta tabla hasta que se asignen las etiquetas con una token con permisos de escritura. El issue #108 fue un probe de permisos y permanece abierto por la misma razón. Se exigirá revisión real y cierre con prueba de regresión antes de marcar cualquier issue como resuelto.

| ID local | Hallazgo y evidencia | Severidad / prioridad propuestas | Responsable | Estado | Ticket externo | Corrección / nueva prueba |
|---|---|---|---|---|---|---|
| D-01 | Contacto muestra éxito sin petición de envío: [`Contact.tsx`](../fe/src/pages/Contact/Contact.tsx). | Alta / alta | Por asignar | Observado en código; reproducción UI pendiente | [#103](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/103) | Pendiente; probar envío correcto, fallo y persistencia según decisión. |
| D-02 | Ficha muestra reseñas «verificadas» calculadas a partir del stock: [`Product.tsx`](../fe/src/pages/Product/Product.tsx). | Media / alta | Por asignar | Observado en código; reproducción UI pendiente | [#104](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/104) | Pendiente; verificar que no se muestren cifras no respaldadas. |
| D-03 | Al borrar categoría se desasocian productos: [`categories.service.ts`](../be/src/modules/categories/categories.service.ts); contradice RF-014. | Alta / alta | Por asignar | Observado en código; decisión y prueba pendiente | [#105](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/105) | Pendiente; preservar asociaciones y probar productos con/sin categoría según regla aprobada. |
| D-04 | Diagramas relacionales históricos no reflejan toda la migración/soporte actual: [modelos](MODELOS_Y_VALIDACION.md). | Media / media | Franck, validación solicitada | Limitación documentada; revisión pendiente | [#106](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/106) | Pendiente; contrastar con esquema y adjuntar nueva validación. |
| D-05 | Las guías anteriores afirmaban el uso de proxy/CORS y ejecución productiva sin corresponder completamente al Compose actual: [guía](INSTALACION_Y_DESPLIEGUE.md). | Media / media | Cristian, validación solicitada | Documentación ajustada; falta prueba de despliegue | [#107](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/107) | Nueva comprobación de configuración/arranque pendiente. |

## Flujo de seguimiento

1. Reproducir y adjuntar pasos, entorno, fecha, commit, resultado esperado/actual y evidencia sin secretos.
2. Registrar en la herramienta acordada, si existe; añadir URL y responsable solo cuando el ticket sea real.
3. Vincular corrección con commit o PR y agregar prueba de regresión correspondiente.
4. Ejecutar de nuevo la prueba en el commit corregido y adjuntar log/captura; solo cerrar tras confirmar el resultado.
5. Si no se reproduce o no se acepta como defecto, registrar la decisión y su motivo.
