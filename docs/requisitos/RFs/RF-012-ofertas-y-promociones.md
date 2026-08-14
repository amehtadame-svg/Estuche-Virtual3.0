<!--
  ¿Qué? Requisito funcional que describe la administración de ofertas y promociones.
  ¿Para qué? Definir cómo se crean, aplican y desactivan los descuentos comerciales.
  ¿Impacto? Es una palanca comercial clave en fechas de alta demanda escolar.
-->

# RF-012 — Ofertas y Promociones

**Historia de usuario relacionada**: HU-036

## Descripción

El sistema debe permitir administrar ofertas y promociones aplicables a determinados productos, categorías o clientes. Las promociones aprobadas deberán visualizarse en el catálogo y aplicarse automáticamente cuando se cumplan las condiciones establecidas.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El administrador accede al módulo de promociones. |
| 2 | Registra una nueva oferta o modifica una existente. |
| 3 | Define el porcentaje de descuento y el período de vigencia. |
| 4 | El sistema valida la información ingresada. |
| 5 | La promoción queda disponible para los productos seleccionados. |
| 6 | Los clientes visualizan el descuento en el catálogo. |
| 7 | Durante la compra, el sistema aplica automáticamente la promoción vigente. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo los administradores podrán crear, modificar o eliminar promociones. |
| RN-002 | Toda promoción deberá tener una fecha de inicio y una fecha de finalización. |
| RN-003 | El descuento no podrá ser inferior al 1% ni superior al 100%. |
| RN-004 | Las promociones vencidas dejarán de aplicarse automáticamente. |
| RN-005 | El sistema calculará el descuento antes de generar el valor total del pedido. |

---

## Inputs / Outputs

### Input

```json
{
  "nombre": "Regreso a clases",
  "descuento": 20,
  "fechaInicio": "2026-08-01",
  "fechaFin": "2026-08-15"
}
```

### Output éxito (HTTP 201)

```json
{
  "mensaje": "Promoción creada correctamente."
}
```

### Output error (HTTP 400)

```json
{
  "error": "La información de la promoción es inválida."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| POST | `/api/promociones` | Sí (Administrador) | Crea una nueva promoción. |
| PUT | `/api/promociones/{id}` | Sí (Administrador) | Actualiza una promoción existente. |
| DELETE | `/api/promociones/{id}` | Sí (Administrador) | Elimina una promoción. |
