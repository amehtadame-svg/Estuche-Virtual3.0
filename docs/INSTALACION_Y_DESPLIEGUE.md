# Guía técnica de instalación y despliegue

**Estado:** revisión documental frente al código `6af297a`, 26-11-2026. Pendiente de comprobación y validación de Cristian mediante un arranque real. El Compose incluido es de **desarrollo**, no acredita producción. No se ha comprobado aquí un despliegue integrado, respaldo ni el estado de protección de ramas.

## Requisitos y preparación

Git, Node 20 para backend, Node 22 para pruebas TypeScript del frontend, pnpm 10.12.4, Docker Compose si se usa Compose y PostgreSQL accesible. Consultar [restricciones](restricciones.md): hay contradicciones de motor y versionado que requieren decisión, no una modificación unilateral.

Clonar el repositorio y seleccionar la rama aprobada. Instalar dependencias con `pnpm install --frozen-lockfile` por separado en `be` y `fe`. Copiar los `.env-example` apropiados a `.env` en un entorno privado; no compartir secretos ni guardar credenciales reales en Git.

Para el backend nativo se necesitan `DATABASE_URL`, `JWT_SECRET` de al menos 32 caracteres y la configuración restante según [`be/.env-example`](../be/.env-example). Consultar [`fe/.env-example`](../fe/.env-example) para `VITE_API_URL`. La simulación de pagos está desactivada por defecto; habilitar `ENABLE_PAYMENT_SIMULATION` solo en una demostración autorizada sin dinero real. Validar correo, URL y CORS para el ambiente elegido. No mostrar tokens en capturas ni logs compartidos.

## Advertencia crítica antes de migraciones o seed

`prisma migrate deploy` **modifica la base indicada por `DATABASE_URL`**. El servicio backend de Compose lo ejecuta automáticamente al arrancar. Confirmar destino, autorización, copia de seguridad y plan de recuperación antes de cualquier arranque que apunte a una base compartida o de producción. No ejecutar seed en una base real; consultar el código de protección y no desactivarla sin aprobación. No existe evidencia de backup aquí.

## Compose de desarrollo

[`docker-compose.yml`](../docker-compose.yml) requiere `SUPABASE_DATABASE_URL` y `JWT_SECRET` en el entorno o `.env` raíz. El servicio `backend` usa `SUPABASE_DATABASE_URL` como `DATABASE_URL`; el `db` local se levanta pero **no se utiliza automáticamente** como base principal. `LOCAL_DATABASE_URL` no es conmutación automática. La configuración CORS está fijada en el YAML: cambiar solo `.env` no la modifica. Ambos servicios ejecutan servidores de desarrollo. Vite tiene un proxy a `localhost:4000`; desde un contenedor esa dirección se refiere al propio contenedor. Comprobar cómo se resuelve `VITE_API_URL` en el navegador y la comunicación entre contenedores antes de afirmar que el proxy funciona. Cristian debe validar puertos, DNS, orígenes y política de despliegue.

Solo tras confirmar el destino de BD y respaldo:

```bash
docker compose config   # cuidado: puede imprimir secretos; no compartir salida
# docker compose up --build   # ejecuta migraciones en la BD configurada
```

El arranque previo conocido se detuvo por `JWT_SECRET` corto; no hay evidencia de que un arranque posterior haya funcionado. El comando no es una receta de producción.

## Ejecución nativa

Tras configurar una base autorizada y revisar migraciones:

```bash
cd be
pnpm install --frozen-lockfile
pnpm exec prisma generate
# pnpm exec prisma migrate deploy  # solo tras verificar DATABASE_URL y respaldo
pnpm dev
```

En otra terminal: `cd fe`, `pnpm install --frozen-lockfile`, `pnpm dev`. El proxy de Vite apunta a `localhost:4000` desde el proceso de Vite; verificar orígenes para accesos remotos. Comprobar manualmente `/api/health` y `/api/health/ready` en el puerto efectivo sin publicar credenciales; no se afirma que se haya hecho en esta revisión.

## Pruebas aisladas

- Backend: en `be`, `pnpm test`. Frontend: en `fe`, `node --test --test-concurrency=1 src/modules/frontend/*.test.ts` con Node 22. Lint y build: `pnpm lint` y `pnpm build` en `fe`.
- Integración: crear una base PostgreSQL **local exclusiva** cuyo nombre termine en `_test`; revisar que `EMPLOYEE_TEST_DATABASE_URL` y `DATABASE_URL` apunten a ella antes de migrar. A continuación `pnpm exec prisma migrate deploy` y `pnpm test:integration` desde `be`. No usar Supabase ni base habitual.
- [Resultados reales y comandos del commit probado](evidencias/pruebas/README.md); [plan de pruebas](PLAN_PRUEBAS.md). Los conteos pueden cambiar con el código.

## CI y ramas

El [workflow](../.github/workflows/ci.yml) define jobs de backend, frontend e integración para PR y push a `main`. Su existencia no prueba que haya corrido o aprobado en esta rama. [Informe histórico](INFORME_PRUEBAS.md) enlaza un run de otro commit. No está verificada la protección de `main`, los reviews ni las reglas reales del repositorio. La política de ramas se encuentra pendiente de conciliación con [contradicciones](requisitos/contradicciones.md).

## Entrega segura y verificación pendiente

Cristian debe confirmar entorno objetivo, versiones, variables y CORS, respaldo, migraciones, construcción, arranque, acceso, health, correo y rollback. La arquitectura de producción, su seguridad y disponibilidad no están certificadas. Mantener [API](API.md), [modelos](MODELOS_Y_VALIDACION.md) y esta guía sincronizados con el commit entregado.
