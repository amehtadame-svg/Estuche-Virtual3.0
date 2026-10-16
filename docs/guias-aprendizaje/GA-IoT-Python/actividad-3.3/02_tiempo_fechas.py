"""
NÚCLEO 2 — Control del tiempo y fechas
Guía de aprendizaje: Python para Internet de las Cosas (IoT)
Programa: Análisis y Desarrollo de Software — 228118

Objetivo:
    Dominar el manejo temporal de un sistema de monitoreo:
      * time          -> retrasos (sleep), marcas de tiempo Unix, tiempo de proceso
      * datetime      -> formateo legible, aritmética de fechas, zonas horarias
      * time.perf_counter() -> medir la duración real de una lectura

Por qué importa en IoT:
    Un dato de sensor SIN marca de tiempo no sirve para una cadena de frío.
    Y una marca de tiempo mal capturada (o en zona horaria equivocada)
    invalida el registro completo.

Ejecución:
    python 02_tiempo_fechas.py
"""

import random
import time
from datetime import datetime, timedelta, timezone

# Python 3.9+ incluye zoneinfo en la librería estándar (no requiere pip)
try:
    from zoneinfo import ZoneInfo

    ZONA_BOGOTA = ZoneInfo("America/Bogota")
except Exception:  # pragma: no cover - solo si falta la base de datos tzdata
    ZONA_BOGOTA = None


def titulo(texto: str) -> None:
    """Encabezado para separar cada bloque del demo."""
    print("\n" + "=" * 72)
    print(texto)
    print("=" * 72)


# ---------------------------------------------------------------------------
# 1. time.time(): la marca de tiempo Unix
# ---------------------------------------------------------------------------
def demo_unix_timestamp() -> None:
    titulo("1. time.time() — la marca de tiempo Unix")

    ahora = time.time()
    print(f"  time.time() devuelve un float: {ahora}")
    print("  Significado: SEGUNDOS transcurridos desde el 01/01/1970 00:00 UTC")
    print("  ('la época Unix'). Por eso es un valor que crece siempre.")

    print("\n  ¿Por qué es el estándar de facto en IoT?")
    for motivo in (
        "Es un único número: ocupa pocos bytes y viaja igual en cualquier protocolo.",
        "No tiene ambigüedad de formato (nada de 03/04 vs 04/03).",
        "Es independiente de la zona horaria: se formatea al mostrarlo, no al guardarlo.",
        "El microcontrolador y el servidor lo generan sin necesidad de librerías externas.",
    ):
        print(f"    - {motivo}")

    # Dos formas de guardarlo y sus diferencias
    entero = int(ahora)
    milisegundos = int(ahora * 1000)

    print(f"\n  Precisión de la marca (segundos) ... {entero}")
    print(f"  Precisión de la marca (miliseg.) ... {milisegundos}")
    print(f"  Valores absolutos son ilegibles para un humano -> para eso está datetime.")

    # Verificación local: convertir de vuelta con el módulo time
    legible_local = time.ctime(entero)
    estructura = time.localtime(entero)
    print(f"\n  time.ctime(entero)      -> {legible_local}")
    print(f"  time.localtime(entero)  -> {estructura.tm_year}-{estructura.tm_mon:02d}-"
          f"{estructura.tm_mday:02d} {estructura.tm_hour:02d}:{estructura.tm_min:02d}")


# ---------------------------------------------------------------------------
# 2. time.sleep(): retrasos de reloj
# ---------------------------------------------------------------------------
def demo_sleep() -> None:
    titulo("2. time.sleep() — retrasos de reloj entre lecturas")

    inicio = time.perf_counter()

    print("  Simulación de 3 lecturas con pausa de 1 segundo entre cada una:")
    for numero in range(1, 4):
        lectura = round(random.uniform(2.0, 9.0), 2)
        transcurrido = time.perf_counter() - inicio
        print(f"    [{transcurrido:5.2f} s] lectura {numero}: {lectura} C")
        time.sleep(1)

    duracion = time.perf_counter() - inicio
    print(f"\n  Duración real medida con perf_counter(): {duracion:.2f} s")

    # time.perf_counter() vs time.time()
    print("\n  time.time()          -> reloj de CALENDARIO. Puede saltar hacia atrás")
    print("                          si el sistema sincroniza la hora por NTP.")
    print("  time.perf_counter()  -> reloj MONOTONICO de alta resolución. Nunca")
    print("                          retrocede. Es el correcto para MEDIR DURACIONES.")

    # El problema del sleep bloqueante (concepto clave de IoT)
    print("\n  ATENCION — sleep() es BLOQUEANTE:")
    print("    Mientras el programa duerme 5 s, no lee sensores, no atiende")
    print("    la red y no responde alertas. Si la nevera se sobrecalienta en")
    print("    el segundo 1 de ese sleep, la alerta se pierde.")
    print("    Alternativas: hilos (threading), asincronía (asyncio) o un Timer")
    print("    en el microcontrolador. Para el laboratorio, un sleep corto es")
    print("    aceptable; en producción industrial, no.")


