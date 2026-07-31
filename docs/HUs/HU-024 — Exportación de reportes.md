# HU-024 — Exportación de reportes

## Identificación

| Campo | Valor |
|-------|-------|
| **ID** | HU-024 |
| **Título** | Exportación de reportes |
| **Módulo** | Reportes |
| **Prioridad** | Media |
| **Estado** | Por Implementar |
| **RF asociados** | RF-024 |

---

## Historia
**Como** administrador,
**quiero** exportar reportes,
**para** analizar la información en herramientas externas en formatos Excel o PDF.

---

## Criterios de Aceptación

### CA-024.1 — Descarga en formato Excel (.xlsx)

- **Dado que** estoy visualizando un reporte de ventas o inventario,
- **cuando** hago clic en "Exportar a Excel",
- **entonces** el sistema descarga un archivo ejecutable/hoja de cálculo con todos los datos tabulados correctamente.

### CA-024.2 — Descarga en formato PDF (.pdf)

- **Dado que** estoy visualizando un reporte,
- **cuando** elijo la opción "Exportar a PDF",
- **entonces** el sistema descarga un documento listo para impresión con encabezados, totales y formato formal.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/export` | Descarga el archivo del reporte en el formato elegido |

---

## Notas técnicas

- Generación de archivos mediante librerías del lado del servidor (ej. `ExcelJS` para plantillas Excel y `PDFKit` / `Puppeteer` para archivos PDF).
- Respuestas HTTP con cabecera `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` o `application/pdf`.
