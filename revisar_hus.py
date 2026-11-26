#!/usr/bin/env python3
"""Auditoria documental local de todas las HUs. No ejecuta endpoints ni pruebas.
Uso: python3 revisar_hus.py [--aplicar]
Solo --aplicar elimina /v1 en filas de endpoints cuyo metodo y patron de ruta
coinciden exactamente con una declaracion literal del backend local.
No modifica estados, criterios de negocio ni rutas frontend.
"""
from pathlib import Path
import argparse
import re
import subprocess
from urllib.parse import quote

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--aplicar', action='store_true', help='Aplicar solamente correcciones verificadas de prefijo /api/v1 a /api')
args = parser.parse_args()
root = Path.cwd()
app = root / 'be/src/app.ts'
hudir = root / 'docs/requisitos/HUs'
if not app.is_file() or not hudir.is_dir():
    raise SystemExit('Ejecuta el script desde la raiz del repositorio.')
try:
    commit = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], text=True).strip()
    branch = subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip()
except subprocess.CalledProcessError:
    raise SystemExit('No se pudo identificar el repositorio Git.')
if args.aplicar and (branch in ('main', 'develop', 'dev') or not branch):
    raise SystemExit('Usa una rama de trabajo, no main/develop/dev ni detached HEAD.')

# Lectura estatica: se ignoran comentarios y no se resuelven routers dinamicos.
def sin_comentarios(texto):
    texto = re.sub(r'/\*.*?\*/', '', texto, flags=re.S)
    return re.sub(r'^\s*//.*$', '', texto, flags=re.M)

apptext = sin_comentarios(app.read_text(encoding='utf-8'))
imports = dict(re.findall(r"import\s+(\w+)\s+from\s+['\"]([^'\"]+)['\"]", apptext))
montajes = re.findall(r"app\.use\(\s*['\"](/api[^'\"]*)['\"]\s*,([^;]+?)\)\s*;", apptext, re.S)
rutas = {}
for prefijo, argumentos in montajes:
    variables = re.findall(r'\b\w+\b', argumentos)
    for variable in variables:
        if variable not in imports:
            continue
        router = (root / 'be/src' / (imports[variable] + '.ts')).resolve()
        if not router.is_file() or not router.is_relative_to(root.resolve()):
            continue
        fuente = router.relative_to(root.resolve()).as_posix()
        texto = sin_comentarios(router.read_text(encoding='utf-8'))
        for metodo, sufijo in re.findall(r"router\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]*)['\"]", texto):
            ruta = prefijo.rstrip('/') + ('' if sufijo == '/' else sufijo)
            rutas[(metodo.upper(), ruta.rstrip('/') or '/')] = fuente

if len(rutas) < 20:
    raise SystemExit('Se detectaron pocas rutas. Revisar el analizador antes de aplicar cambios.')

# Equipara la notacion documental {id} con :id sin inventar alias.
def normalizar(ruta):
    return re.sub(r'\{(\w+)\}', r':\1', ruta).rstrip('/') or '/'

def quitar_version(ruta):
    return ruta.replace('/api/v1/', '/api/', 1)

def enlace_fuente(ruta):
    return f'[{ruta}](../../{quote(ruta, safe="/")})'

fila = re.compile(r'^(\s*\|\s*)(GET|POST|PUT|PATCH|DELETE)(\s*\|\s*`)(/api[^`\n]*)(`\s*\|.*)$', re.M)
archivos = sorted(hudir.glob('HU-*.md'))
if not archivos:
    raise SystemExit('No se encontraron historias HU-*.md.')

resultados = []
planes = []
total_propuestas = 0
cobertura = dict(coinciden=0, prefijo=0, revisar=0, sin_tabla=0)
for archivo in archivos:
    original = archivo.read_text(encoding='utf-8')
    titulo = re.search(r'^# (.+)$', original, re.M)
    estado = re.search(r'^\|\s*\*\*Estado\*\*\s*\|\s*([^|]+)', original, re.M)
    endpoints = []
    cambios = []
    for m in fila.finditer(original):
        metodo, ruta = m[2], m[4]
        propuesta = quitar_version(ruta)
        # No inferir soporte de parametros de consulta por existir la ruta base.
        if '?' not in ruta and (metodo, normalizar(ruta)) in rutas:
            fuente = rutas[(metodo, normalizar(ruta))]
            endpoints.append((metodo, ruta, 'Declaracion coincidente; ejecucion y semantica pendientes', ruta, fuente))
        elif ruta.startswith('/api/v1/') and '?' not in ruta and (metodo, normalizar(propuesta)) in rutas:
            fuente = rutas[(metodo, normalizar(propuesta))]
            endpoints.append((metodo, ruta, 'Prefijo corregible por coincidencia literal', propuesta, fuente))
            cambios.append((ruta, propuesta))
            total_propuestas += 1
        else:
            endpoints.append((metodo, ruta, 'Sin coincidencia literal en routers analizados; revisar contrato', '', ''))
    if not endpoints:
        categoria = 'sin_tabla'
    elif any('Sin coincidencia' in x[2] for x in endpoints):
        categoria = 'revisar'
    elif cambios:
        categoria = 'prefijo'
    else:
        categoria = 'coinciden'
    cobertura[categoria] += 1

    def sustituir(m):
        metodo, ruta = m[2], m[4]
        nueva = quitar_version(ruta)
        if ruta.startswith('/api/v1/') and '?' not in ruta and (metodo, normalizar(nueva)) in rutas:
            return m[1] + metodo + m[3] + nueva + m[5]
        return m[0]

    modificado = fila.sub(sustituir, original)
    if modificado != original:
        # Asegurar que no se altera la declaracion de estado.
        antes = re.findall(r'^\|\s*\*\*Estado\*\*.*$', original, re.M)
        despues = re.findall(r'^\|\s*\*\*Estado\*\*.*$', modificado, re.M)
        if antes != despues:
            raise SystemExit('Cambio de estado inesperado; operacion cancelada.')
        planes.append((archivo, modificado))
    resultados.append((archivo, titulo[1] if titulo else archivo.stem, estado[1].strip() if estado else 'No localizado', endpoints, categoria))

