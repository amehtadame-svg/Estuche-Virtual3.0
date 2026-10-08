# IncidentHub API v1

[Repositorio en GitHub](https://github.com/amehtadame-svg/Estuche-Virtual3.0/tree/arena/cbb234a7-estuche-virtual3-0/incidenthub-api)

API REST para registrar, consultar, actualizar, atender y eliminar incidentes tecnológicos. La información se conserva en un arreglo de TypeScript durante la ejecución del servidor; al reiniciarlo, se cargan nuevamente los cinco incidentes iniciales.

## Problema que soluciona

Centraliza novedades de soporte —como computadores sin conexión, impresoras con fallas o aplicaciones que no inician— para que puedan consultarse y actualizarse con un estado, una prioridad y una duración estimada.

## Tecnologías

- Node.js
- Express 4
- TypeScript
- Almacenamiento temporal en memoria (sin base de datos)
- Pruebas con `node:test` y `fetch` de Node.js

## Instalación y ejecución

Se requiere Node.js 20 o superior y npm.

```bash
cd incidenthub-api
npm install
npm run dev
```

El servidor queda disponible en `http://localhost:3000`. Se puede cambiar el puerto con la variable `PORT`.

```bash
npm run build   # compila TypeScript en dist/
npm start       # ejecuta la compilación
npm test        # compila y ejecuta las pruebas automatizadas
npm run typecheck
```

## Arquitectura

```text
incidenthub-api/
├── evidencias/
│   └── pruebas.md
├── src/
│   ├── controllers/       # Traduce las solicitudes HTTP a operaciones del servicio
│   ├── data/              # Semillas y almacén temporal en memoria
│   ├── dtos/              # Datos permitidos por operación
│   ├── errors/            # AppError
│   ├── middlewares/       # Autenticación, autorización, validación y errores
│   ├── models/            # Modelo Incident y tipos de la petición
│   ├── routes/            # Rutas y orden de middlewares
│   ├── services/          # Reglas de negocio y transiciones de estado
│   ├── tests/              # Pruebas de integración
│   ├── app.ts              # Ensambla Express y los middlewares globales
│   └── server.ts           # Inicia y cierra el servidor HTTP
├── package.json
└── tsconfig.json
```

## Endpoints

Las lecturas son públicas. Las operaciones de escritura (`POST`, `PUT`, `PATCH`) requieren un token válido. `DELETE` requiere, además, el rol administrador.

| Método | Ruta | Resultado |
|---|---|---|
| `GET` | `/api/incidents` | Lista incidentes: `{ ok, total, data }` |
| `GET` | `/api/incidents/:id` | Consulta un incidente; `404` si no existe |
| `POST` | `/api/incidents` | Crea un incidente; responde `201` |
| `PUT` | `/api/incidents/:id` | Actualiza datos editables; responde `200` o `404` |
| `PATCH` | `/api/incidents/:id/status` | Cambia el estado; responde `200`, `400` o `404` |
| `DELETE` | `/api/incidents/:id` | Elimina solo con permiso administrador; responde `204` |
| `GET` | `/api/incidents/critical` | Lista los incidentes de prioridad `CRITICAL` |
| `GET` | `/api/incidents/pending` | Lista incidentes `OPEN` o `IN_PROGRESS` |
| `GET` | `/api/incidents/stats` | Calcula el resumen operacional actual |

Los errores tienen una forma uniforme: `{ "ok": false, "message": "..." }`. Una consulta exitosa a la colección, por ejemplo, tiene esta forma:

```json
{
  "ok": true,
  "total": 5,
  "data": []
}
```

Códigos principales: `200` operación exitosa, `201` recurso creado, `204` borrado sin cuerpo, `400` entrada inválida o transición no permitida, `401` falta autenticación válida, `403` rol insuficiente, `404` recurso o ruta inexistente y `500` error inesperado.

### Tokens de práctica

No se usa JWT: los tokens fijos son únicamente para el ejercicio.

| Encabezado | Rol | Permisos de escritura |
|---|---|---|
| `Authorization: Bearer technician-token` | Técnico | Crear, actualizar y cambiar estados; no eliminar |
| `Authorization: Bearer instructor-token` | Administrador | Crear, actualizar, cambiar estados y eliminar |

Un token ausente o inválido responde `401 Unauthorized`; un técnico que intente eliminar responde `403 Forbidden`. Todas las lecturas permanecen públicas.

### Crear un incidente

El cliente envía los datos del DTO; el servidor genera `id`, establece `status` en `OPEN` y asigna `createdAt`. Campos adicionales como `id`, `status` o `createdAt` enviados por el cliente se ignoran.

```bash
curl -X POST http://localhost:3000/api/incidents \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer technician-token' \
  -d '{
    "title": "Router sin conectividad",
    "description": "El router del segundo piso perdió conexión.",
    "reporter": "Ana Torres",
    "location": "Piso 2",
    "priority": "HIGH",
    "estimatedMinutes": 40
  }'
```

### Actualizar y cambiar estado

`PUT` requiere `title`, `description`, `location`, `priority` y `estimatedMinutes`. `reporter` puede incluirse para cambiarlo; si se omite, se conserva. El `id`, el estado y la fecha de creación no son editables mediante `PUT`.

```bash
curl -X PUT http://localhost:3000/api/incidents/1 \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer technician-token' \
  -d '{
    "title": "Pantalla sin imagen",
    "description": "El monitor dejó de mostrar imagen.",
    "location": "Oficina 407",
    "priority": "HIGH",
    "estimatedMinutes": 60
  }'

curl -X PATCH http://localhost:3000/api/incidents/1/status \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer technician-token' \
  -d '{"status":"IN_PROGRESS"}'
```

Transiciones permitidas: `OPEN → IN_PROGRESS`, `OPEN → RESOLVED` e `IN_PROGRESS → RESOLVED`. Repetir el mismo estado es idempotente; no se permiten retrocesos desde `RESOLVED`.

### Eliminar

```bash
curl -X DELETE http://localhost:3000/api/incidents/3 \
  -H 'Authorization: Bearer instructor-token'
```

Una eliminación exitosa devuelve `204 No Content` y no incluye cuerpo.

## Middlewares

- **Logger**: registra cada petición al terminar, con fecha, método, ruta y código HTTP.
- **Request Info**: adjunta `timestamp`, `method` y `path` a `req.requestInfo` para los componentes siguientes.
- **Auth**: valida los tokens de práctica y adjunta el usuario autenticado a `req.user` en operaciones de escritura.
- **Admin**: permite el borrado únicamente si el rol autenticado es `ADMIN`.
- **Validate ID**: acepta solo IDs enteros positivos y seguros; los demás producen `400 Invalid incident id`.
- **Validate Incident**: valida los campos de texto y prepara un DTO con los campos permitidos. Se ejecuta antes del controlador.
- **Validate Priority**: limita la prioridad a `LOW`, `MEDIUM`, `HIGH` o `CRITICAL`.
- **Validate Time**: exige un número mayor que cero y no superior a 480. También aplica el máximo especial de 60 minutos para incidentes `CRITICAL`.
- **Validate Status**: limita el estado a `OPEN`, `IN_PROGRESS` o `RESOLVED`.
- **Not Found**: convierte las rutas desconocidas en `AppError(404, "Route not found")`.
- **Error Middleware**: transforma los errores controlados a la respuesta JSON común y evita exponer detalles internos de errores inesperados.

Orden global: `Logger → Request Info → JSON parser → Router → Not Found → Error Middleware`. En rutas de escritura, la autenticación y las validaciones se ejecutan antes del controlador.

## DTO y Model: diferencia

El **Model** `Incident` representa el incidente completo dentro de la aplicación: incluye `id`, `status` y `createdAt`, además de la información reportada. El **DTO** representa solo los datos que una operación permite recibir. Por eso `CreateIncidentDto` no tiene `id`, estado ni fecha; esos valores los decide el servidor. Mantenerlos separados evita que el cliente controle campos internos y hace explícito qué puede cambiar en cada operación.

## Validaciones y reglas de negocio

- `id` debe ser un entero positivo.
- Los textos requeridos no pueden estar vacíos.
- `priority` y `status` deben coincidir con sus valores permitidos.
- `estimatedMinutes` debe ser numérico, mayor que `0` y como máximo `480`.
- Si la prioridad es `CRITICAL`, la duración máxima es `60` minutos. Esta regla está en `validate-time.middleware.ts` porque depende conjuntamente de la prioridad y el tiempo del mismo DTO y debe detener la petición antes del controlador.
- Un incidente resuelto no puede regresar a `OPEN` ni a `IN_PROGRESS`.

## Reflexión

Separar estas responsabilidades en middlewares evita repetir las mismas comprobaciones en cada controlador. También permite que el controlador se concentre en coordinar la operación y que todos los errores tengan un formato y un código HTTP coherentes. `next()` entrega la petición al siguiente middleware cuando todo está bien, o pasa el error al manejador centralizado cuando se invoca con un error. Así el orden del flujo es visible y cada regla se puede probar o modificar sin reescribir el CRUD.

## Evidencias

La carpeta [`evidencias/`](./evidencias/pruebas.md) documenta cómo reproducir las pruebas y qué requisitos verifica cada grupo. Para ejecutarlas:

```bash
npm test
```
