# ★ NEXT SESSION — the duplicate-review campaign is DONE (read this first)

Luneth's **274 duplicate rulings are APPLIED, sealed, and committed** on branch
`duplicate-review-campaign` (**kv467, 2162 claims, board 89/89**). Nothing about the dedup is pending.
Full record: build-log `2026-08-07 13:50 CDT` + Creator's Log `lg_msjaxmrr`.

## What shipped this session
- 88 duplicate claims deleted, **5 merges** authored from his notes, **92 survivors** re-tagged +
  **37 essentials** set (tag-review.html delivered for his records).
- Epigenetics source fix `Gadolium→Gadolinium` (resnap + ratified-divergence).
- mechanism-clarity re-point (`RARE-000119→IMMORT-000100`), ratified-divergences 78→71,
  `processed_meat` topic restored on the merged pork card.
- `render_probe_search` / `render_probe_knowledge` count assertions now **DERIVE from truth**
  (heroMeta == grouped-row totals; foods counts == `foods-curation.json` lengths) — the old
  hardcoded 74/146/5 are gone.

## Still open (NOT dedup — pre-existing)
- **PR #1** (protocol-widen, kv469) still open on master: https://github.com/sunjolol/the-wallach-codex/pull/1 .
  This branch is off master at kv466 and now carries kv467 dedup work. **If PR #1 merges first, rebase**
  this branch onto the new master — they touch the same claim shards + indices, expect conflicts,
  re-seal after resolving.
- Branch is **local-only** (Luneth's standing choice) — committed, **not pushed**. Push only when he says.

## Traps that bit THIS session (don't repeat)
1. **After `corpus_seal` you MUST also run `build_embeds`.** corpus_seal derives the CORPUS indices,
   NOT the dashboard artifacts. Running only `corpus_embed` left entity-page/targets/search-index
   STALE and reddened 3 gates (`derived_artifacts_fresh`, `amounts_wallach_only`,
   `entity_pills_justified`). `build_embeds` cleared all three at once.
2. **Deleting a claim can un-vouch a book word** in the corpus vocabulary → `book_source_clean` reds
   on a DIFFERENT book. `hypogonadism` → allowlisted in the dddl purity baseline (same purge/vouch
   pattern the file records for `amebiasis`).
3. **A cross-book merge that folds a topic's only card silently drops it from search.** The foods
   REMOVE strip went 5→4 when `processed_meat` folded into `pork`. Fix: add the folded topic to the
   keeper's `also_about`. Before folding, grep `foods-curation.json` / `mechanism-clarity-data.json` /
   `ratified-divergences.json` for the folded id AND its topic slug.

# ⚠ DELIBERATELY NOT RESTORED — HIS DECISION (still binding)
The 18 claims deleted Aug 3–5 STAY DELETED (he chose `36e2c6cc`/2,250 over `83c0e63f`/2,268). Do not
"helpfully" restore them. The 88 deleted this session were each his per-pair ruling — do not restore
those either.
