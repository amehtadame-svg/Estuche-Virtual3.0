"""
NÚCLEO 3 — Protocolos de comunicación y hardware
Guía de aprendizaje: Python para Internet de las Cosas (IoT)
Programa: Análisis y Desarrollo de Software — 228118

Objetivo:
    * HTTP con la librería externa `requests`: GET, POST, JSON, códigos de
      estado, timeouts y reintentos -> camino hacia infraestructuras Cloud IoT.
    * Puerto serial (COM/UART) con `serial` (PySerial): inyección y lectura
      directa de bytes provenientes de un microcontrolador ESP32.

IMPORTANTE — este script funciona SIN internet y SIN hardware:
    * En lugar de llamar a una API real, levanta una API IoT mínima en
      localhost con el servidor HTTP de la librería estándar.
    * En lugar de un cable USB, usa el puerto virtual `loop://` de PySerial
      (envía y devuelve los mismos bytes), por lo que se practica la API real.

Requisitos:
    pip install requests pyserial

Ejecución:
    python 03_protocolos_serial.py
"""

import csv
import json
import os
import random
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# ---------------------------------------------------------------------------
# Dependencias externas: se avisa con claridad si falta alguna
# ---------------------------------------------------------------------------
try:
    import requests
except ImportError:  # pragma: no cover
    requests = None

try:
    import serial
    from serial.tools import list_ports
except ImportError:  # pragma: no cover
    serial = None
    list_ports = None

CARPETA_SALIDA = "salidas"
ARCHIVO_TELEMETRIA = os.path.join(CARPETA_SALIDA, "telemetria_enviada.csv")
os.makedirs(CARPETA_SALIDA, exist_ok=True)


def titulo(texto: str) -> None:
    print("\n" + "=" * 72)
    print(texto)
    print("=" * 72)


def lectura_sintetica(indice: int) -> dict:
    """Simula una lectura de los tres sensores del laboratorio."""
    instante = datetime.now(timezone.utc)
    return {
        "sensor_id": "NODO-IOT-01",
        "secuencia": indice,
        "timestamp": int(instante.timestamp()),
        "fecha": instante.strftime("%Y-%m-%d %H:%M:%S"),
        "temperatura": round(random.uniform(2.0, 9.0), 2),
        "humedad": round(random.uniform(45.0, 75.0), 2),
        "luz": random.randint(50, 900),
    }


# ===========================================================================
# API IoT mínima en localhost (para practicar HTTP sin depender de internet)
# ===========================================================================
TELEMETRIA_RECIBIDA: list[dict] = []
PETICIONES_TOTALES = {"n": 0}
LIMITE_PETICIONES = 12  # fuerza un 429 para que se vea el manejo de errores


class ApiIoTFalsa(BaseHTTPRequestHandler):
    """Servidor de apoyo didáctico: imita el comportamiento de una nube IoT."""

    def log_message(self, formato, *args):
        """Silencia el log de consola del servidor (se imprime lo relevante)."""
        pass

    def _responder(self, codigo: int, cuerpo: dict) -> None:
        datos = json.dumps(cuerpo).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def do_GET(self):  # noqa: N802  (nombre impuesto por BaseHTTPRequestHandler)
        if self.path == "/api/estado":
            self._responder(200, {
                "servicio": "monitor-nevera-iot",
                "estado": "operativo",
                "uptime_segundos": 3600,
                "nodos_conectados": 1,
                "umbral_alerta_c": 8.0,
            })
        elif self.path == "/api/telemetria":
            self._responder(200, {
                "total_registros": len(TELEMETRIA_RECIBIDA),
                "datos": TELEMETRIA_RECIBIDA[-5:],
            })
        else:
            self._responder(404, {"error": "recurso no encontrado", "ruta": self.path})

    def do_POST(self):  # noqa: N802
        if self.path != "/api/telemetria":
            self._responder(404, {"error": "recurso no encontrado", "ruta": self.path})
            return

        PETICIONES_TOTALES["n"] += 1
        if PETICIONES_TOTALES["n"] > LIMITE_PETICIONES:
            self._responder(429, {"error": "demasiadas peticiones, reduzca la frecuencia"})
            return

        longitud = int(self.headers.get("Content-Length", 0))
        crudo = self.rfile.read(longitud)

        try:
            carga = json.loads(crudo)
        except json.JSONDecodeError as error:
            # El servidor NO se cae por una trama corrupta: responde 400.
            self._responder(400, {"error": "JSON inválido", "detalle": str(error)})
            return

        # El servidor acepta una lectura o un lote de lecturas (batching).
        lecturas = carga if isinstance(carga, list) else [carga]
        for lectura in lecturas:
            lectura["recibido_en"] = datetime.now(timezone.utc).strftime("%H:%M:%S")
            TELEMETRIA_RECIBIDA.append(lectura)

        self._responder(201, {
            "guardados": len(lecturas),
            "total_acumulado": len(TELEMETRIA_RECIBIDA),
        })


