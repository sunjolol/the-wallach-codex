# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-13, end of session)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES ("older loses"). Board **62/62** green. This session shipped TWO commits, both pushed: **03c4ead0** (topic-page overlay + per-topic intros + 4 food-summary fixes) and **034fb2eb** (the FUTURIST TYPE DIRECTION). **The NEXT task is the FONT SURVEY** (below).
>
> This file is the **temporary** rolling handoff; DURABLE principles live in the memory files (read at genesis), NOT here.

## ★★★★ THE FONT DIRECTION CHANGED — read this first
The app is going **FUTURIST**. Serif display + body are OUT; **Unbounded** (display) + **Space Grotesk** (body) are IN, honoring the warm-futurism "Empower" reference. Warm cream paper + orange signal + JetBrains-Mono readouts STAY. (See [[futurist-type-direction]].)
- **HOW it's wired (INTERIM):** `dashboard/assets/styles/type-futurist.css` — an override layer loaded LAST in `dashboard.html`. Redeclares `--ds-font-display` → Unbounded and `--ds-font-serif`/`-serif-light` → Space Grotesk, overrides the 4 hardcoded-Playfair spots in `drawer-knowledge.css`, tunes the Absorption tab. Font: `assets/fonts/Unbounded-VariableFont_wght.ttf` (OFL variable, LOCAL — CSP is `font-src 'self'`, so a data: URI is blocked; must be a real file).
- **★ The sealed `design-system.css` is UNTOUCHED** — its Playfair/Merriweather/Crimson tokens are **SUPERSEDED by the override, NOT authoritative.** Read `type-futurist.css` for the live faces. (No golden re-seal happened.)
- **Numerals** now go Unbounded (the old "01/02/03 stay Playfair" plan is retired by the full-futurist pivot).
- **ONE serif carve-out:** the Absorption crown-jewel Wallach pull-quote (`.kd-foods-pq .ds-pull-quote`) keeps Playfair — the single deliberate serif accent.
- **Reversible as a unit:** remove `type-futurist.css` + its `<link>` + the Unbounded font.

## ★ NEXT — THE FONT SURVEY (Luneth's stated next task)
"Lots of instances of serif fonts we probably want to address" — a SYSTEMATIC survey:
1. **Audit every serif instance** across the whole app (grep `Playfair`/`Merriweather`/`Crimson` + `--ds-font-serif*` usages + every view) — find the opportunity areas.
2. **Decide carve-outs** per instance — which quotes/accents keep a serif (like the villi pull-quote) vs go futurist.
3. **Solve the ITALIC gap** — Unbounded + Space Grotesk have NO true italic, so italic bits (the orange "You are what you absorb.", any Crimson decks) are browser-SYNTHESIZED obliques. Pick a deliberate fix (a true-italic companion, or restyle those spots).
4. **Fold the direction into the sealed `design-system.css` PROPERLY** (change the tokens + add the Unbounded @font-face there) → **re-seal the golden (needs Luneth's sign-off)** → **retire `type-futurist.css`.** Restores single-source-of-truth.

## ★ BACKLOG (still valid)
- **HK Amish-stats verbatim expansion** — if we want the Amish pork angle back as the pork intro, expand HELLS-000004's verbatim from the Hell's Kitchen source page (folds into HK source-purification). Pork intro currently = the clean IMMORT-000229 red-meat stance.
- **Coverage-tab OVERHAUL** to Knowledge-tab quality + fix the 2 fake coverage numbers (goal-card proportional fake + regimen-slot hardcoded literals). In scope (Luneth 2026-07-12).
- **Part A — persistent absorption caveat** across Coverage / Essentials / entity pages (ONE great pointer; restraint [[persuade-dont-shove-restraint]]).
- **Content pass (reseal):** poached-eggs EPIGEN-000155 missing-outcome + a diet-vein OUTCOME AUDIT ([[state-the-outcome-when-known]]); normalise `--`→`—` dashes in diet `answer_short`s (salt's intro still shows `--`).
- **THREAD 2 — Search G-7 + book mining:** SEAL the 2 still-unsealed search files (`search-enrichment.json` + `catalog/search-entities.json` — this session edited BOTH again for the food intros + `intro_claim`); resume Immortality A-Z at Mn-Manganese; charged-treatise capture; lay-topic tagging; port the P2 CHARGED gate.
- **THEN resume Phase-H** (entity-page + Search overhaul) per `chronicle/OVERHAUL-BLUEPRINT.md`.
- Trace/rare small owed (therapeutic-note seal · Cal Toddy label · Group-B factor).

## ★ WHAT SHIPPED THIS SESSION (both pushed)
- **03c4ead0 — Topic pages + intros + content.** Food cards open topics as a shell-level OVERLAY (back = "Go back" → returns to Absorption; Explore grid still "All topics"); the kicker "Explore" links to the all-topics grid; EVERY topic shows an at-a-glance intro (was 29/58 blank) via `entityLede()` (type-aware facet priority + soft-clamp) + a new gated `intro_claim` pointer (cholesterol→EPIGEN-000151, pork→IMMORT-000229). 4 food-summary fixes (beef/salt "Yes./No." dropped, cholesterol deficiency→disease, pork clean stance). Probe +4 assertions.
- **034fb2eb — Futurist type direction** (above).

## ★ KEY DOCTRINE (memory files authoritative — read at genesis)
- [[futurist-type-direction]] (the font pivot) · [[visual-design-bar-and-principles]] · [[screenshot-verify-visual-chunks]] · [[demo-vision-not-letter]].
- [[post-write-verify-ok-line-collision]] (hook gotcha: don't echo `OK … — …` beside safe_write).
- Round-close: build → invariants → probe → build-log → Creator's Log → rebuild → commit + push.
