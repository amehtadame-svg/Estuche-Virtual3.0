# Actividad 3.2 — Cuestionario Diagnóstico Técnico

**Guía:** Python para Internet de las Cosas (IoT)
**Programa:** Análisis y Desarrollo de Software — Código 228118
**Duración de la actividad:** 1 hora
**Técnica didáctica:** Aprendizaje basado en la indagación mediante cuestionario interactivo
**Instrumento:** Formulario web (Google Forms / Kahoot / LMS territorial)

---

## Instrucciones

- Contestar **de forma individual** y **sin consultar apuntes**: el objetivo es diagnosticar la base real del grupo, no calificar.
- No hay penalización por error; cada respuesta errada es información útil para el instructor.
- Puntaje máximo: **20 puntos**. Duración estimada: **15 minutos**. Socialización: **15 minutos**.

| Sección | Tema | Preguntas | Puntos |
|---------|------|-----------|--------|
| A | Tipos de datos complejos en Python | 1 – 6 | 10 |
| B | Protocolos de red: HTTP y puertos | 7 – 11 | 6 |
| C | Integración Python ↔ hardware | 12 – 14 | 4 |

### Escala de interpretación para el instructor

| Puntaje | Nivel | Acción pedagógica sugerida |
|---------|-------|----------------------------|
| 18 – 20 | Sólido | Puede apoyar como monitor en los ejercicios de fijación de sintaxis |
| 13 – 17 | Adecuado | Refuerzo puntual en los temas con error |
| 8 – 12 | En construcción | Nivelación antes de la actividad 3.4, con énfasis en estructuras de datos |
| 0 – 7 | Requiere fundamentación | Acompañamiento directo en la actividad 3.3 y pareja de trabajo en la 3.4 |

---

## SECCIÓN A — Tipos de datos complejos en Python (10 pts)

**1. (2 pts)** ¿Qué tipo de dato es y qué contiene cada variable?

```python
lecturas = [22.5, 23.1, 21.8]
sensor   = {"id": "T-01", "tipo": "temperatura", "unidad": "C"}
```

- A) `lecturas` es un diccionario y `sensor` es una lista
- B) `lecturas` es una lista y `sensor` es un diccionario ✅
- C) Ambos son listas
- D) `lecturas` es una tupla y `sensor` es un conjunto

**2. (2 pts)** Con `sensor = {"id": "T-01", "tipo": "temperatura"}`, ¿cuál es la forma correcta de obtener `"temperatura"`?

- A) `sensor[1]`
- B) `sensor.tipo`
- C) `sensor["tipo"]` ✅
- D) `sensor.get(1)`

**3. (2 pts)** ¿Qué imprime este código?

```python
datos = {"temp": 4.5, "hum": 60}
datos["luz"] = 320
print(len(datos))
```

- A) 2
- B) 3 ✅
- C) Error: no se puede agregar claves nuevas
- D) `{"temp": 4.5, "hum": 60}`

**4. (2 pts)** ¿Cuál es la diferencia entre `lista.append(x)` y `lista.extend([x])`?

- A) Son sinónimos exactos
- B) `append` agrega **un** elemento al final; `extend` agrega **todos** los elementos del iterable ✅
- C) `append` agrega al inicio y `extend` al final
- D) `extend` solo funciona con cadenas de texto

**5. (1 pt)** Se ejecuta `print("valor =", d["presion"])` y el diccionario `d` **no** tiene la clave `"presion"`. ¿Qué ocurre?

- A) Imprime `None`
- B) Imprime `valor = ` y sigue
- C) Lanza `KeyError` ✅
- D) Crea la clave con valor `0`

**6. (1 pt)** ¿Qué devuelve `list(range(3))`?

- A) `[1, 2, 3]`
- B) `[0, 1, 2]` ✅
- C) `[0, 1, 2, 3]`
- D) `(0, 1, 2)`

---

## SECCIÓN B — Protocolos de red: HTTP y puertos (6 pts)

**7. (2 pts)** ¿Cuál es la diferencia fundamental entre `GET` y `POST` en HTTP?

- A) `GET` es más rápido porque no tiene encabezados
- B) `GET` solicita datos y viaja en la URL; `POST` envía datos en el cuerpo de la petición ✅
- C) `POST` no puede devolver respuestas JSON
- D) No hay diferencia, son intercambiables

**8. (1 pt)** Los códigos de estado HTTP `200` y `201` significan, respectivamente:

- A) `200` Error del servidor / `201` No encontrado
- B) `200` OK / `201` Recurso creado ✅
- C) `200` Redirección / `201` Sin autorización
- D) `200` OK / `201` Sin contenido

**9. (1 pt)** Mentalidad de IoT — un microcontrolador consulta una API de forma continua. ¿Qué código de estado entrega información valiosa *de alarma* sobre el servidor?

- A) `200` o `201`
- B) `301` o `302`
- C) `429` (Too Many Requests) o `500` (Internal Server Error) ✅
- D) `204` (Sin contenido)