def iniciar_api_local() -> tuple[ThreadingHTTPServer, str]:
    """Levanta la API en un hilo y devuelve el servidor y su URL base."""
    servidor = ThreadingHTTPServer(("127.0.0.1", 0), ApiIoTFalsa)
    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()
    puerto = servidor.server_address[1]
    return servidor, f"http://127.0.0.1:{puerto}"


# ===========================================================================
# 1. HTTP con requests: GET y POST
# ===========================================================================
def demo_http(url_base: str) -> None:
    titulo("1. Peticiones HTTP con requests — GET y POST")

    if requests is None:
        print("  [OMITIDO] Instala la librería con:  pip install requests")
        return

    # --- GET: consultar el estado del servicio (petición de LECTURA) ---
    print("  GET /api/estado  -> consultar el estado del servicio en la nube")
    respuesta = requests.get(f"{url_base}/api/estado", timeout=5)
    print(f"    Código de estado : {respuesta.status_code} ({respuesta.reason})")
    print(f"    Content-Type     : {respuesta.headers.get('Content-Type')}")
    estado = respuesta.json()
    print(f"    Cuerpo (dict)    : {estado}")
    print(f"    Acceso a un campo: umbral_alerta_c = {estado['umbral_alerta_c']}")
    print(f"    Texto crudo      : {respuesta.text[:70]}...")

    # --- GET a una ruta inexistente: se aprende a leer el 404 ---
    print("\n  GET /api/no-existe  -> recurso inexistente")
    error = requests.get(f"{url_base}/api/no-existe", timeout=5)
    print(f"    Código de estado : {error.status_code}")
    print(f"    Cuerpo           : {error.json()}")
    print("    Regla: NO asumir que toda respuesta es exitosa. Verificar .status_code")

    # --- POST: enviar telemetría (petición de ESCRITURA) ---
    print("\n  POST /api/telemetria  -> enviar una lectura de sensores")
    lectura = lectura_sintetica(1)
    cuerpo = json.dumps(lectura)
    print(f"    Cuerpo enviado ({len(cuerpo)} bytes): {cuerpo}")

    respuesta = requests.post(
        f"{url_base}/api/telemetria",
        data=cuerpo,                                    # los datos van en el CUERPO
        headers={"Content-Type": "application/json"},   # y se declara el formato
        timeout=5,
    )
    print(f"    Código de estado : {respuesta.status_code} (201 = recurso creado)")
    print(f"    Respuesta        : {respuesta.json()}")

    # --- La forma corta: json= en lugar de data= + headers ---
    respuesta = requests.post(f"{url_base}/api/telemetria",
                              json=lectura_sintetica(2), timeout=5)
    print(f"\n  Forma corta con json=lectura -> {respuesta.status_code} "
          f"{respuesta.json()}  (requests arma el JSON y el encabezado solos)")

    # --- GET vs POST en una tabla ---
    print("\n  Diferencia esencial:")
    print("    GET  -> consulta. Datos en la URL. Idempotente (repetirlo no cambia nada).")
    print("    POST -> envía/crea. Datos en el cuerpo. NO es idempotente:")
    print("            repetir el POST duplica la lectura. De ahí los identificadores")
    print("            de secuencia y las claves de idempotencia en IoT real.")

    # --- Manejo del 400: trama corrupta ---
    print("\n  Simulación de trama corrupta enviada al servidor:")
    trama_mala = '{"temperatura": 4.5,}'  # JSON inválido a propósito
    respuesta = requests.post(f"{url_base}/api/telemetria", data=trama_mala,
                              headers={"Content-Type": "application/json"}, timeout=5)
    print(f"    Enviamos: {trama_mala}")
    print(f"    El servidor responde {respuesta.status_code}: {respuesta.json()}")
    print("    Lección: un dato mal formado se RECHAZA con 400, no rompe el servicio.")

    # --- Manejo del 429: control de frecuencia (rate limiting) ---
    print("\n  Envío continuo hasta provocar el control de frecuencia del servidor:")
    for i in range(3, 20):
        r = requests.post(f"{url_base}/api/telemetria",
                          json=lectura_sintetica(i), timeout=5)
        if r.status_code == 429:
            print(f"    Petición #{i}: 429 -> {r.json()}")
            print("    Estrategia correcta (no martillar el servidor):")
            print("      1. Respetar el encabezado Retry-After si viene.")
            print("      2. Esperar con retroceso EXPONENCIAL (1s, 2s, 4s, 8s...).")
            print("      3. AGREGAR LECTURAS EN LOTE: un POST con 50 lecturas en vez")
            print("         de 50 POST. Es la solución real en un despliegue IoT.")
            break

    # --- Envío por lotes (batching): la forma correcta ---
    # Se simula que la ventana de limitación del servidor se reabrió
    # (en producción se esperaría respetando Retry-After).
    PETICIONES_TOTALES["n"] = 0
    print("\n  Envío por LOTES (batching) — la solución real al 429:")
    lote = [lectura_sintetica(i) for i in range(100, 110)]
    respuesta = requests.post(f"{url_base}/api/telemetria", json=lote, timeout=5)
    print(f"    1 petición HTTP con {len(lote)} lecturas -> {respuesta.status_code} "
          f"{respuesta.json()}")

    # --- Consulta final: qué quedó registrado en el 'servidor' ---
    total = requests.get(f"{url_base}/api/telemetria", timeout=5).json()["total_registros"]
    print(f"\n  El servidor acumuló {total} lecturas (incluye las del batching).")

    # --- Guardar la evidencia en CSV: aquí se unen los tres núcleos ---
    if TELEMETRIA_RECIBIDA:
        campos = ["sensor_id", "secuencia", "timestamp", "fecha", "temperatura",
                  "humedad", "luz", "recibido_en"]
        with open(ARCHIVO_TELEMETRIA, "w", newline="", encoding="utf-8") as f:
            escritor = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
            escritor.writeheader()
            escritor.writerows(TELEMETRIA_RECIBIDA)
        print(f"  Evidencia escrita en {ARCHIVO_TELEMETRIA} "
              f"({len(TELEMETRIA_RECIBIDA)} filas)")

    print("\n  Buenas prácticas de red en un nodo IoT:")
    for practica in (
        "Poner SIEMPRE timeout: sin él, un nodo se queda esperando para siempre.",
        "Reintentar con límite y espera creciente; nunca en bucle infinito.",
        "Verificar el código de estado antes de leer el cuerpo.",
        "Enviar en lotes para ahorrar batería, datos y peticiones.",
        "Si falla la red, NO perder el dato: guardarlo local y reenviar después.",
    ):
        print(f"    - {practica}")


