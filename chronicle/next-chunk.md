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

# ✔ THE OWED GATE IS DONE — 2026-08-03, commit 88e00882
`no_duplicate_claims` (critical, structural) SHIPPED with its 13-case negative test
`tools/test_no_duplicate_claims.py`. **Board 84/84 → 85/85** (structural 39 → 40), 0 reds.
Signature: same book · verbatim **CONTAINMENT** · same `subject` · same `facet`. Catches both
measured mechanisms (same-batch double emission · cross-batch re-mining) without keying on
either's tell — it reads neither timestamp nor offset.

**★★ TWO THINGS THE PREVIOUS VERSION OF THIS FILE GOT WRONG. Both are corrected here rather than
left to poison the next session (logging-doctrine rule 5).**

1. **The signature it specified was too narrow.** It said "same book + same `char_offset` +
   verbatim containment + same subject/facet." **Same-offset yields 1 pair, not 2** — the gallium
   pair sits at DIFFERENT offsets (262400 vs 262639), one span being the tail of the other. The
   correct join is **containment**, which yields exactly the 2 pairs, matching b3551834's own
   measurement. A null from a too-narrow join proves nothing ([[null-result-needs-a-scope-check]]).
2. **★ The exception mechanism it prescribed would have NEUTERED the gate, and was not followed.**
   It said the 2 keep-both pairs "go in `.claude/invariant-baseline.json` as R9 exceptions."
   **They must not.** That file is INVARIANT-SCOPED — `stop_round_close.py::_tolerated` returns a
   set of invariant NAMES — so ONE entry tolerates EVERY duplicate the gate will ever find. It
   would have shipped green while blessing the exact class it exists to stop. The identical trap
   was already proven here for `dose_amount_in_verbatim` (the "NO BASELINE EXCEPTION" note above
   `_DOSE_UNIT_SYN`). The 2 pairs live **in-gate** in `_DUPLICATE_KEEP_BOTH`, each stating both
   reader questions the shared span answers; **the baseline is still EMPTY BY DESIGN.** A carve-out
   that STOPS firing is itself RED, so a dead exception cannot linger pretending to bless something.

**Honest scope (WISH, R7):** a duplicate whose two takes each add bytes the other lacks — neither
contained — escapes. None exists today; tighten with a measurement if one ships, never with a
guessed threshold (an overlap floor reddens 9 legitimate pairs, incl. 5 adjacent Base-Line dose rows).

# ✔ THE PRE-EXISTING TEST FAILURE IS FIXED — 2026-08-03, commit a362a546
`tools/test_collective_doses_not_fanned.py` **7/8 → 10/10**; the whole suite is now **36/36** (it
had carried a permanently-failing member, which is exactly how a real regression hides).

**The "open question" was settled 18 days ago.** `tools/invariants.py` cited the contradictions file
as "Luneth's ruling" while that file's header still read "Status: OPEN — needs Luneth's call."
`git log -S"_SAME_SUBSTANCE_SLUGS"` found commit `823b8823` (2026-07-16): *"Luneth made the call
after reading Immortality and Let's Play Doctor himself… He ruled: no target ever + B12 auto-fills,"*
visual signed off *"Much better."* **invariants.py was RIGHT; the chronicle file was stale.** Verified
still live: canon cobalt `coverage_kind:"mirrors"` / `mirrors_slug:"vitamin-b12"`, both dose claims
`dose.applies_to:["vitamin-b12"]`, `collective_doses_not_fanned` + `mirrors_resolve` green. The file
now opens with a ★ RESOLVED header; §1–§6 preserved unedited.

★ **The lesson, because it nearly cost a re-ask:** a chronicle STATUS LINE can outlive its ruling, and
a later session will re-open a settled question on its authority. Resolve with `git log -S` on the
symbol the decision changed, then read the implementing commit — do NOT trust a status header.

**Gap closed while there:** the 2026-07-16 patch added FOUR `applies_to` enforcement branches (empty ·
not-a-subset · equals-every-essential · declared-but-not-honoured) and shipped ZERO planted cases for
them — four branches never proven to fire. All four now have negative cases; `applies_to_teeth` plants
the fabricated 400 mcg cobalt target RETURNING and asserts RED.

# ✔✔ THE "UNSEALED KEYSTONE" WAS A FALSE ALARM — AND THE FALSE ALARM IS THE LESSON
This section previously read *"★ STILL OPEN — the ruling's keystone sentence is UNSEALED … 3 books
… needs mining."* **Every part of that is wrong.** The sentence was mined on 2026-07-16, hours after
it was flagged: `WAL-CLM-IMMORT-000233` (definition; essentials `[cobalt, vitamin-b12]`;
immortality.txt char_offset 229062; sealed kv=338, commit **`cb5107f4`** — *"Close the 3 cobalt
follow-ups: mine the keystone claim…"*). Its question is the ruling's own: *"Does the body need
cobalt or vitamin B12?"* **DO NOT MINE IT. A second copy would be a duplicate claim.**

**★★ HOW A FALSE NULL SURVIVED THREE HANDOFFS AND GOT A TASK SPAWNED FOR IT.** The 2026-08-03 check
searched for the literal string `pure cobalt requirement`. Corpus verbatims are byte-exact OCR with
**line wraps inside sentences** — IMMORT-000233 stores it as `"A pure\ncobalt requirement…"` — so the
search **could not** return a hit, and its NULL agreed with a stale doc bullet, which made it look
confirmed. The same blindness reported **3** books when there are **4** (`immortality` also wraps it).
It was then written into the contradictions file, the build-log, the Creator's Log, commit
`a362a546`, this handoff, AND a spawned mining task — all describing it as *"re-measured, not
inherited."* The measurement was the weakest link, not the inheritance.

★ **THE RULE THIS BUYS:** any search over book text or claim verbatims is **whitespace-insensitive or
it is blind** — `re.compile(r"pure\s+cobalt\s+requirement")`, never `"pure cobalt requirement" in t`.
And confirm existence by **reading the entity's claims**, not by grepping for a string you expect.
Memory: [[verification-doctrine]] §3.

---

# ★ STATE — measured 2026-08-03

- **Board 85/85**, 0 reds. (21 external · 22 consistency · 40 structural · 2 meta.) The new one is
  `no_duplicate_claims` — see above.
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

**Board 85/85 · kv=458 · tree clean, pushed · the OWED GATE IS DONE · the AUDIT CAMPAIGN IS CLOSED (all 3 decisions
answered, 0 awaiting Luneth) · divergences 73 + a 36-token register · backlog 1,283 ·
claims_verified 642 · NEXT = ELEMENT HEADER ENRICHMENT.**
