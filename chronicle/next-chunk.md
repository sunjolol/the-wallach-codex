# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-15, omega session wrap)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES ("older loses"). Board **66/66** green. **NEXT = the Coverage tab re-design — Luneth has notes to share; finish the demo 100%, THEN build it live.**
>
> The Coverage redesign is still a DEMO under gitignored `temporary/` and is NOT built live. **The omegas are DONE** (sealed · gated · measured · probed) — that half of the old handoff is closed. Everything below the START HERE section is the still-live design record.

## ★★★★ START HERE NEXT SESSION — Luneth's order, verbatim

> *"I'd like to close this session out then get back to the coverage tab re-design in a new session, I have some notes for that I want to share so we can finish it 100% then start to build it live"*

1. **ASK LUNETH FOR HIS COVERAGE NOTES.** He has them and they gate everything. Do not start guessing at the demo.
2. **FINISH `temporary/coverage-D-personalized.html` to 100%** against those notes. His visual pass was never completed.
3. **THEN integrate D into `dashboard/`.** Not before 1 + 2.

**Tile width was fixed + signed off 2026-07-15** (`0853eacd`): the grid is `repeat(auto-fill, 100px)` + `gap: 9px`. Luneth: *"you got it plenty close enough. Looks good as is."* ⚠ The in-file comment's OLD math (1208px / 12 columns) was measured at a bare 1920 with no scrollbar — his real layout viewport is **1905**, the host content box is **1193px**, and 100px is the WIDEST track that still fits 11 columns (101 drops to 10 and orphans the FOUNDATIONAL row's 11th tile). Residual: right inset 27px vs left 24px — 3px, accepted. AMINO ACIDS still orphans `Val` alone on row 2 — pre-existing, Luneth: *"we can't fix this without breaking something else."*

★ **A LESSON THAT COST REAL TIME THIS SESSION** — `justify-content: space-between` fills the row exactly and is the obvious fix. It is a TRAP: a 4x isolated-ring pixel test proved fractional track POSITION alone reproduces the 1fr ring defect (right edge 8.00 device px vs the left's 12.00) even with an integer WIDTH. **Integer POSITION, not merely integer width, is what keeps the ring even.** Do not "improve" the grid with space-between.

---

## ★★★★ THE OMEGAS ARE DONE — do not re-open the decision

**Locked, sealed, and gated 2026-07-15.** Full record: `chronicle/contradictions/2026-07-15-omega-efa-target-source.md`. Commits `4dd12b06` (decision) · `85b095fc` (seal + fan-out gate) · `e23330b2` (group meter).

- **The number: 9 g/day of essential fatty acids**, COLLECTIVE across omega-3 + omega-6. `WAL-CLM-DDDL-000115`, sealed at kv=332. Source: Dead Doctors Don't Lie 3e (2011) **L9106-9109** @ char_offset **609931** — *"Essential fatty acids are a must and should be consumed at the rate of 3 percent of your total daily calorie consumption or supplemented at the rate of 9 grams per day in capsule form."*
- **omega-9 gets NO number, permanently.** Wallach names three PUFAs and oleic acid is not among them ("only two (linoleic and linolenic) are designated as Essential Fatty Acids", DDDL L7171-7174 + Immortality L5189-5196). Its ZERO claims are his actual position, NOT a mining gap. It stays on the board for a reason Luneth labelled honestly as aesthetic (*"3 is a better number than 2… purely a mental/aesthetics/design thing"*) and earns a **custom detail page** explaining why it is there. **NOT BUILT YET.**
- **Delivery: 9 softgels/day, 3 at a time t.i.d.** — Wallach's OWN divided-dose rule (Let's Play Doctor L4166-4174: *"in divided doses t.i.d. … to keep blood levels elevated for at least 12 hours per day"*). Luneth's hard-won headache rule ("never more than 3 at a time, never without a solid meal") IS that rule.
- **Therapeutic tier: 15 g/day** (his `5 gm t.i.d.`, 81 occurrences, all inside condition protocols) — excluded from targets by `targets_derive._cond_priority`.
- ★ **THE DURABLE RULE this established:** **supply a reference ONLY when Wallach's own words cannot produce a number; NEVER to replace a number he already wrote.** Minerals give only a rate ("per 100 lbs") so ×1.54 must be supplied. EFA gives the rate AND the finished figure, so nothing is supplied — plugging in the FDA 2,000-kcal standard yields 6.67 g and OVERRULES his 9 g.
- ★ **"2,700 calories" is CLAUDE'S back-inference, NOT a Wallach claim.** Never cite it as sourced.
- **The basis call (flippable):** the goal counts EFA **milligrams** (ALA+EPA+DHA+LA+GLA = 707/softgel), so 100% = 12.7 softgels. `total_fat` (→9 softgels) would credit saturated fat toward an EFA goal; `Total Omega` (→10.9) would credit oleic. 9 g of EFA ≈ **one tablespoon of flaxseed oil** — what Wallach actually tells people to take. The softgel is a ~20× more expensive tablespoon.

