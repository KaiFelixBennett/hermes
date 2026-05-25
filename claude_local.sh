#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${SCRIPT_DIR}/ensure_claude_local_bridge.sh"

bridge_url="${CLAUDE_LOCAL_BASE_URL:-${ANTHROPIC_BASE_URL:-http://127.0.0.1:4000}}"
bridge_url="${bridge_url%/}"
bridge_token="${CLAUDE_LOCAL_AUTH_TOKEN:-${ANTHROPIC_AUTH_TOKEN:-${ANTHROPIC_API_KEY:-sk-hermes-local}}}"
bridge_model="${CLAUDE_LOCAL_MODEL:-qwen-local-anthropic}"

export ANTHROPIC_BASE_URL="${bridge_url}"
unset ANTHROPIC_API_KEY
export ANTHROPIC_AUTH_TOKEN="${bridge_token}"
export ANTHROPIC_MODEL="${bridge_model}"
export ANTHROPIC_CUSTOM_MODEL_OPTION="${bridge_model}"

claude_args=(--effort low)
if [[ "${CLAUDE_LOCAL_SIMPLE:-0}" == "1" ]]; then
  claude_args+=(--bare --exclude-dynamic-system-prompt-sections)
fi

exec claude "${claude_args[@]}" "$@"