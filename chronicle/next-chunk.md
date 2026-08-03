# Next chunk — ★ AUTHORITATIVE HANDOFF (rewritten 2026-08-02, end of the corroboration + vision session)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` in a NEW session; Claude runs `tools/genesis.py` ONLY in response, reports,
then asks what to resume.

# ★ STATE — every number below was MEASURED at handoff, not remembered
- **Board 84/84**, 0 reds. Corpus sealed at **knowledge_version=454**, `corpus_verify` PASS
  (2268 claims · 7 books · hashes match). Build fresh, all derived artifacts in sync.
- **Everything is committed and pushed** (`master`, through `9df9a075`).
- **Front-facing backlog: 1,283** (1,900 → 1,716 → 1,505 → 1,292 → 1,283). `claims_verified` holds
  **642**. `books_verified` = `dddl-3e-2011` · `iaiyh` — but see the ⚠ below before trusting that.
  Per book remaining: epigenetics 326 · immortality 255 · lets-play-doctor 336 · rare-earths 284 ·
  hells-kitchen 82.
- ✔ **THE PRE-EXISTING SEARCH-ROUTING BUG IS FIXED** (it is no longer an open item). Root cause:
  `tokenize()` drops stopwords, so a bare `"what are antioxidants"` reduces to the topic word ALONE
  and every claim about the topic scored IDENTICALLY (23 each) — leaving `rankClaims`' tie-break,
  **claim id ASCENDING**, to pick the hero alphabetically. The weight-loss warning beat the
  definition because H sorts before I. `heroByIntent` now heroes the topic's `basics` answer when
  the intent is empty. `render_probe_search_routing` 6/6.
- ✔ **The "reduced" gloss bug is CLOSED too** — all four forms (`reduced`/`reduction`/`reduce`/
  `reducing`) are in `term-gloss-lexicon.json::glossary_key_denylist` behind the live critical gate
  `glossary_keys_denylisted`. Older handoffs listing it as open are STALE.
- ⚠ **`books_verified` IS WEAKER THAN IT SOUNDS — Luneth's ruling needed.** `dddl-3e-2011`, one of
  only two books asserted "audited-pristine", wrote B1 as `Bl` **17 times** plus 7 botanical typos.
  The purity gate never saw them because the book's OWN reviewed-OK allowlist
  (`eden/tools/purity-baselines/dddl-3e-2011.json::spell_ok`, 1,325 entries) **contained the
  misspellings** (aqutifolia, blepherisma, ustatissimum, fragula, phosphytidyl, phosphatydil,
  tinnitis). All are now fixed and the stale carve-outs removed — but the question of what
  `books_verified` asserts is open. There is also **no page image or PDF for DDDL in the repo**, so
  it cannot be page-read at all.
- `frontface_verbatims_clean` gates **EIGHT** mechanical classes (negative test 45 cases), and a
  NINTH gate shipped 2026-08-02: **`verbatim_no_transcription_scaffolding`** (critical, 21-case
  negative test) — no sealed verbatim may contain the capture harness's frame name, the reader's
  "Page N of M" readout, a `===`-run separator, or a Kindle location marker.
- ~~ONE PRE-EXISTING PROBE FAILURE~~ — ✔ FIXED, see the state block above. Original note kept:
  `tools/render_probe_search_routing.js` fails 1/6 — "what are antioxidants" heroes
  `WAL-CLM-HELLS-000016` (facet=warning) instead of the definition. Attributed by evidence: the
  search index's ordered id list and its `entities` block were byte-identical across the wave-1
  change, only `verbatim` differed, and the wrongly-picked hero is itself unchanged. Own ticket.
