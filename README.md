https://trello.com/invite/b/69f1619700802e14bd2536f2/ATTI0ff1d9d9ead7c20f2975dd19ffeb99810E943C7C/estuche-virtual
# PROYECTO ESTUCHE VIRTUAL

## Sena ADSO

## Plataforma E-commerce de Papelería y Útiles Escolares con Gestión de Inventario y Pedidos
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![License](https://img.shields.io/badge/license-MIT-yellow)
---

##  Tabla de Contenidos

1. [Descripción del Proyecto](https://www.google.com/search?q=%23-descripci%C3%B3n-del-proyecto)
2. [Problemática y Justificación](https://www.google.com/search?q=%23-problem%C3%A1tica-y-justificaci%C3%B3n)
3. [Objetivos](https://www.google.com/search?q=%23-objetivos)
4. [Alcance y Características Principales](https://www.google.com/search?q=%23-alcance-y-caracter%C3%ADsticas-principales)
5. [Requerimientos Funcionales (RF)](https://www.google.com/search?q=%23-requerimientos-funcionales-rf)
6. [Requerimientos No Funcionales (RNF)](https://www.google.com/search?q=%23-requerimientos-no-funcionales-rnf)
7. [Arquitectura del Sistema](https://www.google.com/search?q=%23-arquitectura-del-sistema)
8. [Tecnologías y Herramientas](https://www.google.com/search?q=%23-tecnolog%C3%ADas-y-herramientas)
9. [Modelo de Datos (MER)](https://www.google.com/search?q=%23-modelo-de-datos-mer)
10. [Estructura del Proyecto](https://www.google.com/search?q=%23-estructura-del-proyecto)
11. [Plan de Desarrollo (Sprints)](https://www.google.com/search?q=%23-plan-de-desarrollo-sprints)
12. [Seguridad y Cumplimiento](https://www.google.com/search?q=%23-seguridad-y-cumplimiento)
13. [Guía de Instalación y Configuración](https://www.google.com/search?q=%23-gu%C3%ADa-de-instalaci%C3%B3n-y-configuraci%C3%B3n)
14. [Equipo y Roles](https://www.google.com/search?q=%23-equipo-y-roles)
15. [Entregables Finales](https://www.google.com/search?q=%23-entregables-finales)

---

##  Descripción del Proyecto

**ESTUCHE VIRTUAL** es una plataforma web y móvil pensada para funcionar como una papelería en línea, orientada a la venta de artículos de oficina y útiles escolares de manera práctica y accesible. Permite a los usuarios:

* Explorar y comprar productos escolares y de oficina con verificación en tiempo real del stock disponible.
* Gestionar un catálogo dinámico donde los proveedores pueden registrar, editar y actualizar la oferta de artículos.
* Administrar un carrito de compras interactivo para añadir, modificar o eliminar productos antes de confirmar la compra.
* Realizar seguimiento de pedidos con información clara sobre el proceso de despacho, entrega y estados (pendiente, enviado, entregado).
* Operar con control administrativo y logístico para organizar los envíos hacia la bodega y coordinar la entrega final al usuario.

---

##  Problemática y Justificación

### Problemática

Los procesos tradicionales de compra y administración en las papelerías locales presentan limitaciones operativas:

* Gestión manual ineficiente: Uso de cuadernos físicos para el registro de ventas e inventarios diarios, propensos a pérdidas o errores humanos.
* Falta de visibilidad del stock: Los clientes no pueden verificar la disponibilidad real de los útiles escolares antes de acudir al establecimiento.
* Desorganización en los despachos: Dificultad para coordinar de forma ágil los pedidos entre la administración, la bodega y los clientes.

### Justificación

**ESTUCHE VIRTUAL** moderniza y automatiza la gestión de la papelería mediante:

* Plataforma digital integrada que conecta a proveedores, clientes y administradores en un solo flujo de trabajo ordenado.
* Control de inventario automatizado que previene la venta de artículos descontinuados o sin stock.
* Transparencia en las transacciones con visualización detallada de precios unitarios, subtotales, cantidades y coordenadas GPS de entrega.
* Seguridad y roles definidos (Administrador, Proveedor, Cliente) para proteger la configuración del sistema y los datos personales.

---

##  Objetivos

### Objetivo General

Desarrollar una plataforma web y móvil que permita automatizar la venta y gestión de productos para una papelería en línea, facilitando el control de stock, el registro de usuarios, la administración de pedidos y la experiencia de compra de útiles escolares y de oficina.

### Objetivos Específicos

1. Definir los requisitos y la estructura de clases del sistema (producto, administrador, pedido, cliente, proveedor).
2. Implementar un sistema de autenticación y registro con verificación por correo electrónico y control de accesos basados en roles.
3. Diseñar un módulo de gestión de productos que permita agregar, editar, eliminar y consultar artículos con validación del administrador.
4. Habilitar un carrito de compras dinámico y un sistema de registro de pedidos con selección de método de pago y generación de número único.
5. Integrar un panel de administración para supervisar estados de pedidos, coordinar entregas con bodega y atender solicitudes de soporte.
6. Garantizar altos estándares de rendimiento, disponibilidad (99.5%) y seguridad (cifrado de contraseñas, HTTPS, sesiones controladas).

---

##  Alcance y Características Principales

| Módulo | Características |
| --- | --- |
| **Autenticación** | Registro con validación de correo, inicio de sesión por roles (Administrador, Proveedor, Cliente), control de cuentas activas. |
| **Catálogo e Inventario** | Registro y edición de productos (nombre, categoría, descripción, precio, cantidad, imagen) sujetos a aprobación del administrador. |
| **Carrito y Compras** | Selección de artículos, validación de stock en tiempo real, cálculo de subtotales y total acumulado, prevención de duplicados. |
| **Gestión de Pedidos** | Generación de ID único, selección de pago (en línea o contra entrega), actualización de estados (pendiente, enviado, entregado). |
| **Panel de Administración** | Supervisión de pedidos, control de existencias, reportes de ventas y gestión de datos logísticos (dirección y coordenadas GPS). |
| **Soporte y Historial** | Formulario de contacto/quejas para usuarios, consulta de historial de compras con detalles de facturación. |
| **App Web y Móvil** | Interfaz adaptada para navegadores web modernos y dispositivos móviles con compatibilidad multiplataforma. |

---

##  Requerimientos Funcionales (RF)

| ID | Nombre | Prioridad |
| --- | --- | --- |
| **RF-01** | Registro de Usuarios (Admin, Proveedor, Cliente) con verificación de correo | Alta / Esencial |
| **RF-02** | Autenticación y redirección según rol (Admin, Proveedor, Cliente) | Alta / Esencial |
| **RF-03** | Agregar nuevos productos con aprobación del administrador | Alta / Esencial |
| **RF-04** | Editar información de productos registrados | Alta / Esencial |
| **RF-05** | Eliminar o inactivar productos del inventario y catálogo | Media / Deseado |
| **RF-06** | Consultar, buscar y filtrar productos por categoría, nombre o estado | Alta / Esencial |
| **RF-07** | Agregar productos al carrito de compras con validación de stock | Alta / Esencial |
| **RF-08** | Registrar el pedido, generar número único y elegir método de pago | Alta / Esencial |
| **RF-09** | Gestión de pedidos por el administrador (actualizar estados, filtros) | Alta / Esencial |
| **RF-10** | Soporte y contacto mediante formulario y notificaciones al admin | Media / Deseado |
| **RF-11** | Historial de compras detallado para usuarios autenticados | Alta / Esencial |
| **RF-12** | Ofertas y promociones aplicables en el perfil y catálogo | Media / Deseado |
| **RF-13** | Panel exclusivo de administración con clave de seguridad y reportes | Alta / Esencial |

---

##  Requerimientos No Funcionales (RNF)

### Rendimiento

* Soportar al menos **200 usuarios concurrentes** sin degradación perceptible.
* Tiempo de carga de la página principal y catálogo inferior a **3 segundos** (en el 95% de los casos).
* Procesar hasta **50 transacciones por minuto** sin errores.
* Uso de CPU inferior al **80%** durante picos de carga mediante optimización de consultas.

### Seguridad

* Comunicación cifrada extremo a extremo mediante protocolo **HTTPS**.
* Almacenamiento seguro de contraseñas utilizando algoritmos de hash robustos con sal (**bcrypt** o **SHA-256**).
* Registro de logs para intentos de acceso, compras y modificaciones críticas.
* Cierre automático de sesión tras **15 minutos de inactividad**.

### Fiabilidad y Disponibilidad

* Disponibilidad mínima mensual del **99.5%**.
* Copias de seguridad automáticas diarias de la base de datos.
* Recuperación automática del servicio en menos de **5 minutos** ante fallos imprevistos.

### Mantenibilidad y Portabilidad

* Cobertura de pruebas unitarias superior al **70%**.
* Código modular documentado bajo estándares definidos.
* Compatibilidad con sistemas operativos Windows y Linux, y navegadores principales (Chrome, Firefox, Edge, Safari).

---

##  Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React / Web & Móvil)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Catálogo   │  │   Carrito    │  │  Checkout    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Historial   │  │    Admin     │  │   Soporte    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────────────────────────┐
│                 API GATEWAY / BACKEND (Node.js / PHP)           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Auth Middleware │ Validación de Stock │ Gestión Roles   │   │
│  │  Control de Sesiones │ Enrutamiento de Pedidos           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                          CAPA DE DATOS                          │
│  ┌──────────────────────────┐      ┌──────────────────────────┐ │
│  │      PostgreSQL /        │      │       Almacenamiento     │ │
│  │     MySQL (Transac.)     │      │     de Imágenes (S3)     │ │
│  └──────────────────────────┘      └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

```

---

##  Tecnologías y Herramientas

| Área | Tecnologías |
| --- | --- |
| **Frontend Web / Móvil** | HTML5, CSS3, JavaScript, React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js / PHP, Express, TypeScript |
| **Base de Datos** | PostgreSQL / MySQL |
| **Control de Versiones** | Git, GitHub |
| **Entorno y Pruebas** | Jest (Pruebas unitarias), Postman (Pruebas de API), VS Code |
| **Infraestructura** | Servidores Web compatibles con Linux / Windows, contenedores Docker (opcional) |

---

##  Modelo de Datos (MER) - Clases Principales

### Entidades y Atributos Clave

* **Usuario / Administrador / Proveedor / Cliente**: id, nombre, correo_electronico, telefono, contraseña, tipo_rol, estado.
* **Producto**: id, nombre, categoría, descripción, precio, cantidad_disponible, imagen, dirección, coordenadas_gps.
* **Pedido**: id_pedido, nombre_cliente, dirección, asignación, precio_individual, cantidad, valor_total, descripción, fecha_pedido, estado.
* **Carrito**: id_carrito, usuario_id, items, subtotal, total_acumulado.

---

##  Estructura del Proyecto

```
estuche-virtual/
├── backend/                  # Servidor y Lógica de Negocio
│   ├── src/
│   │   ├── config/           # Conexión a BD y seguridad
│   │   ├── controllers/      # Controladores (Productos, Pedidos, Auth)
│   │   ├── models/           # Entidades y esquemas de datos
│   │   ├── routes/           # Rutas de la API
│   │   ├── middleware/       # Verificación de roles y sesiones
│   │   └── app.ts            # Punto de entrada
│   ├── package.json
│   └── Dockerfile
├── frontend/                 # Aplicación Web / Interfaz
│   ├── public/               # Recursos estáticos e imágenes
│   ├── src/
│   │   ├── components/       # Componentes reutilizables (Catálogo, Carrito)
│   │   ├── pages/            # Vistas principales (Login, Dashboard, Admin)
│   │   ├── context/          # Contexto de autenticación y carrito
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── mobile/                   # Aplicación Móvil (si aplica)
├── docs/                     # Documentación técnica, HU, CU y MER
├── docker-compose.yml        # Orquestación de servicios
└── README.md                 # Este archivo

```

---

##  Plan de Desarrollo (Sprints)

| Fase | Duración | Entregables Principales |
| --- | --- | --- |
| **Fase 1: Análisis y Diseño** | 1 semana | Especificación de requisitos (SRS), diagramas de clases, MER, casos de uso e historias de usuario. |
| **Fase 2: Autenticación y Roles** | 2 semanas | Configuración de base de datos, módulos de registro con verificación por correo y login diferenciado por roles. |
| **Fase 3: Gestión de Productos** | 2 semanas | Módulos para agregar, editar, eliminar y filtrar productos y categorías en el inventario. |
| **Fase 4: Carrito y Pedidos** | 2 semanas | Carrito dinámico, validación de stock, generación de número de pedido y selección de método de pago. |
| **Fase 5: Panel Admin y Logística** | 2 semanas | Módulo de gestión de pedidos para administradores, actualización de estados (pendiente, enviado, entregado) y soporte. |
| **Fase 6: Pruebas y Despliegue** | 1 semana | Pruebas unitarias (cobertura > 70%), optimización de rendimiento, despliegue y entrega final. |

**Total estimado:** 10 semanas

---

##  Seguridad y Cumplimiento

* Control de Acceso Basado en Roles (RBAC) para separar las funciones de clientes, proveedores y administradores.
* Cifrado de credenciales mediante funciones hash seguras con salt.
* Protección de sesiones con expiración automática tras 15 minutos de inactividad.
* Auditoría y trazabilidad de cambios críticos en inventarios y modificaciones de pedidos.

---

##  Guía de Instalación y Configuración

### Requisitos Previos

* Node.js (versión 20.x recomendada)
* PostgreSQL o MySQL instalado y configurado
* Git

### Pasos Rápidos

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/estuche-virtual.git
cd estuche-virtual

```

2. **Configurar el Backend**

```bash
cd backend
npm install
cp .env.example .env
# Configurar las credenciales de la base de datos en el archivo .env
npm run dev

```

3. **Configurar el Frontend**

```bash
cd ../frontend
npm install
npm run dev

```

### Acceso a la Plataforma

* Frontend Web: `http://localhost:5173` (o el puerto configurado en Vite/React)
* Backend API: `http://localhost:3000/api`

---

##  Equipo y Colaboradores

| Nombre | Responsabilidades | Contacto |
| --- | --- | --- |
| **Cristian David Alvarado Guerrero** | Organización general del equipo, distribución de tareas y apoyo técnico. | alvaradocristian1027@gmail.com |
| **Frack Esteban Salamanca Guzman** | Desarrollo transversal de capas, desde la interfaz de usuario hasta la base de datos. | 3237103861 |
| **Ameht Adame Segura** | Creación y mantenimiento de bases de datos, lógica de servidor y nuevas funcionalidades. | 3204125692 |
| **Paula Mileth Garces Dorado** | Gestión de la interfaz visual, mejora de experiencia de usuario y corrección de errores web. | 3223518241 |

---

##  Entregables Finales

1. Código fuente completo en repositorio GitHub (Backend y Frontend).
2. Documentación técnica de requisitos (SRS), Historias de Usuario (HU), Casos de Uso (CU) y Modelo Entidad Relación (MER).
3. Manual de usuario y de administrador.
4. Reporte de pruebas unitarias y de rendimiento.

---

##  Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

**ESTUCHE VIRTUAL** - Compra tus útiles escolares y de oficina de manera rápida, organizada y confiable.
