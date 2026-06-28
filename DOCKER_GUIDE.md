# 🐳 Docker Guide — AmazonIA Marketplace (Turborepo Monorepo)

Guía de referencia para construir imágenes Docker y orquestar los servicios con `docker compose`.
Los Dockerfiles implementados siguen el patrón **Turborepo Prune + Multi-Stage Build** para
minimizar el tamaño de las imágenes finales y aprovechar el caché de capas.

---

## Índice

1. [Arquitectura de imágenes](#1-arquitectura-de-imágenes)
2. [Dockerfiles implementados](#2-dockerfiles-implementados)
3. [Construir imágenes individualmente](#3-construir-imágenes-individualmente)
4. [docker-compose.yml — Estructura completa](#4-docker-composeyml--estructura-completa)
5. [Variables de entorno requeridas](#5-variables-de-entorno-requeridas)
6. [Guía para agregar un nuevo microservicio](#6-guía-para-agregar-un-nuevo-microservicio)
7. [Buenas prácticas aplicadas](#7-buenas-prácticas-aplicadas)

---

## 1. Arquitectura de imágenes

```
amazonia-marketplace/                    (RAÍZ del monorepo)
│
├── .dockerignore                        ← Excluye node_modules, dist, .env, etc.
│
├── apps/
│   ├── iot-simulator/
│   │   └── Dockerfile                  ✅ IMPLEMENTADO
│   │
│   ├── ingestor-service/
│   │   └── Dockerfile                  ✅ IMPLEMENTADO
│   │
│   ├── telemetry-worker/
│   │   └── Dockerfile                  ✅ IMPLEMENTADO
│   │
│   ├── inference-service/
│   │   └── Dockerfile                  ✅ IMPLEMENTADO (Python/FastAPI)
│   │
│   ├── api/
│   │   └── Dockerfile                  ✅ IMPLEMENTADO
│   │
│   └── web/
│       └── Dockerfile                  ⬜ POR IMPLEMENTAR (Next.js — ver sección 6)
│
└── docker-compose.yml                   ⬜ USAR EL TEMPLATE DE ESTA GUÍA
```

### Estrategia de build: Turborepo Prune + Multi-Stage

Todos los servicios NestJS usan una estrategia de 4 stages:

```
base     → instala pnpm y dumb-init en Alpine
pruner   → ejecuta `turbo prune <app>` para aislar solo las deps necesarias
builder  → instala deps y ejecuta `turbo build --filter=<app>`
runtime  → imagen final mínima (<app>/dist + node_modules de producción)
```

Esto garantiza:
- **Imágenes < 200 MB** (sin fuentes TypeScript, solo el JS compilado)
- **Caché óptimo**: las capas de dependencias solo se regeneran si cambia el lockfile
- **Seguridad**: usuario no-root `nestjs` (uid 1001), sin shell innecesario

---

## 2. Dockerfiles implementados

### `apps/iot-simulator/Dockerfile`

- **Base**: `node:22-alpine`
- **Stages**: `deps` → `runtime` (sin compilación TypeScript)
- **Ejecuta**: `node sensor.js`
- **Sin puerto expuesto** (cliente MQTT saliente puro)
- **Señales**: manejo correcto via `dumb-init`

### `apps/ingestor-service/Dockerfile`

- **Base**: `node:22-alpine`
- **Stages**: `base` → `pruner` → `builder` → `runtime`
- **Escucha**: MQTT en HiveMQ Cloud (conexión saliente TLS:8883)
- **Puerto expuesto**: `3002` (solo health check interno)
- **Deps de workspace**: `event-types`, `messaging`

### `apps/telemetry-worker/Dockerfile`

- **Base**: `node:22-alpine`
- **Stages**: `base` → `pruner` → `builder` → `runtime`
- **Puerto expuesto**: `3003` (solo health check interno)
- **Deps de workspace**: `database`, `event-types`, `messaging`

---

## 3. Construir imágenes individualmente

> ⚠️ **Importante**: todos los `docker build` deben ejecutarse desde la **raíz del repositorio**
> para que el build context incluya los `packages/` compartidos.

```bash
# IoT Simulator
docker build \
  -f apps/iot-simulator/Dockerfile \
  -t amazonia/iot-simulator:latest \
  ./apps/iot-simulator           # contexto: solo la carpeta del sim (standalone)

# Ingestor Service (desde la raíz del monorepo)
docker build \
  -f apps/ingestor-service/Dockerfile \
  -t amazonia/ingestor-service:latest \
  .

# Telemetry Worker (desde la raíz del monorepo)
docker build \
  -f apps/telemetry-worker/Dockerfile \
  -t amazonia/telemetry-worker:latest \
  .
```

---

## 4. docker-compose.yml — Estructura completa

Copia este archivo a la raíz del repositorio como `docker-compose.yml`.
Completa las secciones marcadas con `# ⬜ POR IMPLEMENTAR`.

```yaml
# docker-compose.yml — AmazonIA Marketplace
# Versión: 1.0 | Monorepo: Turborepo + pnpm
#
# Uso:
#   docker compose up -d                  # Levanta todos los servicios
#   docker compose up iot-simulator -d    # Solo el simulador
#   docker compose logs -f telemetry-worker
#   docker compose down
#
# Variables de entorno:
#   Crea un archivo `.env` en la raíz con los valores reales.
#   NUNCA committees secrets. Usa el archivo .env.compose.example como guía.

services:

  # ══════════════════════════════════════════════════════════════════════════
  # IoT Simulator — Sensor MQTT (cliente saliente a HiveMQ Cloud)
  # ══════════════════════════════════════════════════════════════════════════
  iot-simulator:
    build:
      context: ./apps/iot-simulator          # Standalone: no necesita monorepo raíz
      dockerfile: Dockerfile
    image: amazonia/iot-simulator:latest
    container_name: amazonia-iot-simulator
    restart: unless-stopped
    environment:
      - HIVEMQ_HOST=${HIVEMQ_HOST}
      - HIVEMQ_PORT=${HIVEMQ_PORT:-8883}
      - HIVEMQ_USERNAME=${HIVEMQ_USERNAME}
      - HIVEMQ_PASSWORD=${HIVEMQ_PASSWORD}
    networks:
      - amazonia-internal
    # Sin puertos expuestos: el sensor solo PUBLICA hacia HiveMQ Cloud
    # No tiene endpoints HTTP
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ══════════════════════════════════════════════════════════════════════════
  # Ingestor Service — Gateway MQTT → Redis Streams
  # ══════════════════════════════════════════════════════════════════════════
  ingestor-service:
    build:
      context: .                             # Raíz del monorepo (requiere packages/)
      dockerfile: apps/ingestor-service/Dockerfile
    image: amazonia/ingestor-service:latest
    container_name: amazonia-ingestor-service
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3002
      # HiveMQ Cloud (MQTT broker)
      - HIVEMQ_HOST=${HIVEMQ_HOST}
      - HIVEMQ_PORT=${HIVEMQ_PORT:-8883}
      - HIVEMQ_USERNAME=${INGESTOR_HIVEMQ_USERNAME}
      - HIVEMQ_PASSWORD=${INGESTOR_HIVEMQ_PASSWORD}
      # API Key de autenticación
      - INGESTOR_API_KEY=${INGESTOR_API_KEY}
      # Upstash Redis Streams
      - REDIS_URL=${REDIS_URL}
      - REDIS_TOKEN=${REDIS_TOKEN}
    ports:
      - "3002:3002"                          # Solo para health checks desde el host
    networks:
      - amazonia-internal
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  # ══════════════════════════════════════════════════════════════════════════
  # Telemetry Worker — Redis Streams → MongoDB Atlas
  # ══════════════════════════════════════════════════════════════════════════
  telemetry-worker:
    build:
      context: .                             # Raíz del monorepo (requiere packages/)
      dockerfile: apps/telemetry-worker/Dockerfile
    image: amazonia/telemetry-worker:latest
    container_name: amazonia-telemetry-worker
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3003
      # Upstash Redis Streams
      - REDIS_URL=${REDIS_URL}
      - REDIS_TOKEN=${REDIS_TOKEN}
      # MongoDB Atlas
      - MONGODB_URI=${MONGODB_URI}
      # Configuración del worker
      - POLL_INTERVAL_MS=${POLL_INTERVAL_MS:-30000}
    ports:
      - "3003:3003"                          # Solo para health checks desde el host
    networks:
      - amazonia-internal
    depends_on:
      ingestor-service:
        condition: service_healthy           # Espera que el ingestor esté listo
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  # ══════════════════════════════════════════════════════════════════════════
  # ⬜ API Principal — NestJS REST API (PostgreSQL + MongoDB + Redis)
  # POR IMPLEMENTAR: crear apps/api/Dockerfile siguiendo la sección 6
  # ══════════════════════════════════════════════════════════════════════════
  # api:
  #   build:
  #     context: .
  #     dockerfile: apps/api/Dockerfile
  #   image: amazonia/api:latest
  #   container_name: amazonia-api
  #   restart: unless-stopped
  #   environment:
  #     - NODE_ENV=production
  #     - PORT=3001
  #     - DATABASE_URL=${DATABASE_URL}
  #     - MONGODB_URI=${MONGODB_URI}
  #     - REDIS_URL=${REDIS_URL}
  #     - REDIS_TOKEN=${REDIS_TOKEN}
  #     - JWT_SECRET=${JWT_SECRET}
  #     - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
  #     - SUPABASE_URL=${SUPABASE_URL}
  #     - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
  #     - FRONTEND_URL=${FRONTEND_URL}
  #     - NOTARY_API_KEY=${NOTARY_API_KEY}
  #     - NOTARY_SERVICE_URL=${NOTARY_SERVICE_URL}
  #     - WEBHOOK_BASE_URL=${WEBHOOK_BASE_URL}
  #     - CB_FAILURE_THRESHOLD=${CB_FAILURE_THRESHOLD:-3}
  #     - CB_COOLDOWN_MS=${CB_COOLDOWN_MS:-30000}
  #     - MONGODB_TIMEOUT_MS=${MONGODB_TIMEOUT_MS:-5000}
  #   ports:
  #     - "3001:3001"
  #   networks:
  #     - amazonia-internal
  #   depends_on:
  #     ingestor-service:
  #       condition: service_healthy
  #   healthcheck:
  #     test: ["CMD", "wget", "-qO-", "http://localhost:3001/api/v1/health"]
  #     interval: 30s
  #     timeout: 10s
  #     retries: 3
  #     start_period: 30s

  # ══════════════════════════════════════════════════════════════════════════
  # ⬜ Web Frontend — Next.js
  # POR IMPLEMENTAR: crear apps/web/Dockerfile siguiendo la sección 6
  # ══════════════════════════════════════════════════════════════════════════
  # web:
  #   build:
  #     context: .
  #     dockerfile: apps/web/Dockerfile
  #   image: amazonia/web:latest
  #   container_name: amazonia-web
  #   restart: unless-stopped
  #   environment:
  #     - NODE_ENV=production
  #     - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://api:3001/api/v1}
  #   ports:
  #     - "3000:3000"
  #   networks:
  #     - amazonia-internal
  #   depends_on:
  #     api:
  #       condition: service_healthy

  # ══════════════════════════════════════════════════════════════════════════
  # ⬜ Blockchain Notary — NestJS
  # POR IMPLEMENTAR: crear apps/blockchain-notary/Dockerfile
  # ══════════════════════════════════════════════════════════════════════════
  # blockchain-notary:
  #   build:
  #     context: .
  #     dockerfile: apps/blockchain-notary/Dockerfile
  #   image: amazonia/blockchain-notary:latest
  #   ...

# ══════════════════════════════════════════════════════════════════════════════
# Redes
# ══════════════════════════════════════════════════════════════════════════════
networks:
  amazonia-internal:
    driver: bridge
    name: amazonia-network

# ══════════════════════════════════════════════════════════════════════════════
# Volúmenes (ninguno necesario: todos los datos van a servicios en la nube)
# ══════════════════════════════════════════════════════════════════════════════
# volumes: {}
```

---

## 5. Variables de entorno requeridas

Crea un archivo `.env` en la raíz del repositorio (ya está en `.gitignore`):

```bash
# ── HiveMQ Cloud (MQTT Broker) ────────────────────────────────────────────────
HIVEMQ_HOST=your-cluster-id.s1.eu.hivemq.cloud
HIVEMQ_PORT=8883

# Credenciales del simulador IoT
HIVEMQ_USERNAME=your-simulator-user
HIVEMQ_PASSWORD=your-simulator-password

# Credenciales del ingestor (usuario distinto al simulador, si aplica)
INGESTOR_HIVEMQ_USERNAME=your-ingestor-user
INGESTOR_HIVEMQ_PASSWORD=your-ingestor-password

# ── Autenticación ─────────────────────────────────────────────────────────────
INGESTOR_API_KEY=change-this-in-production

# ── Upstash Redis (Streams) ───────────────────────────────────────────────────
REDIS_URL=https://your-upstash-url.upstash.io
REDIS_TOKEN=your-upstash-token

# ── MongoDB Atlas ─────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/amazonia?retryWrites=true

# ── Worker ────────────────────────────────────────────────────────────────────
POLL_INTERVAL_MS=30000

# ── API Principal (descomenta cuando implementes apps/api/Dockerfile) ─────────
# DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/amazonia?sslmode=require
# JWT_SECRET=
# JWT_REFRESH_SECRET=
# SUPABASE_URL=
# SUPABASE_SERVICE_KEY=
# FRONTEND_URL=http://localhost:3000
# NOTARY_API_KEY=
# NOTARY_SERVICE_URL=http://blockchain-notary:3004/api/v1
# WEBHOOK_BASE_URL=http://api:3001/api

# ── Web Frontend ──────────────────────────────────────────────────────────────
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 6. Guía para agregar un nuevo microservicio

Sigue estos pasos para crear el Dockerfile de `apps/api`, `apps/web` u otro servicio:

### 6.1 — Servicios NestJS (copia el patrón de ingestor-service)

```dockerfile
# apps/<tu-app>/Dockerfile

# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache dumb-init \
    && npm install -g pnpm@10 --quiet

# ─── Stage 2: Pruner ──────────────────────────────────────────────────────────
FROM base AS pruner
WORKDIR /monorepo
COPY turbo.json pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/<tu-app> ./apps/<tu-app>
COPY packages ./packages
RUN npx turbo@latest prune <nombre-en-package-json> --docker

# ─── Stage 3: Builder ─────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /monorepo
COPY --from=pruner /monorepo/out/json/ .
COPY --from=pruner /monorepo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /monorepo/out/full/ .
RUN pnpm turbo build --filter=<nombre-en-package-json>

# ─── Stage 4: Runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
RUN apk add --no-cache dumb-init \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs

WORKDIR /app
COPY --from=builder --chown=nestjs:nodejs /monorepo/apps/<tu-app>/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /monorepo/apps/<tu-app>/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /monorepo/packages ./packages

USER nestjs
ENV NODE_ENV=production PORT=<tu-puerto>
EXPOSE <tu-puerto>

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
```

Luego **agrega el servicio al `docker-compose.yml`** descomentando la sección correspondiente.

### 6.2 — Next.js (`apps/web`)

Next.js tiene soporte nativo de [output: 'standalone'](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
Actívalo en `apps/web/next.config.ts`:

```typescript
const nextConfig = {
  output: 'standalone',   // ← agrega esta línea
};
```

Luego crea `apps/web/Dockerfile`:

```dockerfile
FROM node:22-alpine AS base
RUN npm install -g pnpm@10 --quiet

FROM base AS pruner
WORKDIR /monorepo
COPY turbo.json pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN npx turbo@latest prune web --docker

FROM base AS builder
WORKDIR /monorepo
COPY --from=pruner /monorepo/out/json/ .
COPY --from=pruner /monorepo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /monorepo/out/full/ .
# Pasar variables públicas en build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm turbo build --filter=web

FROM node:22-alpine AS runtime
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /monorepo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /monorepo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /monorepo/apps/web/public ./apps/web/public

USER nextjs
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
```

---

## 7. Buenas prácticas aplicadas

| Práctica | Detalle |
|---|---|
| **Multi-stage build** | Las imágenes finales solo contienen el artefacto compilado y sus `node_modules` de producción |
| **Turborepo Prune** | `turbo prune` extrae el subgrafo mínimo del monorepo; solo se copian los `packages/*` que realmente usa el servicio |
| **Usuario no-root** | Todos los containers corren como `nestjs:nodejs` (uid/gid 1001) |
| **dumb-init** | Actúa como PID 1 y reenvía señales POSIX correctamente a Node.js (graceful shutdown) |
| **Node 22 Alpine** | Imagen base mínima (~5 MB); sin herramientas de desarrollo |
| **`--frozen-lockfile`** | Garantiza reproducibilidad: fallar si el lockfile no coincide con `package.json` |
| **Healthchecks** | `wget -qO-` (disponible en Alpine sin instalar `curl`) sobre `/health` |
| **Logging rotado** | `max-size: 10m / max-file: 3` para evitar que los logs llenen el disco |
| **Redes declaradas** | Todos los servicios comparten `amazonia-internal`; no se exponen puertos innecesarios al host |
| **`.dockerignore` en raíz** | Excluye `node_modules/`, `dist/`, `.env*`, `*.tsbuildinfo`; reduce drásticamente el build context |
| **OCI Labels** | `LABEL org.opencontainers.image.*` en cada imagen para trazabilidad |
