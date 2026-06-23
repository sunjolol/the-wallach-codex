# Windows-host quirks

_Read before running bash or python in this repo._

The repo lives on a Windows host (`C:\\Users\\Light\\Desktop\\claude\\health expert`) and is accessed from a Linux sandbox via a mount layer. Three things bite every session.

## 1. UTF-8
Python on Windows defaults to cp1252 stdout, which crashes on em-dashes (used in `safe_write`'s "OK …" lines and throughout the corpus).

```bash
PYTHONUTF8=1 python tools/invariants.py
PYTHONUTF8=1 python tools/safe_write.py …
```

Prefix every `python tools/*.py` invocation with `PYTHONUTF8=1`.

## 2. CWD does not carry between bash calls
Each bash call starts fresh. `cd subdir` followed by another call lands you back at the root.

```bash
# WRONG — second call runs at the wrong cwd
cd dashboard
node_modules/.bin/eslint <file>

# RIGHT — subshell carries the cd
(cd dashboard && node_modules/.bin/eslint <file>)
```

If you're stuck after a bad `cd`, recover with PowerShell `Set-Location "<repo root>"`.

## 3. LF-only payloads
`safe_write replace` matches the old-string byte-for-byte. CRLF in the payload against an LF-encoded file silently fails to find anything. Always stage payloads with LF line endings.

Stage in `C:\\Users\\Light\\AppData\\Local\\Temp` (or the outputs scratchpad) with fresh unique filenames. Avoid shared bare names (`/tmp/sentinel.json`-class collisions).
