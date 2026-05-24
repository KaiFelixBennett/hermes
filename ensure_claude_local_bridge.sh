#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LLAMA_BASE_URL="${HERMES_LLAMA_BASE_URL:-http://127.0.0.1:8080/v1}"
LITELLM_BASE_URL="${HERMES_LITELLM_BASE_URL:-http://127.0.0.1:4000/v1}"
LITELLM_MASTER_KEY="${HERMES_LITELLM_MASTER_KEY:-sk-hermes-local}"
LITELLM_LOG_PATH="${HERMES_LITELLM_LOG_PATH:-/tmp/hermes-litellm.log}"
WAIT_ATTEMPTS="${HERMES_LITELLM_WAIT_ATTEMPTS:-15}"
WAIT_DELAY_SECONDS="${HERMES_LITELLM_WAIT_DELAY_SECONDS:-2}"

probe_endpoint() {
  local url="$1"
  shift || true
  curl -sS --connect-timeout 3 "$@" "$url" > /dev/null 2>&1
}

if ! probe_endpoint "${LLAMA_BASE_URL%/}/models"; then
  echo "llama.cpp endpoint is not reachable at ${LLAMA_BASE_URL}. Start it with start_hermes.bat or start_llamacpp.ps1 first." >&2
  exit 1
fi

if probe_endpoint "${LITELLM_BASE_URL%/}/models" -H "Authorization: Bearer ${LITELLM_MASTER_KEY}"; then
  exit 0
fi

echo "LiteLLM is not reachable at ${LITELLM_BASE_URL}; starting local bridge..." >&2
nohup bash "${SCRIPT_DIR}/hermes_litellm.sh" > "${LITELLM_LOG_PATH}" 2>&1 &

for _ in $(seq 1 "$WAIT_ATTEMPTS"); do
  if probe_endpoint "${LITELLM_BASE_URL%/}/models" -H "Authorization: Bearer ${LITELLM_MASTER_KEY}"; then
    echo "LiteLLM bridge is ready at ${LITELLM_BASE_URL}." >&2
    exit 0
  fi

  sleep "$WAIT_DELAY_SECONDS"
done

echo "LiteLLM did not become ready in time. Last log lines from ${LITELLM_LOG_PATH}:" >&2
tail -n 40 "${LITELLM_LOG_PATH}" >&2 || true
exit 1