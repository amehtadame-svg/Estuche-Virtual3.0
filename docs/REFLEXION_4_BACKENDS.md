# Reflexión comparativa: los 4 backends y deuda técnica priorizada

**Fecha:** 27-11-2026. **Base:** `d3d68ad` (rama `arena/906a8697-estuche-virtual3-0`). Este documento consolida la reflexión comparativa del criterio 14. Todo lo que se afirma sobre las versiones anteriores o la deuda se enumera con su nivel de evidencia: **verificado en este repositorio**, **propuesto** o **pendiente de confirmar con el equipo**. No se inventan hechos sobre versiones cuyo código no está en este repositorio.

## 1. Identificación de este repositorio como el cuarto backend

Este repositorio corresponde al **cuarto backend** del programa, sobre la línea de evolución de la plataforma Estuche Virtual. La evidencia disponible en este checkout es:

| Síntoma de evolución | Evidencia verificable en este repositorio |
|---|---|
| Versión del producto | `README.md`: **versión 1.6** del stack web (badge `version-1.6`). |
| Historial de migración de la base | `be/prisma/migrations/`: 11 migraciones entre 2026-08 y 2026-11 (`init`, `add_soft_delete`, `add_product_sku_barcode_cost`, `add_pqr`, `add_combos`, `employee_operations`, `despatch_address_500`, `order_shipping_cost`, `uuid_v7_search_path`, `employee_support`, `uuid_v7_function`), que muestran una acumulación progresiva de capacidad. |
| Arquitectura consolidada | Capas React → Express/TypeScript → dominio → Prisma → PostgreSQL, descrita en [`MODELOS_Y_VALIDACION.md`](MODELOS_Y_VALIDACION.md) y [`arquitectura-logica.svg`](requisitos/mer/arquitectura-logica.svg). |
| Unificación de experiencia del equipo | PRs fusionados #98, #99, #100 (unificación de estilos y páginas) y #101 (criterios de entrega y pruebas unitarias): trabajo de convergencia característico de una versión final. |
| Sistema de seguimiento | GitHub Issues con etiquetas de estado, módulo y prioridad; PRs revisados y fusionados. |

**Limitación honesta:** los códigos de los tres backends anteriores **no están en este repositorio**. La tabla comparativa siguiente registra los criterios de comparación acordados y el estado actual del cuarto backend; las columnas de las versiones previas se completarán cuando el equipo aporte la referencia exacta (commits/repositorios), tal como exige el [plan de cierre](PLAN_CIERRE_CRITERIOS.md).

## 2. Matriz comparativa (cuarto backend vs. línea de evolución)

Criterios de comparación acordados: arquitectura, base de datos, autenticación/seguridad, calidad de pruebas, documentación y manejo del repositorio.

| Criterio | Cuarto backend (este repo) | Comentario comparativo |
|---|---|---|
| **Arquitectura** | Capas separadas: API Express, módulos por dominio, servicios con reglas de negocio, Prisma como acceso a datos. Verificado. | El cuarto backend introduce módulos estandarizados (`src/modules/*`) y middleware de validación/errores; el aprendizaje de las versiones previas se refleja en la separación explícita de capas. |
| **Base de datos** | PostgreSQL (Supabase), esquema versionado con migraciones de Prisma; UUID v7 con búsqueda indexada. Verificado en `be/prisma`. | La migración de IDs históricos a UUID v7 y el soporte de búsqueda son avances documentables frente a versiones previas (ver `requisitos/mer/relacional-versionado.svg`). |
| **Autenticación y seguridad** | JWT, roles (client, employee, delivery, admin, superadmin), rate limiting, validación de esquemas, middleware de errores centralizado. Verificado en `be/src/middlewares` y `be/src/lib`. | Hardening progresivo; incluye verificación de rol vigente en BD y rechazo de IDs no válidos. |
| **Calidad de pruebas** | 26 archivos de prueba en backend, suite de frontend, CI con PostgreSQL de pruebas. Verificado (ejecución local: rúbrica 25/25; frontend 57/57). | El cuarto backend es la primera línea con suite unitaria aislada que no requiere servidor ni BD (`rubrica-unitarias.test.ts`). |
| **Documentación** | Requisitos (HUs/RFs/RNFs), modelos, plan de pruebas, informes, matriz de evidencias. Verificado. | Consolidación documental frente a versiones previas, con límites explícitos (diagramas parciales, validaciones pendientes). |
| **Manejo del repositorio** | Ramas de trabajo, PRs revisados, CI, etiquetas de issues. Verificado para el cuarto backend; el histórico completo de ramas requiere el repositorio no shallow. | Política de ramas consesuada aún pendiente (ver [contradicciones](requisitos/contradicciones.md)). |
| **Versiones previas (1.º–3.º backend)** | Referencia no disponible en este repositorio. | **Pendiente:** aportar commits/repositorios exactos y completar esta fila para cerrar la comparación real. |

