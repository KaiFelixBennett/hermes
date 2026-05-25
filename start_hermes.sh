#!/usr/bin/env bash
# Linux/macOS Hermes launcher
# Equivalent to start_hermes.bat for Linux/macOS native environments.
# Checks llama.cpp availability, starts it if needed, then launches Hermes.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${HERMES_BASE_URL:-http://127.0.0.1:8080/v1}"
LLAMA_PID=""

cleanup() {
    if [ -n "$LLAMA_PID" ] && kill -0 "$LLAMA_PID" 2>/dev/null; then
        echo ""
        echo "Stopping llama-server (PID $LLAMA_PID)..."
        kill "$LLAMA_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

echo ""
echo "========================================"
echo "  Hermes Agent Starter (Linux/macOS)"
echo "========================================"
echo ""

# --- 1) Check / start llama.cpp ---
echo "[1/2] Checking llama.cpp at ${BASE_URL} ..."
if curl -s --connect-timeout 3 "${BASE_URL}/models" > /dev/null 2>&1; then
    echo "  OK (already running)"
else
    echo "  Not running. Starting llama-server..."
    if [ ! -f "${SCRIPT_DIR}/start_llamacpp.sh" ]; then
        echo "[ERROR] start_llamacpp.sh not found. Start llama-server manually."
        exit 1
    fi

    bash "${SCRIPT_DIR}/start_llamacpp.sh" &
    LLAMA_PID=$!

    echo "  Waiting for llama-server to be ready (up to 60s)..."
    for i in $(seq 1 30); do
        if curl -s --connect-timeout 1 "${BASE_URL}/models" > /dev/null 2>&1; then
            echo "  llama-server ready."
            break
        fi
        if ! kill -0 "$LLAMA_PID" 2>/dev/null; then
            echo "[ERROR] llama-server process exited unexpectedly."
            exit 1
        fi
        sleep 2
        if [ "$i" -eq 30 ]; then
            echo "[ERROR] llama-server did not become ready within 60s."
            exit 1
        fi
    done
fi

# --- 2) Launch Hermes ---
echo "[2/2] Launching Hermes..."
echo ""
exec bash "${SCRIPT_DIR}/hermes_launch.sh"
