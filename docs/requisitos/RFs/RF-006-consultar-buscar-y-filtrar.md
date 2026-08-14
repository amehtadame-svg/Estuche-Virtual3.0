<!--
  ¿Qué? Requisito funcional que describe la consulta, búsqueda y filtrado de productos.
  ¿Para qué? Definir los criterios de búsqueda disponibles para clientes y visitantes.
  ¿Impacto? Es la funcionalidad más usada del catálogo público.
-->

# RF-006 — Consultar, Buscar y Filtrar Productos

**Historia de usuario relacionada**: HU-027

## Descripción

El sistema debe permitir que cualquier usuario consulte el catálogo de productos disponibles. Además, deberá ofrecer herramientas de búsqueda y filtros que faciliten encontrar productos por nombre, categoría o estado de disponibilidad.

---

## Flujo del proceso

| Paso | Descripción |
|------|-------------|
| 1 | El usuario accede al catálogo de productos. |
| 2 | El sistema carga todos los productos disponibles. |
| 3 | El usuario ingresa un término de búsqueda o selecciona uno o varios filtros. |
| 4 | El sistema procesa la solicitud y aplica los filtros correspondientes. |
| 5 | Se muestran únicamente los productos que cumplen con los criterios establecidos. |
| 6 | El usuario puede consultar la información detallada de cualquier producto. |

---

## Reglas de Negocio

| ID | Regla |
|----|--------|
| RN-001 | Solo se mostrarán productos activos y aprobados. |
| RN-002 | La búsqueda podrá realizarse por nombre del producto. |
| RN-003 | El sistema permitirá filtrar por categoría. |
| RN-004 | El sistema permitirá ordenar los productos por precio o nombre. |
| RN-005 | Si no existen coincidencias, el sistema mostrará un mensaje indicando que no se encontraron resultados. |

---

## Inputs / Outputs

### Input

```json
{
  "nombre": "Cuaderno",
  "categoria": "Escolar",
  "estado": "Disponible"
}
```

### Output éxito (HTTP 200)

```json
[
  {
    "id": 12,
    "nombre": "Cuaderno Argollado",
    "precio": 12500,
    "stock": 18,
    "categoria": "Escolar"
  }
]
```

### Output error (HTTP 404)

```json
{
  "mensaje": "No se encontraron productos."
}
```

---

## Endpoint

| Método | Ruta | Auth requerida | Descripción |
|---------|------|----------------|-------------|
| GET | `/api/productos` | No | Consulta el catálogo de productos. |
| GET | `/api/productos/buscar` | No | Busca productos mediante filtros y criterios de búsqueda. |

---
