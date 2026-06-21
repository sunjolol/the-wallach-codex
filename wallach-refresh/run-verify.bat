@echo off
REM Double-click-friendly wrapper for verify.ps1.
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0verify.ps1"
