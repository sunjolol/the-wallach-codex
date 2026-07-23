# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-23, Products-DETAIL close)
# ★★★★★ 2026-07-23 — PRODUCTS DETAIL page landed (full kd-ep-* entity view, delivery-form colour-coded: Unbounded "at a glance" hero + a near-identical real-label Supplement Facts table) · board 77/77 · committed+pushed (03468d62)
# ▶ NEXT: the LAST demo-to-live surface — Ask-Wallach popup/side-menu WORDING (copy only, NOT a rebuild). Mining still PAUSED.

## TASK CONTEXT (carries across the whole demo-to-live effort — memory demo-elements-still-to-do + demo-layout-yes-demo-style-no)
- THE demo = `file:///…/temporary/knowledge-drawer-prototype.html` (NOT dashboard/components/*.html). Surfaces:
  1. Products tab ✅ · 2. Products detail ✅ (this session) · 3. Conditions tab ✅ · 4. Conditions detail ✅ · 5. Ask-Wallach popup/side-menu WORDING ⬜ (the ONLY one left — NOT a rebuild; the drawer works, only copy).
- HARD RULE: take the demo's LAYOUT/STRUCTURE, RESTYLE to CURRENT standards, then IMPROVE past it (drop dated demo styling). Fonts: `--ds-font-display`=Unbounded, `--ds-font-sans`/`--ds-font-serif`=Space Grotesk, `--ds-font-display-interface`=Chakra Petch (labels), `--ds-font-display-artifact`=Bruno Ace (numbers), `--ds-font-mono`=JetBrains. NO serif except crown-jewel Wallach pull-quotes. Visuals identical in spirit, CODE PROPER. Reference current-best surfaces: omega-3/6 detail, Absorption tab, plant-derived-mineral detail. VISUAL SIGN-OFF each chunk (Luneth is the tester) — MEASURE / screenshot, don't eyeball.

## ✅ LANDED THIS SESSION — PRODUCTS DETAIL page (kd-ep-* entity view) + Luneth's round-2 polish
### `views/knowledge-products.ts` (renderProductDeep rewritten) + `styles/drawer-knowledge.css` + `core/schemas/product-detail.ts` + `views/knowledge.ts` + `tools/render_probe_knowledge.js`
- Clicking a product now opens a FULL entity page (breadcrumbs + kd-ep-hero / lede / seclabel / pill / back), replacing the old inline panel. Same treatment as the conditions detail.
- COLOUR = DELIVERY FORM: `FORM_COLORS` (JS single source; mirrors the CSS `[data-form]` card map) sets `--form` inline on the `.kd-ep--prod` root → icon + TITLE (products colour the title, unlike conditions' ink title — Luneth's call) + card frame/glow/hairline. Scrollbar via `productScrollTint()` → `--kd-detail-scroll` on <html> (renamed from `--kd-cond-scroll`, now SHARED by conditions + products; the render() publisher + close() cleanup + the .kd-body scrollbar CSS all use the new name).
- AT A GLANCE (`kd-pf-glance`): big Unbounded numeral (`--form`) = essentials-supplied of 90 (echoes the card ghost); a targeted formula (0 of 90) shows a "Targeted formula" Unbounded headline, no sad 0. Metrics = wholesale / per-serving / cost — content-sized columns, `justify-content:space-between`, `nowrap` (a long per-serving borrows the blank space a short price leaves; never wraps).
- SUPPLEMENT FACTS (`kd-pf-*`): faithful demo port — one card per component, macro chips, 3-col grid (Nutrient/Amount/%DV = `1fr auto 56px`), category-coloured hover-to-navigate rows → essential page, chemical-form italic sub-lines, unit_detail, IU, † no-DV, collapsible proprietary blends (`ProductBlendSchema` widened to type `ingredients`, kept file-internal for no_new_dead_code), Other Ingredients.
- ROW COLOURING is GROUNDED in `essentialSlugsByProduct` (never invents a mapping — botanicals like MSM/glucosamine/beet root stay neutral). A B-number alias bridge (`bVitaminToken` on `unit_detail` "B1" + a 6-name `B_SYNONYM` map) links thiamin/riboflavin/pantothenic/pyridoxine/cobalamin → "Vitamin B<n>" (BTT 20→23 coloured rows).
- Round-2 fixes (Luneth): blend-only lede reads "built from N whole-food blends" (no "0 nutrients"); `.kd-ep-back` `white-space:nowrap; flex:0 0 auto` = ALWAYS one line, title shrinks instead (fixes the essentials/Carbon wrap too — shared button); metrics never wrap; "1 serving" pluralised; `.kd-ep-lede` max-width 60ch→69ch (global — all entity ledes).
- Blank-surface canary (memory build-gate-vs-runtime-schema-drift): widening ProductBlendSchema risked a runtime Zod reject → verified all 215 products still parse (probe asserts rowCount≥200). Screenshots: BTT 2.0 Tablets (rich) / 18&20 Daily (targeted formula) / Rebound FX 1-Case (worst-case long title + long serving).

## ▶ NEXT — the LAST demo surface (then the demo-to-live effort is DONE)
- Ask-Wallach WORDING: rail "SEARCH" → "Ask Wallach" + popup/side-menu copy to match the demo's framing. NOT a re-architecture of the working Search drawer — copy only (memory search-is-ask-wallach-popup + ask-wallach-search-vision). Visual sign-off. After this, Luneth decides: resume Batch-4 mining or a new direction.

## ⏸ PARKED — Batch-4 book mining (resume only if Luneth redirects): re-dedup each teal-new candidate vs ALL 7 sealed books first (memory dedup-across-all-books-before-authoring). Byte-verified passages in temporary/plant-derived-research-2026-07-17/.

## 🔴🔴 REVIEW PROCESS — Luneth's hard rule (EVERY corpus/content touch): before sealing ANY claim show it in EXACT final form — QUESTION → SHORT ANSWER → (full only if it adds) → QUOTE — and approve the CLAIM, never a side-question. Unreviewed = log "unreviewed", never "approved". corpus_seal is USER-ONLY.

## 🔧 KEY MECHANICS
- Preview pane CACHES the bundle — for a reliable visual use a headless puppeteer screenshot (scratchpad shot.js pattern): fresh chrome loads current dist + CSS; DISMISS the onboarding modal ("just browsing") first, then screenshot. Element-screenshot `.kd-ep--prod` to capture just the detail card.
- CSS is LINKED not bundled — CSS edits need NO rebuild; JS/data edits need `node tools/build.mjs`.
- Curation-layer pattern: `assets/data/*.json` (hand-authored) + `core/schemas/*.ts` (+ index export) + `state/*.ts` reader + MANIFEST `accounted` entry.
- Round-close: build → invariants → probe → build-log → `creators_log.py append` (--summary ≤280) → RE-inline build → commit + push.
- Windows/UTF-8: prefix `PYTHONUTF8=1`; safe_write reads via universal-newline so LF payloads MATCH the CRLF working tree AND `safe_replace` asserts count==1 (loud, never silent); every project write via `safe_write` (multi-edit → a Python driver of `safe_replace`/`safe_rewrite`). NEVER bare `cd subdir` (drifts cwd → cwd-relative hooks fail; recover with PowerShell Set-Location).
