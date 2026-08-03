# Next chunk — ★ AUTHORITATIVE HANDOFF

_Rewritten 2026-08-03 at session close (the gate/correction session). The previous version was this
same session's working notes and is superseded in full. **Numbers marked ✓measured were produced by
running the tool at handoff; anything CARRIED FORWARD is labelled as such.** Where an older document
disagrees, this one wins._

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis`; Claude runs `PYTHONUTF8=1 python tools/genesis.py` ONLY in response, reports,
then asks what to resume. Never a flair-only boot.

# ★ NEXT UP — LUNETH HAS A TASK IN MIND
At close he said: *"I have another task first for a new session that may address those at the same
time"* — "those" being the two undone items below. **Ask him; do not assume the header track.**
The standing default if he does not redirect is ELEMENT HEADER ENRICHMENT (see THE HEADER TRACK).

---

# ★ STATE

- **Board 85/85, 0 reds** ✓measured (21 external · 22 consistency · 40 structural · 2 meta).
- **Corpus sealed at `knowledge_version=458` · 2,255 claims · 7 books** ✓measured.
  *(A previous handoff said "2,255 … corpus_verify PASS — 2,268 claims" in one breath. 2,268 was the
  PRE-dedup count; 2,255 is correct. Fixed here.)*
- **36 negative tests, all passing** ✓measured · **30 render probes** on disk.
- **Tree clean, pushed** ✓measured. The only file that ever shows dirty is
  `tools/canaries/safe-write-probe.txt` — it rewrites its own nonce every `safe_write` run. Normal.
- **`ratified-divergences.json`: 73 `divergences` + 36 `book_typo_divergences.entries`** ✓measured.
  ⚠ `len()` on `book_typo_divergences` returns **6** — that is the wrapper's METADATA keys. The
  register is `book_typo_divergences["entries"]`. Do not "correct" 36 → 6.
- **CARRIED FORWARD, NOT re-measured this session:** front-facing backlog **1,283** ·
  `claims_verified` **642**. No page-reads were run, so they should be unchanged — but they were not
  verified. Re-measure before quoting them to Luneth.

---

# ✔ WHAT THIS SESSION DID — 4 commits, all pushed

1. **`88e00882` — `no_duplicate_claims` shipped** (critical, structural) + 13-case negative test.
   Board 84→85. Signature: same book · verbatim **CONTAINMENT** · same `subject` · same `facet`.
   Catches both measured mechanisms (same-batch double emission · cross-batch re-mining) without
   keying on either's tell — it reads neither timestamp nor offset. The 2 ruled keep-both pairs are
   allowlisted **in-gate** in `_DUPLICATE_KEEP_BOTH`, each stating both reader questions.
   **Honest scope (WISH, R7):** a duplicate whose two takes each add bytes the other lacks — neither
   contained — escapes. None exists today; tighten with a measurement, never a guessed threshold
   (an overlap floor reddens 9 legitimate pairs, incl. 5 adjacent Base-Line dose rows).
2. **`a362a546` — the cobalt/B12 test fixed**, 7/8 → 10/10; suite now 36/36. It had carried a
   permanently-failing member for 18 days, which is exactly how a real regression hides. Also closed
   a real gap: the 2026-07-16 patch added FOUR `applies_to` enforcement branches (empty ·
   not-a-subset · equals-every-essential · declared-but-not-honoured) with ZERO planted cases. All
   four now have negative cases.
3. **`4435c353` / `d2f00f53` — record corrections.** The cobalt question was settled 2026-07-16
   (commit `823b8823`); the contradictions file's status header had said OPEN for 18 days after.
   Then I re-asserted a *second* stale bullet from the same file on a blind measurement — see the
   two lessons below.
4. **Memory consolidated** (outside the repo): 196 entries → 135, index 201 → 139 lines. 75 files
   merged into 12 topic files, sources preserved verbatim. This closed the `mining-mechanics`
   consolidation Luneth marked "do NOT forget" on 2026-07-05.

## ★★ THE TWO LESSONS — both cost a false statement to Luneth

1. **A STATUS LINE OUTLIVES ITS RULING.** `tools/invariants.py` cited the contradictions file as
   "Luneth's ruling" while that file's header read "Status: OPEN — needs Luneth's call." The code was
   right; the doc was 18 days stale. **Resolve with `git log -S"<the symbol the decision changed>"`,
   then read the implementing commit** — never trust a status header. Nothing gates one.
2. **★★ A LITERAL SUBSTRING SEARCH OVER BOOK TEXT OR VERBATIMS IS BLIND.** Every book `.txt` and
   every sealed `verbatim` is byte-exact OCR with **hard line breaks inside sentences**. Searching
   `"pure cobalt requirement" in text` returned a confident NULL — the claim stores it as `A pure` +
   a newline + `cobalt requirement`, so the search *could not* match. On that null I told Luneth the
   cobalt ruling's keystone evidence was unsealed and needed mining; **it had been mined 18 days
   earlier** (`WAL-CLM-IMMORT-000233`, commit `cb5107f4`, kv=338). The same blindness reported the
   sentence in **3** books when it is in **4**.
   → **Any search over book text or verbatims is whitespace-insensitive or it is blind** (use a
   regex with `\s+` between the words). Better: confirm existence by **enumerating the entity's
   claims**, not by grepping for a string you expect. And never write *"re-measured"* about a
   measurement whose instrument you did not first prove could return a hit.
   Memory: [[verification-doctrine]] §3.

---

# ★ THE TWO ITEMS LEFT UNDONE — Luneth's next task may cover them

1. **`eden/tools/pdm_coverage_derive.py`'s prose comment is stale** (from the 2026-07-16 cobalt
   thread). It still says cobalt *"carries its own sealed Wallach dose, so renders in INDIVIDUALLY
   DOSED"* — cobalt is `coverage_kind: "mirrors"` now — and its counts `FOUNDATIONAL 4 /
   INDIVIDUALLY DOSED 22 / PLANT DERIVED 34` predate the change. `cb5107f4` flagged it for "the
   session that next touches that file". **Left rather than guess a fresh number into a comment —
   measure the real split from `target.kind` before writing one.** Prose only; no gate reads it.
2. **`safe_write` reported OK while changing ZERO bytes.** Repairing a CRLF file
   (`chronicle/build-log.md`), `safe_write.py replace … --expect-count 2` printed
   `OK … replaced (1916190 B on disk)` and the bytes were unchanged; `safe_rewrite` separately failed
   its own intent check with `intended=1917147B landed=1917147B`. Root cause not established — it
   smells like newline translation between `_read_payload` / `read_text` and the write path.
   **This is §17's core primitive and engineering-doctrine principle 1 (no silent failures); a write
   that reports success on a no-op deserves a real diagnosis + a canary case.** The visible symptom
   is cosmetic: this session's 10:05 build-log entry spans 3 physical lines instead of 1 (an escaped
   newline written to DESCRIBE the line-wrap defect became a real one). Both append-only gates green.

### ⚠ Also found at close, not acted on (small, verified)
**`CLAUDE.md` is numerically stale about `assets/data`.** It says "12 GENERATED + 11 HAND-AUTHORED"
(23) in two places. ✓measured today: **30** files — **13** derived-and-gated in `assets/data`
(+2 derived elsewhere: `product-composition.json`, `search-index.json`, so 15 artifacts total) and
**17** hand-authored, and every one IS accounted (nothing on disk is in neither list). So enforcement
is fine; only the doc's numbers drifted. `no_operating_doc_contradiction` cannot catch this — it
checks deleted-structure tokens + dangling pointers, not numeric drift.

---

# ★ OPEN WORK — pre-existing, none of it a decision

### Duplicate claims — 4 groups left (subject slugs differ, outside the ruled signature)
`RARE-000199`/`RARE-000383` (hydrogen-peroxide vs hydrogen) · `EPIGEN-000271`/`EPIGEN-000319`
(vitamin-b12 vs cobalt) · `DDDL-000064`/`DDDL-000157` (omega-3 mechanism vs physiology — SAME
subject, different facet) · `IMMORT-000045`/`IMMORT-000465` (beryllium/warning vs berylliosis/basics,
identical 142-char verbatim). Each needs Luneth's read; none is a blind delete. **`no_duplicate_claims`
deliberately does not fire on these** — differing subjects mean they land on different pages.

### Structural source hygiene (2 items, logged not attempted)
1. **epigenetics Screenshot(629) duplicated paragraph** — an earlier repair APPENDED a clean
   reconstruction and left the mangled original, so three typeset lines exist TWICE (offsets
   ~1261106 and ~1262225). `EPIGEN-000096` quotes the clean copy unambiguously, so nothing is broken;
   the duplication inflates the book's bytes and offsets. A structural repair, not a line fix.
2. **`hk.txt` index OCR junk** — `mrsenic 155`, `Ashes177` and neighbours.

### A stale git worktree
`.claude/worktrees/nervous-shannon-71b572/` holds a full old copy of the corpus. Harmless, but
repo-wide greps DOUBLE-COUNT because of it.

### The mining backlog (a separate track)
- **174 destroyed B-vitamin subscripts** in source text no claim quotes. **PROVABLY NOT
  BATCH-FIXABLE** — `Bg,` is B5 in one sentence and B6 in another, and `Bi, Ca, Li` is BISMUTH.
- **343 non-word hits / 210 claims.** Expect to CONFIRM, not fix: of 105 page-read, 62 were
  legitimate. The spellchecker carries **no authority** — it wanted `penis` for `pedis`.
- **931 corroborated-but-unread claims.** Three control samples of *agreeing* claims found
  **13 defects in 90 ≈ 14%**. Agreement is corroboration, never verification.
- **The corroboration instrument is EXHAUSTED** — `select_reads` yields 0 in every tier. The next
  reduction needs a different instrument or whole-page reading.

---

# ★ THE HEADER TRACK — the standing default

- **★ READ `.claude/rules/element-headers.md` FIRST.** Only FOUR things are fixed (the `lede`,
  "why this number?", the width, the background); everything else is composed per element from the
  `blocks[]` vocabulary. The chassis (eyebrow → 3 beats → big number → quote) was REJECTED.
- **Element headers: 6 of 90 shipped** — selenium, copper, zinc, calcium, magnesium, vitamin A.
- **`dashboard/assets/data/entity-copy.json` has entries for exactly those 6 and ZERO conditions.**
  Every header needs a complete `lede` + `why` pair (`element_header_complete`).
- **47 research dossiers** in `chronicle/header-research/` — grounded head-starts for that many of
  the remaining 84. **Read the dossier before mocking up.**
- **Vitamin C:** 4 redesigned demos in `temporary/vitamin-c-demos.html` await his direction —
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
- **`book_typo_divergences.entries` — 36 token entries.** Every book-typo correction is a
  page-divergence BY CONSTRUCTION. **Scope limit:** it covers the tokens the waves + the class batch
  corrected — NOT a proof that every book typo is corrected-or-listed (WISH, R7).

---

# ⚠ TRAPS THAT WILL COST A SESSION
1. **`corpus_seal` is USER-ONLY by default.** Permission granted for a past session does NOT carry
   forward — **ask every time.**
2. **Sync the drafts after every resnap.** `corpus_resnap --write` updates the SHARD only; sealing
   without syncing silently restores stale offsets. Has bitten FIVE times. Prove
   `corpus_seal.draft_offset_failures() == []` before every seal. Full pipeline: memory
   [[mining-mechanics]].
3. **★ A GATE CAN BE GREEN *BECAUSE OF* THE DEFECT** — and can RED *because of the correction*. On a
   post-fix RED, ask what was making it pass before.
4. **★ AN END-TRUNCATION IS INVISIBLE TO `corpus_resnap`.** A truncated verbatim is still a valid
   SUBSTRING, so resnap RELOCATES it and never reports BROKEN. **Assert the CORRECTION is PRESENT,
   not merely that the defect is gone.**
5. **Never bare-token replace.** Anchor on a window from the claim's OWN verbatim, widened until
   unique. Two `ofdiarrhea` occurrences in this corpus DISAGREE about the space.
6. **Read the page before batch-fixing a detector's hits.** 11 of 47 subscript hits were BORON.
7. **`pdftoppm` is NOT installed** — the `Read` tool cannot open a PDF page. Use
   `tools/frontface/render.py`.
8. **`Screenshot (N).png` is a TWO-PAGE SPREAD** in a 3840×1080 frame; the gutter sits at x = 0.2506.
9. **Nested heredocs inside a command substitution break bash here.** Write long `--detail` bodies to
   a file. ★ And an escaped newline inside a Python heredoc string becomes a REAL newline in the
   written file — it split a build-log entry this session. Describe a line break in words, don't
   escape one. ★ Long prose is safest staged with the Write tool into the scratchpad, then routed
   through `safe_write rewrite` — bash quoting mangled a handoff draft this session.
10. **Read the clock for every timestamp; never predict it.** The machine crossed midnight
    mid-session once and a build-log line had to be corrected before commit.
11. **The `.claude/invariant-baseline.json` is INVARIANT-SCOPED** — one entry tolerates a WHOLE gate
    forever. A per-case exception goes IN the gate with a reason + a test. Memory:
    [[baseline-is-invariant-scoped]]. The baseline is EMPTY BY DESIGN; keep it that way.

---

# ★ THE TOOLKIT — `tools/frontface/` (committed; DO NOT REBUILD)
**Read `tools/frontface/README.md` first.** `ocr-cache/` is committed — 719 Tesseract page reads,
~50 min of wall clock; never regenerate unless a capture changes. `tools/frontface/work/` is
gitignored generated analysis. The `apply_*.py` scripts are worked examples — **the GUARDS in them
are the lesson**, not the edit lists.

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
9. **A green board means NOTHING DRIFTED — never that anything is RIGHT.** Only the 21 external
   gates can catch a value that is wrong but consistent with our own files. Report the split, not
   the total, and never hand Luneth the total as evidence about Wallach.

---

**Board 85/85 · kv=458 · 2,255 claims · 36/36 tests · tree clean, pushed · 0 decisions awaiting
Luneth · NEXT = ASK HIM (he has a task in mind that may cover the two undone items).**
