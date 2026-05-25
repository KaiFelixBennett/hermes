#!/usr/bin/env bash
# Linux/macOS llama.cpp server launcher
# Equivalent to start_llamacpp.ps1 for non-Windows environments.
# Reads model.path, backend, and context_length from hermes_config.yaml.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${SCRIPT_DIR}/hermes_config.yaml"

# Parse a value from the model: block in hermes_config.yaml
get_model_value() {
    local key="$1"
    awk -v wanted="$key" '
        /^model:[[:space:]]*$/ { in_model=1; next }
        in_model && /^[^[:space:]]/ { in_model=0 }
        in_model && $1 == wanted ":" {
            value = $0
            sub(/^[^:]+:[[:space:]]*/, "", value)
            sub(/[[:space:]]+#.*$/, "", value)
            gsub(/^['\''"]/, "", value)
            gsub(/['\''"]$/, "", value)
            print value
            exit
        }
    ' "$CONFIG"
}

MODEL_PATH="${HERMES_LLAMACPP_MODEL_PATH:-$(get_model_value path)}"
CONTEXT="${HERMES_LLAMACPP_CONTEXT:-$(get_model_value context_length)}"
CONTEXT="${CONTEXT:-65536}"
BACKEND="${HERMES_LLAMACPP_BACKEND:-$(get_model_value backend)}"
BACKEND="${BACKEND:-cpu}"
MODEL_ALIAS="${HERMES_LLAMACPP_ALIAS:-$(get_model_value default)}"
MODEL_ALIAS="${MODEL_ALIAS:-local-model}"

# Find llama-server binary
LLAMA_SERVER=""
if command -v llama-server &>/dev/null; then
    LLAMA_SERVER="llama-server"
elif [ -f "${SCRIPT_DIR}/tools/llama.cpp/llama-server" ]; then
    LLAMA_SERVER="${SCRIPT_DIR}/tools/llama.cpp/llama-server"
else
    echo "[ERROR] llama-server not found in PATH or tools/llama.cpp/"
    echo ""
    echo "  Options:"
    echo "    1) Download a prebuilt binary from https://github.com/ggerganov/llama.cpp/releases"
    echo "       and place it in your PATH or at tools/llama.cpp/llama-server"
    echo "    2) Build from source: https://github.com/ggerganov/llama.cpp#build"
    echo "    3) Use conda: conda install -c conda-forge llama.cpp"
    exit 1
fi

if [ -z "$MODEL_PATH" ] || [ ! -f "$MODEL_PATH" ]; then
    echo "[ERROR] GGUF model not found: ${MODEL_PATH:-<not set>}"
    echo "  Set model.path in hermes_config.yaml or export HERMES_LLAMACPP_MODEL_PATH=/path/to/model.gguf"
    exit 1
fi

# Build GPU offload flags based on backend
EXTRA_ARGS=()
case "${BACKEND,,}" in
    hip|rocm)
        echo "  Backend: ROCm/HIP (AMD GPU)"
        EXTRA_ARGS+=(-ngl 99)
        ;;
    cuda)
        echo "  Backend: CUDA (NVIDIA GPU)"
        EXTRA_ARGS+=(-ngl 99)
        ;;
    vulkan)
        echo "  Backend: Vulkan (cross-vendor GPU)"
        EXTRA_ARGS+=(-ngl 99)
        ;;
    cpu)
        echo "  Backend: CPU (no GPU offload)"
        echo "  [WARN] CPU-only inference on 27B+ models is very slow. GPU strongly recommended."
        ;;
    *)
        echo "  [WARN] Unknown backend '${BACKEND}', no GPU offload flags set."
        ;;
esac

echo ""
echo "  Model  : $MODEL_PATH"
echo "  Alias  : $MODEL_ALIAS"
echo "  Context: $CONTEXT"
echo "  Port   : 8080"
echo ""

exec "$LLAMA_SERVER" \
    --model "$MODEL_PATH" \
    --alias "$MODEL_ALIAS" \
    --ctx-size "$CONTEXT" \
    --host 127.0.0.1 \
    --port 8080 \
    --flash-attn \
    "${EXTRA_ARGS[@]}"
