"""
=============================================================================
 SIMULADOR INTELIGENTE DE NODOS IoT — MICROPYTHON / ESP32 (WOKWI)
=============================================================================
 Guía de aprendizaje : Python para Internet de las Cosas (IoT)
 Programa            : Análisis y Desarrollo de Software — 228118
 Proyecto formativo  : Desarrollo de software para el control de procesos
                       orientados a microservicios
 Fase                : Ejecución
 Resultado           : 593108-04 — Codificar el software de acuerdo con el
                       diseño establecido
 Actividad           : 3.4 Transferencia del conocimiento (Laboratorio)

 DESAFÍO CUMPLIDO
 ----------------
  1. ESP32 con MicroPython + 3 sensores: Temperatura y Humedad (DHT22) y
     Luz (módulo fotorresistor LDR por ADC).
  2. El script genera lecturas continuas que simulan el comportamiento
     DINÁMICO del ambiente: inercia en cada magnitud (caminata aleatoria
     acotada) y eventos como la apertura de la puerta de la nevera.
  3. Cada lectura se estructura de forma ESTRICTA en JSON (mensajería) y se
     almacena localmente CON MARCA DE TIEMPO en un histórico .csv.
  4. Se simula la función de serializar y enviar RÁFAGAS de datos empaquetados
     mediante peticiones estructuradas, con arquitectura lista para conexiones
     seriales físicas (UART) y HTTP.

 MONTAJE (ver diagram.json en esta misma carpeta)
 ------------------------------------------------
  Placa: ESP32-DevKitC V4
    DHT22  ->  VCC a 3V3 | GND a GND | SDA (datos) a GPIO 15
    LDR    ->  VCC a 3V3 | GND a GND | AO (salida análoga) a GPIO 34
               (GPIO34 es solo entrada y pertenece al ADC1: ideal para leerlo)

  OJO — el módulo LDR entrega MENOS voltaje cuando hay MÁS luz, porque la
  fotorresistencia está arriba (a VCC) y la resistencia fija abajo (a GND).
  Por eso el código NO usa una regla de tres directa: aplica la ecuación
  documentada del módulo (ver SensorLuz.convertir_a_lux).

 EJECUCIÓN EN WOKWI
 ------------------
  1. Crear un proyecto nuevo en https://wokwi.com (ESP32 / MicroPython).
  2. Pegar este archivo como main.py.
  3. Reemplazar diagram.json por el que se entrega en esta carpeta.
  4. Presionar ▶ (Simular). El Monitor Serie mostrará una trama JSON por
     línea y las ráfagas al completarse cada lote.
  5. Al terminar, abrir la pestaña del sistema de archivos para descargar
     historico_nodos.csv (es la evidencia del laboratorio).

  Verificación sin hardware: el mismo archivo se puede ejecutar en un PC con
  'python ../prueba_local_main.py' (ver ese archivo).
=============================================================================
"""

import json
import random
import time

try:
    import machine
except ImportError:  # Ejecución en CPython (pruebas en el PC)
    machine = None

try:
    import dht
except ImportError:
    dht = None

try:
    import math
except ImportError:
    math = None


