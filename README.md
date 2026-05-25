# Hermes Local Stack — Run Hermes + Claude Code with llama.cpp Locally

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey)]()
[![Hermes Agent](https://img.shields.io/badge/Hermes-Agent-orange)](https://hermes-agent.nousresearch.com/)
[![Local Inference](https://img.shields.io/badge/Inference-llama.cpp-green)](https://github.com/ggerganov/llama.cpp)

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

**That's it.** The setup script verifies your environment, configures Hermes with llama.cpp, and launches everything in one command.

---

<p align="center">
  <img src="images/readme-hero-hybrid-stack.png" alt="Illustration of the hybrid Hermes, Claude Code, LiteLLM, and llama.cpp setup" width="980" />
</p>

## What You Get

- **Hermes Agent** running locally with llama.cpp as the inference engine
- **Claude Code bridge** via LiteLLM (optional) — Claude Code talks to your local model instead of Anthropic's API
- **Telegram integration** — control Hermes from any device via Telegram
- **Zero API costs** — everything runs on your hardware
- **Self-healing scripts** — LiteLLM restarts automatically if it crashes
- **Model tuning notes** per GGUF under `docs/models/`

---

## Architecture

The core path looks like this:

`Hermes -> llama.cpp`

and for local Claude Code tasks:

`Hermes -> claude-code skill -> Claude Code -> LiteLLM -> llama.cpp`

```mermaid
flowchart LR
  U[User] --> H[Hermes]
  H --> L1[llama.cpp]
  H --> S[claude-code skill]
  S --> C[Claude Code]
  C --> P[LiteLLM]
  P --> L2[llama.cpp]
```

### Why This Hybrid Setup?

At first glance, the architecture looks more complicated than just pointing everything straight at one local model. In practice, the split is what makes the system stable:

- **Hermes** talks directly to `llama.cpp` — fewer moving parts, lower overhead, simpler debugging
- **Claude Code** goes through LiteLLM — it expects Anthropic-style API behavior and is pickier about compatibility
- The wrapper scripts auto-heal the bridge when LiteLLM is not already running

Read more about [why Hermes talks directly to llama.cpp](#why-hermes-direct) and [why Claude Code uses LiteLLM](#why-claude-code-litellm).

---

## Who This Is For

Use this repo if you want one of these outcomes:

- run Hermes locally against `llama.cpp`
- test Claude Code against a local model instead of the Anthropic API
- keep working launch scripts and config in one place
- reuse the setup later on another machine with minimal changes

---

## Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Windows 10/11 (WSL2) or Linux/macOS | Windows 11 + WSL2 Ubuntu |
| RAM | 16 GB | 32 GB |
| Disk | ~10 GB for model + tools | SSD |
| GPU (optional) | — | AMD Radeon / NVIDIA for faster inference |

You should already have:

- Hermes installed in WSL (or natively on Linux/macOS)
- `claude` CLI installed (for the Claude Code bridge path)
- a local GGUF model available on disk
- a working `llama.cpp` binary

This repo gives you the wiring, launch scripts, and tested configuration. It does not ship model weights or llama.cpp binaries.

---

## Setup

### Option A: One-Command Setup (Recommended)

```powershell
./setup_hermes_local.ps1
```

What this script does:

1. Verifies required local files exist
2. Checks your configured GGUF path in `hermes_config.yaml`
3. Prompts for a GGUF path if the configured one is missing
4. Writes the new path back to `model.path`
5. Starts the normal Hermes launcher

With Claude Code bridge:

```powershell
./setup_hermes_local.ps1 -WithClaudeBridge
```

Config-only (no launch):

```powershell
./setup_hermes_local.ps1 -SkipLaunch
```

### Option B: Manual Start

**Hermes only:**
```powershell
./start_hermes.bat
```

**Hermes + Claude Code bridge:**
```powershell
./start_hermes_claude_local.bat
```

This path checks or starts `llama.cpp`, starts LiteLLM on `127.0.0.1:4000`, launches Hermes, and ensures Claude Code subprocesses use the local gateway.

**Claude Code check without Hermes:**
```bash
./claude_local.sh -p 'Reply with exactly OK.' --output-format json
```

The wrapper auto-starts LiteLLM on demand. Verify success when JSON output contains `modelUsage.qwen-local-anthropic`.

---

## What This Looks Like In Practice

Hermes inspects the current state, switches into the `claude-code` skill when deeper coding work is needed, and delegates through the local Claude Code bridge:

<p align="center">
  <img src="images/calling-claude-code-skill-virelia.png" alt="Telegram screenshot showing Hermes loading the claude-code skill and delegating work to Claude Code" width="760" />
</p>

---

## Telegram Integration

Hermes is not tied to one terminal window — you can control it from Telegram:

- Run Hermes on your local machine or in WSL
- Keep the model and tooling running in the background
- Message Hermes from Telegram instead of sitting in front of the terminal
- Hermes uses the same local stack while you interact from chat

<p align="center">
	<img src="images/readme-telegram-architecture.png" alt="Telegram and Hermes architecture illustration with direct llama.cpp path and optional Claude Code bridge path" width="980" />
</p>

```mermaid
flowchart LR
	T[Telegram] --> G[Hermes gateway]
	G --> H[Hermes]
	H --> L[llama.cpp]
	H --> C[Claude Code via LiteLLM]
```

### Connect Your Own Telegram Bot

The shortest stable setup flow:

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Get your numeric Telegram user ID
3. Run `hermes gateway setup` in WSL and choose Telegram
4. Start the gateway with `hermes gateway`
5. Send your bot a message and verify Hermes replies

Official references:

- [Hermes Messaging Gateway Overview](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/)
- [Hermes Telegram Setup](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
- [Hermes Security Guide](https://hermes-agent.nousresearch.com/docs/user-guide/security)

> **Note:** Telegram group privacy mode is the most common reason bots appear "silent" in groups. If you change privacy mode in BotFather, remove and re-add the bot to the group afterwards.

---

## Configuration

The main config file is `hermes_config.yaml`. The only values you typically need to change:

| Field | What It Does | Example |
|-------|-------------|---------|
| `model.path` | Path to your GGUF model file | `E:\models\qwen3.6.gguf` |
| `model.backend` | GPU backend for llama.cpp | `hip`, `vulkan`, `cuda`, `cpu` |
| `model.binary_dir` | (optional) Pin a specific llama.cpp build | — |

Everything else — Hermes, LiteLLM, Claude Code — is pre-configured and works out of the box.

### Current Verified Defaults

```text
ANTHROPIC_BASE_URL=http://127.0.0.1:4000
ANTHROPIC_AUTH_TOKEN=***
ANTHROPIC_MODEL=qwen-local-anthropic
ANTHROPIC_CUSTOM_MODEL_OPTION=qwen-local-anthropic
```

Model tuning details are documented in `docs/models/qwen3.6-27b-mtp-gguf-llamacpp.md`.

---

## Files That Matter

| File | Purpose |
|------|---------|
| `hermes_config.yaml` | Main Hermes provider and model config |
| `setup_hermes_local.ps1` | First-run setup wizard (recommended entry point) |
| `start_hermes.bat` | Quick start Hermes + llama.cpp |
| `start_hermes_claude_local.bat` | Start with Claude Code bridge |
| `start_llamacpp.ps1` | Starts llama.cpp from repo config |
| `start_litellm.ps1` | Starts LiteLLM for the Claude bridge |
| `claude_local.sh` | Local Claude Code entry point (standalone) |
| `ensure_claude_local_bridge.sh` | On-demand LiteLLM self-healing wrapper |
| `litellm.proxy.yaml` | LiteLLM bridge config |
| `HERMES_README.md` | Deeper operator notes for this setup |

---

## Reusing on Another Machine

This repo does not ship the GGUF model or llama.cpp binaries. Usually only these parts need to change:

1. `model.path` in `hermes_config.yaml`
2. The installed llama.cpp backend and binary folder
3. Machine-specific paths to GGUFs or tools
4. Optional GPU backend tuning

The launch scripts resolve paths dynamically — you typically don't need to edit them manually.

---

## Troubleshooting

### llama.cpp won't start on Windows

Check that your GPU backend matches your hardware in `hermes_config.yaml`:

- AMD Radeon → set `model.backend: "hip"`
- NVIDIA → set `model.backend: "cuda"` or `"vulkan"`
- No GPU → set `model.backend: "cpu"` (slower but works)

### LiteLLM bridge is down

The wrapper scripts auto-heal. If it's still not working:

```powershell
./start_litellm.ps1   # Windows
make litellm          # Linux
```

### Hermes can't reach llama.cpp

On Windows with WSL2, make sure mirrored networking is enabled (default in WSL 2.0+). Test from inside WSL:

```bash
curl http://127.0.0.1:8080/v1/models
```

### Telegram bot appears silent in groups

- Check that privacy mode is disabled in BotFather
- Remove and re-add the bot to the group after changing settings
- Hermes can also stay DM-only for the simplest setup

---

## Why This Setup?

Local LLMs are great for privacy and cost control, but Claude Code expects an Anthropic-compatible API. This repo solves that with a hybrid architecture:

- **Hermes** talks directly to llama.cpp (minimal overhead)
- **Claude Code** goes through LiteLLM (Anthropic API compatibility layer)
- Both share the same local model — no duplicate inference servers needed

---

## License

MIT
