# Next chunk — ★ AUTHORITATIVE HANDOFF (rewritten 2026-08-02, end of the OCR-campaign session)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` in a NEW session; Claude runs `tools/genesis.py` ONLY in response, reports,
then asks what to resume.

# ★ STATE — everything below is MEASURED, not remembered
- **Board 83/83**, 0 reds. Corpus sealed at **knowledge_version=444**, `corpus_verify` PASS
  (2268 claims · 7 books · hashes match). Build fresh, all derived artifacts in sync.
- **Everything is committed and pushed** (`master`, latest `8cfffe86` + this session's final commit).
  The working tree is clean. Nothing is waiting to be sealed.
- The front-facing OCR campaign's **remediation half is DONE and LOCKED**. What remains is the
  *coverage* half — see TOP PRIORITY.

# ✅ WHAT THE OCR CAMPAIGN ACTUALLY DELIVERED (so nobody re-does it)
- **Front-facing line-break splits corpus-wide: 180 → 0.**
- **~200 defects fixed** across 3 books, each traced to a page image before being touched:
  155 typesetter hyphen rejoins, 4 valid-word OCR swaps (`side`→`vide`, `tine`→`rine`,
  `Jute`→`lute`, `ties`→`ries`), 6 in `RARE-000336` alone (the China clipping Luneth reported —
  now byte-clean), the `FIG. 8-1` table header the OCR read ACROSS columns, the calcium RDA
  (`800 mg`→`800 mcg`, page-faithful per Luneth), and 10 dropped-space / split-number defects.
- **Both §5 lock gates are LIVE** (`frontface_verbatims_clean`, `enriched_book_is_verified`) with
  38 negative-test cases between them. Details in the §5 section of
  `chronicle/frontface-ocr/BLUEPRINT.md`.
- **All SEVEN mechanical defect classes are gated** — the five that shipped as WISHes were promoted
  the same day once every residual hit was read off its page. 11 named exceptions, each carrying its
  evidence type.

# ★★★ TOP PRIORITY (next session) — the 1,900-claim vision sweep
`enriched_book_is_verified` now proves every front-facing claim is accounted for, but **1,900 of
them are accounted for as a BACKLOG, not as verified**: `epigenetics` 454 · `immortality` 468 ·
`lets-play-doctor` 501 · `rare-earths` 384 · `hells-kitchen` 93. Being in that set asserts only
"this was already front-facing on 2026-08-02" — never "this is correct". Clearing it is the job.

→ **READ FIRST:** `chronicle/frontface-ocr/BLUEPRINT.md` (method + phases),
  `chronicle/frontface-ocr/vision-held-hyphens.md` (what a good verification looks like),
  `chronicle/frontface-ocr/wish-classes.md` (the dropped-space finding).
→ **Ledger to shrink:** `chronicle/frontface-ocr/verified.json`. Move ids from
  `grandfathered.claim_ids` into `claims_verified` as they are page-checked. The gate reads both, so
  the backlog number IS the progress bar.
→ **Worklist:** `chronicle/frontface-ocr/worklist.json` (1,838 entries) — NOTE its `char_offset`s are
  PRE-SEAL and now stale; regenerate or re-locate rather than trusting them.
→ **Tooling that works, already written:** `temporary/frontface-ocr-tools/` —
  `pdf_locate.py` (phrase-search a text-layered PDF → page), `render_page.py` / `render_crop.py`
  (PyMuPDF rasterise; `pdftoppm` is NOT installed so the Read tool cannot open a PDF page),
  `crop_png.py` (crop + upscale a Screenshot), `prescan.py`, `hyphen_scope.py`.

## ⚠ FOUR TRAPS THAT WILL COST A SESSION IF FORGOTTEN
1. **`Screenshot (N).png` is a TWO-PAGE SPREAD, not one page.** ~2 book pages per file
   (459→p371, 460→p374, 344→p145, 613→p689). The frame is 3840×1080 DUAL-MONITOR: the book is the
   left ~26 % and the right ~74 % is a Claude Code window. Crop **x ≈ 0.028–0.48** to get BOTH pages,
   and retry the adjacent screenshot before calling anything unverifiable. BLUEPRINT §2's claim that
   the mapping is "1:1, already computed" is WRONG and is corrected in §5/§7.
2. **A KEEP verdict is only as good as its input.** 4 of 18 "real compounds" were OCR misreads
   wearing a compound's costume. JOIN is positive evidence; KEEP is negative evidence.
3. **Two of six suspected defects turned out FAITHFUL** — the page really prints `(Levamisol ,` and
   really prints `in1881`. Batch-fixing on a detector's say-so corrupts correct text.
4. **Edit the SOURCE, never the verbatim.** A 2026-07-15 session tried rewriting a verbatim directly;
   `corpus_integrity` went RED with 33 violations and `corpus_seal` REFUSED, correctly. Correct the
   `.txt`, then `corpus_resnap` FROM it. Letters-changed claims need `--fix`.

## The pipeline that works (proven ~6× this session)
correct `.txt` via `safe_write` → `corpus_resnap --book X --write [--fix f.json]` → **sync the
drafts from the resnapped shards** (or `corpus_seal` silently restores stale offsets) → run
`corpus_seal.draft_offset_failures()` as proof → **Luneth seals** (`corpus_seal.py` is USER-ONLY) →
`build_embeds.py` → `tools/build.mjs` → invariants → probes → build-log → Creator's Log → rebuild.

# ★ THE HONEST GAP — state it, do not let a green board imply otherwise
The gates hold a MECHANICAL floor. They do NOT see:
- **The invisible class** — a valid-word swap. Four were found by eye; each sat inside a pair the
  gate calls clean. Only a page read finds these.
- **The dropped-space class.** Let's Play Doctor is tightly JUSTIFIED; the typesetter squeezed thin
  spaces and the OCR dropped them (page: `magnesium at 2,000 mg`; ours was `at2,000`). The gate sees
  only its letter↔digit and camelCase EDGES — `andelectrolytes`, `ratherthan`, `allthree` are
  invisible to every detector. **Its size is UNMEASURED**: a vocabulary-based attempt returned 387
  candidates that were almost all legitimate words (`cofactor`, `peroxidation`, `Framingham`), so no
  number is claimed.

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

# STANDING DOCTRINES (unchanged)
1. `corpus_seal` / `catalog_seal` are USER-ONLY. 2. NEVER fabricate — verbatim ⊆ sealed source, or
say UNREADABLE; never guess. 3. Every claim lives in ONE of 3 homes; search is a retrieval layer.
4. A DOM probe is NOT a visual check — screenshot + STOP for his eyes. 5. NEVER build a header live
without explicit permission. 6. Small, reviewed increments. 7. No "for good" without a GATE.

**Board 83/83 · kv=444 · tree clean, all pushed · front-facing splits 0 · TOP PRIORITY = the
1,900-claim vision sweep (chronicle/frontface-ocr/) · header work open but unblocked.**
