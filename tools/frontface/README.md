# `tools/frontface/` — the front-facing verification toolkit

_Built 2026-08-02. Everything here is COMMITTED on purpose: it is what a future session would
otherwise have to rebuild, and the OCR cache alone is ~50 minutes of wall clock. Generated analysis
goes to `work/` (gitignored); scripts and the OCR cache do not._

## What problem this solves

`chronicle/frontface-ocr/verified.json` holds a backlog of claims that are FRONT-FACING (they render
to a user) but whose source text has never been checked against the printed page. Membership in that
backlog asserts only "this was already front-facing on 2026-08-02" — never "this is correct". The
job is to shrink it to zero by reading pages.

Reading 1,900 pages by eye is the naive plan. These tools narrow it.

## ★ STATE, 2026-08-03: THE CORROBORATION INSTRUMENT IS EXHAUSTED

Backlog **1,900 → 1,283**; `claims_verified` **25 → 642**. More importantly, a full regeneration of
the chain against the current sealed corpus now yields **ZERO** page-read candidates:
`A1 = A2 = A3 = 0`, `B-alignment-slip = B-dropped-text = 0`, `UNLOCATED = 0` — only a fresh 30-claim
control. Of the 1,283, **931 AGREE outright** with their second OCR and the other 352 produce only
suppressed-with-reason hunks.

**Do not expect another `select_reads` run to produce work — it will not.** Everything this
instrument can SEE has been read and fixed. What remains is the class it is structurally blind to
(both passes read the same scan and share their errors), which is exactly what the control measures.
The next reduction in that 1,283 needs whole-page reading or a different instrument.

## The instruments, and exactly what each proves

### 1. Second-OCR corroboration — `pdf_corroborate.py` · `corr2.py` · `corr_shots.py`

Every book has a SECOND, INDEPENDENT machine reading of the same scan:

| Book | Second reading | Notes |
|---|---|---|
| `rare-earths` · `lets-play-doctor` · `hells-kitchen` | the PDF's own **text layer** | read with PyMuPDF (`fitz`) |
| `epigenetics` · `immortality` | **Tesseract** over the page captures | pre-computed in `ocr-cache/` |

It is genuinely independent — proven on `WAL-CLM-RARE-000336`, where the text layer produced
`of`/`risk`/`area`/`the`/`pro-vide`/`cancer` against our `f`/`tisk`/`rea`/`he`/`pro-side`/`ancer`
(all 7 known defects) while making its own unrelated errors (`Ctiina`, `Ttie`, `lewer`).

**★ WHAT IT DOES NOT PROVE — the single most important fact in this directory.** Both passes read
the SAME physical scan, so they share errors. Measured across **THREE independent control samples**
of claims where both passes AGREED, each page-read end to end: **7 of 30, then 4 of 30, then 2 of 30
— 13 of 90 ≈ 14%** still carried a defect. Agreement is corroboration, never verification. A
corroborated claim does NOT leave the backlog. The rate trends down as the corpus gets cleaner, but
it has never been zero.

`corr2.py` supersedes the first-cut alignment in `pdf_corroborate.diff_hunks`: it anchors on the
LONGEST matching block and projects the needle positionally, so the compared window is only about as
long as the verbatim. The first cut aligned first-matching-block to last, which on a dense page
pulled 800+ unrelated words into one giant `insert` and buried the class it most needed to catch
(OCR dropping a whole sentence).

**The locator lies, and says so.** It once sent `WAL-CLM-RARE-000335` to p412 instead of p495 and
manufactured a phantom hunk. But `coverage` is a reliable self-report: every wrong-page case measured
**below 0.85**, and zero fully-agreeing claims did. **Treat `coverage < 0.85` as "page index
unreliable — search the neighbours."**

### 2. Self-scan — `selfscan.py` · `triage_nonword.py` · `rank_nonword.py`

Attacks the shared-error blind spot from the other side, by reading only OUR text:

- **`SUBSCRIPT_DAMAGE`** — a typeset subscript flattened into a comma or lookalike (`Vitamin B,,`
  for B12, `LDso` for LD50, `Vitamin 81` for B1). This is now also gated: `subscript_damage` is the
  8th class in `frontface_verbatims_clean`. **This scan is deliberately LOOSER than the gate** — it
  still fires on `Preparation H,` and on boron in a mineral list, which the gate correctly spares.
  A hit here is a candidate, not a defect.
- **`NONWORD`** — tokens that are not words in English, the corpus's own vocabulary, or the rest of
  the book.

