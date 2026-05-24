@echo off
setlocal

set "CONFIG_PATH=%~dp0hermes_config.yaml"
set "HERMES_BASE_URL=http://127.0.0.1:8080/v1"
set "HERMES_HELPER_SCRIPT=%~dp0hermes_batch_helper.ps1"
set "LLAMA_SERVER_SCRIPT=%~dp0start_llamacpp.ps1"
set "COMBINED_STARTER=%~dp0start_hermes_claude_local.bat"

if /I "%HERMES_USE_CLAUDE_LITELLM%"=="1" goto :run_combined
if /I "%HERMES_USE_CLAUDE_LITELLM%"=="true" goto :run_combined

call :read_base_url

echo.
echo ========================================
echo   Hermes Agent Startskript
echo   Provider: llama.cpp (Qwen3.6-27B-MTP GGUF)
echo ========================================
echo.

REM --- 1) llama.cpp/OpenAI-Endpoint auf Windows-Localhost pruefen ---
echo [1/3] Pruefe llama.cpp auf %HERMES_BASE_URL% ...
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

REM --- 2) Gateway im Hintergrund starten (Telegram) ---
echo [2/3] Starte Hermes Gateway (Telegram) ...
start "Hermes Gateway" cmd /c "wsl -d Ubuntu -- /bin/bash /mnt/c/Users/KaiFe/Desktop/react-sim/hermes_gateway.sh"

REM Kurze Pause damit der Gateway hochkommt
timeout /t 5 /nobreak >nul

REM --- 3) Interaktiven CLI starten ---
echo [3/3] Starte Hermes CLI (interaktiv) ...
echo.
wsl -d Ubuntu -- /bin/bash /mnt/c/Users/KaiFe/Desktop/react-sim/hermes_launch.sh

endlocal
exit /b 0

:run_combined
if not exist "%COMBINED_STARTER%" (
    echo [FEHLER] %COMBINED_STARTER% wurde nicht gefunden.
    pause
    exit /b 1
)

call "%COMBINED_STARTER%"
endlocal
exit /b %errorlevel%

:read_base_url
if not exist "%HERMES_HELPER_SCRIPT%" exit /b 0
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%HERMES_HELPER_SCRIPT%" -Action GetModelBaseUrl -ConfigPath "%CONFIG_PATH%"`) do set "HERMES_BASE_URL=%%I"
exit /b 0

:check_llama
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERMES_HELPER_SCRIPT%" -Action TestEndpoint -BaseUrl "%HERMES_BASE_URL%"
exit /b %errorlevel%

:wait_for_llama
for /L %%N in (1,1,15) do (
    call :check_llama
    if not errorlevel 1 exit /b 0
    timeout /t 2 /nobreak >nul
)
exit /b 1
