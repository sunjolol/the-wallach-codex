# Phase 0 PILOT — results (2026-08-02)

_Ran the BLUEPRINT §3 vision method end-to-end on 4 front-facing quotes across 3 of the 4 books,
including both known-bad claims. READ-ONLY: no source byte was changed. Five findings below change
the plan for Phase 1 — read them before fanning anything out._

## What was run

| Claim | Book | Page located via | Pre-scan | Vision verdict |
|---|---|---|---|---|
| `WAL-CLM-RARE-000336` | rare-earths | PDF phrase-search → **p412** (book p390) | FLAGGED | **7 real OCR defects** |
| `WAL-CLM-LETS-000502` | lets-play-doctor | PDF phrase-search → **p90** | FLAGGED | **1 real OCR defect** + 3 FAITHFUL hyphens |
| `WAL-CLM-EPIGEN-000239` | epigenetics | `Screenshot (346).png` | FLAGGED | **2 real OCR defects** |
| `WAL-CLM-EPIGEN-000001` | epigenetics | `Screenshot (544).png` | clean | **clean, confirmed char-by-char** |

Immortality was NOT exercised (0 claims). Its pipeline is byte-identical to epigenetics'
(`Screenshot (N).png` markers), so the METHOD is proven for it; its own image QUALITY is not.
Stated as a gap, not covered.

## The diffs (ground truth = the page image)

**`WAL-CLM-RARE-000336`** — a Denver Post clipping reproduced on book p390. The scan's left margin
is faded, and every defect is a dropped or mis-read FIRST character of a line — which is exactly
what a faded left margin does to OCR. 7 defects:

| our .txt | the page says |
|---|---|
| `f beta carotene` | `of beta carotene` |
| `tisk of dying` | `risk of dying` |
| `rea of China` | `area of China` |
| `National Cancer Institute` | `the National Cancer Institute` |
| `he first hard evidence` | `the first hard evidence` |
| `pro-\nside a "protective"` | `pro-\nvide a "protective"` |
| `ancer, scientists` | `cancer, scientists` |

**`WAL-CLM-LETS-000502`** — ONE real defect: `(1 20 days` → the page reads `(120 days`.
The three line-break hyphens Luneth flagged (`try-\ning`, `de-\nspite`, `mal-\nabsorption`) are
**byte-faithful to the printed page** — the book physically prints them. See finding 3.

**`WAL-CLM-EPIGEN-000239`** — 2 defects: `(thiamin B,)` → the page prints **`B₁`** (subscript one),
and `naval surgeon, Because` → the page prints `naval surgeon. Because`.

**`WAL-CLM-EPIGEN-000001`** — byte-clean, including line breaks. Verified at char level, not glanced at.

## FINDING 1 — the blueprint's PDF-render step does not work on this host
BLUEPRINT §3.1 says the `Read` tool rasterizes the PDF page. It cannot: `pdftoppm`/poppler is not
installed. PyMuPDF **is** installed, so the pilot rasterized with it instead
(`render_page.py` / `render_crop.py`, staged in the session scratchpad). §3 and §9 need this
substituted before Phase 1, or every PDF-book agent fails at step 1.

## FINDING 2 — the Screenshot files are DUAL-MONITOR captures, and this breaks a naive fan-out
`Screenshot (N).png` is **3840×1080**. The book page occupies only the **left ~26%**; the right
~74% is a Claude Code session window. An agent handed the raw file is looking at a screenshot of a
chat, not at a book page — and the book text at full-frame scale is far too small to distinguish a
comma from a period or to see a subscript. **Every epig/immort read needs a crop-and-upscale step
first** (the pilot used ~5–9× on the left region). This is a hard prerequisite for Phase 1 and is
not in the blueprint.

## FINDING 3 — ★ two defect classes are being conflated, and it changes the campaign's shape
- **(a) TRUE OCR errors** — our `.txt` DISAGREES with the page (RARE's 7, EPIGEN's 2, LETS's `1 20`).
  Only a vision pass finds these. This is what the campaign is for.
- **(b) FAITHFUL line-break hyphens** — our `.txt` AGREES with the page; the book itself prints
  `try-\ning` because the typesetter broke the word. They render to the user as `try- ing` because
  the view collapses whitespace. **87 of the 170 mechanically-flagged quotes are this class.**

Class (b) needs **no vision pass at all** — we already know the text matches the page; the fix is a
mechanical rejoin. Treating them as "OCR errors to verify by eye" would spend most of the campaign's
budget re-confirming text that is already correct.

**Caveat, and it is not optional:** a REAL compound hyphen split across a line (`potassium-\nrich`,
`self-\nesteem`) must KEEP its hyphen. A blind strip produces `potassiumrich`. The mechanical pass
needs a rejoin-validity check, not a regex delete.

## FINDING 4 — the outside-knowledge trap fired for real, on the first flagged claim
`EPIGEN-000239` says the Japanese naval surgeon solved the deficiency **"in the late 1700s."**
Historically that is Takaki, in the 1880s. **The page says 1700s.** Wallach's error stands; it is
not ours to correct, and "fixing" it would inject outside knowledge under his name — the exact
defect the corpus audit exists to stop (memory: outside-knowledge-injected-as-wallach). Recorded
because a vision agent that knows the history WILL be tempted here.

Related and also out of scope: the page itself prints `pateint` (for "patient"). A book typo we
faithfully transcribed. Whole-book typo repair is explicitly NOT this campaign (mandate §0).

## FINDING 5 — the PDF locator is LEAST confident exactly where it is most needed
`LETS-000502` matched **70/70** words (coverage 1.00, margin 67) — trivially located.
`RARE-000336` matched only **11/54** (coverage 0.20, margin 7) — because the quote is itself so
corrupted that little of it matches the PDF's own text layer. Confidence is inversely correlated
with how badly we need the page. The p412 hit was CORRECT (confirmed by eye), but a low-coverage
match must always be visually confirmed, never auto-accepted. Phase 1 should carry the coverage
number per claim and route thin matches to a human check.

## Pre-scan calibration (ranking aid only — never truth)
170 / 1,838 (9%) carry ≥1 mechanical signal: `hyphen_split` 87 · `suspect_fragment` 45 ·
`digit_in_word` 41 · `space_before_punct` 5 · `run_together` 4 · `number_split` 3. Both known-bad
claims rank at the top of their books. A `lowercase_line_start` signal was written and **deleted** —
it fired on 1,267 of 1,838 quotes, because a verbatim is a mid-sentence slice of wrapped prose and a
lowercase line start is the NORM. A detector that flags 69% of the corpus ranks nothing.

## Honest limits of this pilot
- **4 claims, not the ~20 the blueprint asked for.** Enough to prove both pipelines and to surface
  the five findings; NOT enough to measure vision's per-claim reliability (BLUEPRINT §7 wanted that).
- **One clean-by-pre-scan claim was vision-checked and was genuinely clean.** One data point. It does
  NOT establish that a clean pre-scan implies a clean quote — the invisible class is precisely what
  a single sample cannot rule out.
- No source byte was changed; nothing was sealed.
