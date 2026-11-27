# Modelos y validación de equipo

**Base técnica inspeccionada:** `6af297a`, 26-11-2026. Revisión estática del código y de los archivos; no constituye aceptación de los integrantes ni certifica el comportamiento completo. Los diagramas de datos son **vistas parciales**: se omitieron entidades y campos fuera del alcance documental acordado. No equivalen al esquema físico completo ni cambian la base. El esquema canónico para inspección es [`schema.prisma`](../be/prisma/schema.prisma); no implica que todas sus entidades estén expuestas por la aplicación.

| Entregable | Evidencia | Revisión realizada | Validación obligatoria pendiente |
|---|---|---|---|
| MER | [Vista conceptual parcial](requisitos/mer/mer.svg), [otra vista](requisitos/mer/mer-versionado.svg) | Entidades y relaciones seleccionadas; no usar el conteo histórico como inventario completo. La bandeja de ayuda se agregó después de los diagramas iniciales. | Franck: entidades, cardinalidades y omisiones. |
| Modelo relacional con PK/FK | [Vista parcial](requisitos/mer/modelo-relacional.svg), [vista detallada](requisitos/mer/relacional-versionado.svg), [Prisma](../be/prisma/schema.prisma) | Las claves visibles representan una selección histórica; falta contrastar cada campo y migración con el esquema actual y con el entorno objetivo. | Franck: PK/FK, nulabilidad, migraciones y tablas actuales. |
| Casos de uso | [Cliente](requisitos/mer/casos-uso-cliente.svg), [operación](requisitos/mer/casos-uso-operacion.svg) | Los actores y acciones visibles se cotejaron con rutas y código de roles. La confirmación por flujo y permisos sigue pendiente. | Paula: actores y recorrido de interfaz; Franck: permisos de backend. |
| Clases/dominio | [Dominio parcial](requisitos/mer/dominio.svg), [servicios](requisitos/mer/clases-servicios.svg) | Muestra entidades y dependencias seleccionadas; las «clases» de servicios no son declaraciones `class` en el código. | Franck: relaciones y responsabilidades; Paula: recorrido. |
| Secuencia de compra | [Checkout académico](requisitos/mer/secuencia-compra.svg) | Actualizada según `Checkout.tsx`, `useDemoPayment.ts` y `payments.service.ts`: reserva y recibo en transacción; no hay cobro real. | Franck: transacción, errores e idempotencia; Paula: interfaz y estados. |
| Secuencia de inventario | [Ingreso](requisitos/mer/secuencia-ingreso.svg), [salida](requisitos/mer/secuencia-salida.svg) | Vista de operaciones administrativas. Contrastar líneas de actualización y errores con versión final. | Franck: transacciones y permisos; Paula: confirmación y mensajes. |
| Arquitectura lógica | [Diagrama](requisitos/mer/arquitectura-logica.svg), [`app.ts`](../be/src/app.ts) | Capas React, API Express, dominio, Prisma, PostgreSQL y correo descritas de forma conceptual. | Franck y Cristian: flujos, configuración y límites. |
| Despliegue | [Vista Compose](requisitos/mer/despliegue-referencia.svg), [Compose](../docker-compose.yml), [guía](INSTALACION_Y_DESPLIEGUE.md) | Describe configuración de desarrollo; no acredita despliegue de producción ni prueba de conectividad real. | Cristian: variables, puertos, rutas, origen de BD, correo y evidencia de arranque. |

## Cómo registrar la aprobación real

Para cada validación: fecha, persona, commit revisado, archivo/versión, resultado (aprobado u observaciones), enlace a comentario/acta/captura y corrección verificada. **No hay aprobaciones recibidas en este documento.** Los nombres de responsables son los indicados para revisión, no evidencia de ejecución.

## Limitaciones conocidas

- Las vistas de datos no incluyen todas las entidades ni todas las migraciones posteriores. No afirmar que los diagramas son completos o que el esquema de Supabase fue validado.
- En Compose el frontend y backend utilizan servidores de desarrollo; un diagrama no demuestra un despliegue productivo.
- La guía y el recorrido de interfaz necesitan la confirmación real de Cristian y Paula respectivamente. La API necesita revisión de Franck.