# ---------------------------------------------------------------------------
# 3. datetime: formateo legible
# ---------------------------------------------------------------------------
def demo_datetime_formato() -> None:
    titulo("3. datetime — formateo legible de marcas temporales")

    momento = datetime.now(timezone.utc)

    # fromtimestamp con tz=UTC vs sin tz (hora local del equipo)
    desde_unix_utc = datetime.fromtimestamp(time.time(), tz=timezone.utc)
    desde_unix_local = datetime.fromtimestamp(time.time())

    print(f"  datetime.fromtimestamp(ts, tz=timezone.utc) -> {desde_unix_utc}")
    print(f"  datetime.fromtimestamp(ts)                  -> {desde_unix_local}")
    print("\n  El primero dice EXPLÍCITAMENTE que es UTC (+00:00).")
    print("  El segundo usa la zona del computador: ambiguo si el equipo viaja")
    print("  o si la planta está en otra región. En IoT: guardar siempre UTC.")

    print("\n  Códigos de formato strftime() más usados:")

    codigos = {
        "%Y": momento.strftime("%Y"),
        "%m": momento.strftime("%m"),
        "%d": momento.strftime("%d"),
        "%H": momento.strftime("%H"),
        "%M": momento.strftime("%M"),
        "%S": momento.strftime("%S"),
    }
    for codigo, valor in codigos.items():
        print(f"    {codigo} -> {valor}")

    print("\n  Formatos completos y su uso en el proyecto:")
    formatos = (
        ("%Y-%m-%d %H:%M:%S", "2026-10-16 14:30:05", "Base de datos y CSV (ordenable alfabéticamente)"),
        ("%d/%m/%Y", "16/10/2026", "Reportes para el usuario"),
        ("%Y-%m-%dT%H:%M:%SZ", "2026-10-16T14:30:05Z", "Estándar ISO 8601 (interoperabilidad entre servicios)"),
        ("%H:%M", "14:30", "Tableros en vivo"),
    )
    for plantilla, ejemplo, uso in formatos:
        print(f"    {plantilla:26} -> {momento.strftime(plantilla):<24} {uso}")

    print("\n  datetime.isoformat() (forma recomendada para APIs):")
    print(f"    {momento.isoformat()}")

    # Conversión en el sentido contrario: texto -> datetime
    texto = "2026-10-16 14:30:05"
    parseado = datetime.strptime(texto, "%Y-%m-%d %H:%M:%S")
    print(f"\n  strptime('{texto}') -> {parseado!r}")
    print("  Útil para reconstruir fechas al leer un CSV histórico.")

    print("\n  Servidor en UTC, operarios en Bogotá (UTC-5):")
    if ZONA_BOGOTA:
        en_bogota = momento.astimezone(ZONA_BOGOTA)
        print(f"    UTC                        -> {momento.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print(f"    America/Bogota             -> {en_bogota.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print("    Mismo instante, distinta presentación: la zona es solo formato.")


# ---------------------------------------------------------------------------
# 4. Aritmética de fechas: la ventana de la cadena de frío
# ---------------------------------------------------------------------------
def demo_aritmetica() -> None:
    titulo("4. Aritmética con datetime — ventanas de tiempo y vencimientos")

    ahora = datetime.now(timezone.utc)

    print("  Un medicamento debe mantenerse entre 2 C y 8 C durante 30 días.")
    vencimiento = ahora + timedelta(days=30)
    print(f"    Inicio del monitoreo : {ahora.strftime('%Y-%m-%d %H:%M')}")
    print(f"    Fin de la cadena     : {vencimiento.strftime('%Y-%m-%d %H:%M')}")
    print(f"    Diferencia           : {(vencimiento - ahora).days} días")

    # Intervalos: cuántas lecturas caben en un periodo
    intervalos = {
        "Cada 30 segundos (crítico)": 30,
        "Cada 5 minutos (recomendado)": 300,
        "Cada 1 hora (bajo consumo)": 3600,
    }
    ventana = timedelta(days=1)
    print(f"\n  Lecturas almacenadas en un día de monitoreo ({ventana}):")
    for descripcion, segundos in intervalos.items():
        cantidad = int(ventana.total_seconds() // segundos)
        print(f"    {descripcion:30} {cantidad:>7,} lecturas")

    print("\n  Cambio de horario y desfase entre equipos:")
    fin = ahora + timedelta(hours=5)
    print(f"    Inicio: {ahora:%H:%M} UTC   Fin: {fin:%H:%M} UTC")
    print(f"    Duración real: {fin - ahora}  (las restas de datetime son EXACTAS)")
    print("    timedelta evita el error típico de sumar horas a mano.")

    # Detección de datos "viejos" (staleness): patrón de producción
    ultima_lectura = ahora - timedelta(minutes=7)
    silencio = ahora - ultima_lectura
    limite = timedelta(minutes=5)
    print(f"\n  Detección de sensor caído:")
    print(f"    Última lectura recibida hace : {silencio}")
    print(f"    Umbral de tolerancia         : {limite}")
    estado = "SENSOR CAIDO / SIN REPORTE" if silencio > limite else "OK"
    print(f"    Estado                       : {estado}")
    print("    Este cálculo es el corazón de una alerta de disponibilidad en el")
    print("    microservicio de monitoreo: si no llegan datos, también hay falla.")


# ---------------------------------------------------------------------------
# 5. Integración: registro con tiempo legible + Unix + duración
# ---------------------------------------------------------------------------
def demo_registro_completo() -> None:
    titulo("5. Patrón de registro completo para el laboratorio")

    print("  Cada lectura queda con TRES referencias temporales:")
    print("    timestamp_unix  -> eficiente para almacenar y comparar")
    print("    fecha_legible   -> para que un humano audite el CSV")
    print("    uptime_segundos -> tiempo desde que arrancó el nodo (útil si el")
    print("                       microcontrolador aún no sincronizó su reloj)")
    print()

    arranque = time.perf_counter()
    registros = []
    for _ in range(3):
        instante = datetime.now(timezone.utc)
        tiempo_lectura = time.perf_counter() - arranque
        registros.append(
            {
                "fecha_legible": instante.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp_unix": int(instante.timestamp()),
                "uptime_segundos": round(tiempo_lectura, 4),
                "temperatura": round(random.uniform(2.0, 9.0), 2),
            }
        )
        time.sleep(0.5)

    encabezado = f"  {'fecha_legible':<21}{'timestamp_unix':<16}{'uptime_s':<11}temperatura"
    print(encabezado)
    print("  " + "-" * (len(encabezado) - 2))
    for r in registros:
        print(f"  {r['fecha_legible']:<21}{r['timestamp_unix']:<16}"
              f"{r['uptime_segundos']:<11}{r['temperatura']}")

    print("\n  Estas tres columnas son exactamente las que se exportarán al CSV")
    print("  del laboratorio Wokwi de la actividad 3.4.")


# ---------------------------------------------------------------------------
# Programa principal
# ---------------------------------------------------------------------------
def main() -> None:
    print("NUCLEO 2 - CONTROL DEL TIEMPO Y FECHAS")
    print("time (sleep, unix, perf_counter) | datetime (formato, aritmética, zonas)")

    demo_unix_timestamp()
    demo_sleep()
    demo_datetime_formato()
    demo_aritmetica()
    demo_registro_completo()

    titulo("CIERRE DEL NUCLEO 2")
    print("  time.time()             -> marca de tiempo Unix (segundos desde 1970)")
    print("  time.sleep()            -> retraso entre lecturas (BLOQUEANTE)")
    print("  time.perf_counter()     -> medir duraciones (reloj monotónico)")
    print("  datetime.fromtimestamp()-> hacer legible una marca Unix")
    print("  strftime / strptime     -> objeto -> texto  /  texto -> objeto")
    print("  timedelta               -> ventanas, vencimientos y detección de")
    print("                             sensores sin reporte")


if __name__ == "__main__":
    main()