# =============================================================================
# 1. CONFIGURACIÓN DEL NODO
# =============================================================================
class Config:
    """Parámetros centralizados: se cambian aquí, nunca en la lógica."""

    NODO_ID = "NODO-IOT-01"
    # Se evitan tildes y guiones largos: la trama viaja 100% en ASCII y así
    # no hay caracteres escapados (\\uXXXX) ni problemas de codificación entre
    # el microcontrolador, el CSV y el servidor.
    UBICACION = "Nevera industrial - Bahia 3"
    FIRMWARE = "1.0.0"

    PIN_DHT = 15          # DHT22 (temperatura + humedad)
    PIN_LDR = 34          # LDR por ADC (luz) - GPIO34: solo entrada, ADC1

    INTERVALO_MS = 2000   # una lectura cada 2 segundos (corto para la demo)
    TOTAL_LECTURAS = 12   # límite de la simulación (None = bucle infinito)

    ARCHIVO_CSV = "historico_nodos.csv"
    MAX_REGISTROS_ROTACION = 50   # a partir de aquí rota el archivo

    # Semilla fija: las evidencias son REPRODUCIBLES (misma corrida, mismos
    # datos). Cambiar a None para obtener lecturas distintas en cada arranque.
    SEMILLA_ALEATORIA = 20261016

    # ORIGEN DE CADA MAGNITUD ---------------------------------------------
    # El desafío pide lecturas ALEATORIAS CONTINUAS que simulen el ambiente,
    # y a la vez el montaje tiene los sensores conectados. Por eso se puede
    # elegir el origen de cada magnitud sin tocar la lógica:
    #
    #   "simulado" -> caminata aleatoria + eventos de ambiente (cumple el
    #                 punto 2 del desafío). Es el modo del laboratorio.
    #   "fisico"   -> lee el componente conectado: el DHT22 (mover sus
    #                 controles en Wokwi o un sensor real) y el LDR por ADC.
    #
    # En el DHT22 de Wokwi los valores se cambian con los deslizadores que
    # aparecen al hacer clic sobre el sensor.
    FUENTE_TEMPERATURA_HUMEDAD = "simulado"
    FUENTE_LUZ = "fisico"

    # Umbrales de la cadena de frío (medicamentos)
    TEMP_MIN = 2.0
    TEMP_MAX = 8.0
    HUM_MAX = 75.0
    LUZ_MAX = 700                 # lux: exposición lumínica excesiva

    LOTE_MAXIMO = 5       # ráfagas de hasta 5 lecturas por paquete


# =============================================================================
# 2. CAPA DE SENSORES — abstracción del hardware
# =============================================================================
class SensorSimulado:
    """
    Genera lecturas dinámicas con INERCIA: cada valor parte del anterior y
    se mueve un poco (caminata aleatoria acotada).

    ¿Por qué no un random puro?  Porque la temperatura de una nevera no salta
    de 2 C a 9 C entre dos lecturas: tiene inercia térmica. Un CSV con saltos
    imposibles es un CSV que no sirve para validar nada.
    """

    def __init__(self, valor_inicial, variacion, minimo, maximo, decimales=2):
        self.valor = valor_inicial
        self.variacion = variacion
        self.minimo = minimo
        self.maximo = maximo
        self.decimales = decimales

    def leer(self):
        """Avanza un paso la caminata aleatoria y devuelve el valor acotado."""
        self.valor += random.uniform(-self.variacion, self.variacion)
        self.valor = max(self.minimo, min(self.maximo, self.valor))
        return self._redondear()

    def _redondear(self):
        if self.decimales == 0:
            return int(round(self.valor))
        return round(self.valor, self.decimales)


