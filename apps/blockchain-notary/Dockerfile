# =============================================================================
# Dockerfile — blockchain-notary (NestJS / Prisma / pnpm monorepo)
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
COPY apps/blockchain-notary ./apps/blockchain-notary
COPY packages ./packages

RUN npx turbo@latest prune blockchain-notary --docker

# ─── Stage 3: Builder ─────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /monorepo

# 3a. Instalar dependencias usando el lockfile podado
COPY --from=pruner /monorepo/out/json/ .
COPY --from=pruner /monorepo/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# 3b. Copiar el código fuente podado y compilar
COPY --from=pruner /monorepo/out/full/ .

# El comando build incluye `prisma generate`
RUN pnpm turbo build --filter=blockchain-notary

# 3c. Aislar el microservicio y sus dependencias de producción (sin symlinks)
RUN pnpm deploy --filter=blockchain-notary --prod --legacy /deploy/blockchain-notary

# Re-generar Prisma Client en el entorno aislado (ya que pnpm deploy ignora .prisma)
RUN cd /deploy/blockchain-notary && npx prisma@6 generate

# ─── Stage 4: Runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="amazonia-blockchain-notary" \
    org.opencontainers.image.description="Notario Blockchain para el marketplace AmazonIA"

RUN apk add --no-cache dumb-init openssl

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs

WORKDIR /app

# Copiar el servicio aislado por pnpm deploy
COPY --from=builder --chown=nestjs:nodejs /deploy/blockchain-notary ./

# Copiar explícitamente el build compilado (dist/)
COPY --from=builder --chown=nestjs:nodejs /monorepo/apps/blockchain-notary/dist ./dist

USER nestjs

ENV NODE_ENV=production \
    PORT=3004

EXPOSE 3004

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