# ===========================================================================
# 2. Puerto serial con PySerial
# ===========================================================================
def demo_serial_conceptos() -> None:
    titulo("2. Puerto serial (COM / UART) — conceptos y detección de puertos")

    if serial is None:
        print("  [OMITIDO] Instala la librería con:  pip install pyserial")
        return

    print(f"  Versión de PySerial: {serial.__version__}")

    print("\n  Qué es UART y por qué se usa en IoT:")
    for linea in (
        "UART = Universal Asynchronous Receiver-Transmitter.",
        "Es comunicación ASÍNCRONA: no hay señal de reloj compartida; ambas partes",
        "  acuerdan de antemano la VELOCIDAD EN BAUDIOS (típico 9600 o 115200).",
        "Solo necesita 3 cables: TX (transmite), RX (recibe) y GND (referencia).",
        "En la computadora aparece como puerto COM3 (Windows), /dev/ttyUSB0 (Linux)",
        "  o /dev/cu.usbserial-XXXX (macOS).",
        "En las placas ESP32/Arduino es el mismo canal con el que se cargan los",
        "  programas: por eso el monitor serial muestra los 'print()' de la placa.",
    ):
        print(f"    {linea}")

    print("\n  Puertos seriales detectados en ESTE equipo:")
    puertos = list(list_ports.comports())
    if puertos:
        for p in puertos:
            print(f"    {p.device:<24} {p.description}")
    else:
        print("    (ninguno) — normal en un equipo sin microcontrolador conectado")
        print("    En el laboratorio verás algo como:")
        print("      COM4  Silicon Labs CP210x USB to UART Bridge (ESP32)")

    print("\n  Estructura típica de un constructor de Serial:")
    print("    serial.Serial(")
    print("        port='COM4',      # el puerto físico detectado arriba")
    print("        baudrate=115200,  # debe COINCIDIR con el microcontrolador")
    print("        bytesize=8,       # 8 bits de datos")
    print("        parity='N',       # sin paridad")
    print("        stopbits=1,       # 1 bit de parada")
    print("        timeout=1,        # espera máxima de 1 s en cada lectura")
    print("    )")
    print("    115200 8N1 es la configuración por defecto del monitor serie del ESP32.")


