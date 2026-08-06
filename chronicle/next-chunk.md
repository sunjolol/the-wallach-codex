# ★ STATE ✓measured at close 2026-08-06 (ROLLBACK SESSION — read the headline first)

- **Corpus ROLLED BACK to `36e2c6cc`.** `knowledge_version=466`, **2250 claims**, 2242 enrichment
  entries, `corpus_verify` PASS, 7 book hashes match. `eden/corpus` is byte-identical to that commit.
- **Board 89/89, 0 failed.** The `no_duplicate_questions` gate was **DELETED** (see below), taking
  the board 90 → 89. CLAUDE.md updated in the same patch; `board_claims_match_reality` confirms it.
- `build_embeds` + `node tools/build.mjs` exit 0. `render_probe_knowledge`, `render_probe_entity`,
  `render_probe_knowledge_filter` PASS, 0 page errors.
- ⚠ **`render_probe_search` still FAILS** on hardcoded `146` calcium / `74` cancer counts. Pre-existing,
  undiagnosed, unrelated to the rollback.

# ★★★ THE HEADLINE — WHY THIS SESSION ENDED IN A ROLLBACK

Luneth asked for duplicate removal. Over two sessions the work grew into: 20 claims deleted,
46 claims re-faceted, 17 questions re-cut, and (this session) 16 more re-cuts + 8 un-enrichments.
He reloaded the app, found his magnesium page gutted, and ordered everything rolled back.

**He has revoked trust and is switching models. Read
`duplicate-deletion-needs-per-claim-approval` in memory before touching a single duplicate.**

**THE PROCESS FOR NEXT TIME, HIS INSTRUCTION, NOT NEGOTIABLE:** every duplicate pair goes to him
**one at a time, first**, and he decides: which stays, which goes, **or whether the two should be
merged into one** (the case where both carry good information). A review document listing many pairs
with a blanket yes is NOT per-claim approval — that is exactly what failed here.

**What made it invisible to him until he looked:** a re-facet deletes nothing and still guts a page.
Moving 46 claims from `warning` to `physiology` took magnesium's Cautions from 7 to 4 with zero
claims deleted. Un-enriching is worse: it removes the card from search entirely (index 2227 → 2219).
Both are reader-facing deletions and both need his per-claim yes.

# ✔ WHAT IS IN THE TREE NOW

- `eden/corpus` @ `36e2c6cc` — 2250 claims, kv=466, all 7 magnesium WARNINGS restored including both
  `EPIGEN-000195` and `IMMORT-000210` ("Can you take too much magnesium?").
- `no_duplicate_questions` **removed** — impl, its 29-entry `_QUESTION_COLLISIONS_KNOWN` allowlist,
  its registry entry, and `tools/test_no_duplicate_questions.py`. It shipped the same day, *after*
  the restored data, and reported 22 un-allowlisted collisions against it. All recoverable from git.
- `tools/claim_review.py` gained `--enrichment <path>` so a PROPOSED enrichment store renders through
  the real renderer instead of being hand-formatted. Read-only, default unchanged. **Keep this** —
  it is how per-claim review gets shown without hand-formatting.

# ⚠ DELIBERATELY NOT RESTORED — HIS DECISION

**The 18 claims deleted Aug 3–5 STAY DELETED.** He was offered `83c0e63f` (2,268 claims) and chose
`36e2c6cc` (2,250). Do not "helpfully" restore them.
- `b3551834` — 13 duplicate claims
- `4b962ea0` — 1 misprinted 2014 folate claim
- `473569ae` — 4 claims (the vitamin D 400 IU ceiling group)

# ⚠ OPEN

- **The duplicates are still there** — that work has to be redone under the per-claim process above.
  The 46 subject+question collisions exist in this data again; there is no gate for them any more.
- 6 verbatim widenings deferred (span does not name a mapped condition), 16 TRIM_PROSE and
  8 NEEDS_RESCOPE — all rolled back with the corpus, all still unapplied.
- `render_probe_search`'s two hardcoded counts.
- `protocol`'s 425 claims are phase 2, unstarted.

# TRAPS

1. `corpus_seal` / `catalog_seal` are **USER-ONLY**. Ask every time. **No seal was needed this
   session** — a `git checkout` of a previously-sealed snapshot brings its goldens with it, and
   `corpus_verify` passed at kv=466 unchanged.
2. **Claims carry byte offsets into `eden/corpus/books/*.txt`.** Claims and book sources cannot be
   rolled back separately or every quote breaks. Restore the whole `eden/corpus` tree together.
3. **A green board says nothing drifted, not that anything is right.** 23 of 89 gates anchor outside
   our own files.
4. **Cross-book context in `claim_text` is BY DESIGN** — the verbatim is the strongest available
   reference, not a boundary. I called it "contamination" and was corrected; do not propose a
   "does claim_text trace to its own book" sweep or gate. See `corpus-defect-signatures`.
5. **`no_duplicate_questions` bucketed by `subject` only**, but a card also reaches a page via
   `also_about` (`state/search.ts:84`). Any page-scope query must use
   `subject == S or S in also_about`. Entity pages exclude `also_about`; topic/search pages include it.
6. **The first-run onboarding modal covers the page.** Dismiss "I'm just browsing" before any capture.
7. `git stash`/`pop` **normalises line endings** under `core.autocrlf=input`.
