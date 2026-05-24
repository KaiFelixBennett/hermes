# Hermes Agent - Einrichtung auf diesem System

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
cd /mnt/c/Users/KaiFe/Desktop/react-sim
env \
	ANTHROPIC_BASE_URL=http://127.0.0.1:4000 \
	ANTHROPIC_AUTH_TOKEN=sk-hermes-local \
	ANTHROPIC_MODEL=qwen-local-anthropic \
	ANTHROPIC_CUSTOM_MODEL_OPTION=qwen-local-anthropic \
	claude -p 'Reply with exactly OK.' --output-format json --max-turns 1
```

Der Lauf gilt nur dann als lokal verifiziert, wenn im JSON-Output `modelUsage.qwen-local-anthropic` erscheint.

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