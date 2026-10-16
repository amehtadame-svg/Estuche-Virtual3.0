"""
PRUEBA LOCAL DEL SCRIPT DE WOKWI (sin ESP32 ni internet)
Guía de aprendizaje: Python para Internet de las Cosas (IoT) — 228118

¿Para qué sirve?
    El archivo `wokwi/main.py` está escrito para MicroPython. Este arnés lo
    ejecuta en CPython (el Python de escritorio) para:
      1. Verificar la lógica ANTES de subirla a Wokwi (ahorra tiempo de clase).
      2. Generar y guardar las EVIDENCIAS del laboratorio:
           evidencias/salida_monitor_serie.txt  (todo lo que "imprime" la placa)
           evidencias/historico_nodos.csv       (copia del histórico local)
      3. Demostrar la abstracción de hardware: el MISMO código funciona con los
         sensores simulados de Wokwi, con sensores físicos o con CPython.

Cómo funciona
    MicroPython aporta funciones que CPython no tiene en `time`:
        sleep_ms(), ticks_ms(), ticks_diff()
    Este arnés las inyecta en el módulo `time` de CPython. El script de la
    placa se ejecuta TAL CUAL, sin modificarlo: así lo que se prueba aquí es
    exactamente el archivo que va a Wokwi.

Ejecución:
    python prueba_local_main.py
"""

import importlib.util
import os
import shutil
import sys
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
RUTA_WOKWI = os.path.join(AQUI, "wokwi")
RUTA_MAIN = os.path.join(RUTA_WOKWI, "main.py")
RUTA_EVIDENCIAS = os.path.join(AQUI, "evidencias")


# ---------------------------------------------------------------------------
# Arnés de compatibilidad MicroPython -> CPython
# ---------------------------------------------------------------------------
def instalar_compatibilidad_micropython():
    """Inyecta en el módulo `time` las funciones propias de MicroPython."""
    time.sleep_ms = lambda ms: time.sleep(ms / 1000.0)
    time.ticks_ms = lambda: int(time.monotonic() * 1000)
    time.ticks_diff = lambda a, b: a - b
    time.ticks_add = lambda ticks, delta: ticks + delta

    print("Arnes listo: time.sleep_ms, time.ticks_ms, time.ticks_diff inyectadas")
    print("('machine' y 'dht' NO existen en el PC: el script cae a la simulacion,")
    print(" que es justo el camino de respaldo que interesa validar.)")


class Tee:
    """
    Duplica la salida estándar: la muestra en pantalla Y la escribe en un
    archivo. Así se obtiene la evidencia del Monitor Serie sin copiar/pegar.
    """

    def __init__(self, archivo):
        self.archivo = archivo
        self.consola = sys.stdout

    def write(self, texto):
        self.consola.write(texto)
        self.archivo.write(texto)
        return len(texto)

    def flush(self):
        self.consola.flush()
        self.archivo.flush()


def cargar_modulo_wokwi(ruta):
    """Importa `main.py` desde la carpeta wokwi/ como si fuera un módulo."""
    especificacion = importlib.util.spec_from_file_location("main_wokwi", ruta)
    modulo = importlib.util.module_from_spec(especificacion)
    especificacion.loader.exec_module(modulo)
    return modulo


