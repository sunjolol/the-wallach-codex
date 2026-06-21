# Wallach corpus refresh

Self-maintaining pipeline. Pulls new Dr. Joel Wallach YouTube captions weekly,
classifies them, and updates the manifest used by the Wallach-framework agent.

## What it does

1. **`refresh.ps1`** — runs `yt-dlp` against:
   - A broad YouTube search for "Dr Joel Wallach" (top 50 results)
   - The channels listed in `channels.txt` (most recent 25 uploads each)

   Only English captions are pulled, no video. Videos under 60 seconds are
   filtered out. `downloaded.txt` is yt-dlp's archive of what's already been
   fetched, so re-runs only pull genuinely new material.

2. **`ingest.py`** — runs automatically after the pull:
   - Identifies new `.vtt` files (anything not already in `manifest.csv`)
   - Classifies each into **High** / **Moderate** / **Low** / **Exclude** using
     filename heuristics plus a content-peek for Wallach signature phrases
   - Cleans VTT into plain text in `knowledge/transcripts-clean/`
   - Updates `knowledge/manifest.csv`, `knowledge/topic-index.json`,
     `knowledge/triage-summary.md`
   - Appends a dated entry to `knowledge/corpus-changelog.md`

## Install (one time)

Open PowerShell **as Administrator** in this folder and run:

```powershell
.\setup.ps1
```

That installs `yt-dlp` and registers a Windows Task Scheduler job to run
`refresh.ps1` every Sunday at 7am.

If you don't want the scheduled task, run setup as a normal user — it installs
yt-dlp, prints a warning on the task step, and you can invoke `refresh.ps1`
manually whenever you want.

## Manual run

```powershell
powershell -ExecutionPolicy Bypass -File .\refresh.ps1
```

The script logs to `logs/run-YYYYMMDD-HHMMSS.log`.

## Tuning

- **Add channels:** edit `channels.txt`. One per line, comments with `#`. Any
  URL `yt-dlp` accepts works — channel handles (`@HandleName`), full channel
  URLs, playlists.
- **Change search breadth:** edit `refresh.ps1`, line with `ytsearch50` — bump
  to `ytsearch100`, etc.
- **Change minimum duration:** edit `refresh.ps1`, the `duration >= 60` filter.
- **Change cadence:** in Task Scheduler, edit the `WallachCorpusRefresh` task's
  trigger.

## Reset / re-classify everything

If you want to re-run the classifier on the existing corpus (e.g. after
tightening the classifier rules), delete `knowledge/manifest.csv` and run
`python ingest.py`. It will rebuild from every file in `transcripts/`.

## Books (one-shot ingest)

Drop PDF or EPUB files into `knowledge/wallach-books/` and run:

```powershell
python ingest_books.py
```

Books are auto-classified as **High** confidence (Wallach-authored, no
attribution problem). Extracted text lands in `knowledge/books-clean/<stem>.txt`
with a `<stem>.pages.json` (PDF) or `<stem>.chapters.json` (EPUB) index for
citation. Each book gets one row in `manifest.csv`.

To re-process every book (e.g., after improving a book file or changing the
extractor): `python ingest_books.py --rebuild`

### OCR for scanned PDFs

If a PDF has only page-image content (no real text layer), `ingest_books.py`
detects this automatically (< 50 words/page across 20+ pages) and falls back to
OCR. The two scanned books that came with this corpus (*Let's Play Doctor*,
*Rare Earths Forbidden Cures*) trigger this path.

To use OCR you need three things on Windows:

1. **Tesseract binary** (one-time install, requires admin):
   ```powershell
   winget install UB-Mannheim.TesseractOCR
   ```
2. **Python bindings + PDF rendering** (user-scope install):
   ```powershell
   python -m pip install --user pymupdf pytesseract Pillow
   ```
3. Re-run with the `--rebuild` flag to re-OCR books already in the manifest:
   ```powershell
   python ingest_books.py --rebuild
   ```

Time estimate: ~1-3 seconds per page on a modern CPU. The two scanned books
(742 pages total) should finish in 15-40 minutes.

Override flags:
- `--ocr-all` — force OCR on every PDF, even text PDFs (use if a text PDF
  extraction is garbled).
- `--no-ocr` — skip OCR even on scanned books (keep only the text-layer pull).

## Podcast: Dead Doctors Don't Lie Radio (one-shot ingest)

The DDDL Radio show on KSCO AM 1080 ran for years and ended around May 2023.
Genesis Communications Network hosts the RSS feed; the actual MP3s live on
shows.zbsradio.com. Pulling the archive is a four-step manual process.

### One-time dependencies

```powershell
python -m pip install --user feedparser requests openai-whisper
winget install Gyan.FFmpeg
```

After ffmpeg installs, close and reopen your PowerShell window so it picks up
the new PATH. Verify with `ffmpeg -version`.

If you don't have winget, download an ffmpeg Windows build from
https://www.gyan.dev/ffmpeg/builds/ and put `ffmpeg.exe` somewhere on PATH.

### Stage 1 - Build the episode index

```powershell
python podcast_index.py --pilot 10
```

Fetches the RSS feed, writes `knowledge/podcast-episodes.json` (every episode)
and `knowledge/podcast-pilot.json` (10 most recent). For the full archive,
re-run later without `--pilot`.

### Stage 2 - Download MP3s

```powershell
python podcast_download.py            # pilot set (10 episodes ~250 MB)
python podcast_download.py --full     # entire archive (~2,400 episodes, ~60 GB)
python podcast_download.py --dry-run  # show what would download, don't fetch
```

### Stage 3 - Transcribe with Whisper

```powershell
python podcast_transcribe.py                  # default model: small.en
python podcast_transcribe.py --model base.en  # faster, lower accuracy
python podcast_transcribe.py --limit 1        # just one file (smoke test)
```

First run downloads the Whisper model (~150MB for small.en up to ~3GB for
large-v3). Pilot of 10 episodes on CPU typically takes 1-3 hours total.

### Stage 4 - Ingest into manifest

```powershell
python ingest_podcast.py
```

Adds one row per transcript to `manifest.csv` as **Moderate** confidence
(Wallach with co-host Doug Winfrey). Topic-indexed alongside the YouTube
transcripts and books.

### Going to full archive

After validating the pilot, scale up:

```powershell
python podcast_index.py             # re-fetch full episode list (no --pilot)
python podcast_download.py --full   # 60GB download
python podcast_transcribe.py        # weeks of CPU - run in background
python ingest_podcast.py
```

## Limits

- YouTube auto-captions are messy. Speaker tags are absent, names get
  mis-transcribed, and long videos drift in quality. The classifier marks
  co-speaker files as Moderate so the agent attributes them carefully.
- Some Wallach uploads have no English captions; those are skipped silently.
- Channel handles change. If a channel in `channels.txt` 404s, yt-dlp logs the
  error and moves on — but you should periodically verify the channel list.