- ⚠ **ONE PRE-EXISTING PROBE FAILURE, not caused by the wave-1 work and NOT fixed:**
  `tools/render_probe_search_routing.js` fails 1/6 — "what are antioxidants" heroes
  `WAL-CLM-HELLS-000016` (facet=warning) instead of the definition. Attributed to before this work by
  evidence, not by re-running at HEAD: the search index's ordered id list is identical, `entities` is
  byte-identical, exactly 42 entries changed (precisely the wave-1 fix set), and the ONLY field
  differing in any of them is `verbatim` — every routing field is untouched and the wrongly-picked
  hero is itself unchanged. Different subsystem; own ticket.

# ★★★ READ THIS FIRST: `tools/frontface/README.md`
The whole toolkit moved OUT of the session scratchpad INTO the repo this session, precisely so
nothing here has to be rebuilt. It is committed, it runs, and it was smoke-tested from its new home.
The README explains each instrument AND what each does not prove. **Do not rebuild any of it.**

- **`tools/frontface/ocr-cache/` is committed** — 719 Tesseract page reads of the epigenetics and
  immortality captures, ~50 minutes of wall clock. Never regenerate unless a capture changes.
- `tools/frontface/work/` is gitignored and holds generated analysis; it regenerates in seconds.
- The old `temporary/frontface-ocr-tools/` still exists but is SUPERSEDED and incomplete
  (`render_page.py` there knows only two of the three PDF books). Use `tools/frontface/`.

# ★ THE ONE RESULT THAT SHAPES EVERYTHING ELSE
**Two machines agreeing is NOT verification.** 30 claims where BOTH independent OCR passes agreed
were page-read end to end; **7 still carried a defect** (`fmctose`/`chemes` — both passes shared the
error; `mcgt.i.d.,folicacidat`; `zarniga`; a comma read as a period; two punctuation cases). One of
the seven was a slice-end false positive, so ~6 real in 30.

Consequence, and it is a MEASUREMENT not a caution: the **997 claims that currently agree with their
second OCR remain in the backlog**. They cannot be retired on agreement. Luneth chose "read the 508,
then decide" before this was measured; the measurement now backs that choice with evidence.

# ★ WHAT LUNETH RULED THIS SESSION — read before touching any corpus text
Saved as memory **`books-are-riddled-use-outside-info`**. It corrected a premise I was working from
all session and it changes the economics of this campaign:

> "the book has MANY misprints — so the PDFs and screenshots of the actual book are not always
> correct and should not be treated that way, this heavy level of auditing real info is what has
> slowed us down tremendously in the past"

> "You are being pedantic, the books are RIDDLED with errors like this and we NEED outside
> information to correct it — what we DON'T correct is true Wallach statements even if his
> statements disagree with outside norms, what we DO fix is when there's a clear typo or error such
> as gm instead of mg … these fixes should be noted for my review when they occur so I can do a
> review sweep at the end just in case you over-reach"

- The page is **EVIDENCE, NOT GROUND TRUTH**.
- **FIX** clear typos/garbles/wrong units/destroyed subscripts/misspelled proper nouns, using outside
  knowledge — it is explicitly sanctioned.
- **NEVER TOUCH** a genuine Wallach statement, even when it contradicts mainstream fact.
- **DECIDE IT YOURSELF, then LOG IT.** Do not escalate every case; that is the pedantry he named.

# ★ `eden/tools/ratified-divergences.json` — CHECK IT BEFORE FLAGGING ANY DEFECT
New this session, internal-only (nothing under `eden/tools/` is consumed by
`corpus_derive`/`build_embeds`/`build.mjs` — verified, keep it that way). Two sections:

- **`divergences`** — 6 places our text DELIBERATELY differs from a legible page and must NEVER be
  "restored": silver `400 mcg` (page prints `400 mg` — restoring it reintroduces a toxic dose),
  `antitoxin` (page: `toxin`), `vitamin A … as beta carotene` (page: `vitamin C`), `1nm to 100nm`
  (page: `1n to 100n`), cartilage `5 gm` (page: `5 mg`), `Dean Hamer` (page: `Dean Harmer`).
