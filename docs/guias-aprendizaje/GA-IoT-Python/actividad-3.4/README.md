# Actividad 3.4 — Transferencia del Conocimiento: Laboratorio de Simulación

**Simulador Inteligente de Nodos IoT en Wokwi (ESP32 + MicroPython)**

| Dato | Valor |
|------|-------|
| Programa | Análisis y Desarrollo de Software — 228118 |
| Proyecto formativo | Desarrollo de software para el control de procesos orientados a microservicios |
| Fase | Ejecución |
| Actividad de proyecto | Desarrollar la estructura de datos y la interfaz de usuario del software |
| Competencia | Desarrollar la solución de software de acuerdo con el diseño y metodologías de desarrollo |
| Resultado de aprendizaje | 593108-04 — Codificar el software de acuerdo con el diseño establecido |
| Duración de la guía | 10 horas (laboratorio: trabajo colaborativo por equipos) |

---

## 1. Desafío y su cumplimiento

| # | Especificación del desafío | Dónde se cumple |
|---|---------------------------|-----------------|
| 1 | Placa embebida compatible con MicroPython (ESP32) + tres sensores virtuales: Temperatura, Humedad y Luz | `wokwi/diagram.json` (ESP32-DevKitC V4 + `wokwi-dht22` + `wokwi-photoresistor-sensor`) y clase `Sensores` en `wokwi/main.py` |
| 2 | Lecturas continuas que simulen el comportamiento dinámico del ambiente | `SensorSimulado` (inercia por caminata aleatoria acotada) + `_actualizar_eventos()` (apertura de puerta que sube temperatura y humedad y luego se disipa) |
| 3 | Datos estructurados estrictamente en JSON y guardados localmente con marcas de tiempo en un `.csv` | `Empaquetador.construir()` / `a_json()` (mensajería JSON) y `HistoricoCSV` (histórico columnar con `timestamp` y `fecha`) |
| 4 | Función que serialice y envíe ráfagas de datos empaquetados, con arquitectura lista para conexión serial física | `TransmisorRafagas` (empaquetado en lotes) + `TransporteSerial` (UART real, listo para el montaje) y `TransporteHTTP` |

---

## 2. Archivos entregados

```
actividad-3.4/
├── README.md                  <- este documento (instructivo del laboratorio)
├── wokwi/
│   ├── main.py                <- script principal en MicroPython (el corazón del laboratorio)
│   ├── diagram.json           <- montaje del circuito: ESP32 + DHT22 + LDR
│   └── historico_nodos.csv    <- histórico local generado por la simulación (evidencia)
├── prueba_local_main.py       <- ejecuta el MISMO main.py en el PC (verificación previa)
└── evidencias/
    ├── salida_monitor_serie.txt  <- captura del Monitor Serie
    └── historico_nodos.csv       <- copia del histórico para el informe
```

---

## 3. Montaje en Wokwi — paso a paso

### 3.1 Crear el proyecto
1. Entrar a <https://wokwi.com> e iniciar sesión.
2. Crear un proyecto nuevo: **ESP32 / MicroPython**.
3. Pegar el contenido de `wokwi/main.py` en la pestaña `main.py`.
4. Abrir la pestaña `diagram.json`, borrar su contenido y pegar el de
   `wokwi/diagram.json` de esta carpeta.

### 3.2 Verificar el cableado (tabla de conexiones)

| Componente | Pin del componente | Pin del ESP32 | Color sugerido | Nota |
|------------|-------------------|---------------|----------------|------|
| DHT22 | VCC | `3V3` | rojo | alimentación de 3.3 V |
| DHT22 | GND | `GND.1` | negro | referencia común |
| DHT22 | SDA (datos) | `15` (GPIO15) | verde | bus de un solo hilo |
| LDR (módulo) | VCC | `3V3` | rojo | — |
| LDR (módulo) | GND | `GND.2` | negro | — |
| LDR (módulo) | AO (salida análoga) | `34` (GPIO34) | azul | GPIO34 es **solo entrada** y pertenece al **ADC1** |
| ESP32 | TX | Monitor Serie RX | — | para ver los `print()` |
| ESP32 | RX | Monitor Serie TX | — | permite enviar comandos a la placa |

> **¿Por qué GPIO34 para el LDR?** El ADC2 del ESP32 deja de funcionar cuando el
> WiFi está activo. GPIO32–39 pertenecen al ADC1 y GPIO34 además es solo de
> entrada: la elección correcta para leer un sensor análogo en un nodo que
> también usará red.

### 3.3 Ejecutar
1. Presionar ▶ (**Simular**).
   > Los sensores están **conectados** en el diagrama y el código puede leerlos,
   > pero la temperatura y la humedad llegan por simulación para cumplir el
   > punto 2 del desafío (lecturas aleatorias continuas). Si se quiere leer el
   > DHT22 real del montaje, cambiar en `Config`:
   > `FUENTE_TEMPERATURA_HUMEDAD = "fisico"` y usar los deslizadores del sensor.
2. Observar el **Monitor Serie**: por cada lectura aparece una línea resumen y
   la trama JSON completa; cada 5 lecturas se imprime una **ráfaga**.
