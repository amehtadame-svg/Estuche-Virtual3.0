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

El sistema facilita la interacción entre clientes, proveedores y administradores, permitiendo la automatización de procesos comerciales, el control de inventario en tiempo real y el seguimiento de pedidos. Su propósito es modernizar la gestión tradicional de papelerías mediante una solución accesible, intuitiva y segura.

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

Proveedor no es un rol de autenticación en el modelo actual.
Su gestión comercial no implica acceso propio al sistema.

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
|-- be/
|   |-- src/       # API, servicios y pruebas por módulo
|   |-- prisma/    # Esquema y migraciones
|   `-- tests/     # Pruebas de integración
|-- fe/
|   `-- src/       # Interfaz React y enrutamiento
|-- docs/          # Requisitos, documentación y evidencias
|-- .github/       # Configuración de GitHub y workflows
|-- docker-compose.yml
`-- README.md
```

Consulta el [índice documental](docs/README.md).

---

## Inicio rápido

```bash
git clone https://github.com/amehtadame-svg/Estuche-Virtual3.0.git
cd Estuche-Virtual3.0
cp .env-example .env        # rellena SUPABASE_DATABASE_URL y JWT_SECRET
docker compose up --build   # backend :4000 · frontend :5173
curl http://localhost:4000/api/health
```

Guía completa (instalación nativa, variables de entorno, pruebas, despliegue a
producción y flujo de Git): **[docs/INSTALACION_Y_DESPLIEGUE.md](./docs/INSTALACION_Y_DESPLIEGUE.md)**

- Pasarela académica (PSE, tarjeta y Nequi, sin cobros reales): **[docs/PAGOS_DEMOSTRACION.md](./docs/PAGOS_DEMOSTRACION.md)**
- Informe de pruebas (102 pruebas, fecha/entorno/commit): **[docs/INFORME_PRUEBAS.md](./docs/INFORME_PRUEBAS.md)**
- Auditoría de seguridad y rotación de credenciales: **[docs/SEGURIDAD_ENTORNO.md](./docs/SEGURIDAD_ENTORNO.md)**
- Reglas del equipo (RT/RH): **[docs/restricciones.md](./docs/restricciones.md)**

---

## Estado

En desarrollo  

---

## Contribuciones

1. Crea una rama desde `dev` (`git checkout -b fix/mi-cambio dev`).
2. Usa la **convención de commits** (`fix(be): descripción…`) — ver guía §10.
3. Ejecuta `pnpm lint` (fe) y `pnpm test` (be) antes de abrir el PR.
4. Abre un pull request: la CI debe quedar **verde** y recibir revisión.

Nunca se hace push directo a `main` ni force-push (RH-002).

---

## Trello informacion

https://trello.com/invite/b/69f1619700802e14bd2536f2/ATTI0ff1d9d9ead7c20f2975dd19ffeb99810E943C7C/estuche-virtual