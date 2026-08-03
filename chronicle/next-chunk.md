# Next chunk — ★ AUTHORITATIVE HANDOFF

_Rewritten from scratch 2026-08-03 at the close of the front-facing page-read campaign. The previous
version had accumulated three strata of edits and was contradicting itself (a struck-through "FIXED"
note sitting directly above the same item marked "NOT fixed", and a footer reading `Board 83/83 ·
kv=448 · backlog 1,716`). **Every number in this file was MEASURED at handoff by running the tool,
not carried forward.** Where an older document disagrees with this one, this one wins._

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis`; Claude runs `PYTHONUTF8=1 python tools/genesis.py` ONLY in response, reports,
then asks what to resume. Never a flair-only boot.

---

# ★ STATE — measured 2026-08-03

- **Board 84/84**, 0 reds. (21 external · 22 consistency · 39 structural · 2 meta.)
- **Corpus sealed at `knowledge_version=456`**, `corpus_verify` PASS — 2,268 claims · 7 books ·
  hashes match. Build fresh, all derived artifacts in sync. *(454 → 455 → 456 in the 2026-08-03
  review sweep; see the SWEEP block below.)*
- **Tree clean, everything pushed** — `master` through **`e67196a9`**. (The only file that ever shows
  dirty is `tools/canaries/safe-write-probe.txt`; it rewrites its own nonce every time `safe_write`
  runs. That is normal, not a change.)
- **Front-facing backlog: 1,283.** Per book: **epigenetics 328 · lets-play-doctor 335 ·
  rare-earths 283 · immortality 255 · hells-kitchen 82.**
- **`claims_verified` = 642.** `books_verified` = `dddl-3e-2011` · `iaiyh` — **but read ⚠ DECISION 1
  below before trusting that label.**
- Campaign arc this session: backlog **1,900 → 1,716 → 1,505 → 1,292 → 1,283**;
  `claims_verified` **25 → 642**.

---

# ✔ THE 2026-08-03 REVIEW SWEEP — CLOSED (read before touching the ledger)

Luneth's end-of-campaign sweep ran. **Every logged item was verified against the SEALED CORPUS
before he was shown any of it** — 198 checks, 177 exact matches. That verification, not the log,
is what the rulings were made on, and it found ten places where the log and the disk disagreed.

**★ The finding worth carrying forward: `claim_text` is UNGATED and had drifted.** The book-typo
class was applied to `eden/corpus/books/*.txt` and to the verbatims and **stopped there**, so seven
claims carried the corrected word in Wallach's quote and the old misspelling in our own summary
beside it (`Blepherisma`, `Walter Nodack` ×2, `Sir Humphrey Davy` ×2, `attributed soley to`,
`'borytes'`). All six tokens were already 0 in the sources — claims-only drift. `corpus_resnap` and
the verbatim gates check the quote against the book; **`claim_text` is checked against nothing.**
Related memory: `claim-text-numbers-unguarded`. No gate covers this today (WISH, R7).

**★ Handoff trap #4 was live in the DATA, not just in the warning.** Two verbatims held LESS than
the log said: `EPIGEN-000151` was one character short, and `EPIGEN-000096` held 183 chars against a
logged 479-char restoration — the whole "Animal studies show that a deficiency of Li results in
reproductive failure, infertility…" sentence was missing from the claim while the log said it had
been restored. Both invisible to `corpus_resnap` because a shorter span is still a valid substring.

**★ "Whole class" in a log is a claim about the world and needs measuring like any other.** Writing
the book-typo class into the ledger surfaced that it had never been finished: six of 36 tokens still
had live occurrences, **two reader-facing** (`IMMORT-000249` "catechens (EGCGs)", `RARE-000376`
"a constituant of every liquid"). And the `Bl`→`B1` sweep had been **dddl-ONLY** despite the
build-log reading "48 EDITS ACROSS ALL SIX BOOKS … the whole class" — the same token was live in
hk and lets-play-doctor. All 8 fixed (each `Bl` site first verified to name its vitamin adjacently,
per trap #10).

**Ledger state now:** `divergences[]` = 73 · `book_typo_divergences` = 36 token entries, each with a
count MEASURED against the sealed corpus (a stale measurement asserting a clean state that does not
exist is worse than no entry). Scope limit written into the key and repeated here: it covers the
tokens the waves + the class batch corrected. It is **NOT** a proof that every book typo is either
corrected or listed — no gate establishes that (WISH, R7).

**Still open from the sweep:** DECISION 1 (`books_verified`) — Luneth has not ruled.

---

# ★★★ THE ONE FACT THAT CHANGES WHAT COMES NEXT

**The corroboration instrument is EXHAUSTED.** Regenerated end to end at handoff
(`build_targets` → `corr2` → `corr_shots` → `select_reads`) against the current sealed corpus:

```
book                  claims  located   AGREE  has hunks
rare-earths              283      283     219         64
lets-play-doctor         335      335     176        159
hells-kitchen             82       82      81          1
epigenetics              328      328     300         28
immortality              255      255     155        100
TOTAL                   1283     1283     931        352
```

`select_reads` now yields **TIER A1 = 0 · A2 = 0 · A3 = 0 · B-alignment-slip = 0 ·
B-dropped-text = 0 · UNLOCATED = 0**, and a fresh 30-claim **control** sample. The 352 claims that
still produce hunks produce ONLY suppressed-with-reason ones (pdf-spacing 203 · uniform-typo-fix 109
· unit-ocr-resolved 103 · subscript-normalized 24 · pdf-page-number-bleed 5 · silver-400mcg 1 = 445).

**What this means, precisely:** every disagreement the second-OCR instrument can SEE has been read
and resolved. The remaining 1,283 are not "unexamined" — they are the class the instrument is
STRUCTURALLY BLIND TO, because both passes read the same physical scan and share their errors.
Do not expect another `select_reads` run to produce work. It will not. The next reduction in that
1,283 has to come from a different instrument or from whole-page reading.

---

# ★ THE MEASUREMENT THAT GOVERNS THE BACKLOG

**Three independent control samples, page-read end to end, of claims where BOTH OCR passes AGREED:**

| sample | defects found |
|---|---|
| control 1 | 7 of 30 |
| control 2 | 4 of 30 |
| control 3 | 2 of 30 |
| **total** | **13 of 90 ≈ 14%** |

Agreement is corroboration, **never** verification. That is why the 931 agreeing claims stay in the
backlog. The rate is trending down as the corpus gets cleaner, but it is not zero. Changing this
policy is Luneth's call and it changes what `claims_verified` MEANS.

---

# ⚠ DECISIONS WAITING ON LUNETH (do not resolve these unilaterally)

### DECISION 1 — what does `books_verified` actually assert?
`dddl-3e-2011` is one of only TWO books marked "audited-pristine". It wrote **B1 as `Bl` seventeen
times** plus seven botanical/technical typos. The purity gate never saw them because the book's own
reviewed-OK allowlist — `eden/tools/purity-baselines/dddl-3e-2011.json::spell_ok`, 1,325 entries —
**CONTAINED the misspellings** (`aqutifolia`, `blepherisma`, `ustatissimum`, `fragula`,
`phosphytidyl`, `phosphatydil`, `tinnitis`). The audit's allowlist had absorbed them, so the book
stayed green while carrying them.

All 17 `Bl` and all seven typos are now FIXED and the stale carve-outs REMOVED. What is open is the
label: if an "audited-pristine" allowlist can bless typos, `books_verified` means less than it
sounds like — and `iaiyh` (the other one) has a 125-entry baseline nobody has re-examined.
**There is also no page image or PDF for DDDL anywhere in the repo**, so it cannot be page-read at
all; its 17 `Bl` were resolved from unambiguous context, not from a page.

### ✔ DECISION 2 — the pending-review sweep — **CLOSED 2026-08-03. Do not re-open.**
Luneth ran it. All 198 logged items were verified MECHANICALLY against the sealed corpus first
(177 matched; the rest produced the ten log-vs-disk defects listed in the SWEEP block below), then
he ratified **all 65** still-unprotected divergences in bulk **and** the **whole book-typo class**.
`divergences[]` went 7 → 73, plus a new 36-token `book_typo_divergences` register. The historical
batch list is kept below as the record of what was swept:
`batch_2026-08-02` (21) · `_nonword` (19 + 3) · `wave1` (41 applied + 41 unlogged divergences +
8 proposals + 4 extent) · `wave2` (28 + 25 + 4 + 4 + 1) · `wave3-and-booktypos` (11 + 1 + 1 + 1 +
three prose findings). Two in the first batch are flagged **SEMANTIC** (`borytes`→barytes,
`Aspartamine`→Aspartame) — corrected from meaning rather than spelling, so check those first.

### ✔ DECISION 3 — the 12 book-typo proposals — **CLOSED 2026-08-03.**
Ratified with the rest. Two corrections to what this section used to say, both measured:
(a) the ledger's `proposals_not_applied` headings (wave1 ×8, wave2 ×4) were a **STALE LABEL** —
all 14 tokens were already applied, swept up by wave 3's whole-class batch without the headings
being updated, so they read as "awaiting his decision" when the decision had been executed;
(b) the whole-class batch **was not whole** — six of its 36 tokens still had live occurrences,
two of them reader-facing. All eight fixed. Both annotated in place in the ledger.

---

# ★ THE DOCTRINE RULING THAT GOVERNS ALL CORPUS TEXT
Saved as memory **`books-are-riddled-use-outside-info`**. Verbatim, because the WHY is the point:

> "the book has MANY misprints — so the PDFs and screenshots of the actual book are not always
> correct and should not be treated that way, this heavy level of auditing real info is what has
> slowed us down tremendously in the past"

> "You are being pedantic, the books are RIDDLED with errors like this and we NEED outside
> information to correct it — what we DON'T correct is true Wallach statements even if his
> statements disagree with outside norms, what we DO fix is when there's a clear typo or error such
> as gm instead of mg … these fixes should be noted for my review when they occur so I can do a
> review sweep at the end just in case you over-reach"

- The page is **EVIDENCE, NOT GROUND TRUTH**.
- **FIX** clear typos / garbles / wrong units / destroyed subscripts / misspelled proper nouns, using
  outside knowledge — explicitly sanctioned.
- **NEVER TOUCH** a genuine Wallach statement, even when it contradicts mainstream fact.
- **DECIDE IT YOURSELF, then LOG IT.** Do not escalate every case; that is the pedantry he named.

---

# ★ `eden/tools/ratified-divergences.json` — CHECK BEFORE FLAGGING ANY DEFECT
Internal-only (nothing under `eden/tools/` is consumed by `corpus_derive` / `build_embeds` /
`build.mjs` — keep it that way).

**`divergences` — now **73** entries (was 7), plus a **36-token `book_typo_divergences`
register**. Places our text DELIBERATELY differs from a legible page. NEVER "restore".** The
original seven are below; the other 66 came from the 2026-08-03 bulk ratification and each carries
its reader's evidence verbatim. ★ Three of the new ones are SAFETY-CRITICAL dose divergences in the
silver-400mcg class: `LETS-000433` (page prints zinc at **50 gm** t.i.d., ours 50 mg — lethal if
restored), `LETS-000399` (copper at **2 gm**/day, ours 2 mg), `LETS-000051` (folic acid **gm**,
ours mg). ★ The class register exists because **every book-typo correction is a page-divergence by
construction** — we fix the .txt, the page keeps the typo — and 48+19 had been applied with exactly
one written down.

