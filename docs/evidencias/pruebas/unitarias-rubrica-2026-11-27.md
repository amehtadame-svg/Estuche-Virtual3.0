# Ejecución de 25 pruebas unitarias aisladas — 27-11-2026

**Código:** base `177fb714a836a5f5fcbd65bad71919da6e5fd1ca` más el nuevo archivo [`rubrica-unitarias.test.ts`](../../../be/src/lib/rubrica-unitarias.test.ts) incluido en esta entrega. Ejecución local en Linux, Node v22.22.3, con `ts-node`; ejecutor: asistente. No son resultados del commit base sin los cambios, ni una ejecución de CI para esta entrega.

Las 25 pruebas son casos separados sobre reglas puras y esquemas: cinco de envío, cinco de teléfono, cinco de fechas en Bogotá, cinco de devoluciones y cinco de productos. No abren servidor ni consultan bases de datos. Algunos casos cubren límites ya comprobados por otros archivos; no se suman al total como si fueran funcionalidades independientes. No certifican por sí solos los flujos completos de pedidos o autorización.

**Comando ejecutado**, desde `be`, tras instalar dependencias:

```bash
node --test --require ts-node/register src/lib/rubrica-unitarias.test.ts
```

**Resultado:** 25 aprobadas, 0 fallidas, 0 omitidas. El archivo está incluido en el patrón `src/lib/*.test.ts` de `pnpm test`.

Salida capturada:

```text
TAP version 13
# Subtest: envío: subtotal vacío no genera cobro
ok 1 - envío: subtotal vacío no genera cobro
  ---
  duration_ms: 1.030527
  type: 'test'
  ...
# Subtest: envío: subtotal positivo inferior al umbral cobra domicilio
ok 2 - envío: subtotal positivo inferior al umbral cobra domicilio
  ---
  duration_ms: 0.123076
  type: 'test'
  ...
# Subtest: envío: el umbral exacto obtiene domicilio gratis
ok 3 - envío: el umbral exacto obtiene domicilio gratis
  ---
  duration_ms: 0.086663
  type: 'test'
  ...
# Subtest: envío: un subtotal superior al umbral obtiene domicilio gratis
ok 4 - envío: un subtotal superior al umbral obtiene domicilio gratis
  ---
  duration_ms: 0.087152
  type: 'test'
  ...
# Subtest: envío: retiro en tienda no cobra domicilio
ok 5 - envío: retiro en tienda no cobra domicilio
  ---
  duration_ms: 0.084011
  type: 'test'
  ...
# Subtest: teléfono: se acepta número nacional de diez dígitos
ok 6 - teléfono: se acepta número nacional de diez dígitos
  ---
  duration_ms: 0.439776
  type: 'test'
  ...
# Subtest: teléfono: se acepta indicativo y diez dígitos
ok 7 - teléfono: se acepta indicativo y diez dígitos
  ---
  duration_ms: 0.200828
  type: 'test'
  ...
# Subtest: teléfono: se rechazan nueve dígitos
ok 8 - teléfono: se rechazan nueve dígitos
  ---
  duration_ms: 0.348782
  type: 'test'
  ...
# Subtest: teléfono: se rechazan letras
ok 9 - teléfono: se rechazan letras
  ---
  duration_ms: 0.416666
  type: 'test'
  ...
# Subtest: teléfono: se eliminan espacios exteriores
ok 10 - teléfono: se eliminan espacios exteriores
  ---
  duration_ms: 0.431312
  type: 'test'
  ...
# Subtest: fecha: antes de medianoche en Bogotá corresponde al día anterior
ok 11 - fecha: antes de medianoche en Bogotá corresponde al día anterior
  ---
  duration_ms: 0.308646
  type: 'test'
  ...
# Subtest: fecha: medianoche en Bogotá corresponde al día nuevo
ok 12 - fecha: medianoche en Bogotá corresponde al día nuevo
  ---
  duration_ms: 0.109012
  type: 'test'
  ...
# Subtest: fecha: una fecha de calendario se conserva
ok 13 - fecha: una fecha de calendario se conserva
  ---
  duration_ms: 0.065868
  type: 'test'
  ...
# Subtest: fecha: un valor no interpretable devuelve null
ok 14 - fecha: un valor no interpretable devuelve null
  ---
  duration_ms: 0.052589
  type: 'test'
  ...
# Subtest: fecha: un valor ausente devuelve null
ok 15 - fecha: un valor ausente devuelve null
  ---
  duration_ms: 0.05018
  type: 'test'
  ...
# Subtest: devolución: acepta el mínimo de una unidad
ok 16 - devolución: acepta el mínimo de una unidad
  ---
  duration_ms: 1.177348
  type: 'test'
  ...
# Subtest: devolución: rechaza cantidad cero
ok 17 - devolución: rechaza cantidad cero
  ---
  duration_ms: 0.373345
  type: 'test'
  ...
# Subtest: devolución: rechaza cantidad fraccionaria
ok 18 - devolución: rechaza cantidad fraccionaria
  ---
  duration_ms: 0.183507
  type: 'test'
  ...
# Subtest: devolución: acepta motivo de 50 caracteres
ok 19 - devolución: acepta motivo de 50 caracteres
  ---
  duration_ms: 0.091591
  type: 'test'
  ...
# Subtest: devolución: rechaza motivo de 51 caracteres
ok 20 - devolución: rechaza motivo de 51 caracteres
  ---
  duration_ms: 0.162734
  type: 'test'
  ...
# Subtest: producto: acepta datos mínimos válidos
ok 21 - producto: acepta datos mínimos válidos
  ---
  duration_ms: 0.787735
  type: 'test'
  ...
# Subtest: producto: rechaza nombre vacío tras recortar espacios
ok 22 - producto: rechaza nombre vacío tras recortar espacios
  ---
  duration_ms: 0.275798
  type: 'test'
  ...
# Subtest: producto: rechaza precio cero
ok 23 - producto: rechaza precio cero
  ---
  duration_ms: 0.211566
  type: 'test'
  ...
# Subtest: producto: rechaza stock negativo
ok 24 - producto: rechaza stock negativo
  ---
  duration_ms: 0.172573
  type: 'test'
  ...
# Subtest: producto: acepta stock cero
ok 25 - producto: acepta stock cero
  ---
  duration_ms: 0.095971
  type: 'test'
  ...
1..25
# tests 25
# suites 0
# pass 25
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1508.509101
```