class SensorLuz:
    """
    Luz en lux sobre el módulo fotorresistor (LDR) de Wokwi.

    RELACIÓN INVERSA (concepto clave):
        Más luz -> resistencia del LDR baja -> el voltaje en AO BAJA.
        Por eso 'crudo' grande significa OSCURIDAD, no luz.

    Conversión (ecuación documentada del módulo):
        v        = crudo / 4095 * VCC                 # voltaje en AO
        R_ldr    = R_PULLUP * v / (VCC - v)           # ley del divisor
        lux      = ( RL10 * 1e3 * 10^gamma / R_ldr ) ^ (1/gamma)

    En el hardware real estas constantes (gamma, RL10, R_PULLUP) se calibran
    contra un luxómetro; aquí se usan los valores por defecto del módulo.
    """

    VCC = 3.3
    R_PULLUP = 10000.0    # resistencia fija del módulo (10 kΩ)
    RL10 = 50.0           # resistencia del LDR a 10 lux (kΩ)
    GAMMA = 0.7           # pendiente de la recta log(R)/log(lux)
    ADC_MAXIMO = 4095     # ESP32: ADC de 12 bits

    def __init__(self, pin):
        self.ldr = None
        if machine is not None:
            try:
                self.ldr = machine.ADC(machine.Pin(pin))
                self.ldr.atten(machine.ADC.ATTN_11DB)  # rango completo ~3.3 V
                print("# LDR inicializado en GPIO{} (ADC1, 12 bits)".format(pin))
            except Exception as error:
                print("# LDR no disponible ({}); se usa simulacion".format(error))

    def disponible(self):
        return self.ldr is not None

    def _luxes(self):
        """Convierte el valor crudo del ADC a lux. Devuelve None si no hay dato."""
        if self.ldr is None:
            return None
        try:
            return self.convertir_a_lux(self.ldr.read())
        except Exception as error:
            print("# Error leyendo el LDR: {}".format(error))
            return None

    @classmethod
    def convertir_a_lux(cls, crudo):
        """Función de conversión (separable para poder probarla en el PC)."""
        voltaje = (crudo / cls.ADC_MAXIMO) * cls.VCC
        if voltaje <= 0.01 or voltaje >= cls.VCC - 0.01:
            return 0                                  # saturado: oscuridad
        resistencia = cls.R_PULLUP * voltaje / (cls.VCC - voltaje)

        if math is not None:
            lux = math.pow((cls.RL10 * 1e3 * math.pow(10, cls.GAMMA)) / resistencia,
                           1.0 / cls.GAMMA)
        else:
            lux = ((cls.RL10 * 1e3 * 10 ** cls.GAMMA) / resistencia) ** (1.0 / cls.GAMMA)

        # Un luxómetro no ve infinito: se acota a un máximo razonable
        if lux < 0 or lux != lux:      # cubre el infinito del módulo real
            return 0
        return min(round(lux, 1), 2000.0)

    def leer(self):
        return self._luxes()


class Sensores:
    """
    Fachada de sensores: usa el hardware cuando existe y cae a la simulación
    cuando no. Esa es la abstracción que permite el MISMO código en Wokwi,
    en el PC y en un prototipo físico real.
    """

    def __init__(self):
        # Valores iniciales cercanos al umbral, para que la dinámica del
        # ambiente produzca alertas reales durante la demostración.
        self.temperatura = SensorSimulado(7.2, 0.45, 3.0, 10.5)
        self.humedad = SensorSimulado(66.0, 1.8, 45.0, 85.0)
        self.luz = SensorSimulado(430, 90, 40, 950, decimales=0)

        self.sensor_dht = None
        self.sensor_luz = SensorLuz(Config.PIN_LDR)

        if dht is not None and machine is not None:
            try:
                self.sensor_dht = dht.DHT22(machine.Pin(Config.PIN_DHT))
                print("# DHT22 inicializado en GPIO{}".format(Config.PIN_DHT))
            except Exception as error:
                print("# DHT22 no disponible ({}); se usa simulacion".format(error))

        # --- Estado del evento "apertura de puerta" ---
        self.evento_activo = False
        self.evento_restante = 0
        self.offset_temperatura = 0.0
        self.offset_humedad = 0.0
        self.eventos_generados = 0

        print("# Fuente temperatura/humedad: {}".format(
            Config.FUENTE_TEMPERATURA_HUMEDAD))
        print("# Fuente luz: {}".format(Config.FUENTE_LUZ))

    # --- lectura del hardware -------------------------------------------------
    def _leer_dht(self):
        """Lee el DHT22 solo si se pidió el modo físico y hay hardware."""
        if Config.FUENTE_TEMPERATURA_HUMEDAD != "fisico":
            return None
        if self.sensor_dht is None:
            return None
        try:
            self.sensor_dht.measure()
            return self.sensor_dht.temperature(), self.sensor_dht.humidity()
        except Exception as error:
            # En un nodo real, un fallo del DHT22 es habitual (ruido, cable):
            # se registra y se continúa. NUNCA se detiene el programa.
            print("# Error leyendo DHT22: {}".format(error))
            return None

    # --- eventos del ambiente -------------------------------------------------
    def _actualizar_eventos(self):
        """
        Simula la apertura de la puerta de la nevera: sube la temperatura y la
        humedad de golpe y luego se disipa en las siguientes lecturas.

        Esto es lo que hace DINÁMICO el ambiente que pide el desafío: no es
        ruido aleatorio, es un comportamiento con causa y efecto observable
        en el histórico (se ve la subida y la recuperación en el CSV).
        """
        if self.evento_restante > 0:
            self.evento_restante -= 1
            # Disipación: el efecto se reduce ~55% en cada lectura
            self.offset_temperatura *= 0.45
            self.offset_humedad *= 0.45
            if self.evento_restante == 0:
                self.evento_activo = False
                self.offset_temperatura = 0.0
                self.offset_humedad = 0.0
            return None

        # Probabilidad de que ocurra un evento en esta lectura
        if random.random() < 0.18:
            self.eventos_generados += 1
            self.evento_activo = True
            self.evento_restante = 3
            self.offset_temperatura = 1.6      # aire caliente del pasillo
            self.offset_humedad = 6.0          # humedad del ambiente
            return "APERTURA_PUERTA"
        return None

    def leer(self):
        """Devuelve las tres magnitudes del desafío más el evento detectado."""
        evento = self._actualizar_eventos()

        valores = self._leer_dht()
        if valores is not None:
            temperatura, humedad = round(valores[0], 2), round(valores[1], 2)
        else:
            temperatura = self.temperatura.leer()
            humedad = self.humedad.leer()

        # Los offsets del evento se aplican sobre la lectura (simulación)
        temperatura = round(min(10.5, max(3.0, temperatura + self.offset_temperatura)), 2)
        humedad = round(min(85.0, max(45.0, humedad + self.offset_humedad)), 2)

        luz = self.sensor_luz.leer() if Config.FUENTE_LUZ == "fisico" else None
        if luz is None:
            luz = self.luz.leer()

        return {"temperatura": temperatura, "humedad": humedad,
                "luz": luz, "evento": evento}


