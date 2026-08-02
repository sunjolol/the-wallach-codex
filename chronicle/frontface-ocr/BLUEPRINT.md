# Front-Facing Quote OCR Remediation — BLUEPRINT

_Created 2026-08-02. Owner: Luneth. This is the authoritative, self-contained plan for the
next session(s). Do NOT start executing without reading this in full. The mandate is narrow and
exact — read the SCOPE line before anything._

---

## 0 · MANDATE (Luneth, verbatim intent)
> "I want every quote that is **front facing and wrong** found and cleaned." · "Cleaning the entire
> books is NOT what I want." · "Fix this issue **for good** so I don't need to repeat myself."

So: **NOT** a whole-book purification. **ONLY** the verbatims that actually render to a user, made
byte-correct against the source page image, then **locked by a gate** so it can never recur.

## 1 · WHAT WENT WRONG (root cause — so we fix the cause, not just symptoms)
- Claims were **enriched (made front-facing) from books whose source `.txt` was never cleaned.**
  `eden/tools/purity-status.json`: `epigenetics`, `lets-play-doctor`, `rare-earths` = **`raw` (untouched
  OCR backlog)**; `immortality` = `purifying` (partial). Only `dddl-3e-2011` + `iaiyh` are audited-pristine.
- The rule "we fix source quotes as we enrich" was a **promise with no gate** (§00.B: an ungated rule is
  a WISH). It was not kept for the raw books, and nothing caught it. **The permanent fix is a GATE, not
  another promise** (§7).
- Evidence that triggered this: `WAL-CLM-RARE-000336` (China-cancer news clipping) shown with ~8 OCR
  errors (`doses f`→of, `tisk`→risk, `rea`→area, `he first`→the, `pro-\nside`→provide, `ancer`→cancer);
  `WAL-CLM-LETS-000502` (pregnancy anecdote) with ≥4 line-break-hyphen splits (`try-\ning`, `de-\nspite`,
  `mal-\nabsorption`, `1 20`→120).

## 2 · SCOPE — the exact target set (do not widen, do not narrow)
**1,838 front-facing quotes** = every claim that RENDERS in the app AND comes from a non-pristine book.
Enumerated deterministically (displayed = union of ids in `corpus-embed.json` + `search-index.json` +
`mechanism-clarity-data.json` quote blocks; ∩ the 4 non-pristine books):

| Book | Front-facing quotes | Page-source | Claim→page mapping |
|---|--:|---|---|
| epigenetics | 460 | `temporary/Epigenetics .../Screenshot (N).png` (465 imgs) | marker nearest-BEFORE `char_offset` — **NOT 1:1, see the warning below** |
| immortality | 470 | `temporary/The Age Beaters .../Screenshot (N).png` (254 imgs) | same marker method — **NOT 1:1, see the warning below** |
| lets-play-doctor | 513 | `temporary/lets-play-doctor-pdf/Lets-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.pdf` (222pp, TEXT LAYER) | NO markers → phrase-search the PDF text layer for a distinctive verbatim n-gram → page# → verify |
| rare-earths | 395 | `temporary/rare earths forbidden cures/rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf.pdf` (520pp, TEXT LAYER) | same phrase-search method |
| **TOTAL** | **1,838** | | |

**The work-list is already built:** `chronicle/frontface-ocr/worklist.json` — per book, each entry =
`{id, kind, char_offset, screenshot, verbatim_len, verbatim}`. `screenshot` is pre-filled for
epig/immort (the exact `Screenshot (N).png`) and null for the two PDFs (resolve by phrase-search).

**★ CORRECTED 2026-08-02 — the marker mapping is NOT 1:1.** Each `Screenshot (N).png` is a
**TWO-PAGE SPREAD**: ~2 book pages per file (459→p371, 460→p374, 346→p145, 613→p689). The frame is
3840×1080 DUAL-MONITOR — the book is the left ~26 %, the right ~74 % is a Claude Code window. Crop
**x ≈ 0.028–0.48** to capture BOTH pages, and retry the adjacent screenshot before declaring a
passage unverifiable. An agent cropping one page reports "not found" or, worse, diffs against a
NEIGHBOURING page. `low-sodium` sits under marker 459 on the RIGHT page — that is how this was found.
Also: **`pdftoppm` is NOT installed**, so the Read tool cannot rasterise a PDF page; use
`temporary/frontface-ocr-tools/render_page.py` (PyMuPDF) instead.

Books NOT in scope (already clean): `dddl-3e-2011` (314), `iaiyh` (21), `hells-kitchen` (93 — 0 hyphen
defects found; treat as clean unless a defect surfaces).

## 3 · THE METHOD — ground-truth verification (this is the whole point)
No regex is trusted as the source of truth. **Each front-facing verbatim is diffed against its rendered
SOURCE PAGE IMAGE** — the only thing that catches the invisible class (valid-word swaps `he`→`the`,
`side`→`vide`; subscript damage `B,`→`B6`; number-splits `1 20`→`120`) that every scanner misses.

