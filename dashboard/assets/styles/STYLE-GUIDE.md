# Design System v3 — Style Guide

_Read this BEFORE writing any new visual code for this dashboard, and BEFORE migrating any existing surface. This guide is the operational doctrine for `design-system.css`._

---

## The four immovable rules

1. **No external resources.** Every font, image, and asset is local. No `fonts.googleapis.com`. No CDN-loaded JS or CSS. The `check_no_external_style_resources` invariant enforces this. The one currently-allowed external — Tesseract.js for OCR — is carved out explicitly with a TODO to in-house in a future round.

2. **No hardcoded visual values.** Every color, font, shadow, spacing comes from a `--ds-*` token — never a literal. (This rule is discipline + review, not yet a machine gate; the live design-system invariants are `no_external_style_resources`, `design_system_hash_integrity`, and `design_system_write_protection`.)

3. **Re-theme, don't rewrite logic.** When migrating a surface, the BEHAVIOR stays intact. State models, invariants, event handlers, chokepoint helpers, regimen state mutations, scanner pipelines — all untouched. Only the visual layer changes. The safe fallback when uncertain: exact-copy-current-behavior, retheme only.

4. **No silent drift.** `design-system.css` is hash-anchored. The agent never writes this file after the sealing round. To extend the token vocabulary: open a co-work request; draft the addition in a side file; user copies it in.

---

## The design language in one paragraph

This dashboard is a manuscript displayed by alien technology. The substrate is warm cream paper that invites you to stay a while. The ink is warm near-black, not cold gray. The single signal color is a bright orange — used to mark importance, never decoration. A cool cyan exists only in tech micro-details (corner crosshairs, status pulses, tiny readouts) — never in body text or large surfaces. Typography is editorial: Playfair Display for monumental headers, Merriweather for long-form prose, Crimson Pro for italic decks, Space Grotesk for UI chrome, JetBrains Mono for technical readouts. The composition is asymmetric, with strong hierarchy that carries the doctrine before the reader reads a word. The 98% pull-stat is the kill-shot — one per surface, never more.

---

## When to use what

### Colors

| Token | Use for | Don't use for |
|---|---|---|
| `--ds-paper`, `--ds-paper-light`, `--ds-paper-deep` | Card backgrounds, app canvas, modal interiors | Body text color |
| `--ds-ink`, `--ds-ink-medium`, `--ds-ink-soft` | Body text (medium for body, ink for headers, soft for captions/labels) | Backgrounds (use paper tones) |
| `--ds-accent` | THE signal: buttons, kickers, marks, headings emphasis, status anchors | Body text, large washes |
| `--ds-accent-hot` | Very specific kill-shots only (pull-stat numeral, hot CTA gradient stop) | Frequent emphasis |
| `--ds-accent-deep` | Italic emphasis in headers, active states, hover-on-bright | Default text |
| `--ds-tech` family | ONLY corner crosshairs, tech readouts, status pulses, section number brackets | Body text, large surfaces, navigation labels |
| `--ds-hl-warm/rose/mint` | The textured `<mark>` highlight, sparingly. Max 2 colors per quote. | Decoration. Background fills. |
| `--ds-status-*` | System state indicators (coverage badge, integrity status, vitality state) | Brand/accent — that's --ds-accent's job |

### Typography stacks

| Token | Family | Use for |
|---|---|---|
| `--ds-font-display` | Playfair Display | Hero titles, section headers, tile names, pull-quote prose |
| `--ds-font-serif` | Merriweather | Body prose (1rem base, generous line-height) |
| `--ds-font-serif-light` | Crimson Pro | Italic decks, secondary editorial voice, tagline subheads |
| `--ds-font-sans` | Space Grotesk | UI chrome — buttons, breadcrumbs, tabs, labels, kickers |
| `--ds-font-mono` | JetBrains Mono | Tech readouts, technical labels, section numerals brackets, code |

**Rule:** never set `font-family` to a literal value. Always go through a token.

### Spacing scale

Modular 4px-based scale. Use `--ds-space-N` for any margin/padding/gap. `--ds-space-4` = 1rem = the default. `--ds-space-7` = 2.5rem = section padding. Bigger gaps for editorial surfaces; tighter for utility chrome.

### Elevation

