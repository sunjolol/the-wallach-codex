# Memory Change Log
_Created: 

Append-only. Every memory write/edit goes here.

Format:
- Date | File touched | New info | Source (user/corpus) | Confidence | Replaces / modifies / adds | Note

---

## 2026-06-13 (Phase 12 round-11) — Save-for-later + chip reasons + feature tabs + Creator's Log

Four asks in one round. Significant scope.

### Code changes (`dashboard/dashboard.html`)

**Save-for-later rename:**
1. Result-panel button HTML text "Save to wishlist" → "Save for later".
2. renderResult baseLabel "Update wishlist entry" → "Update saved item"; default "Save for later".

**For/Against chip reasons:**
3. decideVerdict refactored to push `{label, items?}` objects instead of strings. All reasons (alignment, gap-fill, goal coverage, anti-list flags, conflicts) follow the new shape.
4. Goal coverage applies `GOAL_DISPLAY_NAMES` so snake_case keys render friendly.
5. renderReasons normalizes (legacy strings → `{label: str}`) and emits rich-reason `<li>` with `.reason-label` + `.reason-chips` containing `.reason-chip` spans.
6. New CSS: `.reasons li.rich-reason` (column flex), `.reason-chips`, `.reason-chip` with For (green-bg/border) and Against (red-bg/border) variants.

**Label check + Regimen as feature tabs:**
7. Top nav HTML adds `<button class="tab-btn tab-feature" data-group="regimen">Regimen</button>` and `<button class="tab-btn tab-feature tab-feature-primary" data-group="labels">Label check</button>`.
8. Removed Regimen button from You subnav (only Snapshot + Gaps now).
9. tab-regimen panel data-group changed from "you" to "regimen".
10. groupConfig adds `regimen: { defaultTab: 'regimen', subTabs: [] }`. You's subTabs trimmed to `['stand', 'gaps']`.
11. New CSS: `.tab-feature` (gradient bg, white text, weight 700, glow shadow, hover translateY -1px, deeper active gradient). `.tab-feature-primary` adds outer accent ring (1.5px white-translucent) + letter-spacing.

