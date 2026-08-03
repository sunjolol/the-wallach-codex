# Next chunk — ★ AUTHORITATIVE HANDOFF

_Rewritten 2026-08-03 at session close. The OCR/audit campaign is finished; the previous version of
this file was a campaign handoff and is superseded in full. **Every number below was MEASURED at
handoff by running the tool, not carried forward.** Where an older document disagrees, this one wins._

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis`; Claude runs `PYTHONUTF8=1 python tools/genesis.py` ONLY in response, reports,
then asks what to resume. Never a flair-only boot.

# ★ NEXT UP — ELEMENT HEADER ENRICHMENT
Luneth's call at the close of the audit campaign: **we go back to enriching headers.** Start there
unless he redirects.

# ★★ FIRST, THOUGH — ONE OWED GATE (30 min, do it before the headers)
**`no_duplicate_claims` does not exist, and the class it would catch SHIPPED TO LUNETH'S SCREEN.**
On 2026-08-03 he found two near-identical "What is Vitamin A?" cards on one entity page; 13
duplicate claims were removed (kv=458). Nothing caught them, and §00.B says codify rather than
promise. The gate: same book + same `char_offset` + verbatim containment + same subject/facet = RED.
Measured after the cleanup it yields exactly **2 pairs**, and both are Luneth-approved keep-boths, so
they go in `.claude/invariant-baseline.json` as R9 exceptions with a reason + a test:
`WAL-CLM-DDDL-000071`/`-000137` (selenium/physiology) and `WAL-CLM-IMMORT-000135`/`-000389`
(gallium/uses). Ship it with a negative test that re-catches the vitamin-A pair. It was deliberately
NOT rushed in at session close — a gate authored without its negative test is how misfiring gates
ship ([[negative-control-or-it-proves-nothing]]).

**Two duplicate mechanisms it must catch** (both measured, both real): SAME-BATCH DOUBLE EMISSION
(one extraction emits a truncated take AND a full take — identical offset AND identical
`extracted_at`) and CROSS-BATCH RE-MINING (a later pass re-mines a span an earlier pass covered —
same offset, different `extracted_at`).

---

# ★ STATE — measured 2026-08-03

- **Board 84/84**, 0 reds. (21 external · 22 consistency · 39 structural · 2 meta.)
- **Corpus sealed at `knowledge_version=458`** (2,255 claims after the 2026-08-03 de-dup), `corpus_verify` PASS — 2,268 claims · 7 books ·
  hashes match. Build fresh, all derived artifacts in sync.
- **Tree clean, pushed.** (The only file that ever shows dirty is `tools/canaries/safe-write-probe.txt`;
  it rewrites its own nonce every time `safe_write` runs. Normal, not a change.)
- **`ratified-divergences.json`: 73 divergences + a 36-token `book_typo_divergences` register.**
- Front-facing backlog **1,283** · `claims_verified` **642** — unchanged this session (no page-reads
  were run; this session was verification + ratification, not mining).

---

# ✔✔ THE AUDIT CAMPAIGN IS CLOSED — DO NOT RE-OPEN

All 7 books are now either page-read or re-examined against their own allowlist. `iaiyh` was the
last unchecked one; it was re-examined 2026-08-03 and is clean apart from the single line that was
fixed. **Both `books_verified` questions (DECISION 1) are answered. DECISIONS 1, 2 and 3 are all
CLOSED.** There is no open decision waiting on Luneth from this campaign.

**What the last session did, in numbers (measured from git, `6c22c3a7..HEAD`):**
- **19 corrections** landed across **20 text occurrences** (10 in the verification batch, 8 sibling occurrences, 1 in iaiyh).
- **5 quotes (verbatims)** touched · **7 summaries (`claim_text`)** touched · **12 distinct claims**.
- **7 of 7 book sources** edited across the whole session.
- `divergences[]` **7 → 73**; new `book_typo_divergences` register of **36 tokens**.
- `knowledge_version` **454 → 457**.

## ★ The three lessons worth carrying (each cost a real defect to learn)

1. **`claim_text` is UNGATED and no correction pass sweeps it.** The book-typo campaign corrected
   the sources and the verbatims and stopped there — so **7 of 7** affected claims sat with the
   corrected word in Wallach's quote and the old misspelling in our own summary beside it. All six
   tokens were already 0 in the sources: claims-only drift, invisible to everything. `corpus_resnap`
   and the verbatim gates check the quote against the book; **nothing checks `claim_text`.**
   Memory: `claim-text-numbers-unguarded`. No gate covers this (WISH, R7).
2. **"Whole class" in a log is a claim about the world and needs MEASURING.** Writing the book-typo
   class into the ledger revealed it had never been finished — 6 of 36 tokens still had live
   occurrences across 5 books, **2 of them reader-facing**, and the `Bl`→`B1` sweep had been
   **dddl-only** despite its own build-log reading "48 edits across all six books … the whole class."
3. **★ A GATE CAN REDDEN ON THE CORRECTION.** Twice now, `book_source_clean` failed *after* a fix
   because the MISSPELLINGS were baseline-blessed and the correct terms were not (dddl:
   `acutifolia`/`Blepharisma`; iaiyh: `nhanes`/`iii`). On a post-fix RED, ask *what was making this
   pass before?* If the answer is the defect, repair the data or the carve-out — never widen the
   gate. Memory: `a-gate-can-be-green-because-of-the-defect`.

---

# ★ OPEN WORK — none of it is a decision, all of it is deferred by choice

### Structural source hygiene (2 items, logged not attempted)
1. **epigenetics Screenshot(629) duplicated paragraph.** An earlier repair APPENDED a clean
   reconstruction after the serial-killer-table bleed and left the mangled original in place, so
   three typeset lines exist TWICE (offsets ~1261106 and ~1262225). `EPIGEN-000096` quotes the clean
   copy unambiguously, so nothing is broken — but the duplication inflates the book's bytes and
   offsets. Weaving prose back into interleaved table bleed is a structural repair, not a line fix.
2. **`hk.txt` index OCR junk** — `mrsenic 155`, `Ashes177` and neighbours. A different class from
   anything the campaign covered.

### Duplicate claims — 13 removed 2026-08-03, 4 groups left (subject slugs differ, outside the agreed rule)
`RARE-000199`/`RARE-000383` (hydrogen-peroxide vs hydrogen) · `EPIGEN-000271`/`EPIGEN-000319`
(vitamin-b12 vs cobalt) · `DDDL-000064`/`DDDL-000157` (omega-3 mechanism vs physiology — SAME
subject, different facet) · `IMMORT-000045`/`IMMORT-000465` (beryllium/warning vs berylliosis/basics,
identical 142-char verbatim). Each needs Luneth's read; none is a blind delete.

### A stale git worktree
`.claude/worktrees/nervous-shannon-71b572/` holds a full old copy of the corpus. Harmless, but
repo-wide greps DOUBLE-COUNT because of it — it turned up in the pre-delete reference scan.

### The mining backlog (a separate track the campaign never claimed to cover)
- **174 destroyed B-vitamin subscripts** in source text no claim quotes. **PROVABLY NOT
  BATCH-FIXABLE** — the identical token `Bg,` is B5 in one sentence and B6 in another, and `Bi, Ca, Li`
  is BISMUTH. A page-read job, never a rule.
- **343 non-word hits / 210 claims.** Expect to CONFIRM, not fix: of 105 page-read, 62 were
  legitimate (botanical Latin, British spellings, trade names). The spellchecker's suggestions carry
  **no authority** — it wanted `penis` for `pedis`.
- **931 corroborated-but-unread claims.** Backlog by measurement: three control samples of
  *agreeing* claims found **13 defects in 90 ≈ 14%**. Agreement is corroboration, never verification.
- **The corroboration instrument is EXHAUSTED** — `select_reads` yields 0 in every tier. Another run
  produces no work; the next reduction needs a different instrument or whole-page reading.

---

# ★ THE HEADER TRACK — where the next session starts

- **★ READ `.claude/rules/element-headers.md` FIRST.** Only FOUR things are fixed (the `lede`,
  "why this number?", the width, the background); everything else is composed per element from the
  `blocks[]` vocabulary. The chassis (eyebrow → 3 beats → big number → quote) was REJECTED.
- **Element headers: 6 of 90 shipped** — selenium, copper, zinc, calcium, magnesium, vitamin A.
- **`dashboard/assets/data/entity-copy.json` has entries for exactly those 6 and ZERO conditions.**
  Every header needs a complete `lede` + `why` pair (`element_header_complete`).
- **47 research dossiers** in `chronicle/header-research/` (48 files incl. README) — grounded
  head-starts for that many of the remaining 84. **Read the dossier before mocking up.**
- **Vitamin C:** 4 redesigned demos in `temporary/vitamin-c-demos.html` await Luneth's direction
  pick → refine → build live → visual sign-off.
- **Vitamin A (SHIPPED):** its pull-quote is a ~240-char run-on he wants shorter. He REJECTED four
  options (DDDL-000056 / DDDL-000165-trim / LETS-000196 / DDDL-000041) and was choosing his own when
  the OCR work interrupted. Lives in `mechanism-clarity-data.json` under vitamin-a `quote`.
- **★ NEVER build a header live without explicit permission.** Demo-only until he approves.
- Workflow: 4 genuinely distinct mockups (different layout AND illustration) → he picks → build →
  **STOP for his visual sign-off** before logging or committing.

---

# ★ `eden/tools/ratified-divergences.json` — CHECK BEFORE FLAGGING ANY DEFECT
Internal-only (nothing under `eden/tools/` is consumed by `corpus_derive` / `build_embeds` /
`build.mjs` — keep it that way).

- **`divergences` — 73 entries.** Places our text DELIBERATELY differs from a legible page.
  **NEVER "restore".** ★ Four are SAFETY-CRITICAL dose divergences: silver `400 mcg` (page prints
  `400 mg`), `LETS-000433` zinc **50 gm**→50 mg, `LETS-000399` copper **2 gm**→2 mg, `LETS-000051`
  folic acid **gm**→mg. Restoring any of them reintroduces a toxic or lethal dose.
- **`book_typo_divergences` — 36 token entries.** Every book-typo correction is a page-divergence
  BY CONSTRUCTION: we fix the `.txt`, the printed page keeps the typo. Each entry carries a count
  MEASURED against the sealed corpus. **Scope limit:** it covers the tokens the waves + the class
  batch corrected — NOT a proof that every book typo is corrected-or-listed (WISH, R7).

---

# ⚠ TRAPS THAT WILL COST A SESSION
1. **`corpus_seal` is USER-ONLY by default.** Permission was granted for the 2026-08-02/03 session
   specifically. **Do not assume it carries forward — ask.**
2. **Sync the drafts after every resnap.** `corpus_resnap --write` updates the SHARD only; sealing
   without `tools/frontface/sync_drafts.py` silently restores stale offsets. This has bitten FIVE
   times. Prove `corpus_seal.draft_offset_failures() == []` before every seal.
3. **★ A GATE CAN BE GREEN *BECAUSE OF* THE DEFECT** — and can RED *because of the correction*. See
   lesson 3 above. On a post-fix RED, ask what was making it pass before.
4. **★ AN END-TRUNCATION IS INVISIBLE TO `corpus_resnap`.** A truncated verbatim is still a valid
   SUBSTRING, so resnap RELOCATES it and never reports BROKEN. **Always assert the CORRECTION is
   PRESENT, not merely that the defect is gone.** Two live instances were found this way.
5. **Never bare-token replace.** Anchor on a window from the claim's OWN verbatim, widened until
   unique. Two `ofdiarrhea` occurrences in this corpus DISAGREE about the space.
6. **Read the page before batch-fixing a detector's hits.** 11 of 47 subscript hits were BORON.
7. **`pdftoppm` is NOT installed** — the `Read` tool cannot open a PDF page. Use
   `tools/frontface/render.py`.
8. **`Screenshot (N).png` is a TWO-PAGE SPREAD** in a 3840×1080 frame; the gutter sits at x = 0.2506.
9. **Nested heredocs inside `$( )` break bash here.** Write long `--detail` bodies to a file.
10. **The machine clock crossed midnight mid-session.** Read the time from the clock for every
    build-log stamp; never predict it. One line was stamped 2026-08-02 22:58 when the clock said
    2026-08-03 08:12, and had to be corrected before commit.

---

# ★ THE TOOLKIT — `tools/frontface/` (committed; DO NOT REBUILD)
**Read `tools/frontface/README.md` first.** `ocr-cache/` is committed — 719 Tesseract page reads,
~50 min of wall clock; never regenerate unless a capture changes. `tools/frontface/work/` is
gitignored generated analysis. The `apply_*.py` scripts are kept as worked examples — **the GUARDS
in them are the lesson**, not the edit lists.

---

# STANDING DOCTRINES
1. `corpus_seal` / `catalog_seal` are **USER-ONLY** by default.
2. **NEVER fabricate** — verbatim ⊆ sealed source, or say UNREADABLE. Never guess, and never guess
   silently.
3. Every claim lives in ONE of 3 homes; search is a retrieval layer, not a silo.
4. A DOM probe is **NOT** a visual check — screenshot + STOP for his eyes.
5. **NEVER build a header live without explicit permission.**
6. Small, reviewed increments; report and stop at the chunk boundary.
7. No "for good" without a GATE. A rule with no gate is a labelled WISH (R7).
8. **The page is EVIDENCE, NOT GROUND TRUTH.** Fix clear typos using outside knowledge; NEVER touch
   a genuine Wallach statement even when it contradicts mainstream fact; decide it yourself, then
   LOG it. Memory: `books-are-riddled-use-outside-info`.

---

**Board 84/84 · kv=458 · tree clean, pushed · the AUDIT CAMPAIGN IS CLOSED (all 3 decisions
answered, 0 awaiting Luneth) · divergences 73 + a 36-token register · backlog 1,283 ·
claims_verified 642 · NEXT = ELEMENT HEADER ENRICHMENT.**
