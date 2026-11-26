# Cómo aplicar estos cambios en tu rama / Codespace

> **No hay que crear ninguna rama de Arena.** El parche es un `diff` normal
> contra `main`; se aplica sobre tu propia rama con las órdenes de abajo.
>
> El parche **solo agrega y endurece validaciones**. No reescribe módulos de
> compañeros: `payments.service.ts` (13 líneas), `employee.service.ts` (+6
> líneas) y `pqr.*` (código nuevo al final). Nada de `receipt.service.ts`,
> `employee.service.ts` (lógica de reserva) ni `Profile.tsx`.

---

## 0. Regla de oro antes de empezar

```bash
cd /ruta/a/tu/repo
git switch <tu-rama>          # NO la de arena
git fetch origin
git merge origin/main         # asegúrate de estar al día (PR #94 ya está en main)
pnpm --dir be test 2>/dev/null || npm --prefix be test   # línea base en verde
```

Si tu línea base **ya** falla, anota qué falla antes de aplicar nada: así sabes
si después algo se rompió por este parche.

---

## 1. Aplicar (recomendado): el parche completo

Descarga `cambios-estuche-virtual.patch` de la raíz del repo (está en la rama de
Arena y también en el mensaje que te acompañó) y:

```bash
git apply --check cambios-estuche-virtual.patch   # ¿aplica limpio?
git apply cambios-estuche-virtual.patch
```

Si `--check` falla porque tu rama ya divergió, usa el método de 3 vías:

```bash
git apply --3way cambios-estuche-virtual.patch
# resolver conflictos a mano si aparecen (poco probable: solo 19 archivos)
```

Verifica que aplicó:

```bash
git status --short     # deben salir 19 archivos
```

---

## 2. Alternativa: archivos nuevos (copiar y pegar)

Estos 4 archivos son **nuevos**, no reemplazan nada existente. Créalos tal cual:

| Archivo | Contenido |
| --- | --- |
| `be/src/modules/pqr/contact.schema.ts` | Esquema Zod del formulario de contacto |
| `be/src/modules/reports/reports.sales.test.ts` | Prueba: venta nueva → reportes |
| `be/tests/orders-regression.integration.ts` | Suite de regresión contra PostgreSQL real |
| `docs/api/contrato-api.md` | Contrato de API (sección C) |

---

## 3. Archivos que se **reemplazan completos**

Estos son más fáciles reemplazando el archivo entero que parcheando a mano:

| Archivo | Qué cambia | Riesgo |
| --- | --- | --- |
| `be/src/modules/orders/orders.schema.ts` | `details` obligatorio (1..100), `quantity` 1..999, `fulfillmentMethod`, `deliveryAddress`, `promotionalCode` | Bajo: es un esquema |
| `be/src/modules/orders/orders.service.ts` | Validación + consumo de cupón + stock | **Medio**: es el núcleo; úsalo del parche |
| `be/src/modules/orders/orders.test.ts` | Pruebas (3 antiguas se reescriben porque medían los defectos) | Ninguno: es prueba |
| `fe/src/pages/Admin/Orders/Orders.tsx` | El modal envía líneas y dirección | Bajo: solo lo usa esta pantalla |

