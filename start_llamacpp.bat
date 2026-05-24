@echo off
setlocal

powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0start_llamacpp.ps1"

endlocal