def verificar_evidencias(modulo):
    """Valida la estructura del histórico generado (control de calidad)."""
    ruta_csv = os.path.join(RUTA_WOKWI, modulo.Config.ARCHIVO_CSV)
    if not os.path.exists(ruta_csv):
        print("ERROR: no se generó el histórico .csv")
        return False

    with open(ruta_csv, "r", encoding="utf-8") as archivo:
        lineas = archivo.read().strip().split("\n")

    print(f"\nEVIDENCIA GENERADA: {ruta_csv}")
    print(f"  Filas: {len(lineas)} (1 encabezado + {len(lineas) - 1} registros)")
    print(f"  Peso : {os.path.getsize(ruta_csv)} bytes")
    print(f"  Encabezado: {lineas[0]}")

    columnas = lineas[0].split(",")
    print(f"  Columnas ({len(columnas)}): {columnas}")

    # 1) Validación estructural: todas las filas con el mismo número de campos
    correcto = all(len(fila.split(",")) == len(columnas) for fila in lineas[1:])
    print(f"  Todas las filas con el mismo numero de columnas: {correcto}")

    # 2) Validación temporal: la marca de tiempo debe avanzar
    tiempos = [float(fila.split(",")[2]) for fila in lineas[1:]]
    print(f"  uptime_s: {tiempos[0]} -> {tiempos[-1]} "
          f"(la marca avanza: {tiempos[-1] >= tiempos[0]})")

    # 3) Validación de contenido: cada fila debe ser JSON-parseable en sus campos
    errores = 0
    for fila in lineas[1:]:
        campos = fila.split(",")
        try:
            float(campos[4])   # temperatura
            float(campos[5])   # humedad
            int(campos[6])     # luz
        except ValueError:
            errores += 1
    print(f"  Filas con valores numericos validos: {len(lineas) - 1 - errores}"
          f"/{len(lineas) - 1}")

    # 4) Cobertura de alertas: el histórico debe evidenciar las reglas de negocio
    con_alerta = [f for f in lineas[1:] if not f.endswith("OK")]
    print(f"  Filas con alerta registrada: {len(con_alerta)}")

    # Copia a la carpeta de evidencias
    destino = os.path.join(RUTA_EVIDENCIAS, modulo.Config.ARCHIVO_CSV)
    shutil.copyfile(ruta_csv, destino)
    print(f"  Copia guardada en: {destino}")
    return correcto


def main():
    print("=" * 72)
    print("PRUEBA LOCAL DEL SIMULADOR DE NODOS IoT (script de Wokwi en CPython)")
    print("=" * 72)

    if not os.path.exists(RUTA_MAIN):
        print(f"ERROR: no se encontró {RUTA_MAIN}")
        sys.exit(1)

    instalar_compatibilidad_micropython()
    os.makedirs(RUTA_EVIDENCIAS, exist_ok=True)

    # Se ejecuta desde wokwi/ para que el .csv quede junto al script, igual
    # que en el sistema de archivos del ESP32.
    os.chdir(RUTA_WOKWI)
    os.makedirs("evidencias", exist_ok=True)

    # Si ya existía un histórico de una corrida anterior, se aparta: se quiere
    # evidenciar el arranque limpio (creación del encabezado incluida).
    ruta_csv_previo = os.path.join(RUTA_WOKWI, "historico_nodos.csv")
    if os.path.exists(ruta_csv_previo):
        os.remove(ruta_csv_previo)

    modulo = cargar_modulo_wokwi(RUTA_MAIN)

    # Ajuste SOLO para la prueba local: se acorta el intervalo para no esperar
    # los 2 s por lectura de la demo de Wokwi. La lógica no se modifica.
    modulo.Config.INTERVALO_MS = 120
    modulo.Config.LOTE_MAXIMO = 5

    # Captura de la "salida del Monitor Serie" como evidencia
    ruta_monitor = os.path.join(RUTA_EVIDENCIAS, "salida_monitor_serie.txt")
    inicio = time.perf_counter()

    print("\nEjecutando wokwi/main.py ...\n" + "-" * 72)
    with open(ruta_monitor, "w", encoding="utf-8") as archivo:
        original = sys.stdout
        sys.stdout = Tee(archivo)
        try:
            modulo.main()
        finally:
            sys.stdout = original

    duracion = time.perf_counter() - inicio
    print("-" * 72)
    print(f"Prueba local finalizada en {duracion:.2f} s")
    print(f"Salida del Monitor Serie guardada en: {ruta_monitor}")

    if verificar_evidencias(modulo):
        print("\nRESULTADO: el script de Wokwi es funcional. Evidencias listas.")
    else:
        print("\nRESULTADO: revisar el histórico generado.")
        sys.exit(1)


if __name__ == "__main__":
    main()