# =============================================================================
# 3. NÚCLEO 1 — ESTRUCTURACIÓN JSON CON MARCA DE TIEMPO
# =============================================================================
class Reloj:
    """
    Manejo del tiempo en MicroPython.

    Un ESP32 sin módulo RTC externo ni red arranca en 2000-01-01: NO sabe qué
    hora es. Por eso cada trama lleva DOS referencias temporales:
      * 'uptime_s'  -> segundos desde el arranque. SIEMPRE confiable y exacto.
      * 'timestamp' -> Unix en segundos. Correcto solo si el reloj fue
                       sincronizado (NTP). En la simulación se usa una hora
                       base ficticia y se documenta la limitación.
    Documentar esta diferencia es parte del diseño: quien consume el dato debe
    saber cuál de las dos marcas puede usar para auditoría.
    """

    HORA_BASE = 1776000000   # referencia ficticia (2026) para la simulación

    def __init__(self):
        self.arranque_ms = time.ticks_ms()

    def uptime_ms(self):
        return time.ticks_diff(time.ticks_ms(), self.arranque_ms)

    def uptime_segundos(self):
        return round(self.uptime_ms() / 1000.0, 2)

    def fecha_legible(self):
        """Fecha y hora del sistema en formato ISO 8601 (legible, ordenable)."""
        t = time.localtime()
        return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}".format(
            t[0], t[1], t[2], t[3], t[4], t[5]
        )

    def timestamp_unix(self):
        return self.HORA_BASE + int(self.uptime_segundos())


