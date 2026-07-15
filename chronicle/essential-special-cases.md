# The essential special cases — the CLARITY-PASS registry

_Created 2026-07-15 on Luneth's instruction: **"any special cases NEED to be visible and easily understood by the user when they click into an element view — doesn't need to be done now but these 'special cases' need to be logged and remembered so we can apply them in a later 'clarity pass'."**_

_This file is the DENOMINATOR for that pass. Every essential that does not behave like "a Wallach number you are measured against" is listed here with (a) what it does, (b) why, traced to source, and (c) what the user must be told. **If it is not on this list, the clarity pass will not cover it — so add to it the moment a new special case is created.**_

---

## Why this exists

Of the 91 essentials on the board, **only 38 behave "normally"** — a Wallach number, a measured intake, a percentage. The rest do something else, and today the page explains **none** of it. A user clicking into phosphorus sees a green tile with no number and no reason; a user clicking omega-9 sees an essential Wallach never named. Silence on a special case reads as a bug or, worse, as a claim we never made.

**The pattern to reuse:** `fatty-acid-clarity-data.json` already exists (from the 2026-07-08 arachidonic correction) and renders in the entity-page deep-dive. It is the prototype for a general per-essential clarity store. R4 binds: the prose lives ONCE, ID-attached, in the content store — never inline in a view.

---

## The register

### 1 · PHOSPHORUS — green, with no number, and that is correct
- **Behaviour:** FOUNDATIONAL, renders `covered`, shows no target.
- **Why:** Wallach's base-line table gives it **True Supplement Need 0.0** — the only nutrient in the whole table with no recommended amount (`WAL-CLM-LETS-000061`) — because the diet already floods you with it: *"rich in phosphorous… found in just about everything we eat"* (`dddl:7408`). `classify()` returns covered when `target.low === 0`: **a zero target is MET by taking none.**
- **★ It is NOT fiat.** Phosphorus is deliberately NOT in `FOUNDATIONAL_PRESENT_SLUGS`. It is the ONE foundational element whose green traces to a sealed Wallach claim. Precision-checked: the only essential of 91 with `low == 0`; 53 carry no `low` key at all and keep the pending branch.
- **User must be told:** "Wallach says you need this and also says you need to supplement none of it — your food already delivers it." Do NOT let it read as a missing number.

### 2 · HYDROGEN · CARBON · NITROGEN · OXYGEN — green by FIAT, and the user is never told
- **Behaviour:** forced `covered` by `FOUNDATIONAL_PRESENT_SLUGS` (`state/coverage.ts`).
- **Why:** cited **"(Luneth)"**, NOT Wallach. Because you breathe.
- **★ This is the only place in the app where a coverage verdict does not trace to the corpus.** The old "4 / 90" headline told a new user they were breathing.
- **User must be told:** these four are green because you are alive, not because of anything you take. Highest-priority clarity item — it is the one verdict with no Wallach behind it.

### 3 · OMEGA-9 — zero claims, permanently, and that is his POSITION not a gap
- **Behaviour:** no number, no claims, can never light under any goal.
- **Why:** Wallach names three PUFAs and oleic acid is not among them — *"only two (linoleic and linolenic) are designated as Essential Fatty Acids"* (DDDL L7171-7174 + Immortality L5189-5196). **Its zero IS his stated position, NOT a mining gap.**
- **Why it is on the board anyway:** Luneth's call, labelled honestly by him as aesthetic — *"3 is a better number than 2… purely a mental/aesthetics/design thing."*
- **User must be told:** a **custom page** explaining why it is here and why it has no number. Already promised, **NOT BUILT**. Without it, omega-9 is the single most confusing tile on the board.

### 4 · OMEGA-3 + OMEGA-6 — one budget, two tiles
- **Behaviour:** share ONE verdict. Neither has an independent number.
- **Why:** **9 g/day of EFA, COLLECTIVE** across both (`WAL-CLM-DDDL-000115`, DDDL 3e L9106-9109). Marked `dose.collective_group: "essential-fatty-acids"`; `targets_derive._maintenance_doses` EXCLUDES collectives so one 9 g claim can never post 9 g to each (that would be an 18 g board target from a 9 g source). Gated by `collective_doses_not_fanned`.
- **User must be told:** these two move together because Wallach gave one number for both. Luneth already asked for this: *"bring it front-facing when you click into the omega tabs."* **NOT BUILT.**

