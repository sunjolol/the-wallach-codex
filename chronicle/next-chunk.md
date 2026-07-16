# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-15 ~22:30 CDT — cobalt SHIPPED + its 3 follow-ups CLOSED)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES ("older loses").
> Board **72/72** (P3's `slot_invariants` landed 2026-07-16; was 69 — `mirrors_resolve` + `pdm_group_not_named_rare_earths` landed
> 2026-07-15). Corpus sealed at **kv=338**. Read the next line before you repeat that number.
>
> **THE NUMBER IS NOT WHAT YOU THINK IT IS.** Only the **external** gates
> check anything outside our own files. The rest prove our files agree with each other. **A green
> board means NOTHING DRIFTED. It does not mean anything is RIGHT.** Do not report the total to
> Luneth as a statement about Wallach — that is exactly how this project spent three weeks
> confidently wrong, and Claude did it again at the top of the 2026-07-15 session.

## ★★★★ START HERE — the element system is SEALED. Do not re-open it.

**Luneth's words, 2026-07-15: "close out the essentials doctrine cleanly and FINALLY — NEVER to be
touched again, I want no more mishaps with the element system once we seal it for good."**

The 60 minerals are now split by **what Wallach tells you to DO**, never by importance:

| | group | n | rule |
|---|---|---|---|
| A | **FOUNDATIONAL** | 5 | H · C · N · O · **P** — nothing to take |
| B | **INDIVIDUALLY DOSED** | 21 | carries a sealed Wallach dose claim |
| C | **PLANT DERIVED** | 34 | no individual amount; ONE shared verdict |

Ordering: FOUNDATIONAL atomic (H C N O P); B + C **A→Z by symbol** (Luneth's UX call — the tile
shows the symbol big). Names are **his**, chosen 2026-07-15 after he rejected three proposals.

## ★★★★ THE BLUEPRINT IS SIGNED OFF — `chronicle/coverage-regimen-scanner-blueprint.md`

**Luneth, 2026-07-15: "Signed off. … Good to go."** The rail question is CLOSED — it turned out to be
one surface of a three-surface problem, and he authored the whole concept (Coverage ↔ Regimen ↔
Scanner) rather than the rail alone. **READ THAT BLUEPRINT — it is the authority for all three
surfaces. Do not re-derive any of it from this file or from a demo.**

**His SIX locked calls (blueprint §1 — never re-litigate):**

| | Question | His call |
|---|---|---|
| D1 | Default dose source | **Wallach's dose where a sealed claim doses the PRODUCT; label directions otherwise.** NOT the RDA. |
| D2 | Scanner spine | **Identify-not-transcribe for the 215 known; paste-or-type for third-party. OCR assists, never load-bearing.** |
| D3 | Save model | **Autosave everywhere.** The slot IS live state. No draft, no save button. |
| D4 | Slot identity on Coverage | **Rail shows the active slot's NAME, read-only. Switching lives in Regimen.** |
| D5 | Food & drink vs supplements | **Add a real `category` field to the Products pillar.** Claude proposes; Luneth reviews + seals. |
| D6 | The 199 undirected components | **Mine the 245 label images FIRST.** Sourced defaults before the dose system ships. |

Also settled: **MANAGE and ADD ITEM both DIE**, replaced by one `FULL REGIMEN →`. Luneth: *"this is
fine, and I agree this is better."* An ADD ITEM that navigates instead of adding is the PROFILE
lesson inverted — a label is a promise.

## ★★★★ THE NEXT ORDER — SHIP THE COVERAGE SURFACE LIVE (Luneth, 2026-07-16, session close)

**His words:** *"Yes, let's ship this live (and do so carefully) — this demo feels a LOT better
coded than previous demos but we still shouldn't blindly copy code since some of it will need to
be adapted to work on the live surface (such as increasing dosage changing counts) — so let's make
sure the live surface works/looks exactly like the demo but without carrying over bad code, doing
everything properly with good engineering/coding standards (translating a demo into real, solid
code)."*

**THE SOURCE OF TRUTH IS `temporary/coverage-E-rail.html`** (GITIGNORED, protected in
`temporary/README.md`; screenshots in `temporary/shots-E-fixed/`). It is SIGNED OFF. Demo D is the
untouched fallback. **The spec is blueprint §6**; the demo is what it looks like.

