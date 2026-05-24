# Hermes Local Stack

This repository combines two things that were configured and verified together on this machine:

1. a local Hermes Agent setup backed by `llama.cpp`
2. a React + Vite flight simulator app in the root `src/` tree

The important local coding path is now fully wired and validated:

`Hermes -> claude-code skill -> Claude Code -> LiteLLM -> llama.cpp`

## What is in this repo

- Hermes launch scripts and config for a local `llama.cpp` server
- a local LiteLLM proxy config for Claude Code compatibility
- a combined starter for `llama.cpp + LiteLLM + Hermes`
- the current React/Vite app in the root `src/` directory

The old nested `react-sim/` app was a duplicate experiment and has been removed from the tracked project.

## Quick start

### Hermes only

```powershell
./start_hermes.bat
```

This keeps Hermes on its direct `llama.cpp` path.

### Hermes plus local Claude Code bridge

```powershell
./start_hermes_claude_local.bat
```

This start path:

1. checks or starts `llama.cpp`
2. checks or starts LiteLLM on `127.0.0.1:4000`
3. starts Hermes
4. ensures Claude Code subprocesses use the local LiteLLM gateway

You can also route the regular starter into that mode for the current PowerShell session:

```powershell
$env:HERMES_USE_CLAUDE_LITELLM = "1"
./start_hermes.bat
```

## Frontend development

The active frontend lives in the root `src/` directory and is wired through the root `index.html`, `package.json`, and `vite.config.js`.

Run it with:

```powershell
npm install
npm run dev
```

Other useful commands:

```powershell
npm run build
npm run lint
npm run preview
```

## Key files

- `hermes_config.yaml`: Hermes provider and model config
- `start_llamacpp.ps1`: starts the local `llama.cpp` server from repo config
- `litellm.proxy.yaml`: Claude Code bridge config for LiteLLM
- `start_litellm.ps1`: starts LiteLLM in WSL for the local bridge
- `start_hermes_claude_local.bat`: combined local starter
- `HERMES_README.md`: more detailed operator documentation for the Hermes setup

## Local model assumptions

This repo does not contain the GGUF model or the local Windows `llama.cpp` binaries.

Those stay machine-local and are referenced from config or started from ignored local tooling paths. The repository only keeps the scripts, config, and template needed to reproduce the setup.

## Validated local Claude Code path

The verified Claude Code environment for this repo is:

```text
ANTHROPIC_BASE_URL=http://127.0.0.1:4000
ANTHROPIC_AUTH_TOKEN=sk-hermes-local
ANTHROPIC_MODEL=qwen-local-anthropic
ANTHROPIC_CUSTOM_MODEL_OPTION=qwen-local-anthropic
```

That path was validated end to end with:

- a minimal `Reply with exactly OK.` task
- a second Claude Code task that used Bash tool execution successfully

## Notes

- Hermes itself still talks directly to `llama.cpp`.
- Claude Code uses LiteLLM because the local `llama.cpp` Anthropic compatibility works reliably through that bridge.
- The root `src/` app is still active. Removing it would break the current Vite project setup.
