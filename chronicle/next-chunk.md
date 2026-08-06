# ★ STATE ✓measured at close 2026-08-06

- **Corpus SEALED at knowledge_version=469**, **2230 claims** (was 2250 — 20 duplicates deleted),
  `corpus_verify` PASS, 7 book hashes match.
- **Board 90/90, 0 failed.** 23 external / 24 consistency / 41 structural / 2 meta. NEW GATE
  `no_duplicate_questions` shipped 2026-08-06 (see below). Green means
  NOTHING DRIFTED — only the 23 external gates catch a value that is wrong but self-consistent.
- `build_embeds` + `node tools/build.mjs` exit 0. `render_probe_knowledge`, `render_probe_entity`,
  `render_probe_knowledge_filter` PASS, 0 page errors.
- Drafts and sealed shards are IN SYNC.
- ⚠ **`render_probe_search` FAILS** on a hardcoded `146` calcium count. **PROVEN PRE-EXISTING** by
  stashing the whole tree, rebuilding at HEAD and reproducing it there. Undiagnosed.
- Commits: `36e2c6cc` (ceiling sweep), `beeb0a26` (full defect sweep), `c44fa156` (question re-cuts).
  **Not pushed** — master is 13 ahead of origin and pushing has not been routine.

# ★★★ THE HEADLINE — WHY DUPLICATES KEPT SURVIVING

Luneth found two cards on the vitamin D page saying the same thing and asked why. The cause is
structural, and it is now in the `duplicate-gate-blind-three-ways` memory.

`no_duplicate_claims` buckets on **`(book, subject, facet)`** — book is IN the key — and requires
**verbatim containment**. Cross-book: invisible. Cross-facet, *even inside one book*: invisible.
Different wording: invisible. It cannot see 407 cross-book + 615 cross-facet candidate pairs.

**Root cause of the twin cards is a TAXONOMY defect**: the colour family named `signs` in
`core/schemas/search.ts` contains ONLY `warning`, so deficiency-**sign** claims get filed there, and
`warning` is PINNED at position 2 — so the misfiled claim is *promoted above* its correct twin.

**A global `kind→facet` gate was considered and REJECTED on evidence**: it would demand 941
re-facets (41.8% of the corpus) and `kind: definition` legitimately spans 13 facets.

# ✔ WHAT SHIPPED

- **46 facet corrections** (`warning` 196 → 164; `LETS-000017` HELD — its text covers excess too).
- **63 OCR run-together source fixes** across 5 books (`ofthe`, `ofa`, `toa`, `isa`, `asa`…), all
  word-bounded. ⚠ **`Asa Chandler` ×2 (Coca-Cola) and `Asai` ×13 (Kazuhiko Asai) deliberately
  SKIPPED** — a naive replace corrupts them.
- **57 verbatim widenings** — the prose-exceeds-quote class, fixed by widening the QUOTE, never by
  cutting the prose.
- **20 duplicate claims deleted**, each with its unique mappings merged into the keeper FIRST.
- **2 §00.A violations fixed**, both CROSS-BOOK CONTAMINATION not invention: `RARE-000324` displayed
  selenium 1,000–3,000 mcg to readers (zero hits in all 1.17M chars of rare-earths; found in dddl);
  `HELLS-000041` carried chromium figures absent from all 692K chars of hk.txt.
- **17 question re-cuts** (collisions 46 → 29), plus the 3 vitamin D ones.

# ⚠ MY OWN ERROR THIS SESSION — READ IT

Joining OCR hyphens in the widened quotes, my pattern used `\w+` instead of letters, so
**`800-\n1200` collapsed to `8001200` across SIX vitamin E doses**, plus B-1/B-2 designations and two
year ranges. The gate's own pattern is `[A-Za-z]{2,}-\n[A-Za-z]{2,}` — **letters only**. Caught by
reading what the script did rather than trusting it, reverted via `git checkout` of the book sources,
re-applied with the pattern narrowed. **Nothing reached a seal.** Verified after: 0 numeric
corruptions, 33 `800-1200` ranges intact, 13 B-1/B-2 intact.

**Rule: any sweep touching hyphens or spacing near numbers must match the GATE's own pattern.**

# ★★ NEW STANDING LESSONS

