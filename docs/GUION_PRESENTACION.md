# Guion de presentación — 15 minutos

Guion propuesto: repartir tiempos y roles en reunión real. No presentar capturas, decisiones o pruebas que no existan. Si la demostración falla, mostrar los archivos locales y explicar su alcance sin afirmar que funcionó en ese momento.

| Minuto | Tema y qué mostrar | Mensaje y evidencia |
|---|---|---|
| 0:00–1:00 | Problema y propósito | Presentar Estuche Virtual, actores y alcance; [README](../README.md). |
| 1:00–2:30 | Requisitos y trazabilidad | [Índice](README.md) y [matriz](matriz-evidencias.md). La foto original se debe contrastar; criterios no son aprobación. |
| 2:30–4:30 | Modelos | [MER, relacional, casos de uso, dominio y secuencias](MODELOS_Y_VALIDACION.md). Aclarar vistas parciales y validaciones pendientes. |
| 4:30–6:00 | Arquitectura y despliegue | Mostrar frontend, API, Prisma y PostgreSQL; [guía](INSTALACION_Y_DESPLIEGUE.md). Compose es de desarrollo y su arranque actual no está acreditado. |
| 6:00–8:00 | Flujo de compra | Mostrar [secuencia](requisitos/mer/secuencia-compra.svg) y, solo si existe entorno seguro, simular compra. No hay pasarela ni dinero real. |
| 8:00–9:30 | Empleado y repartidor | Explicar toma y empaque, pago en tienda y autoservicio de repartidor; [operación](OPERACION_EMPLEADOS.md). No afirmar validación UX pendiente. |
| 9:30–11:00 | Pruebas | [Logs reales](evidencias/pruebas/README.md): BE 144, FE 42, integración 40, build y lint; precisar commit, base aislada y 5 warnings. |
| 11:00–12:30 | Hallazgos y regresión | [Registro local](REGISTRO_DEFECTOS.md): ejemplos observados, prioridad propuesta, sin tickets ni retests inventados. |
| 12:30–14:00 | Scrum y deuda | [Backlog propuesto](scrum/PRODUCT_BACKLOG.md) y [plantillas](scrum/README.md). Estimaciones, tablero, retrospectiva y feedback reales aún por aportar. |
| 14:00–15:00 | Limitaciones y cierre | Mostrar [matriz](matriz-evidencias.md); solicitar validación Franck, Paula y Cristian, y responder preguntas. |

No mostrar contraseñas, datos personales, tokens de invitación ni variables de entorno. El equipo debe ensayar y confirmar que los tiempos y mensajes correspondan a su evidencia real.
