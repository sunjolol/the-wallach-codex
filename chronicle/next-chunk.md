# ★★★ NEXT SESSION — READ THIS FIRST. Active task: PORT THE APPROVED SCANNER + REGIMEN DESIGNS LIVE.

Two full-tab redesigns are **design-approved** (Luneth signed off on the demos). The next session ports
them into the live app. **Headers are still PARKED.** Nothing below needs re-derivation.

## THE TWO APPROVED DESIGNS (final demos in `temporary/ready-to-be-ported/`)

### 1. SCANNER — the Scan · Confirm · Result flow  (APPROVED: `scanner-demo-3-verdict-r3.html`)
- File: `temporary/ready-to-be-ported/scanner-demo-3-verdict-r3.html`.
- The model (Luneth's reframe — supersedes the old single-screen verdict, and the blueprint §8 D2 that
  assumed paste-text to skip OCR): **1. Scan → 2. Confirm → 3. Result**; the verdict is withheld until
  the user confirms the reads.
  - **Scan**: an orange **New Scan** button; default = upload-an-image + a dotted "or drop / paste an
    image" box; honest local-decode language (NO fake ms). Secondary: "identify a Youngevity product
    (no OCR needed)".
  - **Confirm** (the hero): every OCR read editable; garbled words show the **top-4 suggestion
    candidates** (click-to-fix); covers **nutrients AND ingredients**; the good/bad-ingredient
    (gluten / seed-oil) flags surface with their Wallach reason.
  - **Result**: the verdict fires ONLY after Confirm, on corrected reads; reuses the demo-3
    verdict-ladder look; step titles are Unbounded with (1)(2)(3) numbered badges; the "full flow" strip
    was removed.
- The engine mostly **EXISTS** — see memory `scanner-mechanisms-recovery`: the gluten/bad-ingredient +
  ADD/SAVE/REJECT ladder is LIVE (`state/scanner.ts` `antiFlags`/`decideVerdict` + `scanner-corpus-data.json`);
  the OCR fuzzy auto-correct is LIVE (`state/ocr.ts`). The ONE piece to re-port is the interactive
  suggestion-candidate UI, intact in git at `fca48c9d^:dashboard/assets/js/legacy-dashboard.js` ~lines
  5107–5249 (`findIngredientSuspects`/`findSuggestionCandidates`/`renderHelperPanel`/`replaceWordInIngredients`) + its CSS.
- §00.A: the verdict + gluten/seed-oil reasons trace to Wallach doctrine ONLY; label amounts are the
  user's INPUT; foods are reference; counts locked to 90; scanned items marked `user_scanned` ("the wall").
- Spec: `temporary/scanner-build/sc-spec-v2.md` (flow) + `sc-spec.md` (tokens/rules/locked scenario).

### 2. REGIMEN — the Cockpit + the new save-slot switcher  (APPROVED)
- The regimen tab = the **Cockpit** (demo 1) with the **r2 tweaks already in it** — the active-stack
  panel is capped to the console height behind an orange scrollbar, and the "Scan a new item" button is
  orange — **plus the new save-slot switcher**.
- FINAL slot design: `temporary/ready-to-be-ported/regimen-cockpit-slots-tray-v6.html` (the full Cockpit
  page; also `temporary/awaiting-refinement/regimen-slots-tray-v6.html`).
  - "White footer tray" tiles: a bold saturated COLOUR BLOCK on top (name + a **pencil-rename top-right**
    + big Bruno-Ace **47/90** with "9 items · edited today" on its baseline) over a **WHITE tray** holding
    the progress bar + a 14-swatch colour picker.
  - **DEFAULT STATE, 4 tiles**, all equal width, uniform ~12px rounding, tile ~123px tall:
    1) **"My Regimen"** — active, full-saturation ORANGE (the default protocol; renamable).
    2) one **INACTIVE** saved tab ("Travel") at **opacity .39** (faded — LOWER OPACITY, not darkened).
    3) + 4) **"Empty Slot"** — dashed, ＋, "Add a save", clickable, SAME height as the filled tiles.
  - **Colour is USER-SELECTABLE** (not auto). 14-swatch spectrum palette (allowed per Luneth as the
    user's personal slot-colour palette — the ONE sanctioned exception to "no invented hues"):
    red `#e2352a` · coral `#ff7a6b` · orange `#ff7e3c` · amber `#ffb02e` · lime `#8bc34a` · green `#35c46a`
    · teal `#1fc3aa` · sky `#35b6e8` · blue `#2f6fe0` · indigo `#4a46d6` · purple `#9b5de5` · deep-purple
    `#6a30c4` · violet `#c04fd0` · pink `#f15bb5`. Swatches ~10px, gap 7px, selected = a ring.
  - **GOTCHA that cost 4 iterations:** the entrance keyframe (`ck-slotrise`) animated opacity 0→1 with
    `fill:both`, which STOMPED the inactive tile's resting opacity back to 100% after settling — so every
    opacity value looked identical. Fix (v6): the keyframe animates **transform only**. If you re-add an
    opacity fade-in, never let it hold `opacity:1`, or the faded state silently breaks again.
- Slot spec: `temporary/regimen-build/rg-slots-spec-v2.md` (the fused checklist) + `rg-slots-spec.md`.

## 2026-08-13 POLISH FIXES (already applied to both graduated finals — the port must include them)
- **Regimen slots:** card-title weight 800→600 (was over-bold); the default orange brightened/warmed to
  match the Scanner's New Scan button (active/saved `.ck-slot__top` gradient is now pure `var(--sc)` →
  `color-mix(--sc 90%, ink 10%)`, no more muddy ink-darkening); pencil-hover ROTATION removed; the
  **rename input is capped at 17 chars** (over that it glitched — a JS `input` handler truncates + restores the caret).
