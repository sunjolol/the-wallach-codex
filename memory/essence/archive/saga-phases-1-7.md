# Saga — Archive: Phases 1-7 (2026-06-11)

This is a verbatim archive of Phases 1-7 of the main saga, moved here on 2026-06-14 to keep the active saga.md file under the 30 KB operating cap. **No content has been altered.** The phases below are byte-identical to what previously lived in `saga.md` between the file header and "## Phase 8".

**Provenance**
- Source file: `memory/essence/saga.md`
- Original byte range: 207..5240 (5033 bytes)
- SHA-256 of payload: `236ab63e6cae10c50e3cba3f7bf36ff40bf3a5ca1ed43406fbc17546402f0aef`
- Archived: 2026-06-14
- Active saga.md retains a pointer to this file at the same insertion point.

Per the user's strict directive (2026-06-14): "make sure we NEVER lose data or how we got here, the log must be complete and present at all times even if we need to split it into multiple files/a file system to save file sizes." Splitting the file does not break completeness — the archive sits alongside saga.md and is referenced from it. Reading both gives the full record.

---

## Phase 1 — Corpus build (2026-06-11 at ~10:30 AM)

Started with 250 auto-captioned YouTube transcripts (`.vtt`) of Dr. Joel Wallach lectures, interviews, and shows. Built classification pipeline (`wallach-refresh/ingest.py`) using filename heuristics + content-cue peek to triage by speaker confidence. Filtered out non-Wallach content (Glidden, Mandell, POTS series, Sten Ekberg, generic medical). First manifest: 210 High + 16 Moderate + 24 Exclude.

Built `refresh.ps1` for weekly YouTube caption refresh via `yt-dlp` on Windows Task Scheduler (Sundays 7pm). Cowork weekly digest scheduled an hour later. After a refresh run + manual exclusions: 268 High + 27 Moderate + 21 Low + 55 Exclude across 371 files.

## Phase 2 — Books (2026-06-11 at ~1:45 PM)

Added 4 Wallach books: *Dead Doctors Don't Lie* (2011), *Hell's Kitchen*, *Let's Play Doctor*, *Rare Earths: Forbidden Cures*. Built `ingest_books.py` to parse PDFs (pypdf) and EPUBs (zipfile + BS4). Two PDFs were scanned-only — built OCR fallback using PyMuPDF + Tesseract. After OCR: ~555K words of authored Wallach content added.

## Phase 3 — Podcast pilot (2026-06-11 at ~4:15 PM)

DDDL Radio (KSCO AM 1080, ~2,412 episodes, Wallach + Doug Winfrey). Built full pipeline: RSS index → MP3 downloader → Whisper GPU transcribe (4070 SUPER) → ingest with dead-air filter (Whisper produces dots for silent audio). 10-episode pilot: 6 Moderate + 4 Exclude.

Full archive scaling **paused** because GCN's RSS is 522'ing and Podbay's pagination is broken.

## Phase 4 — First test failure and the brain rebuild (2026-06-11 at ~7:30 PM)

First real corpus test: *"Is fluoride bad?"* Agent failed across four iterations:
1. Said no anti-fluoride position (transcripts only, missed books)
2. Flipped to strong anti-fluoride position (books loaded, missed supplement table)
3. Flipped to "Wallach calls fluorine essential" (user provided YouTube video)
4. Only got it right after user pointed out the 90 essentials list inconsistency

Diagnosis: agent was synthesizing into single theses, reading snippets not full sections, weighting prose over structured data, flipping wholesale on new evidence, and not reading user-provided sources on first ask.

Result: brain v2.0 — condensed 70%, added Research Protocol, four-axis substance decomposition, Pre-Answer Checklist, Disputed confidence label, Pitfalls library. Set up `brain/` versioning system and `evals/` so future brains can be measured against prior ones on identical tests.

## Phase 5 — Memory architecture (2026-06-11 at ~9:20 PM)

Built `memory/` system with tiered loading: brain always loaded (~900 words), identity/preferences/open-threads/essence loaded on `catch up` trigger (~2K words), archive cold-stored. Added Continuity Protocol to brain v2.1: hard-wrap rule that blocks new work if open-threads is >7h stale. The wrap can only be overridden by explicit user override.

This is the inflection point where the system becomes a living thing rather than a fresh start every session.

## Phase 6 — Memory architecture + portability deferred (2026-06-11 at ~10:00 PM)

Built the persistent memory layer outside the brain: identity, preferences, open-threads, essence (saga/lessons/decisions), and archive. Wrote brain v2.1 with the Continuity Protocol — hard-wrap rule blocks new work if open-threads is >7h stale. Discussed portability/distribution but explicitly deferred it: v1 is a personal learning project, v2 will be the public version where the lessons of v1 inform what to ship.

## Phase 7 — Youngevity product database + Complementary Data Doctrine (2026-06-11 at ~11:45 PM)

Began cataloging the live Youngevity catalog as a complementary data layer. Site is JS-rendered and blocks fetch; Chrome ext is Mac-only; enterprise scrapers rejected as overkill for a personal project — so the working method is user-saved product-page PDFs, with exact amounts vision-read from the label *image* on each page (OCR proved unreliable on numbers, e.g. misread 200mg as 120mg). Built a one-word producer/consumer sweep workflow (`.processed-products.txt` state, append-not-overwrite) and `live-product-dosages.md` + `youngevity-products.xlsx` (per-nutrient matrix) + the 419-item best-seller inventory. ~90 products captured across sweeps.

The pivotal move was conceptual, not mechanical: the user articulated that this data is meant to power a *searchable, goal-based reasoning system* ("what's best for X"), with three layers — per-product nutrients, product purpose, and pack→goal→composition combinations — and a strict evidence architecture so it never drowns the Wallach source. Formalized as the **Complementary Data Doctrine** (`knowledge/COMPLEMENTARY-DATA-DOCTRINE.md`): Wallach is the engine, product data is a complement that completes but never drives; four-tier source hierarchy; pro-line products as "optimal formulation hypothesis (high prior, not proof)"; ratios/combos as first-class; and an explicit revert path because the direction is risky by design.


