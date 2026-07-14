# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-13)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES ("older loses"). Board **63/63** green (+1 new gate `no_new_dead_code`). This session shipped a **DEAD-CODE PURGE + FOREVER-GATE** after Luneth caught obsolete Corpus/Doctrine-tab code still living in the source ~24h + 10+ sessions after those tabs were cut. The FONT SURVEY (the prior next task) is **mid-flight** — 2 decisions still owed by Luneth (below).
>
> This file is the **temporary** rolling handoff; DURABLE principles live in the memory files (read at genesis), NOT here.

## ★★★★ NEW GATE — dead code can no longer ship silently (read first)
Root cause of a recurring, trust-damaging failure: a feature "deleted" from the UI left its CODE in the repo (removing a tab ≠ deleting its code), and NO gate checked for dead code — knip was a package.json devDep but **unconfigured** (a bare run flagged the WHOLE codebase as dead = noise = never actionable = never enforced) and only lived in an uninstalled pre-push hook, never on the board. FIXED:
- **`dashboard/knip.json`** — real entry graph (`main.ts` + tests, `ignoreExportsUsedInFile`) → TRUE signal.
- **`no_new_dead_code` (critical)** in `tools/invariants.py` — runs knip vs **`dashboard/knip-baseline.json`** (48 accepted keys); any dead file/export/type NOT baselined → board **RED**. Proven with a negative test (injected export → RED → reverted → green). Non-fatal SKIP if node/knip absent.
- **BURN-DOWN owed (deferred, honest — NOT silent debt):** the 48 baselined keys = 8 state helpers reserved for pending rounds + 40 zero-runtime zod `z.infer` type-aliases. The ratchet may only SHRINK: delete dead code → prune its key → regenerate baseline (scratchpad `gen_knip_baseline` logic, or hand-prune). To regenerate after a real deletion: run knip's `_knip_dead_keys` extraction (same one the gate uses).
- Purged this chunk: `renderCorpusTab` + book-browser chain + old `renderCorpusForEssential`/`renderIntakeMeter` from `views/knowledge-corpus.ts` (645→429 lines; the LIVE Conditions tab + `tileOf` + shared `renderCorpusClaim` graph preserved) + their state tail from `state/corpus.ts`; deleted `core/schemas/doctrine.ts` + `assets/data/doctrine-data.json` + every ref (barrel, MANIFEST, invariants).

## ★ FONT SURVEY — mid-flight; 2 decisions owed by Luneth
The app went FUTURIST (Unbounded display + Space Grotesk body via `type-futurist.css` override; see [[futurist-type-direction]]). Findings:
1. **Orange "You are what you absorb." (Absorption hero) → RESOLVED: LEAVE the synth italic.** Unbounded ships NO true italic (verified: `wght`-axis only, no `ital`/`slnt`), and per Luneth's rule "if no true italic exists, the synth is fine, it looks great." Only reopens if the upstream Unbounded family ever ships an italic → approval pass ([[standards-exception-to-ask-not-assume]]).
2. **P2 (verbatim quotes → true Playfair-italic) — approval pass DONE, awaiting Luneth's call.** A/B rendered on a real entity-page verbatim (synth vs Playfair-true-italic). Recommendation (firmed by seeing it): **KEEP FUTURIST** for the ~114 inline verbatims — broad Playfair pulls the app back toward the serif look the pivot deliberately left, and Playfair's old-style italic figures read oddly in a number-dense app; reserve Playfair for the ONE crown-jewel pull-quote (as now). **OPEN → keep-futurist (rec) / broad-apply P2 / render-the-upright-option-first.** NOTE: only 2 live verbatim spots exist (`.kd-ep-claim__verbatim` entity pages + `.sr-claim__verbatim` search), both Space-Grotesk synth; the old featured-citation I first mis-cited was DEAD (removed this chunk).
3. **Non-quote live italics (#5 element scientific-name, #6 omega note, #7 Products "enough-vs-target" em) → REMEMBER, don't forget:** Luneth wants a fresh, greatness-first FUTURISTIC-FONT exploration for these, re-grounded in the Empower reference (the SAME lens that surfaced Unbounded — re-applied fresh, NOT a blind broad-stroke of Unbounded), reaching for the best fit, reverting to known-good only if greatness isn't found; built REVERSIBLE. NOT now — settle standards/preferences first, then return. He also floated re-considering Space Grotesk itself ("never totally sold on it"). Honest nuance: small-size synth-italic has a slight REAL fuzziness/spacing edge (the shear isn't re-hinted) — so these small spots are the better change candidates, big display is a non-issue.
4. **Cleanup (approved, queued):** the drifted "Playfair stays (alchemy intent)" comments in `workspace-coverage.css` now LIE (the `--ds-font-display` token already flipped to Unbounded) — fix next time we touch that file.
5. **Fold-in (later):** once fonts settle, fold `type-futurist.css` into the sealed `design-system.css` properly + re-seal the golden (needs Luneth sign-off) + retire `type-futurist.css` (restores single-source-of-truth).

## ★ BACKLOG (still valid)
- **HK Amish-stats verbatim expansion** — if we want the Amish pork angle back as the pork intro, expand HELLS-000004's verbatim from the Hell's Kitchen source page. Pork intro currently = the clean IMMORT-000229 red-meat stance.
- **Coverage-tab OVERHAUL** to Knowledge-tab quality + fix the 2 fake coverage numbers (goal-card proportional fake + regimen-slot hardcoded literals). In scope (Luneth 2026-07-12).
- **Part A — persistent absorption caveat** across Coverage / Essentials / entity pages (ONE great pointer; restraint [[persuade-dont-shove-restraint]]).
- **Content pass (reseal):** poached-eggs EPIGEN-000155 missing-outcome + a diet-vein OUTCOME AUDIT ([[state-the-outcome-when-known]]); normalise `--`→`—` dashes in diet `answer_short`s (salt's intro still shows `--`).
- **THREAD 2 — Search G-7 + book mining:** SEAL the 2 still-unsealed search files (`search-enrichment.json` + `catalog/search-entities.json`); resume Immortality A-Z at Mn-Manganese; charged-treatise capture; lay-topic tagging; port the P2 CHARGED gate.
- **THEN resume Phase-H** (entity-page + Search overhaul) per `chronicle/OVERHAUL-BLUEPRINT.md`.
- Trace/rare small owed (therapeutic-note seal · Cal Toddy label · Group-B factor).

## ★ KEY DOCTRINE (memory files authoritative — read at genesis)
- [[standards-exception-to-ask-not-assume]] + [[live-supersedes-demo-log-micro-deltas]] (NEW this session — Luneth's operating philosophy) · [[futurist-type-direction]] · [[visual-design-bar-and-principles]] · [[screenshot-verify-visual-chunks]] · [[demo-vision-not-letter]].
- [[hooks-cwd-relative-trap]] (a bare `cd subdir` drifts the shared shell CWD + deadlocks the repo-root-relative hooks; recover via PowerShell `Set-Location <root>`).
- Round-close: build → invariants → probe → build-log → Creator's Log → rebuild → commit + push.