> ⚠️ **`orders.test.ts`**: 3 de las pruebas anteriores afirmaban justo los
> defectos que se corrigieron ("un pedido sin detalles queda en cero", "un
> pedido sin detalles no descuenta stock", "el descuento de stock sin
> `deletedAt`"). Se **reescribieron** para exigir el comportamiento correcto; no
> se borró ninguna (se pasó de 9 a 25 pruebas en ese archivo). Si prefieres
> conservarlas, tendrías dos pruebas contradictorias.

---

## 4. Archivos que se modifican en **pocas líneas**

### 4.1 `be/src/modules/employee/employee.service.ts` — **+6 líneas**

Búscalo dentro de `createOrder`, justo antes de `const deliveryFee = ...`:

```ts
      // Un pedido operativo siempre debe reservar unidades: si una línea no
      // descontó stock, el checkout no puede seguir con existencias fantasma.
      if (!details.length) {
        throw badRequest('El pedido debe incluir al menos un producto.');
      }
```

**Por qué:** sin esto, un `POST /api/employee/orders` sin líneas creaba el pedido
y los movimientos **sin descontar stock** (existencias fantasma).

### 4.2 `be/src/modules/payments/payments.service.ts` — 13 líneas

1. La importación:

```ts
import { consumeCoupon, normalizeCoupon, couponDiscount } from '../promotional-code/promotional-code.domain';
```

2. El bloque `if (input.code) { ... }` del checkout queda así:

```ts
      if (input.code) {
        // A-07: mismo bloqueo por cupón y mismo incremento condicional que el
        // checkout de pedidos, para que dos intentos simultáneos no superen maxUses.
        const candidate = await tx.promotionalCode.findFirst({ where: { code: { equals: normalizeCoupon(input.code), mode: 'insensitive' } } });
        if (!candidate) throw badRequest('No encontramos ese cupón. Revisa el código e intenta de nuevo.');
        const promo = await consumeCoupon(tx, candidate.id, total.toNumber());
        total = total.minus(couponDiscount(total, promo));
        promotionalCodeId = promo.id;
      }
```

**Por qué:** sigue funcionando igual, pero el consumo del cupón pasa a ser a
prueba de concurrencia (antes era un `update` ciego).

### 4.3 `be/src/modules/pqr/pqr.service.ts`, `.controller.ts`, `.routes.ts`

**Solo se agrega** código al final. `pqrService` no se modificó. Se añade
`contactService` + una ruta `POST /api/pqr/contact`. Si no quieres tocar PQR,
puedes omitir estos 3 archivos y con ello solo pierdes el punto B-01.

### 4.4 `be/src/modules/promotional-code/promotional-code.domain.ts`

**Solo se agrega** `consumeCoupon()` al final del archivo. `assertCoupon` y
`couponDiscount` quedan **intactos**. Es el archivo más importante de la
sección A.

### 4.5 `fe/src/pages/Contact/Contact.tsx` + `.css`

El formulario deja de simular. **Ojo:** usa `useAuth` y `authHeaders`; si tu
`AuthContext` cambió de ruta, ajusta el import:

```ts
import { useAuth } from '../../hooks/useAuth';
```

---

## 5. Verificación después de aplicar

```bash
# Backend
cd be
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm build                 # tsc — debe salir sin errores
DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  JWT_SECRET="0123456789012345678901234567890123" \
  NODE_ENV=test pnpm test  # esperado: 148 pass / 0 fail

# Frontend
cd ../fe
pnpm install --frozen-lockfile
pnpm lint                  # esperado: 0 errores (5 warnings previos)
pnpm test                  # esperado: 35 pass / 0 fail
```

Integración (necesita PostgreSQL real, **base terminada en `_test`**):

```bash
cd be
export EMPLOYEE_TEST_DATABASE_URL="postgresql://postgres@localhost:5432/estuche_virtual_test"
pnpm prisma migrate deploy
pnpm test:integration
```

> En el sandbox de Arena `prisma generate` falla porque `binaries.prisma.sh`
> está bloqueado; en tu Codespace no debería pasar. Todo se validó igualmente en
> el job `integration` de GitHub Actions.

---

## 6. Plan de rollback

El parche es un commit normal: si algo se rompe,

```bash
git apply -R cambios-estuche-virtual.patch    # deshace
# o, si ya hiciste commit:
git revert <sha-del-commit>
```

No hay migraciones de base de datos nuevas, así que **no hay cambios de esquema
que revertir**. Basta con revertir el código.

---

## 7. Orden sugerido para no romper nada

1. Aplica el parche completo.
2. Corre backend + frontend (pasos de §5).
3. Prueba a mano **el flujo que ya funcionaba**: crear pedido desde
   `/empleado/nuevo` (Workspace) y pagar en el checkout de demostración.
4. Solo entonces corre la integración.
5. Si todo pasa, sube tu rama.

Los 3 flujos con más riesgo de tu día a día son:
- **Crear pedido desde el panel admin** → ahora exige producto y cantidad (el modal cambió).
- **Checkout del cliente** → ya no envía `total`; el servidor lo calcula.
- **Aplicar cupón a un pedido** → ahora un pedido admite un solo cupón.