class Empaquetador:
    """Construye la trama JSON estricta de cada lectura y evalúa las alertas."""

    def __init__(self, reloj):
        self.reloj = reloj
        self.secuencia = 0

    def construir(self, valores):
        """Esquema normalizado: todos los nodos hablan el mismo idioma."""
        self.secuencia += 1
        mensaje = {
            "nodo_id": Config.NODO_ID,
            "ubicacion": Config.UBICACION,
            "firmware": Config.FIRMWARE,
            "secuencia": self.secuencia,
            "timestamp": self.reloj.timestamp_unix(),
            "fecha": self.reloj.fecha_legible(),
            "uptime_s": self.reloj.uptime_segundos(),
            "sensores": {
                "temperatura_c": valores["temperatura"],
                "humedad_pct": valores["humedad"],
                "luz_lux": valores["luz"],
            },
            "unidades": {"temperatura_c": "C", "humedad_pct": "%", "luz_lux": "lux"},
        }
        if valores.get("evento"):
            mensaje["evento"] = valores["evento"]
        return mensaje

    def a_json(self, mensaje, compacto=True):
        """
        Serializa a texto JSON.

        compacto=True  -> trama de RED y Monitor Serie: sin espacios, mínimos
                          bytes (separators se soporta en MicroPython y en CPython).
        compacto=False -> trama LEGIBLE para depurar a mano.
        """
        if compacto:
            return json.dumps(mensaje, separators=(",", ":"))
        return json.dumps(mensaje, separators=(", ", ": "))

    def evaluar_alertas(self, mensaje):
        """Reglas de negocio: cadena de frío y exposición lumínica."""
        s = mensaje["sensores"]
        alertas = []
        if s["temperatura_c"] < Config.TEMP_MIN:
            alertas.append("TEMP_BAJA")
        if s["temperatura_c"] > Config.TEMP_MAX:
            alertas.append("TEMP_ALTA")
        if s["humedad_pct"] > Config.HUM_MAX:
            alertas.append("HUMEDAD_ALTA")
        if s["luz_lux"] > Config.LUZ_MAX:
            alertas.append("LUZ_ALTA")
        return alertas


# =============================================================================
# 4. NÚCLEO 2 — PERSISTENCIA CSV CON MARCA DE TIEMPO
# =============================================================================
class HistoricoCSV:
    """
    Histórico local en .csv: la RED DE SEGURIDAD del nodo.

    Decisiones de diseño (justificadas en la actividad 3.1):
      * CSV porque la serie es uniforme: pesa ~60% menos que JSON.
      * Modo 'a' (append): jamás se pierde lo ya registrado.
      * Encabezado solo si el archivo es nuevo.
      * ROTACIÓN por número de registros: el sistema de archivos del ESP32 es
        pequeño; en producción se rota por fecha (historico_2026-10-16.csv).
      * Se abre y cierra el archivo en CADA registro: si se corta la energía,
        lo ya escrito queda íntegro en el disco.
    """

    COLUMNAS = ("timestamp", "fecha", "uptime_s", "nodo_id", "temperatura_c",
                "humedad_pct", "luz_lux", "alertas")

    def __init__(self, ruta, max_registros):
        self.ruta = ruta
        self.max_registros = max_registros
        self.registros_escritos = 0
        self.rotaciones = 0
        self._contar_registros_existentes()
        self._crear_con_encabezado_si_hace_falta()

    def existe(self):
        try:
            with open(self.ruta, "r"):
                return True
        except OSError:
            return False

    def _contar_registros_existentes(self):
        if not self.existe():
            return
        filas = 0
        try:
            with open(self.ruta, "r") as archivo:
                for _ in archivo:            # iteración: no carga todo en RAM
                    filas += 1
            self.registros_escritos = max(0, filas - 1)   # menos el encabezado
        except OSError:
            self.registros_escritos = 0

    def _crear_con_encabezado_si_hace_falta(self):
        if not self.existe():
            with open(self.ruta, "w") as archivo:
                archivo.write(",".join(self.COLUMNAS) + "\n")
            print("# CSV creado con encabezado: {}".format(self.ruta))

    def _rotar_si_necesario(self):
        if self.registros_escritos < self.max_registros:
            return
        respaldo = "historico_nodos_{}.csv".format(time.ticks_ms())
        try:
            import os
            os.rename(self.ruta, respaldo)
            self.registros_escritos = 0
            self.rotaciones += 1
            self._crear_con_encabezado_si_hace_falta()
            print("# ROTACION: {} -> {}".format(self.ruta, respaldo))
        except Exception as error:
            print("# No se pudo rotar ({}); se sigue agregando".format(error))

    def guardar(self, mensaje, alertas):
        self._rotar_si_necesario()
        s = mensaje["sensores"]
        fila = "{},{},{},{},{},{},{},{}\n".format(
            mensaje["timestamp"], mensaje["fecha"], mensaje["uptime_s"],
            mensaje["nodo_id"], s["temperatura_c"], s["humedad_pct"],
            s["luz_lux"], "|".join(alertas) if alertas else "OK")
        with open(self.ruta, "a") as archivo:
            archivo.write(fila)
        self.registros_escritos += 1

    def leer_ultimos(self, cantidad=5):
        with open(self.ruta, "r") as archivo:
            lineas = archivo.read().strip().split("\n")
        return lineas[-cantidad:] if lineas != [""] else []

    def peso_bytes(self):
        try:
            import os
            return os.stat(self.ruta)[6]
        except Exception:
            return 0