### 5 · COBALT — shares B12's verdict (DECIDED 2026-07-15, NOT YET IMPLEMENTED)
- **Behaviour today:** carries a **400 mcg elemental target** — WRONG.
- **Why it is wrong, in Wallach's own words** (`immortality.txt:5882-5884`): *"The essentiality of cobalt is unusual in that **the requirement is for a cobalt complex known as cyanocobalamine or vitamin B12. A pure cobalt requirement is only found in some bacteria and algae**"*, and only ruminants use elemental cobalt (*"microbes… convert elemental cobalt into vitamin B12"*). **Humans have no elemental cobalt requirement.** The "250–400 mcg" in `WAL-CLM-IMMORT-000084` is a **B12 dose** — the RDA he cites beside it ("3 to 4 mcg") is the B12 RDA; there is no cobalt RDA. B12 already has its own independent target (400 mcg, `WAL-CLM-EPIGEN-000117`, Epigenetics 2014).
- **★ This overturns a documented decision.** `eden/tools/targets_derive.py:137-140` explicitly excluded cobalt from `collective_group` reasoning it *"maps two slugs because ONE substance carries two names."* **That premise is false** — cobalt is an ELEMENT inside a MOLECULE (*"a single cobalt atom is the central metal component of vitamin B12"*), so 400 mcg of B12 carries ~4% of that as cobalt, not 400 mcg. The docstring must be corrected in the same patch as the fix.
- **Luneth's call (2026-07-15):** cobalt **shares B12's verdict** — covered iff your B12 is covered.
- **Fails safe meanwhile:** the target is ~23× too high, so the field UNDER-states cobalt. Never falsely green. Not urgent, but it is a fabricated elemental target sitting in a sealed pillar.
- **User must be told:** cobalt is covered by your B12, because B12 is the only form of cobalt a human can use.

### 6 · THE 34 PLANT DERIVED — one shared verdict, never decomposed
- **Behaviour:** no individual amounts; ONE group verdict = Σ(vehicle mg) ÷ 924 mg.
- **Why:** `WAL-CLM-EPIGEN-000089` doses the **BOTTLE**, in fluid ounces — *"Liquid Plant Derived Coloidal Minerals One Ounce/ 100 pounds/day PPM"*. The 924 is 1 fl oz × 600 mg/fl oz (Majestic Earth's concentration) × 1.54 (154 lb). §00.A-clean by construction: Wallach supplies the dose, the Youngevity label supplies only the concentration.
- **★ NEVER decompose the bottle.** No per-element mg is possible, needed, or wanted — permanently.
- **A presence floor exists:** a scanned item naming ONE of the 34 lifts that tile to `present` only — it can never reach `covered`, because Wallach states no individual amount.
- **User must be told:** why 34 tiles move as one, and why a third-party product listing all 34 lights them `present` but moves the meter zero (his dose is in fluid ounces, so converting needs a known mg/fl oz). That is the honest answer, not a bug.

### 7 · SILVER + TIN — they look like exceptions and are not
- **Behaviour:** sit visually among the trace minerals but carry their OWN Wallach doses (**silver 400 mcg**, **tin 500 mcg**) and render individually.
- **Why:** already adjudicated — not a bug. ★ Silver is **400 MCG not 400 mg** (mg would be toxic); the misprint was fixed across all 4 books.
- **User must be told:** probably nothing. Listed here so a future session does not "fix" them into the shared group.

### 8 · THE 53 WITH NO NUMERIC TARGET — an honest gap, not an error
- **Behaviour:** render statusless ("NO WALLACH NUMBER YET"). 53 of 91 carry no `low` key.
- **Why:** Wallach states no maintenance dose for them yet. Blueprint §7.1: an honest gap, **never** a Youngevity-derived fallback.
- **★ Absence-as-state is a known styling root cause** — the state has NO class; it is the ABSENCE of one, so it cannot be styled independently of the chassis.
- **User must be told:** the difference between "Wallach gave no number" and "you are not covered". Today they are visually indistinguishable from each other in the worst way — one is about OUR data, the other about YOUR stack.

---

## Scoreboard — how much of the board is a special case

| | n |
|---|---|
| Normal (a Wallach number you are measured against) | **38** |
| No number — honest gap | 53 |
| Green by fiat (H·C·N·O) | 4 |
| Green by a zero target (phosphorus) | 1 |
| One shared verdict (PLANT DERIVED) | 34 |
| One shared budget (omega-3 + omega-6) | 2 |
| Zero claims by his position (omega-9) | 1 |
| Shares another essential's verdict (cobalt) | 1 |

_(Groups overlap the 53 — this is a census of BEHAVIOURS, not a partition of 91.)_

**The headline:** a minority of the board behaves the way the board's own legend implies. That is not a defect — it is Wallach's framework being more varied than a grid of percentages. **But it is only honest if the page says so**, and today the page says none of it.

---

## Rules for this file
1. **A new special case lands here in the same chunk that creates it.** A case that exists in code but not in this list is invisible to the clarity pass by construction.
2. **Every entry cites its source** — a claim id, a book locator, or an explicit "(Luneth)" for a fiat call. A special case with no traceable why is a defect, not a special case.
3. **This is a REGISTRY, not the content store.** When the clarity pass lands, the user-facing prose goes ONCE into the segregated store (R4), ID-attached, and the views read it. This file stays as the durable index of what needs covering and why.
