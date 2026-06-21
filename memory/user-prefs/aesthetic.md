# Aesthetic — User Preferences

_Cross-cutting. Dashboard theme + visual language. Captured 2026-06-12; pivoted to Design System v3 on 2026-06-21 (Round 160)._
_See [index](index.md) for the file map. Related: [`memory/design-knowledge.md`](../design-knowledge.md) for portable design principles, [`memory/design-references/README.md`](../design-references/README.md) for the visual reference catalog, [`knowledge/design-wisdom/`](../../knowledge/design-wisdom/) for the curated codepen + calibration references._

---

## Current direction — Design System v3 (adopted 2026-06-21, Round 160)

**Single source of truth:** [`dashboard/assets/styles/design-system.css`](../../dashboard/assets/styles/design-system.css).
**Doctrinal guide:** [`dashboard/assets/styles/STYLE-GUIDE.md`](../../dashboard/assets/styles/STYLE-GUIDE.md).
**Canonical visual reference:** `outputs/trace-minerals-popup-v3.html` (user-approved 2026-06-21).
**Vibe calibration anchor:** [`knowledge/design-wisdom/references/futuristic-tech-reference-empower-by-niteangel-depthcore.jpg`](../../knowledge/design-wisdom/references/futuristic-tech-reference-empower-by-niteangel-depthcore.jpg) — "Empower" by niteangel, depthCORE, 2004.

### Design thesis in one paragraph

The dashboard is a manuscript displayed by alien technology. The substrate is warm cream paper that invites you to stay a while. The ink is warm near-black, not cold gray. The single signal color is a bright orange — used to mark importance, never decoration. A cool cyan exists only in tech micro-details (corner crosshairs, status pulses, tiny readouts) — never in body text or large surfaces. Typography is editorial: Playfair Display for monumental headers, Merriweather for long-form prose, Crimson Pro for italic decks, Space Grotesk for UI chrome, JetBrains Mono for technical readouts. The composition is asymmetric, with strong hierarchy that carries the doctrine before the reader reads a word.

### Palette

- **Paper substrate:** `--ds-paper` `#faf5e8`, `--ds-paper-light` `#fffbf2`, `--ds-paper-deep` `#f2ead3`, `--ds-paper-darker` `#ebe2c4`.
- **Ink:** `--ds-ink` `#1a1612` (warm near-black, not cold gray), `--ds-ink-medium` `#3d342a`, `--ds-ink-soft` `#6a5d50`, `--ds-ink-faint` `#9b8e7c`.
- **Signal accent (bright orange — calibrated against the Empower image):** `--ds-accent` `#ff7e3c`, `--ds-accent-bright` `#ff9d5c`, `--ds-accent-hot` `#ff6420`, `--ds-accent-deep` `#c8552a`, `--ds-accent-soft` `#ffd0b3`, `--ds-accent-wash` `#ffe9d8`.
- **Tech accent (cool cyan — only in micro-details):** `--ds-tech` `#5fa4bd`, `--ds-tech-dim` `#a8c8d5`, `--ds-tech-wash` `#d8e6ec`. Never used for body text or large surfaces.
- **Highlighter trio (used SPARINGLY inside `<mark>`):** `--ds-hl-warm` `#ffe69c`, `--ds-hl-rose` `#f7c4b8`, `--ds-hl-mint` `#c8e5b8`. Max 2 colors per quote.
- **Status:** `--ds-status-ok` / `warn` / `err` / `info` for system state — held DISTINCT from the signal accent so importance and status don't visually conflate.

### Typography

| Token | Family | Use |
|---|---|---|
| `--ds-font-display` | Playfair Display (variable wght 400-900) | Hero titles, section headers, pull-quote prose |
| `--ds-font-serif` | Merriweather (variable opsz/wdth/wght 300-900) | Long-form body prose |
| `--ds-font-serif-light` | Crimson Pro (variable wght 200-900) | Italic decks, taglines |
| `--ds-font-sans` | Space Grotesk (variable wght 300-700) | UI chrome — buttons, breadcrumbs, tabs, labels |
| `--ds-font-mono` | JetBrains Mono (variable wght 100-800) | Tech readouts, section number brackets, code |

All five are SIL OFL 1.1 (perpetual free-use). Self-hosted at `dashboard/assets/fonts/` — no external font CDNs.

### Layout posture

- **Asymmetric magazine spread.** Strong hierarchy via type-size differential and white space. Editorial pull-quotes, drop-cap on the FIRST paragraph of the first section only (restraint = impact).
- **Editorial restraint.** One pull-quote per long-form view. One pull-stat per surface. One primary button per view. The moments that DO assert hit harder because everything around them is quiet.
- **Alien-tech micro-details.** Corner crosshairs on "scanned" surfaces. Tiny monospace readouts (electron configurations, scan IDs, system IDs). Tech-bracket flourishes on section numerals. Status pulse dots. Used where they MEAN something (live data, scanned source, integrity status) — never as decoration.
- **The kill-shot stat.** The `.ds-pull-stat` primitive — a dark slab with radial scanner pulse + concentric instrument rings + giant accent numeral — used for the SINGLE load-bearing number in any view (e.g., "98%" bioavailability).

