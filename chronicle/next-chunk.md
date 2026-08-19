# ★★★ NEXT SESSION — READ THIS FIRST.

**Board 94/94 green** (was 93; added `explore_entity_lede_authored`). Corpus **kv=476** (no re-seal — search-enrichment + search-entities are the deliberately-unsealed working files).

## ✅ DONE 2026-08-19 — the 28 needs_new_topic claims front-faced + Explore topics got real headers (GATED)
- **All 28 `needs_new_topic` claims are LIVE in Ask Wallach.** The flag over-counted (it only checked essentials/conditions, never the 94 concept/topic entities). Actual split: **15 → 3 NEW entities**, **13 → existing entities**. Each is a real Q + crisp `answer_short` + rich `answer_full`, all traced to the sealed verbatims.
  - **NEW entities** (`eden/catalog/search-entities.json`): **chocolate** (482/513/516 + cross-links 502, EPIGEN-476), **resveratrol** (481/484/490/491/504/517), **hunza** (488/499/505/507/512/514).
  - **FOLDS** (`eden/corpus/search-enrichment.json`): centenarian-cultures +509/510/518 · longevity +480/501/503/520/521 and +519 (religion → subject longevity, also_about faith_healing, Luneth: "both") · minerals +486/506/511 · colloidal_minerals +489.
- **Explore-topic HEADER fix (Luneth-caught defect, now GATED forever):** `state/search.ts::entityLede` ALWAYS returned a claim's `answer_short`, so 141 explore heroes shipped answer-shaped headers (chocolate: "It's a mineral-deficiency signal…") and no gate caught it. FIX: `entity-copy.json` gained a `topics{}` section (hand-authored ledes, the calcium style); `entityLede()` prefers the hand lede. **New critical gate `explore_entity_lede_authored`** — a NEW explore entity (not grandfathered) is RED until a lede is authored (+9-case negative test). Authored 7 ledes (the 3 new + longevity/centenarian-cultures/colloidal_minerals/minerals). CLAUDE.md board 93→94.
- **Glossary +10** (anandamide, phenylethylamine, glycemic index, pica, sirtuin, resveratrol, phytoalexin, chapatti, phytoestrogen, meta-analysis).
- **⚠ VISUAL SIGN-OFF STILL OPEN:** could not composite a live screenshot this session (Browser pane won't display; file:// = static snapshot). All header + Q/short/full TEXT was reviewed and approved by Luneth in chat, and the pages use the established template — but no one has EYEBALLED the rendered chocolate/resveratrol/hunza pages. First thing: have Luneth open Search → "chocolate" / "resveratrol" / "hunza" and confirm the render.

## ▶ NEXT TASK — options (ask Luneth)
1. **The lede backlog: 136 explore entities still DERIVE their header** (`chronicle/lede-backlog.json`). The gate keeps it shrinking and blocks NEW offenders, but the existing 136 read anywhere from fine (basics-facet topics) to poor (e.g. `intermittent_fasting` opens mid-study-citation). Author hand ledes over time, worst-first.
2. **The 92 UNSEALED unverified ruled claims:** recover from `temporary/claim-ruling-dashboard.html` ([[ruling-dashboard-is-recovery-source]]), seal, vision-verify, enrich — same pipeline, same `answer_full` bar.
3. **8 `recovered_question:null`** from the prior worklist (mostly resolvable-subject ones already handled in the 41; confirm none dangling).

## GENESIS
`genesis` → run genesis.py, report the board, then ask which of the above to resume. New invariant red = the only response.