# =============================================================================
# 5. NÚCLEO 3 — SERIALIZACIÓN Y ENVÍO DE RÁFAGAS
# =============================================================================
class TransmisorRafagas:
    """
    Empaqueta lecturas y las envía en RÁFAGAS (lotes).

    ¿Por qué ráfagas y no una petición por lectura?
      * 12 lecturas individuales = 12 conexiones y 12 despertares de radio.
      * 1 ráfaga con 12 lecturas  = 1 conexión. Ahorra batería, datos y
        peticiones, y evita el error 429 (demasiadas peticiones) visto en 3.3.

    El transporte es una INTERFAZ genérica: el mismo empaquetado sirve con
      TransporteSerial  -> UART / COM (microcontrolador <-> PC)
      TransporteHTTP    -> urequests / requests hacia la nube
      TransporteConsola -> Monitor Serie de Wokwi (demostración)
    Esa separación es lo que deja la arquitectura LISTA para la conexión
    serial física, tal como pide el punto 4 del desafío.
    """

    def __init__(self, transporte, empaquetador, maximo_lote):
        self.transporte = transporte
        self.empaquetador = empaquetador
        self.maximo_lote = maximo_lote
        self.buffer = []
        self.total_enviado = 0
        self.total_fallido = 0
        self.rafagas = 0

    def agregar(self, mensaje):
        self.buffer.append(mensaje)

    def debe_enviar(self):
        return len(self.buffer) >= self.maximo_lote

    def enviar(self, motivo="lote completo"):
        if not self.buffer:
            return None

        paquete = {
            "nodo_id": Config.NODO_ID,
            "firmware": Config.FIRMWARE,
            "tipo": "rafaga_telemetria",
            "motivo": motivo,
            "cantidad": len(self.buffer),
            "generado_en": self.empaquetador.reloj.fecha_legible(),
            "lecturas": self.buffer,
        }
        trama = self.empaquetador.a_json(paquete, compacto=True)

        if self.transporte.enviar(trama):
            self.total_enviado += len(self.buffer)
            self.rafagas += 1
            print("[RAFAGA] {} lecturas enviadas ({} bytes, motivo: {})".format(
                len(self.buffer), len(trama), motivo))
        else:
            # El dato NO se pierde: ya está en el CSV local para reintento.
            self.total_fallido += len(self.buffer)
            print("[RAFAGA] Fallo el envio; las {} lecturas quedan en el CSV "
                  "local para reintento".format(len(self.buffer)))

        cantidad = len(self.buffer)
        self.buffer = []
        return cantidad


class TransporteConsola:
    """
    Transporte de demostración: imprime la trama en el Monitor Serie.
    En MicroPython, print() escribe al UART0, así que este transporte ES una
    transmisión serial (por el puerto USB de programación).
    """

    def __init__(self, mostrar_trama=True):
        self.mostrar_trama = mostrar_trama
        self.enviados = 0

    def enviar(self, trama):
        self.enviados += 1
        if self.mostrar_trama:
            print(">>> TRAMA SERIAL: {}".format(trama))
        return True


