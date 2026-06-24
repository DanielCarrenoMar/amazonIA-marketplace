# =============================================================================
# Dockerfile — ingestor-service (NestJS / pnpm monorepo)
#
# Build desde la RAÍZ del repositorio:
#   docker build -f apps/ingestor-service/Dockerfile -t amazonia/ingestor-service:latest .
#
# Estrategia multi-stage con Turborepo pruning + pnpm deploy:
#   Stage 1 (base)    : imagen base con pnpm
#   Stage 2 (pruner)  : `turbo prune` genera un subárbol mínimo del monorepo
#   Stage 3 (builder) : instala deps, compila TypeScript, y ejecuta `pnpm deploy --prod`
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

# 3a. Instalar dependencias aprovechando el cache global de pnpm de Docker BuildKit
COPY --from=pruner /monorepo/out/json/ .
COPY --from=pruner /monorepo/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 3b. Copiar el código fuente podado y compilar
COPY --from=pruner /monorepo/out/full/ .

RUN pnpm turbo build --filter=ingestor-service

# 3c. pnpm deploy: crea un directorio flat con solo deps de producción
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm --filter=ingestor-service deploy --prod --legacy /deploy

# Copiar el dist compilado al directorio deployado
RUN cp -r /monorepo/apps/ingestor-service/dist /deploy/dist

# Copiar los dist/ de workspace packages internos compilados por turbo
# (pnpm deploy --legacy copia el src pero no el dist compilado)
RUN for pkg in event-types messaging; do \
      if [ -d "/monorepo/packages/$pkg/dist" ]; then \
        cp -r "/monorepo/packages/$pkg/dist" "/deploy/node_modules/$pkg/dist"; \
      fi; \
    done

# ─── Stage 4: Runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="amazonia-ingestor-service" \
      org.opencontainers.image.description="Gateway MQTT → Redis Streams para telemetría IoT de AmazonIA"

RUN apk add --no-cache dumb-init

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs

WORKDIR /app

# Copiar la salida de pnpm deploy (deps flat) + dist compilado
COPY --from=builder --chown=nestjs:nodejs /deploy/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /deploy/dist ./dist

USER nestjs

ENV NODE_ENV=production \
    PORT=3002

EXPOSE 3002

# dumb-init asegura que SIGTERM se propague correctamente a Node.js
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
