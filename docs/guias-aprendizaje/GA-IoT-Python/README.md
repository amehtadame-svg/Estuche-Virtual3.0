# Guía de Aprendizaje — Python para Internet de las Cosas (IoT)

**Entrega completa de las cuatro actividades de aprendizaje (10 horas)**

| Identificación | Valor |
|----------------|-------|
| Programa de formación | Análisis y Desarrollo de Software |
| Código del programa | 228118 |
| Nombre del proyecto formativo | Desarrollo de software para el control de procesos orientados a microservicios |
| Fase del proyecto | Ejecución |
| Actividad de proyecto formativo | Desarrollar la estructura de datos y la interfaz de usuario del software |
| Competencia | Desarrollar la solución de software de acuerdo con el diseño y metodologías de desarrollo |
| Resultado de aprendizaje | **593108-04** — Codificar el software de acuerdo con el diseño establecido |
| Duración de la guía | 10 horas |

---

## Contenido de la entrega

| Actividad | Duración | Entregable | Archivo |
|-----------|----------|------------|---------|
| **3.1** Reflexión inicial | 1 h | Análisis de las tres preguntas orientadoras + guion del debate de 15 min | [`actividad-3.1/reflexion-inicial.md`](actividad-3.1/reflexion-inicial.md) |
| **3.2** Contextualización | 1 h | Cuestionario diagnóstico técnico (14 preguntas, clave y socialización de mitos) | [`actividad-3.2/cuestionario-diagnostico.md`](actividad-3.2/cuestionario-diagnostico.md) |
| **3.3** Apropiación | 3 h | Tres demostraciones ejecutables de los núcleos temáticos | [`actividad-3.3/`](actividad-3.3/) |
| **3.4** Transferencia | 5 h | Simulador Inteligente de Nodos IoT para Wokwi (ESP32 + MicroPython) | [`actividad-3.4/`](actividad-3.4/) |

### 3.3 — Los tres núcleos temáticos

| Núcleo | Tema | Script |
|--------|------|--------|
| 1 | Manejo y estructuración de datos: `open()`, `json`, `csv` | [`01_datos_json_csv.py`](actividad-3.3/01_datos_json_csv.py) |
| 2 | Control del tiempo y fechas: `time`, `datetime` | [`02_tiempo_fechas.py`](actividad-3.3/02_tiempo_fechas.py) |
| 3 | Protocolos de comunicación: `requests` (HTTP) y `serial` (PySerial) | [`03_protocolos_serial.py`](actividad-3.3/03_protocolos_serial.py) |

Los tres scripts funcionan **sin internet y sin hardware**:
el núcleo 3 levanta una API IoT mínima en `localhost` y usa el puerto virtual
`loop://` de PySerial para practicar la API real de `write()` / `readline()`.

---

## Cómo ejecutar todo el entregable

### Requisitos
- Python 3.9 o superior
- Librerías del núcleo 3: `pip install requests pyserial`

### Verificación automática (recomendada)
```bash
cd docs/guias-aprendizaje/GA-IoT-Python
python verificar_entregable.py
```

Ejecuta las cuatro actividades, valida los artefactos generados y reporta si el
entregable está completo. Salida esperada:

```
RESULTADO: 6/6 actividades verificadas correctamente
ENTREGABLE COMPLETO: listo para cargar en el LMS.
```

### Ejecución individual
```bash
python actividad-3.3/01_datos_json_csv.py     # datos: json, csv, open
python actividad-3.3/02_tiempo_fechas.py      # tiempo: unix, sleep, datetime
python actividad-3.3/03_protocolos_serial.py  # HTTP + serial (API local y loop://)
python actividad-3.4/prueba_local_main.py     # script de Wokwi ejecutado en el PC
```

### Laboratorio en Wokwi (actividad 3.4)
Seguir el instructivo paso a paso en
[`actividad-3.4/README.md`](actividad-3.4/README.md): creación del proyecto,
tabla de cableado, ejecución y descarga de evidencias.

---

## Estructura de archivos

```
GA-IoT-Python/
├── README.md                        <- este índice
├── verificar_entregable.py          <- comprobación automática de todo el paquete
├── actividad-3.1/
│   └── reflexion-inicial.md
├── actividad-3.2/
│   └── cuestionario-diagnostico.md
├── actividad-3.3/
│   ├── 01_datos_json_csv.py
│   ├── 02_tiempo_fechas.py
│   ├── 03_protocolos_serial.py
│   └── salidas/                     <- artefactos generados (csv, json, txt)
└── actividad-3.4/
    ├── README.md                    <- instructivo del laboratorio
    ├── prueba_local_main.py         <- arnés de compatibilidad MicroPython
    ├── wokwi/
    │   ├── main.py                  <- simulador de nodos IoT (MicroPython)
    │   ├── diagram.json             <- ESP32 + DHT22 + LDR
    │   └── historico_nodos.csv      <- histórico con marcas de tiempo
    └── evidencias/
        ├── salida_monitor_serie.txt
        └── historico_nodos.csv
```

---

## Hilo conductor de la guía

Las cuatro actividades construyen un mismo razonamiento, que es también el del
proyecto formativo:

1. **3.1 — El problema.** ¿Cómo llega un dato físico al software y cómo se
   guarda sin colapsar el disco? Conclusión: **JSON para hablar, CSV para
   recordar**, y la frecuencia de muestreo pesa más que el formato.
2. **3.2 — El diagnóstico.** Se verifica la base del grupo (estructuras de
   datos, HTTP, serial) y se corrigen los mitos antes de escribir código.
3. **3.3 — Los recursos.** Se dominan las herramientas nativas (`json`, `csv`,
   `time`, `datetime`) y las externas (`requests`, `pyserial`).
4. **3.4 — El producto.** Todo lo anterior se integra en un nodo IoT que lee
   tres sensores, estructura la mensajería JSON, persiste el histórico CSV y
   envía ráfagas de telemetría con arquitectura lista para UART y HTTP.

---

## Vínculo con el proyecto formativo Estuche Virtual

El esquema de telemetría del laboratorio está diseñado para alimentar un
microservicio. El punto de integración está definido y documentado en
[`actividad-3.4/README.md`](actividad-3.4/README.md#6-conexión-con-el-proyecto-formativo-microservicios):

```
POST /api/telemetria
Content-Type: application/json
{ "nodo_id": "...", "tipo": "rafaga_telemetria", "cantidad": 5, "lecturas": [ ... ] }
```

Ese endpoint es el mismo patrón que ya prueba el núcleo 3 de la actividad 3.3
contra la API local (respuesta `201 Created` con el total acumulado).
