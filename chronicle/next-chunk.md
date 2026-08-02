# Next chunk — ★ AUTHORITATIVE HANDOFF (rewritten 2026-08-02, end of the corroboration + vision session)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` in a NEW session; Claude runs `tools/genesis.py` ONLY in response, reports,
then asks what to resume.

# ★ STATE — every number below was MEASURED at handoff, not remembered
- **Board 83/83**, 0 reds. Corpus sealed at **knowledge_version=448**, `corpus_verify` PASS
  (2268 claims · 7 books · hashes match). Build fresh, all derived artifacts in sync.
- **Everything is committed and pushed** (`master`, through `647ba62d` + this handoff commit).
- **Front-facing backlog: 1,716** (was 1,900 at session start). 184 claims were page-read and moved
  into `claims_verified`, which now holds **209**. `books_verified` = `dddl-3e-2011` · `iaiyh`.
  Per book: epigenetics 404 · immortality 441 · lets-play-doctor 436 · rare-earths 348 · hells-kitchen 87.
- `frontface_verbatims_clean` now gates **EIGHT** mechanical classes (the 8th, `subscript_damage`,
  landed this session). Negative test: **45 cases**, all passing.

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

## 1. The 443-claim page-read list — `tools/frontface/work/readlist.json`
Regenerate it (seconds) then work it. Current composition:
`A2` semantic disagreement **93** · `A3` both-sides-unreadable-by-machine **83** ·
`B` alignment-slip **130** · `B` dropped-text **100** · `A` unlocated **7** · `C` control **30**.
By book: immortality 217 · lets-play-doctor 99 · epigenetics 66 · rare-earths 57 · hells-kitchen 4.

**`A1` (our text is the garbled side) is now EMPTY** — every one was fixed this session.
**Immortality at 217 is the least trustworthy slice**: its Tesseract pass is noisier than the other
books' (only 165 of 441 agree, vs 85/87 for hells-kitchen), so expect a high false-positive rate
there rather than 217 real defects.

## 2. The non-word residue — 599 hits in 337 claims
`selfscan.py` → `triage_nonword.py` → `rank_nonword.py`. **Expect to CONFIRM, not fix**: of 105 such
tokens page-read this session, 62 were legitimate (botanical Latin, British spellings, trade names).
The spellchecker's suggestions carry NO authority — it wanted `castro` for `gastro`, `penis` for
`pedis`, `honey` for `HOXEY`.

## 3. Two hyphen-gap classes — FOUND, MEASURED-BUT-NOT-CLOSED (deliberate)
`_FF_MID_WORD_HYPHEN` was tightened this session to `[A-Za-z]{2,}-[ \t]*\n[ \t]*[A-Za-z]{2,}` (it had
required the hyphen to ABUT the newline, which made Hell's Kitchen's whole wrap style invisible — 76
splits). Two sibling shapes are still invisible:
- **hyphen-LESS split**: `can be en\nhanced` — the page prints `en-`/`hanced` and our OCR dropped the
  hyphen too, so a detector that requires a hyphen cannot see it.
- **page-number injection**: `autoim- 132 mune` — a page number landed between the halves.

Both were left unpatched ON PURPOSE: tightening a gate from a single instance is how the earlier
over-fire happened. **Measure the class first**, then codify with a negative test.

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
