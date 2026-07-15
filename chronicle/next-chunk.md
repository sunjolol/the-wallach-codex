# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-14, Coverage-demo session wrap)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES ("older loses"). Board **64/64** green. **The live app was NOT touched this session — `dashboard/` + `eden/` are byte-identical to HEAD, verified.** All work is a demo under gitignored `temporary/`. **NEXT = Luneth's visual pass on `temporary/coverage-D-personalized.html`, then decide what ships to live.**

## ★★★★ START HERE NEXT SESSION

**The Coverage redesign is LOCKED as a demo, not yet built live.** Read `temporary/coverage-D-personalized.html` (open it — it is interactive). It is the agreed vision. Nothing in `dashboard/` implements it yet.

⚠ **`temporary/` IS GITIGNORED.** The demo is NOT in git and will not survive a clean. If Luneth signs it off, MOVE it to `dashboard/components/` (the tracked home for design-mockup references) before relying on it. **Ask him first — this is unresolved as of the wrap.**

---

## ★★★★ SUPERSEDED THIS SESSION — do NOT resurrect any of these

Every line below was a REAL decision that is now DEAD. They are recorded so no future session re-derives them from a stale artifact (logging-doctrine rule 5: never poison the future).

| ✗ DEAD (was believed) | ✓ LIVE (current truth) |
|---|---|
| **"Goals must leave Coverage permanently — a goal filter is anti-Wallach because you need all 90 regardless."** Claude's argument, presented WITH a "Recommended" tag; Luneth accepted it on 2026-07-14 and then reversed after thinking it through. | **WRONG, and disproven by the corpus itself: 512 conditions in the Catalog, and 768 of 1,357 sealed claims (57%) map ≥1 condition.** *Let's Play Doctor* IS a condition→protocol book. Wallach spends most of his output answering "I have X, what do I take?" **Goals are a first-class part of the flow.** |
| "The rudeness is doctrinal — the console asked a question the app must ignore." | **The rudeness was the COPY.** Luneth: *"my problem was never the idea, my problem was the presentation… 'What are you here for?' sounds rude, 'Let's get started' is more inviting. It was very simple all along and you blew it out of proportion."* He is right. |
| "Cut the regimen rail — give the table the width." (Luneth's own earlier call this session.) | **The rail STAYS.** It is the CAUSATION behind every lit tile. Luneth: *"I see no way to divorce this from the coverage page."* |
| **Demo A · THE PLATE** (`temporary/coverage-A-plate.html`) · **B · THE BAND** (`-B-band.html`) · **C · THE ARRIVAL** (`-C-arrival.html`) | **ALL THREE SUPERSEDED BY D** (`coverage-D-personalized.html`). A was the base; B (chrome-carries-state) was rejected — it dissolved the tan box Luneth said to keep; C (arrival-only highlight) folded into D. **Do not reference A/B/C as the spec.** They remain only as history. |
| "The rail broke the FOUNDATIONAL row — 10 tiles + calcium orphaned." Claude reported this TWICE as a defect. | **IT NEVER EXISTED.** All 11 sit on one row. The row-counter read the *covered plates' 2px lift* (top=239.1 vs 241.1) as two rows. A fabricated defect from a broken instrument. |
| Legend word **"GAP · ATTENTION"** | **"NOT COVERED".** "Gap" read as *a hole in our data*; it actually means *Wallach gave a number and you're under 30% of it*. Also **"NO WALLACH TARGET" → "NO WALLACH NUMBER YET"**. |
| The multi-goal ring via `border-image`; a smooth-vs-segments toggle. | **Both gone.** One masked-`::after` ring for single AND multi (identical weight + glow); **Luneth chose the gradient — the segment variant and its toggle are deleted.** |

---

## ★★★★ THE LOCKED DESIGN (demo D)

### The rule that resolves the whole goals-vs-honesty tension
> **A goal may change what you LOOK AT, or what you're RECOMMENDED. It may NEVER change what you're MEASURED AGAINST.**

The denominator is always **90**. Under that rule a goal cannot mislead — it has no denominator to lie with. **The old goal cards' sin was never the goal; it was the DENOMINATOR** ("bone & skeletal 3/14" asserted that bone health IS 14 things — a subset of the 90, which inverts Wallach's thesis). Wallach's protocols are ADDITIVE (the 90 + emphasis), never subtractive.

