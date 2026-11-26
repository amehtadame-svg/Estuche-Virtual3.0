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

- Implementar un sistema de gestión de usuarios con autenticación y control de roles (Administrador, Proveedor y Cliente).
- Diseñar e integrar un catálogo dinámico de productos que permita visualizar información detallada y disponibilidad en tiempo real.
- Desarrollar un carrito de compras funcional que facilite el proceso de selección y adquisición de productos.
- Permitir el seguimiento de pedidos, brindando información actualizada sobre el estado de las compras.
- Optimizar la gestión de inventario mediante herramientas de control, actualización y validación de productos.
- Garantizar la seguridad de la información mediante buenas prácticas en el manejo de datos y accesos.
- Mejorar la experiencia del usuario a través de una interfaz clara, intuitiva y adaptable.

---

## Tecnologías

- Frontend: React.js
- Backend: Node.js / Express
- Base de datos: Postgress
- Control de versiones: Git & GitHub  

## Roles

- Administrador: gestiona usuarios, productos y pedidos  
- Proveedor: registra y actualiza productos  
- Cliente: explora, compra y consulta pedidos  

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

<p align="center">

<pre>
estuche-virtual/
├── fe/              # Frontend React + Vite (TypeScript)
├── be/              # Backend Express + Prisma (TypeScript)
├── db/              # Scripts de inicialización de la base de datos
├── docs/            # Documentación del proyecto
├── .github/         # CI (build + tests + PostgreSQL de pruebas)
└── README.md        # Información general del proyecto
</pre>

</p>

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