class TransporteSerial:
    """
    TRANSPORTE SERIAL FÍSICO — listo para el montaje con la placa conectada.

    El desafío pide PREPARAR la arquitectura para la conexión serial física.
    En Wokwi no hay un periférico UART externo, por eso la demo usa
    TransporteConsola. Con hardware real basta cambiar UNA línea en
    construir_transporte().

    Equivalencias con PySerial del lado del PC (núcleo 3):
        PC (Python)                        ESP32 (MicroPython)
        ---------------------------------  ---------------------------------
        serial.Serial('COM4', 115200)      machine.UART(1, baudrate=115200)
        puerto.write(trama.encode())       uart.write((trama+'\\n').encode())
        puerto.readline()                  uart.readline()
        puerto.in_waiting                  uart.any()
        trama.decode().strip()             trama.decode().strip()
    """

    def __init__(self, id_uart=1, tx_pin=17, rx_pin=16, baudrate=115200):
        self.uart = None
        self.enviados = 0
        if machine is None:
            print("# UART no disponible fuera del microcontrolador")
            return
        try:
            self.uart = machine.UART(id_uart, baudrate=baudrate, tx=tx_pin,
                                     rx=rx_pin, timeout=1000, bits=8,
                                     parity=None, stop=1)
            print("# UART{} lista (TX=GPIO{}, RX=GPIO{}, {} baudios)".format(
                id_uart, tx_pin, rx_pin, baudrate))
        except Exception as error:
            print("# No se pudo abrir la UART: {}".format(error))

    def enviar(self, trama):
        if self.uart is None:
            return False
        try:
            # write() exige BYTES: se codifica y se cierra con '\n' para que
            # el receptor pueda leer con readline().
            self.uart.write((trama + "\n").encode("utf-8"))
            self.enviados += 1
            return True
        except Exception as error:
            print("# Error de escritura UART: {}".format(error))
            return False


class TransporteHTTP:
    """
    TRANSPORTE HTTP — listo para apuntar al microservicio del proyecto.
    En el ESP32 requiere WiFi; usa 'urequests' (MicroPython) y cae a
    'requests' (CPython) para poder probarse desde el PC.
    """

    def __init__(self, url, timeout=5):
        self.url = url
        self.timeout = timeout
        self.enviados = 0

    def enviar(self, trama):
        try:
            try:
                import urequests as cliente        # MicroPython
            except ImportError:
                import requests as cliente         # CPython (pruebas)
            respuesta = cliente.post(self.url, data=trama,
                                     headers={"Content-Type": "application/json"})
            self.enviados += 1
            if respuesta.status_code in (200, 201):
                return True
            print("# El servidor respondio {}".format(respuesta.status_code))
            return False
        except Exception as error:
            print("# Error de red: {}".format(error))
            return False


# =============================================================================
# 6. ORQUESTADOR — bucle principal del nodo
# =============================================================================
def construir_transporte():
    """
    ÚNICO punto donde se decide cómo se envía.

    En Wokwi  : TransporteConsola (la ráfaga viaja por el Monitor Serie).
    En físico : descomentar TransporteSerial.
    En red    : descomentar TransporteHTTP con la URL del microservicio.
    """
    return TransporteConsola(mostrar_trama=True)
    # return TransporteSerial(id_uart=1, tx_pin=17, rx_pin=16, baudrate=115200)
    # return TransporteHTTP("http://192.168.1.100:3000/api/telemetria")


def titulo(texto):
    print("\n" + "=" * 62)
    print(texto)
    print("=" * 62)