**10. (1 pt)** ¿Cuál es el puerto estándar de HTTP y cuál el de HTTPS?

- A) `21` y `22`
- B) `80` y `443` ✅
- C) `8080` y `8443`
- D) `53` y `110`

**11. (1 pt)** En PySerial, `serial.Serial("COM3", 9600, timeout=1)`. ¿Qué representa `9600` y qué representa `timeout=1`?

- A) Cantidad de bits por lectura y cantidad de puertos
- B) Velocidad en baudios y segundos máximos de espera en una lectura ✅
- C) El número de pines y la versión del protocolo
- D) La memoria del buffer y los reintentos de conexión

---

## SECCIÓN C — Integración Python ↔ hardware (4 pts)

**12. (2 pts)** ¿Qué es una **marca de tiempo Unix** (*Unix timestamp*)?

- A) Una fecha en formato `16/10/2026 14:30`
- B) El número de **segundos** transcurridos desde el 1 de enero de 1970 (UTC) ✅
- C) Un código de 32 bits con el nombre del sensor
- D) El identificador incremental de la lectura

**13. (1 pt)** Al recibir una línea de texto desde un puerto serial, ¿por qué conviene aplicar `.strip()` antes de procesarla?

- A) Para convertir el texto a número automáticamente
- B) Para eliminar espacios y caracteres de control (`\r`, `\n`) que romperían el parseo ✅
- C) Para comprimir el dato antes de enviarlo
- D) Para cifrar el dato en tránsito

**14. (1 pt)** ¿Cuál es la ventaja principal de **serializar** los datos del sensor a JSON **antes** de enviarlos por red o puerto serial?

- A) Ocupa siempre menos bytes que un número plano
- B) El receptor recibe un paquete **autodescriptivo**: sabe qué es cada valor sin acordar de antemano la posición de las columnas ✅
- C) Evita tener que usar una conexión a internet
- D) Cifra los datos automáticamente

---

## Clave de respuestas (uso exclusivo del instructor)

| # | Pts | Resp. | Concepto evaluado |
|---|-----|-------|-------------------|
| 1 | 2 | B | Distinción lista vs. diccionario |
| 2 | 2 | C | Acceso por clave |
| 3 | 2 | B | Inserción y longitud de diccionario |
| 4 | 2 | B | `append` vs. `extend` |
| 5 | 1 | C | `KeyError` frente a `.get()` |
| 6 | 1 | B | `range()` y conversión a lista |
| 7 | 2 | B | Semántica de métodos HTTP |
| 8 | 1 | B | Códigos de estado 2xx |
| 9 | 1 | C | Códigos de error en cliente IoT |
| 10 | 1 | B | Puertos por defecto |
| 11 | 1 | B | Parámetros de PySerial (baudios, timeout) |
| 12 | 2 | B | Marca de tiempo Unix |
| 13 | 1 | B | Saneamiento de la trama serial |
| 14 | 1 | B | Valor de la serialización JSON |

---

## Socialización: mitos y realidades (15 min)

Errores frecuentes detectados en grupo y la aclaración del instructor:

| Mito | Realidad |
|------|----------|
| "En Python se accede al diccionario con `sensor.tipo`" | La notación de punto es de **objetos/atributos**, no de claves. Con diccionarios se usa `sensor["tipo"]` o `sensor.get("tipo")`. Existe `SimpleNamespace`, pero no es lo mismo. |
| "`GET` envía datos igual que `POST`" | `GET` transporta los datos en la URL (parámetros de consulta); `POST` los lleva en el **cuerpo** de la petición. Además `GET` es idempotente y cacheable; `POST` no. |
| "El puerto `80` y el `443` dan igual mientras funcione" | `443` implica **TLS** (tráfico cifrado). Enviar telemetría con credenciales por `80` expone los datos en texto plano. |
| "Un `200 OK` significa que todo está bien en el sistema" | Significa que el intercambio HTTP tuvo éxito. El dato puede seguir siendo erróneo: una lectura inválida dentro de un `200` es un fallo de validación, no de red. |
| "El `timestamp` se puede reconstruir después" | No. Sin la marca de tiempo capturada **en el instante de la lectura**, el dato pierde su valor para la cadena de frío y para la auditoría. |
| "`time.sleep(1)` en el microcontrolador es inofensivo" | Bloquea el procesador. Si además hay que atender la red, la lectura llega tarde. El reemplazo correcto es un `Timer` o un bucle no bloqueante. |
| "JSON y CSV son lo mismo, solo cambia la coma" | JSON es jerárquico y autodescriptivo; CSV es tabular y posicional. Uno no reemplaza al otro. |

---

## Cierre de la actividad

Al finalizar la socialización, el aprendiz debe tener claros tres conceptos que se usarán en la actividad 3.3:

1. **Estructurar antes de guardar:** diccionario → JSON → fila CSV.
2. **El dato vale por su contexto:** sin `timestamp` y sin identificador de sensor, un número no significa nada.
3. **La red y el puerto serial son canales, no formatos:** el JSON define *qué* viaja; HTTP o UART definen *por dónde*.
