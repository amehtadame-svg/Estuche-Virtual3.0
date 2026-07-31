# HU-009 — Generación de reportes de compras

## Identificación
- ID: HU-009
- Título: Generación de reportes de compras
- Módulo: Reportes
- Prioridad: Media
- Estado: Por Implementar
- RF asociados: RF-009

## Historia
Como administrador, quiero generar reportes de compras, para controlar los gastos e inversión en abastecimiento de inventario.

## Criterios de Aceptación

### CA-009.1 — Filtro y detalle del gasto en abastecimiento
- Dado que accedo al panel de reportes de compras (`/reports/purchases`),
- cuando selecciono un rango de fechas de consulta,
- entonces el sistema genera un resumen con el monto total gastado y el desglose de ingresos por proveedor y lote.

### CA-009.2 — Resultado sin movimientos en el período
- Dado que no existen ingresos registrados en las fechas seleccionadas,
- cuando ejecuto la consulta,
- entonces el sistema muestra: "No se encontraron compras en el período seleccionado" con totales en cero.

## Endpoints
- Método: GET
- Ruta: `/api/v1/reports/purchases`
- Descripción: Devuelve el reporte de gastos de compras

## Notas técnicas
- Agrupación por proveedor (`supplier_id`) y fecha.
- Procesamiento del campo `cost_price` en la tabla de recepciones o lotes de compra para mayor exactitud financiera.
