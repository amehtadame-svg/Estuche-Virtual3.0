"""
VERIFICADOR DEL ENTREGABLE — Guía "Python para Internet de las Cosas (IoT)"
Programa: Análisis y Desarrollo de Software — 228118
Resultado de aprendizaje: 593108-04

Ejecuta uno tras otro todos los artefactos de la guía y reporta si cada
actividad funciona. Es la comprobación que el instructor (o el equipo) puede
hacer antes de cargar las evidencias en el LMS.

Uso:
    python verificar_entregable.py            # ejecuta todo
    python verificar_entregable.py --rapido   # omite el núcleo 2 (usa sleeps)

Requiere: pip install requests pyserial
"""

import os
import subprocess
import sys
import time

AQUI = os.path.dirname(os.path.abspath(__file__))


# Actividades: (nombre, ruta relativa al script, minutos máximos, salta en --rapido)
ACTIVIDADES = [
    ("3.1 — Reflexión inicial (documento)",
     "actividad-3.1/reflexion-inicial.md", None, False),
    ("3.2 — Cuestionario diagnóstico (documento)",
     "actividad-3.2/cuestionario-diagnostico.md", None, False),
    ("3.3 Núcleo 1 — Datos: open(), json, csv",
     "actividad-3.3/01_datos_json_csv.py", 2, False),
    ("3.3 Núcleo 2 — Tiempo: time y datetime",
     "actividad-3.3/02_tiempo_fechas.py", 2, True),
    ("3.3 Núcleo 3 — Protocolos: requests y PySerial",
     "actividad-3.3/03_protocolos_serial.py", 2, False),
    ("3.4 — Simulador IoT: script de Wokwi en CPython",
     "actividad-3.4/prueba_local_main.py", 2, False),
]

# Artefactos que deben existir al terminar
ARCHIVOS_ESPERADOS = [
    "actividad-3.3/salidas/historico_sensores.csv",
    "actividad-3.3/salidas/telemetria_enviada.csv",
    "actividad-3.4/wokwi/main.py",
    "actividad-3.4/wokwi/diagram.json",
    "actividad-3.4/wokwi/historico_nodos.csv",
    "actividad-3.4/evidencias/salida_monitor_serie.txt",
]


def color(texto, codigo):
    """Colorea la salida cuando la terminal lo soporta."""
    if os.name == "nt" and not os.environ.get("WT_SESSION"):
        return texto
    return f"\033[{codigo}m{texto}\033[0m"


def ejecutar_python(ruta_relativa, timeout):
    """Ejecuta un script y devuelve (código de salida, segundos, salida)."""
    ruta = os.path.join(AQUI, ruta_relativa)
    carpeta = os.path.dirname(ruta)
    inicio = time.perf_counter()
    try:
        proceso = subprocess.run(
            [sys.executable, os.path.basename(ruta)],
            cwd=carpeta, capture_output=True, text=True, timeout=timeout * 60,
        )
        duracion = time.perf_counter() - inicio
        return proceso.returncode, duracion, (proceso.stdout + proceso.stderr)
    except subprocess.TimeoutExpired:
        return 124, timeout * 60, "TIEMPO AGOTADO"


def revisar_documento(ruta_relativa):
    """Un documento se considera válido si existe y tiene contenido real."""
    ruta = os.path.join(AQUI, ruta_relativa)
    if not os.path.exists(ruta):
        return False, "no existe"
    with open(ruta, "r", encoding="utf-8") as archivo:
        contenido = archivo.read()
    return len(contenido) > 1000, f"{len(contenido.splitlines())} líneas"


def main():
    rapido = "--rapido" in sys.argv

    print("=" * 74)
    print("VERIFICACIÓN DEL ENTREGABLE — Python para IoT (ADSO 228118)")
    print("=" * 74)
    print(f"Python: {sys.version.split()[0]}")
    print(f"Carpeta: {AQUI}\n")

    resultados = []
    for nombre, ruta, timeout, omitir_en_rapido in ACTIVIDADES:
        if rapido and omitir_en_rapido:
            print(color(f"[OMITIDO ] {nombre}", "33"))
            resultados.append((nombre, None))
            continue

        es_documento = ruta.endswith(".md")
        if es_documento:
            ok, detalle = revisar_documento(ruta)
            duracion = 0.0
        else:
            codigo, duracion, salida = ejecutar_python(ruta, timeout)
            ok = codigo == 0
            detalle = f"código {codigo}"
            if not ok:
                # Primeras líneas del error para diagnosticar rápido
                cola = [l for l in salida.splitlines() if l.strip()][-6:]
                detalle += " -> " + " | ".join(cola[-3:])

        marca = color("[   OK   ]", "32") if ok else color("[ FALLA  ]", "31")
        print(f"{marca} {nombre:52} {duracion:5.2f} s  ({detalle})")
        resultados.append((nombre, ok))

    # --- Revisión de los artefactos producidos ---
    print("\n" + "-" * 74)
    print("ARTEFACTOS GENERADOS")
    print("-" * 74)
    faltantes = 0
    for ruta_relativa in ARCHIVOS_ESPERADOS:
        ruta = os.path.join(AQUI, ruta_relativa)
        existe = os.path.exists(ruta)
        if not existe:
            faltantes += 1
        tamano = f"{os.path.getsize(ruta):,} bytes" if existe else "FALTA"
        marca = color("OK   ", "32") if existe else color("FALTA", "31")
        print(f"  {marca} {ruta_relativa:52} {tamano}")

    # --- Resumen ---
    evaluadas = [r for _, r in resultados if r is not None]
    fallidas = [n for n, r in resultados if r is False]

    print("\n" + "=" * 74)
    print(f"RESULTADO: {len(evaluadas) - len(fallidas)}/{len(evaluadas)} "
          f"actividades verificadas correctamente")
    if fallidas:
        print("Fallaron:")
        for nombre in fallidas:
            print(f"  - {nombre}")
    if faltantes:
        print(f"Artefactos faltantes: {faltantes}")

    if not fallidas and not faltantes:
        print(color("ENTREGABLE COMPLETO: listo para cargar en el LMS.", "32"))
        return 0
    print(color("Revisar los puntos anteriores antes de entregar.", "31"))
    return 1


if __name__ == "__main__":
    sys.exit(main())
