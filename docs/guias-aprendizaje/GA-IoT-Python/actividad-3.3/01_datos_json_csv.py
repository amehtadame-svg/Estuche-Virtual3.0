"""
NÚCLEO 1 — Manejo y estructuración de datos
Guía de aprendizaje: Python para Internet de las Cosas (IoT)
Programa: Análisis y Desarrollo de Software — 228118

Objetivo:
    Persistir lecturas de sensores con los recursos NATIVOS de Python:
      * open()  -> lectura/escritura de archivos
      * json    -> serialización y parseo (dumps / loads / dump / load)
      * csv     -> estructuración columnar
    y comprobar con datos reales por qué el histórico va en CSV y la
    trama de red va en JSON (conclusión de la actividad 3.1).

Ejecución:
    python 01_datos_json_csv.py
"""

import csv
import json
import os
import random
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# 0. Configuración del ejercicio
# ---------------------------------------------------------------------------
CARPETA_SALIDA = "salidas"
ARCHIVO_CSV = os.path.join(CARPETA_SALIDA, "historico_sensores.csv")
ARCHIVO_JSON = os.path.join(CARPETA_SALIDA, "historico_sensores.json")
ARCHIVO_CSV_DICC = os.path.join(CARPETA_SALIDA, "historico_sensores_dictwriter.csv")
TOTAL_LECTURAS = 1000  # se usan para comparar el peso de cada formato

os.makedirs(CARPETA_SALIDA, exist_ok=True)


def titulo(texto: str) -> None:
    """Imprime un encabezado legible para separar cada bloque del demo."""
    print("\n" + "=" * 72)
    print(texto)
    print("=" * 72)


# ---------------------------------------------------------------------------
# 1. open(): los modos de apertura y por qué 'a' salva el histórico
# ---------------------------------------------------------------------------
def demo_open() -> None:
    titulo("1. open() — modos de apertura")

    explicacion = {
        "r": "lectura (falla si el archivo no existe)",
        "w": "escritura: BORRA el contenido anterior",
        "a": "append: agrega al final SIN borrar lo anterior  <-- el correcto en IoT",
        "x": "creación exclusiva (falla si ya existe)",
        "b": "modo binario (se combina: 'rb', 'wb')",
    }
    for modo, descripcion in explicacion.items():
        print(f"  modo '{modo}' -> {descripcion}")

    ruta = os.path.join(CARPETA_SALIDA, "demo_open.txt")

    # Patrón correcto: el gestor de contexto 'with' cierra el archivo solo,
    # incluso si ocurre una excepción en el medio.
    with open(ruta, "w", encoding="utf-8") as f:
        f.write("primera lectura\n")

    with open(ruta, "a", encoding="utf-8") as f:
        f.write("segunda lectura\n")

    with open(ruta, "a", encoding="utf-8") as f:
        f.write("tercera lectura\n")

    with open(ruta, "r", encoding="utf-8") as f:
        contenido = f.read()

    print(f"\n  Contenido final de {ruta} (3 escrituras en 'a'):")
    for linea in contenido.splitlines():
        print(f"    | {linea}")

    print("\n  ATENCION: si la segunda escritura hubiera usado 'w', el archivo")
    print("  tendria una sola linea. En un sistema de cadena de frio, eso")
    print("  equivale a perder todo el historico de monitoreo.")

    # Lectura eficiente línea por línea: no carga todo en memoria.
    # Es la forma obligatoria cuando el archivo tiene millones de registros.
    with open(ruta, "r", encoding="utf-8") as f:
        total = sum(1 for _ in f)
    print(f"\n  Conteo por iteracion de lineas (sin cargar todo en RAM): {total}")


