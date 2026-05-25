#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="${HERMES_LITELLM_CONFIG:-$SCRIPT_DIR/litellm.proxy.yaml}"
HOST="${HERMES_LITELLM_HOST:-127.0.0.1}"
PORT="${HERMES_LITELLM_PORT:-4000}"
DEBUG="${HERMES_LITELLM_DEBUG:-0}"
REQUEST_TIMEOUT="${HERMES_LITELLM_REQUEST_TIMEOUT:-240}"
MASTER_KEY="${HERMES_LITELLM_MASTER_KEY:-sk-hermes-local}"
LITELLM_PYTHON="${HERMES_LITELLM_PYTHON:-$HOME/.local/share/uv/tools/litellm/bin/python}"

if [[ ! -x "$LITELLM_PYTHON" ]]; then
  echo "LiteLLM Python runtime not found: $LITELLM_PYTHON" >&2
  echo "Install it in WSL with: ~/.local/bin/uv tool install 'litellm[proxy]'" >&2
  exit 1
fi

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "LiteLLM config not found: $CONFIG_PATH" >&2
  exit 1
fi

export HERMES_LITELLM_CONFIG="$CONFIG_PATH"
export HERMES_LITELLM_HOST="$HOST"
export HERMES_LITELLM_PORT="$PORT"
export HERMES_LITELLM_DEBUG="$DEBUG"
export HERMES_LITELLM_REQUEST_TIMEOUT="$REQUEST_TIMEOUT"
export LITELLM_MASTER_KEY="$MASTER_KEY"

cd "$SCRIPT_DIR"

exec "$LITELLM_PYTHON" -u - <<'PY'
import os

import uvicorn
from litellm.proxy import proxy_server as ps


def is_truthy(value: str) -> bool:
    return value.strip().lower() not in ("", "0", "false", "no", "off")


debug = is_truthy(os.getenv("HERMES_LITELLM_DEBUG", "0"))

ps.save_worker_config(
    model=None,
    alias=None,
    api_base=None,
    api_version=None,
    debug=debug,
    detailed_debug=debug,
    temperature=None,
    max_tokens=None,
    request_timeout=int(os.getenv("HERMES_LITELLM_REQUEST_TIMEOUT", "240")),
    max_budget=None,
    telemetry=False,
    drop_params=True,
    add_function_to_prompt=False,
    headers=None,
    save=False,
    config=os.environ["HERMES_LITELLM_CONFIG"],
    use_queue=False,
)

uvicorn.run(
    ps.app,
    host=os.getenv("HERMES_LITELLM_HOST", "127.0.0.1"),
    port=int(os.getenv("HERMES_LITELLM_PORT", "4000")),
    workers=1,
    access_log=True,
)
PY