**Live behaviour (proven by `tools/render_probe_omega.js`):** 1 softgel = 7.9% gap · **6 = 47.1% PARTIAL** · 13 = 102.1% covered · omega-3 + omega-6 share ONE verdict · minerals leave the omegas dark.

### Omega work still open (NOT blocking the Coverage re-design)
- **The 62-claim EFA re-map.** 62 sealed claims name EFA/flaxseed in the verbatim but map omega-3 WITHOUT omega-6 (omega-6 has only 10 claims). ★ **NEEDS LUNETH'S PER-CLAIM CRITERIA** — 66 of them are lets-play-doctor protocols, and "flaxseed oil" appearing in a protocol is not automatically a claim ABOUT omega-6. A blanket batch would be exactly the fiat the Charter exists to stop. This is what would close the omega-6 cognition gap.
- **The front-facing explainer** Luneth asked for (*"bring it front-facing when you click into the omega tabs"*) + **omega-9's custom page**. ★ **THERE IS NO COVERAGE TILE CLICK** — `views/coverage.ts:107` emits an inert `<div>`; the ONLY route to an essential page is the Knowledge drawer (`data-kd-essential` → `knowledge.ts:456`). That navigation must be BUILT, and it lands naturally with the Coverage re-design. A per-omega alert store already exists: `fatty-acid-clarity-data.json` (from the 2026-07-08 arachidonic correction), rendered in the entity-page deep-dive.
- **The 6 "5 mg" EFA misprints** (DDDL ×2, Let's Play Doctor ×4) — `5 mg t.i.d.` against the books' own 56× `5 gm t.i.d.`, a 1000× error reused across both books. ★ **NEEDS LUNETH'S PRINTED PAGES** — we only have a PDF for Hell's Kitchen.
- **Hell's Kitchen doc reconciliation** — APPROVED by Luneth, NOT started. 7 books are sealed; CLAUDE.md §00.A + `source-rule.md` enumerate only 6. `hells-kitchen` (Wallach + Ma Lan, 3rd ed 2015) is sealed with a content hash and already cited by omega-3's `food_source` claim. Also `books-roadmap.json` STILL lists it as "planned / not yet in-housed", which the Knowledge tab renders as "coming soon" — so the app would advertise a book whose claims already ship.

---

## ★★★★ CRACKS FOUND 2026-07-15 — flagged, NOT fixed (each its own chunk)

- ★ **`eden_hash_integrity` DOES NOT EXIST** (deleted Phase F/A1; tombstone `tools/invariants.py:357-359`) — but **`charter.md` R1 still advertises it as LIVE**. `charter_gates_present` cannot catch it for TWO independent reasons: it scans only the **Gate** column (cells[2]) while the dead name sits in the **Status** column (cells[3]), AND R1's PARTIAL status contains the word "WISH", which waives every gate name in that row. The meta-gate whose whole job is stopping the Charter from overselling its own enforcement is blind here.
- ★ **`readScale` (coverage.ts:374) has an UNREACHABLE branch.** Its 2nd candidate `item.scaling_factor` can never fire: `RegimenItemSchema` is a plain `z.object()` (NOT `.passthrough()`), so Zod STRIPS the field before readScale sees it. Only `overrides.scaling_factor` and `label.servings` work. Dead code that reads like a working feature — it silently ate two probe attempts this session.
- ★ **`entity_render_is_projection` cannot see hyphenated slugs.** Proven by running the impl directly: `slug === 'calcium'` → RED, `slug === 'omega-9'` → GREEN. **15 of 91 canon slugs are hyphenated.** A per-slug omega-9 branch would pass the board while violating R1/R3. R9 says tighten the gate with a negative test; it does not license the branch.
- **cobalt's 400 mcg** derives from `WAL-CLM-IMMORT-000084`, a dose claim mapping BOTH cobalt and vitamin-b12 ("250-400 mcg") — a B12 dose whose full amount was fanned onto cobalt. Gate-green today; carries no `collective_group` so the new gate does not touch it. May be correct (cobalamin carries cobalt) or the same class of error. **The book passage was not read — worth a look, not a guess.**
- **Zero probe coverage outside what exists**: `render_probe_entity` hardcodes Calcium, `render_probe_knowledge` uses Magnesium/Dysprosium. `render_probe_omega.js` (NEW) is the only omega coverage.

---

## ★★★★ THE INSTRUMENT LIED SIX TIMES THIS SESSION — the single most expensive pattern

Every one produced a confident falsehood that a control or a second measurement caught. **When output contradicts the eye, suspect the tool.** [[the-instrument-lies-before-the-eye]] [[prove-completion-dont-narrate-it]]

1. **The grid comment** claimed 1208px/12 columns — measured at a viewport with no scrollbar. Luneth's screen never had it.
2. **Ring-test v1** called the KNOWN-buggy 1fr config "symmetric" and the known-good baseline "ASYMMETRIC" — exactly backwards. It was measuring the NEIGHBOUR's ring (at gap 5 the two rings touch). **Only the negative control exposed it.**
3. **A workflow-output parse** returned zeros for every field because the payload is wrapped in a `result` key — `.get()` silently returned empty defaults, and "0 misprints found" read as a clean bill of health.
4. **A screenshot clip** sheared the tiles: the grid lives in a scrollable container, so page-coordinate clips + `captureBeyondViewport` point at the wrong band. Use `scrollIntoView` + viewport coords + `captureBeyondViewport:false`.
5. **Two probe seeds** (`item.servings`, then `item.scaling_factor`) were silently dropped by Zod, so every dose graded identically and the meter looked broken when the probe was.
6. **A "0 g fan-out" simulation** returned RED and looked like a catch — it was RED because the claim was an unsealed DRAFT, not because the gate saw the bug. **False comfort.** Sealing it into a throwaway corpus proved the gate says GREEN on an 18 g assertion.

★ **A test that cannot reproduce a KNOWN bug proves nothing.** Plant the control first.


**The Coverage redesign is LOCKED as a demo, not yet built live.** Open `temporary/coverage-D-personalized.html` — it is interactive (type a name, pick goals, hover a goal chip). It is the agreed vision. **Nothing in `dashboard/` implements it.**

⚠ **`temporary/` IS GITIGNORED — and it HAS been swept before** (the 2026-07-14 build-log: *"temporary/ scratch cleaned … relocated or deleted"*). `temporary/README.md` marks the protected files in place; **this section is the committed backup of that instruction**, because that README is itself unrecoverable.

**★ THE RULE (Luneth, 2026-07-14): a prototype survives until the redesign it is the reference FOR has actually shipped.** Not until it looks finished — until it *ships*. PROTECTED today:
- **`temporary/coverage-D-personalized.html`** — the locked Coverage vision. The live app implements NONE of it. Freed when the Coverage rebuild ships + is signed off.
- **`temporary/knowledge-drawer-prototype.html`** — ★ **cited by `chronicle/entity-page-redesign-blueprint.md`, an ACTIVE blueprint.** Deleting it silently breaks a live plan's only visual source. Luneth: *"we haven't even finished the knowledge drawer re-design yet, so this file is still needed for reference."* Freed when that redesign is finished.
- **`temporary/topic-page-prototype.html`** — same class; kept on the rule, not on a citation.

Do NOT relocate them either — they resolve the real stylesheets via `../dashboard/assets/styles/…`, so a move breaks them **silently** (renders unstyled, reads as a bad design rather than a broken path). Luneth declined moving D to `dashboard/components/`: not needed on GitHub, just needs to survive.

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
- ~~**`goals[].total`**~~ — ✓ **FIXED + PUSHED 2026-07-14 (`886fb4a2`).** The six hand-typed unsourced numbers are gone from the skeleton AND from `LayoutGoalSchema` (deleted, not made optional — a per-goal total IS the denominator the locked rule forbids, and an optional fabricated field is still fabricated). Goals themselves stay. Verified: zero `"total"` strings in the derived artifact · goals carry exactly `{id, name}` · tsc clean · 64/64 with `derived_artifacts_fresh` re-proving the regenerate · `render_probe.js` exit 0 (goals:6, 0 page errors).
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