**The triage is the hard part.** A bare "not in the dictionary" detector returned 387 near-useless
candidates once. `triage_nonword.py` cross-references against the corroboration output — a non-word
in a claim corroboration did NOT flag is the blind-spot case — and `rank_nonword.py` spares two large
innocent families with stated reasons: **etymology** (these books constantly explain element names,
so `barys`, `bromos`, `buraq`, `coesius`, `magnes` are CORRECT and sit inside "the Greek/Arabic word
…" passages) and **scientific morphology** (`kinases`, `auxins`, `lipoxins`, `acylation`).

**★ Expect to CONFIRM, not to fix.** Of 105 non-word tokens page-read, **62 were legitimate** —
botanical Latin (*Leonurus cardiaca*, *Tinea pedis*), British/older spellings (`caesium`,
`paraesthesia`, `nitre`), trade names (`Silicea`, `Hoxsey`). The spellchecker actively wanted to
corrupt three: `castro` for `gastro`, `penis` for `pedis`, `honey` for `HOXEY`. **Its suggestions
carry no authority** — say so in any agent prompt built from this data.

### 3. Rendering — `render.py` · `render_shot.py`

`pdftoppm` is NOT installed, so the `Read` tool cannot open a PDF page. Rasterise first.

```
python tools/frontface/render.py <book> <page> out.png [zoom] [x0 y0 x1 y1]
python tools/frontface/render_shot.py <book> <screenshot-N> out.png [both|left|right] [scale]
```

`render.py` covers all three PDF books (the older `temporary/frontface-ocr-tools/render_page.py`
knows only two). For the capture books, each `Screenshot (N).png` is a **3840×1080 dual-monitor
frame** with the book in the left ~26 % — and within that, a **TWO-PAGE SPREAD** with the gutter at
**x = 0.2506**. Cropping one half and reporting "not found" is a documented way to lose a session.

Subscript digits and comma-vs-period need **16×–40×** on the token, not 3×.

### 4. OCR harness — `ocr_shots.js` · `ocrhost.html` · `ocr-cache/`

Runs the dashboard's own vendored Tesseract offline through puppeteer. Two gotchas, both already
handled: the bundle is a **browser** build so it needs a real `file://` host page (not `setContent`)
plus `--allow-file-access-from-files`; and it reads **across the spread** unless split at the gutter.
~4.7 s per capture; all 719 in ~50 min across 5 shards.

**`ocr-cache/` is committed. Do not regenerate it unless a page capture changes.**

## The fix pipeline

```
read pages  →  correct the .txt (safe_write, §17)
            →  corpus_resnap --book X --write [--fix f.json]      (make_fixes.py builds the --fix)
            →  sync_drafts.py                                      (or the seal silently reverts it)
            →  corpus_seal.py                                      (USER-ONLY unless he says otherwise)
            →  build_embeds.py → tools/build.mjs → invariants → probes
```

`apply_fixes.py`, `apply_subscripts.py`, `apply_nonword.py`, `fix_hk_hyphens.py` are kept as worked
examples. **The guards in them are the lesson**, not the edit lists:

- Anchor every edit on a window taken from the CLAIM'S OWN VERBATIM, widened until unique in the
  file. A bare token replace is wrong — `uncers`, `ofdiarrhea` and `dietaiy` each occur more than
  once, and in the `ofdiarrhea` case **the two occurrences disagree**: one page prints the space and
  the other does not.
- Handle the **shared span**: two claims can quote the same text, so the first edit legitimately
  consumes the second's anchor. That is success, not failure.
- Handle **two occurrences of the same token inside one claim** — both plan entries will otherwise
  anchor on the first and silently miss the second. This bug happened; the uniqueness assertion
  caught it.
- Assert counts and write NOTHING if any assertion fails. A partial batch across five books is far
  worse than no batch.

### 5. Page-grouping + the wave harness — `build_wave.py` · `build_wave3.py` · `workflow-template.js`

`build_wave.py <name> <tiers>` turns a readlist into a PAGE-GROUPED wave file. This is the whole
economy of a wave: **the unit of cost is a render, not a claim.** 443 claims sat on 216 distinct
pages, and immortality's 217 on just 78 — grouping halves the work before an agent starts. Each group
carries a precomputed `render` command, because two documented session-losers live in the argument
list (`pdftoppm` is absent; a capture "page" is a Screenshot NUMBER naming a two-page spread).

`workflow-template.js` is the agent-fleet shape. **Keep its RULES block almost verbatim** — every
line in it is a mistake that was actually made or nearly made.

### 6. Destroyed-vitamin-subscript scan — `scan_b_subscripts.py`

Enumerates every `B,2` / `By,` / `Bg,` / `Bl,` / `B,,` / bare `vitamin B,` in the sealed sources and
maps each to its capture. **REPORTS ONLY, and must stay that way:** the identical token `Bg,` means
**B5** in "Pantothenic acid, aka vitamin Bg," and **B6** in "Vitamin Bg, originally designated B3",
and `Bi, Ca, Li` is **BISMUTH**, not B1. 174 occurrences remain, none reaching a reader.

### 7. The fix-application family — `apply_*.py` · `make_fixes*.py` · `build_extent_fixes.py`

`apply_fixes` · `apply_subscripts` · `apply_nonword` · `fix_hk_hyphens` · `apply_wave1` ·
`apply_wave2` · `apply_wave3` · `apply_booktypos`, each paired with a `make_fixes*` that builds the
`corpus_resnap --fix` payload **by replaying the same edit list** rather than retyping it — retyping
is how the two halves of a fix drift apart. `build_extent_fixes.py` handles the repair route no
source edit can take: a claim whose verbatim was cut at the wrong boundary (three had swallowed a
page separator; one stopped two characters short of the page).

**Two hard-won guards live in these files and should be copied into any new one:**

- **Assert the CORRECTION is PRESENT, not merely that the defect is gone.** An END-TRUNCATION is
  invisible to `corpus_resnap` — a truncated verbatim is still a valid SUBSTRING of the corrected
  text, so resnap RELOCATES it and never reports BROKEN. `EPIGEN-000322` would have stayed cut
  mid-word at "frui" on a fully green board.
- **Assert that what you did NOT read stayed untouched.** `apply_wave3.py` counts the unread sibling
  occurrences before and after and ABORTS if the number moves — 38 unread `Tourette's` /
  `Alzheimer's` / `1 ,000` occurrences sat beside the ten that were page-read.

## Typical session

```bash
python tools/frontface/build_targets.py          # target set from the CURRENT backlog + sealed corpus
python -c "import sys;sys.path.insert(0,'tools/frontface');sys.argv=['x'];import corr2,json;from pathlib import Path;T=json.load(open('tools/frontface/work/targets.json',encoding='utf-8'));[corr2.run(b,T[b],Path('tools/frontface/work')) for b in ['rare-earths','lets-play-doctor','hells-kitchen']]"
python tools/frontface/corr_shots.py             # epigenetics + immortality, from ocr-cache/
python tools/frontface/select_reads.py           # -> work/readlist.json, the ranked page-read list
python tools/frontface/selfscan.py               # -> work/selfscan.json
python tools/frontface/triage_nonword.py && python tools/frontface/rank_nonword.py
python tools/frontface/build_wave.py wave1 A,C   # -> work/wave1.json, PAGE-GROUPED for an agent fleet
python tools/frontface/scan_b_subscripts.py      # destroyed vitamin subscripts, reports only
```

★ **REGENERATE THE WHOLE CHAIN BEFORE ANY NEW WAVE.** Wave 2 had to, because wave 1's own fixes had
changed the corpus underneath the readlist — stale inputs re-flag defects that are already corrected.
The full chain takes about three minutes.

`build_targets.py` reads the backlog, so **every number these tools print shrinks as claims move
into `claims_verified`**. They describe work remaining, not work total.

## Before flagging anything as a defect

Read `eden/tools/ratified-divergences.json`. Its `divergences` section records **SEVEN** places where
our text DELIBERATELY differs from a legible page and must NEVER be "restored": silver `400 mcg`
(the page prints `400 mg` — restoring it reintroduces a toxic dose), `antitoxin`, `vitamin A … as
beta carotene`, `1nm to 100nm`, cartilage `5 gm`, `Dean Hamer`, and `(KrF2)` (ruled by Luneth
2026-08-02 against the page's legible `KrF4`).

Two of this campaign's "findings" were corrections already made in earlier sessions and never
logged — each cost a render, a 20×–40× read and an adversarial second read to re-derive. The file
has since paid off repeatedly: an agent hit the silver claim, checked the list, and returned
DOCTRINE_OK instead of proposing a restore to a toxic dose.

Its `pending_review` section holds **five batches / ~213 logged judgment calls** awaiting Luneth's
end-of-campaign sweep — every correction made on contextual judgment rather than a plain glyph read,
with what changed and why.
