![Banner Estuche Virtual](./docs/banner-estuche-virtual.svg)

# ESTUCHE VIRTUAL

[![CI](https://github.com/amehtadame-svg/Estuche-Virtual3.0/actions/workflows/ci.yml/badge.svg)](https://github.com/amehtadame-svg/Estuche-Virtual3.0/actions/workflows/ci.yml)
![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Versión](https://img.shields.io/badge/version-1.6-blue)
![Licencia](https://img.shields.io/badge/licencia-academica-green)
![Tech](https://img.shields.io/badge/stack-web-orange)

---

## Descripción

**ESTUCHE VIRTUAL** es una plataforma e-commerce para la comercialización de útiles escolares y artículos de papelería, diseñada para gestionar de manera eficiente productos, pedidos y usuarios dentro de un entorno digital.

El sistema facilita la interacción entre clientes, empleados, repartidores y administradores, permitiendo la automatización de procesos comerciales, el control de inventario en tiempo real y el seguimiento de pedidos. Su propósito es modernizar la gestión tradicional de papelerías mediante una solución accesible, intuitiva y segura.

---

## Objetivo General

Desarrollar una plataforma web integral que optimice la compra y venta de útiles escolares mediante la digitalización de procesos comerciales, permitiendo una gestión eficiente del inventario, el control de pedidos y la administración de usuarios, con el fin de mejorar la experiencia del cliente, reducir errores operativos y fortalecer la organización de la información dentro de un entorno tecnológico confiable, accesible y escalable.

---

## Objetivos Específicos

- Implementar un sistema de gestión de usuarios con autenticación y control de roles (Cliente, Empleado, Repartidor, Administrador y Superadministrador).
- Diseñar e integrar un catálogo dinámico de productos que permita visualizar información detallada y disponibilidad en tiempo real.
- Desarrollar un carrito de compras funcional que facilite el proceso de selección y adquisición de productos.
- Permitir el seguimiento de pedidos, brindando información actualizada sobre el estado de las compras.
- Optimizar la gestión de inventario mediante herramientas de control, actualización y validación de productos.
- Garantizar la seguridad de la información mediante buenas prácticas en el manejo de datos y accesos.
- Mejorar la experiencia del usuario a través de una interfaz clara, intuitiva y adaptable.

---

## Tecnologías

- Frontend: React, TypeScript y Vite.
- Backend: Node.js, Express y TypeScript.
- Acceso a datos y migraciones: Prisma.
- Base de datos: PostgreSQL; configuración de conexión con Supabase.
- Gestión de paquetes: pnpm.
- Control de versiones: Git y GitHub.

## Roles

Roles definidos en el modelo de datos:

- Cliente: `client`.
- Empleado: `employee`.
- Repartidor: `delivery`.
- Administrador: `admin`.
- Superadministrador: `superadmin`.

El middleware verifica la sesión y consulta el rol vigente en la base de datos.
`verifyAdmin` admite admin y superadmin; `verifySuperAdmin` solo superadmin.
Los permisos concretos también dependen de las rutas y servicios.
Esta lista no certifica un panel o recorrido completo para cada rol.

Fuentes: [modelo Prisma](be/prisma/schema.prisma) y
[middleware de autenticación](be/src/middlewares/auth.middleware.ts).

---

## Funcionalidades

- Autenticación de usuarios  
- Catálogo dinámico de productos  
- Carrito de compras  
- Gestión y seguimiento de pedidos  
- Panel administrativo  

---

## Miembros del Equipo

- Cristian David Alvarado Guerrero (Líder, Full Stack)  
- Frack Esteban Salamanca (Backend)  
- Ameth Adame Segura (Full Stack)  
- Paula Mileth Garces (Frontend)  

---

## Estructura del Proyecto

```text
Estuche-Virtual3.0/
|-- be/            # Backend Express + Prisma (TypeScript)
|   |-- src/       # API, servicios y pruebas por módulo
|   |-- prisma/    # Esquema y migraciones
|   `-- tests/     # Pruebas de integración
|-- fe/            # Frontend React + Vite (TypeScript)
|   `-- src/       # Interfaz React y enrutamiento
|-- docs/          # Requisitos, documentación y evidencias
|-- .github/       # CI (build, tests y PostgreSQL de pruebas) y workflows
|-- docker-compose.yml
`-- README.md
```

Consulta el [índice documental](docs/README.md).

### Evidencias y límites de la entrega

- [Matriz de criterios](docs/matriz-evidencias.md) y [plan de cierre](docs/PLAN_CIERRE_CRITERIOS.md): evidencias verificadas y trabajo pendiente para los 14 puntos.
- [Modelos y revisión pendiente](docs/MODELOS_Y_VALIDACION.md) y [API de operaciones principales](docs/API.md).
- [Guía de instalación y despliegue](docs/INSTALACION_Y_DESPLIEGUE.md): Compose es de desarrollo y ejecuta migraciones sobre la base configurada. Verificar destino y respaldo antes de arrancar.
- [Plan de pruebas](docs/PLAN_PRUEBAS.md), [25 casos unitarios aislados](docs/evidencias/pruebas/unitarias-rubrica-2026-11-27.md), [resultados históricos de `6af297a`](docs/evidencias/pruebas/README.md) y [hallazgos locales](docs/REGISTRO_DEFECTOS.md). Las ejecuciones identifican su versión y no equivalen a aceptación del equipo.
- [Scrum: propuestas y evidencia pendiente](docs/scrum/README.md); [guion de 15 minutos](docs/GUION_PRESENTACION.md).

El checkout es una **simulación académica** sin cobro bancario; el pago en tienda es un registro separado. Los diagramas de datos son parciales. Franck, Paula y Cristian aún deben validar sus respectivas áreas; no se ha acreditado un despliegue ni recorrido completo de interfaz.


---

## Inicio rápido

```bash
git clone https://github.com/amehtadame-svg/Estuche-Virtual3.0.git
cd Estuche-Virtual3.0
cp .env-example .env        # rellena SUPABASE_DATABASE_URL y JWT_SECRET de forma privada
# Antes de iniciar: verifica destino de BD, autorización y respaldo.
# docker compose up --build # aplica migraciones sobre la BD configurada
```

Guía técnica de desarrollo, variables, pruebas y precauciones de despliegue (validación pendiente): **[docs/INSTALACION_Y_DESPLIEGUE.md](./docs/INSTALACION_Y_DESPLIEGUE.md)**

- Pasarela académica (PSE, tarjeta y Nequi, sin cobros reales): **[docs/PAGOS_DEMOSTRACION.md](./docs/PAGOS_DEMOSTRACION.md)**
- Informe histórico de pruebas (102 pruebas, otro commit): **[docs/INFORME_PRUEBAS.md](./docs/INFORME_PRUEBAS.md)**
- Auditoría de seguridad y rotación de credenciales: **[docs/SEGURIDAD_ENTORNO.md](./docs/SEGURIDAD_ENTORNO.md)**
- Reglas del equipo (RT/RH): **[docs/restricciones.md](./docs/restricciones.md)**

---

## Pruebas

Con dependencias instaladas, ejecuta desde cada carpeta:

```bash
cd be
pnpm exec prisma generate    # necesita el motor de Prisma disponible
pnpm test                    # suite backend, incluidos los 25 casos unitarios aislados
cd ../fe
pnpm lint
pnpm build
pnpm test                    # Node 22
```

Para integración, usa exclusivamente una base PostgreSQL de pruebas separada y revisa sus variables antes de aplicar migraciones: consulta el [plan de pruebas](docs/PLAN_PRUEBAS.md) y la [guía](docs/INSTALACION_Y_DESPLIEGUE.md). La [evidencia de los 25 casos](docs/evidencias/pruebas/unitarias-rubrica-2026-11-27.md) identifica exactamente los cambios ejecutados; el [plan de cierre](docs/PLAN_CIERRE_CRITERIOS.md) describe los resultados y límites de esta revisión.

---

## Estado

En desarrollo  

---

## Contribuciones

1. Crea una rama desde `dev` (`git checkout -b fix/mi-cambio dev`).
2. Propón una convención de commits clara (`fix(be): descripción…`); la política debe acordarse con el equipo.
3. Ejecuta `pnpm lint` (fe) y `pnpm test` (be) antes de abrir el PR.
4. Abre un pull request: la CI debe quedar **verde** y recibir revisión.

Estas son prácticas propuestas; consultar [contradicciones de política de ramas](docs/requisitos/contradicciones.md). No está verificada la protección de `main`.

---

## Trello informacion

https://trello.com/invite/b/69f1619700802e14bd2536f2/ATTI0ff1d9d9ead7c20f2975dd19ffeb99810E943C7C/estuche-virtual