- **`pending_review`** — 40+ judgment-call corrections awaiting Luneth's end-of-campaign sweep, each
  with what changed and why. Two are flagged **SEMANTIC** (`borytes`→barytes,
  `Aspartamine`→Aspartame) because they were corrected from meaning rather than spelling.

**Why it exists:** TWO of this session's "findings" (`antitoxin`, `1nm`) were corrections already
made in earlier sessions and never logged, so each was re-derived at the cost of a render, a 20–40×
read and an adversarial second read. It has already paid off once — an agent hit the silver claim,
checked the list, and returned DOCTRINE_OK instead of proposing the restore.

# ★ NEXT WORK, in priority order

## 1. ✔✔ THE 443-CLAIM PAGE-READ LIST IS COMPLETE (2026-08-02). Both waves shipped.
**Wave 1** — tier A + control, 213 claims / 141 groups: 118 CLEAN · 44 defects fixed · 41 unlogged
divergences recorded · 2 refuted. **Wave 2** — tier B + the 2 residual tier-A + a third control,
212 claims / 140 groups: 151 CLEAN · 26 defects · 1 real dropped-text · 25 unlogged divergences ·
4 book-typo proposals · 4 refuted. Regenerate the chain (`build_targets` → `corr2`/`corr_shots` →
`select_reads` → `build_wave.py`) before any new wave — wave 2 had to, because wave 1's fixes had
changed the corpus underneath the list.

**★ THE CONTROL, NOW THREE INDEPENDENT SAMPLES: 7/30, 4/30, 2/30 = 13 of 90 (14%)** of claims where
BOTH OCR passes AGREED still carried a defect. That is the measurement keeping the ~880
corroborated-but-unread claims in the backlog. It is trending down as the corpus gets cleaner, but
it is not zero and it never was.

**★ TWO GATE-SHAPED LESSONS FROM WAVE 2, both worth re-reading before the next batch:**
- **A gate can be green because of the defect.** Trimming scaffolding out of EPIGEN-000124/-000125
  dropped them under `corpus_seal`'s 60-char floor — the scaffolding had been the only thing
  clearing it. And `verbatim_names_mapped_conditions` only passed on IMMORT-000230 because the bad
  cut had swallowed the word "Goiter" from the previous page.
- **An END-TRUNCATION is invisible to `corpus_resnap`.** A truncated verbatim is still a valid
  SUBSTRING of the corrected text, so resnap relocates it and never says BROKEN. Any fix that
  LENGTHENS a verbatim at its end needs an explicit `--fix`. Caught only because the post-fix
  re-scan asserts each CORRECTION is PRESENT, not merely that each defect is gone — do both.

## 1b. (superseded) the original wave-2 planning note
Regenerate with `build_targets` → `corr2`/`corr_shots` → `select_reads` (seconds), then
`python tools/frontface/build_wave.py wave2 B` — it PAGE-GROUPS the list, which is the whole
economy: 443 claims sit on only 216 distinct pages. Wave 2 is **230 claims / 144 page groups**
(alignment-slip 130 · dropped-text 100; immortality 112 · lets-play-doctor 47 · epigenetics 40 ·
rare-earths 31).

**Wave-1 result, for calibration:** 118 CLEAN · 44 defects in our text (all fixed) · 8 book-typo
proposals · 41 unlogged divergences · 2 refuted. Expect MOSTLY CLEAN; a reader who needs to find
something invents something.

**★ TIER B IS SMALLER THAN IT LOOKS — measured 2026-08-02, use this in the agent brief:** of the
dropped-text inserts, **52 are the ebook reader's own page-number chrome** (`page 531 of etics`,
`936 74 epigen`) **or table/figure banners**, i.e. machine artifacts, not lost text. Only **6**
genuinely interior mid-verbatim gaps exist across the three PDF books — two of them dropped DOSE
lines (`LETS-000147` "IU day Bcomplex at 50", `LETS-000051` "gm INOSITOL 75"), which are the
highest-value reads in the whole tier. `corr2` already trims pure head/tail spill, but it keeps a
25-word slack band, so an "insert" near either edge is usually excerpt boundary, not a drop.

