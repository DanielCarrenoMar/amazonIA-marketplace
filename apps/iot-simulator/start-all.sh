#!/bin/bash
# ─────────────────────────────────────────────────────────────
# start-all.sh  – Lanzador paralelo de sensores IoT AmazonIA
#
# Carga credenciales DESDE .env (nunca hardcodeadas aquí).
# Para cada sensor define en .env:
#   SENSOR_1_USERNAME=clima01
#   SENSOR_1_PASSWORD=<password>
#   SENSOR_2_USERNAME=clima02
#   SENSOR_2_PASSWORD=<password>
#   ...
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

# ── Cargar variables compartidas desde .env ──────────────────
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ENV_FILE}"
  set +a
else
  echo "❌ No se encontró ${ENV_FILE}. Copia .env.example → .env y complétalo."
  exit 1
fi

# ── Validar variables mínimas del broker ─────────────────────
if [[ -z "${HIVEMQ_HOST:-}" || -z "${HIVEMQ_PORT:-}" ]]; then
  echo "❌ HIVEMQ_HOST o HIVEMQ_PORT no definidos en ${ENV_FILE}."
  exit 1
fi

echo "🚀 Iniciando simulación de múltiples sensores..."
echo "   Broker: ${HIVEMQ_HOST}:${HIVEMQ_PORT}"
echo "─────────────────────────────────────────────────"

PIDS=()
SENSOR_INDEX=1
SENSOR_COUNT=0

# ── Iterar dinámicamente sobre SENSOR_n_USERNAME / SENSOR_n_PASSWORD ──
while true; do
  USERNAME_VAR="SENSOR_${SENSOR_INDEX}_USERNAME"
  PASSWORD_VAR="SENSOR_${SENSOR_INDEX}_PASSWORD"

  # Salir del bucle si ya no hay más sensores definidos
  USERNAME="${!USERNAME_VAR:-}"
  PASSWORD="${!PASSWORD_VAR:-}"

  if [[ -z "${USERNAME}" ]]; then
    break
  fi

  if [[ -z "${PASSWORD}" ]]; then
    echo "⚠️  ${PASSWORD_VAR} no está definida. Saltando sensor '${USERNAME}'."
    SENSOR_INDEX=$((SENSOR_INDEX + 1))
    continue
  fi

  # Lanzar el proceso del sensor con las credenciales inyectadas por entorno
  HIVEMQ_USERNAME="${USERNAME}" HIVEMQ_PASSWORD="${PASSWORD}" \
    node "${SCRIPT_DIR}/sensor.js" &

  PIDS+=($!)
  echo "   ✅ Sensor '${USERNAME}' iniciado → PID $!"

  SENSOR_COUNT=$((SENSOR_COUNT + 1))
  SENSOR_INDEX=$((SENSOR_INDEX + 1))
done

# ── Verificar que se encontró al menos un sensor ─────────────
if [[ ${SENSOR_COUNT} -eq 0 ]]; then
  echo ""
  echo "❌ No se encontró ningún sensor configurado en ${ENV_FILE}."
  echo "   Define al menos:"
  echo "     SENSOR_1_USERNAME=<usuario>"
  echo "     SENSOR_1_PASSWORD=<contraseña>"
  exit 1
fi

echo "─────────────────────────────────────────────────"
echo "🟢 ${SENSOR_COUNT} sensor(es) activos. Presiona Ctrl+C para detener todos."

# ── Limpieza de procesos al recibir señal ────────────────────
cleanup() {
  echo -e '\n🛑 Deteniendo sensores...'
  for pid in "${PIDS[@]}"; do
    kill "${pid}" 2>/dev/null || true
  done
  wait
  echo "👋 Todos los sensores detenidos."
}

trap cleanup SIGINT SIGTERM

# Esperar a que todos los procesos hijo terminen
wait
