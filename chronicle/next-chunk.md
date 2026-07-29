# Next chunk — ★ AUTHORITATIVE HANDOFF (set up 2026-07-29 for a FRESH session)

# ★★★★★ READ FIRST (plain language)
Board **76/76 green · corpus kv432 · 2267 sealed claims · repo clean + pushed**. Previous session closed.
The task is still **the 90-essentials page HEADERS** — the first attempt (Copper) was **rejected** and the lesson below is
the whole point of this handoff. Read it before touching anything.

## ★ THE LESSON that killed the last attempt (do NOT repeat it)
An element header does **not** live on a blank page. It renders **INSIDE the tan `.kd-ep-fam` content box**
(background `--ds-paper-deep`, a warm tan — NOT white) at the **EXACT width of the entity detail screen's content column**.
Last session I built Copper mockups as standalone **white**, **full-width** pages — so even the good ideas looked wrong and
Luneth rejected all of them. **Every mockup MUST be authored AND previewed in the real container:** tan `--ds-paper-deep`
background, the exact entity-page content width, the real fonts/tokens. The cleanest way is to render the mockup INSIDE the
actual live entity page (or a shell that reproduces the `.kd-ep-fam` box exactly), never a bespoke white sheet.
Second miss: the illustrations read **corny / misaligned** (esp. a human-figure one). Match the app's editorial restraint
(see the omega/selenium heroes + [[visual-design-bar-and-principles]]); a clean, legible, tasteful figure beats a busy one.

## The PROCESS Luneth locked in (2026-07-29) — use it for EVERY element
For each element: build **4 genuinely distinct mockups** (different layout + illustration, bespoke to THAT element's
content — NOT the Selenium eyebrow→3-beats→quote chassis) → Luneth PICKS one (or a mix) → build the winner into the live
entity page → STOP for his visual sign-off (visual-verification gate). **All 4 mockups must sit in the real tan box at
exact width** (the lesson above). He wants to do this one element at a time; it is the fun part for him — he drives.

## TASK — the 90-essentials HEADERS, starting with COPPER
Copper was chosen first (richest illustration material). Re-do it RIGHT: 4 mockups in the real tan container → his pick.
The verified Copper Wallach content is ALREADY mined + confirmed against the sealed corpus (reuse, don't re-verify):
- Mechanism: **RARE-000119** (copper = lysyl-oxidase cofactor → elastin; tyrosinase → melanin) + **RARE-000344** (tyrosinase→pigment→gray hair).
- Aneurysm mechanism + THE stat: **RARE-000120** ("four to six of every 100 Americans autopsied … 40 percent … not yet ruptured").
- First visible sign: **DDDL-000003** ("presents itself first as white, gray, or silver hair").
- Reversible: **RARE-000121** (color returns ~6 months) + **DDDL-000196** (veins recede, some aneurysms heal).
- The Einstein pull-quote: **HELLS-000040** (turkey→Einstein), highlight phrase "a simple copper deficiency".
- Wallach daily target ~3.1 mg (1–2 mg/100 lb). Category = mineral → blue. Symbol Cu, atomic 29.

## HOW headers wire in (mechanics — confirmed this session)
- Renderer: `views/entity-page.ts::renderEssentialPage` (~L1264). The illustrative-block SEAM is ~L1316, between
  "At a glance" and "Worth knowing": three self-suppressing renderers — `fattyAcidBlockFor` (omega), `renderMechanism`
  (selenium), `renderPdmClarity` (plant-derived). A new bespoke block is a 4th sibling OR a new mechanism-clarity entry.
- Lowest-friction path (selenium's): add a slug-keyed entry to `dashboard/assets/data/mechanism-clarity-data.json`
  (schema `core/schemas/mechanism-clarity.ts`) + a new deterministic SVG figure fn + a `case` in `mechanismFigure`
  (dispatch on a GENERIC figure key, NEVER a slug). All copy in the JSON store (R4); numbers/quotes pulled BY CLAIM ID
  (`fatFamilyQuote`, R3). The `.kd-ep-fam` box is `--ds-paper-deep` (the tan) — THAT is the container to design within.
- Category color: whole screen recolors via `.kd-essential-deep[data-category="mineral"]` (blue) in `drawer-knowledge.css`
  (~L2276); amino=green + omega=purple blocks still need adding when those elements are built.
- GATES that constrain a header: `entity_render_is_projection` (no slug branch / id-keyed literal), `views_no_inline_prose`
  (no prose literal in the view — copy lives in the JSON store), `view_category_not_hardcoded` (no colour-word literal).

## DONE this session (kept — approved + green)
- **Global header readability** (`drawer-knowledge.css`, 6 shared single-def classes, propagate to ALL headers):
  `kd-ep-fam__eyebrow` .7rem · `__flabel` .85rem · `__statread` .75rem · `__statlbl` .7rem · `kd-ep-seclabel__hint` .7rem · `kd-ep-k` .7rem.
- **Copy** (`entity-page.ts` ×2): the "At a glance" seclabel hint "the essentials, in one place" → **"Daily Needs & How It Works"**.
- **Reverted to zero**: the whole Copper cross-link attempt (JSON entry + `copperFigure` + CSS). **Deleted** the rejected
  mockup file (`temporary/copper-header-mockups.html`) so it can't poison the next try. No dead code left.

## LOAD FIRST next session
- `.claude/rules/visual-verification.md` (human-in-the-loop STOP gate) + [[screenshot-verify-visual-chunks]] (a DOM probe is NOT a visual check).
- The gold-standard heroes in `views/entity-page.ts` (selenium `renderMechanism` L1096+, omega `renderOmega6Experience` L1036+) + their `.kd-ep-fam` CSS in `drawer-knowledge.css` (L1848+, L2220+) — learn the tan box + restraint.
- Memories: [[category-color-coding]] · [[element-intro-what-is-claim]] · [[daily-target-provenance-always]] · [[element-sources-at-bottom]] · [[gold-standard-page-workflow]] · [[svg-figure-size-in-screen-px]] · [[header-mockups-in-real-container]] (the lesson above).

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food; nutrients from the DIET (food OR supplements). 3. NEVER fabricate — verbatim ⊆ sealed book, or GAP.
4. `corpus_seal` + `catalog_seal` are USER-ONLY (per-invocation authorization). 5. Memory index: consolidate only past ~200 lines ([[memory-consolidation-threshold]]).

**Corpus kv432 · 2267 claims · board 76/76 green · repo clean + pushed. Next: RE-DO the Copper header (4 mockups in the REAL tan box, exact width) → Luneth picks.**
