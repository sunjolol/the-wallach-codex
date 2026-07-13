# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-13, end of session)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES ("older loses"). Board **62/62**, knowledge_version **327** (unchanged — no corpus reseal this session). The **Absorption tab** got a large design build + refinement pass this session, all committed + pushed. Luneth (2026-07-13): "still more after this" — expect continued Absorption refinement next session.
>
> This file is the **temporary** rolling handoff (current per-element design state + what's next); it is pruned as work lands. DURABLE principles live in the memory files (read at genesis), NOT here and NOT in CLAUDE.md/rules.

## ★★★★ THE ABSORPTION TAB — CURRENT DESIGN (do NOT make Luneth re-explain these)
The Knowledge drawer's 6th tab (`views/knowledge-foods.ts`, tab id `foods`, label "Absorption"): a curated persuasive landing. **Every choice below is SIGNED OFF this session** unless marked NEXT.

**Numbered section headers (demo style)** — the section-divider system (reusable `sectionHeader(num, kicker, headingHTML, extra)`): a big orange display number (4.5rem / 900 / track-tight) + an OPTIONAL dash-accented `.ds-kicker` + the heading. **NO L-corner brackets** (removed for good — Luneth dislikes them, do not re-add). Modelled on the demo `trace-mineral-tile-detail.html` "02 / The pivot / Not quantity. Absorption." header.
- **01 = hero.** No kicker. The "01" rides UP next to the BLACK "You are not what you eat." line (off-aligned; `align-items:start` + `-0.22em` num margin) — deliberately NOT beside the orange line below ("too much orange"). See [[accent-text-fills-space]].
- **02 = villi.** Kicker "The mechanism"; heading "What gluten does to your gut" in `.ds-h-section`.
- **03 = contrast (NEXT — not done):** the contrast section still shows the OLD `FIG·02 // GOOD FOODS & BAD FOODS` kicker; convert it to a "03" demo header next (the last FIG·NN label to retire).

**Hero chrome (top → bottom):**
- Eyebrow rule row: `THE PREMISE ——◆—— ABSORBABILITY` (orange right, `--ds-accent`). ("THE PREMISE" replaced "THE SECOND PRONG" this session.)
- **Alien corner lockup** (top-right, under the rule): the `wallach-corp // v1.0` brand in the **Fantocrypt alien font**, then `FIG·01` (dark, IDENTICAL to the demo SCAN·041: mono / micro / track-wider / `--ds-ink` / 600). Three-colour effect: orange `--ds-accent` + blue `--ds-tech` + dark `--ds-ink`.
- Playfair headline (`.kd-foods-hero__h`), then the deck (`max-width: 64ch` — wraps exactly after "The other half —").

**Fantocrypt alien-flavour text** (`views/alien-flavor.ts`, wired in `main.ts`): flavour text that can't reliably be real, useful text renders as unreadable alien glyphs (signal: "flavour, not info"). GENTLE shimmer — **800ms tick, 1–3 letters morph, lowercase, separators held** (a fast every-letter shimmer "spazzed out"). Dials: `TICK_MS`, `MAX_MORPH`. **Luneth APPROVED propagating this to other flavour spots — queued, NOT done.**

**Villi "scan"** (parametric SVG in `knowledge-foods.ts`): rounded finger-shaped villi with deterministic organic jitter (no Math.random → probe-stable). Nutrient dots share the same x-columns AND are **centred on the grid (y=64, both panels)** for a clean side-by-side read — damaged (grey) float above the stubby villi, healthy (orange) nestle among the tall ones. "villi" is a `.gloss` hover-term (bold orange). A **full-width plain-language intro** sits ABOVE the two panels; the pull-quote sits below.

**The pull-quote** (`.ds-pull-quote` / `.kd-foods-pq`): the REAL sealed Wallach verbatim **EPIGEN-000158 (Epigenetics p.598)** — gluten = a "contact enteritis" — corpus-sourced via `foodsVilliQuote()` (synced R1; page from the claim). Giant orange quote glyph, textured `.ds-mark` highlighter (needs `#ds-filter-rough` SVG, added to `dashboard.html`), `PAGE · 598` accent, footer cite. Font-size reduced so line 1 doesn't wrap on "proteins". **OCR fix:** the sealed verbatim's broken closing-quote glyph is normalised for DISPLAY only (`fixQuoteGlyph`; words byte-identical) — **FIXME: purify at source in the next reseal.**

**Files:** `views/knowledge-foods.ts` · `views/alien-flavor.ts` · `state/foods-curation.ts` + `core/schemas/foods-curation.ts` + `dashboard/assets/data/foods-curation.json` (`villi_quote` = claim id + highlight_from) · `.kd-foods-*` in `drawer-knowledge.css` · `kd_foods_*` in `view-copy.json` · `#ds-filter-rough` in `dashboard.html` · `assets/fonts/Fantocrypt.ttf` (license unverified → [[legal-copyright-pass-at-end]]) · `render_probe_knowledge.js`.

## ★ NEXT — continue the Absorption tab (Luneth has more)
1. **Contrast → "03" demo header** (+ decide the `FIG·02` fate — drop or convert).
2. **Propagate the Fantocrypt alien-flavour text** to other flavour accents (Luneth-approved, queued).
3. **Purify EPIGEN-000158's broken quote at source** (correct the `.txt` → `corpus_resnap` → USER-ONLY reseal) so the display `fixQuoteGlyph` can retire.
4. Whatever refinements Luneth brings next ("still more after this").

## ★ BACKLOG — after the Absorption design settles (nothing lost)
- **Part A — persistent absorption caveat** across Coverage / Essentials / entity pages (ONE great pointer; restraint [[persuade-dont-shove-restraint]]).
- **Coverage-tab OVERHAUL** to Knowledge-tab quality; fix the 2 fake coverage numbers (goal-card proportional fake + regimen-slot hardcoded literals). In scope (Luneth 2026-07-12).
- **Content pass (reseal):** poached-eggs EPIGEN-000155 missing-outcome + a diet-vein OUTCOME AUDIT ([[state-the-outcome-when-known]]); normalise `--`→`—` dashes in diet `answer_short`s.
- **Bulk-enrich the ~180 on-theme diet claims** into the food entities (no seal).
- **THEN resume Phase-H** (entity-page + Search overhaul) per `chronicle/OVERHAUL-BLUEPRINT.md`.
- Trace/rare small owed (therapeutic-note seal · Cal Toddy label · Group-B factor) — 2026-07-12, still valid.
- THREAD 2 (after diet/absorption): Search G-7 + book mining (SEAL the 2 unsealed search files; resume Immortality A-Z at Mn-Manganese; charged-treatise capture; lay-topic tagging; port the P2 CHARGED gate).

## ★ KEY DOCTRINE (memory files are authoritative — read at genesis)
- Design bar + HOW: [[visual-design-bar-and-principles]] (mesh art+UX; fill negative space PURPOSEFULLY; NO L-brackets; Fantocrypt for flavour; numbered headers). Reference = `dashboard/components/trace-mineral-tile-detail.html` (translate GOOD design → clean code, NEVER copy) + the "Empower" calibration anchor (`dashboard/design-wisdom/references/`).
- [[accent-text-fills-space]] — accent text FILLS negative space; content rides alongside, NEVER pushed to a separate line to avoid "clashing".
- [[narrate-named-steps]] — announce named file/step actions AS you do them (Luneth follows your steps to give feedback).
- Verify visually every chunk — screenshot + LOOK ([[screenshot-verify-visual-chunks]]); Luneth is the sign-off gate.
- Round-close: build → invariants → probe → build-log → Creator's Log → **rebuild** (re-inline the log embed) → commit + push ([[creators-log-append-gotchas]] [[log-embed-build-inline]]).
