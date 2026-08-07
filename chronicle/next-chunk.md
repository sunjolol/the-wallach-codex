# ★ NEXT SESSION — APPLY THE DUPLICATE RULINGS (read this first)

Luneth finished ruling on the **274 duplicate candidates** and will **attach `dedup-decisions.json`
at the start of next session.** Applying those rulings is the whole task. **NOTHING in the corpus has
been touched yet** — this is the first mutating step of the campaign.

Before touching a claim, read the `corpus-mining` skill + memories `mining-mechanics`,
`duplicate-review-campaign-active`, `duplicate-deletion-needs-per-claim-approval`.

## The apply process (per-claim, authorized, sealed)

Build the apply tool AGAINST the real file so it is testable: it reads `dedup-decisions.json`, prints
a **DRY-RUN plan** (what each ruling would change) for Luneth to confirm, then applies on his go.

Per decision:
- **keep_a / keep_b** — DELETE the other claim: remove it from its `claims/claims-<book_id>.json`
  shard AND its `search-enrichment.json` entry, grep the corpus for references to the dead id
  (`superseded_by`, `also_about`, `source_claim_id`) so nothing orphans, re-derive the indices
  (`eden/tools/corpus_derive.py`), rebuild embeds, and **reseal** — `corpus_seal` is USER-ONLY, ask
  each seal. `knowledge_version` bumps (kv466 → …).
- **merge** — do NOT auto-delete. AUTHOR the combined claim (keep the primary's id if `primary` is
  set; fold in the other's information) under the byte-exact verbatim + dose rules, and show Luneth
  the drafted merged claim for approval BEFORE applying. Then delete the folded claim as above.
- **not_dup** — nothing; it was a false positive he dismissed.

Claims and book sources share byte offsets, and the indices are DERIVED — delete the claim, its
enrichment, and re-derive together, never separately (trap 2 below).

## Guardrail — why the 2026-08-06 rollback happened

Apply ONLY the rulings in the file. A re-facet or an un-enrich is a reader-facing deletion and is
**OUT OF SCOPE** — that scope-creep gutted his magnesium page last time and cost the whole corpus a
rollback. Every removal must trace to a keep-one / merge decision Luneth personally made.

## Campaign state

- Branch **`duplicate-review-campaign`** (commit 01d24629, **local only**, not pushed). Non-destructive
  tooling in `tools/dedup/`: `find_duplicate_candidates.py` (deterministic, auditable, 6 signals,
  **274 candidates at kv466**), `review.html` + `review-data.js` (the offline dashboard he ruled in).
- Corpus **kv466**, 2250 claims, `corpus_verify` PASS, **board 89/89** on this branch.

## Also open (NOT blocking the dedup work)

- **PR #1** (protocol-widen, kv469) still open on master, awaiting your review/merge:
  https://github.com/sunjolol/the-wallach-codex/pull/1 . This dedup branch is off master (kv466); if
  PR #1 merges first, rebase.
- `render_probe_search`'s two hardcoded counts (146 calcium / 74 cancer) — the fix went with the
  deleted `derive-counts` branch; redo if wanted (the `counts-derive-from-truth` principle stands).

# ★★★ THE ROLLBACK HEADLINE — STILL BINDING

Luneth asked for duplicate removal. Over two sessions the work grew into: 20 claims deleted, 46 claims
re-faceted, 17 questions re-cut, and 16 more re-cuts + 8 un-enrichments. He reloaded the app, found his
magnesium page gutted, and ordered everything rolled back.

**THE PROCESS, HIS INSTRUCTION, NOT NEGOTIABLE:** every duplicate pair goes to him **one at a time,
first**, and he decides which stays, which goes, **or whether the two merge into one**. A batch "yes"
is NOT per-claim approval. This campaign's dashboard + `dedup-decisions.json` ARE that process, honoured.

**What made it invisible until he looked:** a re-facet deletes nothing and still guts a page (magnesium
Cautions 7 → 4 with zero deletions); un-enriching removes the card from search entirely. Both are
reader-facing deletions and both need his per-claim yes.

# ⚠ DELIBERATELY NOT RESTORED — HIS DECISION

**The 18 claims deleted Aug 3–5 STAY DELETED** (he chose `36e2c6cc`/2,250 over `83c0e63f`/2,268). Do
not "helpfully" restore them: `b3551834` (13 duplicates), `4b962ea0` (1 folate misprint), `473569ae`
(4 = the vitamin D 400 IU ceiling group).

# TRAPS

1. `corpus_seal` / `catalog_seal` are **USER-ONLY**. Ask every time.
2. **Claims carry byte offsets into `eden/corpus/books/*.txt`**, and `indices/*` are DERIVED. Delete a
   claim → also drop its enrichment and re-derive; never edit one layer alone or quotes/indices drift.
3. **A green board says nothing drifted, not that anything is right.** 23 of 89 gates anchor outside
   our own files.
4. **Cross-book context in `claim_text` is BY DESIGN** — the verbatim is the strongest available
   reference, not a boundary. Don't propose a "does claim_text trace to its own book" gate.
5. **`no_duplicate_questions` was removed in the rollback** — there is no live gate for duplicates; the
   detector in `tools/dedup/` is the (non-gate) replacement. A card reaches a page via `subject` AND
   `also_about` (`state/search.ts:84`).
6. **The first-run onboarding modal covers the page.** Dismiss "I'm just browsing" before any capture.
7. `git stash`/`pop` **normalises line endings** under `core.autocrlf=input`.
8. **origin/master can lag local master** — verify the remote before opening a PR; the compare base is
   the remote, not your local ref.
