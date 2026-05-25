# Hermes Agent — Operator Notes

## What Is Hermes Agent?

**Hermes Agent** by [NousResearch](https://github.com/NousResearch/hermes-agent) is a self-improving AI agent with:
- Terminal UI with full TUI (multi-line editing, slash commands, etc.)
- Closed learning loop (learns from experience, builds skills)
- Messaging gateways (Telegram, Discord, Slack, WhatsApp, Signal)
- 74 pre-installed skills
- MCP integration
- Cron scheduler for automated tasks

**GitHub:** https://github.com/NousResearch/hermes-agent (115K+ stars)

---

## Installation (already done on this machine)

The following is installed:
- WSL2 with Ubuntu distribution
- Hermes Agent v0.11.0 in `/root/.hermes/hermes-agent/` (inside WSL)
- Python 3.11.15 virtual environment
- Node.js v22.22.2
- Playwright Chromium browser
- uv package manager
- 74 skills

---

## Configuration

### LLM Provider: llama.cpp (local)

The configuration uses **llama.cpp** as the local LLM provider:

- **Model:** `Qwen3.6-27B-MTP GGUF`
- **Provider:** `custom:local-llama-cpp` (custom endpoint, OpenAI API compatible)
- **Endpoint:** `http://127.0.0.1:8080/v1`
- **API key:** `llama.cpp` (placeholder, ignored for local runs)

**Important:** The `custom:` prefix tells Hermes to use the local OpenAI-compatible endpoint from the `providers:` section. The collision-free provider key in this repo is `local-llama-cpp`, because the bare name `llamacpp` is aliased internally by Hermes to the built-in `custom` provider. The model name must exactly match the id returned by `GET /v1/models`; start llama.cpp with `--alias "Qwen3.6-27B-MTP GGUF"`.

**Config file:** `~/.hermes/config.yaml` (in WSL) — mirrored from `hermes_config.yaml` in this repo at every start.

**Switching models:** To use a different GGUF, change the physical file path under `model.path` and the visible alias under `model.default` in `hermes_config.yaml`. `start_llamacpp.ps1` reads the model path directly from the config; no script edits are required.

**Model profile:** llama.cpp tuning notes for the currently loaded Qwen model are in `docs/models/qwen3.6-27b-mtp-gguf-llamacpp.md`. That file covers context window decisions, Flash Attention, MTP, and the locally validated sampling profile.

### Claude Code via LiteLLM (verified local path)

The verified local Claude Code path on this system is:

`Claude Code -> LiteLLM (/v1/messages on port 4000) -> llama.cpp (/v1/messages on port 8080)`

- **LiteLLM config:** `litellm.proxy.yaml`
- **LiteLLM start:** `./start_litellm.ps1`
- **Proxy key:** `sk-hermes-local`
- **Claude model name:** `qwen-local-anthropic`

Start order:

1. `./start_llamacpp.ps1`
2. `./start_litellm.ps1`
3. Start Claude Code in WSL with the gateway environment variables set

Example:

```bash
cd /mnt/<drive>/<path-to-this-repo>
./claude_local.sh -p 'Reply with exactly OK.' --output-format json
```

A run counts as locally verified only when the JSON output contains `modelUsage.qwen-local-anthropic`.

`claude_local.sh` automatically runs `ensure_claude_local_bridge.sh` first. If LiteLLM is not running on `127.0.0.1:4000`, that script starts the local proxy in WSL and waits until it is ready.

For reproducible benchmarks, use the same wrapper instead of calling `claude` directly with a cloud alias. This avoids silent drift between the benchmark setup and the verified local path. For a reduced prompt surface, the runner can optionally use `CLAUDE_LOCAL_SIMPLE=1 ./claude_local.sh ...`.

**Important:** For Claude Code, LiteLLM must **not** point to llama.cpp as an `openai/...` downstream, because LiteLLM would internally bridge Anthropic requests to the OpenAI responses API. This repo deliberately uses `anthropic/Qwen3.6-27B-MTP GGUF` pointed at `http://127.0.0.1:8080`.

---

## Why Does `127.0.0.1` Work From Inside WSL?

This setup uses **WSL2 mirrored networking** (`~/.wslconfig` on the host):

```ini
[wsl2]
networkingMode=mirrored

[experimental]
hostAddressLoopback=true
```

With this, Windows and WSL share the same network stack, so `localhost:8080` inside WSL is exactly the same as `127.0.0.1:8080` on Windows. No port forwarding, no firewall tweaks, no shifting gateway IPs.

After changing `~/.wslconfig`, run `wsl --shutdown` once to apply.

---

## Starting Hermes Agent

### Step 1: Start llama.cpp

1. Start the llama.cpp server on Windows
2. Load the **Qwen3.6-27B-MTP GGUF** model
3. Expose the OpenAI-compatible server on port `8080`
4. Expose the model under the alias **Qwen3.6-27B-MTP GGUF**

Example:

```powershell
llama-server.exe -m "C:\Models\Qwen3.6-27B-MTP.gguf" --host 0.0.0.0 --port 8080 --ctx-size 98304 --alias "Qwen3.6-27B-MTP GGUF"
```

### Step 2: Start Hermes Agent

Double-click `start_hermes.bat` or run from a terminal:

```bash
wsl -d Ubuntu -- /bin/bash -c "cd /root/.hermes/hermes-agent && source venv/bin/activate && hermes"
```

To use the combined Claude Code path, set the flag in PowerShell once for the session:

```powershell
$env:HERMES_USE_CLAUDE_LITELLM = "1"
./start_hermes.bat
```

Without that flag, `start_hermes.bat` starts Hermes directly against llama.cpp.

### Combined starter for Hermes + local Claude Code

If Hermes should continue talking directly to llama.cpp, but Claude Code from the Hermes `claude-code` skill should automatically route through LiteLLM:

```powershell
./start_hermes_claude_local.bat
```

This starter:

1. Checks or starts `llama.cpp`
2. Checks or starts `LiteLLM`
3. Starts Hermes Gateway
4. Starts the Hermes CLI with `ANTHROPIC_*` variables set for local Claude Code subprocesses

### Optional: Start LiteLLM for Claude Code separately

In a Windows terminal:

```powershell
./start_litellm.ps1
```

### Step 3: Start chatting

In the Hermes Agent terminal:
- Type a message and press Enter
- `/help` for the command list
- `/model` to switch models
- `/skills` to browse available skills

---

## Key Commands

| Command | Description |
|---------|-------------|
| `hermes` | Start the interactive CLI |
| `hermes model` | Choose LLM provider / model |
| `hermes tools` | Configure tools |
| `hermes config set` | Set individual config values |
| `hermes gateway` | Start a messaging gateway |
| `hermes setup` | Run the full setup wizard |
| `hermes update` | Update to the latest version |
| `hermes doctor` | Diagnose problems |

---

## File Locations

| Path | Contents |
|------|----------|
| `/root/.hermes/hermes-agent/` | Hermes Agent installation (in WSL) |
| `/root/.hermes/config.yaml` | Configuration file |
| `/root/.hermes/.env` | API keys and secrets |
| `/root/.hermes/SOUL.md` | Persona / personality file |
| `/root/.hermes/skills/` | All 74 skills |
| `/root/.hermes/MEMORY.md` | Long-term memory |
| `/root/.hermes/USER.md` | User profile |

---

## FAQ

### llama.cpp not reachable?
- Is the llama.cpp server running and bound to **port 8080**?
- Does the model alias match `Qwen3.6-27B-MTP GGUF` exactly?
- Test on Windows: `Invoke-WebRequest http://127.0.0.1:8080/v1/models`
- Test in WSL: `curl http://127.0.0.1:8080/v1/models`
- WSL test fails? Check `~/.wslconfig` (see above) and run `wsl --shutdown`
- Check in WSL: `wsl -d Ubuntu -- ip route` — with mirrored networking this should look like the Windows LAN (e.g. `default via 192.168.x.x`), **not** `172.23.x.x`

### `Unknown provider 'xyz'` or fallback to OpenRouter?
- `provider:` must be `custom:local-llama-cpp`, not just `llamacpp` or `openai`
- There must be a `providers:` section with a `local-llama-cpp:` entry (including `base_url` / `api_key`)
- Verify: `wsl -d Ubuntu -- bash -lc 'source /root/.hermes/hermes-agent/venv/bin/activate; hermes config show'`

### Wrong model or `404` from llama.cpp?
The model name in `hermes_config.yaml` must exactly match the id from `GET /v1/models`. With the recommended start command that is `Qwen3.6-27B-MTP GGUF`.

### Claude Code still reports cloud models or phantom costs?
- For the local gateway path always use `ANTHROPIC_BASE_URL=http://127.0.0.1:4000`, not `OPENAI_API_BASE_URL`
- The JSON output must contain `modelUsage.qwen-local-anthropic`
- `litellm.proxy.yaml` sets model costs to `0.0` locally so Claude Code does not derive cloud costs from the proxy metadata
- If `start_litellm.ps1` is running, check `http://127.0.0.1:4000/v1/models` with `Authorization: Bearer sk-hermes-local`

### Switching models?
Change the model name and provider in `hermes_config.yaml`.

### Using an API key provider instead of local?
Set `provider` to `openrouter`, `anthropic`, etc. in `hermes_config.yaml` and add the API key in `.env`.

---

## Links

- **Documentation:** https://hermes-agent.nousresearch.com/docs/
- **GitHub:** https://github.com/NousResearch/hermes-agent
- **Discord:** https://discord.gg/NousResearch
- **Skills Hub:** https://agentskills.io


## Was ist Hermes Agent?

**Hermes Agent** von [NousResearch](https://github.com/NousResearch/hermes-agent) ist ein selbstverbessernder AI-Agent mit:
- Terminal-UI mit Full TUI (Multi-Line Editing, Slash-Befehlen, etc.)
- Geschlossener Lernzyklus (lernt aus Erfahrungen, erstellt Skills)
- Messaging-Gateways (Telegram, Discord, Slack, WhatsApp, Signal)
- 74 vorinstallierte Skills
- MCP-Integration
- Cron-Scheduler für automatische Aufgaben

**GitHub:** https://github.com/NousResearch/hermes-agent (115K+ Stars)

---

## Installation (bereits erledigt)

Folgendes wurde installiert:
- WSL2 mit Ubuntu Distribution
- Hermes Agent v0.11.0 in `/root/.hermes/hermes-agent/`
- Python 3.11.15 Virtual Environment
- Node.js v22.22.2
- Playwright Chromium Browser
- uv package manager
- 74 Skills

---

## Konfiguration

### LLM Provider: llama.cpp (Lokal)

Die Konfiguration verwendet **llama.cpp** als lokalen LLM-Provider:

- **Model:** `Qwen3.6-27B-MTP GGUF`
- **Provider:** `custom:local-llama-cpp` (Custom-Endpoint, OpenAI-API-kompatibel)
- **Endpoint:** `http://127.0.0.1:8080/v1`
- **API-Key:** `llama.cpp` (Platzhalter, wird lokal ignoriert)

**Wichtig:** Der `custom:`-Prefix sorgt dafuer, dass Hermes exakt den lokalen OpenAI-kompatiblen Endpoint aus deiner `providers:`-Section verwendet. In diesem Repo ist der kollisionsfreie Provider-Key `local-llama-cpp`, weil der rohe Name `llamacpp` intern von Hermes auf den eingebauten Provider `custom` aliasiert wird. Der Modellname muss exakt der id aus `GET /v1/models` entsprechen; starte llama.cpp deshalb am besten mit `--alias "Qwen3.6-27B-MTP GGUF"`.

**Config-Datei:** `~/.hermes/config.yaml` (in WSL) — wird bei jedem Start aus `hermes_config.yaml` im Repo gespiegelt.

**Modellwechsel:** Aendere fuer einen anderen GGUF in `hermes_config.yaml` den physischen Dateipfad unter `model.path` und den sichtbaren Alias unter `model.default`. `start_llamacpp.ps1` liest den Modellpfad jetzt direkt aus der Config; ein PowerShell-Edit ist dafuer nicht mehr noetig.

**Modellprofil:** Die konkreten llama.cpp-Tuning-Notizen fuer das aktuell verwendete Qwen-Modell stehen in `docs/models/qwen3.6-27b-mtp-gguf-llamacpp.md`. Dort sind sowohl die offiziellen Qwen/Unsloth-Empfehlungen als auch die lokal validierten Findings zu Kontextfenster, Flash Attention und MTP festgehalten.

### Claude Code via LiteLLM (verifizierter Pfad)

Der auf diesem System verifizierte lokale Claude-Code-Pfad ist:

`Claude Code -> LiteLLM (/v1/messages auf 4000) -> llama.cpp (/v1/messages auf 8080)`

- **LiteLLM Config:** `litellm.proxy.yaml`
- **LiteLLM Start:** `./start_litellm.ps1`
- **Proxy-Key:** `sk-hermes-local`
- **Claude-Modellname:** `qwen-local-anthropic`

Startreihenfolge:

1. `./start_llamacpp.ps1`
2. `./start_litellm.ps1`
3. Claude Code in WSL mit den Gateway-Env-Variablen starten

Beispiel:

```bash
cd /mnt/<drive>/<path-to-this-repo>
./claude_local.sh -p 'Reply with exactly OK.' --output-format json
```

Der Lauf gilt nur dann als lokal verifiziert, wenn im JSON-Output `modelUsage.qwen-local-anthropic` erscheint.

`claude_local.sh` fuehrt davor automatisch `ensure_claude_local_bridge.sh` aus. Wenn LiteLLM auf `127.0.0.1:4000` nicht laeuft, startet das Skript den lokalen Proxy in WSL selbststaendig und wartet auf die Bereitschaft.

Fuer reproduzierbare Benchmarks sollte der Runner denselben Wrapper benutzen statt `claude` direkt mit einem Cloud-Alias aufzurufen. Das vermeidet stilles Drift zwischen Benchmark-Setup und dem hier verifizierten lokalen Pfad. Fuer reduzierte Prompts kann der Runner optional `CLAUDE_LOCAL_SIMPLE=1 ./claude_local.sh ...` verwenden.

Wichtig: Fuer Claude Code darf LiteLLM hier **nicht** als `openai/...`-Downstream auf llama.cpp zeigen, weil LiteLLM Anthropic-Requests sonst intern auf OpenAI `responses` bridged. Das Repo nutzt deshalb bewusst `anthropic/Qwen3.6-27B-MTP GGUF` gegen `http://127.0.0.1:8080`.

### Warum geht `127.0.0.1` aus WSL?

Dieses Setup verwendet **WSL2 Mirrored Networking** (`~/.wslconfig` auf dem Host):

```ini
[wsl2]
networkingMode=mirrored

[experimental]
hostAddressLoopback=true
```

Damit teilen sich Windows und WSL den Netzwerk-Stack, also ist `localhost:8080` aus WSL genau das `127.0.0.1:8080` von Windows. Kein Port-Forwarding, keine Firewall-Frickelei, keine wechselnden Gateway-IPs.

Nach Aenderungen an `~/.wslconfig` einmal `wsl --shutdown` ausfuehren.

---

## So startest du Hermes Agent

### Schritt 1: llama.cpp starten

1. llama.cpp Server auf Windows starten
2. Das GGUF-Modell **Qwen3.6-27B-MTP GGUF** laden
3. Den OpenAI-kompatiblen Server auf Port `8080` freigeben
4. Das Modell mit Alias **Qwen3.6-27B-MTP GGUF** exponieren

Beispiel:

```powershell
llama-server.exe -m "C:\Models\Qwen3.6-27B-MTP.gguf" --host 0.0.0.0 --port 8080 --ctx-size 98304 --alias "Qwen3.6-27B-MTP GGUF"
```

### Schritt 2: Hermes Agent starten

Doppelklick auf `start_hermes.bat` ODER im Terminal:

```bash
wsl -d Ubuntu -- /bin/bash -c "cd /root/.hermes/hermes-agent && source venv/bin/activate && hermes"
```

Wenn `start_hermes.bat` den kombinierten Claude-Code-Pfad nutzen soll, setze davor in PowerShell einmalig fuer die Session:

```powershell
$env:HERMES_USE_CLAUDE_LITELLM = "1"
./start_hermes.bat
```

Ohne dieses Env-Flag bleibt `start_hermes.bat` beim bisherigen direkten Hermes-Start gegen llama.cpp.

### Kombinierter Starter fuer Hermes + Claude Code lokal

Wenn Hermes selbst weiter direkt gegen llama.cpp laufen soll, Claude Code aus dem Hermes-`claude-code`-Skill aber automatisch ueber LiteLLM gehen soll, nutze:

```powershell
./start_hermes_claude_local.bat
```

Dieser Starter:

1. prueft oder startet `llama.cpp`
2. prueft oder startet `LiteLLM`
3. startet Hermes Gateway
4. startet Hermes CLI mit gesetzten `ANTHROPIC_*`-Variablen fuer lokale Claude-Code-Subprozesse

### Optional: LiteLLM fuer Claude Code starten

Im Windows-Terminal:

```powershell
./start_litellm.ps1
```

### Schritt 3: Chat starten

Im Hermes Agent Terminal:
- Einfach eine Nachricht eingeben und Enter drücken
- `/help` fuer Befehlsliste
- `/model` zum Model wechseln
- `/skills` zum Browsen der Skills

---

## Wichtige Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `hermes` | Interaktive CLI starten |
| `hermes model` | LLM Provider/Model waehlen |
| `hermes tools` | Tools konfigurieren |
| `hermes config set` | Einzelne Config-Werte setzen |
| `hermes gateway` | Messaging-Gateway starten |
| `hermes setup` | Komplettes Setup-Wizard |
| `hermes update` | Auf neueste Version aktualisieren |
| `hermes doctor` | Probleme diagnostizieren |

---

## Wo liegt was?

| Pfad | Inhalt |
|------|--------|
| `/root/.hermes/hermes-agent/` | Hermes Agent Installation (in WSL) |
| `/root/.hermes/config.yaml` | Konfigurationsdatei |
| `/root/.hermes/.env` | API-Keys und Secrets |
| `/root/.hermes/SOUL.md` | Persona/Personality Datei |
| `/root/.hermes/skills/` | Alle 74 Skills |
| `/root/.hermes/MEMORY.md` | Langzeit-Gedaechtnis |
| `/root/.hermes/USER.md` | Benutzerprofil |

---

## FAQ

### llama.cpp nicht erreichbar?
- llama.cpp Server gestartet und auf **Port 8080** gebunden?
- Stimmt der Modell-Alias mit `Qwen3.6-27B-MTP GGUF` ueberein?
- Test auf Windows: `Invoke-WebRequest http://127.0.0.1:8080/v1/models`
- Test in WSL: `curl http://127.0.0.1:8080/v1/models`
- Schlaegt der WSL-Test fehl? Pruefe `~/.wslconfig` (siehe oben) und `wsl --shutdown`
- Pruefe in WSL: `wsl -d Ubuntu -- ip route` — bei mirrored networking sieht das aus wie das Windows-LAN (z.B. `default via 192.168.x.x`), NICHT mehr `172.23.x.x`

### `Unknown provider 'xyz'` oder Fallback auf OpenRouter?
- `provider:` muss `custom:local-llama-cpp` lauten, nicht nur `llamacpp` oder `openai`
- Es muss eine `providers:`-Section mit Eintrag `local-llama-cpp:` (inkl. `base_url`/`api_key`) geben
- Prüfen: `wsl -d Ubuntu -- bash -lc 'source /root/.hermes/hermes-agent/venv/bin/activate; hermes config show'`

### Falsches Modell oder `404` von llama.cpp?
Der Modellname in `hermes_config.yaml` muss exakt der id aus `GET /v1/models` entsprechen. Mit dem empfohlenen Startkommando ist das `Qwen3.6-27B-MTP GGUF`.

### Claude Code meldet weiter Cloud-Modelle oder Fantasiekosten?
- Fuer den lokalen Gateway-Pfad immer `ANTHROPIC_BASE_URL=http://127.0.0.1:4000` verwenden, nicht direkt `OPENAI_API_BASE_URL`
- Im JSON-Output muss `modelUsage.qwen-local-anthropic` auftauchen
- `litellm.proxy.yaml` setzt die Modellkosten lokal auf `0.0`, damit Claude Code keine Cloud-Kosten aus der Proxy-Metadatenbank ableitet
- Wenn `start_litellm.ps1` laeuft, pruefe `http://127.0.0.1:4000/v1/models` mit `Authorization: Bearer sk-hermes-local`

### Model wechseln?
In `config.yaml` den Model-Namen und Provider anpassen.

### API-Key Provider statt lokal?
In `config.yaml` provider auf `openrouter`, `anthropic`, etc. setzen und API-Key in `.env` konfigurieren.

---

## Links

- **Dokumentation:** https://hermes-agent.nousresearch.com/docs/
- **GitHub:** https://github.com/NousResearch/hermes-agent
- **Discord:** https://discord.gv/NousResearch
- **Skills Hub:** https://agentskills.io