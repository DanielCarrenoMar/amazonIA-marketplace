# =============================================================================
# Dockerfile — ingestor-service (NestJS / pnpm monorepo)
#
# Build desde la RAÍZ del repositorio:
#   docker build -f apps/ingestor-service/Dockerfile -t amazonia/ingestor-service:latest .
#
# Estrategia multi-stage con Turborepo pruning:
#   Stage 1 (base)    : imagen base con pnpm
#   Stage 2 (pruner)  : `turbo prune` genera un subárbol mínimo del monorepo
#   Stage 3 (builder) : instala deps y compila TypeScript → dist/
#   Stage 4 (runtime) : imagen final mínima con solo el artefacto compilado
# =============================================================================

# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

RUN apk add --no-cache dumb-init \
    && npm install -g pnpm@10 --quiet \
    && pnpm config set store-dir /root/.local/share/pnpm/store

# ─── Stage 2: Pruner ──────────────────────────────────────────────────────────
# turbo prune crea una copia mínima del monorepo con solo las dependencias
# necesarias para `ingestor-service` (incluyendo packages/* que usa).
FROM base AS pruner

WORKDIR /monorepo

# Copiar archivos de configuración del workspace
COPY turbo.json pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/ingestor-service ./apps/ingestor-service
COPY packages ./packages

RUN npx turbo@latest prune ingestor-service --docker

# ─── Stage 3: Builder ─────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /monorepo

# 3a. Instalar dependencias usando el lockfile podado
COPY --from=pruner /monorepo/out/json/ .
COPY --from=pruner /monorepo/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# 3b. Copiar el código fuente podado y compilar
COPY --from=pruner /monorepo/out/full/ .

RUN pnpm turbo build --filter=ingestor-service

# 3c. Aislar el microservicio y sus dependencias de producción (sin symlinks)
RUN pnpm deploy --filter=ingestor-service --prod --legacy /deploy/ingestor-service

# ─── Stage 4: Runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="amazonia-ingestor-service" \
    org.opencontainers.image.description="Gateway MQTT → Redis Streams para telemetría IoT de AmazonIA"

RUN apk add --no-cache dumb-init

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs

WORKDIR /app

# Copiar el servicio aislado por pnpm deploy (contiene package.json y node_modules standalone)
COPY --from=builder --chown=nestjs:nodejs /deploy/ingestor-service ./

# Copiar explícitamente el build compilado (dist/) ya que pnpm deploy ignora carpetas .gitignored
COPY --from=builder --chown=nestjs:nodejs /monorepo/apps/ingestor-service/dist ./dist

USER nestjs

ENV NODE_ENV=production \
    PORT=3002

EXPOSE 3002

# dumb-init asegura que SIGTERM se propague correctamente a Node.js
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