| Token | Use for |
|---|---|
| `--ds-elev-1` | Subtle lift — buttons, tags, badges |
| `--ds-elev-2` | Card-level elevation — tiles, inline panels |
| `--ds-elev-3` | Modal/popup-level — the editorial spread |

### Motion

`--ds-motion-fast` (0.15s) for state changes (hover, focus). `--ds-motion-base` (0.2s) for content transitions. `--ds-motion-slow` (0.4s) for orchestrated reveals. Reduced-motion is honored globally — never assume motion will play.

---

## The component vocabulary

### `.ds-canvas`
Apply to the topmost surface of any new screen. Sets box-sizing inheritance, font defaults, color, antialiasing. The legacy dashboard doesn't have it yet; migration adds it surface by surface.

### Typography primitives
Use `.ds-h-hero`, `.ds-h-section`, `.ds-h-subsection`, `.ds-h-tile-name`, `.ds-deck`, `.ds-body`, `.ds-kicker`, `.ds-eyebrow`, `.ds-tag-element`, `.ds-tag-readout`. Never set font properties inline.

### Button vocabulary
`.ds-btn-primary` for the ONE primary action per view. Never two primaries on one surface. `.ds-btn-ghost` for secondary. `.ds-icon-btn` for chrome icons.

### Card primitives
`.ds-card` for any panel. Modifier `.ds-card--compact` for tight chrome panels, `.ds-card--airy` for editorial spreads.

### Mark / highlight
`<mark>` inside `.ds-canvas` (default warm), `<mark class="rose">`, `<mark class="mint">`. The textured-mark effect requires the SVG filter — include `<svg ...><defs><filter id="ds-filter-rough">...</filter></defs></svg>` once per page. See "Highlighter setup" below.

### Chrome
`.ds-topbar`, `.ds-breadcrumb`, `.ds-tabs` + `.ds-tab`, `.ds-action-bar` + `.ds-btn-primary`/`.ds-btn-ghost`. Compose these for any "interface" surface.

### Tech micro-details
`.ds-crosshairs` + `.ds-ch-tl/tr/bl/br` for the corner marks. `.ds-pulse` for status dots; add class `live` to animate, `tech`/`ok`/`warn`/`err` to color-shift. Use SPARINGLY — overuse turns the design into sci-fi cosplay.

### Pull-quote
`.ds-pull-quote-wrap > .ds-pull-quote > p + footer`. Once or twice per long-form view. The curved-corner pseudo-element is the editorial signature.

### Pull-stat
`.ds-pull-stat > .ds-pull-stat__num + .ds-pull-stat__body`. The kill-shot stat block — used for the SINGLE load-bearing number per surface. Never two per view.

### Modular slots
`.ds-slot-profile` (top-right user/settings slot), `.ds-slot-toast` (global toast region), `.ds-slot-modal` (modal portal root). Empty until a feature claims them. Leave them in scaffolding so future expansion doesn't require re-architecture.

---

## Highlighter setup

The `<mark>` effect needs an inline SVG filter on the page. Include once per top-level surface:

```html
<svg width="0" height="0" aria-hidden="true" style="position: absolute;">
  <defs>
    <filter id="ds-filter-rough">
      <feTurbulence type="fractalNoise" baseFrequency=".08" numOctaves="4"/>
      <feDisplacementMap in="SourceGraphic" scale="5" />
    </filter>
  </defs>
</svg>
```

If you forget it, `<mark>` still works as plain text but loses the textured highlighter feel. The filter is referenced by ID — the SVG can live anywhere on the page.

---

## Common pattern recipes

### A popup/modal with the full alien-tech treatment

```
.ds-card > .ds-topbar (breadcrumb, systemid, close) > .ds-tabs > body content > .ds-action-bar (CTA + ghost)
```

### A periodic table tile-detail panel

```
.ds-card.ds-card--compact (with corner crosshairs)
  > .ds-tag-element  (e.g. "No. 71 · Rare earth")
  > h2.ds-h-tile-name
  > p.ds-deck (italic tag)
  > hr.ds-divider.ds-divider--editorial
  > .ds-badge (coverage)
  > .ds-body  (with mark on key phrase)
  > a.ds-link-readmore
```

### A long-form editorial section

