# CU03 - Registrar salida

## Descripción

Permite descontar productos

## Actores

- Administrador

## Precondiciones

- El usuario debe haber iniciado sesión.

## Postcondiciones

- La información queda registrada en el sistema.

## Flujo principal (Secuencia Normal)

1. **Acción (actor):** Seleccionar producto  
   **Reacción (sistema):** El sistema procesa: Seleccionar producto
2. **Acción (actor):** Ingresar cantidad  
   **Reacción (sistema):** El sistema procesa: Ingresar cantidad
3. **Acción (actor):** Guardar  
   **Reacción (sistema):** El sistema procesa: Guardar

## Flujo alternativo (Excepciones)

1. **Acción (actor):** Stock insuficiente  
   **Reacción (sistema):** El sistema muestra: Stock insuficiente