**Immortality is still the least trustworthy slice**: 106 of 238 tier-A hunks were the second OCR
merely shaving letters off a word (`The`→`he`, `Gallium`→`allium`), **95 of them in immortality**.
Tell the readers this explicitly — it was in the wave-1 brief and it is why 118 came back clean.

## 1c. ★ THE NEXT REAL TARGETS, ranked by what wave 2 measured
1. **Destroyed B-vitamin subscripts — 185 occurrences, 5 books, only 7 reach a reader.**
   `tools/frontface/scan_b_subscripts.py`. **PROVABLY NOT BATCH-FIXABLE:** the identical token
   `Bg,` is **B5** in "Pantothenic acid, aka vitamin Bg," and **B6** in "Vitamin Bg, originally
   designated B3"; and `Bi, Ca, Li` in RARE-000285 is **BISMUTH** in a mineral-replacement list,
   not B1. Each instance is resolvable from its OWN sentence, because these books name the vitamin
   adjacently ("Vitamin B, (riboflavin) function:"), so this is a page-read campaign, not a rule.
2. **⚠ `books_verified` MAY BE OVERSTATING ITSELF — needs Luneth's ruling.** `dddl-3e-2011`, one of
   the only two books asserted "audited-pristine", writes B1 correctly 7 times and as **`Bl` 17
   times**, and 3 of those reach readers (DDDL-000078, -000150, -000220). There is **no page image
   or PDF for DDDL in the toolkit**, so it cannot be page-read here and the never-guess rule forbids
   resolving it unilaterally. Either the audit missed a class, or `books_verified` means less than
   it sounds like.
3. **The damaged region around epigenetics Screenshot(629)** — the right-column serial-killer table
   has bled into the prose as garbage (`Saton Strangler`, `707-35 Kile`, `ageuepen es`, a trailing
   `Minos`). Three dropped lines were restored there; the bled-in table was left alone because no
   claim quotes it and it is a structural repair, not a line fix.
4. **Sibling occurrences deliberately left unread**: ASCII apostrophes where the page prints curly
   (`Tourette's` ×3, `Alzheimer's` ×4), and 4 remaining `1 ,000 mg`. Policy unchanged — two
   `ofdiarrhea` occurrences in this corpus DISAGREE about the space, so nothing is batch-replaced.

## 1d. ✔ CLOSED THIS SESSION (do not re-open these)
The search-routing bug · the "reduced" gloss bug (already closed before, handoff was stale) · the
443-claim read list (both waves) · the 12 book-typo proposals AND the whole class behind them (48
edits across all 6 books) · the 4 claim-extent defects · the 3 claims shipping OCR scaffolding
(plus a new gate so it cannot recur) · the 11 apostrophe/number siblings · DDDL's 17 `Bl`.

## 2. The non-word residue — REMEASURED 2026-08-03: 345 hits in 212 claims (was 599 in 337)
`selfscan.py` → `triage_nonword.py` → `rank_nonword.py`. **Expect to CONFIRM, not fix**: of 105 such
tokens page-read this session, 62 were legitimate (botanical Latin, British spellings, trade names).
The spellchecker's suggestions carry NO authority — it wanted `castro` for `gastro`, `penis` for
`pedis`, `honey` for `HOXEY`.

## 2b. ✔ MEASURED 2026-08-02 — three classes now sized, none gated (deliberate)
- **page-number injection** (`autoim- 132 mune`): **12** in sources, **1 shipping** (`LETS-000306`).
- **hyphen-LESS split** (`constipa\ntion`): **9** in sources, **0 shipping**.
- **capital I read as lowercase l** (NEW, 9th class): **53** occurrences / 12 tokens
  (`lowa`→Iowa 22 · `lodine`→Iodine 12 · `lan`→Ian 8 · `lonic` · `lonia` · `latrogenic` · `lliad` ·
  `lodized`). The one that reached a reader is fixed; 52 sit in source text no claim quotes.
