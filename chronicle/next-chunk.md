# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-22, mineral-polish close)
# ★★★★★ 2026-07-22 — mineral card polish DONE · board 77/77 · corpus kv 381 · committed+pushed
# ▶ NEXT STAGE: bring the still-unused DEMO pages/revamps to the live surface. Mining is PAUSED.

## ✅ WHAT LANDED THIS SESSION (the "final mineral set" before demo work)
Plant-derived group cards on the 34 mineral pages — the "About the plant-derived group" section:
- **Regrouped by enrichment FACET, not claim KIND.** Kind-grouping piled 22 of 32 cards into two teal
  definition+mechanism blocks (the "wall of blue"); facet grouping spreads them across 10 coloured
  categories and gives "Which peoples live to 120-140" its own HISTORY & LORE home. The derive owns
  the grouping AND order now (`entity_page_derive.py` `group_record` by facet + `GROUP_FACET_ORDER`);
  `views/entity-page.ts::renderGroupRecord` renders `kd-ep-facet` buckets in artifact order (no re-sort);
  schema `group_record` → `EntityFacetGroupSchema`.
- **Two Luneth order calls:** the 1-card "protocol"/What-To-Do facet folds into USES as its FIRST entry
  (the dose leads Uses; Uses keeps its normal slot — NOT moved to the top); HISTORY & LORE sits directly
  above BIOGRAPHY.
- **Glossary hover is now separator-insensitive** (`state/glossary.ts` `normKey` + `keyToPattern`): a term
  glosses whether written spaced or hyphenated ("Age Beater"/"Age-Beater"). Test `state/glossary.test.ts`.
- **CONTENT (Luneth-approved):** RARE-059 claim_text `"Age-Beater"`→`"Age Beater"` (sealed, corpus_seal
  kv 380→381); RARE-062 re-questioned to "What do all five long-lived cultures have in common?" with a
  present-tense short answer (enrichment only — its distinct "common denominator" thesis, no longer
  duplicating RARE-070's origin question).
- Verified: build clean · invariants 77/77 · glossary vitest 3/3 · render_probe entity+knowledge+search PASS.

## 🔴 PROCESS LESSON (do not repeat) — placement instructions are literal
I misread "consolidate its entry into Uses at the very top" as "move the Uses CATEGORY to the section top."
He meant the DOSE CARD at the top of Uses, Uses in place. When an instruction names an ENTRY and a
container, "at the very top" is the entry's position WITHIN the container — do not promote the container.
When a placement is ambiguous, ASK rather than guess-and-show (guessing wrong burns trust + tokens).

## ▶ NEXT STAGE — DEMO PAGES → LIVE (memory `demo-elements-still-to-do`)
The v3 demo has three surfaces still not built on live data. Bring them live, ONE surface to 100% before
the next (memory `gold-standard-page-workflow`), each ending in a STOP-for-visual-sign-off (Luneth is the
test gate — memory `screenshot-verify-visual-chunks`, `visual-verification.md`):
1. **Ask Wallach** — the search/retrieval popup (memory `search-is-ask-wallach-popup`, `ask-wallach-search-vision`).
2. **Products tab** — (the Products list + detail panel already exist in the knowledge drawer; confirm what
   the DEMO adds beyond that before building — do not rebuild what's live).
3. **Conditions tab** (+ detail views).
Rules that bind: the signed-off DEMO is the VISUAL spec (memory `signed-off-demo-is-the-spec`,
`demo-vision-not-letter`, `replicate-demo-not-blueprint-notes` — recreate the DESIGN on REAL data, don't
copy the demo's stale data); LIVE beats a stale demo where they diverge (`live-supersedes-demo-log-micro-deltas`);
measure computed-style deltas, don't eyeball (`visual-verification.md` "measure don't eyeball", `style_diff.js`).
FIRST STEP when you start: open the relevant demo mockup under `dashboard/components/` and diff its
intent against what's already live, then propose a build plan + ASK Luneth which surface first.

## ⏸ PARKED — Batch-4 book mining (resume only when Luneth redirects to it)
Remaining teal-new candidates (re-dedup each against ALL 7 sealed books FIRST — Wallach reuses passages;
memory `dedup-across-all-books-before-authoring`): NEW-01/03, 13, 14, 15, 16, 19, 20, 21, 23, 30 + fringe
NEW-17 (rare-earths doubled-lifespan) & NEW-22 (256-yr Li Chung Yun — capture faithfully, neither censored
nor inflated). Byte-verified passages: `temporary/plant-derived-research-2026-07-17/sweep/book-rare-earths.md`.
Batch-4 rulings are SETTLED (do not re-litigate) — see the prior handoff in git history if resuming.

## 🔴🔴 REVIEW PROCESS — Luneth's hard rule (carries into EVERY corpus/content touch)
Before sealing ANY claim, show it to Luneth in its EXACT final form and get approval ON THE CLAIM itself:
QUESTION → SHORT ANSWER → (full answer only if it genuinely adds something) → QUOTE. Never put the approval
prompt on a side-question and treat that as content sign-off. If content was not reviewed, the log says
"unreviewed", never "approved". `corpus_seal` is USER-ONLY (he authorizes each seal).

## 🔧 KEY MECHANICS (reuse)
- Seal cycle: edit the DRAFT (`drafts/claims-<book>.draft.json`) → **user runs `corpus_seal`** (promotes
  drafts→shards, bumps kv, corpus_verify) → `build_embeds.py` → `entity_page_derive.py` → `build.mjs` →
  invariants → render probes → build-log + `creators_log.py append` → RE-inline `build.mjs` (log bakes at
  BUILD time) → commit + push.
- Enrichment (`search-enrichment.json`) is NOT sealed — load/modify/`json.dumps(...,ensure_ascii=False,indent=2)+"\n"`
  is byte-stable; edit + `build_embeds` (rebuilds search-index).
- `creators_log.py append`: `--kind` from the fixed set (use `round-close`); `--summary` ≤280; pass
  `--detail "$(cat backtick-free-file)"` (a backtick in an inline double-quoted --detail silently drops words).
- Windows/UTF-8: prefix `PYTHONUTF8=1`; safe_write payloads must be LF; every project write via `safe_write`.