3. En el módulo LDR de Wokwi, **girar el control de luz** para provocar la
   alerta `LUZ_ALTA` y ver el efecto en el histórico.
4. Al terminar, abrir el panel del sistema de archivos de la simulación y
   descargar `historico_nodos.csv`.

### 3.4 Verificación previa sin hardware (recomendada)
El script de la placa se puede probar en el PC antes de subirlo a Wokwi:

```bash
cd docs/guias-aprendizaje/GA-IoT-Python/actividad-3.4
python prueba_local_main.py
```

El arnés aporta a CPython las funciones `time.sleep_ms`, `time.ticks_ms` y
`time.ticks_diff` de MicroPython, de modo que se ejecuta **el mismo archivo**.
Genera las evidencias y valida: número de columnas constante, marcas de tiempo
que avanzan y valores numéricos correctos.

---

## 4. Por qué el código está organizado así

| Clase | Responsabilidad | Concepto de la guía aplicado |
|-------|-----------------|------------------------------|
| `Sensores` / `SensorSimulado` | Obtener las magnitudes del ambiente | **Abstracción de hardware**: el mismo código corre en Wokwi, en el PC y con sensores reales |
| `SensorLuz` | Convertir el valor crudo del ADC a lux | **Conversión A/D y escalado** (núcleo de la actividad 3.1) |
| `Reloj` | Generar la marca de tiempo Unix y la fecha legible | **Núcleo 2** — `time` y `datetime` |
| `Empaquetador` | Estructurar la trama JSON y evaluar umbrales | **Núcleo 1** — `json`; reglas de negocio de la cadena de frío |
| `HistoricoCSV` | Persistir el histórico columnar | **Núcleo 1** — `csv` y `open()` en modo `a` |
| `TransmisorRafagas` | Empaquetar y enviar lotes | **Núcleo 3** — protocolos; además resuelve el error `429` |
| `TransporteSerial` / `TransporteHTTP` / `TransporteConsola` | Entregar la trama | **Núcleo 3** — UART y HTTP intercambiables sin tocar la lógica |

### Detalle técnico: el LDR es INVERSO
El módulo fotorresistor tiene el LDR arriba (a VCC) y una resistencia fija de
10 kΩ abajo (a GND). Por eso **más luz ⇒ menos voltaje en AO ⇒ menor valor
leído**. La conversión aplicada es la documentada por el módulo:

```
v     = crudo / 4095 * 3.3
R_ldr = 10000 * v / (3.3 - v)
lux   = ( RL10 * 1000 * 10^gamma / R_ldr ) ^ (1/gamma)      con gamma = 0.7, RL10 = 50
```

Escribir una regla de tres directa (`crudo / 4095 * 1000`) daría un valor de
lux al revés: es el error clásico en este montaje y por eso queda documentado.

### Detalle técnico: dos marcas de tiempo, una confiable
Un ESP32 sin RTC ni red arranca en 2000-01-01: **no sabe qué hora es**. Por eso
cada trama lleva:

- `timestamp` — Unix en segundos (correcto solo con el reloj sincronizado por NTP);
- `uptime_s` — segundos desde el arranque, **siempre confiable**;
- `fecha` — marca legible para que un humano audite el CSV.

Esta decisión es deliberada: en una cadena de frío, un registro con hora
dudosa debe poder identificarse como tal.

---

## 5. Salida esperada (extracto real de la evidencia)

Resumen por lectura en el Monitor Serie:

```
[1/12] 2026-10-16 19:11:53 | T=8.85C H=72.59% L=414lux ALERTA:TEMP_ALTA
{"nodo_id":"NODO-IOT-01","ubicacion":"Nevera industrial - Bahia 3","firmware":"1.0.0",
 "secuencia":1,"timestamp":1776000000,"fecha":"2026-10-16 19:11:53","uptime_s":0.0,
 "sensores":{"temperatura_c":8.85,"humedad_pct":72.59,"luz_lux":414},
 "unidades":{"temperatura_c":"C","humedad_pct":"%","luz_lux":"lux"}}
```

Ráfaga empaquetada que se envía por el transporte serial:

```json
{"nodo_id":"NODO-IOT-01","firmware":"1.0.0","tipo":"rafaga_telemetria",
 "motivo":"lote completo","cantidad":5,"generado_en":"2026-10-16 19:11:53",
 "lecturas":[{"...": "5 lecturas completas"}]}
```

Histórico `.csv` generado (nótese el evento de apertura de puerta en las
lecturas 4–8: subida brusca y posterior disipación de la temperatura):

```csv
timestamp,fecha,uptime_s,nodo_id,temperatura_c,humedad_pct,luz_lux,alertas
1776000000,2026-10-16 19:11:53,0.0,NODO-IOT-01,8.85,72.59,414,TEMP_ALTA
1776000000,2026-10-16 19:11:53,0.36,NODO-IOT-01,7.08,66.33,513,OK
1776000000,2026-10-16 19:11:54,0.6,NODO-IOT-01,9.27,72.74,445,TEMP_ALTA
1776000000,2026-10-16 19:11:54,0.72,NODO-IOT-01,8.54,71.07,420,TEMP_ALTA
1776000000,2026-10-16 19:11:54,0.84,NODO-IOT-01,8.04,68.23,445,TEMP_ALTA
1776000000,2026-10-16 19:11:54,0.96,NODO-IOT-01,7.59,67.01,396,OK
```

