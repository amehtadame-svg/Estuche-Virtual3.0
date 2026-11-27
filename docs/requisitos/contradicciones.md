# Contradicciones documentales y propuestas de corrección

## Alcance

Registro inicial basado en `main@7e50dc9`; seguimiento documental revisado sobre `6af297a`. Las decisiones y validaciones indicadas continúan pendientes.

Registro inicial basado en el README, las restricciones y los manifiestos revisados. No modifica restricciones originales ni acredita funcionamiento integral.

## Hallazgos

| ID | Diferencia observada | Acción propuesta | Estado |
|---|---|---|---|
| DOC-001 | El README describía frontend, backend y database; la estructura utiliza fe, be y be/prisma. | Árbol corregido en [README general](../../README.md). Commit: `60a7bb8`. | Corregido documentalmente; directorios comprobados y diff revisado |
| DOC-002 | RT-001 menciona PostgreSQL/Supabase y RH-003 menciona MySQL/Workbench. | Contrastar Prisma y conciliar la restricción. | Decisión pendiente |
| DOC-003 | RT-002 exige versiones exactas; los manifiestos contienen rangos con ^ y ~. | Registrar tarea técnica sin cambiar dependencias aquí. | Pendiente de resolución técnica |
| DOC-004 | Se exige lint y Prettier; backend no declara lint y Prettier no figura en los manifiestos revisados. | Revisar configuración y herramientas adicionales. | Verificación pendiente |
| DOC-005 | Backend fija pnpm@10.12.4; frontend no declara packageManager. | Proponer una versión reproducible para desarrollo y CI. | Propuesta técnica |
| DOC-006 | RH-002 enumera solo main y dev; se utilizan ramas de trabajo adicionales. | Conciliar la política con ramas por tarea y PR. | Requiere acuerdo |
| DOC-007 | README general sin guía suficiente de instalación, ejecución, pruebas y API. | Se incorporaron enlaces a [guía](../INSTALACION_Y_DESPLIEGUE.md), [API](../API.md) y [resultados](../evidencias/pruebas/README.md). | Actualización documental; validación y arranque pendientes |
| DOC-008 | README incluye un enlace de invitación a Trello. | Revisar permisos y evitar publicar tokens de invitación. | Revisión de acceso pendiente |
| DOC-009 | El README omitía roles operativos. | Corregidos el objetivo y la sección Roles en [README general](../../README.md), según el enum Role y el middleware. | Corregido documentalmente; permisos completos y recorridos no certificados |

| DOC-010 | Diagrama anterior de compra mostraba dos llamadas separadas de pedido y recibo; checkout actual usa simulación transaccional. | [Secuencia actualizada](mer/secuencia-compra.svg) contrastada con código. | Ajuste documental; revisión Franck y Paula pendiente |
| DOC-011 | Guía anterior describía CORS, proxy y Compose como adecuados para producción sin validar su configuración efectiva. | [Guía revisada](../INSTALACION_Y_DESPLIEGUE.md) advierte variables fijadas, proxy y migración automática. | Corrección documental; Cristian debe comprobar despliegue |
| DOC-012 | Los modelos de datos muestran solo una selección, sin incluir todas las migraciones. | [Límites y validaciones](../MODELOS_Y_VALIDACION.md), esquema Prisma como referencia. | Revisar y completar con Franck; no se afirma que la BD fue modificada |

## Fuentes

- [README general](../../README.md)
- [Restricciones originales](../restricciones.md)
- [Manifiesto backend](../../be/package.json)
- [Manifiesto frontend](../../fe/package.json)

## Inspecciones pendientes

- Contrastar roles y rutas con el código.
- Revisar almacenamiento de contraseñas y terminología.
- Contrastar restricciones visuales con los estilos.
- Comprobar arranque, variables y conexión a la base de datos.

## Regla de cierre

Cada hallazgo debe enlazar su corrección o decisión, commit o PR y comprobación pertinente.

Los cambios sobre restricciones obligatorias requieren aprobación. Este registro no cambia los estados de las HUs ni significa que los hallazgos estén resueltos.
