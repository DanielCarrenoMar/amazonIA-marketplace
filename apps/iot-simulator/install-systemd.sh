#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="amazonia-sensor"
SERVICE_FILE_NAME="${SERVICE_NAME}.service"
SYSTEMD_PATH="/etc/systemd/system/${SERVICE_FILE_NAME}"
NODE_PATH="$(command -v node || true)"
RUN_USER="${SUDO_USER:-$(id -un)}"

if [[ -z "${NODE_PATH}" ]]; then
  echo "Error: no se encontró 'node' en PATH." >&2
  exit 1
fi

if [[ ! -f "${SCRIPT_DIR}/sensor.js" ]]; then
  echo "Error: no se encontró sensor.js en ${SCRIPT_DIR}." >&2
  exit 1
fi

if [[ ! -f "${SCRIPT_DIR}/.env" ]]; then
  echo "Aviso: no existe .env en ${SCRIPT_DIR}. El servicio arrancará, pero MQTT puede fallar si faltan variables." >&2
fi

TMP_UNIT_FILE="$(mktemp)"
cleanup() {
  rm -f "${TMP_UNIT_FILE}"
}
trap cleanup EXIT

cat > "${TMP_UNIT_FILE}" <<EOF
[Unit]
Description=Sensor Amazonia IoT
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${SCRIPT_DIR}
ExecStart=${NODE_PATH} ${SCRIPT_DIR}/sensor.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=-${SCRIPT_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

if [[ $EUID -ne 0 ]]; then
  if ! command -v sudo >/dev/null 2>&1; then
    echo "Error: se requiere sudo para instalar en /etc/systemd/system." >&2
    exit 1
  fi
  sudo install -m 644 "${TMP_UNIT_FILE}" "${SYSTEMD_PATH}"
  sudo systemctl daemon-reload
  sudo systemctl enable "${SERVICE_NAME}"
  sudo systemctl restart "${SERVICE_NAME}" || sudo systemctl start "${SERVICE_NAME}"
else
  install -m 644 "${TMP_UNIT_FILE}" "${SYSTEMD_PATH}"
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
  systemctl restart "${SERVICE_NAME}" || systemctl start "${SERVICE_NAME}"
fi

echo "Servicio instalado: ${SERVICE_NAME}"
echo "Estado: systemctl status ${SERVICE_NAME} --no-pager"
echo "Logs: journalctl -u ${SERVICE_NAME} -f"