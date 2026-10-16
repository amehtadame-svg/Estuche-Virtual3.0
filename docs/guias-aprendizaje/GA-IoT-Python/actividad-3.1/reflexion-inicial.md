# Actividad 3.1 — Actividades de Reflexión Inicial

**Guía:** Python para Internet de las Cosas (IoT)
**Programa:** Análisis y Desarrollo de Software — Código 228118
**Proyecto formativo:** Desarrollo de software para el control de procesos orientados a microservicios
**Resultado de aprendizaje:** 593108-04 · Codificar el software de acuerdo con el diseño establecido
**Duración de la actividad:** 1 hora
**Técnica didáctica:** Lluvia de ideas y debate guiado

---

## 1. Escenario planteado

> Un sistema de monitoreo para una **nevera inteligente industrial** que almacena medicamentos o alimentos críticos.

De manera individual se analizan tres preguntas orientadoras y luego se socializan en un debate de 15 minutos. A continuación se documentan las respuestas de trabajo, no como "respuesta única correcta", sino como el insumo que se lleva al debate.

---

## 2. Pregunta orientadora 1

> **¿Cómo creen que el software lee los datos físicos (como la temperatura)?**

### Respuesta de análisis

El software **no lee la temperatura directamente**: no puede "sentir" el frío. Lo que hace es leer una **señal eléctrica** que un sensor traduce a un número. El recorrido completo del dato tiene cinco eslabones:

| # | Etapa | Qué ocurre en la nevera inteligente | En qué se convierte |
|---|-------|-------------------------------------|---------------------|
| 1 | **Fenómeno físico** | La temperatura del aire interior varía porque se abre la puerta o falla el compresor | Magnitud física (4 °C, 7.5 °C…) |
| 2 | **Transducción** | El sensor (termistor NTC, DS18B20, DHT22, PT100) cambia su resistencia o voltaje según la temperatura | Señal analógica o digital |
| 3 | **Conversión A/D** | El microcontrolador (ESP32, Arduino, PLC) convierte esa señal continua en un número entero | Valor crudo: `.raw = 2896`, voltaje `1.41 V` |
| 4 | **Escalado en firmware** | El código aplica una fórmula o librería para traducir el valor crudo a unidades ingenieriles | `{"temperatura": 4.5}` |
| 5 | **Publicación** | El microcontrolador envía el dato por un protocolo (UART, WiFi/HTTP, MQTT) hacia el servidor | Trama, JSON, registro en base de datos |

**Conclusión clave para el debate:** el software siempre lee **abstracciones numéricas** de la realidad física. El "puente" entre el mundo físico y el código es la **conversión analógica-digital** más una **fórmula de escalado**. Por eso un error de calibración no es un error de programación, pero sí produce datos incorrectos en toda la cadena.

### Ejemplo mínimo del eslabón 4 (conceptual)

```python
# El sensor entrega un valor crudo (0-4095) de un ADC de 12 bits
raw = 2896
voltaje = (raw / 4095) * 3.3                  # 2.33 V
temperatura = (voltaje - 0.5) * 100           # sensor tipo TMP36 -> 183 °C (¡descalibrado!)
# Un valor absurdo como 183 °C en una nevera es la señal de alarma:
# hay que revisar la calibración antes de culpar al código.
```

---

## 3. Pregunta orientadora 2

> **Si el sensor genera miles de datos por minuto, ¿en qué formato de texto estructurado los guardarían para que no colapse el disco o para enviarlos de forma óptima por internet?**

### Respuesta de análisis

Se necesita un formato que sea **legible, compacto, estructurado y universal**. Los dos candidatos naturales en la industria son **CSV** y **JSON**, y no compiten: **cumplen funciones distintas**.

#### Comparación

| Criterio | CSV (Comma Separated Values) | JSON (JavaScript Object Notation) |
|---|---|---|
| Naturaleza | Tabla plana: filas y columnas | Árbol de pares clave-valor |
| Peso por registro | Menor (sin repetir nombres de campo) | Mayor (repite `"temperatura"` en cada objeto) |
| Legibilidad humana | Alta en Excel / hojas de cálculo | Alta para estructuras anidadas |
| Anidamiento | **No soporta** estructuras anidadas | Soporta listas y objetos dentro de objetos |
| Costo en disco | Menor: en la medición de la actividad 3.3 resultó **~60 % menos** que JSON para series uniformes | Mayor |
| Uso típico en IoT | **Histórico, analítica, reportes, Excel** | **Tramas de red, APIs, mensajería entre servicios** |
| Ideal para | Millones de lecturas uniformes de sensores | Enviar un paquete autodescriptivo por HTTP/MQTT |

#### Estrategia propuesta (la respuesta del equipo)

**No elegir uno, sino usar cada uno donde aporta valor:**

