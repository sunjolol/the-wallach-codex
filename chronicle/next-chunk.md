# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-22, Products-TAB close)
# ★★★★★ 2026-07-22 — PRODUCTS TAB landed (colour-coded ghost-number cards, all 215) + dead one_liner field removed + glossary apostrophe-matcher fixed · board 77/77 · committed+pushed
# ▶ NEXT: the remaining demo-to-live surfaces — Products DETAIL panel · Ask-Wallach WORDING. Mining still PAUSED.

## TASK CONTEXT (carries across the whole demo-to-live effort — memory demo-elements-still-to-do + demo-layout-yes-demo-style-no)
- THE demo = `file:///…/temporary/knowledge-drawer-prototype.html` (NOT dashboard/components/*.html). Surfaces still not-yet-live:
  1. Products tab ✅ (this session) · 2. Products detail ⬜ · 3. Conditions tab ✅ · 4. Conditions detail ✅ · 5. Ask-Wallach popup/side-menu WORDING ⬜ (NOT a rebuild — the drawer works; only copy).
- HARD RULE: take the demo's LAYOUT/STRUCTURE, RESTYLE to CURRENT standards, then IMPROVE past it (drop dated demo styling). Fonts: `--ds-font-display`=Unbounded, `--ds-font-sans`/`--ds-font-serif`=Space Grotesk, `--ds-font-display-interface`=Chakra Petch (labels), `--ds-font-display-artifact`=Bruno Ace (numbers), `--ds-font-mono`=JetBrains. NO serif except crown-jewel Wallach pull-quotes. Visuals identical in spirit, CODE PROPER. Reference current-best surfaces: omega-3/6 detail, Absorption tab, plant-derived-mineral detail. VISUAL SIGN-OFF each chunk (Luneth is the tester) — and for card work, MEASURE don't eyeball (headless getBoundingClientRect proved the centering this session).

## ✅ LANDED THIS SESSION — PRODUCTS TAB (Direction A) + two fixes
### Products tab — `views/knowledge-products.ts` + `drawer-knowledge.css` (the Conditions ghost-number family, adapted for products)
- Card = colour-coded ghost-number, mirroring the Conditions card but PRODUCT-NATIVE (Luneth: "products are NOT conditions"). Picked from a 4-direction mockup (`temporary/product-cards-brainstorm.html`, gitignored — like condition-cards-brainstorm.html): A ghost=essentials (chosen) · B ghost=price · C coverage meter · D form band.
- COLOUR = DELIVERY FORM (products carry no category field, but every one has a form + it's what a shopper scans by). 7 families `formFamily()`: liquid/capsule/powder/tablet/chewable/tea/topical, each coloured in CSS via `[data-form="…"]{--form:…}` (the product analog of conditions' `--cat`). 'other' = neutral fallback (no product hits it today).
- GHOST NUMBER = essentials-supplied-of-90 via `essentialsSupplied()` = `essentialSlugsByProduct().get(id)?.length` (the recommender's UNfiltered product→essentials index — kids products stay in the catalogue). 60/215 are TARGETED FORMULAS (supply none of the 90 — botanicals/adaptogens): they DROP the ghost (view omits it) and the foot reads "targeted formula", never a sad "0".
- FOOT = "of 90 essentials · $wholesale · N servings" (wholesale = featured price). Grid sorted most-comprehensive-first (`productsByBreadth`, breadth desc, name tiebreak; `listProducts` stays A–Z for other readers). Header "ALL 215 PRODUCTS · SORTED BY ESSENTIALS SUPPLIED".
- Click still opens the existing `renderProductDeep` detail panel; `data-search` blob preserved so product search still filters.
- CARD LAYOUT (Luneth refinements, all measured): name 97% width + 0.9rem (cut wrapping); title EXACTLY centered in each card's TOTAL height — chip + foot are `position:absolute` overlays (top-left / bottom), the NAME is the only in-flow child centered by `justify-content:center` on a flex column with SYMMETRIC 28px top/bottom padding + `min-height:120px`; this makes nameCenter==cardCenter for every card regardless of the row's height, and stays robust to long names (the flow name grows the card, staying centered). Form dot nudged `transform:translateY(-2px)` (same pattern as `.kd-ep-hero__cat i`). Ghost sizes tuned so names never cut the number: PRODUCT ghost 2rem/top:4px, CONDITION ghost 2.5rem/top:4px (was 3rem).
- Probe: `tools/render_probe_knowledge.js` count regex updated to "ALL N PRODUCTS".

### Fix 1 — removed the DEAD `one_liner` field (closes the prior deferral)
- No view ever read it (verified: 0 `.one_liner` dot-access in the built bundle; the 599 bundle hits were schema + inlined data). Removed from `eden/tools/entity_page_derive.py` (the `one_liner()` helper + `basics_by_subject` + `cbk_for_ol` + both output keys) and `core/schemas/entity-page.ts` (both page schemas), regenerated `entity-page-data.json`. The Osteoporosis "fibrous-dysplasia one_liner" confusion is gone — pages already rendered the derived `conditionSynopsis`.

### Fix 2 — glossary now matches apostrophe terms (a latent bug affecting ALL eponyms)
- `views/glossify.ts` scanned HTML-ESCAPED text, so a `'` had already become `&#39;` and NO apostrophe term could ever gloss (Bell's Palsy, Meniere's, Wallach's Vertigo, Wallach's Fibrous Dysplasia — 0 apostrophe terms existed in the 219-term glossary, which was the tell). Fixed to scan RAW text + escape per-segment (still XSS-safe). `state/glossary.ts` `normKey`/`keyToPattern` now fold/allow straight + both curly apostrophes. Added glossary term "Wallach's Fibrous Dysplasia" (faithful, digit-free — passes `glossary_wellformed`) + 4 vitest cases. Zero regression (no existing term had an apostrophe).

## ▶ NEXT — remaining demo surfaces (ASK Luneth which; memory decisions-need-a-question)
- PRODUCTS DETAIL panel: `renderProductDeep` works but is in the OLD style — same demo-to-live treatment (take demo layout → restyle to current → improve). First confirm what the demo's detail ADDS beyond the live label panel. MOCKUP-FIRST like the tab (Luneth picks), then build live, visual sign-off each chunk.
- Ask-Wallach WORDING: rail "SEARCH"→"Ask Wallach" + popup/side-menu copy to match the demo. NOT a re-architecture of the working Search drawer.

## ⏸ PARKED — Batch-4 book mining (resume only if Luneth redirects): re-dedup each teal-new candidate vs ALL 7 sealed books first (memory dedup-across-all-books-before-authoring). Byte-verified passages in temporary/plant-derived-research-2026-07-17/.

## 🔴🔴 REVIEW PROCESS — Luneth's hard rule (EVERY corpus/content touch): before sealing ANY claim show it in EXACT final form — QUESTION → SHORT ANSWER → (full only if it adds) → QUOTE — and approve the CLAIM, never a side-question. Unreviewed = log "unreviewed", never "approved". corpus_seal is USER-ONLY.

## 🔧 KEY MECHANICS
- Preview pane CACHES the bundle — for a reliable visual use a headless puppeteer screenshot (scratchpad shot_products.js / measure2.js pattern): fresh chrome loads current dist + CSS; dismiss the onboarding modal ("just browsing") first, then screenshot/measure. For card geometry, MEASURE getBoundingClientRect (nameCenter vs cardCenter) — eyeballing a screenshot lied twice this session.
- CSS is LINKED not bundled — CSS edits need NO rebuild; JS/data edits need `node tools/build.mjs`.
- Grid cards stretch to the row's tallest by default (align-items:stretch); to center content in the FULL card, pin the top/bottom bits absolute and center the sole flow child with symmetric padding.
- Curation-layer pattern: `assets/data/*.json` (hand-authored) + `core/schemas/*.ts` (+ index export) + `state/*.ts` reader + MANIFEST `accounted` entry.
- Round-close: build → invariants → probe → build-log → `creators_log.py append` → RE-inline build → commit + push.
- Windows/UTF-8: prefix `PYTHONUTF8=1`; safe_write payloads LF (the primitive restores CRLF); every project write via `safe_write` (multi-edit → a Python driver of `safe_replace`/`safe_rewrite` calls). NEVER bare `cd subdir` (drifts cwd → cwd-relative hooks fail; recover with PowerShell Set-Location).