Per claim:
1. **Locate the page.** epig/immort: read `screenshot` from the work-list → open `Screenshot (N).png`.
   PDFs: phrase-search the text layer (a pre-step script, `pypdf`) for a rare verbatim substring → page#
   → the `Read` tool renders that PDF page (`pages="N"`) as an image.
2. **Vision-read** the page, find the passage.
3. **Char-by-char diff** verbatim ↔ page. Record EVERY discrepancy with its class
   (hyphen-split · dropped-letter · wrong-word · subscript · spacing · weird-char · missing/extra text).
4. **Emit the corrected true text** (what the page actually says), byte-for-byte.
5. If the page is unreadable or the passage can't be found → **flag `UNVERIFIABLE`, never guess**
   (memory: say-unreadable-never-guess). An over-flag is recoverable; a silent guess is the disease.

Mechanical pre-scan (cheap first pass, NOT the source of truth) narrows effort: `book_purity` +
the hyphen/`�`/spacing detectors pre-rank likely-dirty claims so verifiers start there — but a
"clean" pre-scan does NOT skip the vision check (the invisible class).

## 4 · THE FIX PIPELINE (source-correct → resnap → seal → rebuild)
The verbatim is a byte-exact substring of the `.txt`; to fix a displayed quote we correct the `.txt`
**span that quote covers** (SCOPED — not the whole book, per the mandate):
1. Correct the `.txt` spans via `safe_write` (or `eden/tools/book_purify_apply.py` — read its interface
   first). LF payloads only (windows-host rule). Keep a per-claim before/after record.