1. **A PURGE IS THREE DELETIONS, NOT TWO.** draft + `search-enrichment.json` + **claim ids embedded
   elsewhere**. `mechanism_blocks_wellformed` caught `dashboard/assets/data/
   mechanism-clarity-data.json` (hand-authored) where selenium's RENDERED `quote_claim` pointed at a
   deleted claim. That file reproduces at NO indent 1-4 — edit by targeted raw string replace.
2. **A re-worded question MUST be answered by its own card.** 25 of 44 proposed re-cuts promised
   content absent from both `answer_short` and `claim_text` and were reverted. Test mechanically,
   with **prefix matching both directions** — an asymmetric stemmer (`antidotes`→`antidot` vs
   `antidote`) silently reverted 39 of 44 on the first attempt.
3. **The fix is usually re-facet or re-word, not delete.** 904 of 1,021 adjudicated pairs were
   DISTINCT.

# ⚠ OPEN — named, not buried

- **29 question collisions remain.** Each needs its **ANSWER** re-cut against the source before its
  question can move. Doing it blind is exactly how the 25 bad rewrites happened.
- **4 groups have NO honest split** and are DELETION candidates for a later pass, not re-wording
  ones: `vitamin-k` (`LETS-000042` is a strict subset of `EPIGEN-000034`), `phosphorus` ×2 (the same
  passage reprinted word-for-word), **`gadolinium` (flagged GENUINE DUPLICATE** — identical
  periodic-table catalog entry in two books, differing only by the Epigenetics misspelling
  "Gadolium").
- **6 verbatim widenings deferred** — their span does not name a mapped condition, so `vb_apply`
  refuses (correctly). Ids in `scratchpad/widen-deferred.json` shape; re-derive if needed.
- **16 TRIM_PROSE and 8 NEEDS_RESCOPE** from the sweep are unapplied.
- **GATE SHIPPED: `no_duplicate_questions`** (board 89 -> 90). Two claims sharing an enrichment
  SUBJECT may not ask the same normalised question, regardless of book or facet. Threshold-free.
  The 29 open collisions are allowlisted IN-GATE in `_QUESTION_COLLISIONS_KNOWN`, each with a
  per-case reason -- and **a stale entry FAILS the gate**, so clearing a collision forces deleting
  its carve-out in the same patch. Negative test `tools/test_no_duplicate_questions.py`, 7 cases.
  ⚠ **DELIBERATELY NOT BUILT** (recorded in the gate's own comment so it is not re-proposed):
  extending `no_duplicate_claims` to bucket on `(book, subject)`. The facet audit recommended it;
  measuring first showed 28 pairs, MOST of them the legitimate multi-facet mining pattern
  (`basics` + `mechanism` off one paragraph, `discovery` + `etymology` off one catalog entry).
  A gate that fires on 28 correct cases is noise.
- **#7 same-span groups: DONE.** 71 groups read (handoff said 47): 52 legit multi-row, 11 true
  duplicates deleted, 8 need rescope (still open).
- **#6 Home `.kh-search` suggest dropdown** — `byRelevance` sorts alphabetically, ignores claim
  count. **He has NOT asked for this. Do not raise it unprompted.**
- `protocol`'s 425 claims are phase 2, unstarted. Vitamin A `EPIGEN-000110/000111` rival-answer
  shape. `LETS-000076` (vitamin K) still explains its table's columns instead of naming his figure.

# TRAPS

1. `corpus_seal` / `catalog_seal` are **USER-ONLY**. Ask every time. Three seals this session, each
   authorised separately.
2. **A gate can go red BECAUSE OF a correction.** `frontface_verbatims_clean` did exactly that: the
   widened quotes spanned OCR wraps the narrow slices were too small to contain.
3. **`search-enrichment.json` needs NO seal** — no golden, and neither `corpus_verify` nor
   `corpus_seal` reads it. Facet/question fixes ship with `build_embeds` + `build` only.
4. **Windows file locks**: a running read-heavy workflow holds files open and makes `os.replace`
   fail with `WinError 5`. `safe_write` fails at the swap rather than corrupting. Wait, don't fight.
5. **Book `.txt` files are CRLF while `char_offset`s are LF-translated.** Source edits must match raw
   `-\r\n` and preserve CRLF.
6. **The first-run onboarding modal covers the page.** Dismiss "I'm just browsing" before any capture.
7. `git stash`/`pop` **normalises line endings** under `core.autocrlf=input` — it silently converted
   book sources CRLF→LF mid-session. Harmless here (offsets are read translated) but be aware.
