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

`dashboard-v1.5-pre-theme.html` created via bash `cp` (the sandbox mount was stale so this is an intermediate snapshot, not literal current state). **The reliable revert path is the M
