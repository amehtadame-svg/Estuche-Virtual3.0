# Plan de pruebas — Estuche Virtual

**Base técnica:** `6af297a` (26-11-2026). Plan propuesto; revisión y aprobación por el equipo pendientes. La existencia de una prueba no certifica toda una historia de usuario.

## Objetivo y alcance

Comprobar autenticación y roles, catálogo, carrito, checkout académico, validación de importes y cupones, pedidos, inventario, empaque, entregas, soporte y devoluciones. Incluir estados vacíos/error y restricciones por propiedad. Pagos de tienda son registros manuales; los pagos online de este alcance son simulados. No probar transacciones contra datos financieros reales.

**Fuera de alcance hasta decisión:** pasarela bancaria real, notificaciones y reseñas reales, correo de activación y otros requisitos no implementados identificados en [auditoría](AUDITORIA_REQUISITOS_FUNCIONALES.md). Las pruebas no equivalen a aceptación de seguridad integral.

## Niveles, ambientes y evidencias

| Nivel | Ambiente | Referencia | Condición |
|---|---|---|---|
| Unitarias / HTTP con dobles | Node local, sin escrituras en base real | [Backend](../be/src/modules/), [tests frontend](../fe/src/modules/frontend/) | Adjuntar log, commit, ejecutor, fecha, comandos, fallos y omitidos. |
| Integración | PostgreSQL local aislado, exclusivo, con nombre que termine en `_test` | [Tests de integración](../be/tests/) | Verificar ambos URL antes de migrar, datos sintéticos; nunca Supabase ni BD habitual. |
| UI y aceptación por rol | Ambiente de demostración aislado y accesible | [Rutas](../fe/src/App.tsx), [operación](OPERACION_EMPLEADOS.md) | Paula y equipo verifican recorridos, errores, permisos y accesibilidad; evidencia pendiente. |
| Regresión | Igual que el nivel afectado | [Defectos](REGISTRO_DEFECTOS.md) | Asociar caso antes/después con commit y resultado verificable. |
| CI | Ejecución de la rama/commit concreto | [Workflow](../.github/workflows/ci.yml) | Adjuntar enlace real del run; no afirmar que está verde sin verificar el run correspondiente. |

## Casos mínimos de aceptación

1. Cliente y empleado solo acceden a sus funciones; delivery no puede ver compras ajenas ni el carrito.
2. Agregar productos y validar stock; doble clic y errores no duplican ni borran datos indebidamente.
3. Cupón y simulación con importes del servidor; reintento idempotente y resultado pendiente/aprobado/rechazado.
4. Pedido pagado → toma por empleado → confirmar cada producto → empacar; rechazar empaque incompleto.
5. Domicilio empacado → toma única por repartidor → confirmar solo entrega propia.
6. Soporte interno: empleado ve lo propio; admin/superadmin responden; no prometer correos.
7. Salida de inventario exige cantidad y motivo; no permite stock negativo. Ingreso suma de manera atómica.
8. Devolución sobre pedido entregado; no superar cantidad comprada ni prometer un reembolso automático.
9. Flujo de error y reintento de PQR; comprobar privacidad y autorización.

Los casos de aceptación UI son un plan, **no se afirma que se ejecutaron manualmente**. Adaptar a las decisiones de producto y a datos de demostración.

## Criterios propuestos de cierre

- Responsable confirma criterios de aceptación y alcance; versiones y datos de prueba identificados.
- Suite automatizada relevante y regresiones de defectos corregidos ejecutadas sin fallos; omitidos y advertencias explicados.
- Sin defectos críticos o altos abiertos salvo excepción explícitamente aceptada; sin secretos o datos reales en evidencias.
- Revisión de roles, pruebas manuales y ambiente de despliegue documentados por las personas correspondientes.

## Resultados reales disponibles

[Registro de ejecución 26-11-2026](evidencias/pruebas/README.md): backend, frontend y PostgreSQL aislado del commit `6af297a`. Son resultados de ese commit y ese ambiente, no CI de un commit posterior ni aceptación del equipo. [Informe anterior](INFORME_PRUEBAS.md) es histórico y corresponde a otro commit.
