# CU30 - Respaldo de información

## Descripción

Como administrador quiero respaldo de información para no perder datos.

## Actores

- Administrador

## Precondiciones

- El administrador debe haber iniciado sesión.

## Postcondiciones

- La información queda registrada correctamente.

## Flujo principal (Secuencia Normal)

1. **Acción (actor):** Generar respaldo  
   **Reacción (sistema):** El sistema guarda copia automática.

## Flujo alternativo (Excepciones)

1. **Acción (actor):** Si ocurre un error, el sistema notifica fallo en el respaldo.  
   **Reacción (sistema):** El sistema muestra mensaje de advertencia.