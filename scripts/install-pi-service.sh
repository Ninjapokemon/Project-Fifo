#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="project-fifo.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVICE_TEMPLATE="${REPO_ROOT}/apps/pi-controller/project-fifo.service"
PYTHON_BIN="${REPO_ROOT}/.venv/bin/python"
TARGET_PATH="/etc/systemd/system/${SERVICE_NAME}"
RUN_USER="${SUDO_USER:-$(id -un)}"

if [[ ! -f "${SERVICE_TEMPLATE}" ]]; then
  echo "Missing service template: ${SERVICE_TEMPLATE}" >&2
  exit 1
fi

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "Expected virtualenv Python at ${PYTHON_BIN}" >&2
  echo "Create the venv and install requirements first." >&2
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo so it can install the systemd service." >&2
  exit 1
fi

sed \
  -e "s|^User=.*|User=${RUN_USER}|" \
  -e "s|^WorkingDirectory=.*|WorkingDirectory=${REPO_ROOT}|" \
  -e "s|^ExecStart=.*|ExecStart=${PYTHON_BIN} ${REPO_ROOT}/apps/pi-controller/src/server.py|" \
  "${SERVICE_TEMPLATE}" > "${TARGET_PATH}"

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}"
systemctl status "${SERVICE_NAME}" --no-pager