**Verified consequence:** a goal highlight *argues for* the 90 rather than against it. Wallach's answer to one condition is never narrow — arthritis 26 essentials across **4 of 4 categories**, depression 24 across 4, cancer 18 across 4, anemia 20 across 4. Show his real answer and breadth makes its own case, with zero copy.

### The flow (Luneth's, corrected — his original plan was right)
`state a goal (welcome) → product recommendations → see your 90 as a whole`
His step 3 was always **"the 90 as a whole"** — the plan never filtered. The bug was that steps 1–2 (a DOOR) were bolted onto step 3 (a MIRROR).

### What demo D contains (all verified live, not asserted)
- **Welcome** — unskippable, blurs the field, takes a **name** (18-char cap) + goals, with **"I'm just browsing →"** as the escape hatch. Copy: *"Let's get started / What do you want to work on?"*. **The personalization is the point** — Luneth: *"IF we can gather at least ONE piece of personal info RIGHT AWAY, THE REST OF THE APP IS SUDDENLY MUCH MORE POWERFUL… people want things PERSONALIZED not GENERALIZED."* Name → rail + avatar. **Avatars + profile editing are WANTED but NOT built.**
- **Goal strip** up top — REPORTS your goals, never asks. Hover a chip = **transient** focus (fade others). Chips carry an **X revealed on hover with 0px layout shift** (space reserved always; a confirm-delete mode was rejected — the action is one click to undo).
- **The ring** — goal membership on the tile EDGE; status owns the tile INTERIOR. Two channels, no collision. **Multi-goal tiles wear a gradient of their goals' hues** — the emergent "magic", and it is TRUE (calcium/chromium/copper/selenium/vanadium/zinc wore all 3 of a 3-goal set).
- **PDM foundation** — the 33 rare earths render as an always-required THIRD state, never goal-specific (Wallach never itemizes them; they share one dose). Prevents the field implying 33 essentials don't matter.
- **The ledger** — `COVERED 4 · PARTIAL 0 · PRESENT 0 · NOT COVERED 37 · NO WALLACH NUMBER YET 49 — 90 counted · 91 shown`. **Byte-identical before goals, after goals, and during hover.**
- **"Based on your goals"** — 4 products, same gradient language as the tiles, using **the existing recommender score** (`W_ADEQ .6 · W_BREADTH .3 · W_VALUE .1`, breadth saturating `n/(n+5)`). Value un-flattened the list: Kid's Toddy ($26.95, 6.3/$10) outranks products supplying more for $48.95.
- **Grid: `repeat(auto-fill, 92px)` + `gap: 9px`** — measured across 8 combos. Integer tracks → integer positions → the ring rasterises evenly (the "thin right border" was a **grid** bug: `1fr` gave 88.297px tiles at left=1123.766, so the ring straddled half-pixels). Also drops CHOLECALCIFEROL 3 lines → 2, and gives lit neighbours air.
- **No footer** (all 4 items were fabricated). **Topbar = nameplate only** — Luneth: leave the middle empty for now, he'll judge it when he sees it.

### The 14 goals are a SCAFFOLD — Luneth authors the real set
Built from real Catalog conditions; 3 invented slugs (`brain_fog`, `senility`, `ulcerative_colitis`) were auto-cut because they don't resolve. **Luneth: "totally fine to drop ANY goals that don't fit… if we need to hand-make 50-100 new goals that DO tie into our vision, that's fine."** `LONGEVITY & ANTI-AGING` was DROPPED — Wallach's longevity answer IS all 90, so it can only be everything (no information) or a subset someone invented (fabrication). Real home: `eden/catalog/goals.json` (goal → condition slugs, every slug catalog-resolvable → gated by `references_resolve`).

