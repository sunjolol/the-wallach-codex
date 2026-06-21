# setup.ps1 - one-time setup for the Wallach corpus refresh.
# Run once in PowerShell (right-click -> Run as Administrator for Task Scheduler step).
#
#   1. Verifies Python and pip are on PATH.
#   2. Installs yt-dlp via pip (user scope, no admin needed).
#   3. Registers a weekly Windows Task Scheduler job that runs refresh.ps1.
#
# Re-running this script is safe - pip install yt-dlp upgrades, and
# Register-ScheduledTask uses -Force to replace the existing task.

$ErrorActionPreference = "Stop"

$Refresh = Split-Path -Parent $MyInvocation.MyCommand.Path
$RefreshScript = Join-Path $Refresh "refresh.ps1"

Write-Host "=== Wallach corpus refresh - setup ===" -ForegroundColor Cyan
Write-Host "Refresh script: $RefreshScript"

# --- 1. Python check ---
Write-Host ""
Write-Host "[1/3] Checking Python..."
try {
    $pyver = & python --version 2>&1
    Write-Host "  OK: $pyver"
} catch {
    Write-Host "  ERROR: 'python' not on PATH." -ForegroundColor Red
    Write-Host "  Install from https://www.python.org/downloads/ and tick 'Add Python to PATH'."
    exit 1
}

# --- 2. yt-dlp + book + podcast deps ---
Write-Host ""
Write-Host "[2/3] Installing/upgrading Python packages..."
Write-Host "       yt-dlp, pypdf, beautifulsoup4, feedparser, requests"
& python -m pip install --user --upgrade yt-dlp pypdf beautifulsoup4 feedparser requests
if ($LASTEXITCODE -ne 0) {
    Write-Host "  pip install failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Note: book OCR deps (pymupdf, pytesseract, Pillow) are optional - see README."
Write-Host "  Note: podcast transcription deps (openai-whisper + ffmpeg) are optional - see README."

# Verify it's callable. pip --user puts it in %APPDATA%\Python\PythonNN\Scripts,
# which may not be on PATH yet. We'll call it via `python -m yt_dlp` from refresh.ps1
# if direct invocation fails, but first check:
$ytdlpOk = $false
try {
    $ytver = & yt-dlp --version 2>&1
    Write-Host "  OK: yt-dlp $ytver"
    $ytdlpOk = $true
} catch {
    Write-Host "  yt-dlp not on PATH - refresh.ps1 will fall back to 'python -m yt_dlp'."
}

# --- 3. Schedule weekly task ---
Write-Host ""
Write-Host "[3/3] Registering weekly Windows Task Scheduler job..."
$taskName = "WallachCorpusRefresh"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 7am
$action  = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RefreshScript`""
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
try {
    Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Settings $settings -Force | Out-Null
    Write-Host "  OK: scheduled '$taskName' weekly, Sundays 7am."
} catch {
    Write-Host "  Could not register scheduled task: $_" -ForegroundColor Yellow
    Write-Host "  Run this script as Administrator to schedule, or run refresh.ps1 manually."
}

Write-Host ""
Write-Host "Done. Test manually with:" -ForegroundColor Green
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$RefreshScript`""
Write-Host ""
Read-Host "Press Enter to close this window"
