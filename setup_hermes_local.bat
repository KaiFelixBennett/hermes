@echo off
setlocal

powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0setup_hermes_local.ps1"

endlocal