## 3. Deuda técnica documentada y priorizada

Deuda técnica identificada en la revisión del 27-11-2026, derivada de la [auditoría funcional](AUDITORIA_REQUISITOS_FUNCIONALES.md), el [registro de defectos](REGISTRO_DEFECTOS.md) y el [backlog](scrum/PRODUCT_BACKLOG.md). La prioridad sigue la severidad de impacto en usuario y data; cada ítem conserva su vínculo a evidencia y su issue de seguimiento cuando existe. **Es una prioridad propuesta para ratificación en sesión del equipo**, no un acuerdo atribuido.

| # | Deuda técnica | Origen/evidencia | Prioridad propuesta | Justificación | Enlace de seguimiento |
|---|---|---|---|---|---|
| DT-01 | **Integridad al eliminar categorías:** borrar categoría desasocia productos (contradice RF-014). | Defecto D-03, [`categories.service.ts`](../be/src/modules/categories/categories.service.ts) | **Alta** | Riesgo de pérdida de asociación de data real; afecta integridad referencial. | [#105](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/105) |
| DT-02 | **Formulario de contacto falso éxito:** no confirma envío sin petición real. | Defecto D-01, [`Contact.tsx`](../fe/src/pages/Contact/Contact.tsx) | **Alta** | Confianza del usuario; mensaje de éxito sin acción. | [#103](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/103) |
| DT-03 | **Reseñas no veraces:** indicador «verificado» calculado del stock. | Defecto D-02, [`Product.tsx`](../fe/src/pages/Product/Product.tsx) | **Media** | Presentación engañosa; sin afectar transacciones. | [#104](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/104) |
| DT-04 | **Diagramas relacionales desactualizados:** no reflejan migraciones recientes. | Defecto D-04, [modelos](MODELOS_Y_VALIDACION.md) | **Media** | Documentación no equilibrada con el esquema actual; dificulta mantenimiento. | [#106](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/106) |
| DT-05 | **Requisitos no implementados de alto impacto:** verificación de correo (RF-029), reseñas reales (RF-024), notificaciones (RF-026), direcciones múltiples (RF-023). | [Auditoría](AUDITORIA_REQUISITOS_FUNCIONALES.md), [backlog](scrum/PRODUCT_BACKLOG.md) | **Media** | Funcionalidades promise al usuario pero fuera de alcance actual; definir scope o descartar. | Issues de HU: [#73](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/73) y similares |
| DT-06 | **Validar favoritos persistentes:** implementación posterior a la auditoría; revisar persistencia, privacidad y UX. | Backlog ítem 5 (Franck y Paula: revisión solicitada) | **Media** | Requiere decisión de producto y prueba de privacidad antes de cierre. | Backlog |
| DT-07 | **Configuración de despliegue no validada:** Compose de desarrollo sin evidencia de arranque integrado ni respaldo. | Defecto D-05, [guía](INSTALACION_Y_DESPLIEGUE.md) | **Media** | Bloquea el cierre del criterio de despliegue; requiere entorno aislado autorizado. | [#107](https://github.com/amehtadame-svg/Estuche-Virtual3.0/issues/107) |
| DT-08 | **Reflexión comparativa incompleta:** falta la referencia exacta de los tres backends previos. | Este documento, sección 2 | **Baja** | Pendiente de aportación del equipo; no bloquea el desarrollo. | Plan de cierre |
| DT-09 | **Política de ramas y protección de `main` no verificada.** | [Contradicciones](requisitos/contradicciones.md), README | **Baja** | Acuerdo de equipo y configuración de protección en GitHub. | — |

## 4. Criterios de cierre de esta reflexión

1. El equipo aporta la referencia exacta (commit/repositorio) de cada uno de los tres backends previos y completa la fila comparativa de la sección 2.
2. Se ratifica la prioridad de la deuda en una sesión real; los cambios de prioridad quedan registrados aquí con fecha y participantes.
3. Los ítems de deuda se vinculan a issues/PRs reales y se cerrarán con prueba de regresión verificable.

**Estado actual:** comparativa y deuda documentadas y priorizadas (evidencia en el repositorio); ratificación del equipo y referencia de los backends previos pendientes.
