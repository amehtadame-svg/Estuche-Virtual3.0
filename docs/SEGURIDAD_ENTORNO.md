# Auditoría de seguridad y entorno — Estuche Virtual

| Campo | Valor |
| --- | --- |
| **Fecha** | 2026-11-25 |
| **Commit** | Rama `arena/bec2ab3d-estuche-virtual3-0` (PR #84) — ver `git log` del PR para el hash vigente |
| **Alcance** | Credenciales en código e historial, datos personales, ejemplos `.env`, variables necesarias |

---

## 1. Hallazgos y estado

### 1.1 Cuentas reales en el seed (RESUELTO en este PR)

**Antes:** `be/prisma/seed.ts` contenía 4 cuentas con **correos personales reales**
del equipo y contraseñas en texto plano (publicadas en un repo público).

**Ahora:** reemplazadas por cuentas sintéticas con dominio `.test` (RFC 2606 —
no existen, no pueden recibir correo):

| Rol | Email sintético | Contraseña demo |
| --- | --- | --- |
| Superadmin | `superadmin@estuche.test` | `SuperAdmin123!` |
| Admin | `admin@estuche.test` | `Admin123!` |
| Superadmin 2 | `superadmin2@estuche.test` | `SuperAdmin123!` |

Los usuarios demo de empleado/cliente/domiciliario usan dominio `@estuche.com`
(sintético, no es una cuenta real). El guardián `ALLOW_SEED_SUPABASE` sigue
impidiendo tocar la base principal.

### 1.2 Credenciales en el historial de git (ACCIÓN REQUERIDA — rotación)

El historial del repo (que es **público**) conserva, en commits antiguos,
credenciales que ya no están en el árbol actual:

| Dónde (histórico) | Qué | Acción |
| --- | --- | --- |
| `be/prisma/seed.ts` (versiones previas) | Correos personales del equipo + contraseñas en claro | **Rotar esas contraseñas** si se reutilizan en otras cuentas (la más urgente: la contraseña que empieza por la del seed antiguo). Los correos ya no están en el árbol actual, pero sí en el historial. |
| `README.md` (versiones previas) | Credenciales de acceso documentadas | Rotar si siguen vigentes |
| `be/supabase_completo.sql`, `db/init/01_public_schema.sql` (histórico) | Dump de esquema/datos con URLs `postgresql://…pooler.supabase.com` y contraseña | **Rotar la contraseña del proyecto Supabase** (Dashboard → Settings → Database → Reset password) |
| `.env` commiteado (histórico, `bfe42b8`, `6adfd77`, `f2f9683`) | `DATABASE_URL` con contraseña real de Supabase | Misma rotación de arriba |
| Todo el historial | **No se encontró ningún JWT firmado** | Nada que hacer |

> **No se reescribió el historial** en este PR: `git filter-repo` + force-push
> rompería los forks/clones del equipo (y `docs/restricciones.md` RH-002
> prohíbe force-push). La rotación de credenciales **hace inocente** el contenido
> histórico: es el paso correcto antes de (opcionalmente) limpiar el historial.

#### Plan de rotación recomendado (coordinar con el equipo)

1. Contraseña de la cuenta personal aparecida en el seed antiguo → cambiarla si
   es la misma que usan en otro servicio.
2. Proyecto Supabase → *Settings → Database → Reset password* (o rotar la
   contraseña del usuario `postgres`); actualizar `SUPABASE_DATABASE_URL` en
   Codespaces secrets / `.env` local.
3. Si el Gmail del proyecto (`estuchevirtual272@gmail.com`, mencionado en la
   documentación de `be/src/lib/mailer.ts`) usa una contraseña de aplicación
   vieja → regenerarla en `myaccount.google.com/apppasswords`.
4. Confirmar que ningún `.env` está tracked: `git ls-files | grep -i env`
   (solo deben aparecer los `*-example`).

### 1.3 Ejemplos `.env` (RESUELTO en este PR)

Los tres archivos `.env-example` (raíz, `be/`, `fe/`) eran heredocs de shell
(`cat > … <<'EOF'`) — no se podían copiar tal cual. Ahora son ejemplos reales
de variables, **sin secretos**, con instrucciones de generación
(`openssl rand -base64 32`) y prioridades documentadas.

### 1.4 Secretos en CI (RESUELTO en este PR)

- GitGuardian detectó un literal `POSTGRES_PASSWORD` en el service de CI →
  cambiado a auth `trust` (base efímera del runner, solo localhost).
- Los `JWT_SECRET` de CI se componen con `${{ github.run_id }}` (únicos por
  ejecución, no hardcodeados).
- Resultado: ningún secreto literal en `.github/workflows/ci.yml`.

### 1.5 Variables necesarias (documentado)

Inventario completo en `docs/INSTALACION_Y_DESPLIEGUE.md` sección 3:

- **Raíz (obligatorias):** `SUPABASE_DATABASE_URL`, `JWT_SECRET`.
- **Backend:** `DATABASE_URL`, `JWT_SECRET` (≥32, validado al arrancar),
  `PORT`, `CORS_ORIGINS` (+ opcional de rate-limit, reservas, correo, SMTP).
- **Frontend:** `VITE_API_URL` (opcional en dev; prioridad documentada).
- **Pruebas:** `EMPLOYEE_TEST_DATABASE_URL` (obligatoria para integración;
  solo `localhost` + nombre `*_test`).

El backend ahora **falla al arrancar con mensaje claro** si falta algo
(`be/src/lib/config.ts`), en lugar de arrancar a medias.

### 1.6 Capturas, logs y diapositivas

- El seed ya no imprime datos personales en logs.
- Los mensajes de error de arranque muestran **nombres de variable**, nunca
  valores.
- `be/src/lib/mailer.ts` solo loguea el correo configurado (no la contraseña).
- Checklist para el equipo antes de subir capturas/diapositivas:
  - [ ] No aparece ningún `.env` real ni pantalla de variables con valores.
  - [ ] No aparecen contraseñas de usuarios reales (las de demo son públicas
        por diseño: dominio `.test` / `@estuche.com`).
  - [ ] No aparece la URL de conexión de Supabase con contraseña.

---

## 2. Resumen de controles activos

| Control | Estado |
| --- | --- |
| Sin credenciales reales en el árbol actual | ✅ |
| `.env` fuera de git (`.gitignore`) | ✅ |
| Validación de config + ping a BD al arrancar | ✅ (`config.ts`) |
| Health endpoints públicos (`/api/health`, `/api/health/ready`) | ✅ |
| JWT_SECRET ≥ 32 caracteres exigido al arrancar | ✅ |
| CORS lista blanca (nunca `*`) + validación en tests | ✅ |
| Rate-limit en `/api/auth` | ✅ |
| Seed bloqueado contra Supabase | ✅ (`ALLOW_SEED_SUPABASE`) |
| Ambiente de pruebas separado (`*_test`, aborta si apunta a otra base) | ✅ |
| Secrets de CI sin literales | ✅ |
| Rotación de credenciales históricas | ⏳ **Pendiente de coordinación con el equipo (sección 1.2)** |
| Protección de rama `main` | ⏳ Ver sección 3 |
| Limpieza de historial (`git filter-repo`) | ⏳ Opcional, después de rotar |

---

## 3. Protección de rama principal

Verificado con la API de GitHub el 2026-11-25:

```
GET /repos/amehtadame-svg/Estuche-Virtual3.0/branches/main  →  "protected": false
GET /repos/…/branches/main/protection                       →  403 (el token actual no es admin)
```

**`main` NO está protegida actualmente.** Configuración recomendada
(Settings → Branches → Add branch protection rule, requiere permiso de
admin del repo):

- **Require a pull request before merging** (1 revisión mínimo).
- **Require status checks to pass before merging**: los 3 jobs de la CI
  (`Backend (build + tests unitarios)`, `Frontend (lint + build + tests)`,
  `Integración (PostgreSQL real)`).
- **Do not allow force pushes** y **do not allow deletions**
  (coherente con RH-002 de `docs/restricciones.md`).

Esto garantiza que ningún commit llegue a `main` sin CI verde (RH-002:
"los PR se revisan y deben tener todos los tests verdes antes del merge").