| claim | ours | the page prints |
|---|---|---|
| `RARE-000090` · `DDDL-000013` · `IMMORT-000027` | `400 mcg of silver per day` | `400 mg` — restoring it reintroduces a toxic dose |
| `LETS-000349` | `antitoxin` | `toxin` |
| `LETS-000452` | `vitamin A … as beta carotene` | `vitamin C` |
| `IMMORT-000024` | `(1nm to 100nm)` | `(1n to 100n)` |
| `LETS-000205` | `cartilage at 5 gm t.i.d.` | `5 mg` |
| `EPIGEN-000023` | `Dean Hamer` | `Dean Harmer` |
| `IMMORT-000197` | `(KrF2)` | `(KrF4)` — **Luneth ruled 2026-08-02** |

It has paid off repeatedly: an agent hit the silver claim, checked the list, and returned DOCTRINE_OK
instead of proposing a restore to a toxic dose.

---

# ★ THE TOOLKIT — `tools/frontface/` (committed; DO NOT REBUILD)
**Read `tools/frontface/README.md` first.** It explains each instrument AND what each does not prove.

- **`ocr-cache/` is committed** — 719 Tesseract page reads of the epigenetics + immortality captures,
  ~50 min of wall clock. Never regenerate unless a capture changes.
- `tools/frontface/work/` is gitignored generated analysis; the whole chain regenerates in ~3 min.
- The old `temporary/frontface-ocr-tools/` is SUPERSEDED and incomplete. Use `tools/frontface/`.