def main():
    if Config.SEMILLA_ALEATORIA is not None:
        random.seed(Config.SEMILLA_ALEATORIA)

    titulo("SIMULADOR INTELIGENTE DE NODOS IoT")
    print("Nodo      : {} | Firmware: {}".format(Config.NODO_ID, Config.FIRMWARE))
    print("Sensores  : temperatura, humedad, luz")
    print("Intervalo : {} ms | Lecturas: {}".format(
        Config.INTERVALO_MS, Config.TOTAL_LECTURAS))
    print("Historico : {}".format(Config.ARCHIVO_CSV))
    print("Rafagas de {} lecturas".format(Config.LOTE_MAXIMO))

    reloj = Reloj()
    sensores = Sensores()
    empaquetador = Empaquetador(reloj)
    historico = HistoricoCSV(Config.ARCHIVO_CSV, Config.MAX_REGISTROS_ROTACION)
    transmisor = TransmisorRafagas(construir_transporte(), empaquetador,
                                   Config.LOTE_MAXIMO)

    lecturas = 0
    lecturas_con_alerta = 0
    minimo_temp = None
    maximo_temp = None

    # -------------------------------------------------------------------------
    # BUCLE PRINCIPAL
    # -------------------------------------------------------------------------
    while Config.TOTAL_LECTURAS is None or lecturas < Config.TOTAL_LECTURAS:
        lecturas += 1

        # 1) Leer el hardware (o su simulación)
        valores = sensores.leer()

        # 2) Estructurar la mensajería JSON con marca de tiempo
        mensaje = empaquetador.construir(valores)

        # 3) Evaluar las reglas de negocio (cadena de frío)
        alertas = empaquetador.evaluar_alertas(mensaje)
        if alertas:
            lecturas_con_alerta += 1

        # 4) Persistir en el histórico .csv (append, una fila por lectura)
        historico.guardar(mensaje, alertas)

        # 5) Acumular para la ráfaga y enviar cuando el lote se complete
        transmisor.agregar(mensaje)
        if transmisor.debe_enviar():
            transmisor.enviar("lote completo")

        # 6) Traza en el Monitor Serie: una línea JSON por lectura
        temperatura = mensaje["sensores"]["temperatura_c"]
        minimo_temp = temperatura if minimo_temp is None else min(minimo_temp, temperatura)
        maximo_temp = temperatura if maximo_temp is None else max(maximo_temp, temperatura)

        etiquetas = list(alertas)
        if valores.get("evento"):
            etiquetas.append(valores["evento"])
        print("[{}/{}] {} | T={}C H={}% L={}lux {}".format(
            lecturas,
            Config.TOTAL_LECTURAS if Config.TOTAL_LECTURAS else "inf",
            mensaje["fecha"], temperatura, mensaje["sensores"]["humedad_pct"],
            mensaje["sensores"]["luz_lux"],
            ("ALERTA:" + "|".join(etiquetas)) if etiquetas else "ok"))
        print(empaquetador.a_json(mensaje, compacto=True))

        # 7) Espera hasta la siguiente lectura (suficiente para la demo; en
        #    producción se usaría un Timer que no bloquee el resto del sistema)
        time.sleep_ms(Config.INTERVALO_MS)

    # Enviar el remanente que no completó el lote: ninguna lectura debe quedar
    # sin transmitir (patrón de cierre obligatorio en cualquier recolector).
    transmisor.enviar("cierre de simulacion")

    # -------------------------------------------------------------------------
    # RESUMEN FINAL — evidencia para el informe
    # -------------------------------------------------------------------------
    titulo("RESUMEN DE LA SIMULACION")
    print("Lecturas generadas    : {}".format(lecturas))
    print("Con alerta de umbral  : {} ({:.0f}%)".format(
        lecturas_con_alerta, (lecturas_con_alerta / lecturas) * 100))
    print("Eventos de ambiente   : {} (aperturas de puerta)".format(
        sensores.eventos_generados))
    print("Temperatura en el ciclo: min {}C | max {}C".format(minimo_temp, maximo_temp))
    print("Historico CSV         : {} ({} bytes)".format(
        Config.ARCHIVO_CSV, historico.peso_bytes()))
    print("Rotaciones de archivo : {}".format(historico.rotaciones))
    print("Rafagas enviadas      : {} rafagas con {} lecturas".format(
        transmisor.rafagas, transmisor.total_enviado))
    print("Lecturas no enviadas  : {} (permanecen en el CSV local)".format(
        transmisor.total_fallido))
    print("Uptime total          : {} s".format(reloj.uptime_segundos()))

    print("\nUltimas filas del historico .csv:")
    for fila in historico.leer_ultimos(4):
        print("  " + fila)

    print("\nFORMATO DEL HISTORICO (.csv):")
    print("  timestamp,fecha,uptime_s,nodo_id,temperatura_c,humedad_pct,luz_lux,alertas")
    print("\nFORMATO DE LA RAFAGA ENVIADA (JSON):")
    print('  {"nodo_id","firmware","tipo":"rafaga_telemetria","motivo",')
    print('   "cantidad","generado_en","lecturas":[{...},{...}]}')
    print("\nSimulacion finalizada: arquitectura lista para la conexion serial fisica.")


if __name__ == "__main__":
    main()
