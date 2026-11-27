# RF-003 — Agregar nuevos productos

**Historia relacionada:** HU-001.

## Descripción

El sistema permite a administradores y superadministradores registrar productos del catálogo, indicando nombre, precio y datos opcionales de identificación, descripción, categoría, imagen y stock inicial.

## Flujo y reglas

1. Una persona con rol administrativo autenticada abre Productos y diligencia los datos.
2. Se exige nombre y precio positivo; el stock inicial debe ser un entero no negativo. Si se proporciona costo, debe ser positivo.
3. Se validan duplicados por nombre activo, SKU y código de barras; los códigos de productos eliminados siguen reservados.
4. Se registra el producto y, cuando tiene stock inicial positivo, su movimiento de ingreso.
5. El producto queda disponible en el catálogo si no está eliminado; no existe una etapa de aprobación previa.

## Rutas y evidencia

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/products` | Administrador o superadministrador |
| GET | `/api/products` | Público |

Evidencia: `be/src/modules/products/products.routes.ts`, `products.schema.ts`, `products.service.ts` y `fe/src/pages/Admin/Products/Products.tsx`. El alcance descrito no certifica todos los criterios de HU-001.