# ---------------------------------------------------------------------------
# 2. json: dumps / loads (memoria) y dump / load (archivo)
# ---------------------------------------------------------------------------
def demo_json() -> None:
    titulo("2. Módulo json — dumps, loads, dump, load")

    lectura = {
        "sensor_id": "T-01",
        "tipo": "temperatura",
        "valor": 4.53,
        "unidad": "C",
        "timestamp": 1776537600,
    }

    # --- dumps: objeto Python -> cadena de texto JSON ---
    json_compacto = json.dumps(lectura, separators=(",", ":"))
    json_legible = json.dumps(lectura, indent=2, ensure_ascii=False)
    print("  json.dumps(lectura, separators=(',',':'))  <- trama de RED (mínimos bytes):")
    print(f"    {json_compacto}")
    print(f"    bytes: {len(json_compacto)}")

    print("\n  json.dumps(lectura, indent=2)  <- para depurar en pantalla:")
    for linea in json_legible.splitlines():
        print(f"    {linea}")

    # --- loads: cadena JSON -> objeto Python ---
    recibido = json.loads(json_compacto)
    print(f"\n  json.loads(...) reconstruye el diccionario -> tipo: {type(recibido).__name__}")
    print(f"    valor = {recibido['valor']}  (tipo {type(recibido['valor']).__name__})")

    # --- Paquete con varios sensores: el valor real de la jerarquía JSON ---
    # CSV NO puede expresar esto sin inventar columnas extra.
    paquete = {
        "gateway": "NODO-IOT-01",
        "firmware": "1.0.0",
        "ip": "192.168.1.42",
        "lote": "L-2026-10",
        "lecturas": [
            {"tipo": "temperatura", "valor": 4.53, "unidad": "C"},
            {"tipo": "humedad", "valor": 62.1, "unidad": "%"},
            {"tipo": "luz", "valor": 320, "unidad": "lux"},
        ],
    }
    print("\n  Estructura anidada (JSON sí puede, CSV no):")
    print("  " + json.dumps(paquete, indent=2, ensure_ascii=False).replace("\n", "\n  "))

    # --- dump (a archivo) y load (desde archivo) ---
    with open(ARCHIVO_JSON, "w", encoding="utf-8") as f:
        json.dump(lectura, f, ensure_ascii=False)

    with open(ARCHIVO_JSON, "r", encoding="utf-8") as f:
        recuperado = json.load(f)

    print(f"\n  json.dump()/json.load() sobre {ARCHIVO_JSON}:")
    print(f"    valor recuperado del disco = {recuperado['valor']}")

    # --- Manejo del error típico: JSON mal formado ---
    trama_corrupta = '{"sensor_id": "T-01", "valor": 4.53,}'  # coma final inválida
    try:
        json.loads(trama_corrupta)
    except json.JSONDecodeError as error:
        print(f"\n  Trama corrupta capturada sin romper el programa:")
        print(f"    json.JSONDecodeError -> {error}")
        print("    En IoT esto es CRITICO: una trama a medio llegar no debe")
        print("    tumbar el servicio; se descarta y se registra la incidencia.")


# ---------------------------------------------------------------------------
# 3. csv: escritura y lectura columnar
# ---------------------------------------------------------------------------
def generar_lecturas(cantidad: int) -> list[dict]:
    """Genera lecturas sintéticas con la misma forma que usará el laboratorio."""
    lecturas = []
    ahora = time_now()
    for i in range(cantidad):
        lecturas.append(
            {
                "timestamp": ahora + i,
                "sensor_id": "NODO-IOT-01",
                "temperatura": round(random.uniform(2.0, 9.0), 2),
                "humedad": round(random.uniform(45.0, 75.0), 2),
                "luz": random.randint(50, 900),
            }
        )
    return lecturas


def time_now() -> int:
    """Marca de tiempo Unix actual (segundos, UTC)."""
    return int(datetime.now(timezone.utc).timestamp())


def demo_csv(lecturas: list[dict]) -> None:
    titulo("3. Módulo csv — estructuración columnar")

    encabezados = list(lecturas[0].keys())

    # --- csv.writer: escritura por filas (lista de valores) ---
    with open(ARCHIVO_CSV, "w", newline="", encoding="utf-8") as f:
        escritor = csv.writer(f)
        escritor.writerow(encabezados)                     # fila de títulos
        for lectura in lecturas:
            escritor.writerow(lectura.values())            # una fila por lectura

    print(f"  csv.writer -> {ARCHIVO_CSV}")
    print(f"    Encabezado: {','.join(encabezados)}")

    # --- csv.DictWriter: más legible y menos propenso a desordenar columnas ---
    with open(ARCHIVO_CSV_DICC, "w", newline="", encoding="utf-8") as f:
        escritor = csv.DictWriter(f, fieldnames=encabezados)
        escritor.writeheader()
        escritor.writerows(lecturas)

    print(f"  csv.DictWriter -> {ARCHIVO_CSV_DICC}")
    print("    Ventaja: se escribe por NOMBRE de campo, no por posición.")

    # --- csv.DictReader: lectura que devuelve diccionarios ---
    # Todo llega como texto: convertir es responsabilidad del programador.
    with open(ARCHIVO_CSV, "r", encoding="utf-8") as f:
        lector = csv.DictReader(f)
        primera = next(lector)

    print("\n  csv.DictReader devuelve cada fila como diccionario de TEXTO:")
    for clave, valor in primera.items():
        print(f"    {clave:12} = {valor!r:12} (tipo {type(valor).__name__})")

    # Conversión explícita de tipos al leer
    print("\n  Conversión explícita necesaria al leer:")
    print(f"    float(primera['temperatura']) + 1 = {float(primera['temperatura']) + 1}")

    # --- El error clásico: sumar texto sin convertir ---
    with open(ARCHIVO_CSV, "r", encoding="utf-8") as f:
        lector = csv.DictReader(f)
        try:
            sumatoria = sum(fila["temperatura"] for fila in lector)
            print(f"    sum() sin convertir -> {sumatoria} (¡concatenación, no suma!)")
        except TypeError as error:
            print(f"    TypeError capturado: {error}")

    # --- Lectura completa convirtiendo tipos (patrón de producción) ---
    registros = []
    with open(ARCHIVO_CSV, "r", encoding="utf-8") as f:
        for fila in csv.DictReader(f):
            registros.append(
                {
                    "timestamp": int(fila["timestamp"]),
                    "temperatura": float(fila["temperatura"]),
                    "humedad": float(fila["humedad"]),
                    "luz": int(fila["luz"]),
                }
            )

    temps = [r["temperatura"] for r in registros]
    print(f"\n  {len(registros)} registros leídos y convertidos.")
    print(f"    temperatura -> min {min(temps):.2f} | max {max(temps):.2f} | "
          f"promedio {sum(temps) / len(temps):.2f}")
    fuera_de_rango = [t for t in temps if t > 8.0]
    print(f"    ALERTA cadena de frío (> 8 C): {len(fuera_de_rango)} lecturas de {len(temps)}")


