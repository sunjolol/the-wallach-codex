# Coverage · Regimen · Scanner — the integration blueprint

_Authored 2026-07-15 from Luneth's concept + his six locked calls this session. **The blueprint is the gate for the demo** — his words: "the demo comes AFTER the blueprint is already established and ROCK SOLID for how ALL of this works as a whole." Nothing here is built yet._

_Scope: the three surfaces that remain functionally unfinished, and every interaction between them. Journey, Ask-Wallach and the Knowledge conditions/products tabs are OUT of scope (already demo'd or separately mapped)._

---

## §1 — The locked calls (Luneth, 2026-07-15)

Findable, so they are never re-litigated or buried. Each is his, not mine.

| # | Question | His call |
|---|---|---|
| D1 | Default dose source | **Wallach's dose where a sealed claim doses the product; label directions otherwise.** NOT the RDA — an RDA is per-nutrient, the default is a per-product serving count, and §00.A bans DRIs/DVs outright. |
| D2 | Scanner spine | **Identify-not-transcribe for the 215 known products; paste-or-type for third-party. OCR assists, never load-bearing.** |
| D3 | Save model | **Autosave everywhere.** The slot IS the live state. No draft mode, no save button. |
| D4 | Slot identity on Coverage | **The rail shows the active slot's name, read-only. Switching happens in Regimen only.** |
| ~~D5~~ | ~~Food & drink vs supplements~~ | ~~Add a real `category` field to the Products pillar.~~ **REVERSED 2026-07-15, same day — not worth the cost (see D8).** |
| **D8** | Food & drink vs supplements (D5's replacement) | **ALL Eden/YGY products are "supplements" by a simple OUTSIDE rule.** No pillar field, no re-seal, no per-product judgment. Luneth: *"this will be way too much work for way too little gain… realistically 210 out of the 215 products are likely supplements, with only the sports drinks being considered food items… lets us move forward quickly with relatively high accuracy."* **Provisional** ("for the time being"). |
| ~~D6~~ | ~~The 199 undirected components~~ | ~~Mine the 245 label images first.~~ **SUPERSEDED 2026-07-15, same day — BLOCKED BY DATA.** The directions are not on those images (§2). |
| **D7** | The 199 undirected components (D6's replacement) | **Default to ONE serving size** — recorded 221/221. *"most users will change the defaults anyway and we'll make it clear it's MEANT to be changed to more realistic numbers"* (Luneth). Keep the 22 real directions where they exist. |

**Prior locked rules this blueprint inherits and must not break:**
- **A goal may change what you LOOK AT or are RECOMMENDED. It may NEVER change what you're MEASURED AGAINST.** The denominator is always 90.
- **§00.A** — every recommended amount/dose/target traces to a Wallach BOOK. Youngevity supplies composition only.
- **The element system is SEALED** — FOUNDATIONAL 5 · INDIVIDUALLY DOSED 21 · PLANT DERIVED 34. Never decompose the PDM bottle.
- **Anti-fakery** — if a render needs data that does not exist, it goes in a pillar behind a schema. Never a stub in a view.

---

## §2 — The measured ground (facts, not assumptions)

Everything below was verified this session against the real data, not inferred.

**The corpus.** 1,358 sealed claims. **86 carry a numeric dose.** Those dose *essentials* (mg of calcium), not products. **Exactly ONE doses a product vehicle** — the PDM bottle, 1 fl oz/100 lb (`WAL-CLM-EPIGEN-000089`). So D1's "Wallach's dose" governs PDM and nothing else; for the other 214 products he doses the nutrients inside them.

**The products.** 215 products · 221 components. Component fields: `role · form · serving_size · servings_per_container · macros · nutrients · blends · other_ingredients · directions · source_label`.
- `serving_size` — **221/221 (100%)**. The *unit*: "1 softgel", "3 chewable tablets", "1 stick pack (16 g)".
- `directions` — **22/221 (10%)**. The *per-day count* and the *maximum*.
- `category` — **does not exist.** `form` exists (capsule 64 · powder 41 · liquid 37 · tablet 16 · softgel 7 · gummy 3 · tea · topical cream …) but form is not category: a powder can be either.
- Max components on one product: **3**. No bundle explodes into a wall of rows.
- Longest name: **69 chars** (`Rebound FX™ Citrus Punch Sports Energy Drink - 1 Case (12-12 oz cans)`). **71 of 215 (33%) exceed 30 chars.** Names front-load identity and back-load packaging (`- 60 tablets`, `[QTY: 60]`, `450 G Canister`) — so truncation from the END is safe.

**The proof that D1 is right.** Ultimate EFA Plus's label reads *"Take 1 softgel three times daily"* = 3/day. Wallach's own figure is **9 g/day**. The label under-delivers by 3× against Wallach **on the one product he explicitly doses**. A label serving is calibrated to RDA-era logic; a Wallach target is not. That gap, multiplied across a stack, IS the endless-recommendation problem in Luneth's #3.

**The label images — ⚠ CORRECTED 2026-07-15, same day.** This originally read *"the directions pass simply was not taken."* **That was FALSE, and it is what made D6 look feasible.** The 245 images in `temporary/labels/` are **supplement-facts panels ONLY**. The directions live on a part of the physical label that was never photographed.

**Proven, with a negative control** (a null from a blind instrument proves nothing, so the instrument was checked first):
- **Control:** `ult-efa-plus-90_suppfacts1-1020.jpg` reads *"DIRECTIONS: Take 1 softgel three times daily…"* — byte-matching the stored `directions`. The reading works.
- **Then the gap:** Beyond Osteo FX, ACV Gummy, and Beyond Hot Chocolate panels have **no DIRECTIONS block at all** — Supplement Facts + Other Ingredients only. 3 of 3 sampled.
- **No filename in the 245 suggests a directions / usage / back panel.** The 28 unreferenced files are alternate crops of the same supp-facts panels.
- **The 22 that DO carry directions are simply the ones where that text shared the crop** (EFA prints it above the Facts box).
- **The 11 MB `temporary/ygy-products-full/` scrape does not rescue it:** 6 real DIRECTIONS blocks, not 199. The "140 mentions of `direction`" are CSS icon classes (`.icon-directions::before`).

⚠ `temporary/` is gitignored and has been swept before: the sealed data survives a sweep, re-mineability does not.

**Measured accuracy of D7's default** (the 21 components where BOTH `serving_size` and real `directions` are known — so this is fact, not estimate): **1 serving/day is correct for 8/21 (38%)** · **under-counts 13/21 (62%) by 2–4×** · **over-counts 0/21 — NEVER**. Every miss is conservative, so the field understates the user and can never paint a tile green that is not. That asymmetry is why D7 is safe. The pattern behind the misses — a serving already spanning multiple units (`3 chewable tablets`, `9 capsules`) means once-a-day, a single-unit serving (`1 capsule`, `1 softgel`) usually means 2–3× a day — is **recorded but deliberately NOT turned into a rule**: inferring a dose from a 21-row pattern is precisely how the mineral tiers happened.

**The rail geometry** (measured headless at two viewports):

| | field | rail | tile columns | rail inner width |
|---|---|---|---|---|
| 1440×900 | 776px | 340px | **7** | 290px |
| 1920×1080 | 1256px | 340px | **11** | 290px |

The signed-off "11 columns" exists only at ~1920. **The rail's fixed width is a direct tax on the field.** The panel sticks at `top: 92`, so the item-list budget before it outgrows the viewport is **~594px at 1440×900** (~774px at 1920) — comfortable for 8–10 rows at ~60px each.

**The live app already has a rail.** `coverage.ts::renderRail()` renders `.regimen-rail` — 380px, styled, reading real state, already capping at 8 items with "+ N more". The demo's `.rail-panel` is a *different, simpler* 340px thing. Reconciling the two is part of the build.

**Everything on the Coverage rail is inert.** `coverage.ts::mount()` installs no click listener at all — MANAGE, ADD ITEM, *and* both goal chips are dead markup.

**Two routes mint a regimen item today**, both through §31: the Regimen tab's vault picker (`user_manual`) and the Scanner's adopt (`user_scanned`). No third exists. Notably **`addItem` accepts only exact matches against the 215-product vault** — there is no path to add a custom third-party product except by scanning.

**⚠ `coveredBy` is a misnomer.** `state/coverage.ts:628-630` pushes a product into `d.sources` after **any nonzero contribution** — no status check — and `:828` attaches `coveredBy` to **every tile** regardless of status. A product delivering 1% of a target sits in that tile's `coveredBy` while the tile renders as a gap. **The rail's whole job is the join `coveredBy` only appears to provide.** Any "this item covers these tiles" claim built on it fabricates a status.

**The zero state is 5, not 4.** H·C·N·O are forced covered by `FOUNDATIONAL_PRESENT_SLUGS` (cited "(Luneth)"); phosphorus classifies covered independently via `target.low === 0` — a zero target is met by taking none, and that traces to a sealed Wallach claim. The comment at `state/regimen.ts:96` still says 4/90 and is stale; the signed-off demo already says 5.

---

## §3 — The state model (the spine everything hangs from)

Today `state/regimen.ts` holds **one** regimen key and has no concept of a slot. The slot system does not exist and must be built.

```
slots:      [{ id, name, items[], overrides{}, createdAt, editedAt }]   ×1–4
activeSlot: id
trash:      [{ item, slotId, removedAt }]                              ring buffer, cap 20
goals:      [slug]                                                      (existing)
```

**Invariants — each becomes a gate (R7), not a promise:**
1. **There is always ≥1 slot.** The Default slot cannot be deleted while it is the only one. A guest with no name and no goals still has it.
2. **`activeSlot` always resolves** to an existing slot. Deleting the active slot promotes the lowest-numbered survivor.
3. **≤4 slots.** The 5th add is refused with a reason, never silently dropped.
4. **Every mutation routes through a §31 chokepoint** and emits `regimen:changed`. Extends the existing five; does not replace them.
5. **Nothing derived is stored.** Recommendations, coverage, and contribution are computed at read time.

**Scorched earth, scoped precisely:** `views/regimen.ts` and `views/scanner.ts` burn — they are ancient, they carry fabricated demo data flagged in their own files, and 68 of the Regimen view's 72 classes have no CSS in any stylesheet the shell links. **`state/regimen.ts` does NOT burn.** It is the five §31 chokepoints under a critical invariant (`regimen_state_mutation_routing`). It **extends** for slots. Burning it takes a gate down with it.

**Removal = trash, not hide.** Today removal is a soft-delete into an ever-growing `rgRemoved_v1` id-set. That mechanism becomes the trash bin honestly: remove → item moves to trash (recoverable) → the ring buffer caps at 20 → beyond 20 it purges. One concept, one store, no unbounded leak.

---

## §4 — The dose ladder (D1, D6)

A regimen item's dose is **servings per day**. The default is set by the first rung that resolves:

| Rung | Source | Coverage today | After the D6 mining pass |
|---|---|---|---|
| 1 | **Wallach's product dose** — a sealed claim dosing the vehicle | PDM only (1 fl oz/100 lb → 1.54 fl oz @ 154 lb) | unchanged |
| 2 | **Label directions** — "Take 1 softgel three times daily" | 22 of 221 (10%) | ~all |
| 3 | **ONE serving size/day** (D7) — rendered as *your setting*, never as a recommendation | 199 of 221 (90%) | **unchanged — this is the PRIMARY path, not a residue** |

**Rung 3 is not a recommendation and must never be styled as one.** It is a neutral starting point the user owns. Presenting an unsourced "1/day" as guidance is precisely how the mineral tiers stayed sealed and green for three weeks.

**Label maxima are a sourced safety ceiling.** BTT's directions read *"Not to exceed one stick pack a day."* That ceiling is what makes §5's dose-increase prompt safe to build. Where no maximum is stated, the prompt does not appear — silence is not permission.

**You cannot back-solve the serving count from Wallach's targets.** BTT carries ~47 nutrients at 47 different ratios; solving for calcium might demand 8 scoops and deliver 10× the selenium. The label's directed serving is the manufacturer's safety envelope and the only honest per-product number. This is why rung 2 is the workhorse and D6 matters.

**Gate: `dose_default_sourced`** — every default dose resolves to rung 1 (a sealed claim id), rung 2 (a `directions` field), or is explicitly flagged rung 3. An unflagged unsourced default is RED.

---

## §5 — The recommender (solves #3, #4)

**Recommendations are a pure function of `(goals, active slot, product DB)` — derived at read time, never stored.** This is not a performance choice; it is what makes Luneth's #4 structurally true rather than defended-against. Remove-an-item→reappears-in-recommendations is not a feature anyone codes. His `goal → add → remove goal → remove item` loop cannot exist, because there is no stored list to fall out of sync.

**The split that makes the list terminate:**

| Your state for an essential | The honest answer |
|---|---|
| **Zero** — nothing in your stack delivers it | **Recommend a product.** This is what the list is for. |
| **Short** — present but under Wallach's target | **Prompt a dose increase**, capped at the label's stated maximum. Never a purchase. |
| **At/over target** | Nothing. |

**The list terminates when no essential is at zero.** It then flips from "add this" to "you own enough products; these doses are short." That is the answer to *"more items keep appearing"*.

⚠ **CORRECTED 2026-07-15 (same day).** This read "Rung 1/2 defaults plus the zero/short split closes it." **The split closes it ALONE — the dose default is irrelevant to it.** Whether you take 1 serving or 3, BTT moves the same ~40 essentials off zero, so **the zero-set is identical regardless of the default** and the list terminates either way. The dose default buys only (a) day-one coverage accuracy and (b) a ceiling for the "take more" prompt. Neither is load-bearing on #3. This overstatement is what made D6 look like a blocker when it never was.

**With no goals set**, recommendations rank by breadth across all 90 — honest and still useful. A goal reorders the list; it never changes the field's denominator (the locked rule).

**Ranking** reuses the existing recommender score (`adequacy .6 · breadth .3 · value .1`, breadth saturating `n/(n+5)`), wholesale featured. ⚠ **Known live defect to fix in this work:** `rankSources` computes `adequacy = min(1, amount/targetLow)` with **no unit reconciliation** — boron (products in mcg vs a 9.2 **mg** target) saturates at 1.0 for all four candidates when the truth is 0.16–0.54; silver (mg vs a 400 **mcg** target) reads 0.0001 where truth is 0.10. Adequacy is the 0.6 keystone, so the ranking currently collapses to breadth+price.

**Gate: `recommendations_not_stored`** — no recommendation list in localStorage or any artifact. Derived only.

---

## §6 — The Coverage rail (D3, D4)

**Its job, unchanged:** the causation behind every lit tile. Luneth: *"I see no way to divorce this from the coverage page."*

**Header.** `CURRENT REGIMEN` / `DAILY PROTOCOL` / the **active slot's name, read-only** (D4) + item count. No switcher — switching lives in Regimen. The name is there so a user with four slots can never wonder which one they just changed.

**Row anatomy** (290px inner width, ~60px tall):
- Product name, truncated **from the end** (safe: names back-load packaging). 33% will exceed one line.
- An **Eden vs your-own** mark — supported today by `provenance` (`user_manual`/vault-matched = Eden; `user_scanned` = yours). A quiet distinction, per Luneth: *"not a strong one."*
- Dose: servings/day, editable inline (± or a small input). Real-time — the field relights on `regimen:changed`.
- **1-click remove** → trash.
- **No "this item covers N tiles" claim** until §9's `coveredBy` work lands. The field is six inches away and will contradict any fabricated count.

**Density.** Budget is ~594px at 1440×900 → ~8–10 rows before scroll. A realistic stack is 5–6 products; max components is 3, so nothing explodes. Beyond the budget the list scrolls **inside the panel** with the header and the button pinned — the panel itself must never outgrow the viewport, or the sticky silently stops sticking (it has no `max-height` or `overflow` today).

**Empty state.** Keep the signed-off copy — *"Nothing here yet. / ADD OR SCAN A PRODUCT TO LIGHT THE FIELD"*.

**Buttons — one, not two.**
- **`FULL REGIMEN →`** replaces both. Adding is 1-click from the recommendation cards; removing is 1-click per row; so MANAGE and ADD ITEM are both redundant as named.
- **A button labelled ADD ITEM that navigates to another tab is a broken promise** — the inverse of the PROFILE lesson, where the word was chosen *because* it indicates clickable and the click is wired. `FULL REGIMEN →` says what it does and doubles as the on-ramp to the slot system Luneth wanted ADD ITEM to introduce.
- **Discoverability** of 1-click add is solved by a `+` affordance on each recommendation card, not by a second button that lies.

**Recommendation cards** sit above the protocol in the same `<aside>` and get the `+`. ⚠ **Measured:** with 3 goals picked, `.recs` opens to 373px and pushes DAILY PROTOCOL to `top: 551`, bottom `895` — at 1440×900 the fold is 900. **What you take is currently the last thing on the first screen, underneath what you could buy.** Ordering is a demo-time call for Luneth.

**⚠ Open demo bug (Luneth-reported, confirmed from his screenshots):** a `covered` tile does not receive the goal ring. Phosphorus gets the small goal tick but no ring/gradient (single or multi) while Ca/Mg/B ring correctly. Demo-layer CSS conflict; not yet diagnosed.

---

## §7 — The Regimen tab (D3, D5)

Full rebuild to current standards (Coverage + knowledge-drawer presentation). Luneth: *"treat the regimen tab as pretty much full scorched earth."*

**The slot cards — 1 to 4.** The vision is a retro game-system boot with modern touches: inviting, fun, poked-at. Each card shows: slot **number**, **name** (Default is renameable, never deletable while it is the only one), **X/90 covered**, **item count**, **last edited**.

**No draft/saved indicator, no revert, no save button (D3).** The slot IS the live state. Coverage edits are already live and immediate; running an explicit-save model on top of a live-editing surface is precisely where the loops Luneth wants to avoid come from — "add from Coverage, then see an unsaved draft in Regimen of a change that already took effect" is a contradiction with no clean resolution. What he wanted from a save model, delivered without one:
- *"confirming if their changes stuck"* → a **saved-pulse** on the card, and the number moving.
- *"revert"* → the **trash bin** (below).
- *experimenting without committing* → **duplicate the slot**.

**The item list, below the cards**, grouped under **Supplements** for every Eden/YGY item, by D8's outside rule — **not** a pillar field, and nothing is invented in the data. A user's OWN scanned/manual items are the natural home of any future food & drink bucket, and `provenance` already tells the two apart. **Known imprecision, accepted on the record:** ~5 of 215 (the sports drinks) are really food. It affects no number, no dose and no tile — only which heading an item sits under — which is exactly why it is not worth a pillar change. Per item: add / remove / modify inline. This is the **main** management surface — the Coverage rail is the simplified mirror.

**The trash bin.** Recovers the last 20 removed items *and* deleted slots. This is the honest home of today's ever-growing removed-id set.

**Import / export.** Per-slot JSON. Luneth's ownership thesis: *"give power to the people to OWN their own regimen."*
- **Import creates a NEW slot; it never overwrites.** (Refused at 4 slots, with a reason.)
- **Imported JSON is untrusted input** — Zod at the boundary, bounded length, every string rendered via `textContent`. It arrives from outside the app by design, which makes it the only untrusted-data surface in an otherwise offline system.

---

## §8 — The Scanner (D2)

Full rebuild. The concept was good; the execution demanded too much human correction.

**The premise that had to be corrected first:** the 99%+ label accuracy Luneth remembers was **Claude — a large multimodal model — reading images**, not Tesseract.js. The app is offline-first with no network and no backend, forever. There is no Claude in that browser. Tesseract is classical OCR and will never approach it. Any design assuming otherwise is built on something that isn't there.

**The honest design is better than the one that assumed it:**

| Input | Spine | Why it works |
|---|---|---|
| **A YGY label** (215 known) | **Identify, don't transcribe.** Match a few tokens → one of 215 → composition comes from the sealed pillar, exact. | Needs almost no OCR accuracy. The suggestion-bubble correction UI disappears because there is nothing to correct. |
| **A third-party label** | **Paste or type** the panel — Luneth's own *"copy & paste into a box."* | Skips OCR entirely. Far more reliable than OCR on a curved bottle in bad light. |
| Either | **OCR assists, never load-bearing.** | It can pre-fill; it can never be the only path. |

**This is also the answer to "their own brands, ultimate freedom, it should JUST WORK"** — third-party nutrients register against the 90 through the paste path, with no Youngevity product involved.

**The feel** Luneth wants — computational, actively-deciphering, a real progress indicator — is honest here: Tesseract's WASM is ~22 MB and genuinely slow, so a progress bar reports real work rather than performing it.

**Recent scans** — a recoverable buffer so a new scan never silently destroys the last.

**Eden's wall is unchanged and structural:** the scanner can add any item and can never write a pillar. `eden/` is read at BUILD time and is not served to the page; the shipped app has no pillar to write to.

---

## §9 — Prerequisites (what must exist before the demo is honest)

| # | Work | Why it blocks | Needs |
|---|---|---|---|
| ~~P1~~ | ~~Mine `directions` + maxima from the 245 images~~ | **DROPPED — the data does not exist to mine (§2). Superseded by D7.** Nothing blocks on it. | — |
| ~~P2~~ | ~~Add `category` to all 215~~ | **DROPPED — reversed by D8.** An outside rule replaces it; no pillar change, nothing blocks. | — |
| **P3** | **Extend `state/regimen.ts` for slots** — schema, chokepoints, gate | §3. The slot system does not exist in state | — |
| ~~P4~~ | ~~Fix `coveredBy`~~ | ✓ **DONE 2026-07-15 — but SCOPED DOWN on a finding.** The rename landed (`contributesTo`). The "add a real covered-by join" half was **dropped**: `coveredBy` had exactly TWO occurrences in the whole repo — its declaration and its assignment — so **nothing read it**. Building a join no consumer wants, in a shape the rail has not yet asked for, is speculation. The trap is gone; the join gets derived when the rail defines what it needs. | — |
| ~~P5~~ | ~~Fix `rankSources` unit reconciliation~~ | ✓ **DONE 2026-07-15.** Scope was exactly 2 of 34 (boron mg-vs-mcg, silver mcg-vs-mg). All 19 boron candidates read adequacy **1.0000** — the 0.6 keystone was a CONSTANT, so ranking collapsed to breadth+price; now 0.054–0.544. Silver 0.0001 → 0.1000. The converter was promoted to `core/units.ts` because `boundaries` forbids state→state, and duplicating it would break R3. | — |

★ **BOTH PILLAR PASSES ARE GONE (2026-07-15, same day).** P1 died on data that does not exist; P2 was reversed as not worth the cost. **No sealed canonical is touched by this work at all**, and the three survivors are pure code — so nothing here needs a seal sign-off. The demo is three steps away, not five.

**Sequence check — UPDATED 2026-07-15.** P4 + P5 are **DONE**. **P3 (slots in state) is the only prerequisite left**, and even it does not block the DEMO — the demo is a standalone prototype in `temporary/` that shares no code with the live app. P3 blocks the LIVE build only.

★ **A gate this work earned but did not ship (R7 — labelled, not promised):** `recommender_target_units_reconcile`. `rankSources` now FAILS SAFE on an unreconcilable unit pair, but nothing proves the two artifacts stay reconcilable as they drift. The code is honest; the gate is a WISH.

---

## §10 — The interaction matrix (every variation)

The thing Luneth asked for: *"the coverage>regimen>scanner interactions and every variation in between."*

| Action | Writes | Coverage field | Coverage rail | Regimen | Recommendations |
|---|---|---|---|---|---|
| **Coverage: `+` a recommendation** | active slot, §31 | relights live | row appears | slot item count +1 | that product leaves the list; next-best appears |
| **Coverage: remove a row** | trash | dims live | row goes | count −1 | reappears **iff** Eden product ∧ still fits current goals — automatic, because the list is derived |
| **Coverage: change a dose** | slot override, §31 | re-measures live | row updates | reflects | may flip zero→short and shorten the list |
| **Regimen: add** | active slot, §31 | relights | row appears | — | that product leaves |
| **Regimen: remove** | trash | dims | row goes | — | reappears (same rule) |
| **Regimen: switch slot** | `activeSlot` | **re-measures against the new slot** | header name + rows swap | card highlights | re-derives for the new stack |
| **Regimen: duplicate slot** | new slot | unchanged | unchanged | card appears | unchanged |
| **Regimen: delete slot** | slot → trash | if it was active, re-measures against the promoted slot | swaps | card goes | re-derives |
| **Regimen: restore from trash** | active slot, §31 | relights | row appears | count +1 | that product leaves |
| **Regimen: import** | **new** slot | unchanged (import never auto-activates) | unchanged | card appears | unchanged |
| **Scanner: adopt** | active slot, §31 | relights | row appears | count +1 | leaves iff it matched a vault product |
| **Goal added/removed** | goals, §31 | **ring changes; denominator NEVER changes** | unchanged | unchanged | re-derives + reorders |
| **Guest, no name, no goals** | Default slot exists | 5/90, no rings | empty state | Default card | ranked by breadth across all 90 |

**Edge rules, decided:**
- **Add an item already in the slot** → raise its dose, do not create a duplicate row.
- **A scanned item whose name matches a vault product** → stays `user_scanned` (the user's own item), but coverage's existing auto-heal re-reads live composition for non-scanned name matches, so a pillar correction lands with no re-adding.
- **Remove an item already in the trash** → dedupe by item id; the newer removal wins.
- **Delete the last slot** → refused, with a reason. There is always a regimen.
- **Import at 4 slots** → refused, with a reason. Never a silent drop.

---

## §11 — Gates (R7 — codify, don't promise)

Every rule above that can be machine-checked ships its gate in the same patch as the thing it governs. Anything that cannot is labelled WISH here and rests on review — never sold as safe.

| Gate | Proves | Status |
|---|---|---|
| `regimen_state_mutation_routing` | all mutations route §31, one writer per key | **LIVE** — extend to slot chokepoints |
| `slot_invariants` | ≥1 slot · activeSlot resolves · ≤4 · deleting the active slot promotes | NEW |
| `recommendations_not_stored` | no derived list in LS or any artifact | NEW |
| `dose_default_sourced` | every default = a claim id, a `directions` field, or an explicit rung-3 flag | NEW |
| ~~`product_category_complete`~~ | ~~all 215 carry a category~~ — **DROPPED with P2/D8** (no field to gate) | — |
| ~~`product_directions_accounted`~~ | ~~directions OR a reason~~ — **DROPPED with P1/D7** (the data does not exist) | — |
| `render_probe_regimen` | the tab renders **and is styled** — a DOM probe would not have caught 68 unstyled classes | NEW |
| `render_probe_scanner` | paste → parse → register → adopt, end to end | NEW |
| `render_probe_coverage_add_remove` | `+` → field relights → remove → recommendation returns | NEW |
| `amounts_wallach_only` | numeric targets trace to sealed Wallach dose claims | **LIVE** — unchanged by this work |

**WISH (labelled, per R7):** that the category assignments in P2 are *correct* — a seal proves a pillar has not changed, never that it is right. That is what Luneth's review in P2 is for.

---

## §12 — Sequence

1. **This blueprint** — signed off by Luneth. ← *we are here*
2. ~~**P1** (mine directions) + **P2** (categories) — pillar passes.~~ **BOTH DROPPED 2026-07-15** — P1 is impossible (the directions are not on the images); P2 is reversed by D8. No pillar is touched.
3. **P4** + **P5** — the two live defects the rail and the recommender stand on.
4. **P3** — slots in state.
5. **The demo** — Coverage rail at 0 / few / many, the Regimen slot system, the Scanner paste path. Screenshot-verified; **his visual sign-off is the gate**.
6. **Live build** — surface by surface, one to 100% before the next.

⚠ **This paragraph is now MOOT** — it offered a demo-first path "if the pillar passes are wanted later." There are no pillar passes. The rung-3 default (now D7) is not a stopgap to be corrected later; it IS the design.

---

## §13 — Not decided / deliberately open

- **Card ordering in the aside** — recommendations currently sit above the protocol; measured, that puts "what you could buy" over "what you take" and pushes the protocol to the fold at 1440×900. Demo-time call.
- **The `covered`-tile ring bug** — real, confirmed from Luneth's screenshots, not yet diagnosed.
- **The rail's width tax** — 340px fixed costs the field 4 columns at laptop width (7 vs 11). Not raised as a defect; the grid is signed off. Noted because the rail is what causes it.
- **Legal / copyright / disclaimer / a11y / i18n** — deferred to one end pass, per standing rule. The "sell their regimens" thesis lives there, not here.
