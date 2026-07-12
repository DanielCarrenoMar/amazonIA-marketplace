# =============================================================================
# Dockerfile — api (NestJS / Prisma / pnpm monorepo)
# =============================================================================

# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

RUN apk add --no-cache dumb-init openssl \
    && npm install -g pnpm@10 --quiet \
    && pnpm config set store-dir /root/.local/share/pnpm/store

# ─── Stage 2: Pruner ──────────────────────────────────────────────────────────
FROM base AS pruner

WORKDIR /monorepo

COPY turbo.json pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api ./apps/api
COPY packages ./packages

RUN npx turbo@latest prune api --docker

# ─── Stage 3: Builder ─────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /monorepo

# 3a. Instalar dependencias usando el lockfile podado
COPY --from=pruner /monorepo/out/json/ .
COPY --from=pruner /monorepo/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# 3b. Copiar el código fuente podado y compilar
COPY --from=pruner /monorepo/out/full/ .

# El comando build de api incluye `prisma generate`
RUN pnpm turbo build --filter=api

# 3c. Aislar el microservicio y sus dependencias de producción (sin symlinks)
RUN pnpm deploy --filter=api --prod --legacy /deploy/api

# Re-generar Prisma Client en el entorno aislado (ya que pnpm deploy ignora .prisma)
RUN cd /deploy/api && mv prisma.config.ts prisma.config.bak && npx prisma@7.7.0 generate && mv prisma.config.bak prisma.config.ts

# ─── Stage 4: Runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="amazonia-api" \
    org.opencontainers.image.description="API principal del marketplace AmazonIA"

RUN apk add --no-cache dumb-init openssl

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs

WORKDIR /app

# Copiar el servicio aislado por pnpm deploy
COPY --from=builder --chown=nestjs:nodejs /deploy/api ./

# Copiar explícitamente el build compilado (dist/)
COPY --from=builder --chown=nestjs:nodejs /monorepo/apps/api/dist ./dist

USER nestjs

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
