#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="project-fifo.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PYTHON_BIN="${REPO_ROOT}/.venv/bin/python"

if [[ ! -d "${REPO_ROOT}/.git" ]]; then
  echo "Expected a git checkout at ${REPO_ROOT}" >&2
  exit 1
fi

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "Expected virtualenv Python at ${PYTHON_BIN}" >&2
  echo "Create the venv and install requirements first." >&2
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo so it can restart the systemd service." >&2
  exit 1
fi

RUN_USER="${SUDO_USER:-$(id -un)}"

cd "${REPO_ROOT}"

echo "Updating repository..."
sudo -u "${RUN_USER}" git pull --ff-only

echo "Installing Python dependencies..."
sudo -u "${RUN_USER}" "${PYTHON_BIN}" -m pip install -r apps/pi-controller/requirements.txt

echo "Reloading and restarting ${SERVICE_NAME}..."
systemctl daemon-reload
systemctl restart "${SERVICE_NAME}"
systemctl status "${SERVICE_NAME}" --no-pager