### Strict rules

1. **No external resources.** No Google Fonts CDN, no jsdelivr, no cdnjs. All fonts local. The `check_no_external_style_resources` invariant enforces.
2. **No hardcoded visual values.** Every color, font, shadow, spacing comes from a `--ds-*` token.
3. **Re-theme, don't rewrite logic.** When migrating a surface, behavior + state + invariants stay intact. Visual layer only.
4. **No silent drift.** `design-system.css` is hash-anchored. The agent never writes this file after the sealing round. User-only-writer.

### UI shell (modular)

- `.ds-topbar` + `.ds-systemid` + `.ds-breadcrumb` + `.ds-tabs` + `.ds-action-bar` — composable chrome that turns any read-surface into an interface.
- `.ds-slot-profile`, `.ds-slot-toast`, `.ds-slot-modal` — empty positional anchors for future expansion (settings, profile, notifications, etc.) without re-architecture.

---

## Retired direction — Frutiger Aero / Y2K (historical record)

_Captured 2026-06-12; canonical from Phase 12 design partnership through Round 159 (2026-06-20). Retired 2026-06-21 (Round 160) in favor of Design System v3 above._

The original direction was **Frutiger Aero / Y2K** — early-2000s "glass-like" UI with teal-rich color and "window over wallpaper" layout. The teal palette (`--teal-deep` `#1a5a52`, `--teal` `#2d8276`, `--teal-mid` `#4ba99a`, `--teal-soft` `#b4ddd5`, `--teal-mist` `#d4ebe5`, `--teal-veil` `#ebf6f3`) anchored every dashboard surface from Phase 9 through Round 159. The misty-mountain wallpaper (`dashboard/assets/background-2.jpg`) framed the page; the teal-rich window interior held content; the glass-window effect on the outer container edge gave it the "floating over the desktop" feel.

This direction is preserved here as a historical reference because:
1. It accumulated months of design wisdom about typography proportions, asymmetric layout, and restraint that remained valid through the v3 pivot.
2. The migration to v3 is per-surface (Phase 2 work, Round 161+); legacy surfaces still render with the Frutiger Aero tokens until they migrate.
3. The lesson stuck: a single accent family + warm substrate + editorial restraint beats "lots of glass cards" (the v2 of the original theme had to be discarded due to scrolling lag from multiple `backdrop-filter` surfaces).

### What carried forward to v3

- Restraint as a design principle.
- Asymmetric composition.
- Warm/cream/cozy substrate (the Frutiger Aero version used `--teal-veil` + cream tints; v3 makes the cream the foundation directly).
- "One primary action per view" rule.
- The avoidance of "lit-from-above generic neumorphism" — both versions use direction-aware lighting language.

### What v3 changed

- **Color anchor:** teal → bright orange + cool cyan tech accent.
- **Aesthetic family:** Frutiger Aero / Y2K → editorial-magazine + alien-tech (the "manuscript displayed by alien technology" thesis).
- **Layout substrate:** "window over wallpaper" → cream paper as the canvas itself, no wallpaper border.
- **External resources:** Google Fonts allowed → NO external resources, all self-hosted.
- **Token discipline:** scattered inline values → single sealed source of truth in `design-system.css`.

---

## Performance constraints (carry over to v3)

- Compositor-thread-only animations where possible (opacity + transform + box-shadow color).
- Respect `prefers-reduced-motion` globally (v3 honors this at the CSS variable level).
- Backdrop-filter use restricted — v3 uses it only on the `.ds-pull-stat` instrument rings and not on multiple stacked surfaces.

---

## Theme swap policy (multi-user readiness)

When the system is given to a different user, the default theme is the current Design System v3. New users can request alternate themes; the architecture is theme-agnostic insofar as the `--ds-*` tokens are the only place visual values live, so swapping the token sheet swaps the theme globally. The brain trigger, data sources, and structure are unaffected by theme.

If a future user requests "more Frutiger Aero feel" or "darker mode" or some other variant, the path is: copy `design-system.css` → `design-system-<themename>.css` → adjust the `:root` token block → swap the `<link>` in the dashboard. All consuming code keeps working because it never references raw values.

---

## Related

- [`dashboard/assets/styles/STYLE-GUIDE.md`](../../dashboard/assets/styles/STYLE-GUIDE.md) — the operational doctrine
- [`dashboard/assets/styles/design-system.css`](../../dashboard/assets/styles/design-system.css) — the sealed token source of truth
- [`knowledge/design-wisdom/`](../../knowledge/design-wisdom/) — the 28-codepen reference library + the Empower calibration anchor
- [`memory/design-knowledge.md`](../design-knowledge.md) — portable design principles (cross-project)
- [`memory/design-references/README.md`](../design-references/README.md) — visual reference catalog (legacy)
- [`communication.md`](communication.md) — voice/format preferences are separate from visual preferences
- [`index.md`](index.md) — file map