def demo_serial_loopback() -> None:
    titulo("3. Serial real sobre puerto virtual (loop://) — sin hardware")

    if serial is None:
        print("  [OMITIDO] Instala la librería con:  pip install pyserial")
        return

    # `loop://` es un puerto virtual de PySerial: lo que se escribe, se lee.
    # Permite practicar la API real (write, readline, in_waiting, timeout)
    # exactamente igual que con un ESP32 conectado por USB.
    with serial.serial_for_url("loop://", baudrate=115200, timeout=1) as puerto:
        print(f"  Puerto abierto : {puerto.name}")
        print(f"  Baudios        : {puerto.baudrate}")
        print(f"  Timeout        : {puerto.timeout} s")
        print(f"  ¿Está abierto? : {puerto.is_open}")

        # --- Escritura: BYTES, no texto ---
        print("\n  write() exige BYTES. Comparación:")
        mensaje = '{"temp":4.5}\n'
        try:
            puerto.write(mensaje)
        except TypeError as error:
            print(f"    puerto.write('...')  -> TypeError: {error}")

        enviados = puerto.write(mensaje.encode("utf-8"))
        print(f"    puerto.write('{mensaje.strip()}'.encode()) -> {enviados} bytes escritos")
        print("    Regla: .encode() para enviar (str -> bytes), .decode() para recibir.")

        # --- Lectura: readline vs read ---
        puerto.reset_input_buffer()
        puerto.write(b'{"temperatura":4.53,"humedad":62.1,"luz":320}\n')

        print("\n  readline() lee hasta el salto de línea (la forma recomendada):")
        linea = puerto.readline()
        print(f"    bytes crudos  : {linea!r}")
        print(f"    con .decode() : {linea.decode('utf-8').strip()!r}")
        print(f"    in_waiting    : {puerto.in_waiting} bytes esperando en el buffer")

        # --- Por qué .strip() es obligatorio ---
        print("\n  Por qué hay que aplicar .strip():")
        print(f"    {linea!r}  <- incluye \\n al final")
        try:
            json.loads(linea)  # falla: bytes con salto de línea
        except TypeError as error:
            print(f"    json.loads(bytes) sin decodificar -> TypeError: {error}")
        limpio = linea.decode("utf-8").strip()
        parsed = json.loads(limpio)
        print(f"    decode + strip + loads -> {parsed}")

        # --- read(n): leer una cantidad exacta de bytes ---
        puerto.reset_input_buffer()
        puerto.write(b"ABC")
        print(f"\n  read(3) lee exactamente 3 bytes -> {puerto.read(3)!r}")

        # --- El timeout: qué pasa cuando NO hay datos ---
        puerto.reset_input_buffer()
        inicio = time.perf_counter()
        nada = puerto.read(10)
        espera = time.perf_counter() - inicio
        print(f"\n  Sin datos disponibles, read(10) devuelve {nada!r} tras "
              f"{espera:.2f} s")
        print("    Espera ~1 s (el timeout) en lugar de bloquearse para siempre.")
        print("    Con timeout=None el programa se colgaría indefinidamente:")
        print("    ese es el error #1 al leer un sensor por serial.")

        print("\n  Otras operaciones útiles:")
        print("    puerto.in_waiting        -> bytes disponibles AHORA (sin bloquear)")
        print("    puerto.reset_input_buffer()  -> descartar basura de arranque")
        print("    puerto.flush()           -> esperar a que se transmita todo")
        print("    puerto.close()           -> liberar el puerto (o usar 'with')")
        print("    ATENCION: solo un programa puede abrir un puerto COM a la vez.")
        print("    'SerialException: could not open port' casi siempre significa")
        print("    que el Monitor Serie del IDE lo tiene abierto.")