---

## ★★★★ FINDINGS THAT CHANGE THE APP (verified, not yet fixed)

- **★ "4 / 90" on a fresh dashboard is 100% FIAT.** The 4 are **hydrogen, carbon, nitrogen, oxygen** — forced to `covered` by `FOUNDATIONAL_PRESENT_SLUGS` (`state/coverage.ts:593`), cited **"(Luneth)"**, not Wallach, because you breathe. The headline stat told a new user they were breathing.
- **★ "covered" is FOUR incommensurable regimes** (measured from `essentials-targets-data.json`): `wallach` 38 · `trace_pdm` 33 (one shared PDM verdict amplified 33×) · `dietary_with_clinical_lever` 14 · `dietary` 3 · `unspecified` 3. Only **37 carry a numeric low > 0**. So "4/90" printed a count of four different kinds of thing as one fraction — **twice, 200px apart**. That is what "the box is ugly" was reacting to. **The distribution replaces the ratio.**
- **★ Silver + Tin are NOT rare-earths.** They sit inside `RARE TRACE · 35` but carry their OWN Wallach doses (**silver 400 mcg, tin 500 mcg** — cf `silver-dose-400-mcg-not-mg`); the other 33 share one PDM dose. The foundation ring exposed a real distinction the section header hides. Not a bug.
- **★ The entry cost is NOT $300 — the curve is violently front-loaded.** Measured against the real product DB, wholesale, applying the real `classify()` thresholds: **BTT 2.5 at $69.95 → 17 covered + 9 partial**, and being the PDM vehicle it also settles the whole 33-strong rare-earth group. Getting from there to ~70/90 costs **another $145 and 4 more products**. **Your first $70 does more than your next $145** — and you can only SEE that if the denominator stays 90. A goal-filtered view hides it.
- **`omega-9` has ZERO claims** and can never light under any goal. `omega-6` has 9 claims and is NOT mapped to any cognition condition. → **chip queued** (Luneth has Wallach's definitive daily amounts, which would also give the omegas real numeric targets instead of the honest gap).
- **`goals[].total`** (14/13/11/12/18/10) — hand-typed, unsourced, read by NO view, contradicts `nutrientToGoalMap` (6/6/13/6/3/4), and sits inside the MANIFEST-gated `coverage-layout-data.json`. **R8 grandfathering; an integrity gate is currently certifying fabricated data as "fresh".** → **chip queued** (Luneth: *"it sounds serious… I want to address this next session"*).
- **The chrome is all fabricated** (unchanged from the last handoff): `SYNCED` (impossible offline), `CODEX v3.27` (the BRAIN's version), `WS·01`, hardcoded `COVERAGE` h1, `READY · all systems`, `EDEN v1 · sealed 8E594A01` (a MOCKUP LITERAL matching none of the 8 real goldens), `BUILD v3` (build.mjs stamps nothing). Demo D deletes all of it.
- **RECOMMENDER UNIT BUG** (unchanged, still live): `rankSources` (`state/recommender.ts:98`) computes `adequacy = min(1, amount/targetLow)` with **no unit reconciliation**. **boron** (products mcg vs a 9.2 **mg** target) saturates at 1.0000 for all 4 candidates when the truth is 0.16–0.54; **silver** (mg vs a 400 **mcg** target) reads 0.0001 where truth is 0.10. Adequacy is the 0.6 keystone, so the ranking silently collapses to breadth+price.
- **SIZE BUDGET BLOWN 4.9x** — `dist/main.js` = 1,227,022 B gzipped vs the declared 250 KB. `size-limit` is configured correctly; it just isn't in the round-close, so it never runs.
- **`main.ts` fails lint at HEAD** (3 pre-existing errors). Not ours.

---

## ★★★★ EDEN CANNOT BE POISONED — verified, and it is an ABSENCE not a guard
Luneth asked whether user-scanned/manual items could ever reach the sealed pillars. **They cannot, structurally:**
- **`eden/` is never imported by the app.** Every mention of it in `src/` is a COMMENT (`core/eden.ts` is a local module, not the pillar dir). The pillars are read at BUILD time by the derive scripts, projected to `assets/data/*.json`, baked into `main.js`. **The shipped app has no `eden/` to write to**, and it is never served to the page.
- **There is exactly ONE `localStorage.setItem` in the entire codebase** — `core/storage.ts:85`. Every scan/manual add/override funnels through it into the user's own browser storage.
User data flows INTO localStorage; canonical data flows OUT of the bundle; they never meet in a writable place. **"Their own way" and "Eden stays sealed" were never in tension.**

---

## ★★★★ THE STRUCTURAL DIAGNOSIS — noted, NOT actioned (Luneth: "note it, don't act")
**The app opens on the mirror.** Coverage is ⌘1, the default — so a new user opens a *scoreboard before they've played*, sees 4/90, and feels judged. Someone then bolted a goal-selector onto it to make it feel like a beginning. **You cannot fix a mirror by writing a question on it** — that is why it read as rude and why it needed a fabricated ratio to feel useful. **The door already exists**: Knowledge Home (*"Everything Wallach taught, in one place"*), which the memory already calls the "maximally-enticing hook the user into the experience" surface. Revisit what OPENS the app once the map is locked. **Do not act on this without Luneth.**

## ★ SHIPPED EARLIER THIS SESSION (before the demo work, already committed)
- `f4d20292` — a11y: `prefers-reduced-motion` capped duration but not ITERATION-COUNT, so infinite animations ran at ~100Hz. NEW GATE `tools/render_probe_reduced_motion.js`. ⚠ KNOWN GAP: reads CSS animations only, blind to canvas/rAF.
- `86cbadda` — the HBSP starter-pack pre-fill is gone; true empty state is 4/90, not 13/90.

## ★ KEY DOCTRINE (memory files authoritative — read at genesis)
- ★★ **THE INSTRUMENT LIES BEFORE THE EYE DOES.** Three times this session: (1) `--use-gl=swiftshader` → identical WebGL shots ([[webgl-headless-context-loss]]); (2) a `::after` ring that rendered as nothing because `.tile{overflow:hidden}` clipped it — invisible at 1x, obvious at 2x; (3) a row-counter that read a 2px plate LIFT as a wrapped row and invented a defect Luneth disproved by *looking*. **When output contradicts the eye, suspect the instrument.** [[prove-completion-dont-narrate-it]] [[screenshot-verify-visual-chunks]]
- ★★ **A JOIN THAT REPORTS SUCCESS CAN STILL BE SILENTLY DROPPING ROWS.** The goal scaffold matched on the canonical name (`Omega-3 (Alpha-Linolenic Acid / ALA)`) while tiles carry the layout label (`OMEGA-3`) — **16 of 91 differ** (all 12 vitamins, flavonoids, all 3 omegas), so EVERY goal silently lost its vitamins and omegas. Luneth caught it by noticing the one essential he knows cold. **Always assert the join count.**
- ★ **A composer that dies still lets `safe_write` write the STALE file and report OK.** Check the byte count changed.
- [[directives-are-guidelines-stay-balanced]] — the core defect this session: Luneth said "the copy is rude" and Claude escalated it into "the concept must die."
- [[hooks-cwd-relative-trap]] — a bare `cd subdir` drifts the shared CWD + blocks the hooks; recover via PowerShell `Set-Location <root>`. **Bit once this session. Always subshell: `(cd dashboard && …)`.**
- [[safe-write-crlf-flip]] — stage payloads with the Write tool, never a bash heredoc (a heredoc ate backslashes in a probe this session, again).
- Round-close: build → invariants → probe → build-log → Creator's Log → **rebuild** → commit + push. `creators_log.py --summary` hard-capped at **280 chars**; `--kind` must be one of the enum (`design-decision`, not `decision`).
