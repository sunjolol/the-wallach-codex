# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-14, session wrap)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES ("older loses"). Board **64/64** green (a gate was ADDED this session). **NEXT = Luneth's over-arching notes on Coverage, then the TOP-BAR overhaul (items 3/5/6 below).** This file is the temporary rolling handoff; DURABLE principles live in the memory files (read at genesis).

## ★★★★ START HERE NEXT SESSION
Luneth is **holding a batch of over-arching notes** on the Coverage overhaul — take those FIRST, before touching anything below. He signed off the current plate visuals ("Looks great"), so Coverage's *state language* is settled; what remains is his notes + the top bar.

## ★★★★ WHAT SHIPPED THIS SESSION (4 commits, all pushed: ec360176 · 36ee03d4 · 75b5b667 · dfd9bfd2)

**Phase 1 — code truth.** Purged every fabricated number on Coverage, each verified live before + after:
- Hero kicker **ciphered `essentialCount()`** — the decorative `.ds-cipher` scrambles a glyph per tick and restores truth only every 5th, so Wallach's 90 rendered as 80/90/**30**/90/90/91/90/94 (measured). Now a stable 90.
- **Goal cards fabricated BOTH numbers** — see the goals section below.
- Rail: **"Slot 2 of 5" · "02·F71D" · "Synced" · per-item "DAILY"** deleted (no slot system exists anywhere; `rgSlot` is only a storage-event prefix filter). Item count read the `.slice(0,8)`-**truncated** length ("8 items" for 12) → now the real count + "+N more".
- Legend taught **TRACE** (never produced) and omitted **PRESENT** (produced) → now the 5 statuses `classify()` actually emits.

**SINGLE SOURCE OF TRUTH — the real divergence, fixed.** `views/knowledge.ts:165` held `FOUNDATIONAL_PRESENT = Set(['H','C','N','O'])`, painting those 4 green in the drawer while Coverage rendered them blank — **two surfaces disagreeing about 4 essentials over ONE snapshot.** Luneth's own rule, living in a view. Promoted into `state/coverage.ts::recompute` (keyed by canon slug). **Hero stat corrected 9/90 → 13/90** — the drawer was right; Coverage was lying. Rest of the graph audits clean: the 0.95/0.30 thresholds exist at exactly 4 lines, all in `state/coverage.ts`.

**NEW GATE `views_no_ciphered_data`** (critical; board 63→64). A `.ds-cipher` span may wrap view-local chrome but NEVER a value imported from `state/`/`core/`. Charter R2 updated. R9 refinement shipped with it: the first cut banned all interpolation, over-fired on 4 legitimate view-local sites, was TIGHTENED to the import-boundary rule (not loosened), those 4 pinned in an 8-case negative test.

**Phase 2 — the plate language (Luneth: "Looks great").** Coverage is now **elevation**: covered plates lift off a recessed machined substrate — white, green-rimmed, white top-light, per the Empower reference. Dormant = sunk in (zero red on a fresh start) · gap = one 3px amber edge tick · partial = mid-lift + a green **fill level = the snapshot's real `fillPercent`** (delivered ÷ Wallach target — computed since Phase C, discarded by every consumer until now) · present = lifted-but-hollow tech-blue rim. **Variant A** is live behind a one-value toggle (`--cov-strip-mode` / `[data-covered-variant='b']` on `.coverage-grid`).
- **Green scale `--ds-ok-deep/-bright/-wash` is declared LOCALLY** in workspace-coverage.css (sealed design-system.css has only `--ds-status-ok` + `-soft`). Folds into the sealed file with the font fold-in, under sign-off + golden re-seal.
- **Family silhouettes are `border-radius`, NOT chamfers** (vitamin 9px TR · amino 9px BL · fat 11px both). `clip-path` **cannot carry a border** — an inset ring follows the border-box rectangle, so every clipped diagonal renders bare. ★ **The PROPOSAL demos still show clip-path chamfers — they are SUPERSEDED. The Empower plates are ROUNDED, not chamfered; the chamfer was invented, not observed.**
- Purged: the **duplicate `.tile` block** (declared 2x, 13 lines apart, second silently resetting aspect-ratio+padding), a **duplicate `.essentials-host` block**, `.periodic`, `.periodic-host`, `.tile.spacer`, the `.trace` family, blue L-brackets, 3 drifted comments, and a wrong fact ("the 92 Wallach essentials" — it is 90 essentials / 91 tiles). Gap styling now covers vitamin/amino/fat (was mineral-only).

