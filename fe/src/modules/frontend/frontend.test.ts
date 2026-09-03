import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

/**
 * C-07 — La URL del API estaba fijada en el código del frontend
 * (http://localhost:4000) y no existía VITE_API_URL, de modo que la imagen
 * Docker del frontend no podía apuntar a ningún backend que no fuera el de la
 * máquina del navegador.
 *
 * Criteio de la auditoría: "el frontend apunta a otro host cambiando solo la
 * variable". Aquí se verifica que el código lee VITE_API_URL con prioridad y
 * que el .env-example la documenta.
 */

const FE_ROOT = path.resolve(process.cwd(), '..', 'fe');
const apiSource = fs.readFileSync(path.join(FE_ROOT, 'src/api/api.ts'), 'utf8');

test('C-07: api.ts lee VITE_API_URL antes que cualquier fallback', () => {
  const varIndex = apiSource.indexOf('import.meta.env.VITE_API_URL');
  const fallbackIndex = apiSource.indexOf("return 'http://localhost:4000';");

  assert.ok(varIndex >= 0, 'api.ts debe usar import.meta.env.VITE_API_URL');
  assert.ok(fallbackIndex >= 0, 'debe conservar un fallback de desarrollo');
  assert.ok(
    varIndex < fallbackIndex,
    'VITE_API_URL debe evaluarse antes que el fallback a localhost'
  );
});

test('C-07: no hay más URLs de backend fijadas en el código del frontend', () => {
  // Solo debe existir el fallback de desarrollo (return); las menciones en
  // comentarios de documentación son válidas.
  const codeLines = apiSource
    .split('\n')
    .filter((l) => l.includes('localhost:4000'))
    .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'));

  assert.strictEqual(codeLines.length, 1, 'solo debe existir el fallback de desarrollo');
  assert.match(codeLines[0], /return/, 'ese único uso debe ser el return del fallback');
});

test('C-07: fe/.env-example documenta VITE_API_URL', () => {
  const envExample = fs.readFileSync(path.join(FE_ROOT, '.env-example'), 'utf8');
  assert.match(envExample, /^VITE_API_URL=.*$/m, 'debe definir VITE_API_URL');
});
