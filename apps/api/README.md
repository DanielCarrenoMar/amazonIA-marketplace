# 🚀 AmazonIA Backend — Core API

Este es el corazón de **AmazonIA Marketplace**, encargado de gestionar toda la lógica de negocio, usuarios, productos y el ciclo de vida de las órdenes.

## 🏗️ Stack Tecnológico

- **Framework:** NestJS v11 (Node.js).
- **ORM:** Prisma v7.
- **Base de Datos:** PostgreSQL con extensión **PostGIS**.
- **Autenticación:** Passport.js + JWT + bcrypt.
- **Validación:** DTOs compartidos (paquete `dtos`) con `class-validator`.

## 📍 Características Especiales: PostGIS

El backend utiliza capacidades geoespaciales para permitir:
1. **Tribus:** Ubicación exacta de comunidades locales en el mapa.
2. **Productos:** Búsqueda de productos por proximidad geográfica.
3. **Logística:** Cálculo de distancias entre compradores y vendedores.

**Importante:** En el esquema de Prisma, las coordenadas se manejan como `Unsupported("geography(Point, 4326)")`.

---

## 🛠️ Desarrollo Local

### 1. Variables de Entorno
Copiá el `.env.example` y configurá tu base de datos:
```bash
cp .env.example .env
```

### 2. Base de Datos (Workflow PostGIS)
Debido al uso de tipos nativos de PostGIS que Prisma no soporta para migraciones automáticas, seguimos este flujo:
1. Asegurate de que tu PostgreSQL tenga PostGIS instalado.
2. Generá el cliente: `pnpm prisma generate`.
3. Para cambios en el esquema, usá `pnpm prisma db push` (con precaución) o ejecutá SQL directamente.

### 3. Ejecución
```bash
# Desde la raíz del monorepo
pnpm dev --filter backend

# O en esta carpeta
pnpm run dev
```

---

## 📂 Estructura de Módulos

- `src/users`: Gestión de cuentas, perfiles de compradores y vendedores.
- `src/products`: Catálogo, categorías y sistema de ratings.
- `src/orders`: Procesamiento de compras y comunicación con el `blockchain-notary`.
- `src/tribes`: Gestión de comunidades y sus ubicaciones.
- `src/auth`: Estrategias de login y protección de rutas.

---

## 🤝 Integración con Blockchain
El backend no habla directamente con la blockchain. Cuando una orden se confirma, el módulo de órdenes realiza una petición interna al microservicio **`blockchain-notary`** para que este realice el registro inmutable.