def demo_tramas_microcontrolador() -> None:
    titulo("4. Leer las tramas de un microcontrolador (protocolo JSON Lines)")

    if serial is None:
        print("  [OMITIDO] Instala la librería con:  pip install pyserial")
        return

    print("  El ESP32 del laboratorio imprime una línea JSON por lectura.")
    print("  El host (Python) lee línea por línea y valida cada trama.\n")

    # Simulamos lo que llega desde la placa: 6 tramas, una de ellas corrupta
    # y otra incompleta (como pasa cuando el buffer se corta).
    tramas_de_la_placa = [
        b'{"sensor_id":"NODO-IOT-01","temperatura":4.5,"humedad":62.1,"luz":320}\n',
        b'{"sensor_id":"NODO-IOT-01","temperatura":5.1,"humedad":61.0,"luz":340}\n',
        b'{"sensor_id":"NODO-IOT-01","temperatura":7.9,"humedad":58.4,"luz":290}\n',
        b'{"sensor_id":"NODO-IOT-01","temperatura":9.4,"humedad":57.2,"luz":275}\n',
        b'{"sensor_id":"NODO-IOT-01", "temperatura": }\n',          # corrupta
        b'{"sensor_id":"NODO-IOT-01","temperatura":3.8,"humedad":64.0,',  # incompleta
    ]

    validas, invalidas, alertas = [], 0, []

    with serial.serial_for_url("loop://", baudrate=115200, timeout=1) as puerto:
        for trama in tramas_de_la_placa:
            puerto.write(trama)

        for _ in range(len(tramas_de_la_placa)):
            linea = puerto.readline()
            if not linea:
                continue
            try:
                dato = json.loads(linea.decode("utf-8").strip())
                validas.append(dato)
                if dato.get("temperatura", 0) > 8.0:
                    alertas.append(dato)
            except json.JSONDecodeError as error:
                invalidas += 1
                print(f"    TRAMA DESCARTADA ({error.msg})")
                print(f"      crudo: {linea!r}")

    print(f"\n  Tramas válidas  : {len(validas)}")
    print(f"  Tramas inválidas: {invalidas}  (descartadas sin detener el proceso)")

    temps = [d["temperatura"] for d in validas if "temperatura" in d]
    if temps:
        print(f"  Temperatura     : min {min(temps)} | max {max(temps)} | "
              f"promedio {sum(temps) / len(temps):.2f} C")

    print(f"  ALERTAS cadena de frío (> 8 C): {len(alertas)}")
    for a in alertas:
        print(f"    -> {a['temperatura']} C  (acciones: avisar y revisar el compresor)")

    print("\n  Patrón de producción aprendido:")
    print("    bucle infinito ->  readline()  ->  decode().strip()  ->  json.loads()")
    print("      ->  try/except (una trama mala NO mata el servicio)")
    print("      ->  validar rangos  ->  guardar en CSV  ->  enviar por HTTP en lote")


# ===========================================================================
# 5. Cierre: el flujo completo del laboratorio
# ===========================================================================
def resumen_flujo() -> None:
    titulo("5. Flujo completo del nodo IoT (une los tres núcleos)")

    pasos = (
        ("1. Microcontrolador", "Lee el sensor (ADC), escala a unidades reales. [Hardware]"),
        ("2. Formato", "Empaqueta la lectura como JSON con marca de tiempo. [json]"),
        ("3. Persistencia", "Añade la fila al histórico .csv local (modo 'a'). [csv/open]"),
        ("4. Tiempo", "Cada registro lleva Unix + fecha legible. [time/datetime]"),
        ("5. Red", "POST por lotes a la API del microservicio. [requests]"),
        ("6. Serial", "Si no hay red, inyecta la trama por UART. [serial]"),
        ("7. Resiliencia", "Si falla el envío, el dato ya está en el CSV: no se pierde."),
    )
    for titulo_paso, detalle in pasos:
        print(f"  {titulo_paso:22} {detalle}")

    print("\n  Este flujo es el que se implementa en el laboratorio Wokwi (actividad 3.4)")
    print("  y el que alimentaría el microservicio de monitoreo del proyecto formativo.")
    print("\n  Concepto transversal: el CSV es la RED DE SEGURIDAD del sistema.")
    print("  La nube puede caerse; el histórico local, no.")


# ---------------------------------------------------------------------------
# Programa principal
# ---------------------------------------------------------------------------
def main() -> None:
    print("NUCLEO 3 - PROTOCOLOS DE COMUNICACION Y HARDWARE")
    print("requests (HTTP GET/POST) | PySerial (COM/UART)")

    if requests is None or serial is None:
        print("\n  FALTAN DEPENDENCIAS. Instálalas con:")
        print("    pip install requests pyserial")
        return

    servidor, url_base = iniciar_api_local()
    print(f"\n  API IoT de práctica levantada en {url_base} (solo localhost)")

    try:
        demo_http(url_base)
        demo_serial_conceptos()
        demo_serial_loopback()
        demo_tramas_microcontrolador()
        resumen_flujo()
    finally:
        servidor.shutdown()
        print("\n  API local detenida. Fin de la demostración.")


if __name__ == "__main__":
    main()
