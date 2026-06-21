@echo off
REM Double-click-friendly wrapper for setup.ps1.
REM Forces ExecutionPolicy Bypass and keeps the window open after the script runs.
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0setup.ps1"
