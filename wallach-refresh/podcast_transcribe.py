"""
podcast_transcribe.py - transcribe MP3s in knowledge/podcast-audio/ using
openai-whisper (the local Python package, not the cloud API).

Each MP3 yields a .txt file in knowledge/podcast-transcripts/. Existing
transcripts are skipped.

Default model: "small.en" - 488MB, good accuracy/speed balance for English
talk radio. Override with --model {tiny.en, base.en, small.en, medium.en,
large-v3}.

Usage:
  python podcast_transcribe.py                  # transcribe everything new
  python podcast_transcribe.py --model base.en  # faster, lower accuracy
  python podcast_transcribe.py --limit 3        # only first 3 files (testing)

Requires:
  python -m pip install --user openai-whisper
  ffmpeg on PATH (winget install Gyan.FFmpeg, then close and reopen PowerShell)
"""

import re
import shutil
import subprocess
import sys
import time
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
KNOWLEDGE = ROOT / "knowledge"
AUDIO_DIR = KNOWLEDGE / "podcast-audio"
TRANSCRIPT_DIR = KNOWLEDGE / "podcast-transcripts"
TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)


def have(cmd):
    return shutil.which(cmd) is not None


def parse_args():
    model = "small.en"
    limit = None
    if "--model" in sys.argv:
        i = sys.argv.index("--model")
        if i + 1 < len(sys.argv):
            model = sys.argv[i + 1]
    if "--limit" in sys.argv:
        i = sys.argv.index("--limit")
        if i + 1 < len(sys.argv):
            try:
                limit = int(sys.argv[i + 1])
            except ValueError:
                print("ERROR: --limit expects an integer")
                sys.exit(1)
    return model, limit


def main():
    model, limit = parse_args()

    # Preflight checks
    if not have("ffmpeg"):
        print("ERROR: ffmpeg not on PATH.")
        print("  Install: winget install Gyan.FFmpeg")
        print("  Then close this PowerShell window and open a new one.")
        sys.exit(1)
    try:
        import whisper  # noqa: F401
    except ImportError:
        print("ERROR: openai-whisper not installed.")
        print("  Install: python -m pip install --user openai-whisper")
        sys.exit(1)

    mp3s = sorted(AUDIO_DIR.glob("*.mp3"))
    if not mp3s:
        print(f"No MP3s in {AUDIO_DIR}. Run podcast_download.py first.")
        return

    to_do = [p for p in mp3s if not (TRANSCRIPT_DIR / f"{p.stem}.txt").exists()]
    print(f"{len(mp3s)} MP3s found, {len(to_do)} need transcription.")
    if limit:
        to_do = to_do[:limit]
        print(f"--limit {limit}: processing only {len(to_do)} files")

    if not to_do:
        return

    print(f"Model: {model}  (first run will download ~150MB to ~1.5GB)")
    print()

    # Lazy-load Whisper model
    import whisper
    t0 = time.time()
    print(f"Loading Whisper model '{model}'...")
    wmodel = whisper.load_model(model)
    print(f"  loaded in {time.time()-t0:.1f}s")

    for i, mp3 in enumerate(to_do, 1):
        out = TRANSCRIPT_DIR / f"{mp3.stem}.txt"
        print(f"[{i}/{len(to_do)}] {mp3.name}")
        t0 = time.time()
        try:
            result = wmodel.transcribe(str(mp3), fp16=False, verbose=False)
        except Exception as e:
            print(f"  FAILED: {e}")
            continue
        elapsed = time.time() - t0
        text = (result.get("text") or "").strip()
        out.write_text(text, encoding="utf-8")
        words = len(text.split())
        print(f"  OK: {words:,} words in {elapsed:.0f}s -> {out.name}")


if __name__ == "__main__":
    main()