- **`subscript_damage` HAS A HOLE**: its formula clause is a hard-coded `CO|H|SO|NO`, so `ZrSiO,`
  and `SiO,` pass, as does `By,`→B12. ★ A generalised formula pattern was TRIED and **REJECTED** —
  it fires on 51 innocent things (`TMJ,` `DNA,` `ADD,` `VII,` and RNA codons `ACU, ACA, ACC`); a
  vitamin D/E/K pattern scored 2 true against 4 false. **Only the `By,`/`Bg,` shape (4 hits, 3
  claims) is tight enough to gate.** Do not re-attempt the other two without new evidence.

## 3. The original hyphen-gap note (superseded by 2b above, kept for its reasoning)
`_FF_MID_WORD_HYPHEN` was tightened this session to `[A-Za-z]{2,}-[ \t]*\n[ \t]*[A-Za-z]{2,}` (it had
required the hyphen to ABUT the newline, which made Hell's Kitchen's whole wrap style invisible — 76
splits). Two sibling shapes are still invisible:
- **hyphen-LESS split**: `can be en\nhanced` — the page prints `en-`/`hanced` and our OCR dropped the
  hyphen too, so a detector that requires a hyphen cannot see it.
- **page-number injection**: `autoim- 132 mune` — a page number landed between the halves.

Both were left unpatched ON PURPOSE: tightening a gate from a single instance is how the earlier
over-fire happened. **Measure the class first**, then codify with a negative test.

## 3b. FOUR CLAIM-EXTENT DEFECTS — a repair route no source edit can take
`EPIGEN-000124` · `EPIGEN-000125` · `IMMORT-000230` each swallowed a transcription page separator
(`===== Screenshot (675) -- Page 818 of 936 =====`) INTO the verbatim, i.e. the app can render OCR
scaffolding to a user. **Do NOT edit the .txt for these** — those separators are legitimate
scaffolding (466 in epigenetics, 255 in immortality); the repair is a verbatim RE-CUT via the EDIT
route (`mine_batch apply`). `LETS-000278`'s verbatim stops two characters short of the page's
`pepper (Piper nigrum).`. All four are held out of `claims_verified` or unread; logged in
`ratified-divergences.json::pending_review::batch_2026-08-02-wave1::claim_extent_defects_held`.

## 3c. `WAL-CLM-RARE-000372` HOLDS 50 OF THE 60 ELEMENTS
Its column 3 stops at `Sulphur`, dropping Tantalum · Terbium · Thulium · Tin · Titanium · Vanadium ·
Ytterbium · Ytrium · Zinc · Zirconium; it also interleaves three table captions into one list.
**The canon did NOT inherit this** — `essentials-canon` carries all 60 correctly (diffed
2026-08-02; the only differences are 4 modern spellings: lutetium/lutecium, nickel/nickle,
sulfur/sulphur, yttrium/ytrium). Source page: rare-earths PDF **p499** (printed folio 477).

## 4. The 997 corroborated-but-unread claims
They stay in the backlog by measurement. Clearing them means page reads. If that ever needs to
change, it is Luneth's call and it changes what `claims_verified` MEANS.

# ⚠ TRAPS THAT WILL COST A SESSION
1. **`corpus_seal` is normally USER-ONLY.** Luneth granted permission for this session specifically;
   do not assume it carries forward. Ask.
2. **Sync the drafts after every resnap.** `corpus_resnap --write` updates the SHARD only; sealing
   without `tools/frontface/sync_drafts.py` silently restores stale offsets. This has bitten FOUR
   times. Prove it with `corpus_seal.draft_offset_failures()` == 0 before sealing. It caught 735
   failures this session and 1 more later.