- **Regimen bottom button:** "Scan a new item" restyled to the Scanner's **`.ds-btn-primary`** New Scan
  button (gradient, uppercase, `+` glyph): `<button class="ds-btn-primary ck-scan"><b class="ck-scan__plus">+</b>Scan a new item</button>`.
- **Regimen 90-readout:** the squares under the 47/90 wheel are a CSS grid `repeat(45, minmax(0,1fr))`
  with `aspect-ratio:1` cells — **exactly 45 per row (2 even rows), auto-sized** whatever the covered/gap/open split.
- **BOTH tabs:** the workspace wrapper top padding (`.ck` / `.vd`) reduced `space-7 → space-4`, so there
  is less blank space above the slots / "Scan a label" (closer to the live Coverage tab).

## THE LIVE PORT (the actual work)
- **Standing rule: port live ONLY with explicit approval + STOP for visual sign-off** (screenshot, not a
  DOM probe). All writes via `safe_write`. The demos already reuse the real design-system tokens.
- **Scanner → `views/scanner.ts`** (today a v3 mockup-parity port with hardcoded theatrical timings).
  Rebuild as Scan→Confirm→Result on the real engine (`state/scanner.ts`, `state/ocr.ts`) + re-port the
  suggestion UI from `fca48c9d^`. Adopt → §31 `saveRgManual` (provenance `user_scanned`).
- **Regimen → `views/regimen.ts`** (today a fabricated scaffold). Wire the new switcher to the real slot
  state (`rgSlots_v1` in `state/regimen.ts`: `addSlot`/`duplicateSlot`/`renameSlot`/`deleteSlot`/
  `setActiveSlot`/`restoreFromTrash`), coverage (`state/coverage.ts`), recommender (`state/recommender.ts`).
  Per-slot goals = NET-NEW (extend `SlotSchema` in `core/schemas/regimen.ts`). **Per-slot COLOUR = NET-NEW**
  (add to the slot doc). Layers `views→state→core`; the anti-fakery gate forbids faked data / literals >10
  in views/state.
- **Confirm with Luneth at port time:** slot MAX — the demo is My Regimen + 1 inactive + 2 empty = **4
  total** (Luneth: "4, not 5"); state today is 1–4. And the foods DB (scanner/regimen food rows) is still
  NET-NEW — a derived artifact, never hand-typed.

## PIPELINES (persisted; gitignored `temporary/`)
- `temporary/scanner-build/` : `sc-base.html`, `sc-spec.md`, `sc-spec-v2.md`, `sc-assemble.py`.
- `temporary/regimen-build/` : `rg-base.html`, `rg-spec.md`, `rg-slots-spec.md`, `rg-slots-spec-v2.md`,
  `rg-assemble.py`, `rg-shot.js` (the screenshotter).
- Screenshot any demo: `NODE_PATH="<repo>/node_modules" node temporary/regimen-build/rg-shot.js <file.html>`

## STILL PARKED / CARRIED FORWARD
- **HEADERS**: parked until everything else is done. Do not build.
- **The 29 new corpus claims** (chronic fatigue / seizures / eye) await Luneth's rulings in the
  claim-ruling dashboard (session 603b1e2d scratchpad) — not started as a corpus write. Plus the small
  open corpus threads (`WAL-CLM-IMMORT-000023` pre-WWI→WWII, tag hygiene, the 66 draft form/absorption
  claims, potassium dead-cite repoint, germanium enrichment, `HELLS-000029/064` dup).

## STANDING WORKFLOW (unchanged)
Demos: `temporary/awaiting-refinement/` → `temporary/ready-to-be-ported/` → port live only with approval
+ STOP-for-sign-off. All repo writes via `safe_write`. Verify with your eyes (screenshot). Genesis =
Luneth opens a new session and types `genesis` himself.