## ★★★★ NEXT — THE TOP BAR (Luneth items 3 · 5 · 6; creative freedom EXPLICITLY granted)
He named the **Knowledge drawer + the Absorption tab** as the quality bar ("looks great and coherent").
3. **Re-add** `// what you're absorbing, what you're missing` — but make it look COOLER (different font/sizing/style), as an **orange aesthetic accent**. Goal: the top area currently "looks boring". (It was removed this session as retired synth-italic — he wants it BACK, restyled.)
5. **"COVERAGE"** at the top is too distracting — colour/size change, or revert its font. His call, undecided.
6. **TOTAL top-bar overhaul.** Too much clutter + repeated text; **"Ask Wallach" feels randomly placed / like an afterthought (it was)**. Either remove the top bar entirely or make it genuinely good.

## ★★★★ THEN — Phase 2b: wire the GOALS live (a REAL feature, currently unbuilt)
Luneth: *"I am not asking you to remove these features but to make them work as intended without fakery… you can click 'add goal' and pick from a list based on our database of known benefits from essentials according to wallach + we combine the youngevity product math to determine coverage."*
- **Today the strip shows an honest-gap placeholder** ("Coverage pending · essentials not yet mapped", `ui('cov_goal_pending')` in view-copy.json). Both old numbers were fiction: `g.total` (14/13/11/12/18/10) is hand-typed chrome in `coverage-layout-skeleton.json` with **no Wallach source and no membership list**, and the numerator scaled the GLOBAL covered ratio by it (all 3 cards showed one number: 7%/8%/9% against a real 9/90).
- **The architecture is PROVEN feasible:** `eden/corpus/indices/essentials.json` already carries per-essential **`conditions_treated`**, derived from sealed Wallach claims. So: author `eden/catalog/goals.json` (goal → its CONDITION slugs — the ONLY human authoring; each slug catalog-resolvable → gated by `references_resolve`) → goal members = essentials whose `conditions_treated` ∩ the goal's conditions → goal coverage = members ∩ the snapshot's covered tiles (the SAME `getOrCompute()` snapshot). Zero new amounts → §00.A clean.
- **Probe (2026-07-14):** bone/skeletal derives **27 real members** (boron, calcium, strontium, magnesium, vitamin-D/K…) vs the hand-typed **14**. **Honest caveat: 61/91 essentials have ≥1 `conditions_treated`; 30 have none yet** (thin-mined rare-earths) — sparse goals will be genuinely sparse, never padded.
- Then **"+ ADD GOAL" becomes real** (picks from goals.json) — it currently has NO handler.

