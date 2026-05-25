@echo off
setlocal

set "REPO_ROOT_WIN=%~dp0"
set "CONFIG_PATH=%~dp0hermes_config.yaml"
set "HERMES_BASE_URL=http://127.0.0.1:8080/v1"
set "LITELLM_BASE_URL=http://127.0.0.1:4000/v1"
set "LITELLM_MASTER_KEY=sk-hermes-local"
set "CLAUDE_LOCAL_MODEL=qwen-local-anthropic"
set "HERMES_REPO_WSL="
set "HERMES_HELPER_SCRIPT=%~dp0hermes_batch_helper.ps1"
set "LLAMA_SERVER_SCRIPT=%~dp0start_llamacpp.ps1"
set "LITELLM_SERVER_SCRIPT=%~dp0start_litellm.ps1"

set "REPO_WIN_NOTRAIL=%REPO_ROOT_WIN:~0,-1%"
for /f "delims=" %%P in ('wsl wslpath -u "%REPO_WIN_NOTRAIL%"') do set "HERMES_REPO_WSL=%%P"
if "%HERMES_REPO_WSL%"=="" (
    echo [ERROR] Could not resolve WSL path for this repository.
    echo         Make sure WSL2 is installed with at least one Linux distribution.
    pause
    exit /b 1
)

call :read_base_url

echo.
echo ========================================
echo   Hermes + Claude Code Local Starter
echo   Hermes: llama.cpp direct
echo   Claude Code: LiteLLM ^> llama.cpp
echo ========================================
echo.

echo [1/4] Checking llama.cpp on %HERMES_BASE_URL% ...
call :check_llama
if errorlevel 1 (
    if not exist "%LLAMA_SERVER_SCRIPT%" (
        echo     [ERROR] %LLAMA_SERVER_SCRIPT% was not found.
        pause
        exit /b 1
    )

    echo     [INFO] Starting llama.cpp in a background window ...
    start "llama.cpp Server" powershell -NoExit -ExecutionPolicy Bypass -File "%LLAMA_SERVER_SCRIPT%"

    call :wait_for_llama
    if errorlevel 1 (
        echo     [ERROR] llama.cpp is still not responding at %HERMES_BASE_URL%
        echo     Check the new window for the detailed error message.
        echo.
        pause
        exit /b 1
    )
)
echo     [OK] llama.cpp is running.

echo [2/4] Checking LiteLLM on %LITELLM_BASE_URL% ...
call :check_litellm
if errorlevel 1 (
    if not exist "%LITELLM_SERVER_SCRIPT%" (
        echo     [ERROR] %LITELLM_SERVER_SCRIPT% was not found.
        pause
        exit /b 1
    )

    echo     [INFO] Starting LiteLLM in a background window ...
    start "LiteLLM Proxy" powershell -NoExit -ExecutionPolicy Bypass -File "%LITELLM_SERVER_SCRIPT%"

    call :wait_for_litellm
    if errorlevel 1 (
        echo     [ERROR] LiteLLM is still not responding at %LITELLM_BASE_URL%
        echo     Check the new window for the detailed error message.
        echo.
        pause
        exit /b 1
    )
)
echo     [OK] LiteLLM is running.

echo [3/4] Starting Hermes Gateway (Telegram) ...
start "Hermes Gateway" cmd /k "wsl -d Ubuntu -- /bin/bash -lc "HERMES_CLAUDE_USE_LITELLM=1 HERMES_CLAUDE_BASE_URL=http://127.0.0.1:4000 HERMES_CLAUDE_AUTH_TOKEN=%LITELLM_MASTER_KEY% HERMES_CLAUDE_MODEL=%CLAUDE_LOCAL_MODEL% %HERMES_REPO_WSL%/hermes_gateway.sh""

timeout /t 5 /nobreak >nul

echo [4/4] Starting Hermes CLI (interactive) ...
echo.
wsl -d Ubuntu -- /bin/bash -lc "HERMES_CLAUDE_USE_LITELLM=1 HERMES_CLAUDE_BASE_URL=http://127.0.0.1:4000 HERMES_CLAUDE_AUTH_TOKEN=%LITELLM_MASTER_KEY% HERMES_CLAUDE_MODEL=%CLAUDE_LOCAL_MODEL% %HERMES_REPO_WSL%/hermes_launch.sh"

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