```
section.ds-section
  > header.ds-section-head: .ds-section-num + .ds-kicker + h2.ds-h-section
  > .ds-body (with drop-cap on first ::first-letter only in FIRST section)
  > .ds-pull-quote-wrap > .ds-pull-quote
  > .ds-body
```

---

## Do's and don'ts

### Do
- Use the tokens for everything. If a value isn't in the system, request it via co-work; don't inline.
- Lean into restraint. One pull-quote, one drop-cap, one pull-stat per view. Restraint makes the moments that DO assert hit harder.
- Compose primitives. The chrome (`.ds-topbar` + `.ds-tabs` + `.ds-action-bar`) works for any interface surface.
- Use tech micro-details to mark MEANING (live data, scanned surface, integrity status), not as decoration.

### Don't
- Don't import Google Fonts (or any external font/CSS/JS).
- Don't roll a custom button. `.ds-btn-primary` or `.ds-btn-ghost`.
- Don't use two primaries on one surface.
- Don't mix 3+ highlighter colors in one quote (rose, mint, warm — pick 2 max).
- Don't put `--ds-tech` (cyan) on body text or large surfaces.
- Don't use Frutiger Aero teal anywhere. That's the prior aesthetic, retired.

---

## Migration procedure (per surface)

When re-theming an existing surface to v3:

1. **Audit current styles.** Note every `color:`, `background:`, `font-family:`, `box-shadow:`, `padding:`, `margin:` value the surface uses.
2. **Map to tokens.** For each value, find the corresponding `--ds-*` token. If no token exists for a needed value, STOP and surface the gap to the user — don't inline.
3. **Preserve behavior.** Don't touch state mutations, event handlers, invariants, or chokepoint helpers. Visual layer only.
4. **Screenshot before/after.** Capture the surface in 2-3 key states. Compare against v3 reference (trace-minerals-popup-v3.html in outputs/).
5. **Ship via safe_write.** Atomic update, paired with the log entry per closing-move-atomic doctrine.
6. **Verify with invariants.** Run the full manifest. The 3 design-system invariants must pass (warn-mode for now, ERROR-mode after Round 3 of migration).

---

## Where things live

```
dashboard/assets/styles/
├── design-system.css                 # the single source of truth
├── design-system.golden.sha256       # the integrity hash anchor
├── STYLE-GUIDE.md                    # this file
└── CHANGELOG.md                      # versioned changes to the system

dashboard/assets/fonts/
├── README.md                         # font procurement instructions
├── LICENSE.md                        # SIL OFL 1.1 + per-family attribution
├── PlayfairDisplay-VariableFont_wght.ttf      (+ -Italic)   ┐ 5 original
├── Merriweather-VariableFont_opsz,wdth,wght.ttf (+ -Italic) │ editorial
├── CrimsonPro-VariableFont_wght.ttf           (+ -Italic)   │ families
├── SpaceGrotesk-VariableFont_wght.ttf                       │
├── JetBrainsMono-VariableFont_wght.ttf                      ┘
├── ChakraPetch-{Regular,SemiBold,Bold}.ttf    ┐ 2 added in the
└── BrunoAce-Regular.ttf                        ┘ v3.2 type pivot
# in-housed as .ttf (design-system.css prefers .woff2, falls back to .ttf)

tools/invariants.py                   # 3 paired daily invariants:
                                      #   check_no_external_style_resources
                                      #   check_design_system_hash_integrity
                                      #   check_design_system_write_protection
```

---

## How this protects 4 years from now

- **Hosted font CDN dies** → fonts are local, woff2/ttf both have 99%+ browser support that hasn't changed in a decade.
- **CSS syntax gets deprecated** → we use stable specs (custom properties, color-mix, hsl-from, @property — all in CSS proper, not experimental).
- **Agent silently drifts a style** → hash anchor catches it. User-only-writer enforces it.
- **A future maintainer doesn't understand the language** → this guide + the inline comments in `design-system.css` + the v3 reference HTML in outputs/.
- **An external script disappears** → invariant fails loud at next audit listing the offending URL.

---

## Provenance

- v3 calibration reference: `outputs/trace-minerals-popup-v3.html` (user-approved 2026-06-21)
- Retired aesthetic: Frutiger Aero (teal palette) — see `memory/user-prefs/aesthetic.md` historical block

---

_Adopted: 2026-06-21. Last updated: 2026-06-21._