**Creator's Log:**
12. HTML: `.cl-gate` enter button at bottom of tab-journey; `#creators-log` panel with terminal-bar, meta-row, sysinfo grid, four `.cl-divider` headers and four `<pre class="cl-content" id="cl-saga|lessons|decisions|changelog">` blocks, regen-note + exit button.
13. CSS: backrooms aesthetic — `.cl-screen` near-black bg with repeating-linear-gradient scanlines + radial-gradient atmosphere; phosphor-green text (#5eff8b, #4be6c2), JetBrains Mono / Consolas / Menlo font stack; `.cl-divider` with text-shadow glow; blinking `.cl-cursor` via 1.2s steps(2) keyframes; max-height 480px on `.cl-content` with custom scrollbar.
14. Embedded markdown data: 4× `<script type="text/markdown" id="cl-data-*">` blocks containing snapshot of saga / lessons / decisions / changelog content (round-11 voice, ~20KB total).
15. JS IIFE: populates the `<pre>` blocks from data scripts via textContent, wires enter/exit buttons with smooth-scroll behavior, ARIA-expanded toggle.

### Behavior

- Save-for-later button: outside edit mode reads "Save for later" / "Update saved item" depending on whether name already in wishlist. After click, "✓ Saved" / "✓ Updated" then clears.
- For/Against reasons: rich items render as colored pills inside the li, label above. Goal names friendly.
- Feature tabs: Regimen is now click-1 from anywhere. Label check has the brightest treatment.
- Creator's Log: hidden by default, toggles open on click, smooth-scrolls into view. Personal-only.

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-11 sub-section. Documents the four asks + the tonal significance of the Creator's Log (first instance of the dashboard rendering its own memory layer as a UX surface).

### Source / confidence

User-driven. High confidence on the four surface changes (additive, scoped, no structural risks). The Creator's Log content is a snapshot — next 'dashboard' regen refreshes it; this is documented inline.

---

## 2026-06-13 (Phase 12 round-10) — Edit-mode commit-path discipline + saveToWishlist dedup

User found a duplicate-creating loop: Regimen Full edit on HYDRA → scan → click Save-to-wishlist creates duplicate wishlist entry + clearForm exits edit mode silently without committing the actual edit. Asked broadly for a fix to "these sort of silly loops the user could fall into where they accidentally add stuff to their regimen through little glitches like this."

### Code changes (`dashboard/dashboard.html`)

1. **`saveToWishlist` dedups by name and returns a boolean.**
   - Looks up existing entry with same name (case-insensitive, trimmed). If found, updates in place — preserves original `id` + `addedDate`, writes new fields, stamps `updatedDate`. If not found, unshifts new entry.
   - Returns `true` on update, `false` on new — caller uses this to set the confirmation label accurately.

2. **New helper `isInWishlist(name)`** — same name-comparison logic as the dedup, used by renderResult for the button-label preview.

3. **`renderResult` rewired with edit-mode discipline:**
   - Reads `lcGetEditTargetId()` at render time to detect edit mode.
   - **Edit mode:** hides `lc-save-btn`, `lc-regimen-btn`, `lc-user-notes`. Appends (or shows) a `.lc-result-edit-note` amber pill: "✎ You're editing an existing regimen item. Use **Save changes** in the orange banner above to commit your edits, or **Cancel** to discard."
   - **Normal mode:** restores button visibility. Save button label is "Update wishlist entry" if `isInWishlist(name)`, else "Save to wishlist." After click, button shows "✓ Updated" or "✓ Saved" based on `saveToWishlist`'s return; reverts to the previewing base label before clearForm runs.

4. **New CSS `.lc-result-edit-note`** — amber-toned gradient pill matching the edit banner's visual semantics. Bold strong elements use the same darker amber as the banner. Flex-fills the actions row so layout doesn't collapse when buttons are hidden.

### Pre-existing dedup checks confirmed

- `addToRegimen`: already dedups by name (`r.items.find(...)` early return). No change needed.
- `pushRecentScan`: already filters out same-name entries before unshifting. No change needed.

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-10 sub-section. Documents the trap, the three coordinated fixes, and the "defense-in-depth" framing for accidental-duplicate prevention. Notes a couple of related loops out-of-scope for this round.
- `memory/essence/decisions.md` — Dashboard v1.6 round-10 section. Codifies "edit mode is sacred," the dedup discipline, and the three-layer defense pattern.

### Source / confidence

User-reported with broad question. High confidence — three independent fixes, each surgical:
- Hide buttons in edit mode (CSS display:none + content swap, fully reversible).
- Dedup-on-save (additive logic, doesn't change semantics for the new-entry path).
- Action-previewing labels (read-only state inspection, no side effects).

The user's existing duplicate from the trap (if any) can be removed via the wishlist's × delete button; no auto-cleanup to avoid touching data the user might want.

---

## 2026-06-13 (Phase 12 round-9) — Subnav-centering bug fix + scan readability + green In-regimen

User had to tell me twice that subtabs weren't centering. I was wrong both times that the CSS was sufficient. Round-9 fixes that plus two other scan-panel polish items.

### Code changes (`dashboard/dashboard.html`)

1. **Subnav centering via wrapper flex**:
   - HTML: wrapped each `<nav class="subtabs">` in `<div class="subnav-wrap">`.
   - CSS: `.subnav-wrap { display: flex; justify-content: center; margin-bottom: var(--space-7); }`. The wrapper-flex pattern is the reliable centering technique that doesn't depend on the cascade.
   - CSS: `.subnav-wrap:has(> nav.subtabs.hidden) { display: none; }` hides the wrapper when the inner nav is hidden (no phantom 28px gap on Journey/Label-check).
   - Removed `margin: 0 auto var(--space-7) auto` and `width: fit-content` from `nav.subtabs` itself (no longer needed; wrapper does it).
   - Responsive: added `.subnav-wrap { width: 100% }` to the mobile breakpoint so it spans full width with the nav inside.

2. **Scan-panel font bumps (+1 to +2.5px across)**:
   - `.reasons h4` 12px → 13px; `.reasons li` 14px → 15px (line-height 1.45 → 1.5)
   - `.alignment-row` 14px → 15px
   - `.lc-section-label` 12px → 13px; `.lc-section-hint` 11.5px → 12.5px
   - `.gap-fill-table` 13px → 14.5px; headers 11px → 12px; cell padding 9px → 10px
   - `.anti-flag` 12px → 13px; `.anti-flags-empty` 13px → 14px; `.anti-flag-card` 13px → 14px (line-height 1.5 → 1.55)
   - `.anti-flag-card .af-pill` 11px → 12px; `.af-severity` 10px → 11px
   - `.anti-flag-card .af-terms` 13.5px → 14.5px; `.af-terms-label` 12px → 13px; `.af-nuance` 13.5px → 14.5px (line-height 1.55 → 1.6); `.af-note` 13.5px → 14.5px (line-height 1.6 → 1.65)
   - `#lc-goal-evidence .goal-row` 12px → 13.5px (padding 8/11 → 10/13); `.goal-name` 13px → 14.5px (margin-bottom 4 → 6); `.trigger-chip` 11px → 12.5px (padding 1/8 → 2/9); `.goal-triggers` gap/margin tightened slightly; `.nut-why` 11.5px → 13px (line-height 1.4 → 1.5); `.goal-empty` 12.5px → 13.5px (padding 8/12 → 10/14, line-height 1.55 added)

3. **Green Add-to-regimen button (vs teal Save-to-wishlist)**:
   - `.lc-btn-regimen` background `var(--teal-deep)` → `#2e8b3d` (pure green)
   - Hover `#0f3a35` → `#266f31`
   - `.committed` state `var(--ok)` → `#266f31` with inset 1px gleam
   - Differentiates the two side-by-side primary actions visually — regimen is the more important commit and now reads that way at a glance.

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-9 sub-section. Documents the apology + the lesson about deferring to the user's eyes when CSS analysis disagrees.
- `memory/essence/lessons.md` — new lesson "When the user says 'still not centered,' stop defending the CSS and switch techniques" + a hierarchy of reliability for centering techniques (wrapper-flex highest, text-align lowest). Also surfaces the broader discipline: user's eyes are ground truth, my model loses to their screenshot.

### Source / confidence

User-driven, twice-flagged. High confidence on the wrapper-flex centering (it's the most reliable CSS centering technique). High confidence on font bumps (additive, no layout collisions). High confidence on the green button (single color swap, no structural changes).

---

## 2026-06-13 (Phase 12 round-8) — Theme revert; menu prominence + Profile-pill removal kept

User pressure-tested round-7's four themes in browser. Only Eclipse landed conceptually, but its accent/text colors weren't adjusted for the dark surface — plus the whole thing lagged. Lag traced to `backdrop-filter: blur(14px)` on `.container` (a tall element, expensive even GPU-accelerated). User asked to revert the visual changes while keeping menu improvements; theme will return as a properly perf-budgeted dark mode in a future round.

### Code changes (`dashboard/dashboard.html`)

**Removed:**
1. **All four `body.theme-*` CSS blocks** (mist / aurora / verdant / eclipse) + the Eclipse targeted element overrides (cards, navs, picker, footer, pills).
2. **`.container backdrop-filter` rule** for non-mist themes — the perf killer.
3. **`backdrop-filter` from `nav.tabs` and `nav.subtabs`** — added in round-7, unnecessary cost.
4. **`--container-grad-*` and `--header-veil-*` tokens** from `:root` — orphaned after theme blocks removed.
5. **body class attribute** — back to `<body>` (no class).
6. **4-theme picker** (HTML buttons "Mist/Aurora/Verdant/Eclipse" with data-theme attrs).
7. **Theme picker JS** that applied body classes.

**Restored to round-6 form:**
8. **`.container` background + box-shadow** to direct rgba values.
9. **`header::before` veil** to its original cream-gradient.
10. **Background picker HTML** — three circular swatches labeled 3 / 4 / 5 with `data-bg` attrs.
11. **Background picker CSS** — 22×22 circular swatches.
12. **Background picker JS** — applies `--bg-image` CSS variable directly (no body class). localStorage key `dashboardBg`. Migrates old `dashboardTheme` setting silently → default bg 3.
13. **nav.subtabs background opacity** lifted slightly (0.55 → 0.75) since there's no longer backdrop-filter to give the glass impression.

**Kept from round-7:**
14. Top tabs centered (`margin: 0 auto`), 13px×32px padding, 16px font, 10px radius, deeper active box-shadow.
15. Subtabs centered (`margin: 0 auto`), pill-shaped (999px radius), 9px×24px padding, 14.5px font, weight 600, gradient active state with inset gleam.
16. "Profile populated" pill removed from header-meta (user-confirmed).
17. Updated 2026-06-13 + Brain v2.8 pills.

**Assets preserved (not deleted):**
- `theme-aurora.jpg`, `theme-verdant.jpg`, `theme-eclipse.jpg` remain in `assets/` — cataloged for the future theme work.
- `dashboard-v1.5-pre-theme.html` backup remains (intermediate snapshot per the mount staleness, but kept as a safety net).

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-8 sub-section. Documents the "Mist as revert" pattern earning its keep AND the lesson that ROUND-7 BUNDLED TOO MUCH into one push.
- `memory/essence/lessons.md` — new lesson "Visual identity changes are a separate concern from structural refactors — don't ship both in one round." Codifies the discipline: structural refactor first (preserving existing visual), then menu/prominence, then visual identity, each independently revertible.

### Source / confidence

User-driven revert with explicit scope ("revert the theme but keep menu work"). High confidence — clean removal of round-7 additions, structural state matches round-6 for everything visual except the kept menu prominence + Profile pill removal.

---

## 2026-06-13 (Phase 12 round-7) — Visual overhaul: 4-theme system + nav prominence

User asked for a wholesale visual identity shift after pointing at eight reference dashboards spanning light-glass, mid-nature, and dark-saturated aesthetics. Dashboard now ships four themes selectable via body class; new generated backgrounds; nav prominence boost; "Profile populated" pill removed.

### Backup

`dashboard-v1.5-pre-theme.html` created via bash `cp` (the sandbox mount was stale so this is an intermediate snapshot, not literal current state). **The reliable revert path is the Mist theme in the picker** — Mist preserves the prior teal-glass identity exactly, so reverting from any new theme is one click.

### Code changes (`dashboard/dashboard.html`)

1. **Theme token system added** to `:root` — `--container-grad-top/mid/bot`, `--container-edge-1/2`, `--container-shadow-1/2`, `--container-inner-gleam`, `--container-inner-border`, `--header-veil-1/2/3`. Defaults reproduce the round-6 Mist look.

2. **Four `body.theme-*` scopes** in the main CSS:
   - **theme-mist**: `--bg-image: url("assets/background-3.jpg")`. No other overrides — defaults flow.
   - **theme-aurora**: `--bg-image: url("assets/theme-aurora.jpg")` + cool light container/veil tones.
   - **theme-verdant**: `--bg-image: url("assets/theme-verdant.jpg")` + warm cream container/veil tones + deeper accent shadow.
   - **theme-eclipse**: `--bg-image: url("assets/theme-eclipse.jpg")` + full inversion of `--ink/--surface/--teal-tint/--teal-veil/--teal-mist` to dark variants + `--teal/--teal-deep/--teal-mid` shifted to lighter accents for legibility + `--warn-bg/--alert-bg/--crit-bg/--ok-bg` softened to 22-30% opacity. Plus targeted overrides for `.card`, `nav.tabs/subtabs`, `.bg-picker`, `.bg-swatch`, `.pill`, `footer`.

3. **`.container` background + box-shadow rewritten** to read from the new tokens.

4. **`header::before` veil gradient rewritten** to read from `--header-veil-*` tokens.

5. **`body` element default class**: `<body class="theme-mist">`.

6. **Nav prominence boosts:**
   - `nav.tabs`: padding 5px→6px, gap 2px→3px, `margin: 0 auto var(--space-5)` (centered), added `backdrop-filter: blur(10px)`, deeper box-shadow.
   - `.tab-btn`: padding 10px 22px → 13px 32px, font-size 14px → 16px, border-radius 8px → 10px, active state box-shadow strengthened.
   - `nav.subtabs`: pill shape (border-radius 8px → 999px), padding 5px → 6px, centered (`margin: 0 auto var(--space-7)`), backdrop-blur 8px.
   - `.subtab-btn`: padding 7px×18px → 9px×24px, font-size 13px → 14.5px, font-weight 500 → 600, pill shape (border-radius 6px → 999px), gradient active state with inset gleam.

7. **Theme picker HTML and CSS** updated:
   - Buttons now labeled Mist / Aurora / Verdant / Eclipse with `data-theme` instead of `data-bg`.
   - `.bg-swatch` padding/styling updated for word-label widths instead of single digits.
   - `.bg-picker` backdrop-filter 4px → 8px.

8. **Theme picker JS rewritten**: applies body class instead of CSS variable. Persists to `localStorage.dashboardTheme` (key migration from `dashboardBg`/`bg-3/4/5` defaults silently to `mist`). Exposed array: `['mist', 'aurora', 'verdant', 'eclipse']`.

9. **"Profile populated" pill removed** from `header-meta`.

### Assets created

- `dashboard/assets/theme-aurora.jpg` (116KB) — bright sky/cream gradient + horizon glow + light particles.
- `dashboard/assets/theme-verdant.jpg` (119KB) — forest-green/golden gradient + golden-hour corner glow + sunbeam dust particles.
- `dashboard/assets/theme-eclipse.jpg` (170KB) — dark saturated teal-emerald gradient + aurora glow blobs + scattered star particles.
- All generated programmatically via `/tmp/gen_bg.py` (PIL — vertical gradient + soft-blurred radial color blobs + pixel noise + particle dots + Gaussian blur).

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-7 sub-section. Documents the wholesale-shift framing, the eight-reference inspiration, the "revert = pick Mist" pattern, and the programmatic-background generation strategy.
- `memory/essence/decisions.md` — Dashboard v1.6 section. Codifies the four-theme architecture, the token-based container/header refactor, the action-color invariance, and the "backdrop-filter is the only glass effect" performance discipline.

### Source / confidence

User-driven visual overhaul. High confidence on Mist/Aurora/Verdant (light/mid-tone, original token overrides work). Moderate confidence on Eclipse (dark mode requires surface/ink token inversion — some hardcoded rgba() shadows may look slightly off until per-element audits; bash sandbox mount staleness during this round means some unit-level verification deferred to user reload). User has explicit in-UI revert via picker if Eclipse needs more work.

---

## 2026-06-13 (Phase 12 round-6) — Three-tier action color system + swappable background

### Code changes (`dashboard/dashboard.html`)

**Color tokens:**
1. **`--alert` / `--alert-bg` / `--alert-deep` added** (`#c95f2a` / `#fbe4d2` / `#934220`) — orange tier for reversible destructive actions.
2. **`--warn-deep` / `--crit-deep` added** for hover/active states in their respective tiers.

**Action class restyling (Cancel/Clear → warn-yellow):**
3. **`.lc-btn-tertiary`** (Clear all fields, Add-form Cancel): warn-bordered, warn-deep text, warn-bg on hover.
4. **`.rg-edit-actions .rg-cancel-btn`** (Quick edit Cancel): warn-bg background, warn-deep text, warn-bg on hover.
5. **`.lc-modal-actions .modal-cancel`** (modal Cancel): warn-bg background, warn-deep text, warn-bg on hover.

**Action class restyling (Remove reversible → alert-orange):**
6. **`.rg-card .rg-actions .rg-remove`**: alert-bg background, alert-deep text. Hover: solid alert with white text.
7. **`.wish-card .regimen-remove`**: same alert pattern.
8. **`.lc-drop-zone .clear-img`** (× to clear label image): alert-bg, alert-deep.
9. **`.lc-image-thumb .thumb-x`** (× on label image thumbnails): alert-bg, alert-deep.
10. **`.nutrient-table .remove-row`** (× on a nutrient row): alert tone.

**Action class restyling (Delete permanent → crit-red):**
11. **`.wish-card .delete-btn`** (× to delete from wishlist): now always faintly visible (opacity 0.55) with crit-bg + crit text; hover goes solid crit with white text.
12. **`.lc-modal-actions .modal-confirm.danger`**: already crit, hover now uses crit-deep.

**Restore (positive complement → ok-teal):**
13. **`renderRegimenCard` JS**: button class is now `rg-remove` OR `rg-remove rg-restore` depending on `item._removed`. New `.rg-restore` CSS overrides the alert tier with ok-bg + ok text + ok hover.

**Swappable background:**
14. **`--bg-image` CSS variable** added at `:root`; default = `url("assets/background-3.jpg")`. Both `body` and `.atmosphere` now read from the variable.
15. **`.bg-picker` HTML** added to header-meta — small pill labeled "THEME" with three swatch buttons (3, 4, 5).
16. **`.bg-picker` + `.bg-swatch` CSS** — translucent backdrop-blur pill with circular swatches; active state uses teal solid.
17. **Background picker IIFE** added at top of `<script>` block — reads `localStorage.dashboardBg` (default 3), applies on init, wires click handlers, persists choice.

**Header pill content refresh:**
18. **Updated 2026-06-12 → 2026-06-13.** **Brain v2.5 → v2.8.**

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-6 sub-section. Captures the three-tier rationale + the "swappable asset pattern" framing.
- `memory/essence/decisions.md` — Dashboard v1.5 round-6 section. Documents the color tier system, the `--alert` token, the CSS-variable approach to themable assets, and the "visual semantics match behavioral semantics" framing.

### Source / confidence

User-driven visual-polish ask. High confidence on the three-tier color system (additive, fully scoped to specific classes, no global side effects). Background picker is also low-risk (CSS variable + small JS IIFE + localStorage). Verification: user reload + click through; reload should restore last-chosen background.

---

## 2026-06-13 (Phase 12 round-5) — Goal evidence thresholds + strong/weak keyword split + grid layout

Round-4 shipped the Goal evidence panel without thresholds; round-5 added the filtering logic and compact layout. Three coordinated fixes against user critiques from the granola test.

### Code changes (`dashboard/dashboard.html`)

1. **`matchGoalsRich(label, gapFills)` rewritten** to split keyword hits by location and apply the meaningful-nutrient threshold. Strong = name/category/brand keyword. Weak = ingredients-only keyword. Threshold = ≥10% of Wallach daily target per serving. Framework-adjacent nutrients (no Wallach target) only surface when paired with a strong keyword on the same goal. Pre-computes `nutrientStats` map (pctOfTarget per nutrient) before goal loop.

2. **`scan()` passes `gapFills` to `matchGoalsRich`** (signature change, internal).

3. **CSS layout overhaul** for `#lc-goal-evidence`:
   - `display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px;` — wraps horizontally, sizes to content.
   - Tighter padding (8/11px), smaller fonts (12-13px on body, 13px on goal name, 11px on chips).
   - New `.trigger-chip.pct` style for nutrient-with-percentage chips (teal-mist bg, bold).
   - Empty state styled as soft-dashed pill spanning the full row width.

4. **`renderResult` Goal evidence block updated** to use `m.strongKws` + `m.nutrientMatches` (new structure). Nutrient chips display "Nutrient +N%" when pctOfTarget known; framework-adjacent nutrients show name only. Empty state copy is informational ("No nutrient delivers ≥10% ... product isn't meaningfully contributing to any tracked goal in practical terms").

### Granola test case (Oat Haus Cookies & Cream)

Before: 6 goal cards (Cognition via trace lecithin, Energy via Iron 8%, Gut via Dietary Fiber duplicates, Bone via Calcium 1%, Sleep via Calcium 1%, Hydration via Sodium 8%). All trivial signal.

After: 0 cards. Empty state explains why. Verdict (SAVE FOR LATER, soft gluten flag) unchanged. Accurately portrays granola as low-signal toward goals.

### HYDRA test case (regression)

Before: 2 cards (joints + hydration) with all nutrients listed regardless of dose.

After: 2 cards. Joints card shows "collagen" strong kw chip + Collagen Peptides chip (framework-adjacent, paired). Hydration card shows "sparkling beverage" strong kw chip + Sodium +17% chip. Other trace nutrients (Calcium 1%, Magnesium 1%, Potassium 0.5%) correctly filtered out. Cleaner than before, more honest.

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-5 sub-section.
- `memory/essence/decisions.md` — Dashboard v1.5 round-5 section. Documents the strong/weak split, threshold rationale, framework-adjacent rule, the dose/source/context pitfall connection across brain + dashboard layers.

### Source / confidence

User-driven press-test. High confidence — explicit threshold applied uniformly, three test cases validated (granola → 0 cards, HYDRA → 2 meaningful cards, neither shows trivial signal).

---

## 2026-06-13 (Phase 12 round-4) — Goal evidence + living-system north star

User tested with Oat Haus Cookies & Cream Granola — result said "Goals matched: cognition" without explaining why. Concrete ask: surface the trigger (e.g., sunflower lecithin in ingredients) + brief Wallach-grounded snippets per contributing nutrient. The user's framing under the concrete ask was the bigger gift — articulated the living-system design philosophy as a long-term steering document.

### Code changes (`dashboard/dashboard.html`)

1. **`NUTRIENT_TO_GOAL_MAP`** added — 14 goal categories × Wallach-anchored nutrients with brief why-snippets. Framework-adjacent items (Collagen for joints/skin) explicitly labeled. Three-tier source discipline preserved.

2. **`GOAL_DISPLAY_NAMES`** added — friendly UI strings (`cognition` → `Cognition`, `hormones_strength` → `Hormones / strength`) used everywhere goals surface.

3. **`matchGoalsRich(label)`** added — returns structured matches: `{ goal, triggers: [{type: 'keyword', values: [...]}, {type: 'nutrient', nutrient, why}, ...] }`. Keyword trigger captures which ingredient/name/brand keyword fired (cap of 4 to keep display tight). Nutrient trigger captures which label nutrients map to the goal per Wallach.

4. **`matchGoals` (string array)** preserved as backward-compat wrapper — existing consumers (saveToWishlist, reasonsFor, regimen card paths) unchanged.

5. **`scan()` returns both `result.goals` and `result.goalMatches`** — string-array for compat, rich structure for the new evidence panel.

6. **`renderResult` populates two surfaces:**
   - Inline `lc-goals-matched` chip uses friendly display names.
   - New `lc-goal-evidence` panel shows per-goal cards: friendly name + trigger chips (italic for keyword-from-text, plain for nutrient-from-label) + nutrient why-list with italic Wallach snippets.

7. **New CSS** for `#lc-goal-evidence` + `.goal-row` + `.trigger-chip` + `.nut-why` + `.lc-section-hint` — teal-veil card with teal-accent left border, scannable typography, italic small-text for the Wallach snippets so they don't compete with the verdict + alignment rows.

8. **HTML inserted** in `#tab-labels` result panel between the alignment-row and the gap-fill table.

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-4 sub-section. Documents both the concrete shipped feature and the user's articulation of the north star, with the "fantasizing as creator" caveat preserved (it's orientation, not a feature spec).
- `memory/essence/decisions.md` — two new sections:
   1. "Dashboard v1.5 round-4 — Goal evidence" — implementation decisions (the canonical map, the rich/compat split, the panel placement).
   2. "North star — Living-system design philosophy" — five principles (Data over recommendation; Projection is power; Growth over time; Wisdom in defaults / freedom in choice; Clean and navigable without being thin) + the organic-relationship framing + what this rules out + the still-Wallach-corpus-as-engine reaffirmation. Codified as load-bearing steering for every future iteration.

### Source / confidence

User-driven press-test + user-articulated design philosophy. High confidence on implementation (additive, no churn to existing paths). The north-star section is the user's framing transcribed as faithfully as possible — the codification itself is reversible if the user wants different framing.

---

## 2026-06-13 (Phase 12 round-3 calibration) — Terminal-action form reset

User surfaced one polish gap: scan-related fields persist after terminal actions, including across page refresh (browser form-state restoration). Five clearForm() calls wired in to enforce the user's stated rule.

### Code changes (`dashboard/dashboard.html`)

1. **renderResult Save-to-wishlist handler** — clearForm() inside the setTimeout(1500ms) so the ✓ Saved confirmation is visible before reset.
2. **renderResult Add-to-regimen handler** — clearForm() inside a setTimeout(1500ms) after the ✓ In regimen badge appears.
3. **renderWishlist regimen-btn handler** — clearForm() inside a setTimeout(1500ms). Even though this path doesn't touch the form directly, it's a terminal action on a product and resets the dashboard's "current product" context.
4. **lcExitEditMode** — clearForm() added, plus the banner's appended `.lc-edit-hint` is removed. Fires for both Save changes and Cancel. Safe with returnToRegimen=true; clear runs in background.
5. **init()** — clearForm() added after the initial addNutrientRow setup. Defends against browser autofill / form-state restoration on page refresh. lcEditTarget in localStorage persists independently and re-engages when the labels tab is opened.

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-3 sub-section. Documents the user's "current product context" mental model and the 1500ms confirmation-then-reset UX pattern.
- `memory/essence/decisions.md` — Dashboard v1.5 round-3 section with the five clearForm rationales.

### Source / confidence

User-driven press-test (round 3, polish-level). High confidence — clear bug fix to a specific rule the user stated explicitly.

---

## 2026-06-13 (Phase 12 round-2 calibration) — Ingredients persistence + OCR known-name pass + Active recommendations prominence

User press-tested Full edit a second time. Three concrete fixes in the same patch.

### Code changes (`dashboard/dashboard.html`)

1. **`lc-ingredients` placeholder rewritten** to `"Paste the ingredient list from the label (or use Auto-detect on an uploaded image)…"` — was a near-verbatim opening of HYDRA's real ingredient list which the user mistook for state.

2. **`lcPopulateFormFromItem` approximate detection extended to `stash.nutrients`** (in addition to `item.nutrients`). When triggered, the ingredients field is also cleared, not just nutrient rows. Hint copy updated. Catches the case where round-1 save committed the placeholder nutrient data with the `from gap-fill summary` form marker into `_lc_label.nutrients`.

3. **`parseOcrText` gains a known-nutrient-name pass** (third pass after forward line-anchored + reversed-format). Allow-list of ~40 nutrient names (multi-word first), with optional parenthetical tolerance `(?:\([^)]{1,30}\)[\s,]*)?` between name and value. Catches `Calcium 20mg`, `Vitamin C (Ascorbic Acid) 45mg`, etc. when Tesseract PSM 6 collapses the nutrition panel into single lines.

4. **`.recommendations-section` + `.recommendations-card` CSS** — teal-pill heading + gradient teal-veil card with teal-accent left border + 15.5px list items + teal-deep bolded labels. Active recommendations promoted from generic `.card` to hero treatment on Snapshot. Mobile-responsive.

5. **HTML wraps the Active recommendations block** in the new section/card class.

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 round-2 sub-section appended; surfaces the pattern that calibration rounds are about polish, not architecture, now that the dashboard has matured.
- `memory/essence/decisions.md` — Dashboard v1.5 round-2 section with the three fix rationales.
- `memory/essence/lessons.md` — two new lessons: "Placeholder text in a form field can be mistaken for real content" + "Tesseract PSM 6 collapses tables; line-anchored regex needs a whole-text fallback".

### Verification

Structural verification via Read tool on `parseOcrText` (all three passes), `lcPopulateFormFromItem` (new branching logic), and the new CSS section. Browser walk-through is the user's verification step.

### Source / confidence

User-driven press-test (round 2). High confidence on placeholder + recommendations styling (visual polish, low risk). Moderate confidence on the OCR known-name pass — restricted by allow-list so false positives are bounded, but new-shape parsing is always somewhat empirical.

---

## 2026-06-13 (Phase 12 calibration, post-press-test) — Full edit form/OCR fixes

User press-tested Full edit on HYDRA DNA (the regimen item lacking real `label_data`) and surfaced six issues in one round. All six addressed in the same patch as the essence updates per brain v2.8.

### Code changes (`dashboard/dashboard.html`)

1. **`OCR_FUZZY_DICT` widened** — added "fiber", "soluble", "dietary", "prebiotic", "peptide(s)", "collagen", "calories", "ocean", "sea", "trace", "mineral(s)", "electrolyte(s)", "sparkling", "infused", "beverage", "berry", "punch", "flavour(s)". User-confirmed: "ocean trace minerals" residual false positive is acceptable (too generic to be a usable match anyway; surfacing logic correct).

2. **`lcNutrientLooksApproximate(n)` helper added** — detects Phase-11 self-heal placeholders (`form: 'from gap-fill summary'` OR `unit: '% of Wallach target'`).

3. **`lcPopulateFormFromItem` discriminates** — prefers `_lc_label` stash (real prior-edit data); falls back to `item.nutrients` only when no approximate marker present; otherwise starts empty + adds an amber `.lc-edit-hint` to the banner explaining why.

4. **`lcSaveEditedItem` clears `nutrient_note`** in the override patch so next load sees real-data semantics.

5. **`clearForm` wrapper no longer auto-exits edit mode** — banner stays, user can clear → re-scan → save.

6. **`parseOcrText` forward-pattern post-validation** — balanced parens, no `:` / `;`, ≤4 words, ≥1 word ≥4 chars. Rejects "Fo COLLAGEN To) Potassium 25 mg" without dropping legitimate multi-word nutrient names.

7. **`parseOcrText` reversed-format pass** — second regex catches `N{unit} NUTRIENT_NAME` patterns from can-front graphics; restricted to allow-list (collagen, protein, fiber, peptides, calcium, magnesium, potassium, sodium). Dedup against forward-format hits.

8. **`.lc-edit-hint` CSS** — amber-toned italic block under the banner label, used to explain when nutrient form starts empty due to approximate-data suppression.

### Docs in the same patch

- `memory/essence/saga.md` — Phase 12 calibration sub-section appended.
- `memory/essence/decisions.md` — Dashboard v1.5 calibration pass section: form discrimination, clear-preserves-mode, OCR post-validation, reversed-format catch, Collagen tracking philosophy, dictionary widening.
- `memory/essence/lessons.md` — two new lessons: "Derived data is a display fallback, never a form input" + "OCR lazy regex over-captures noise prefixes".
- `memory/open-threads.md` — calibration-pass closure noted (no new active items).

### Verification

Structural verification via Read tool on the modified IIFE sections + `parseOcrText` + `lcPopulateFormFromItem`. Browser walk-through is the user's verification step.

### Source / confidence

User-driven press-test. High confidence on the form discrimination + clear-preserves-mode (clear bug fixes). Moderate confidence on the OCR reversed-format allow-list — limited to common items the user explicitly named; widening can happen if real-world labels surface more cases.

---

## 2026-06-13 (Phase 12, late) — Tab consolidation v1.4 → v1.5 + Edit-item → Label Check integration

Paired backburner items from Phase 11 closed. This was the first session that loaded brain v2.8 cleanly from session start (prior agents got v2.4 cold and accumulated rules inline). User picked Option A from the proposal (4 tabs with subnav) + tab-swap-with-auto-populate for the Edit flow.

### `dashboard/dashboard.html` patches (10 surgical Edits, all on the same file)

1. **CSS additions** (lines ~230-310): `nav.subtabs` + `.subtab-btn` + active/hover/hidden states; `.lc-edit-banner` amber-themed (gradient bg, left-border accent) with `.lc-edit-actions` group containing Cancel + Save changes buttons. Mobile responsive (subtabs full-width on small screens; banner flexbox-stacks).

2. **Top nav replacement** (lines ~1143-1151): 7 buttons collapsed to 4. Top-level buttons now use `data-group="you|journey|knowledge|labels"` instead of `data-tab`. Two `<nav class="subtabs">` rows added — one for "you" (Snapshot / Regimen / Gaps with Snapshot default), one for "knowledge" (WHY-layers / Tools with WHY-layers default).

3. **`data-group` attributes** added to all 7 existing `<section class="tab-panel">` elements (tab-stand → "you", tab-journey → "journey", tab-gaps → "you", tab-why → "knowledge", tab-regimen → "you", tab-tools → "knowledge", tab-labels → "labels").

4. **Edit banner HTML** inserted in `#tab-labels` immediately after `.lc-hero`. Contains `#lc-edit-name` placeholder + Cancel/Save-changes button row. `.hidden` by default.

5. **Tab-switching JS rewrite** (replaces old 16-line block at ~line 4163). New surface: `groupConfig` map (4 groups, each with `defaultTab` + `subTabs[]`), `activateGroup(group, requestedTab?)` function that drives both top-level and subnav button updates + panel visibility + per-tab init + `lcHandleEditTarget` invocation. Exposed as `window.activateGroup` for cross-tab navigation.

6. **`renderRegimenCard`**: added `<button class="rg-edit-full">Full edit</button>` button between Quick edit and Remove. Quick edit tooltip updated to point at Full edit for full-label edits.

7. **`renderEditForm`** copy updated — removed "the Label Check tab integration is queued" line; replaced with "click **Full edit** on the card — it jumps to Label Check with the form pre-populated."

8. **`bindRegimenCardActions`**: new handler binds Full edit click → `localStorage.setItem('lcEditTarget', id)` + `window.activateGroup('labels')`.

9. **Edit-target integration block** added before `function init()` (~80 lines): `lcGetEditTargetId / lcClearEditTarget / lcFindRegimenItem / lcPopulateFormFromItem / lcExitEditMode / lcSaveEditedItem / lcHandleEditTarget`. Form populates from `_lc_label` stash if present (round-trip preserved), else from unified-item nutrient list. Save writes `name`, `category`, `dose_text`, `nutrients`, `has_nutrient_data`, `ingredients`, `_lc_label`, `_last_full_edit` to `rgOverrides_v1[id]`, then clears the target and routes back to Regimen subnav.

10. **`clearForm` wrapper** in `init()`: clear-all-fields now calls `lcExitEditMode(false)` first if `lcEditTarget` is set — prevents stranded banner after a clear.

### Docs in the same patch (brain v2.8 real-time-essence discipline)

- `dashboard/README.md` — "Three tabs" section replaced with "Four top-level tabs (v1.5 — consolidated from 7)" structure description including subnav layout and Full edit description.
- `memory/essence/saga.md` — Phase 12 entry appended after Phase 11 (correct chronological order).
- `memory/essence/decisions.md` — Dashboard v1.5 (Phase 12) decisions block: 4-tab rationale, group routing, edit flow choice + reasons, round-trip storage shape, clear-auto-exit, Quick vs Full edit distinction.
- `memory/essence/lessons.md` — new lesson "Bash mount can desync from host writes (2026-06-13, Phase 12)" — describes the mid-session mount-staleness pattern and the route-around discipline (Read tool for live view, Write to fresh path for end-to-end JS validation when needed).
- `memory/open-threads.md` — Edit-item + tab-consolidation removed from Paused list; user-stack.json sync retained; added a "You-tab default sub-tab is soft" note for the parked Option C alternative.

### Verification notes

`node --check` validation through bash was blocked by a mount-cache divergence — bash kept seeing the pre-Phase-12 snapshot of dashboard.html even after multiple Edits succeeded on the host. Read tool confirmed the file was structurally intact end-to-end (script block 4259-7439, all functions balance, IIFE closes). Browser is the true ground truth; user should reload the dashboard and walk the new tabs to confirm.

### Source / confidence

User-driven (paired-backburner items + clarifying questions in session). High confidence on the implementation shape; soft confidence on default-tab choice (parked as a usage-informed flip-point).

---

## 2026-06-13 (post-v2.8) — Stale scratchpad tombstoned (rm blocked by sandbox)

**Tombstoned (NOT deleted) `brain/pending-v2.7-additions.md`** — a draft file from Phase A that was already committed to `brain/current.md` during Phase C but never deleted at merge time. User noticed on reload of the brain folder and asked "what is this file for?" — confirming the stale-scratchpad failure mode. Attempted to `rm` the file; sandbox returned "Operation not permitted" (the agent shell can't unlink user-mounted files). Workaround: overwrote the file with a tombstone that explicitly labels its content as merged + safe to delete, so any future agent reading it gets a clear "not pending work" signal even though the file persists until user manual cleanup.

Verified before delete: all content in the pending file (the two new pitfalls, the label_scorer tool surface entry, the Pre-Answer Checklist additions #6 and #15) is live in `brain/current.md` lines 78, 171, 180, 215, 216. The pending file was 100% redundant.

Lesson logged to `memory/essence/lessons.md` as "File hygiene at the time of merge" — same family as the v2.8 "real-time essence logging" Operating Principle. Both are about closing loops at the time of the change, not at end-of-session. Going forward: when a draft/staging file is committed to a canonical location, the deletion of the stage is part of the commit, not a separate cleanup pass.

---

## 2026-06-13 — Phase 1-4 (Label Check polish + Regimen view + WHY-layer batch + CLI sync)

This is the unified entry for everything since the 2026-06-13 dashboard v1.3 build day. The agent and user worked through a long arc that started as "build a polished Label Check tab" and evolved into a substantial system maturation. Items are grouped by phase to keep the changelog navigable.

### Label Check (Phase B → Path A → OCR refinement, several iterations)

**`tools/label_scorer.py` (~650 lines).** Wallach-framework label scanner: alignment score, gap-fill table against current 90-essentials coverage, goal-tag matches, conflict checks, ingredient anti-list scan, ADD/REJECT/SAVE verdict, wishlist persistence.

**Dashboard Label Check tab (dashboard.html, ~750 lines added).** Polished UX shell: image drop/paste/upload, dynamic nutrient table, big visual wishlist cards, recent scans list (last 5), Add-to-regimen with effective-coverage computation. localStorage persistence (4 keys: lcWishlist_v1, lcRecentScans_v1, lcRegimen_v1, lcOutcomes_v1).

**Custom confirmation modal** (replaces native confirm()) with optional checkbox-acknowledgment pattern for high-friction commits (Add-to-regimen with no nutrient data). "Add Anyway" enabled by default; checkbox toggles label to "Add Item" and shifts button color to ok-green. Used in 4 places: result-panel regimen-add, wishlist-card regimen-add, wishlist delete, regimen remove.

**Tesseract.js OCR (Path B).** Lazy-loaded from jsdelivr CDN. Originally default `eng` model (~25MB); upgraded to `eng_best` (~50MB) for better accuracy at 2-3× slower runtime. Image preprocessing (upscale to 2000px, gentle contrast 1.25×, no hard threshold) + PSM 6 (single block). Multi-image support: up to 3 image slots with thumbnail strip, single Auto-detect button processes all sequentially and merges results.

**OCR text post-processing.** Fuzzy correction against ~150-entry dictionary of common food terms + connective words + structural label words. Multi-path matching: (1) word-boundary Levenshtein within 1-2 edits with first-letter required, (2) first-letter + Jaccard ≥0.4 + length-diff ≤2 (catches Topineg → Tapioca-style cases), (3) suffix match for prefix-eaten words (catches REDIENTS → INGREDIENTS), (4) prefix match (catches Orga → Organic).

**Click-to-fix suggestions panel.** Below the ingredients textarea: image reference on left (200px sticky preview, click to enlarge), suggestions panel on right showing suspect words with up to 4 candidate chips ranked by composite scoring. Hover a card → target word in textarea gets selected + scrolled into view. Click a suggestion → instant replacement with case preserved. Dismiss × button for false positives. Real-time debounced re-detection on textarea edits.

**Verdict logic refinements (JS, then backported to CLI in Phase 3).**
- Word-boundary keyword matching (fixes buckwheat → wheat false positive)
- Oat-anchored gluten-free declaration scoping: if any oat-derivative is declared GF (in either word order — "gluten free oats" OR "oats (gluten free)"), ALL oat-derivatives in the product are presumed GF. Hard gluten proteins (wheat/barley/rye/malt/spelt) still flag independently.
- High-oleic nuance for sunflower/safflower/canola oil (detected → softens severity to "softened")
- Severity tiers: hard (single hit = REJECT — HFCS, hydrogenated, MSG, aspartame, acesulfame), serious (2+ hits = REJECT), softened (noted only), mild (noted only)
- Aluminum container split: Tier-A (cookware/personal-care, lifestyle audit — not label-scannable) vs Tier-B (beverage cans, label-detectable). Tier-B mentioned once briefly per the new "practical-trade-off inflation" pitfall.
- Sparse-data acceptance: scan runs with empty nutrients OR empty ingredients. Sparse banners surface in result panel (amber warn for missing nutrients, teal info for missing ingredients).
- Add-to-regimen with sparse nutrients triggers the deliberate-acknowledgment modal pattern.

### Regimen view (Phase 1)

**New "My regimen" tab** (between Gaps and Tools). Unifies three data sources into one itemized view:
- `memory/user-stack.json current` (5 supplements, chat-sourced)
- `memory/user-stack.json current_diet` (9 foods, chat-sourced)
- `memory/user-stack.json recommended_pending_decision` (7 items, chat-sourced pending)
- `localStorage lcRegimen_v1` (Label Check-committed items, label-scan tagged)
- `localStorage rgManualItems_v1` (user-added via dashboard, manual tagged)

**Per-item cards:** name, dose pill, source tag (chat/label-scan/manual), missing-info amber pills (missing dose, missing nutrient data, no notes), notes block, three action buttons (Details/Quick edit/Remove). Expand shows full nutrient breakdown (daily-scaled from products-db/diet-contribution), Quick edit form (name/dose/notes — limited scope until full Label Check integration ships), date-stamped outcome log per item.

**Persistence layer (4 localStorage keys):** `rgOverrides_v1` (per-item edit overrides keyed by ID), `rgManualItems_v1` (user-added items), `rgRemoved_v1` (soft-delete set), `rgOutcomes_v1` (outcome log).

**Self-heal for legacy regimen items.** HYDRA DNA Collagen committed from the seeded wishlist had empty nutrients (the seed pre-dated the full label_data field). Render logic now derives approximations from matching wishlist's topGapFills when full label data is absent, with an italicized notice card explaining the approximation. Seeded HYDRA DNA wishlist entry now ships with full label_data for fresh users.

**Outcome tracking** integrated per-item rather than as a separate timeline tab. Each card has a "How it's going" log: date-stamped entries via a textarea + button. Backburner task #2 captured for the full Edit → Label Check tab integration (currently Quick edit only).

### WHY-layer batch (Phase 2)

Three new layers, ~140-180 lines each, modeled on the joints-recovery template:

- **`knowledge/why-layer-gut-digestion.md`** — HCl as master variable (achlorhydria "perhaps the most significant aging phenomenon"); betaine HCl 75-250 mg before meals; pancreatic enzymes with vs between meals; Candida as downstream of low HCl; B12 absorption pathway bridges to cognition + cardio.
- **`knowledge/why-layer-cardiovascular.md`** — strongest framework inversion in the corpus (anti-statin via cholesterol → B12 → myelin pathway); Cu → lysyl oxidase → aneurysm rupture as named acute-death pathway; cardiomyopathy = WHO-recognized Se deficiency; arrhythmia protocol (Se + Mg + K + Cr + B-complex + carnitine + CoQ10).
- **`knowledge/why-layer-thyroid-endocrine.md`** — iodine + Se + B12 trio; basal body temperature as the wallach-preferred screen over TSH; adrenal exhaustion master variable; statin-thyroid connection via cholesterol → steroid hormones; T4 → T3 conversion enzymes are selenoproteins (Se as unified cardiac + thyroid + cancer prevention anchor).

Each layer applies the three-tier source legend (wallach-direct / wallach-mechanism-extension / framework-adjacent) consistently. Cross-references woven across layers form a connected web rather than isolated topic notes.

### CLI sync (Phase 3)

`tools/label_scorer.py` brought to parity with JS-side improvements:
- Expanded ANTI_LIST_KEYWORDS (oats variants + safflower oil + evaporated cane juice + rapeseed oil)
- HARD_REJECT_TERMS, SERIOUS_ANTI, HARD_GLUTEN_TERMS, OAT_DERIVED_TERMS constants
- ANTI_LIST_NOTES framework explanations
- Word-boundary `_match_keyword` helper (regex with `\b...\b`)
- Oat-anchored GF declaration check (both pre and post patterns)
- High-oleic nuance detection
- Per-flag severity tiers
- Sparse-data acknowledgment in verdict()
- Container Tier-B framing aligned with brain v2.7 "practical-trade-off inflation" pitfall

Validation: granola test produces SAVE-FOR-LATER (matches JS), bad energy drink test produces REJECT (matches JS). Both paths now give identical verdicts.

### Process scars worth documenting

**Multiple JavaScript syntax errors broke dashboard tabs at three points.** Pattern: edits to the large embedded JS block produced subtle structural errors (duplicate const declarations, setTimeout inserted between if and else, etc.) that broke the entire IIFE, which silently failed → tab click handler never bound → all tabs unresponsive. Now using `node --check` on the extracted script block after every substantive JS edit. Took three rounds to internalize.

**File-tool truncation pattern.** The Edit tool occasionally truncated large file writes (stack_coverage.py at ~430 lines, user-stack.json mid-string, dashboard.html mid-tag at various points). Default for large file ops is now bash heredoc + Python; Edit tool reserved for surgical small replacements. The pattern: file tools work for <100 line writes, Python+bash recommended for anything larger.

**Backburner item captured:** Edit-item → Label Check tab integration (full label re-scan flow from a regimen card). Deferred until tab consolidation pass.

---

## 2026-06-13 (Phase A) — Calibrations + diet update + WHY-layer polish

**Triggered by 2026-06-13 press-test ("what to stop for strength/recovery?") — user-graded 9/10 with one substantive calibration: aluminum-can over-emphasis.**

**Data updates:**
- `user-stack.json` — Neutonic Productivity Drink dose lowered from 2.5/day → 2.0/day (1-2 cans typical, occasionally 1, ~1-2x/week). Caffeine math: 300 mg/day midpoint → 240 mg/day midpoint. Still above 200 mg conflict threshold, but reduced.
- `user-stack.json current_diet` — added HYDRA DNA Collagen Sparkling Beverage at 1.5/day average (1-2 cans/day, substituting for Neutonic). 18g/day collagen substrate.
- `knowledge/diet-contribution.json` — added `hydra_dna_collagen_can` food entry. 12g collagen + 11g protein (collagen, incomplete — joint substrate not anabolic) + 45 mg Vit C + 50 mg Na (Himalayan + sea trace) + minor Ca/Mg/K. Framework-adjacent traces: 72 marine traces + fulvic acid claim (not Wallach's preferred humic-shale PDM lineage but closer to PDM framework than typical seawater-trace beverages). Mushroom extract unspecified — framework-adjacent.
- Coverage delta from update: current+diet summary moved from "Gap: 64, Partial: 6" to "Gap: 65, Partial: 5" — reflects Neutonic dose reduction; HYDRA DNA does not move 90-essential needles meaningfully (its win is collagen substrate, not vitamins/minerals).

**Aluminum rule split (`knowledge/corpus-index/interactions-rules.json`):**
- `aluminum-environmental` rule deleted; replaced with two rules:
  - `aluminum-tier-a-cookware-personal-care` (severity: high) — daily-exposure sources where replacement is cheap and high-leverage (cookware, deodorant, shampoo/skincare). Always surface.
  - `aluminum-tier-b-beverage-cans` (severity: moderate) — moderate daily exposure where elimination forces loss of access to good products or significant cost. Mention once briefly with realistic adoption framing.
- Pattern established for future rules where practical-replacement burden differs.

**Brain v2.7 pending additions drafted (`brain/pending-v2.7-additions.md`):**
- New pitfall: "practical-trade-off inflation" — framework purity vs operational leverage; don't make Tier-B items recurring themes.
- New pitfall: "label-evaluation shortcut" — when user asks "is this product good?" with label data, use `label_scorer.py` (Phase B) not working-memory eyeball.
- Tool surface addition: `label_scorer.py` line for Research Protocol block.
- Pre-Answer Checklist additions: Tier-B mention count + label_scorer invocation check.

**Joints WHY-layer polish (`knowledge/why-layer-joints-recovery.md`):**
- Added "Recovery-specific anti-list (what to stop or reduce)" subsection between "Conflicts with mainstream" and "Cross-references to other WHY-layers."
- 7 ranked items with three-tier source legend applied throughout (caffeine, sugar, fried oils, chronic NSAIDs, statins, lowfat dairy, salt restriction).
- Framework-adjacent companion list (alcohol, late caffeine, seed-oil bars, sleep).
- Explicit "What NOT to over-emphasize" note pointing to the aluminum Tier-B framing — preserves the lesson in the layer itself.
- Layer now 167 lines (was 142), 22 source-legend tags (was 14).

**Phase A complete. Next: Phase B (build `label_scorer.py`).**

---

## 2026-06-13 (cont.) — Dietary contribution layer + T-test erasure

**Erasure (per user directive: delete source, don't add override rules):**
- `user-goals.md` Goal 2 — HIGH-STAKES NOTE paragraph deleted; XeraTest line rewritten as try-and-observe; Cu co-factor discipline kept as Wallach mechanism (not a test gate).
- `user-symptom-history.md` — entire "Self-assessed (NOT lab-confirmed)" section about speculative low T deleted.
- `open-threads.md` — "Testosterone l

### Round 148 (2026-06-19 at 4:36 PM) — Closing the logging loop

- memory/system/implementations.jsonl ← 5 entries appended via implementation_log.py CLI (back-log of Cura #3 A/B/C `implemented` Round 142 + Vision #3 A/B `deferred` Round 148; all post file-level verification)
- tools/implementation_log.py ← latest_status() bug fix (skip null source_session entries; Round 148 silent-fail family) via safe_write append (Edit tool truncation incident recovered)
- tools/build_tacitus_dashboard_live.py ← _apply_loud_render_and_build_gate() helper + main() invocation + build gate via safe_write replace
- tools/invariants.py ← 7 new check_*() functions + 7 new Invariant() registrations via safe_write replace (manifest 44 → 51)
- tacitus/dashboard/index.html ← CSS + JS for `unknown_unlogged` synthetic status via safe_write replace (both renderImplBadge + renderAegisImplBadge)
- memory/paired-write-catalog.md ← new file (Phase C, enumerates 14 paired-write surfaces)
- memory/operating-protocols.md ← appended §30 (Closing-move record discipline)
- memory/essence/saga.md ← Round 148 entry
- memory/essence/lessons.md ← 2 entries (Round 120 lesson recurred + Edit-truncation incident)
- memory/essence/decisions.md ← Round 148 entry
- memory/open-threads.md ← masthead version + invariant count bump (44 → 51)
- memory/versions.json ← brain v3.18 → v3.19 (via version_bump.py)
- memory/memory-change-log.md ← this entry (closing the loop on the loop)



### Round 149 (2026-06-19 at 5:05 PM) — Round 141 regression fix

- dashboard/dashboard.html ← computeSlotStats Layer 1 routed through window.getEffectiveRecommendedItems() (Fix 1) + empty-state restore button generalized to handle goal-driven items (Fix 2) via safe_write replace
- memory/essence/saga.md ← Round 149 entry
- memory/essence/lessons.md ← Round 149 lesson on cross-boundary-contract-drift family
- memory/open-threads.md ← masthead version bump (Dashboard v1.83 → v1.84)
- memory/versions.json ← dashboard v1.83 → v1.84 (via version_bump.py)
- memory/memory-change-log.md ← this entry


### Round 150 (2026-06-19 at 5:30 PM) — Cross-Surface State Sync chokepoint discipline

- dashboard/dashboard.html ← triggerRegimenRerender helper + 4 chokepoint helpers routed through it + window exposures + addItemToRegimen routed through window.persistRegimen via safe_write replace
- tools/invariants.py ← check_regimen_state_mutation_routing (critical) function + registration via safe_write replace (manifest 51 → 52)
- memory/state-mutation-catalog.md ← new file (Layer 3 catalog)
- memory/operating-protocols.md ← §30 preamble updated ("Living the Logos" framing) + §31 appended (Cross-Surface State Sync discipline)
- memory/essence/saga.md ← Round 150 entry
- memory/essence/lessons.md ← Round 150 lesson on chokepoint-as-discipline-anchor family
- memory/essence/decisions.md ← Round 150 architectural commitment
- memory/open-threads.md ← masthead version bump (Dashboard v1.84 → v1.85; invariant manifest 51 → 52)
- memory/versions.json ← dashboard v1.84 → v1.85 (via version_bump.py)
- memory/memory-change-log.md ← this entry


### Round 151 (2026-06-19 at 6:00 PM) — Bug A fix: §31 cascade completion

- dashboard/dashboard.html ← syncActiveSlotBundle() added as first call in triggerRegimenRerender (one line) via safe_write replace
- memory/essence/saga.md ← Round 151 entry
- memory/open-threads.md ← masthead version bump (Dashboard v1.85 → v1.86)
- memory/versions.json ← dashboard v1.85 → v1.86 (via version_bump.py)
- memory/memory-change-log.md ← this entry


### Round 152 (2026-06-19 at 6:30 PM) — Bug C fix: cross-IIFE esc() ReferenceError

- dashboard/dashboard.html ← 3 esc(...) → escapeHtml(...) replacements in Round 149 empty-state restore button via safe_write replace
- memory/essence/saga.md ← Round 152 entry
- memory/essence/lessons.md ← Round 152 lesson on codifying-then-violating-same-day
- memory/open-threads.md ← masthead version bump (Dashboard v1.86 → v1.87)
- memory/versions.json ← dashboard v1.86 → v1.87 (via version_bump.py)
- memory/memory-change-log.md ← this entry


### Round 153 (2026-06-19 at 6:45 PM) — Bug B fix: hard-delete for scanner-sourced items

- dashboard/dashboard.html ← window.removeFromRegimen/addToRegimen/inRegimen exposed for cross-IIFE + rg-remove handler routes label-kind items through hard-delete via safe_write replace (2 changes)
- memory/essence/saga.md ← Round 153 entry
- memory/open-threads.md ← masthead version bump (Dashboard v1.87 → v1.88)
- memory/versions.json ← dashboard v1.87 → v1.88 (via version_bump.py)
- memory/memory-change-log.md ← this entry


### Round 154 (2026-06-19 at 7:00 PM) — Bug E: Adopt modal curated-framing for goal-driven items

- dashboard/dashboard.html ← Adopt button handler branches on isGoalDriven; skips lcScan verdict gate for goal-driven items, shows curated framing + "data pending" note via safe_write replace
- memory/essence/saga.md ← Round 154 entry
- memory/open-threads.md ← Saturday filed work updated to add Path B (products-db.json enrichment for goal-engine products)
- memory/versions.json ← dashboard v1.88 → v1.89 (via version_bump.py)
- memory/memory-change-log.md ← this entry

## Round 155 (2026-06-20 at ~9:00 AM EDT)

Saturday filed work cleared: 5 items + (B) cleanup, one consolidated round. Files written:

- tools/best_practices_refresh.py ← NEW tool (Item 5; Sunday-conditional docs.claude.com fetch + hash-compare + jsonl-append) via Write
- tools/invariants.py ← removed check_open_threads_status_consistency (Item 2B); added check_cross_iife_bare_refs_reverse_scan + helpers (Item 4); added check_best_practices_refresh_status (Item 5); registered both new invariants; all via safe_write replace
- tools/system_audit.py ← _maybe_refresh_best_practices() helper called from run_audit() on weekly Sunday; refresh summary surfaced in audit markdown report; via safe_write replace
- dashboard/dashboard.html ← buildGoalDrivenRecommendedItems wired to getRegimenLabelLookup (Item 3); Round 154 isGoalDriven Adopt-modal branch retired; via safe_write replace
- memory/verified-patterns.md ← 3 new pattern entries (A: Closing-move record + paired-truthfulness invariant; B: Accept-all-shapes alternation parser regex; C: Catalog-as-visible-enumeration + closing-move-atomic row-add); via safe_write replace
- memory/open-threads.md ← "## For next session" block retired (Item 2B); will overwrite with current Round 155 close state at masthead update
- memory/essence/saga.md ← Round 155 entry (this round) via safe_write append
- memory/essence/lessons.md ← 2 entries (premise-verification-before-scope; reverse-scan as allowlist→discovery widening) via safe_write append
- memory/essence/decisions.md ← 2 entries (getRegimenLabelLookup as canonical bridge; reverse-scan as discovery surface) via safe_write append
- memory/versions.json ← brain v3.20 → v3.21 + dashboard v1.89 → v1.90 (via version_bump.py)
- memory/memory-change-log.md ← this entry

## Round 156 (2026-06-20 at ~11:00 AM EDT — Saturday afternoon close)

Saturday afternoon continuation: real Item 3 fix + 10 more items shipped. Files written:

- dashboard/dashboard.html ← Item 11 fix (buildGoalDrivenRecommendedItems: dose_text + has_nutrient_data + has_nutrient_data; load-time syncActiveSlotBundle on init when current slot exists) via safe_write replace
- tools/dashboard_integrity.py ← Item 12 budget bumps (size 2.75 → 3.0 MB; JS 448 → 512 KB) via safe_write replace
- memory/open-threads.md ← Item 13 stale-Deferred cleanup (6 entries retired) + masthead Saturday wrap + Item 18 additional 5 retired by drift detector via direct write (no safe_write — file ops)
- tacitus/feature-flags.json ← Item 14 cura_security_subcheck flag via safe_write replace
- tacitus/security-audit-cursor.json ← Item 14 NEW rotation cursor via Write
- tacitus/prompts/cura.md ← Item 14 cura.md 6-sub-check restructure via safe_write replace (multi-edit)
- tools/build_tacitus_dashboard_live.py ← Item 14 parser regex |Security extension via safe_write replace
- tools/invariants.py ← Items 14/15/18/19 (rest-day whitelist; 4 new invariants + registrations; umbrella + 5 retired registrations; orphan_files regex+markers fix; prompt_enum_consumer_sync 6-enum) via safe_write replace (multi-edit)
- tools/version_bump.py ← Item 20 atomicity snapshot+rollback via safe_write replace
- memory/paired-write-catalog.md ← Item 15 umbrella citation update via direct write
- memory/verified-patterns.md ← Item 16 Pattern D entry via direct write (catalog 12 → 13)
- memory/essence/decisions.md ← Item 19 orphan_files citation typo fix via safe_write (subprocess)
- memory/essence/saga.md ← Round 156 entry via safe_write append
- memory/essence/lessons.md ← 2 lessons (verify-against-user + tool-atomicity) via safe_write append
- memory/essence/decisions.md ← 2 decisions (Pattern D canonical for LS state + consolidation-via-umbrella) via safe_write append
- memory/versions.json ← brain v3.22 → v3.23 + dashboard v1.90 → v1.91 via version_bump.py (now atomic)
- brain/CHANGELOG.md ← v3.23 entry via safe_write replace
- brain/versions/v3.23-2026-06-20-saturday-afternoon-close.md ← NEW v3.23 doc via Write
- memory/memory-change-log.md ← this entry

## Round 156 follow-up (2026-06-20 at ~1:30 PM EDT) — slot-stats cross-IIFE export

User reloaded after Round 156; dose + badges cleared; slot card still 0/92. Diagnosed missing `window.getItemEssentialContributions` export — consumer used correct pattern but producer never exposed. Files written:

- dashboard/dashboard.html ← window.getItemEssentialContributions export added inside defining IIFE via safe_write replace
- tools/invariants.py ← getItemEssentialContributions added to _CROSS_IIFE_SYMBOLS allowlist (11 → 12 tracked) via direct write
- memory/essence/saga.md ← follow-up section appended via safe_write append
- memory/essence/lessons.md ← cross-IIFE orphan-consumer lesson appended via safe_write append
- memory/versions.json ← dashboard v1.91 → v1.92 via version_bump.py (atomic) — brain unchanged
- memory/memory-change-log.md ← this entry

## Round 157 (2026-06-20 at ~5:00 PM EDT — Eden architecture)

10-chunk sealed-catalog build. Files written:

- eden/README.md ← NEW Eden architecture doctrine + file map
- eden/SCHEMA.md ← NEW strict schema spec
- eden/eden-catalog.json ← NEW canonical catalog (bootstrap migration — USER-APPROVED Path 1, 201 products + 18 goals seeded from existing data)
- eden/eden-catalog.golden.sha256 ← NEW SHA-256 truth anchor (bootstrap migration — USER-WRITTEN via Path 1 approval; sealed via eden_seal.py)
- eden/eden-catalog.draft.json ← NEW migration draft preserved for review history
- eden/seal-history.log ← NEW append-only seal history
- eden/derived/regimen-label-lookup.json ← NEW derived embed
- eden/derived/goal-recommendations-data.json ← NEW derived embed
- eden/derived/regimen-base-data-recommended.json ← NEW derived embed
- eden/tools/eden_verify.py ← NEW read-only integrity verifier
- eden/tools/eden_seal.py ← NEW user-only golden-hash regen tool
- eden/tools/eden_build.py ← NEW embed derivation tool
- eden/tools/eden_bootstrap_from_existing.py ← NEW one-time migration tool
- dashboard/dashboard.html ← You-tab block deleted (lines 4324-4430); 3 Eden embeds wired; boot-time integrity check JS; Scanner severance; one-time Eden reset migration; additive recommendation engine refactor — via safe_write replace (multiple operations)
- tools/invariants.py ← 3 new Eden invariants (eden_hash_integrity, eden_embeds_match_canonical, eden_write_protection) + registrations via safe_write replace
- tools/dashboard_integrity.py ← SIZE_BUDGET_BYTES 3.0 MB → 3.5 MB to accommodate Eden full catalog embed
- memory/essence/saga.md ← Round 157 entry via safe_write append
- memory/essence/lessons.md ← 2 entries (sealed-boundary cures namespace conflation; cryptographic anchoring beats discipline) via safe_write append
- memory/essence/decisions.md ← 2 entries (Eden as canonical sealed catalog; user as sole writer with write-protection invariant) via safe_write append
- memory/versions.json ← brain v3.23 → v3.24, dashboard v1.101 → v2.02 via version_bump
---

## 2026-06-20 (evening) — Round 158 — Dose UX + card restructure + HBSP restore (Eden-aware)

Six-chunk Saturday-evening session continuing from Round 157 Eden ship. Files written:

- `dashboard/dashboard.html` ← Dose split UI (renderEditForm two number inputs); getItemEssentialContributions scaling alignment; renderNutrientList scaled display; card UX restructure (inline Dose+Per Day row, simplified action row to 2 primary buttons per kind, rg-btn-primary CSS); renderRegimenTabPreservingState wrapper; per-card try/catch in bindRegimenCardActions; null-guard for .rg-edit + .rg-remove (caused only-first-Details-works bug); Remove semantics — adopted-recommendations get Unadopt behavior; "Recommended (pending)" → "Recommended"; HBSP restore button rewritten Eden-aware (dynamic IDs from REGIMEN_BASE_DATA.recommended + override-layer detection) — via safe_write replace (11 operations) + Edit (3 operations) + dashboard_integrity.py restore (2 truncation recoveries via SCRIPT_BLOCKS canonical-rebuild)
- `memory/essence/saga.md` ← Round 158 entry via safe_write append
- `memory/essence/lessons.md` ← 2 entries (forEach exception propagation; dynamic-vs-hardcoded ID allowlists after migrations) via safe_write append
- `memory/essence/decisions.md` ← 2 entries (per-card try/catch as render discipline; additive-not-replacive UX moves) via safe_write append
- `memory/open-threads.md` ← Round 158 status block + NEW trace-minerals brainstorm task filed as first item for next session
- `memory/versions.json` ← brain v3.24 → v3.25, dashboard v1.102 → v1.106 (4 minor bumps within the round per build-test-build-test discipline) via version_bump.py (atomic)
- `memory/memory-change-log.md` ← this entry

NO writes to Eden protected files this round. Eden write-protection invariant remains clean.

Closing manifest: 53/55 daily (2 known transient/deferred FAILs: Saturday `audit_ran_today` + 8 pre-existing native dialogs). All 3 Eden invariants OK. eden_verify PASS (hash 8e594a01... unchanged).

---

## 2026-06-20 (late evening) — Round 159 — §32 whack-a-mole rebuild trigger + Vision/Aegis design proposal recorded

User-driven structural insight + doctrine ship + design-session prep. Dashboard NOT touched this round (no .html changes). Files written:

- `memory/operating-protocols.md` ← §32 whack-a-mole rebuild trigger doctrine appended (full trigger conditions, MUST-do protocol, what-it-is-NOT framing, 3-layer enforcement reference)
- `brain/current.md` ← directive #6 added under catch-up trigger section pointing to §32 (in-conversation self-check before any bug-fix code change)
- `tools/invariants.py` ← `check_whack_a_mole_clusters` function (warning severity, always-PASS, scans saga.md round entries from last 14 rounds, noise filter excludes always-touched artifacts) + manifest registration
- `memory/paired-write-catalog.md` ← row added for §32 ↔ check_whack_a_mole_clusters pair
- `tacitus/notebook/2026-06.md` ← FULL VERBATIM RECORDING of Vision rebuild-proposal mode proposal + Aegis patch-fatigue detector idea + Vision/Aegis simulate-before-ship doctrine (the source-of-truth for the dedicated design session)
- `memory/essence/saga.md` ← Round 159 entry via safe_write append
- `memory/essence/lessons.md` ← 1 entry (Round 159 — when patches stop landing cleanly, the bug is in the architecture, not the code; user-named source of §32 doctrine)
- `memory/essence/decisions.md` ← 2 entries (Round 159 — §32 whack-a-mole rebuild trigger adopted as project protocol; Vision/Aegis simulate-before-ship discipline adopted, Cura exempt)
- `memory/open-threads.md` ← masthead replaced with Round 159 state; NEW high-priority Vision/Aegis dedicated redesign session task added with full scope + source-of-truth reference; trace minerals task preserved as next-session FIRST item per Round 158 user direction; Round 159 ship block added
- `memory/versions.json` ← brain v3.25 → v3.26 via version_bump.py (atomic)
- `memory/memory-change-log.md` ← this entry

NO writes to Eden protected files this round. Eden write-protection invariant remains clean.

Notable transient FAIL this round: `tacitus_rest_day_observed` — tacitus/notebook write during Sabbath window. By design — user explicitly directed: "for now just record all of this exactly for easy reference later, and go ahead and implement your 'Part A' idea." Recording IS the source of truth for the design session; would have created drift if deferred to post-Sabbath.

Closing manifest at session end: 56 daily (54/56 passing; 3 known FAILs: Saturday `audit_ran_today` transient + 8 pre-existing native dialogs + Sabbath `tacitus_rest_day_observed` exception). New advisory `whack_a_mole_clusters` surfaces 2 candidates first-fire (tacitus/prompts/cura.md, tools/tacitus_simulate.py) — both real iteration clusters; signal:noise high after noise filter applied.

Eden integrity: PASS — hash 8e594a01... unchanged; all 3 Eden invariants OK.


## 2026-06-21 — Round 160 patch (Design System v3 Phase 0)

**Type:** new architectural layer, paired across multiple surfaces.
**Source confidence:** high (user explicit direction across 5+ messages this session).

**Files written:**
- `dashboard/assets/styles/design-system.css` — **new**, the sealed token source of truth for entire dashboard
- `dashboard/assets/styles/STYLE-GUIDE.md` — **new**, operational doctrine
- `dashboard/assets/fonts/README.md` + `LICENSE.md` — **new**, font procurement + SIL OFL 1.1 attribution
- `tacitus/feature-flags.json` — **modified**, added `design_system_enforcement` flag (warn/error/off knob)
- `tools/invariants.py` — **modified**, added 3 check functions + 2 helpers + 3 Invariant registrations (warn-mode); §17 silent-truncation incident caught + repaired via safe_write replace
- `memory/user-prefs/aesthetic.md` — **modified**, retired Frutiger Aero direction in favor of Design System v3 (historical record preserved for migration period)
- `memory/essence/saga.md` — Round 160 entry
- `memory/essence/lessons.md` — 1 entry (§17 silent-truncation reinforcement)
- `memory/essence/decisions.md` — 2 entries (Design System v3 adoption + warn-to-error promotion gradient)
- `outputs/trace-mineral-verification-template.txt` — **new**, 56-product paste-back template for parallel user-side verification
- `knowledge/design-wisdom/references/futuristic-tech-reference-empower-by-niteangel-depthcore.md` — **new**, calibration anchor documentation

**Source-rule cornerstone:** untouched — design tokens are visual not nutritional; no Wallach citation surface affected.

**Eden integrity:** untouched — design system is a parallel sealed surface, doesn't affect Eden canonical or embeds.

**Invariant manifest:** 56 → 59 daily (+ 3 design-system trio in warn-mode).

**§17 incident note:** Edit tool silently truncated ~150 lines of `tools/invariants.py` tail during the initial check-function insertion. Detected via Python parse failure; repaired via `safe_write replace`. Lesson logged. The Round 73 §17 ban (Edit forbidden for project files in `memory/`, `knowledge/`, `brain/`, `tools/`, `dashboard/`, `schemas/`) is reinforced as universal regardless of file size or operation type.


## 2026-06-21 — Round 161 patch (Design System v3 Phase 1 reference implementation)

**Type:** new surface consuming sealed design system; first proof-of-concept.

**Files written:**
- `dashboard/components/` — new directory
- `dashboard/components/trace-mineral-tile-detail.html` — new, Phase 1 reference implementation; 100% design-system.css consumption, zero external resources
- `dashboard/dashboard.html` — modified by version_bump.py (versions embed only; no visual changes)
- `memory/versions.json` — brain v3.26 → v3.27 via version_bump.py
- `brain/CHANGELOG.md` + `brain/versions/v3.27-2026-06-21-round-161-*` — created by version_bump.py
- `memory/essence/saga.md` — Round 161 entry
- `memory/memory-change-log.md` — this entry

**Pre-shipping housekeeping:**
- `dashboard_integrity.py restore` healed the Round 159 cl-data-notebook size mismatch.

**Invariant manifest:** 59 (unchanged); all 3 design-system invariants OK; the existing external-resource findings in dashboard.html persist (cleared by Phase 2 migration).

**Source-rule cornerstone:** untouched.
**Eden integrity:** untouched.