### ★ THE RULE FOR THIS BUILD — re-create, do not transplant ([[demo-vision-not-letter]])
The demo is the DESIGN TRUTH, not a code donor. Its state is a plain array; live state is the P3
slot document. Re-create the surface **pristine on real data + real state**, and PROVE it — do not
lift demo JS. What must be ADAPTED rather than copied:
- **The dose stepper is INERT in the demo and MUST WORK LIVE — his named example** ("increasing
  dosage changing counts"). The prototype has no per-serving amounts, so its stepper only moves a
  number; he declined a note because *"we already know it will work when coded live"*. LIVE: dose =
  servings/day must scale the delivered amounts, recompute coverage, and MOVE THE COUNTS. It routes
  through `saveRgOverride` → `writeSlotDoc` → `regimen:changed` → recompute (P3 shipped that spine).
  ⚠ `readScale` (`state/coverage.ts:~390`) already reads `overrides[String(item.id)].scaling_factor`
  — that is the hook; the demo's `--goalCount`-style shortcuts are NOT.
- **The demo's status model is BINARY** (a product "supplies" a tile → covered). The live classifier
  is amount-based and can land on `partial`. Do NOT port the binary rule. **Never invent a
  dose→coverage curve** — the live math already exists.
- **The live app ALREADY HAS a rail**: `coverage.ts::renderRail()` → `.regimen-rail`, 380px, styled
  (`workspace-coverage.css:992-1126`), caps at 8 + "+N more", and is **completely inert**
  (`mount()` installs NO click listener). The demo's `.rail-panel` is a DIFFERENT, simpler thing.
  **Reconciling the two is the build**, not a copy-paste.
- **Every mutation routes through the P3 §31 chokepoints** (`saveRgManual` / `saveRgOverride` /
  `saveRgRemoved` → the private `writeSlotDoc` → `rgSlots_v1`). `regimen_state_mutation_routing` +
  `slot_invariants` are CRITICAL gates and will catch a stray write.
- **D4:** the rail shows the ACTIVE SLOT'S NAME, read-only. No switcher — switching lives in Regimen.
- **Escape by default:** the demo interpolates product names into `innerHTML`. Live, names go through
  `textContent` (§00.B #5). Do not carry the demo's string-concat rendering across.

### ★ WHAT THE DEMO SETTLED — build these, do not re-litigate
Recs FIRST in the aside · `FULL REGIMEN →` is ONE primary-orange button (MANAGE + ADD ITEM are DEAD)
· rows: name truncated FROM THE END, quiet `EDEN`/`YOURS` mark, inline dose stepper, 1-click remove
· the signed-off empty-state copy · list scrolls INSIDE the panel, head + button pinned (8–10 rows at
1440×900) · a `+` on each rec card = 1-click add; adding removes it from the list · the rec explainer
is a TWO-STAGE HOVER (card → dotted underline; numbers → the text), no standing paragraph, copy =
*"your goal nutrients per $10 spent"* · **covered tiles: NO ring, NO glow, NO slit** — goal membership
is a hover-only discoverable · the ring means **"a goal nutrient you have NOT covered"**.
★ Governing rule: [[field-shows-gaps-not-wins]] — **the field is a MAP OF GAPS, not a scoreboard.**

### ~~★★★★ EXCLUDE KIDS' PRODUCTS~~ ✓ **SHIPPED + GATED 2026-07-16 (`ca0b9a52`, board 73/73)**

**Do not re-open the mechanism, and DO NOT go hunting for ~16 more products.** Full record:
memory [[no-kids-products-recommended]] (rewritten) + the build-log line + the Creator's Log entry.

- **THE LIST IS 4, NOT ~20** — `kids-toddy` · `kidsprinklz` · `cheri-mins` · `strawberry-kiwi-mins`,
  in `dashboard/assets/data/kids-exclusion.json` (hand-authored curation, MANIFEST `accounted`;
  no pillar touched, matching D8). **"Toddy" is a DRINK NAME, not "toddler"** — `Ultra Body Toddy`
  and `Cal Toddy` are **ADULT** and are NOT excluded. The old "~20" estimate and the naming of
  Ultra Body Toddy both rested on that misreading. ★ **LUNETH CORRECTED HIMSELF** when shown the
  label: *"I misunderstood what 'toddy' means, I figured it means toddler - that is wrong, it
  apparently is a type of drink, that is my mistake. Good catch. I only want the explicitly kids
  products removed."* **This entry's OLD premise (UBT = kids) is DEAD.**
- **KEPT, NOT EXCLUDED** (examined — do not re-audit): `bone-building-formula` ("teens and young
  adult women") · `sta-clear` ("teenagers and adults") · `ultimate-multi-efa` ("adults and
  children"). Each names adults outright; his rule is "only the explicitly kids products".
- **★★ THE EVIDENCE IS NOT ON THE LABELS AND NOT IN THE NAMES** — this refuted Claude's own
  premise mid-chunk, via an adversarial verifier. All 217 label images were READ (Claude
  multimodal, 0 unreadable) and **only `kids-toddy`'s panel is identifiable** (it doses BY AGE
  BAND — two %DV columns "Ages 1-3"/"Ages ≥4" + a 1,000-calorie child basis; the only such panel).
  **The other 3 exist only in Youngevity's MARKETING COPY** — `temporary/phase-f-tools/products_manifest.json`
  field `description` (432 entries; **all 215 products matched by SKU**, so no blind spot). It is
  **gitignored** → `git grep` is blind to it ([[null-result-needs-a-scope-check]]).
  `cheri-mins` + `strawberry-kiwi-mins` **ARE the adult Plant Derived Minerals formula** —
  chemically identical, adult-looking labels, **kid-MARKETED not kid-formulated**, with no kid
  token in either name. The pillar itself encodes NOTHING (no audience/category/description;
  `directions` on 22/221, and the only 2 mentioning children are BTT + CM Cream, both ADULT).
- **A name regex is REJECTED on measurement:** it finds 5, of which **3 are false**
  (`Kidney & Bladder Support` → "**Kid**ney"; `FlexeoPlus` → "grand**kid**s", a product FOR
  grandparents; the Toddys), and **misses 2 real ones**.
- **★★ THE ASYMMETRY IS THE REQUIREMENT — do not "fix" it into consistency.**
  `rankSources` **FILTERS** (the one function every rec surface funnels through — Coverage recs ·
  condition pages · `entity-page.ts:377`'s BEST SOURCES). `essentialSlugsByProduct` **DELIBERATELY
  DOES NOT** (the Products-**tab** database path). Both read the SAME artifact → **read-time**
  filter, never derive-time: stripping kids from `product-recommender-data.json` would erase them
  from the Products tab too ([[derive-elegance-is-not-user-truth]]).
- **GATED:** `kids_products_not_recommended` (critical) + `tools/test_kids_products_not_recommended.py`
  (12 cases). Proves both halves, that every id resolves in the sealed pillar (a typo silently
  un-excludes → RED), and **anti-vacuity**. The test pins **the over-fix** (filtering the Products
  tab) as RED on purpose. **Proof it fires:** calcium raw 53 → filtered 51 and `render_probe_entity`
  reports `srcCount:51` live; `render_probe_knowledge` reports products `count:215` — DB untouched.
  41 rows removed across 25 essentials.
- **HONEST LIMIT (R7):** the gate anchors the PLUMBING, never the MEMBERSHIP. It cannot prove a 5th
  kids product isn't unlisted — that rests on the two sweeps + Luneth's review.
- ⚠ **STILL PENDING: Luneth has not yet signed off on the LIST itself** (the mechanism + the
  approach he approved explicitly). If he adds/removes one, it is a one-line edit to
  `kids-exclusion.json` — the gate re-resolves it automatically.

### ★★★★ THE NEXT ORDER — SHIP THE COVERAGE SURFACE LIVE (unchanged; NOW UNBLOCKED)
The kids work above was the one thing gating it — the rail's recommendation cards inherit the
filtered ranker for free. Everything in the section below still stands. ★ **Facts measured
2026-07-16 that the live build must not re-derive:**
- **`.tile__ring` DOES NOT EXIST LIVE.** It is demo-only. The live `renderTile`
  (`views/coverage.ts:79-108`) emits **no goal-membership channel at all**; `.tile[data-goals]`
  appears once, inside a CSS *comment* (`workspace-coverage.css:774`). The next-chunk line saying
  "the ring got its own element" describes **the demo**, not the app.
- **`coveredBy` is now `contributesTo`** (renamed by P4, 2026-07-15). The old line numbers
  (628-630 / 828) are STALE; the substance still holds.
- **`renderRail` still emits MANAGE + ADD ITEM** (`views/coverage.ts:302-303`) — both must die,
  replaced by ONE `FULL REGIMEN →`. It reads `loadEffectiveRegimen()` directly, caps at 8
  (`RAIL_DISPLAY_CAP`), and its `.regimen-rail__overflow` div has **NO CSS rule anywhere**.
  The header count correctly reads the FULL length, not the slice.
- **Zero click listeners exist on the whole surface** — `mount()` installs only two event-bus
  subscriptions. The dose stepper will be the FIRST interactive control on Coverage.
- **`h3.regimen-rail__slot-name` is the static literal "DAILY PROTOCOL"**, not read from state —
  D4 wants the ACTIVE SLOT'S NAME there, read-only.
- **There is no `.pending` tile class** — pending IS the default chassis. (`.legend__sw.pending`
  exists and hand-replicates the look; the tile never carries it.)

### ★★★★ ~~NEW REQUIREMENT~~ — the original note, kept for the record
**His words (2026-07-16):** *"Let's make sure no kids products ever get recommended as items —
'Kid's Toddy', 'Ultra Body Toddy' and stuff like that (probably around 20 products in total) — they
are good but no adult is ever going to take those and they're better as a database item to be
discovered in the products tab of the knowledge drawer, so let's exclude them as popping up on the
coverage page (or anywhere for that matter including under conditions and element detail view —
besides the products database) — reason being is those formulas are for kids, and kids will never
use our app."*

- **SCOPE:** excluded from EVERY recommendation/suggestion surface — Coverage recommendations,
  condition pages, element/entity detail views. **The ONLY place they may appear is the products
  database (the Knowledge drawer's Products tab)**, where they stay discoverable.
- **⚠ THIS IS LIVE TODAY, NOT HYPOTHETICAL.** In demo E with 3 goals, **`Kid's Toddy™` ranked #1**
  (7.1 / $10 — it wins on value precisely because it is cheap) and `Ultra Body Toddy™` also surfaced
  in the top 4. The real recommender uses the same score, so it will do the same thing. He has been
  holding this note *because he kept seeing them*.
- **★ THE OPEN DECISION (his call, ASK — do not assume):** there is NO `category` field on the
  Products pillar — **D5 proposed one and he REVERSED it (D8)** as *"way too much work for way too
  little gain"*. So how are the ~20 identified?
  (a) a **hand-authored curation list** (a new `assets/data/*.json`, MANIFEST-registered with a
      reason, like the other 11 hand-authored artifacts) — cheap, no pillar re-seal, matches the D8
      precedent; or
  (b) an **`audience`/`kids` field on the Products pillar** — needs his review + SEAL SIGN-OFF (§00.A).
  ⚠ Do NOT infer kids-ness from the NAME with a regex ("Kid's", "Toddy") — `Ultra Body Toddy` and
  `Beyond Tangy Tangerine` are ADULT products that share the "Toddy"/family naming. A name heuristic
  would silently exclude adult products and silently miss kids ones. **The list must be explicit and
  reviewed by him.**
- **★ IT MUST BE GATED (R7):** a gate proving no excluded product can reach a recommendation surface,
  + a negative test. An exclusion that rests on one `filter()` call is one refactor from regressing.
- **★ AND IT MUST NOT LIE:** the exclusion is a CURATION decision, not a Wallach claim. It changes
  what we SHOW, never a target or a composition. Label it as ours.

### ★ SHIPPED THIS SESSION (all pushed; board 72/72)
`efc02964` P3 slots in state · `fecfcd92` the rail demo + the covered-ring bug (a pseudo-element
collision, diagnosed + fixed) + the orange slit removed live · `208ba9f5` the goal-slit experiment
tried + reverted, which produced [[field-shows-gaps-not-wins]].

### ★★★ NEXT ORDER (updated 2026-07-15 ~21:40 CDT — P1/P2 DEAD, P3/P4/P5 DONE, ✓ COBALT SHIPPED)

**Done this session:** blueprint signed off · D6→D7 · D5→D8 · cracks 1/2/3 · P4 · P5 · **COBALT (shipped + signed off, kv=337, `823b8823`)**.
**~~P1~~ ~~P2~~ DROPPED** (see the D7/D8 rows above — no pillar is touched by any of this work).

1. ~~**COBALT → shares B12's verdict.**~~ ✓ **SHIPPED + SIGNED OFF 2026-07-15 (`823b8823`, kv=337).**
   The fabricated 400 mcg elemental target is GONE; cobalt is `target.kind: "mirrors"` →
   vitamin-b12 and posts no number. Gated by **`mirrors_resolve`** (critical, board now **70**)
   + `tools/test_mirrors_resolve.py` (8 cases) + `tools/render_probe_mirror.js` (5 worlds).
   Full record: `chronicle/essential-special-cases.md` §5 +
   `chronicle/contradictions/2026-07-15-cobalt-elemental-vs-b12.md`.
   **Do not re-open it.** Three things the next session must NOT re-derive:
   - **The old handoff's premise was WRONG** ("cobalt has no independent delivery; elemental
     cobalt is unusable by humans"). The book refutes it in the same chapter —
     `immortality.txt:5946-5947` *"Cobalt is **also** required as a necessary cofactor for the
     production of the thyroid hormone thyroxin"* (3 books) · `:5906-5908` metallic cobalt
     absorbed *"in humans"* · `:5915-5917` *"Plant derived cobalt is very bioavailable"* ·
     `:5972-5975` soil cobalt *"prevents and cures"* deficiency in *"animals and people"*.
     **The source is TWO-SIDED.** Luneth ruled on it; that ruling is the authority, not a
     re-reading of one half.
   - **`trace_pdm` IS NOT THE ANSWER** even though the canon used to say so and it needs zero
     code. `coverage.ts:720` returns `pdmStatus` with **no ceiling**, so the plant-derived
     bottle alone (600 mg × 1.54 = 924 mg = 100%) renders **COBALT COVERED while B12 reads
     GAP**. `render_probe_mirror.js` **world 4** exists solely to keep that dead.
   - ~~the keystone sentence is unmined~~ ✓ **MINED + SEALED 2026-07-15 (kv=338).**
     `WAL-CLM-IMMORT-000233` (definition · cobalt + vitamin-b12 · no dose ·
     `immortality.txt` @229062, p128/screenshot 77) now carries *"The essentiality of cobalt is
     unusual in that the requirement is for a cobalt complex known as cyanocobalamine or vitamin
     B12. A pure cobalt requirement is only found in some bacteria and algae…"* as a **sealed
     verbatim**. The ruling traces to Wallach's words, not our summary. Verified before writing:
     byte-present · unique in the book (so the offset cannot be ambiguous) · offset lands exactly.
2. ~~**P3 — slots in state.**~~ ✓ **DONE + PUSHED 2026-07-16 (`efc02964`).** ONE atomic slot document (`rgSlots_v1` = {slots×1–4, activeSlot, trash×≤20}) written by ONE private `writeSlotDoc`; lazy non-destructive migration from the 4 legacy keys (hidden items recovered INTO trash); the 5 legacy chokepoints kept by name + re-pointed to the active slot; 6 slot ops (add/duplicate/delete/rename/setActive/restoreFromTrash), each `{ok}|{ok:false,reason}`; `importSlot` deferred to §7. GATES: `regimen_state_mutation_routing` re-codified (brace-aware, so the private writer can't be swallowed) + NEW `slot_invariants` (static) + NEW `render_probe_slots.js` (runtime) + 2 negative tests (16 + 10 cases). Board 72/72. **THE DEMO is now the next order — nothing blocks it; your visual sign-off is the gate.** ⚠ 2 pre-existing probe fails (`render_probe_scanner`, `render_probe_journey`) proven identical at HEAD via git stash — legacy-host DOM checks, NOT P3.
3. ~~**THE DEMO**~~ ✓ **BUILT + SIGNED OFF 2026-07-16 (`fecfcd92`).** Luneth: *"Looks great,
   this works pretty much exactly as I intended."* → **`temporary/coverage-E-rail.html`**
   (GITIGNORED — demo D untouched as the locked fallback; both registered in
   `temporary/README.md`; screenshots in `temporary/shots-E-fixed/`). Rail at 0/few/many ·
   inline dose · 1-click add (the `+` on a rec card) / remove · ONE `FULL REGIMEN →` ·
   the field relights live (3 products: 5→29 covered; 11: →36) · denominator never moves.
   **HIS DECISIONS, all settled — do not re-litigate:** aside order = **RECS FIRST** (he saw
   both; the toggle stays in the demo) · `FULL REGIMEN →` stays **primary orange** (he
   overruled my "reads inverted for a navigation action") · the rec explainer is a
   **two-stage hover** (card → dotted underline; numbers → the text), the standing paragraph
   is deleted · dose stepper is **deliberately inert** in the demo (no per-serving amounts in
   the prototype data; he declined a note — do NOT invent a dose→coverage curve to make it
   look alive) · the **orange slit** on covered tiles is deleted, in the LIVE stylesheet ·
   **covered tiles take NO goal ring** ("too busy, doesn't mesh with the green") — they still
   highlight on goal hover via the opacity channel.
   ★ **THE NEXT ORDER IS THE LIVE BUILD.** He asked to start it 2026-07-16 ("which will happen
   today, Lord willing"). He also has **one more visual experiment** he expects to revert —
   build it behind a one-class/one-var toggle ([[loose-visual-instruction-easy-pivot]]).
4. **Refresh persistence** (the name) — small live work, §31 `saveUserProfile`.
**✓ The two cracks found during cobalt are FIXED (2026-07-15, same session):**
- ~~`views_state_no_inline_data` mis-scoped~~ ✓ **TIGHTENED (R9).** It counted a record's FIELDS
  like a data blob's elements, so the tile struct at exactly 10 fields tripped a critical RED.
  Now: array literals always count (the 2026-06-21 91-tile-spec incident case — unchanged, the
  load-bearing half); object literals count only when ≥ half their top-level values are literal
  constants. Proven by `tools/test_views_state_no_inline_data.py` (8 cases): every DATA case the
  rule was written for still fires; only shape cases stopped. **Not a loosening — the test IS the
  proof.** Honest limit in its docstring: a half-computed blob would slip.
- ~~The PDM copy contradicted the doctrine~~ ✓ **FIXED + GATED.** `view-copy.json` said "Rare
  Earth Minerals" / "of the rare-earth group goal" while `pdm_coverage_derive.py` said *do not
  rename it back* — the code comment governed the code, **nothing governed the label**, so the
  one surface a user sees carried the invention for the whole campaign. Now "Plant Derived" /
  "of the plant-derived group goal", and **NEW gate `pdm_group_not_named_rare_earths`** (warning)
  scans the group's NAME fields + layout labels. Negative control: the exact pre-fix copy REDs.
  Scoped to LABELS only — passing prose mentions are legitimate (he really does tag 15 of the 60).
- ⚠ **Still stale, NOT fixed:** `pdm_coverage_derive.py:19`'s prose reads "FOUNDATIONAL 4 /
  INDIVIDUALLY DOSED 22 / PLANT DERIVED 34". It was already wrong before cobalt (phosphorus made
  it 5/21/34) and is now **5 / 20 / 34 + 1 mirror**. Prose only; no gate reads it. Fix it in the
  session that next touches that file.
- ⚠ **`post_write_verify` false-positives on your own echo lines.** A helper script printing
  `OK <file> — <msg>` is parsed as a safe_write OK line, and the hook then hunts a bare `<file>`
  at the repo root and reports "vanished after write". Bit once this session on `invariants.py`
  (which is `tools/invariants.py` and was intact: 330 KB, `safe_write check` OK, `ast.parse`
  clean). **Do not use `OK <name> — …` as a print prefix in staging scripts.**
  → [[post-write-verify-ok-line-collision]]
### ★★★★ NEW: `chronicle/essential-special-cases.md` — THE CLARITY-PASS REGISTRY
**Luneth, 2026-07-15: "any special cases NEED to be visible and easily understood by the user
when they click into an element view — doesn't need to be done now but these 'special cases'
need to be logged and remembered so we can apply them in a later 'clarity pass'."**
That file is the DENOMINATOR for that pass — 8 registered behaviours (phosphorus' zero target ·
H·C·N·O fiat · omega-9's zero claims · the EFA shared budget · cobalt · the PDM 34 · silver+tin ·
the 53 honest gaps), each with its source and what the user must be told. **Only 38 of 91
essentials behave "normally"; the page explains NONE of the rest today.** ★ Rule 1 of that file:
**a new special case lands there in the SAME CHUNK that creates it** — one that exists in code
but not in the list is invisible to the pass by construction. `fatty-acid-clarity-data.json` is
the existing prototype for the content store.

### ~~OLD NEXT ORDER — superseded by the list above~~
- **P1 — mine `directions` + maxima from the 245 images in `temporary/labels/`** → Products pillar →
  re-seal. **NEEDS LUNETH'S SEAL SIGN-OFF.** Why it blocks: `directions` (the per-day count) exists
  for **22 of 221 components (10%)**; `serving_size` is 221/221 but that is only the UNIT. Without
  P1 the dose ladder falls to an unsourced "1/day" for 90% of components.
- **P2 — add `category` to all 215** → pillar → re-seal. **NEEDS HIS REVIEW + SEAL.** `form` exists
  (capsule 64 · powder 41 · liquid 37 · tablet 16 · softgel 7 …) but **form is NOT category** — a
  powder can be either.
- Then **P4** (`coveredBy` → `contributesTo` + a real join), **P5** (`rankSources` unit
  reconciliation), **P3** (slots in state), then the DEMO (his visual sign-off gates it).
- ★ He was OFFERED the demo-first path (build on the honest rung-3 gap, pillars after) and did NOT
  take it. Do not assume it — ask before resequencing.

### ★★ THE MEASURED FACTS THE BLUEPRINT RESTS ON (do not re-measure, do not assume)
- **1,358 claims · 86 carry a numeric dose · EXACTLY ONE doses a product vehicle** (PDM, 1 fl oz/100
  lb, `WAL-CLM-EPIGEN-000089`). So D1's "Wallach's dose" governs **PDM and nothing else** — for the
  other 214 he doses the nutrients INSIDE them, never the bottle.
- **The proof D1 is right:** Ultimate EFA Plus's label says *"Take 1 softgel three times daily"* =
  3/day. Wallach's figure is **9 g/day**. The label under-delivers **3×** against him on the one
  product he explicitly doses. A label serving is RDA-era calibrated; a Wallach target is not. THAT
  GAP IS why the recommendation list never terminated (Luneth's #3).
- **You cannot back-solve servings from his targets.** BTT = ~47 nutrients at 47 ratios; solving for
  calcium wants 8 scoops and delivers 10× the selenium. The label's serving is the manufacturer's
  SAFETY ENVELOPE and the only honest per-product number. This is why rung 2 is the workhorse.
- **⚠ `coveredBy` IS A MISNOMER — it means "contributed a nonzero amount to".** `coverage.ts:628-630`
  pushes a source after ANY nonzero contribution (no status check); `:828` attaches it to EVERY tile
  regardless of status. A product delivering 1% sits in a GAP tile's `coveredBy`. **The rail's whole
  job is the join this field only appears to provide.** Three independent audit agents died on it;
  verified firsthand. → P4.
- **The zero state is 5, not 4.** H·C·N·O are fiat (`FOUNDATIONAL_PRESENT_SLUGS`, cited "(Luneth)");
  phosphorus classifies covered independently via `target.low === 0` and traces to a sealed claim.
  **`state/regimen.ts:96` still says "4/90" and is STALE** — the signed-off demo already says 5.
- **Rail geometry, measured:** column is fixed 340px (demo) / 380px (live), **290px usable inner
  width**; list budget ~594px at 1440×900 (~774 at 1920) → 8–10 rows. Field gets **7 tile columns at
  1440, 11 at 1920** — the signed-off "11 columns" exists only at ~1920; the rail's fixed width is
  the tax. Products: max **3** components (nothing explodes), longest name **69 chars**, **33% exceed
  30 chars**; names front-load identity + back-load packaging → truncate from the END.
- **The live app ALREADY HAS a rail** — `coverage.ts::renderRail()` → `.regimen-rail`, styled
  (`workspace-coverage.css:992-1126`), reads real state, caps at 8 + "+N more". The demo's
  `.rail-panel` is a DIFFERENT, simpler thing. Reconciling the two is part of the build.
- **Everything on the Coverage rail is inert** — `coverage.ts::mount()` installs NO click listener at
  all. MANAGE, ADD ITEM **and both goal chips** are dead markup.
- **Only TWO routes mint a regimen item**, both §31: Regimen's vault picker (`user_manual`) and
  Scanner adopt (`user_scanned`). **`addItem` accepts ONLY exact matches against the 215-product
  vault** — so there is NO path to add a custom third-party product except scanning. That blocks
  Luneth's "their own brands / ultimate freedom" and is an actionable gap in the blueprint.

### ★★ SCORCHED EARTH — scoped precisely (Luneth called it; the boundary is Claude's)
`views/regimen.ts` + `views/scanner.ts` **BURN**. **`state/regimen.ts` does NOT** — it is the five
§31 chokepoints under a CRITICAL invariant (`regimen_state_mutation_routing`); it **extends** for
slots. Burning it takes a gate down with it.
- **The Regimen tab has NO STYLESHEET and never had one** — 68 of its 72 classes have no rule in ANY
  of the 8 sheets the shell links; its CSS is still trapped in the unextracted
  `dashboard/components/workspace-regimen-v3-PROPOSAL.html`. It renders as browser-default HTML.
  **No render probe drives it**, which is why nobody caught it. This is the exact "unstyled drawer
  drift" `visual-verification.md` was written about. → blueprint gate `render_probe_regimen`.
- It is also mostly FABRICATED demo data, flagged by a LOUD NOTE in its own file: 5 fake cartridges,
  4 fake recommendations, 2 fake wishlist items. SAVE/DUPLICATE/IMPORT/EXPORT/VAULT are silent no-ops
  on `window.*` globals that do not exist. **The slot system does not exist in state at all.**
- **The Command Palette does not exist** — `views/palette.mount` throws; ⌘K is bound to nothing.

### ★ THE SCANNER PREMISE THAT HAD TO BE CORRECTED (do not let it come back)
Luneth: *"you recently read the labels of all YGY products with a 99%+ accuracy rate, so it tells me
it's probably possible to make the scanner work much better."* **That was CLAUDE — a large
multimodal model — not Tesseract.js.** The app is offline-first, no network, no backend, forever;
there is no Claude in that browser. Tesseract is classical OCR and will never approach it. D2 exists
because of this. Any future design assuming otherwise is built on something that is not there.

### ★ STILL OPEN (blueprint §13)
- ~~**The `covered`-tile ring bug**~~ ✓ **DIAGNOSED + FIXED 2026-07-16 (`fecfcd92`).**
  ⚠ **THIS ENTRY'S OWN PREMISE WAS WRONG — do not carry it forward.** It said "demo-layer CSS
  conflict on `.covered`". It was a **PSEUDO-ELEMENT COLLISION**: `.tile.covered::after` is the
  status TICK (a 14x3 accent slit, `workspace-coverage.css:765`) and the goal ring was ALSO
  `::after`. Both selectors are **(0,2,1) — identical specificity** — so the cascade MERGED them
  per-property instead of one winning: the ring won `background`+`inset`, the tick won
  `width:14px`+`height:3px`, and an absolutely-positioned box given BOTH `inset` and an explicit
  size is over-constrained → it resolved to THE TICK'S SIZE. The ring was painting the correct
  gradient at **14x5px** the whole time. MEASURED: PHOSPHORUS (covered+2 goals) = 14x5 with the
  goal gradient; COBALT (gap+1 goal) = 105x85, correct.
  ★ **AND THE SECOND HALF OF THE OLD CLAIM WAS ALSO FALSE:** "while Ca/Mg/B ring correctly" —
  they were never fixed, they simply were not COVERED yet. The bug fired on covered ∧ goal-mapped,
  and phosphorus was the only such tile at the time. The rail flipped 21 tiles to covered at once
  and broke all 21 rings together, which is what finally made it diagnosable.
  FIX: the ring got its own element (`.tile__ring`) — the design's own rule, "goals own the EDGE,
  status owns the INTERIOR, two channels, no collision". **Then Luneth removed the ring from
  covered tiles entirely anyway** (too busy against the green), so the ring now marks only
  goal nutrients you have NOT covered — a to-do marker. The glow went with it, which ALSO
  restored the covered plate's own rim+top-light that the `!important` glow had been silently
  replacing on every covered+goal tile.
- ~~**Card ordering in the aside**~~ ✓ **SETTLED 2026-07-16: RECS FIRST.** He was shown both (a
  `body.protocol-first` toggle is still in demo E) plus the measurement — recs-first starts the
  protocol 449px down and runs it past the fold at MANY — and chose to keep recs on top anyway.
- **Refresh persistence** (the name) — LIVE work, routes through §31 `saveUserProfile`.

### ⚠ THE PROCESS LESSON FROM THIS SESSION — the expensive one
Asked to design the rail, Claude ran an 18-agent / 345-tool-call audit and came back proposing to
retire a whole tab. **Luneth: "You're going too deep without consulting me first, finding problems
that aren't actually problems, wait for my feedback before doing anything else."** He was right, and
the correction is [[directives-are-guidelines-stay-balanced]] again: he points at ONE thing, Claude
escalates it into a demolition. The audit's facts were real and are now load-bearing above — but the
SIZE was the defect, and the fix was to stop and ask. **Consult first. Scope to what he asked for.**

### ✓ SIGNED OFF 2026-07-15 — the rest of the Coverage demo is DONE. Do not redo it.
Luneth: *"Looks good, let's sign off on this as good to go."* All screenshot-verified, zero page
errors. `temporary/coverage-D-personalized.html` (GITIGNORED — see the protection rule below):
- **Minerals RE-GROUPED to match live**: FOUNDATIONAL 5 (H C N O P, covered) · INDIVIDUALLY DOSED 21
  (gap) · PLANT DERIVED 34 (the shared ring). GENERATED from `coverage-layout-data.json`, not
  hand-typed. Ledger 5+0+0+37+48 = 90 counted · 91 shown. Grid untouched (11 cols × 100px, gap 9px).
  ★ **His "inconsistent borders" complaint FIXED ITSELF** — measured: each group now returns exactly
  ONE distinct computed look. gold-left-border = `.gap` (has a Wallach number, you're under it) ·
  ring = PLANT DERIVED · plain = no number. The invented tiers had SCATTERED those three treatments
  across all three groups (6 gap in FOUNDATIONAL, 13 in MAJOR TRACE, 2 in RARE TRACE), which is
  exactly why it read as random. **Zero style rules were touched.**
- **Sticky goal strip** — proven: after a 585px scroll the strip sits at 68px == the workspace top.
  ★ The scroller is `main.app-workspace`, NOT the document (`documentElement.scrollHeight <=
  innerHeight` — the document never scrolls). A document-relative sticky here is a silent no-op.
- **"Ask Wallach" → Unbounded** via `--ds-font-display` (type-futurist.css:28 repoints it off
  Playfair and loads last, so it wins). Do not hardcode the family.
- **Brand stack** — `● WALLACH CODEX` (blue `--ds-tech` #5fa4bd + the 8px glowing dot, both already
  in dashboard.css:76-77) / `PROFILE` / `CORPUS · 1,358 ENTRIES`.
  ★ "PROFILE" (not "You" — he rejected that: *"reads as incoherent, there's nothing in this top left
  section that is personalized"*) was chosen *"since that at least indicates it's clickable"*. **The
  word is a PROMISE and the click is wired** — brand slot, profile row and avatar all open an inline
  rename in place. If that ever breaks, the label becomes chrome that lies.
  ⚠ **`1,358` IS HARDCODED IN THE DEMO.** It is real today (corpus-embed claims, kv=336) but **MUST
  DERIVE when this lands in live** — a count that is true today and frozen forever is a lie with a
  delay, i.e. `EDEN v1 · sealed 8E594A01` all over again. Warning is in the markup.
  ★ He first picked "CORPUS · 336 ENTRIES" off my ambiguous "CORPUS 336" label. **336 is the SEAL
  VERSION, not a count** — caught before it shipped. Do not relabel a version as a count.
- **"Friend" retired** → brand `Profile` / profile `You` / avatar `Y` when unnamed.
- **Name inputs hardened + ATTACKED** (12 payloads: script tag, img onerror, svg onload, attribute
  break-out, `javascript:`, template literal, `__proto__`, RTL override, zero-width, control chars,
  500-char overflow, plus a unicode name that must SURVIVE). All neutralised: 0 elements created, 0
  execution, no dialogs; `José-Ann O'Neil` intact. ★ **The real defence is the SINK, not the filter**:
  every render goes through `.textContent`, which does not parse HTML. `sanitizeName()` is layer two
  and earns its place on what textContent does not care about but a human does (bidi spoofing,
  invisible padding, control chars that would corrupt the LS round-trip in live). It is an ALLOWLIST.
  Both entry points share ONE sanitizer + ONE commit path, deliberately, so they cannot drift.
- **Brand-name overflow FIXED** (`overflow-wrap: anywhere`). ★ Found by RENDERING, not reading: an
  unbroken 18-char name painted straight through the rail edge while
  `getBoundingClientRect().right` reported "no bleed" — the BOX is 171px, the GLYPHS ran to 294px.
  `scrollWidth > clientWidth` is the honest signal. [[the-instrument-lies-before-the-eye]] again.

### Still open from his note list (1)
- **Refresh persistence** — *"On the live version (not the demo) let's remember to add a memory
  element so if someone picks their name and starts without being a 'guest', they don't have to re-do
  the prompt on refresh."* **LIVE work, not demo.** Routes through §31 (`saveUserProfile` already
  exists; `knip-baseline`'s `_ratchet_additions` key retires when this gives it a caller).

## ★★★★ THE TIERS WERE AN INVENTION — settled, BUILT OUT, do not re-litigate

The old FOUNDATIONAL / MAJOR TRACE / RARE TRACE tiers came from
`dashboard/components/workspace-coverage-v3.2-PROPOSAL.html` — a **UI mockup** — and the canon's own
`provenance` field says so: *"Bootstrapped 2026-06-24 from coverage-layout-data.json"*. The tell:
`rare_trace` order was alphabetical **by atomic symbol** (Ag, Al, As, Au…), i.e. lifted off a
rendered table. Those three phrases appear **ZERO times** in all 7 books (re-run de-hyphenated and
line-break-bridged). **Gone as of `56145a4e`.**

**★ THE AFFIRMATIVE KILL — better than an absence.** `hk.txt:7312-7314`: *"The concentration of
trace elements in tissue or requirement levels does not represent their relative importance as an
essential nutrient."* A dose-ranked hierarchy asserts exactly what he denies. Cite THIS, not the
zero-hit grep, if anyone reopens it.

**★ MEMBERSHIP IS BOOK-ANCHORED (new, 2026-07-15).** Our 60 diff to **ZERO** against Wallach's own
**"Table 12-5. The 60 Essential Elements, Metals and Minerals"** (`rare-earths-forbidden-cures.txt:35469`)
— three columns of twenty, flat, alphabetical. Corroborated by a second independent 60-list at
`epigenetics.txt:19570`. Nobody had ever checked the table against a book table; it passed clean.

**★ CORRECTIONS the adversarial audit forced on Claude's OWN claims — do not repeat the old ones:**
- ✗ "He names the categories exactly once." **FALSE** — the triad appears ≥6× (`rare-earths:2030, 20781`,
  `dddl:2057`, `epigenetics:15222, 19572, 21536`). Only the FORMAL enumeration is unique to `immortality:3760`.
- ✗ "He never assigns a single element to any of them." **FALSE** — *Immortality*'s A-Z systematically
  header-tags rare earths (`Ce-Cerium, a rare earth, is found in`, `:5760` … ytterbium `:10233`) =
  **15 of our 60**. He also pointedly calls scandium *"a rare element"* (`:9514`) — NOT a rare earth,
  deviating from standard chemistry on purpose.
- ✗ "Where he enumerates, the basis is never nutritional." **FALSE** — `epigenetics:19570` and
  *Let's Play Doctor*'s FIG. 8-1 both are. **But both are FLAT and alphabetical**, which is what
  rescues the headline.
- ★ **"Rare earth" is a TAG on 15 tiles, never a group name.** 19 of the 34 in PLANT DERIVED are not
  rare earths by his own tagging. Naming that group "rare earths" would repeat the original sin one
  layer down. **Do not rename it back** — the group is defined by having NO INDIVIDUAL DOSE.

**✓ THE LANDMINE IS DEFUSED — `canon.subtype` is GONE, all 91 entries (2026-07-15, `386a0781`, kv=336).**
It carried the invented tiering (`foundational` 11 · `major_trace` 14 · `rare_trace` 35 · `conditional`
1 · null 30) and contradicted the page's FOUNDATIONAL 5 in the pillar itself. **Luneth chose the WHOLE
field over the 11 flagged** — leaving `major_trace`/`rare_trace` would keep the invented phrases alive
on 49 minerals inside the source of truth. The one non-tier value (omega-9 `conditional`) was surfaced
before the call and is already carried by `essential: false`.
- **THE CLEAN PROOF: `coverage-layout-data.json` regenerated BYTE-IDENTICAL.** The field never reached
  the page. Backed by a 37-agent adversarial audit (631 tool calls, 18 findings survived / 16 refuted
  as overstated): zero readers in `src/` · `eden/tools/` · `tools/` · `schemas/`; zero occurrences
  across all 23 derived artifacts + search-index + product-composition (parsed recursively for the KEY,
  not grepped for the string).
- ★ **DO NOT CONFUSE IT WITH THE UMBRELLA `subtype`** (leukemia→cancer). That concept is LIVE, is what
  every remaining `subtype` grep hit in the repo refers to, and was left alone.
- ★ The only tier token still in `dist/main.js` is **Creator's Log prose documenting the invention** —
  sacred, append-only, correctly left. If you grep and find `rare_trace`, that is what you found.
- `SCHEMA.md` now carries a **do-not-re-add note** with the affirmative kill (`hk.txt:7312-7314`).
- ⚠ **NOTED, NOT ACTIONED:** `SCHEMA.md` line 14 still documents `fatty_acids: 2, total: 90` while the
  canon holds `3 / 91 / essential 90`. A doc drift, its own chunk.

## ★★★★ HOW PLANT DERIVED LIGHTS — the keystone. Never decompose the bottle.

**The 924 mg goal was NEVER a sum of the 34 elements.** `WAL-CLM-EPIGEN-000089` doses the **BOTTLE**,
in fluid ounces — verbatim *"Liquid Plant Derived Coloidal Minerals One Ounce/ 100 pounds/day PPM"*.
The 600 is only **Majestic Earth's concentration** (mg solids per fl oz): 1 fl oz × 600 × (154÷100 lb)
= **924 mg**. §00.A-clean by construction — Wallach supplies the dose, the Youngevity label supplies
only the concentration (composition, never a target).

**So PDM products containing all 60 + extras breaks NOTHING.** He doses the bottle; we measure the
bottle. **No per-element derivation is needed, possible, or wanted — permanently.** If a future session
starts trying to derive per-element mg from a PDM label, it has misunderstood this paragraph.

**Two channels (`81fac90d`), gated by `tools/render_probe_pdm_presence.js` (12 checks, 3 worlds):**
1. **The group meter owns "covered"** — Σ(vehicle mg) ÷ 924. A 25 mg third-party product = 2.7% = gap,
   **not** green. It is a RATIO, not a flag — present/not-present for the vehicle would be a REGRESSION
   (it throws away the only quantified statement we have). Luneth was tempted by it; he was talked out
   of it on this reasoning.
2. **The presence floor never reaches "covered"** — a scanned item naming ONE of the 34 ("Cerium 2 mg")
   lifts that tile to `present` only. Wallach states no individual amount, so nothing can be measured
   as met (§00.A). It lifts **only the empty state**; any measured verdict outranks it.
   ★ Probe **case A is a real negative control** — it re-runs the pre-fix world and asserts CERIUM === ''.

**Youngevity is preferred STRUCTURALLY, not by favouritism** — his dose is in FLUID OUNCES, so
converting it needs a product with a known mg/fl oz. A competitor listing all 34 exactly would light 34
tiles `present` and move the meter zero: the honest answer, not a bug. `lets-play-doctor:3793`:
*"The most efficient way to get mineral supplements is in the plant derived colloidal liquid form."*

## ★★★★ PHOSPHORUS — settled, do not re-open

In FOUNDATIONAL, green. Wallach's base-line gives it **True Supplement Need 0.0** — the only nutrient
in the whole table with no recommended amount (`WAL-CLM-LETS-000061`) — because the diet already
floods you with it (*"rich in phosphorous… found in just about everything we eat"*, `dddl:7408`).

**★ The render fix is NOT fiat and that is the point.** Phosphorus is deliberately NOT in
`FOUNDATIONAL_PRESENT_SLUGS` (whose 4 members are forced covered on Luneth's say-so, cited "(Luneth)").
`classify()` returns covered when `target.low === 0` — a zero target is MET by taking none. So
phosphorus is the ONE foundational element whose green traces to a sealed Wallach claim. Precision
checked: it is the only essential of 91 with `low == 0`; 53 carry no `low` key (undefined !== 0) and
keep the old pending branch.

**★ FIG. 8-1's columns are `Nutrient | RDA | True Supplement Need | 30-Day Pharmacologic`** — a header
OCR-wrapped across `lets-play-doctor:3755-3756`, which is why it went unread for weeks. **The "800 mg"
beside phosphorus is the GOVERNMENT RDA he argues against — NEVER a Wallach number.** Proven 3 ways:
four rows carry `?` in column 1; column 2 sits BELOW column 1 twice (vitamin D 275 vs 400; phosphorus
0 vs 800); and `3682-3685` says RDA-level supplements *"will not prevent serious disease"*.
**No RDA ever reached a target** — all 33 fig-8-1 claims took column 2, verified row by row. All 33
summaries now carry a clause naming the column order (`e0774559`, kv=335). Luneth offered deletion;
labelling was kept because the them-vs-Wallach contrast IS his reason for capturing RDAs.

## ★ NEEDS LUNETH'S CALL (0 open — both closed 2026-07-15)

1. ~~**A RATCHET LOOSENING** (`knip-baseline.json`, `state/profile.ts|saveUserProfile`)~~ — ✓ **APPROVED
   2026-07-15**: *"it looks like a consistency issue that would only help us, I see no reason not to
   approve it."* Retire the `_ratchet_additions` key when the arrival/rename UI gives it a caller.
2. ~~**`design-system.golden.sha256` is computed over RAW CRLF bytes**~~ — ✓ **FIXED + PUSHED
   2026-07-15 (`386a0781`).** Approved together with the canon fix ("OBVIOUSLY we fix this"), after
   Luneth pointed out BOTH had gone unanswered because they were buried "under WALLS AND WALLS of
   text ... literally impossible to find". **The presentation was the defect, not the analysis.**
   `_lf_file_hash()` added beside `_file_hash()`; `check_design_system_hash_integrity` switched to it
   (call site 558 ONLY); golden re-sealed `37c338b7` → `037d0e3e`; `.gitattributes` now pins
   `dashboard/assets/styles/*.css` + `*.golden.sha256` to `text eol=lf` (defence in depth — the gate
   is EOL-agnostic regardless). **The css content was never touched** (`git diff --quiet` clean) and
   the new golden EQUALS the raw sha256 of the committed blob.
   ★ **`_file_hash` was DELIBERATELY LEFT RAW** — its live second caller (`:1968`) is the graphics
   gate, and `eden/graphics/*.jpg` are `binary`; LF-normalizing a JPEG's hash would corrupt that seal.
   Changing `_file_hash` globally is the obvious move and is WRONG. Gated by `file_hash_still_raw`.
   ★ **PROVEN IN A REAL FRESH CLONE, not argued** — the fixed gate is GREEN there, and the same clone
   reproduces the bug as a negative control (pre-fix raw hash `037d0e3e` vs pre-fix golden `37c338b7`
   → RED). The defect was invisible on this machine by construction, so the local board could never
   have validated the fix.
   ★ **THE SWEEP said this was the SOLE holdout** — all 20 other goldens already LF-normalize in their
   gates; graphics raw-hashing is correct by construction. Do not "fix" the others.

## ★★★ WHAT LANDED OVERNIGHT (6 commits, all pushed)

- **`dose_amount_in_verbatim`** (NEW, critical) — **the cornerstone hole.** Nothing ever tied a
  claim's `dose.amount` to the book text; a planted 10x sodium fabrication (3,300→33,000 mg) passed
  the WHOLE board green while the verbatim still read "3,300 mg". Adversaries broke the first design
  3 ways (cross-row bleed 72/86; a **1000x choline mg→mcg swap** off chromium's row; in-row column
  bleed) — all closed by row-scoping + positional column checks. **Zero baseline exceptions**: the
  spec's proposed one would have neutered the whole gate (the baseline is INVARIANT-scoped).
  It found **1 real defect** on its first run (`WAL-CLM-RARE-000048`, verbatim span cut one sentence
  short of its own dose) — fixed, re-sealed at **kv=333**.
- **`charter_gates_present` verified 2 of 9 rules** while reporting all 9 (per-row WISH exemption).
  Now 9/9.
- **3 "critical" design gates could never fail** — they read a mode from `tacitus/feature-flags.json`,
  a file and a directory that **do not exist**; the bare `except` returned "warn" and every
  violation became a PASS. Knob deleted. `write_protection`'s mtime check replaced with a **git
  anchor** (it now catches an agent editing the css AND re-sealing the golden — which
  `hash_integrity` is blind to by construction).
- **`regimen_state_mutation_routing` (§31) RESTORED** — gone since 2026-07-05 "to return in Phase C";
  Phase C landed the SAME DAY and nobody noticed for 10 days while CLAUDE.md asserted §31 flatly.
- **`essentials_canon_matches_graphic`** (NEW) — the canon's membership now has its first anchor
  outside our app. **It matched the graphic EXACTLY, zero diff, first run.** The membership was
  right all along; it just was never proven — which is precisely why nobody caught that it had no
  anchor.
- **`collective_doses_not_fanned`** fail-open closed (it only caught fan-outs someone remembered to
  annotate).
- **Doctrine trimmed, nothing added:** the duplicate R1-R9 table deleted from the blueprint; the
  Charter's R2 scope corrected (its gate reads **38 of 91** essentials, not "every amount"); the
  Charter's stale-in-BOTH-directions fixed; the rotted 2026-06-24 "CONFIRMED" verdict corrected
  (all 3 evidence legs dead — though **the conclusion, 90, is true and externally anchored** at
  `dddl:4196`; it was right by luck, not by its reasoning).
- **Profile:** `dashboard.html` hardcoded the name **"Luneth"** into the markup — now real state,
  defaulting to **"You"** (profile tab) / **"Codex"** (brand slot) per his call. Name input hardened.

## ★★ THE COVERAGE DEFECTS — diagnosed, NOT fixed (view-layer only)

- **The 33-amplified cards.** The group scoring **IS live and works** — probe: 1× PDM flips all 33
  to `partial` together, 2× to `covered`. Nothing was falsely claimed; commit `db8d7c41` explicitly
  said *"Nothing new is visible on the tab yet."* The defect: `views/coverage.ts::renderTile`
  (79-107) reads only `tile.status` and **never reads `tile.pdmGroup`** — which
  `state/coverage.ts:798` already puts on every tile and `views/entity-page.ts:330` already consumes
  correctly. With no PDM in the stack the ONE shared verdict is `''`, which renders as a bare
  `.tile` — identical to a genuinely unmined essential. **One group verdict amplified 33×.**
- **Absence-as-state is the styling root cause.** "NO WALLACH NUMBER YET" has **no class** — it is
  the ABSENCE of one, so it cannot be styled independently of the chassis. 50 tiles share it.
  ⚠ **PARTIALLY RETRACTED 2026-07-15 — the root-cause framing above STANDS; the measurement
  below was FALSE.** This bullet asserted the 50 "render two ways: 33 PDM at **2.67:1** contrast vs
  17 (phosphorus, strontium, 12 aminos, 3 omegas) at **1.11:1** — imperceptible." **Not
  reproducible.** `workspace-coverage.css:562` styles `.tile, .tile--vitamin, .tile--amino,
  .tile--fat` in ONE rule (`background: var(--ds-paper-deep)` + `inset 0 1px 3px rgba(26,22,18,0.10)`
  + `inset 0 0 0 1px var(--ds-rule-soft)`); the variant rules (`:597-599`) differ ONLY in
  border-radius/padding. **NO selector distinguishes the 33 from the 17 while statusless**, so all 50
  paint IDENTICALLY. Luneth's headless computed-style probe measured the same and could not reproduce
  2.67:1 from any token pair; a static CSS read reached it independently. **What is TRUE, and explains
  what he SAW:** with a PDM product seeded the 33 are not classless at all — they carry `.partial`.
  The difference is STATUS, not chassis. "NOT COVERED" (37) is 100% consistent; the "some have left
  borders" he saw IS Silver+Tin — `.gap`'s `inset 3px 0 0 var(--ds-status-warn)` (`:676`) is literally
  a left border. VERIFIED.
- **The legend lies — CONFIRMED, minus one fabricated clause.** Its swatches hand-duplicate the tile
  treatments (R3) and both have drifted. **RE-VERIFIED TRUE 2026-07-15:** the legend's `.pending`
  swatch (`:861`) paints `rgba(26,22,18,0.12)` where the real statusless tile (`:562`) paints `0.10`;
  the legend's `.gap` (`:857`) DROPPED the tile's depth layer `inset 0 1px 3px rgba(26,22,18,0.10)`
  (`:676`). The comment at `workspace-coverage.css:848` — *"a legend that renders a different language
  than the thing it explains is just another lie"* — is itself the lie, as charged. **Note the swatch
  selectors are `.legend__sw.covered|partial|present|gap|pending`; there is no `.tile.pending` rule at
  all, so the legend's "pending" swatch depicts a state the tile stylesheet never names.**
  ⚠ **RETRACTED from this bullet:** "The swatch for 'NO WALLACH NUMBER YET' matches **17 of 50**
  tiles" (rests on the dead 33-vs-17 split above) and "`.is-foundation` wears 36% of the field with
  **no legend entry**" (the class does not exist — see below).
- ⚠⚠ **THE RETRACTION BELOW IS ITSELF WRONG — CORRECTED 2026-07-15 (third pass). READ THIS FIRST.**
  `.is-foundation` **EXISTS.** It is in `temporary/coverage-D-personalized.html` — 3 hits, including
  the `!important` box-shadow (`.is-foundation { box-shadow: 0 0 0 1.5px var(--ds-ink-faint)
  !important; }`) and the `paintField()` line that applies it to PDM tiles with no goal hits.
  **WHY EVERY LEG OF THE RETRACTION MISSED IT, AND WHY THAT IS THE REAL LESSON:** every leg was a
  `git`-scoped command — `git grep`, `git log -S`, and greps limited to `dashboard/`. **`.gitignore:17`
  ignores `temporary/`.** So the method could not see the demo *by construction*, and the demo is the
  exact file Luneth was looking at when he wrote the original note. `git grep` over "ALL tracked files"
  is not "all files" — it is a set that structurally excludes the prototypes this project keeps its
  design truth in.
  **What was TRUE in the retraction:** the class is not in `dashboard/` — not in the css, ts, html,
  data, or `dist/main.js`. The live app's tile status-class set really is exactly
  `.covered .partial .pending .present .gap`. So the ORIGINAL bullet's claim — that `.is-foundation`
  and `.gap` share a CSS channel *in the app* — was still wrong, and the app has no such collision.
  **What was FALSE:** "No such class. No such rule. It never existed in the app at any point in
  history." It exists, it is live in the demo today, and the original note was almost certainly ABOUT
  the demo.
  ★ **THE DURABLE RULE:** before declaring something a fabrication, check whether your search could
  have seen it. A negative result from a blind instrument is not evidence of absence. Scope-check the
  tool before trusting the null — the retraction was written with the same confidence as the
  fabrication it was correcting, and was equally unearned. (2026-07-15: the demo's `.is-foundation`
  is now the PLANT DERIVED group's ring — 34 tiles, uniform, working, and screenshot-verified.)
  ---
  _The original (partly-wrong) retraction, preserved verbatim below because its dashboard-scoped
  evidence is still valid and its lesson still stands:_
- ⚠ **RETRACTED 2026-07-15 — THE "LOADED GUN" WAS A FABRICATION.** The bullet read:
  *"`.is-foundation`'s `!important` box-shadow and `.gap` share a CSS channel. It fires on 0 tiles
  today ONLY because no PDM element has a Wallach number yet."* **No such class. No such rule. No such
  collision. It never existed in the app at any point in history.** Evidence (Luneth 2026-07-15; every
  leg independently re-verified by Claude before this write):
  - `git grep -n "is-foundation"` over ALL tracked files returns exactly TWO hits — both in THIS file,
    i.e. the handoff asserting it. **Zero** in `dashboard/` (css / ts / html / data) and **zero** in
    the built `dist/main.js`.
  - `git log -S"is-foundation" --all` returns exactly ONE commit: `67ac7556` *"chronicle: retarget the
    handoff..."* — a **chronicle-only** commit. The string was never added to or removed from a
    dashboard file, ever.
  - `grep -n "!important" dashboard/assets/styles/workspace-coverage.css` -> **ZERO matches.** The only
    `!important` rules in `dashboard/assets/styles/` are `design-system.css:315,322,323`
    (prefers-reduced-motion) and `drawer-knowledge.css:57` (`.kd-hidden{display:none}`). **None is a
    box-shadow.** So the "shared CSS channel" has no second occupant.
  - **Checked for a renamed equivalent before retracting** (over-correcting would be the same sin): the
    complete tile status-class set is exactly `.covered .partial .pending .present .gap`. There is no
    `.is-foundation` under another name. The only "foundation" token in the CSS is a COMMENT at `:428`
    naming the subsection labels ("Minerals: Foundational / Major Trace / Rare Trace").
  - A headless computed-style probe of all 91 tiles: the 33 rare-earths carry className exactly `tile`
    (empty regimen) or `tile partial` (PDM seeded). Never `is-foundation`.
  **THE LESSON — this is the expensive one (logging-doctrine rule 5 ·
  [[prove-completion-dont-narrate-it]] · [[the-instrument-lies-before-the-eye]]):** a session INVENTED
  a CSS class it never grepped for, wrote it into the handoff as a "loaded gun", and the NEXT session
  propagated it verbatim into an audit prompt **as established fact** — laundering a fabrication into a
  premise that agents were then asked to confirm. The board was green throughout; no gate can see this,
  because chronicle prose is not gated. **A finding that names a code symbol MUST cite the grep that
  found it.** `.is-foundation` is a DEAD TOKEN: if you ever read it again, it came from this file's
  history — never from the app.
- **Silver + Tin are NOT bugs.** They carry their own Wallach doses (400 mcg / 500 mcg) and
  correctly render individually inside RARE TRACE. Already adjudicated.
- **Legend arithmetic is SOUND** (4+0+0+37+49 = 90; 91 shown; the +1 is omega-9).


---

_Everything below is the still-live design record from prior sessions, carried forward unchanged._

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