**Instruments:** `render.py` (all 3 PDF books) · `render_shot.py` (the 2 capture books) ·
`pdf_corroborate.py` · `corr2.py` (positional alignment) · `corr_shots.py` · `ocr_shots.js` +
`ocrhost.html` · `build_targets.py` · `select_reads.py` · `selfscan.py` · `triage_nonword.py` ·
`rank_nonword.py` · `scan_b_subscripts.py` · `sync_drafts.py` · `make_fixes*.py` ·
`build_wave.py` (page-GROUPS a readlist — the whole economy: claims collapse onto ~half as many
pages) · `build_wave3.py` · `build_extent_fixes.py` · `workflow-template.js`.

**`apply_*.py` are kept as worked examples — THE GUARDS IN THEM ARE THE LESSON**, not the edit lists:
per-edit occurrence-count assertions, post-conditions (every old gone AND every new present), and in
`apply_wave3.py` an **unread-sibling count assertion** that aborts the batch if untouched occurrences
change. A partial batch across six books is far worse than no batch.

---

# ★ NEXT TARGETS — ranked, with measured numbers

### 1. Destroyed B-vitamin subscripts — **174 occurrences**, 4 books, **0 currently reach a reader**
`tools/frontface/scan_b_subscripts.py`. epigenetics 72 · immortality 53 · rare-earths 47 · hk 2.
(Was 185; DDDL's 8 and the 3 reader-facing ones are fixed.) They sit in source text no claim quotes
today — so this is pre-emptive hygiene, and any future mining of those spans would inherit them.

**★ PROVABLY NOT BATCH-FIXABLE, and the proof is inside the class:** the identical token `Bg,` is
**B5** in "Pantothenic acid, aka vitamin Bg," and **B6** in "Vitamin Bg, originally designated B3".
Separately `Bi, Ca, Li` in RARE-000285 is **BISMUTH** in a mineral-replacement list, not B1 — the
scanner false-fires on element symbols starting with B, exactly as a subscript rule would have turned
BORON into a vitamin. Each instance IS resolvable from its own sentence, because these books name the
vitamin adjacently ("Vitamin B, (riboflavin) function:"). A page-read campaign, never a rule.

### 2. The non-word residue — **343 hits / 210 claims / 316 distinct tokens** (was 599 / 337)
`selfscan.py` → `triage_nonword.py` → `rank_nonword.py`. **Expect to CONFIRM, not fix:** of 105 such
tokens page-read, **62 were legitimate** — botanical Latin (*Leonurus cardiaca*, *Tinea pedis*),
British/older spellings (`caesium`, `paraesthesia`, `nitre`), trade names (`Silicea`, `Hoxsey`). The
spellchecker's suggestions carry **no authority**: it wanted `castro` for `gastro`, `penis` for
`pedis`, `honey` for `HOXEY`.

### 3. The damaged region around **epigenetics Screenshot(629)** — WORSE THAN THIS SAID
The right-column serial-killer table has bled into the prose as garbage (`Saton Strangler`,
`707-35 Kile`, `ageuepen es`, a trailing `Minos`). ★ **CORRECTED 2026-08-03:** "three dropped lines
were restored there" understates what happened. The repair did NOT repair the damaged paragraph —
it **APPENDED a clean reconstruction after the table bleed and left the mangled original in place**,
so `epigenetics.txt` carries three of those typeset lines **TWICE** (offsets ~1261106 and ~1262225):
`650,000 prescriptions`, `infertility, reduced growth rate`, and the Jekyll/Hyde line. `EPIGEN-000096`
now quotes the clean copy unambiguously (its first line occurs once), so nothing is broken — but the
duplication is real and inflates the book's byte count and offsets. Still a structural repair, not a
line fix. Worth doing before anything is mined from that page.

### 4. Sibling occurrences deliberately left unread — **38**
`Tourette's` ×4 and `Alzheimer's` ×19 in epigenetics, `1 ,000` ×15 in lets-play-doctor. Only the ten
that were page-read were fixed. **A bulk replace was measured and REFUSED:** these books have no
apostrophe convention to lean on — lets-play-doctor is 100% ASCII (386/386), dddl 100% curly
(1156/1156), but epigenetics runs 68% ASCII and rare-earths 40%, **MIXED inside the same book**.

### 5. The 931 corroborated-but-unread claims
Backlog by measurement (the 14% control). Clearing them means whole-page reads — roughly six more
waves at this session's rate (~210 claims/wave, ~45 min, ~110 agents).

---

# ✔ CLOSED THIS SESSION — DO NOT RE-OPEN
- **The 443-claim page-read list** — both waves shipped; the instrument is now exhausted (see above).
- **The search-routing bug.** Root cause: `tokenize()` drops stopwords, so a bare
  `"what are antioxidants"` reduced to the topic word ALONE and all seven antioxidant claims scored
  **identically (23 each)** — leaving `rankClaims`' tie-break, **claim id ASCENDING**, to pick the
  hero alphabetically (the weight-loss warning beat the definition because H sorts before I).
  `heroByIntent` now heroes the topic's `basics` answer when the intent is empty.
  `render_probe_search_routing` **6/6**.
- **The "reduced" gloss bug.** All four forms (`reduced`/`reduction`/`reduce`/`reducing`) are in
  `term-gloss-lexicon.json::glossary_key_denylist` behind the live critical gate
  `glossary_keys_denylisted`. Older docs listing it as open are STALE.
- **The 4 claim-extent defects** (`EPIGEN-000124` · `-000125` · `IMMORT-000230` · `LETS-000278`).
- **The 3 claims that were shipping OCR scaffolding to users** — plus a new gate so it cannot recur.
- **The 12 book-typo proposals and the whole class behind them** — 48 edits across all 6 books.
- **DDDL's 17 `Bl`** and the 7 baseline-blessed typos.
- **The 11 apostrophe / `1 ,000` siblings** that were page-read.

---

# ★ GATES — what is enforced now
`frontface_verbatims_clean` gates **EIGHT** mechanical classes (negative test: 45 cases). A **NINTH**
gate shipped 2026-08-02: **`verbatim_no_transcription_scaffolding`** (critical, 21-case negative
test) — no sealed verbatim or `claim_text` may contain the capture harness's frame name
(`Screenshot (N)`), the reader's `Page N of M` readout, a `===`-run separator, or a Kindle location
marker. It needs **no exception list**, because scaffolding is text WE inserted and can never
legitimately appear in a quote. It deliberately does NOT police asterisk or underscore runs — a
printed page can carry those.

---

# ⚠ TRAPS THAT WILL COST A SESSION
1. **`corpus_seal` is USER-ONLY by default.** Permission was granted for the 2026-08-02/03 session
   specifically. **Do not assume it carries forward — ask.**
2. **Sync the drafts after every resnap.** `corpus_resnap --write` updates the SHARD only; sealing
   without `tools/frontface/sync_drafts.py` silently restores stale offsets. This has bitten FIVE
   times. Prove `corpus_seal.draft_offset_failures() == []` before every seal.
3. **★ A GATE CAN BE GREEN *BECAUSE OF* THE DEFECT.** Twice in one batch: trimming scaffolding out of
   `EPIGEN-000124/-000125` dropped them under `corpus_seal`'s 60-char floor — the scaffolding had been
   the only thing clearing it; and `verbatim_names_mapped_conditions` only passed on `IMMORT-000230`
   because a bad cut had swallowed the word "Goiter" from the previous page. On a post-fix RED, ask
   *what was making this pass before?* If the answer is the defect, repair the data — never widen the
   gate. Memory: `a-gate-can-be-green-because-of-the-defect`.
4. **★ AN END-TRUNCATION IS INVISIBLE TO `corpus_resnap`.** A truncated verbatim is still a valid
   SUBSTRING of the corrected text, so resnap RELOCATES it and never reports BROKEN — it would stay
   cut mid-word on a fully green board. Any fix that LENGTHENS a verbatim at its end needs an explicit
   `--fix`. **Always assert the CORRECTION is PRESENT, not merely that the defect is gone.**
5. **`Screenshot (N).png` is a TWO-PAGE SPREAD** in a 3840×1080 dual-monitor frame; the book is the
   left ~26 % and the gutter sits at **x = 0.2506**. Render `both` FIRST.
6. **`pdftoppm` is NOT installed** — the `Read` tool cannot open a PDF page. Use
   `tools/frontface/render.py`.
7. **`coverage < 0.85` means the page index is UNRELIABLE**, not that the claim is dirty. The locator
   once sent `RARE-000335` to p412 instead of p495 and manufactured a phantom hunk.
8. **Never bare-token replace.** `uncers`, `ofdiarrhea` and `dietaiy` each occur more than once, and
   the two `ofdiarrhea` occurrences **DISAGREE** — one page prints the space, the other does not.
   Anchor on a window from the claim's OWN verbatim, widened until unique.
9. **A claim can hold the same damaged token twice**, and two claims can quote ONE span. Both bit this
   campaign; both are handled in the `apply_*.py` guards.
10. **Read the page before batch-fixing a detector's hits.** 11 of 47 subscript hits were BORON in a
    mineral list — a rule would have turned boron into a vitamin in 5 claims.
11. **A frequency-based innocence test cannot be used on the SUSPECT side of a systematic error.** A
    repeated OCR defect certifies itself as "corpus vocabulary" and hides from the scan hunting it —
    `lodine` occurs 13× and did exactly that. Memory: `frequency-cannot-prove-innocence`.
12. **Nested heredocs inside `$( )` break bash here.** Write long `--detail` bodies to a file and pass
    the path, or the whole compound command dies with `unexpected EOF`.

---

# ★ HONEST GAPS — do not let a green board imply otherwise
- The gates hold a MECHANICAL floor over nine classes. They cannot see a **valid-word swap**
  (`he`/`the`, `side`/`vide`). Only a page read finds those.
- `subscript_damage` **deliberately cannot see a bare single-comma `B,`** that really is a vitamin,
  because it is indistinguishable from boron. Labelled WISH (R7), not a covered case. Its formula
  clause is a hard-coded `CO|H|SO|NO`. **A generalised formula pattern was TRIED and REJECTED** — it
  fires on 51 innocent things (`TMJ,` `DNA,` `ADD,` `VII,` and RNA codons `ACU, ACA, ACC`); a vitamin
  D/E/K pattern scored 2 true against 4 false. Only the `By,`/`Bg,` shape is tight enough. **Do not
  re-attempt the other two without new evidence.**
- `selfscan.py` is LOOSER than the shipped gate by design; its 1 remaining subscript hit is the known
  `Preparation H,` false positive.
- `build_targets.py` reads the BACKLOG, so every number these tools print describes work REMAINING.
- **`claims_verified` holds two grades** and the ledger's `_standard` says which is which:
  WHOLE-VERBATIM (waves 1–2, the stronger) and DEFECT-SPAN (wave 3, marks measured but not the whole
  quote). Do not blur them.

---

# ★ OTHER OPEN WORK — the enrichment / header track
- **Element headers: 6 of 90 shipped** — selenium, copper, zinc, calcium, magnesium, vitamin A.
- **`dashboard/assets/data/entity-copy.json` has entries for exactly those 6 essentials and ZERO
  conditions.** Every header needs a complete `lede` + `why` pair (`element_header_complete`).
- **47 research dossiers** sit in `chronicle/header-research/` (48 files incl. README) — grounded
  head-starts for that many of the remaining 84. **Read the dossier before mocking up.**
- **Vitamin C:** 4 redesigned demos in `temporary/vitamin-c-demos.html` await Luneth's direction pick
  → refine → build live → visual sign-off.
- **Vitamin A (SHIPPED):** its pull-quote is a ~240-char run-on he wants shorter. He REJECTED four
  options (DDDL-000056 / DDDL-000165-trim / LETS-000196 / DDDL-000041) and was choosing his own when
  the OCR work interrupted. Lives in `mechanism-clarity-data.json` under vitamin-a `quote`.
- **★ READ `.claude/rules/element-headers.md` BEFORE ANY HEADER WORK.** Only FOUR things are fixed
  (the `lede`, "why this number?", the width, the background); everything else is composed per
  element from the `blocks[]` vocabulary. **NEVER build a header live without explicit permission.**

---

# STANDING DOCTRINES
1. `corpus_seal` / `catalog_seal` are **USER-ONLY** by default.
2. **NEVER fabricate** — verbatim ⊆ sealed source, or say UNREADABLE. Never guess, and never guess
   silently. An honest unreadable beats a confident wrong reading (wave 3 refuted a real proposal to
   UNREADABLE and left the text alone; that was the right outcome).
3. Every claim lives in ONE of 3 homes; search is a retrieval layer, not a silo.
4. A DOM probe is **NOT** a visual check — screenshot + STOP for his eyes.
5. **NEVER build a header live without explicit permission.**
6. Small, reviewed increments; report and stop at the chunk boundary.
7. No "for good" without a GATE. A rule with no gate is a labelled WISH (R7).

---

**Board 84/84 · kv=456 · tree clean, pushed through `47b7d6cf` · backlog 1,283 · claims_verified 642
· corroboration instrument EXHAUSTED (read list empty but for the control) · 9 gated classes ·
divergences 73 + a 36-token class register · the pending-review sweep is CLOSED ·
TOP PRIORITY = Luneth's call: the still-open `books_verified` ruling (DECISION 1), or pivot to
the element headers.**
