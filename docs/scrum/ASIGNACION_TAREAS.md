# Asignación de tareas y división del trabajo

**Fecha:** 27-11-2026. **Base:** `d3d68ad`. Este documento consolida la evidencia del **criterio 13** (feedback de equipo, trabajo dividido y asignación de tareas) a partir del **registro real de contribuciones** en el repositorio (PRs fusionados/cerrados de GitHub), el rol declarado en el README y las asignaciones visibles en títulos de ramas/PRs.

**Nivel de evidencia:** las contribuciones son **verificables** (autor y fecha del PR); la correspondencia autor → integrante se basa en los roles del README y los nombres en títulos de PR, y debe **confirmarse con el equipo**. No se atribuyen tareas sin respaldo; el feedback real de reuniones sigue **pendiente** (ver [RETROSPECTIVA.md](RETROSPECTIVA.md)).

## Roles declarados (README)

| Integrante | Rol declarado | Cuenta observada en PRs |
|---|---|---|
| Cristian David Alvarado Guerrero | Líder, Full Stack | `amehtadame-svg` |
| Frack Esteban Salamanca | Backend | `FrackDep`, `franckDep20` |
| Ameth Adame Segura | Full Stack | `mofiil732-svg` |
| Paula Mileth Garces | Frontend | `pgarces328-sudo` |

## Asignación de tareas (evidencia real de PRs)

| Área / tarea | Integrante (cuenta) | Evidencia (PRs, fechas) |
|---|---|---|
| Base de datos y configuración | Cristian (`amehtadame-svg`) | #17 «cambio base datos» (2026-08-12), #8 «db» (2026-06-25) |
| Inicio de proyecto y dependencias | Cristian | #6 «dependencias» (2026-06-24), #9, #11, #12, #14 «Paula garces» (interfase), #79 «Add PQR and app updates» (2026-11-18) |
| Frontend: páginas y experiencia de cliente | Paula (`pgarces328-sudo`) | #7, #11, #12, #14 «Paula garces» (2026-06-24–26), #44 «corregir hallazgos C-08…C-10» (2026-08-21), #80 «Develop» (2026-11-25), #96 «Arreglos paula» (2026-11-27) |
| Backend: persistencia y arreglos de data | Franck (`FrackDep`) | #16 «Tailwind» (2026-08-12), #46 «persistencia real de datos en la BD» (cerrado), #45, #10, #15 «Docker prueba 1» (2026-08-04) |
| Backend: fallos prioritarios, contrato API y soporte | Franck (`franckDep20`) | #95 «fix: fallos prioritarios de pedidos/cupones + contract API y soporte» (2026-11-27) |
| Full stack: paleta UX y colores (contraste WCAG) | Ameth (`mofiil732-svg`) | #81 «UX y colores: paleta unificada con contraste WCAG, modo claro/oscuro» (2026-11-25) |
| Full stack: pasarela académica de pagos (PSE, tarjeta, Nequi) | Ameth | #85 (2026-11-26) |
| Full stack: corrección de carrito, cupones, devoluciones y PQR | Ameth | #86, #87, #88, #93 (2026-11-26) |
| Full stack: arranque validado, health, sanitización de credenciales | Ameth | #84 «fix(env,ci): sanitización de credenciales, arranque validado, health» (2026-11-25) |
| Full stack: unificación de estilos (admin, empleado, repartidor, superadmin) | Ameth | #98, #99, #100 (2026-11-27) |
| Full stack: criterios de entrega y pruebas unitarias | Ameth | #101 (2026-11-27) |
| Documentación: comunicación API y servicios | Ameth | #102 (abierto, 2026-11-27) |

## Distribución observada (último mes de actividad)

- **Franck:** backend y contrato de API (pedidos, cupones, soporte).
- **Paula:** frontend, arreglos de UI y hallazgos de auditoría.
- **Ameth:** full stack: pagos, carrito, devoluciones, PQR, arranque/CI y unificación de estilos.
- **Cristian:** liderazgo, base de datos y configuración general.

## Feedback de equipo

La retrospectiva y el feedback de integrantes **seguimiento pendiente**: no hay actas ni reuniones reales registradas en el repositorio. Los tableros de tareas se gestionan en **GitHub Issues** (etiquetas de estado, módulo y prioridad), con los defectos registrados en [REGISTRO_DEFECTOS.md](../REGISTRO_DEFECTOS.md) vinculados a issues reales. **Lo que falta para cerrar el criterio:** una reunión real de retrospectiva con fecha, participantes, acuerdos y responsables aceptados, registrada en [RETROSPECTIVA.md](RETROSPECTIVA.md).
