@echo off
REM Double-click-friendly wrapper for refresh.ps1.
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0refresh.ps1"