3. **`Screenshot (N).png` is a TWO-PAGE SPREAD** inside a 3840×1080 dual-monitor frame; the book is
   the left ~26 % and the gutter sits at **x = 0.2506**. Crop one half and you will report "not
   found" or diff against a neighbouring page.
4. **`pdftoppm` is NOT installed** — the `Read` tool cannot open a PDF page. Use
   `tools/frontface/render.py`.
5. **`coverage < 0.85` means the page index is UNRELIABLE**, not that the claim is dirty. The
   locator sent `RARE-000335` to p412 instead of p495 and manufactured a phantom hunk.
6. **Never bare-token replace.** `uncers`, `ofdiarrhea` and `dietaiy` each occur more than once, and
   the two `ofdiarrhea` occurrences DISAGREE — one page prints the space, the other does not. Anchor
   on a window from the claim's own verbatim, widened until unique.
7. **A claim can hold the same damaged token twice**, and two claims can quote ONE span. Both cases
   bit this session; both are handled in the `apply_*.py` guards. Reuse them.
8. **Read the page before batch-fixing a detector's hits.** 11 of 47 subscript hits were BORON in a
   mineral list (`Ca, Mg, B, Cu, S`) — a rule would have turned boron into a vitamin in 5 claims.
   Earlier in the campaign, 2 of 6 "obvious" defects turned out FAITHFUL.

# ★ HONEST GAPS — state them, do not let a green board imply otherwise
- The gates hold a MECHANICAL floor over EIGHT classes. They do not see a **valid-word swap**
  (`he`/`the`, `side`/`vide`) — only a page read finds those.
- `subscript_damage` **deliberately cannot see a bare single-comma `B,`** that really is a vitamin,
  because that is indistinguishable from boron. Labelled WISH (R7), not a covered case.
- `selfscan.py` is LOOSER than the shipped gate by design; its 1 remaining subscript hit is the
  known `Preparation H,` false positive.
- `build_targets.py` reads the BACKLOG, so every number these tools print describes work REMAINING,
  not work total. They shrink as claims move into `claims_verified`.

# ★ OTHER OPEN WORK (unchanged, none blocked)
- **Vitamin C header:** 4 redesigned demos in `temporary/vitamin-c-demos.html` await Luneth's
  direction pick → refine → build live → visual sign-off.
- **Vitamin A header (SHIPPED):** its pull-quote is a ~240-char run-on he wants shorter. He REJECTED
  4 options (DDDL-000056 / DDDL-000165-trim / LETS-000196 / DDDL-000041) and was choosing his own
  when the OCR issue surfaced. Lives in `mechanism-clarity-data.json` vitamin-a `quote`.
- **The 29 header demos** review/refine campaign — still open.
- **Element headers:** 6 shipped (selenium, copper, zinc, calcium, magnesium, vitamin A). Read
  `.claude/rules/element-headers.md` BEFORE any header work; NEVER build one live without explicit
  permission.
- **The "reduced" gloss bug** (BLUEPRINT §8): the term-gloss matcher over-fires on a common word.
  Different subsystem, own ticket, untouched.

# STANDING DOCTRINES (unchanged)
1. `corpus_seal` / `catalog_seal` are USER-ONLY by default. 2. NEVER fabricate — verbatim ⊆ sealed
source, or say UNREADABLE; never guess. 3. Every claim lives in ONE of 3 homes; search is a
retrieval layer. 4. A DOM probe is NOT a visual check — screenshot + STOP for his eyes. 5. NEVER
build a header live without explicit permission. 6. Small, reviewed increments. 7. No "for good"
without a GATE.

**Board 83/83 · kv=448 · tree clean, all pushed · backlog 1,900 → 1,716 · 8 gated classes ·
toolkit committed at `tools/frontface/` · TOP PRIORITY = the 443-claim read list.**
