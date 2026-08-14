<!--
  ¿Qué? Historia de usuario que describe la exportación de reportes generados por el sistema.
  ¿Para qué? Formalizar la descarga de información en formatos reutilizables.
  ¿Impacto? Permite compartir la información con contabilidad o terceros fuera de la plataforma.
-->

# HU-024 — Exportación de reportes

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-024 |
| **Título** | Exportación de reportes |
| **Módulo** | Reportes |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-027|

---

## Historia

**Como** administrador del negocio, director general, contador externo o analista financiero, responsable del análisis consolidado de datos, presentación de informes gerenciales y cumplimiento de auditorías contables,  
**quiero** contar con una funcionalidad transversal de exportación que me permita transformar y descargar cualquier reporte, tabla o consolidado financiero e inventarial consultado en pantalla hacia archivos estructurados en formatos estándares como hojas de cálculo de Microsoft Excel (.xlsx) o documentos portátiles imprimibles (.pdf),  
**para** procesar libremente la información en herramientas de análisis externo o modelos financieros, respaldar digitalmente los cierres contables periódicos fuera del sistema, compartir reportes ejecutivos con socios o auditores externos y conservar archivos físicos o digitales formalmente diagramados para el archivo histórico de la empresa.

---

## Criterios de Aceptación

### CA-024.1 — Descarga en formato Excel (.xlsx)
- **Dado que** estoy visualizando un reporte en pantalla,
- **cuando** hago clic en el botón "Exportar a Excel",
- **entonces** el sistema genera y descarga un archivo `.xlsx` estructurado con columnas, encabezados y totales.

### CA-024.2 — Descarga en formato PDF (.pdf)
- **Dado que** me encuentro en una vista de reportes,
- **cuando** presiono "Exportar a PDF",
- **entonces** el sistema genera y descarga un documento `.pdf` listo para impresión con formato formal.

### CA-024.3 — Respeto estricto de los filtros de consulta aplicados
- **Dado que** apliqué un filtro de fechas o categorías en el reporte en pantalla,
- **cuando** ejecuto la exportación a Excel o PDF,
- **entonces** el archivo generado contiene únicamente los datos filtrados y no la totalidad de la base de datos.

### CA-024.4 — Indicador visual de procesamiento de archivo
- **Dado que** solicito la descarga de un reporte con un gran volumen de información,
- **cuando** el backend procesa el archivo,
- **entonces** la pantalla muestra el mensaje "Generando archivo..." y deshabilita temporalmente el botón de exportación para evitar solicitudes duplicadas.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/export` | Descarga el archivo del reporte en el formato elegido |

---

## Notas técnicas

- Generación de archivos mediante librerías del lado del servidor (ej. `ExcelJS` para plantillas Excel y `PDFKit` / `Puppeteer` para archivos PDF).
- Respuestas HTTP con cabecera `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` o `application/pdf`.
