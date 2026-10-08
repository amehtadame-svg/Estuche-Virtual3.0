# Evidencias de pruebas — IncidentHub API v1

Las pruebas automatizadas ejercitan la API HTTP real en un puerto local temporal y reinician el arreglo de datos antes de cada caso. No requieren una base de datos ni credenciales externas.

## Reproducción

```bash
cd incidenthub-api
npm install
npm test
```

`npm test` primero compila el proyecto con TypeScript y luego ejecuta `node:test`. Para comprobar compilación y tipos por separado:

```bash
npm run build
npm run typecheck
```

## Cobertura verificable

| Requisito | Evidencia automatizada |
|---|---|
| Listado y consulta por ID | `GET /api/incidents`, `GET /api/incidents/1` |
| Incidente inexistente | `GET /api/incidents/999` devuelve `404 Incident not found` |
| Validación de ID | Rechaza `abc`, `-3`, `4.5`, `0` y un entero fuera del rango seguro |
| Creación y DTO | `POST` genera ID, `OPEN` y fecha; ignora campos controlados enviados por el cliente |
| Validación del incidente | Rechaza título faltante, prioridad inválida y duraciones no numéricas o fuera de rango |
| Regla CRITICAL | Rechaza más de 60 minutos |
| Actualización | `PUT` conserva ID, estado, fecha de creación y reporter omitido |
| Transiciones | Acepta `OPEN → IN_PROGRESS` e `IN_PROGRESS → RESOLVED`; rechaza el retroceso desde `RESOLVED` |
| Autenticación | Escritura sin token devuelve `401`; JSON malformado devuelve `400` centralizado |
| Autorización | DELETE con técnico devuelve `403`; con instructor devuelve `204` sin cuerpo |
| Rutas y errores | Una ruta no definida responde `404 Route not found` |
| Retos | `/critical`, `/pending` y `/stats` se verifican sobre datos iniciales conocidos |
| Request Info | Confirma que el middleware adjunta fecha, método y ruta a `req.requestInfo` |

## Ejemplos manuales

Con el servidor activo (`npm run dev`), estas peticiones permiten revisar los casos clave desde cURL, Postman o Thunder Client:

```bash
# Lectura pública
curl http://localhost:3000/api/incidents

# Creación con rol de técnico
curl -X POST http://localhost:3000/api/incidents \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer technician-token' \
  -d '{"title":"Router sin conectividad","description":"Sin conexión en el segundo piso.","reporter":"Ana Torres","location":"Piso 2","priority":"HIGH","estimatedMinutes":40}'

# Un técnico no puede borrar (403)
curl -i -X DELETE http://localhost:3000/api/incidents/1 \
  -H 'Authorization: Bearer technician-token'

# El administrador sí puede borrar (204)
curl -i -X DELETE http://localhost:3000/api/incidents/1 \
  -H 'Authorization: Bearer instructor-token'
```

Los resultados esperados y los mensajes de error se verifican en las aserciones de `src/tests/incidenthub.test.ts`; la evidencia se puede regenerar en cualquier instalación con `npm test`.