## ★ FONT STATE — ⚠ ONE DECISION IS UNSETTLED
**Verified computed at `:root` 2026-07-14** (trust this, not prose): `--ds-font-display`=**Unbounded** · `--ds-font-display-interface`=**Chakra Petch** · `--ds-font-display-artifact`=**Bruno Ace** · `--ds-font-sans`/`-serif`/`-serif-light`=**Space Grotesk** · `--ds-font-mono`=**JetBrains Mono**.
- **⚠ Luneth (2026-07-14): he had been calling CHAKRA PETCH "Space Grotesk" all along** — Chakra Petch is the sharp-angled face with "the good geometry". **So the prior survey's "Space Grotesk KEPT as the body face (geometry matches)" is UNRELIABLE and the body-face question is OPEN.** Re-ask; do not treat it as decided. Detail: [[futurist-type-direction]].
- **★★ `--ds-font-display-interface` + `-artifact` are declared ONLY in workspace-coverage.css's `:root`, which loads GLOBALLY — 89 rules across 6 sheets read them.** Repointing them reskins the whole app (done + reverted this session). Apply Unbounded PER-ELEMENT only. See [[token-indirection-grep-the-readers]].
- **Unbounded keep-list (his exact words):** 01 MINERALS / 02 VITAMINS / 03 AMINO ACIDS / 04 FATTY ACIDS · all element cards · DAILY PROTOCOL · BTT 2.5 CANISTER + all product names · YOUR GOALS · + ADD GOAL. **NOT** "bone & skeletal" or the goals text.
- **Fold-in still owed:** move type-futurist.css into the sealed design-system.css + re-seal the golden (**needs sign-off**), retire the override. Settle the body face FIRST. Accent micro-polish PARKED: candidate **B = JetBrains-Mono UPPERCASE tracked** (liked, never implemented).

## ★ BACKLOG (still valid)
- **knip burn-down:** 48 baselined keys (8 reserved state helpers + 40 zero-runtime zod `z.infer` aliases). Delete dead code → prune its key → regenerate. `no_new_dead_code` is live.
- **Coverage leftovers:** ambient chrome duplicated across dashboard.css + workspace-coverage.css; `views/regimen.ts` **SLOT_PLACEHOLDERS fake coverage 31/47/18/54**; the drawer misses its `coverage:recomputed` subscription (open drawer can go stale); `CoverageTile.coveredBy`/`aggregateVehicle` dead-but-kept (plausibly wanted for a "what's covering this" UI).
- **Knowledge drawer CONDITIONS + PRODUCTS tabs — still unfinished** (Phase-H entity overhaul). Luneth wants to return here.
- HK Amish-stats verbatim expansion · Part A persistent absorption caveat · content pass (poached-eggs EPIGEN-000155 missing outcome, diet-vein OUTCOME AUDIT, `--`→`—` in diet `answer_short`s) · **THREAD 2** (seal `search-enrichment.json` + `catalog/search-entities.json`; resume Immortality A-Z at Mn-Manganese; charged-treatise capture; lay-topic tagging; port the P2 CHARGED gate) · trace/rare small owed.

## ★ KEY DOCTRINE (memory files authoritative — read at genesis)
- **NEW this session:** [[token-indirection-grep-the-readers]] (★★ grep the token's READERS — a name-grep is circular) · [[signed-off-demo-is-the-spec]] (★★ never "improve" an approved demo; ask).
- [[prove-completion-dont-narrate-it]] · [[pin-the-exact-element-dont-overcorrect]] · [[screenshot-verify-visual-chunks]] (a computed-style probe said "applied" while the page looked WRONG — screenshots are the gate) · [[visual-design-bar-and-principles]] (NO L-brackets) · [[demo-vision-not-letter]] · [[live-supersedes-demo-log-micro-deltas]].
- [[hooks-cwd-relative-trap]] (a bare `cd subdir` drifts the shared CWD + deadlocks the repo-root-relative hooks; recover via PowerShell `Set-Location <root>`).
- **[[safe-write-crlf-flip]] — stage payloads with the Write tool, NEVER a bash heredoc.** Cost 4 failures this session: heredocs wrote literal `0x08` bytes where `\b` belonged (silently making a new gate a no-op) and ate `\n`. Also: `invariants.py` is **CRLF** while safe_write requires **LF** payloads — §17's write-verify correctly REFUSED the corrupting write.
- **Assertion form:** test the DECLARATION (a stripped line starting with `prop:`), never a bare substring — a guard tripped on its own explanatory comment 3x this session.
- Round-close: build → invariants → probe → build-log → Creator's Log → **rebuild** → commit + push. `creators_log.py --summary` is hard-capped at **280 chars**.
