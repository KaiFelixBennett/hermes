@echo off
setlocal

set "CONFIG_PATH=%~dp0hermes_config.yaml"
set "HERMES_BASE_URL=http://127.0.0.1:8080/v1"
set "LITELLM_BASE_URL=http://127.0.0.1:4000/v1"
set "LITELLM_MASTER_KEY=sk-hermes-local"
set "CLAUDE_LOCAL_MODEL=qwen-local-anthropic"
set "HERMES_HELPER_SCRIPT=%~dp0hermes_batch_helper.ps1"
set "LLAMA_SERVER_SCRIPT=%~dp0start_llamacpp.ps1"
set "LITELLM_SERVER_SCRIPT=%~dp0start_litellm.ps1"

call :read_base_url

echo.
echo ========================================
echo   Hermes + Claude Code Local Starter
echo   Hermes: llama.cpp direkt
echo   Claude Code: LiteLLM ^> llama.cpp
echo ========================================
echo.

echo [1/4] Pruefe llama.cpp auf %HERMES_BASE_URL% ...
call :check_llama
if errorlevel 1 (
    if not exist "%LLAMA_SERVER_SCRIPT%" (
        echo     [FEHLER] %LLAMA_SERVER_SCRIPT% wurde nicht gefunden.
        pause
        exit /b 1
    )

    echo     [INFO] Starte llama.cpp im Hintergrund-Fenster ...
    start "llama.cpp Server" powershell -NoExit -ExecutionPolicy Bypass -File "%LLAMA_SERVER_SCRIPT%"

    call :wait_for_llama
    if errorlevel 1 (
        echo     [FEHLER] llama.cpp antwortet weiterhin nicht auf %HERMES_BASE_URL%
        echo     Bitte pruefe das neue Fenster fuer die konkrete Fehlermeldung.
        echo.
        pause
        exit /b 1
    )
)
echo     [OK] llama.cpp laeuft.

echo [2/4] Pruefe LiteLLM auf %LITELLM_BASE_URL% ...
call :check_litellm
if errorlevel 1 (
    if not exist "%LITELLM_SERVER_SCRIPT%" (
        echo     [FEHLER] %LITELLM_SERVER_SCRIPT% wurde nicht gefunden.
        pause
        exit /b 1
    )

    echo     [INFO] Starte LiteLLM im Hintergrund-Fenster ...
    start "LiteLLM Proxy" powershell -NoExit -ExecutionPolicy Bypass -File "%LITELLM_SERVER_SCRIPT%"

    call :wait_for_litellm
    if errorlevel 1 (
        echo     [FEHLER] LiteLLM antwortet weiterhin nicht auf %LITELLM_BASE_URL%
        echo     Bitte pruefe das neue Fenster fuer die konkrete Fehlermeldung.
        echo.
        pause
        exit /b 1
    )
)
echo     [OK] LiteLLM laeuft.

echo [3/4] Starte Hermes Gateway (Telegram) ...
start "Hermes Gateway" cmd /c "wsl -d Ubuntu -- /bin/bash -lc \"HERMES_CLAUDE_USE_LITELLM=1 HERMES_CLAUDE_BASE_URL=http://127.0.0.1:4000 HERMES_CLAUDE_AUTH_TOKEN=%LITELLM_MASTER_KEY% HERMES_CLAUDE_MODEL=%CLAUDE_LOCAL_MODEL% /mnt/c/Users/KaiFe/Desktop/react-sim/hermes_gateway.sh\""

timeout /t 5 /nobreak >nul

echo [4/4] Starte Hermes CLI (interaktiv) ...
echo.
wsl -d Ubuntu -- /bin/bash -lc "HERMES_CLAUDE_USE_LITELLM=1 HERMES_CLAUDE_BASE_URL=http://127.0.0.1:4000 HERMES_CLAUDE_AUTH_TOKEN=%LITELLM_MASTER_KEY% HERMES_CLAUDE_MODEL=%CLAUDE_LOCAL_MODEL% /mnt/c/Users/KaiFe/Desktop/react-sim/hermes_launch.sh"

endlocal
exit /b 0

:read_base_url
if not exist "%HERMES_HELPER_SCRIPT%" exit /b 0
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%HERMES_HELPER_SCRIPT%" -Action GetModelBaseUrl -ConfigPath "%CONFIG_PATH%"`) do set "HERMES_BASE_URL=%%I"
exit /b 0

:check_llama
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERMES_HELPER_SCRIPT%" -Action TestEndpoint -BaseUrl "%HERMES_BASE_URL%"
exit /b %errorlevel%

:check_litellm
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERMES_HELPER_SCRIPT%" -Action TestEndpoint -BaseUrl "%LITELLM_BASE_URL%" -BearerToken "%LITELLM_MASTER_KEY%"
exit /b %errorlevel%

:wait_for_llama
for /L %%N in (1,1,15) do (
    call :check_llama
    if not errorlevel 1 exit /b 0
    timeout /t 2 /nobreak >nul
)
exit /b 1

:wait_for_litellm
for /L %%N in (1,1,15) do (
    call :check_litellm
    if not errorlevel 1 exit /b 0
    timeout /t 2 /nobreak >nul
)
exit /b 1