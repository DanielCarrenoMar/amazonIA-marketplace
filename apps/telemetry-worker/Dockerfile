# =============================================================================
# Dockerfile — telemetry-worker (NestJS / pnpm monorepo)
#
# Build desde la RAÍZ del repositorio:
#   docker build -f apps/telemetry-worker/Dockerfile -t amazonia/telemetry-worker:latest .
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
FROM base AS pruner

WORKDIR /monorepo

COPY turbo.json pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/telemetry-worker ./apps/telemetry-worker
COPY packages ./packages

RUN npx turbo@latest prune telemetry-worker --docker

# ─── Stage 3: Builder ─────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /monorepo

# 3a. Instalar dependencias usando el lockfile podado
COPY --from=pruner /monorepo/out/json/ .
COPY --from=pruner /monorepo/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# 3b. Copiar el código fuente podado y compilar
COPY --from=pruner /monorepo/out/full/ .

RUN pnpm turbo build --filter=telemetry-worker

# 3c. pnpm deploy: crea un directorio flat con solo deps de producción
#     (resuelve symlinks → funciona en runtime sin el store de pnpm)
RUN pnpm --filter=telemetry-worker deploy --prod --legacy /deploy

# Copiar el dist compilado al directorio deployado
RUN cp -r /monorepo/apps/telemetry-worker/dist /deploy/dist

# Copiar los dist/ de workspace packages internos compilados por turbo
# (pnpm deploy --legacy copia el src pero no el dist compilado)
RUN for pkg in event-types messaging database; do \
      if [ -d "/monorepo/packages/$pkg/dist" ]; then \
        cp -r "/monorepo/packages/$pkg/dist" "/deploy/node_modules/$pkg/dist"; \
      fi; \
    done

# ─── Stage 4: Runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="amazonia-telemetry-worker" \
      org.opencontainers.image.description="Consumidor Redis Streams → MongoDB Atlas para telemetría IoT de AmazonIA"

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
    PORT=3003 \
    POLL_INTERVAL_MS=30000

EXPOSE 3003

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
