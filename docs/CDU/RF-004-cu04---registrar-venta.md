# CU04 - Registrar venta

## Descripción

Registrar venta de productos

## Actores

- Vendedor

## Precondiciones

- El usuario debe haber iniciado sesión.

## Postcondiciones

- La información queda registrada en el sistema.

## Flujo principal (Secuencia Normal)

1. **Acción (actor):** Seleccionar producto  
   **Reacción (sistema):** El sistema procesa: Seleccionar producto
2. **Acción (actor):** Cantidad  
   **Reacción (sistema):** El sistema procesa: Cantidad
3. **Acción (actor):** Confirmar  
   **Reacción (sistema):** El sistema procesa: Confirmar

## Flujo alternativo (Excepciones)

1. **Acción (actor):** Stock insuficiente  
   **Reacción (sistema):** El sistema muestra: Stock insuficiente
