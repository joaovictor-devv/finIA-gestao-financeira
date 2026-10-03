@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Iniciar-FinIA.ps1"
if errorlevel 1 pause
endlocal
