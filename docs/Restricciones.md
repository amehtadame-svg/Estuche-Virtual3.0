# Restricciones del Proyecto — Estuche Virtual

---

## 1. Restricciones Tecnológicas

### RT-001 — Stack Tecnológico Fijo

El stack tecnológico está definido y no puede modificarse sin aprobación explícita del instructor:

| Capa          | Tecnología        |
| ------------- | ----------------- |
| Runtime       | Node.js           |
| Backend       | Express.js        |
| Frontend      | React + Vite      |
| Base de datos | MySQL (Workbench) |

---

### RT-002 — Gestión de Paquetes

* Uso exclusivo de pnpm
* Prohibido el uso de npm y yarn
* Versiones de dependencias exactas (sin ^, ~ o latest)
* El archivo .npmrc debe contener:
  save-exact=true

---

### RT-003 — Idioma del Sistema

* Idioma único soportado: "es" (Español)
* Todo el sistema (frontend y backend) debe estar en español
* No se permite implementación de múltiples idiomas

---

## 2. Restricciones de Herramientas y Entorno

### RH-001 — Linter y Formateador

* Uso obligatorio de ESLint y Prettier
* El proyecto debe pasar pnpm lint sin errores antes de cada commit
* No se permite desactivar reglas strict de JavaScript o TypeScript

---

### RH-002 — Control de Versiones

* Ramas permitidas:

  * main (estable)
  * dev (desarrollo)

* Reglas:

  * No hacer commits directamente en main
  * No usar git push --force
  * Los merges a main solo se permiten cuando el proyecto está estable

---

### RH-003 — Entorno de Desarrollo

* Base de datos MySQL gestionada con Workbench
* Configuración de variables de entorno mediante archivo .env
* El backend debe conectarse correctamente a la base de datos antes de iniciar

---

## 3. Restricciones de Diseño Visual

### RD-001 — Colores

* Uso exclusivo de colores sólidos
* No se permiten degradados

---

### RD-002 — Tipografía

* Solo se permiten fuentes sans-serif

* Ejemplos:

  * Arial
  * Inter
  * system-ui

* Prohibido el uso de fuentes serif y monospace en la interfaz principal

---

### RD-003 — Botones

* Los botones principales deben estar alineados a la derecha
* Los botones secundarios pueden ubicarse a la izquierda o junto al principal

---

### RD-004 — Consistencia Visual

* Mantener el mismo estilo en toda la aplicación
* Espaciados uniformes
* Uso consistente de colores y tamaños

---

## 4. Restricciones de Base de Datos

### RBD-001 — Integridad de Datos

* Cada tabla debe tener una clave primaria (ID)
* No se permiten valores nulos en campos críticos
* Las relaciones entre tablas deben estar correctamente definidas

---

### RBD-002 — Validaciones

* Los datos deben validarse antes de ser guardados
* No se permite:

  * Precios negativos
  * Stock negativo
  * Campos obligatorios vacíos

---

## 5. Restricciones de Seguridad

### RS-001 — Autenticación

* Los usuarios deben iniciar sesión para realizar compras
* Las contraseñas deben almacenarse cifradas

---

### RS-002 — Acceso

* Solo administradores pueden:

  * Crear productos
  * Editar productos
  * Eliminar productos

---

## 6. Restricciones de Negocio

### RN-001 — Compras

* No se permite comprar sin iniciar sesión
* El carrito no puede estar vacío
* Validar stock antes de confirmar compra

---

### RN-002 — Productos

* Todo producto debe tener:

  * Nombre
  * Precio
  * Stock
* El precio debe ser mayor a 0

---

### RN-003 — Envíos

* Dirección obligatoria para pedidos
* Validar datos antes de procesar envío

---

Este documento define las restricciones obligatorias para el desarrollo del proyecto Estuche Virtual. Su cumplimiento garantiza consistencia, calidad y mantenibilidad del sistema.
