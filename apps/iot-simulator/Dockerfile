# =============================================================================
# Stage 1 — deps: instala solo dependencias de producción
# =============================================================================
FROM node:22-alpine AS deps

# Instalar dumb-init para manejo correcto de señales (SIGTERM / SIGINT)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copiar manifiesto y lockfile primero (aprovechar caché de capas)
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm y las dependencias de producción únicamente
RUN npm install -g pnpm@10 --quiet \
    && pnpm install --frozen-lockfile --prod

# =============================================================================
# Stage 2 — runtime: imagen final mínima
# =============================================================================
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="amazonia-iot-simulator" \
      org.opencontainers.image.description="Simulador de sensores IoT MQTT para AmazonIA Marketplace" \
      org.opencontainers.image.source="https://github.com/DanielCarrenoMar/amazonIA-marketplace"

# dumb-init desde la stage anterior (ya compilado para alpine)
COPY --from=deps /usr/bin/dumb-init /usr/bin/dumb-init

# Ejecutar como usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 sensor

WORKDIR /app

# Copiar node_modules de producción y el código fuente del simulador
COPY --from=deps --chown=sensor:nodejs /app/node_modules ./node_modules
COPY --chown=sensor:nodejs sensor.js .

USER sensor

# Variables de entorno con defaults seguros (se sobreescriben en runtime)
ENV NODE_ENV=production \
    HIVEMQ_PORT=8883

# El script valida las vars en tiempo de arranque; no hay puerto expuesto
# (el sensor es puramente un cliente MQTT saliente)

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "sensor.js"]
