# Ejecución local de pruebas — 26-11-2026

**Código probado:** `6af297a4651f204eeb6166b2b50279e24c90549f`. Ejecutor: asistente de documentación, entorno local aislado. Estos logs se generaron antes de añadir la presente documentación; no acreditan CI, pruebas manuales ni validación por desarrolladores. Los logs conservan la salida y se normalizó el espacio en blanco al final de líneas. No confundir con el [informe histórico](../../INFORME_PRUEBAS.md) del commit `3998245`.

| Evidencia | Comando y carpeta | Resultado |
|---|---|---|
| [Backend](backend-6af297a.log) | `be`: `pnpm test`; Node 20.20.2, pnpm 10.12.4 | 144 pruebas aprobadas, 0 fallidas, 0 omitidas. Incluye pruebas unitarias y de rutas con dobles; no afirmar que todas sean unitarias puras. |
| [Frontend](frontend-6af297a.log) | `fe`: `pnpm dlx node@22 --test --test-concurrency=1 src/modules/frontend/*.test.ts`; Node 22.23.5 | 42 aprobadas, 0 fallidas, 0 omitidas. |
| [Integración](integracion-6af297a.log) | `be`: `pnpm exec prisma migrate deploy` y `pnpm test:integration` | 11 migraciones aplicadas y 40 pruebas aprobadas, 0 fallidas, 0 omitidas. PostgreSQL 17.12 local `127.0.0.1:55432`, base exclusiva `estuche_docs_test`, datos sintéticos. |
| [Build frontend](build-frontend-6af297a.log) | `fe`: `pnpm build` | Correcto; advertencia de bundle mayor a 500 kB. |
| [Lint frontend](lint-frontend-6af297a.log) | `fe`: `pnpm lint` | 0 errores, 5 advertencias. |

En integración, `DATABASE_URL` y `EMPLOYEE_TEST_DATABASE_URL` apuntaron a la misma base local dedicada; no se usó Supabase ni datos del usuario. El nombre, el puerto y el ambiente son de esta ejecución, no instrucciones de conexión externa.

Las suites contienen más de 20 casos distintos (identificados individualmente en el log backend), pero su clasificación y cobertura contra la rúbrica requieren revisión del equipo. No se han adjuntado evidencias de inicio de la aplicación completa ni de recorrido de interfaz o de producción.