2. `PYTHONUTF8=1 python eden/tools/corpus_resnap.py --book <book> --write [--fix <json>]` — relocates
   `char_offset`s + re-quotes the verbatims from corrected source. **Mind the draft/shard offset order
   (next-chunk trap #1; memory: editing-sealed-corpus-claims): resnap the shard, then sync each draft's
   claims from the corrected shard via safe_write, THEN seal — or the draft-offset guard blocks the seal.**
3. **`corpus_seal` is USER-ONLY.** Luneth runs `PYTHONUTF8=1 python eden/tools/corpus_seal.py`. Correcting
   the `.txt` changes the book content hash → `books-meta.json` `content_sha256` updates *inside* the seal
   (it recomputes). This is expected.
4. `python eden/tools/build_embeds.py` → `node tools/build.mjs` → board green. (These are what "nothing
   needs re-derived" protects: after a seal, the embeds ARE stale until build_embeds runs.)

## 5 · THE LOCK — how it stays fixed FOR GOOD (§00.B: codify, don't promise)
**★ BOTH GATES LANDED 2026-08-02.** Status below is measured, not planned.

- **`frontface_verbatims_clean` (critical, LIVE).** **ALL SEVEN mechanical classes gated** —
  hyphen split · mojibake/control · space-before-punct · number split · run-together · double
  space · digit-in-word. Two shipped first (they reached zero immediately); the other five were
  held as labelled WISHes and **promoted the same day (2026-08-02)** once every residual hit had
  been read off its page image. The exclusions encode that verification (ordinals, decades,
  vitamin designations, unit/formula adjacency, table leader dots).
  Named exceptions live in `eden/tools/frontface-exceptions.json` and must each carry a checkable
  reason; a reason-less carve-out is itself RED. Currently **11**, each stating its evidence type
  (2 PAGE-VERIFIED-faithful, 3 tables proven by their own in-verbatim header, 4 camelCase brands
  and a surname, 2 transcribed tables). Negative test:
  `tools/test_frontface_verbatims_clean.py` (**31 cases**).
- **`enriched_book_is_verified` (critical, LIVE) — the ROOT-CAUSE gate.** A claim may not carry a
  search-enrichment entry unless its book is in `books_verified`, its id is in `claims_verified`, or
  its id is in the frozen grandfathered backlog. **This makes the original failure impossible:** you
  cannot newly front-face a quote from an unverified book. Ledger:
  `chronicle/frontface-ocr/verified.json` — 2 verified books (`dddl-3e-2011`, `iaiyh`), 11
  individually verified claims (full verbatim char-diffed against a RENDERED PAGE IMAGE — deliberately
  excluding claims resolved only by PDF text layer, line geometry or corpus-internal attestation),
  and **1,900 grandfathered** (1,925 at freeze; it shrinks as claims move into `claims_verified`). The backlog asserts only "already front-facing on 2026-08-02", NEVER
  "correct"; the vision sweep shrinks it. Negative test:
  `tools/test_enriched_book_is_verified.py` (7 cases).

**What the pair does NOT do (R7, labelled).** (a) Neither sees the DROPPED-SPACE class beyond its
letter↔digit and camelCase EDGES: tight justification cost real spaces (page `magnesium at 2,000 mg`,
ours `at2,000`) and the letter-letter cases (`andelectrolytes`, `ratherthan`) are invisible to every
detector. Its size is **UNMEASURED** — a vocabulary attempt returned 387 candidates that were almost
all legitimate words, so no number is claimed. (b) Neither sees the INVISIBLE class — a valid-word swap.
Four were found by eye on 2026-08-02 (`side`/`vide`, `tine`/`rine`, `Jute`/`lute`, `ties`/`ries`),
every one inside a pair `frontface_verbatims_clean` calls clean. Those are caught ONCE by the §3
vision pass and held afterwards because verbatims only ever change via resnap-from-corrected-source
and any new front-facing claim must pass `enriched_book_is_verified`.

## 6 · EXECUTION PHASES (for the next session — small, verified, logged)
- **Phase 0 — PILOT (do this first, always).** Run the §3 method on ~5 claims per book incl. the two
  known-bad (`RARE-000336`, `LETS-000502`). Prove: page located, vision-diff correct, correction byte-valid
  against the page. If a book's images/PDF prove unusable → STOP and tell Luneth (honest gap) before scaling.
- **Phase 1 — VERIFY sweep (READ-ONLY).** A Workflow fans vision agents over the work-list, per book,
  batched (respect the token-budget guard; ~1,838 claims is large — page images are heavy, so batch and
  checkpoint results to `chronicle/frontface-ocr/findings-<book>.json`). Output per claim:
  `{id, located, defects[], corrected_verbatim, unverifiable?}`. NO source changes yet.
- **Phase 2 — FIX + RESNAP + SEAL (per book).** Apply §4 to the claims Phase 1 flagged. Luneth seals.
  Small batches, one book at a time, each with a before/after diff he can audit.
- **Phase 3 — LOCK.** Build both §5 gates + tests; add each cleaned book to `verified.json`; board green.
- **Phase 4 — CLOSE.** build_embeds → build → render probes → build-log → Creator's Log → Luneth reviews
  a sample of the now-clean quotes on the live surface (visual sign-off).

## 7 · HONEST LIMITATIONS (state these; never soften them)
- **No scanner is 100%.** The mechanical gate (§5) catches hyphen/spacing/mojibake regressions, NOT
  valid-word swaps or subscript damage. Those are caught ONCE by the vision pass and held by the
  change-only-via-resnap discipline + `enriched_book_is_verified`.
- **Vision is the ground truth but not infallible.** It is the same standard book_purity's own doc names
  for "pristine" (exhaustive human/page read). Phase 0 measures its reliability before scaling.
- **`spell_flag` counts are NOT error counts** — book_purity flagged ~12,400 spell candidates across the
  4 books, most of which are real Latin/element/medical words. Do not report them as errors.
- **Whole-book pristine is explicitly OUT OF SCOPE** (Luneth). The ~21k whole-book book_purity flags are a
  separate, later campaign if ever wanted. This campaign touches only the spans under front-facing quotes.

## 8 · SEPARATE BUG (do not lose — different subsystem)
The word **"reduced"** (and likely other common words) gets a dotted-underline **term-gloss** with
irrelevant hover text. This is the gloss matcher over-firing on a common word, NOT OCR. Fix in the
term-gloss lexicon (`eden/tools/term-gloss-lexicon.json` + the gloss gates); own ticket, own verification.

## 9 · ASSETS & TOOLS (exact)
- Target list: `chronicle/frontface-ocr/worklist.json` (1,838 entries).
- Page images: the two `Screenshot (N).png` dirs (epig/immort) + the two PDFs (lets/rare-earths) — §2 table.
- Scanners: `eden/tools/book_purity.py` (`json --book <b>` / `report`), `anomaly_scan.py`.
- Fix/seal: `book_purify_apply.py`, `corpus_resnap.py`, `corpus_seal.py` (USER-ONLY), `build_embeds.py`,
  `tools/build.mjs`. Write everything through `tools/safe_write.py` (§17).
- Relevant memories: book-source-purification-campaign · dehyphenation-reflow-method ·
  verify-against-source-images · reading-and-correcting-scanned-pdfs · say-unreadable-never-guess ·
  editing-sealed-corpus-claims · correct-everything-uniformly · refinalize-inflates-ids.

## 10 · DEFINITION OF DONE
1. All 1,838 front-facing quotes vision-verified (or explicitly `UNVERIFIABLE` + surfaced to Luneth).
2. Every located defect corrected in source, resnapped, sealed, rebuilt; board green.
3. Both §5 gates live + negative-tested; all 4 books on `verified.json`.
4. Luneth has visually signed off on a sample of the now-clean quotes.
5. The "reduced" gloss bug fixed separately.
Only then is the recurrence class closed — because the gate, not a promise, now holds it.
