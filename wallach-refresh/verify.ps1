# verify.ps1 - sanity-check that setup worked.
# Safe to run as a normal user (no admin needed for read-only checks).

$ErrorActionPreference = "Continue"

Write-Host "=== Wallach refresh - verification ===" -ForegroundColor Cyan
Write-Host ""

# 1. Python
Write-Host "[1] Python on PATH:"
try {
    $v = & python --version 2>&1
    Write-Host "    OK - $v" -ForegroundColor Green
} catch {
    Write-Host "    MISSING - install Python and tick 'Add to PATH'" -ForegroundColor Red
}

# 2. yt-dlp - try direct, then python module
Write-Host ""
Write-Host "[2] yt-dlp installed:"
$ytOk = $false
try {
    $v = & yt-dlp --version 2>&1
    Write-Host "    OK on PATH - $v" -ForegroundColor Green
    $ytOk = $true
} catch {
    try {
        $v = & python -m yt_dlp --version 2>&1
        Write-Host "    OK via 'python -m yt_dlp' - $v" -ForegroundColor Yellow
        Write-Host "    (yt-dlp script dir isn't on PATH but the module works.)"
        $ytOk = $true
    } catch {
        Write-Host "    MISSING - re-run setup.ps1 to install" -ForegroundColor Red
    }
}

# 3. Scheduled task
Write-Host ""
Write-Host "[3] Windows Task Scheduler job 'WallachCorpusRefresh':"
$task = Get-ScheduledTask -TaskName "WallachCorpusRefresh" -ErrorAction SilentlyContinue
if ($task) {
    $info = Get-ScheduledTaskInfo -TaskName "WallachCorpusRefresh"
    Write-Host "    OK - state: $($task.State), next run: $($info.NextRunTime)" -ForegroundColor Green
} else {
    Write-Host "    NOT REGISTERED - re-run setup.ps1 as Administrator" -ForegroundColor Red
}

# 4. Folder structure
Write-Host ""
Write-Host "[4] Folder structure:"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
foreach ($sub in @("transcripts", "knowledge", "knowledge\transcripts-clean", "wallach-refresh", "wallach-refresh\logs")) {
    $p = Join-Path $root $sub
    if (Test-Path $p) {
        $n = (Get-ChildItem $p -ErrorAction SilentlyContinue | Measure-Object).Count
        Write-Host "    OK - $sub ($n entries)" -ForegroundColor Green
    } else {
        Write-Host "    MISSING - $sub" -ForegroundColor Yellow
    }
}

# 5. Quick smoke: search yt-dlp for one result, print title only, no download
if ($ytOk) {
    Write-Host ""
    Write-Host "[5] Live yt-dlp smoke test (1 result, no download):"
    $cmd = if (Get-Command yt-dlp -ErrorAction SilentlyContinue) { "yt-dlp" } else { "python -m yt_dlp" }
    & cmd /c "$cmd --skip-download --no-warnings --print '%(id)s | %(title)s' 'ytsearch1:Dr Joel Wallach'"
}

Write-Host ""
Read-Host "Press Enter to close this window"
