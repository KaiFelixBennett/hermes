# Contributing to Hermes Local Stack

Thank you for considering a contribution. This project is useful precisely because people with different hardware share what actually works.

## What's most valuable

**Hardware configs and model reports** are the highest-value contribution. If you got this stack running on NVIDIA, Apple Silicon, CPU-only, or a different GGUF — open a [Hardware / Config report issue](https://github.com/KaiFelixBennett/hermes-claude-code-local/issues/new?template=hardware_config.md) or add a file under `docs/models/`.

**Bug fixes and script improvements** for cross-platform portability are always welcome. Check the open issues before starting work on something big.

**Documentation improvements** — if you found the setup confusing or found a step that was missing, a PR or issue is welcome.

## What this project is not

This repo is launch scripts, config, and documentation — it does not ship model weights or a full application. Contributions should stay within that scope.

## How to contribute

1. Fork the repo
2. Create a branch: `git checkout -b my-fix`
3. Make your change and test it on your hardware
4. Open a pull request with a clear description of what changed and why

## PR guidelines

- Keep changes focused. One fix or feature per PR.
- If you're adding a hardware config, include your exact llama.cpp flags and the GGUF quant level.
- If you're changing a script, test it end-to-end on at least one platform.
- No need for a CHANGELOG entry; commit messages are enough.

## Issues

Search existing issues before opening a new one. If your hardware config is new, use the [Hardware / Config template](https://github.com/KaiFelixBennett/hermes-claude-code-local/issues/new?template=hardware_config.md).

## Code of conduct

Be direct, be helpful, don't be a jerk. That's it.
