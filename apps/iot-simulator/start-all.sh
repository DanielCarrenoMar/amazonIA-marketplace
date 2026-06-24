#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

# ── Cargar variables compartidas desde .env ──────────────
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ENV_FILE}"
  set +a
else
  echo "❌ No se encontró ${ENV_FILE}. Copia .env.example → .env y complétalo."
  exit 1
fi

echo "🚀 Iniciando simulación de múltiples sensores..."
echo "   Broker: ${HIVEMQ_HOST}:${HIVEMQ_PORT}"
echo "─────────────────────────────────────────────────"

# ── Sensores a ejecutar y sus contraseñas ──
# (Configurados en paralelo según credenciales solicitadas)
SENSORS=("clima01" "clima02" "sensor02")
PIDS=()

for sensor in "${SENSORS[@]}"; do
  # Se inyecta explícitamente la contraseña Amazonas4.0 tal como fue solicitada, junto con el usuario
  HIVEMQ_USERNAME="${sensor}" HIVEMQ_PASSWORD="Amazonas4.0" node "${SCRIPT_DIR}/sensor.js" &
  PIDS+=($!)
  echo "   ✅ ${sensor} (password: Amazonas4.0) → PID $!"
done

echo "─────────────────────────────────────────────────"
echo "⚠️  Presiona Ctrl+C para detener todos los sensores."

# ── Limpieza de procesos al recibir señal ────────────────
cleanup() {
  echo -e '\n🛑 Deteniendo sensores...'
  for pid in "${PIDS[@]}"; do
    kill "${pid}" 2>/dev/null || true
  done
  wait
  echo "👋 Todos los sensores detenidos."
}

trap cleanup SIGINT SIGTERM

# Esperar a que terminen
wait
