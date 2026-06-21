# refresh.ps1 - pull new Wallach YouTube captions, then triage them.
# Runs on Windows. Requires yt-dlp and Python on PATH. See setup.ps1.

# Continue, not Stop: yt-dlp writes progress chatter to stderr, and 'Stop' would
# convert the first stderr line into a terminating error and kill the run. We check
# $LASTEXITCODE explicitly where exit codes matter.
$ErrorActionPreference = "Continue"

# Locate root: this script's parent folder is /wallach-refresh, root is one level up.
$Refresh     = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root        = Split-Path -Parent $Refresh
$Transcripts = Join-Path $Root "transcripts"
$Archive     = Join-Path $Refresh "downloaded.txt"
$Blocklist   = Join-Path $Refresh "blocklist.txt"
$Channels    = Join-Path $Refresh "channels.txt"
$LogDir      = Join-Path $Refresh "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$RunLog      = Join-Path $LogDir ("run-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))

function Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $msg
    Write-Host $line
    Add-Content -Path $RunLog -Value $line
}

Log "=== Wallach corpus refresh started ==="
Log "Root: $Root"
Log "Transcripts dir: $Transcripts"

# Merge blocklist.txt into the yt-dlp archive so junk videos are never
# re-downloaded. Each line in blocklist.txt is either a bare YouTube ID or a
# "youtube <id>" archive line. We append the canonical "youtube <id>" form
# to downloaded.txt if it's not already there.
if (Test-Path $Blocklist) {
    $existing = @{}
    if (Test-Path $Archive) {
        Get-Content $Archive | ForEach-Object { $existing[$_.Trim()] = $true }
    }
    $blockedAdded = 0
    Get-Content $Blocklist | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        $parts = $line -split '\s+'
        $id = $parts[-1]
        $entry = "youtube $id"
        if (-not $existing.ContainsKey($entry)) {
            Add-Content -Path $Archive -Value $entry
            $existing[$entry] = $true
            $blockedAdded++
        }
    }
    if ($blockedAdded -gt 0) {
        Log "Merged $blockedAdded blocklist ID(s) into yt-dlp archive"
    }
}

# Pre-state: what files exist before we pull?
$preFiles = @(Get-ChildItem -Path $Transcripts -Filter *.vtt -ErrorAction SilentlyContinue).Name
Log "Files before pull: $($preFiles.Count)"

# Shared yt-dlp options. We pull ONLY captions, never video.
$YtArgs = @(
    "--download-archive", $Archive,
    "--skip-download",
    "--write-auto-subs", "--write-subs", "--sub-lang", "en",
    "--sub-format", "vtt", "--convert-subs", "vtt",
    "--match-filter", "duration >= 60",
    "--ignore-errors", "--no-warnings", "--no-overwrites",
    "-o", (Join-Path $Transcripts "%(title)s-%(id)s.%(ext)s")
)

# Decide how to invoke yt-dlp: direct binary if on PATH, otherwise module.
$YtDlpDirect = $null -ne (Get-Command yt-dlp -ErrorAction SilentlyContinue)
if ($YtDlpDirect) {
    Log "yt-dlp invocation: direct (on PATH)"
} else {
    Log "yt-dlp invocation: python -m yt_dlp (binary not on PATH)"
}

function Invoke-YtDlp {
    param([string[]]$YtDlpArgs)
    # Merge stderr into stdout via 2>&1, then funnel through Out-String to keep
    # PowerShell from re-promoting stderr lines to its error stream.
    if ($YtDlpDirect) {
        $output = & yt-dlp @YtDlpArgs 2>&1 | Out-String
    } else {
        $output = & python -m yt_dlp @YtDlpArgs 2>&1 | Out-String
    }
    if ($output) {
        Add-Content -Path $RunLog -Value $output
        Write-Host $output
    }
    if ($LASTEXITCODE -ne 0) {
        Log "  (yt-dlp exit code: $LASTEXITCODE - continuing)"
    }
}

# 1. Broad searches - "Dr Joel Wallach" + "Dead Doctors Don't Lie"
Log "--- Broad search 1: ytsearch50 'Dr Joel Wallach' ---"
Invoke-YtDlp ($YtArgs + @("ytsearch50:Dr Joel Wallach"))

Log "--- Broad search 2: ytsearch50 'Dead Doctors Don't Lie' ---"
Invoke-YtDlp ($YtArgs + @("ytsearch50:Dead Doctors Don't Lie"))

# 2. Channels - pull most recent 25 uploads per channel from channels.txt
if (Test-Path $Channels) {
    Log "--- Channel pulls (most recent 25 per channel) ---"
    Get-Content $Channels | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            Log "Channel: $line"
            Invoke-YtDlp ($YtArgs + @("--playlist-end", "25", $line))
        }
    }
} else {
    Log "channels.txt not found - skipping channel pulls"
}

# Post-state: what's new?
$postFiles = @(Get-ChildItem -Path $Transcripts -Filter *.vtt -ErrorAction SilentlyContinue).Name
$newFiles  = $postFiles | Where-Object { $preFiles -notcontains $_ }
Log "Files after pull: $($postFiles.Count)"
Log "New files this run: $($newFiles.Count)"

if ($newFiles.Count -gt 0) {
    $newFiles | ForEach-Object { Log "  + $_" }
    Log "--- Running ingest.py to classify and index ---"
    $ingest = Join-Path $Refresh "ingest.py"
    & python $ingest 2>&1 | Tee-Object -FilePath $RunLog -Append
} else {
    Log "Nothing new to ingest. Done."
}

Log "=== Refresh finished ==="
