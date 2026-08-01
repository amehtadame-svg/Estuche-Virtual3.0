# HU-009 — Generación de reportes de compras

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-009 |
| **Título** | Generación de reportes de compras |
| **Módulo** | Reportes |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-009 |

---

## Historia

**Como** administrador del negocio, encargado de finanzas o tesorero, responsable del control de egresos, fiscalización de presupuestos e inversión de capital en inventario,  
**quiero** emitir informes detallados y consolidados con el histórico de compras de mercancía recibidas dentro de un intervalo de fechas específico, incluyendo filtros por proveedor emisor y estado de entrega,  
**para** controlar con precisión las salidas de capital destinadas al abastecimiento del almacén, auditar el volumen de compras efectuado a cada distribuidor comercial, evaluar la evolución de los costos unitarios de adquisición y mantener un balance financiero transparente entre egresos e ingresos.

---


## Criterios de Aceptación

### CA-009.1 — Filtro combinado de reporte de compras por fechas y proveedor
- **Dado que** accedo al módulo de reportes de compras (`/reports/purchases`),
- **cuando** selecciono un rango de fechas y (opcionalmente) elijo un proveedor específico en el menú desplegable,
- **entonces** el sistema consulta y genera el informe consolidado correspondiente.

### CA-009.2 — Consolidado de montos y volumen de compras
- **Dado que** se procesan los datos del reporte de compras,
- **cuando** los resultados se muestran en pantalla,
- **entonces** debo visualizar: Monto Total Invertido en Compras, Número de Órdenes Recibidas y Cantidad de Productos Incorporados.

### CA-009.3 — Detalle modal explicativo por orden de compra
- **Dado que** reviso la tabla de órdenes de compra incluidas en el reporte,
- **cuando** hago clic sobre una orden específica,
- **entonces** el sistema debe abrir una ventana modal con el desglose de productos adquiridos, sus cantidades y los costos unitarios negociados.

### CA-009.4 — Restablecimiento de los parámetros de búsqueda del reporte
- **Dado que** he aplicado filtros en la consulta de compras,
- **cuando** presiono el botón "Limpiar Filtros",
- **entonces** el formulario restaura las fechas por defecto del mes actual, elimina el filtro de proveedor y refresca los datos.

---

## Notas técnicas
- Agrupación por proveedor (`supplier_id`) y fecha.
- Procesamiento del campo `cost_price` en la tabla de recepciones o lotes de compra para mayor exactitud financiera.
