# 🌎 AmazonIA Marketplace — Monorepo

Bienvenidos al ecosistema de **AmazonIA Marketplace**, una plataforma de comercio electrónico descentralizada diseñada para empoderar a comunidades locales y tribus mediante tecnología Web3 y servicios geoespaciales avanzados.

Este proyecto es un **monorepo** gestionado con **Turborepo** y **pnpm**, lo que garantiza un desarrollo modular, tipado estricto compartido y una orquestación de tareas ultra rápida.

---

## 🏗️ Arquitectura del Proyecto

El ecosistema se divide en las siguientes aplicaciones y paquetes dentro de `/apps`:

| Aplicación | Descripción | Stack Tecnológico |
|------------|-------------|-------------------|
| **`backend`** | API principal y orquestador de negocio. | NestJS 11, Prisma 7, PostgreSQL + PostGIS |
| **`blockchain-notary`** | Microservicio para registro inmutable en blockchain. | NestJS 10, ethers.js v6, Arbitrum |
| **`frontend`** | Interfaz de usuario moderna y optimizada. | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| **`dtos`** | Paquete compartido de tipos y validaciones. | TypeScript, class-validator |
| **`frontend-legacy`** | Versión anterior para compatibilidad/migración. | React 18, Vite, Radix UI |

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
- **Node.js** (v20+)
- **pnpm** (v10+)
- **PostgreSQL** con la extensión **PostGIS** instalada.

### 2. Instalación
Desde la raíz del proyecto, instalá todas las dependencias:
```bash
pnpm install
```

### 3. Configuración del Entorno
Cada aplicación en `/apps` tiene su propio archivo `.env`. Copiá los archivos de ejemplo y configurá tus credenciales:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/blockchain-notary/.env.example apps/blockchain-notary/.env
```

### 4. Ejecución en Desarrollo
Podés levantar todo el ecosistema (Frontend + Backend principal) con un solo comando:
```bash
pnpm dev
```
O levantar aplicaciones específicas:
```bash
pnpm dev --filter frontend
pnpm dev --filter blockchain-notary
```

---

## 🛠️ Herramientas y Convenciones

- **Orquestación**: [Turborepo](https://turbo.build/) se encarga de que los builds sean incrementales y las tareas se ejecuten en paralelo.
- **Tipado Compartido**: El paquete `dtos` es el "Single Source of Truth". Cualquier cambio en un DTO se refleja instantáneamente en el frontend y los backends.
- **Base de Datos**: Usamos Prisma como ORM, pero aprovechamos las capacidades geoespaciales de PostGIS para búsquedas por proximidad de productos y tribus.

---

## 📖 Documentación Detallada
Para más detalles sobre cada componente, consultá los READMEs específicos en sus carpetas o el documento de arquitectura global:
- [Guía de Arquitectura General](./PROJECT_ARCHITECTURE.md)
- [Documentación del Backend](./apps/backend/README.md)
- [Documentación del Notario Blockchain](./apps/blockchain-notary/README.md)