Resumen final que imprime el nodo:

```
Lecturas generadas     : 12
Con alerta de umbral   : 5 (42%)
Eventos de ambiente    : 2 (aperturas de puerta)
Temperatura en el ciclo: min 7.08C | max 9.27C
Historico CSV          : historico_nodos.csv (898 bytes)
Rafagas enviadas       : 3 rafagas con 12 lecturas
Lecturas no enviadas   : 0 (permanecen en el CSV local)
```

---

## 6. Conexión con el proyecto formativo (microservicios)

El laboratorio produce exactamente lo que un microservicio de telemetría
necesita consumir:

1. **Contrato de datos estable** — el esquema JSON (`nodo_id`, `secuencia`,
   `timestamp`, `sensores{}`, `unidades{}`) es el mismo para todos los nodos:
   es un contrato de API, no un `print` suelto.
2. **Trazabilidad** — cada registro es auditable por su marca de tiempo.
3. **Resiliencia** — si la red falla, el dato ya está en el CSV local: el
   sistema no pierde información, solo retrasa su envío.
4. **Eficiencia de red** — el envío por ráfagas equivale al *batching* que
   evita el error `429` y ahorra batería y datos.
5. **Desacoplamiento** — cambiar `TransporteConsola` por `TransporteSerial` o
   `TransporteHTTP` es una línea: el nodo puede hablar UART o HTTP sin
   reescribir su lógica.

### Sugerencia de integración (alcance de la actividad 3.3 del proyecto)
Implementar en el backend del proyecto un endpoint que reciba la ráfaga:

```
POST /api/telemetria
Content-Type: application/json

{ "nodo_id": "...", "tipo": "rafaga_telemetria", "cantidad": 5, "lecturas": [ ... ] }
```

y responder `201 Created` con el total acumulado, tal como se practicó en la
demo de HTTP del núcleo 3 (`actividad-3.3/03_protocolos_serial.py`).

---

## 7. Lista de verificación antes de entregar

- [ ] El proyecto de Wokwi abre y simula sin errores.
- [ ] Se ven las tres magnitudes en cada lectura: temperatura, humedad y luz.
- [ ] Cada lectura se imprime como JSON válido en el Monitor Serie.
- [ ] Existe `historico_nodos.csv` con encabezado y marcas de tiempo.
- [ ] Se observa al menos una alerta (`TEMP_ALTA`, `TEMP_BAJA`, `HUMEDAD_ALTA` o `LUZ_ALTA`) y su registro en la columna `alertas`.
- [ ] Se observa al menos una ráfaga enviada (`>>> TRAMA SERIAL`).
- [ ] Se puede explicar qué cambiaría para conectar la placa por cable serial real.
- [ ] El informe incluye la captura del Monitor Serie y el `.csv` obtenido.

---

## 8. Problemas frecuentes y solución

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `OSError: [Errno 2] ENOENT` al abrir el CSV | El sistema de archivos de la simulación aún no está listo | Reiniciar la simulación (▶) y volver a ejecutar |
| `ImportError: no module named 'dht'` | Se usó un firmware de MicroPython sin ese módulo | El código ya lo maneja: cae a la simulación. En Wokwi, elegir la placa ESP32 |
| La temperatura siempre marca lo mismo | Se cambió `Config.FUENTE_TEMPERATURA_HUMEDAD` a `"fisico"`: el DHT22 de Wokwi entrega un valor fijo hasta que se mueven sus deslizadores | Dejar el modo `"simulado"` (por defecto) o hacer clic sobre el DHT22 y mover los controles de temperatura y humedad |
| La luz no cambia | Falta girar el control del módulo LDR | Arrastrar el control de luz sobre el fotorresistor durante la simulación |
| `NameError: name 'time' is not defined` en el PC | Se ejecutó `main.py` directo en CPython | Usar `python prueba_local_main.py` |
| El CSV crece demasiado | No hay rotación configurada | Ajustar `Config.MAX_REGISTROS_ROTACION` |

---

## 9. Criterios de evaluación sugeridos (rúbrica)

| Criterio | Peso | Indicador observable |
|----------|------|----------------------|
| Montaje y puesta en marcha | 15 % | El circuito simula y entrega las tres magnitudes |
| Estructuración de datos (JSON) | 20 % | La trama JSON es válida, autodescriptiva y consistente entre lecturas |
| Persistencia en CSV con marcas de tiempo | 20 % | El histórico conserva los registros previos (modo `a`) y cada fila tiene marca de tiempo |
| Simulación dinámica del ambiente | 10 % | Los valores evolucionan con lógica física y se detectan eventos |
| Comunicación de ráfagas | 20 % | Serializa y envía paquetes por lotes, con la arquitectura de transporte separada |
| Documentación y sustentación | 15 % | README, comentarios y explicación del equipo sobre las decisiones de diseño |