# ---------------------------------------------------------------------------
# 4. Comparación experimental JSON vs CSV (respalda la conclusión de 3.1)
# ---------------------------------------------------------------------------
def comparar_formatos(lecturas: list[dict]) -> None:
    titulo("4. JSON vs CSV sobre los MISMOS datos (respaldo cuantitativo)")

    # JSON: un objeto por línea (JSON Lines). La forma habitual en series de IoT.
    jsonl = "\n".join(json.dumps(l, separators=(",", ":")) for l in lecturas)

    lineas_csv = [",".join(lecturas[0].keys())]
    for l in lecturas:
        lineas_csv.append(",".join(str(v) for v in l.values()))
    csv_texto = "\n".join(lineas_csv)

    peso_json = len(jsonl.encode("utf-8"))
    peso_csv = len(csv_texto.encode("utf-8"))
    ahorro = (1 - peso_csv / peso_json) * 100

    print(f"  {len(lecturas)} lecturas idénticas en los dos formatos:")
    print(f"    JSON Lines ... {peso_json:>8,} bytes")
    print(f"    CSV .......... {peso_csv:>8,} bytes")
    print(f"    CSV pesa {ahorro:.1f}% menos que JSON")

    # Proyección realista de almacenamiento
    lecturas_dia = 1 * 60 * 24  # una lectura por minuto durante 24 horas
    print(f"\n  Proyección con 1 lectura/minuto durante un año (~{lecturas_dia * 365:,} registros):")
    print(f"    JSON Lines ... {(peso_json / len(lecturas)) * lecturas_dia * 365 / 1024 / 1024:.1f} MB")
    print(f"    CSV .......... {(peso_csv / len(lecturas)) * lecturas_dia * 365 / 1024 / 1024:.1f} MB")

    print("\n  CONCLUSION (coincide con la actividad 3.1):")
    print("    * Histórico en disco  -> CSV  (menor peso, uniforme, abre en Excel)")
    print("    * Tramas de red       -> JSON (autodescriptivo, soporta anidamiento)")
    print("    * Y sobre todo: la decisión de MAYOR impacto no es el formato,")
    print("      es la FRECUENCIA DE MUESTREO. Miles de lecturas por minuto no")
    print("      son necesarias para monitorear la temperatura de una nevera.")

    print("\n  Compresión gzip (segunda palanca de ahorro):")
    import gzip

    comprimido_csv = len(gzip.compress(csv_texto.encode("utf-8")))
    comprimido_json = len(gzip.compress(jsonl.encode("utf-8")))
    print(f"    CSV  -> .csv.gz  {peso_csv:>8,} -> {comprimido_csv:>7,} bytes "
          f"({comprimido_csv / peso_csv * 100:.1f}%)")
    print(f"    JSON -> .json.gz {peso_json:>8,} -> {comprimido_json:>7,} bytes "
          f"({comprimido_json / peso_json * 100:.1f}%)")


# ---------------------------------------------------------------------------
# Programa principal
# ---------------------------------------------------------------------------
def main() -> None:
    print("NUCLEO 1 - MANEJO Y ESTRUCTURACION DE DATOS")
    print("Persistencia nativa: open() | json | csv")

    demo_open()
    demo_json()

    lecturas = generar_lecturas(TOTAL_LECTURAS)
    demo_csv(lecturas)
    comparar_formatos(lecturas)

    titulo("ARCHIVOS GENERADOS")
    for ruta in (ARCHIVO_CSV, ARCHIVO_CSV_DICC, ARCHIVO_JSON):
        peso = os.path.getsize(ruta)
        print(f"  {peso:>8,} bytes  {ruta}")

    titulo("CIERRE DEL NUCLEO 1")
    print("  open()  -> por dónde se escribe (y en qué modo)")
    print("  json    -> cómo se describe un dato complejo y anidado")
    print("  csv     -> cómo se guarda una serie uniforme de forma económica")


if __name__ == "__main__":
    main()
