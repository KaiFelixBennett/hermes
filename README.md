# Hermes Local Stack — Run Hermes + Claude Code with llama.cpp Locally

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey)]()
[![Hermes](https://img.shields.io/badge/Hermes-Agent-orange)](https://hermes-agent.nousresearch.com/)

Run [Hermes Agent](https://hermes-agent.nousresearch.com/) locally with **llama.cpp** and a local GGUF model — zero cloud API costs. Optional Claude Code bridge via LiteLLM for coding tasks.

---

## Quick Start

### Windows (PowerShell)

```powershell
./setup_hermes_local.ps1
```

### Linux / macOS

```bash
curl -fsSL https://raw.githubusercontent.com/KaiFelixBennett/hermes-claude-code-local/main/setup.sh | bash
```

**That's it.** The setup script installs Hermes, downloads a GGUF model, starts llama.cpp, and launches Hermes — all in one command.

---

## What You Get

- **Hermes Agent** running locally with llama.cpp as the inference engine
- **Claude Code bridge** via LiteLLM (optional) — Claude Code talks to your local model instead of Anthropic's API
- **Telegram integration** — control Hermes from any device via Telegram
- **Zero API costs** — everything runs on your hardware
- **Self-healing scripts** — LiteLLM restarts automatically if it crashes

---

## Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Hermes  │────▶│   llama.cpp  │◀────│ Your GGUF │
│  Agent   │     │  (local)     │     │  Model   │
└──────────┘     └──────────────┘     └──────────┘
       │
       │ (coding tasks)
       ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│Claude Code│────▶│ LiteLLM  │────▶│ llama.cpp│
│  (local)  │     │  (proxy) │     │ (shared) │
└──────────┘     └──────────┘     └──────────┘
```

**Normal chat:** Hermes → llama.cpp directly (fast, no overhead).
**Coding tasks:** Claude Code → LiteLLM → llama.cpp (Anthropic-compatible API layer).

---

## Setup

### Prerequisites

| Requirement | Windows | Linux / macOS |
|-------------|---------|---------------|
| OS | Windows 10/11 with WSL2 | Ubuntu 20.04+, Debian, macOS |
| GPU (optional) | AMD/NVIDIA for faster inference | AMD/NVIDIA/CPU |
| RAM | 16 GB minimum (32 GB recommended) | 16 GB minimum |
| Disk | ~10 GB for model + tools | ~10 GB |

### Option A: One-Command Setup (Recommended)

The setup script handles everything automatically:

**Windows:**
```powershell
./setup_hermes_local.ps1
```

**Linux / macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/KaiFelixBennett/hermes-claude-code-local/main/setup.sh | bash
```

What the script does:
1. Checks system requirements (RAM, disk space, WSL2 on Windows)
2. Downloads Hermes if not installed
3. Downloads a GGUF model (Qwen3.6-27B by default) or asks for your own path
4. Starts llama.cpp with the correct backend for your GPU
5. Launches Hermes connected to your local model

### Option B: Manual Setup

If you prefer step-by-step control:

```bash
# 1. Clone this repo
git clone https://github.com/KaiFelixBennett/hermes-claude-code-local.git
cd hermes-claude-code-local

# 2. Install Hermes (if not already installed)
pip install hermes-agent

# 3. Configure your model path in hermes_config.yaml
#    Edit model.path to point to your GGUF file

# 4. Start everything
./setup_hermes_local.ps1      # Windows
make start                    # Linux / macOS
```

---

## Usage

### Start Hermes (Hermes + llama.cpp only)

```powershell
./start_hermes.bat          # Windows
make hermes                 # Linux
```

### Start Hermes + Claude Code Bridge

```powershell
./start_hermes_claude_local.bat   # Windows
make claude-bridge                # Linux
```

### Run Claude Code Locally (without Hermes)

```bash
./claude_local.sh -p "Your coding task here"
```

### Unified Entry Point (Makefile)

```bash
make setup          # Full one-command setup
make start          # Start Hermes + llama.cpp
make claude-bridge  # Start with Claude Code bridge
make stop           # Stop all services
make status         # Check service status
```

---

## Configuration

The main config file is `hermes_config.yaml`. The only values you typically need to change:

| Field | What It Does | Example |
|-------|-------------|---------|
| `model.path` | Path to your GGUF model file | `E:\models\qwen3.6.gguf` |
| `model.backend` | GPU backend for llama.cpp | `hip`, `vulkan`, `cuda`, `cpu` |
| `model.context_length` | Context window size | `65536` (default) |

Everything else — Hermes, LiteLLM, Claude Code — is pre-configured and works out of the box.

---

## Model Selection

This repo ships with a tested config for **Qwen3.6-27B-MTP GGUF**. See `docs/models/` for model-specific tuning notes.

To use a different GGUF model:
1. Download it to your machine
2. Update `model.path` in `hermes_config.yaml`
3. Run the setup script again

---

## Telegram Integration

Control Hermes from any device via Telegram:

```bash
hermes gateway setup   # Follow the wizard
hermes gateway         # Start the gateway
```

Read more in the [official Hermes Telegram docs](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram).

---

## Files That Matter

| File | Purpose |
|------|---------|
| `setup_hermes_local.ps1` | Windows setup wizard (recommended entry point) |
| `setup.sh` | Linux/macOS one-command setup script |
| `hermes_config.yaml` | Main config — model path, GPU backend, provider settings |
| `start_hermes.bat` | Quick start Hermes + llama.cpp |
| `start_hermes_claude_local.bat` | Start with Claude Code bridge |
| `litellm.proxy.yaml` | LiteLLM proxy config for Claude Code |
| `claude_local.sh` | Run Claude Code locally (standalone) |
| `Makefile` | Unified entry point for all platforms |

---

## Troubleshooting

### llama.cpp won't start on Windows

Check that your GPU backend matches your hardware:
- AMD Radeon → set `model.backend: "hip"` in `hermes_config.yaml`
- NVIDIA → set `model.backend: "cuda"` or `"vulkan"`
- No GPU → set `model.backend: "cpu"` (slower but works)

### LiteLLM bridge is down

The wrapper scripts auto-heal. If it's still not working:
```bash
./start_litellm.ps1   # Windows
make litellm          # Linux
```

### Hermes can't reach llama.cpp

On Windows with WSL2, make sure mirrored networking is enabled (default in WSL 2.0+). Test from inside WSL:
```bash
curl http://127.0.0.1:8080/v1/models
```

---

## Why This Setup?

Local LLMs are great for privacy and cost control, but Claude Code expects an Anthropic-compatible API. This repo solves that with a hybrid architecture:

- **Hermes** talks directly to llama.cpp (minimal overhead)
- **Claude Code** goes through LiteLLM (Anthropic API compatibility layer)
- Both share the same local model — no duplicate inference servers needed

---

## License

MIT