1. **Almacenamiento histórico → CSV.** La serie de lecturas es perfectamente uniforme (mismo sensor, mismas columnas). Guardarlo como JSON repetiría los nombres de los campos en cada línea: puro desperdicio de disco.
2. **Transporte por red → JSON.** Un paquete JSON viaja autodescriptivo: quien lo recibe entiende qué es cada valor sin conocer la posición de la columna.

#### Cómo evitar que el disco colapse (más allá del formato)

El formato es solo una parte; el volumen se controla con estrategia:

| Técnica | Descripción |
|---|---|
| **Modo append (`a`)** | Abrir el archivo en modo `a` añade al final sin reescribir todo. Abrir en `w` borraría el histórico completo en cada lectura. |
| **Frecuencia de muestreo** | Miles de lecturas/minuto casi nunca son necesarias. La temperatura de una nevera cambia lento: 1 lectura cada 5-30 s suele bastar. *Es la decisión de mayor impacto.* |
| **Compresión** | `.csv.gz` reduce entre 80 y 95 % en series numéricas largas. |
| **Rotación de archivos (rolling)** | Un archivo por día/semana (`historico_2026-10-16.csv`), ideal para microservicios y para borrar por antigüedad. |
| **Buffering** | Acumular N lecturas en memoria y escribir en bloques reduce el desgaste de la memoria flash del microcontrolador. |
| **Envío por lotes (batching)** | En vez de una petición HTTP por lectura, agrupar 10-50 lecturas en un solo `POST`. Reduce drásticamente el consumo de red y batería. |
| **Agregación** | Guardar promedio, mínimo y máximo por minuto en lugar de las 60 lecturas individuales. |

#### Regla práctica que se lleva al debate

> **JSON para hablar, CSV para recordar.**

Y el criterio de decisión: *si el dato va a viajar entre servicios → JSON; si el dato va a quedarse para análisis → CSV.*

---

## 4. Pregunta orientadora 3

> **¿Por qué una nevera industrial de medicamentos es un caso crítico y qué obliga esto al software?**

### Respuesta de análisis

Un medicamento fuera de rango térmico puede **perder su eficacia de forma irreversible**, aunque después vuelva a la temperatura correcta. Eso convierte al sistema en un caso de **trazabilidad regulada** (cadena de frío), no en un simple tablero de monitoreo. Implicaciones para el código:

- **No se puede perder la marca de tiempo.** Cada lectura necesita un `timestamp` confiable y en formato normalizado; sin él, el registro no tiene validez probatoria.
- **La integridad del dato es requisito, no adorno.** Un CSV truncado por un corte de energía a mitad de escritura deja el histórico inconsistente. De ahí la importancia de escribir **registro por registro** y cerrar el archivo correctamente (`close()` o el gestor de contexto `with`).
- **La alerta debe ser inmediata.** Detectar `temperatura > 8 °C` en el momento, no en el reporte del día siguiente.
- **La redundancia y el respaldo son parte del diseño.** Si el envío por red falla, el microcontrolador debe poder seguir guardando localmente y reenviar después.

---

## 5. Guion sugerido para el debate de 15 minutos

| Min | Dinámica | Conducción |
|-----|----------|------------|
| 0-3 | **Lluvia de ideas abierta** | "¿Alguien puede explicar con sus palabras cómo llega el 4 °C desde el aire hasta la pantalla?" Se escriben todas las ideas en el tablero, sin juzgar. |
| 3-7 | **Contraste de los 5 eslabones** | Se ordenan las ideas del grupo sobre la cadena físico → transducción → ADC → escalado → publicación. Se cierra con el ejemplo del valor absurdo de 183 °C. |
| 7-12 | **Duelo CSV vs. JSON** | Se divide el aula en dos mitades. Cada mitad defiende un formato ante la pregunta: *"¿cómo guardarías mil lecturas por minuto?"*. Se llega al acuerdo: **CSV para el histórico, JSON para la red**. |
| 12-15 | **Cierre y enlace** | El instructor conecta las conclusiones con los tres núcleos de la actividad 3.3 y con el laboratorio Wokwi de la 3.4. |

---

## 6. Compromiso de cierre de la actividad

Al terminar el debate, el aprendiz debe poder responder sin ayuda:

1. ¿Qué convierte la temperatura del aire en un número dentro del código?
2. ¿Cuál es el único argumento sólido para cambiar el formato del histórico y cuál para cambiar el de la red?
3. ¿Qué pasa si el archivo `.csv` se abre en modo `"w"` en un sistema que ya lleva un mes monitoreando?

> **Nota de trazabilidad:** las respuestas anteriores son individuales y se dejaron por escrito para el debate. El resultado consensuado del grupo se incorpora al informe de la actividad 3.4.