salida = root / 'docs/requisitos/auditoria-rutas-hus.md'
marca = '<!-- Generado por revisar_hus.py; informe de inspeccion estatica. -->'
if salida.exists() and marca not in salida.read_text(encoding='utf-8'):
    raise SystemExit('Ya existe un informe no identificado como generado. No se sobrescribio ni se aplicaron cambios.')

lineas = [marca, '# Auditoria conjunta de rutas de historias de usuario', '',
          f'- Commit local de referencia: `{commit}`; rama: `{branch}`.',
          f'- HUs inspeccionadas: **{len(archivos)}**.',
          f'- Declaraciones literales backend analizadas: **{len(rutas)}**.',
          f'- Modo: **{"correccion limitada de prefijos" if args.aplicar else "solo informe; HUs sin modificar"}**.',
          f'- Sustituciones de prefijo verificadas en esta ejecucion: **{total_propuestas}**, en **{len(planes)}** archivos.', '',
          '## Alcance y limites', '',
          '- Se comparan metodo y patron de ruta de las tablas de endpoints con app.ts y routers locales.',
          '- Es inspeccion estatica, no una revision completa de criterios de aceptacion ni prueba funcional.',
          '- No se modifican estados, criterios de negocio, roles ni referencias frontend.',
          '- Las rutas dinamicas, proxies, consultas y equivalencias semanticas requieren revision adicional.',
          '- Sin coincidencia literal NO significa necesariamente funcionalidad inexistente.',
          '- Coincidencia de ruta NO acredita permisos, validacion, transaccion ni contrato completo.',
          '- Los estados originales se muestran como declaraciones documentales, no como aceptacion.',
          '- Se conservan las correcciones previas de HU-001 y HU-012 y sus notas.', '',
          '## Resumen por HU', '',
          '| HU | Estado escrito original | Resultado de rutas |', '|---|---|---|']
labels = {'coinciden':'Rutas declaradas coinciden; funcionalidad sin certificar',
          'prefijo':'Prefijo corregible/verificado; funcionalidad sin certificar',
          'revisar':'Requiere contraste adicional de contrato',
          'sin_tabla':'Sin endpoint en tabla reconocible; revision funcional pendiente'}
for archivo, titulo, estado, endpoints, categoria in resultados:
    lineas.append(f'| [{archivo.stem.split("-")[0]}-{archivo.stem.split("-")[1]}](HUs/{quote(archivo.name)}) | {estado} | {labels[categoria]} |')
lineas += ['', '## Detalle de las 40 HUs (o inventario local encontrado)', '']
for archivo, titulo, estado, endpoints, categoria in resultados:
    lineas += [f'### {titulo}', '', f'Historia: [documento](HUs/{quote(archivo.name)}).', '']
    if not endpoints:
        lineas += ['Sin tabla de endpoints reconocible; no se concluye ausencia de implementacion.', '']
        continue
    lineas += ['| Metodo | Ruta encontrada antes de aplicar | Resultado | Ruta coincidente/propuesta | Fuente backend |', '|---|---|---|---|---|']
    for metodo, ruta, resultado, propuesta, fuente in endpoints:
        lineas.append(f'| {metodo} | `{ruta}` | {resultado} | {"`" + propuesta + "`" if propuesta else "Por determinar"} | {enlace_fuente(fuente) if fuente else "Sin coincidencia literal"} |')
    lineas.append('')
lineas += ['## Pendientes comunes', '',
           '- HU-001: criterio de redireccion, is_active y restricciones de datos requieren comprobacion aparte.',
           '- Proveedor no es rol del enum actual; contrastar tambien HU-031 sin cambiarla automaticamente.',
           '- No renombrar suppliers/providers, carrito/shopping o pedidos/orders sin revisar campos, permisos y comportamiento.',
           '- No convertir un endpoint ausente en uno inventado de reportes, respaldos, resenas, notificaciones o pagos.',
           '- Ejecutar pruebas y obtener confirmacion por HU antes de declarar terminado.', '']

if args.aplicar:
    for archivo, contenido in planes:
        archivo.write_text(contenido, encoding='utf-8')
salida.write_text('\n'.join(lineas), encoding='utf-8')
print(f'HUs inspeccionadas: {len(archivos)}')
print(f'Rutas backend literales: {len(rutas)}')
print(f'Prefijos corregibles: {total_propuestas} en {len(planes)} archivos')
print(f'Categorias: {cobertura}')
print(f'HUs modificadas: {len(planes) if args.aplicar else 0}')
print('Informe: docs/requisitos/auditoria-rutas-hus.md')
print('No se ejecuto ningun endpoint, migracion ni prueba; no se cambiaron estados.')
