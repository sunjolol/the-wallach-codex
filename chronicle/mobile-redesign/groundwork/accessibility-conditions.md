# Accessibility and real-world conditions — the contract for the mobile redesign

Groundwork for the mobile-first rebuild. Written 2026-08-22 against `master` @ `ea7a792d`.
Not a surface design and not an IA — this is the constraint envelope every surface design and
every implementation patch has to satisfy, plus the audit of what the code does today.

**Every number in this file was measured, not recalled.** Nothing here is a checklist copied
from a blog post. Where a thing could not be determined it says so in §10 rather than
guessing (CLAUDE.md §00.A: never guess, and never guess silently).

---

## §0 — Method, so every finding is re-runnable

Three instruments produced the numbers below.

**(a) A headless render audit of the real app.** Puppeteer (`node_modules/puppeteer`, the same
one the 40 probes in `tools/probes/` use) loads `file:///…/dashboard/dashboard.html` at
`390 x 844, dPR 3, isMobile: true, hasTouch: true` — an iPhone 13/14 logical viewport. It then
walks *every* rendered element on all five surfaces (`coverage`, `regimen`, `scanner`, `search`,
`knowledge`, driven by clicking `[data-rail-nav="…"]` exactly as `render_probe_scanner.js` does)
in **both** themes (`document.documentElement.setAttribute('data-theme', …)`), and for each
element records:

- computed `color` composited over the first opaque ancestor background (alpha-blended properly,
  so translucent `color-mix()` tints are resolved, not skipped) → a real WCAG 2.x contrast ratio;
- computed `font-size` / `font-weight` → the large-text threshold is applied per element
  (≥24px, or ≥18.66px at weight ≥700), not assumed;
- `getBoundingClientRect()` on everything matching the interactive selector set → real
  rendered touch-target geometry;
- accessible-name presence, landmark elements, heading order, and `aria-live` regions.

Script: `scratchpad/a11y_audit.js` (session scratchpad — **not** committed; it is a measuring
instrument, and if the redesign wants it permanently it should land as
`tools/probes/render_probe_a11y.js` with a `--selftest`, see §9-G1). Page errors during the run:
**0**.

**(b) A token-pair contrast matrix** computed directly from the hex literals in
`dashboard/assets/styles/design-system.css` (cream) and `dashboard/assets/styles/theme.css`
(dark) — WCAG relative luminance, sRGB, the standard formula. This catches pairs the live app
does not currently paint but the redesign will.

**(c) Source reads and greps** for ARIA, focus management, `prefers-reduced-motion`,
`:active`, `touch-action`, the viewport meta, and the invariant board.

A **DOM probe is not a visual check** (CLAUDE.md gotcha #3, and the memory
`screenshot-verify-visual-chunks`). Everything below is a number-versus-number finding. It is
blind to a label painted under an opaque shape, to broken rhythm, and to anything merely ugly.
Those still need human eyes on a screenshot.

---

## §1 — The audience, and what it actually implies

This is a health-coverage dashboard about **nutrient deficiency**, built around Dr. Joel
Wallach's framework. Two things about the readership are load-bearing:

1. **It skews older.** Wallach's audience is not twenty-five. The app's own content is about
   arthritis, bone loss, cardiomyopathy, prostate, menopause, cancer support — the goal chips
   in the welcome card literally read *Stronger bones · Healthy joints · Prostate & men's health
   · Women's health & cycles* (`.wc-goal`, 27 chips, measured in §3). Nobody builds that goal
   list for a twenty-year-old.
2. **The app's core act is a judgement about what to put in your body.** A misread number here
   is not a cosmetic defect. §00.A of CLAUDE.md is rigid about never fabricating a dose; the
   same seriousness has to extend to *rendering* the dose legibly. A 9.6px amount that a
   62-year-old squints at and misreads is the same failure class as a wrong amount, arrived at
   from the other end.

### What ageing eyes and hands mean, concretely

These are physiological, not stylistic:

- **Presbyopia** is effectively universal past ~45 and progressive. Near-focus range collapses;
  small type at arm's length stops resolving.
- **Lens yellowing and pupil miosis** cut retinal illuminance. A 60-year-old's retina receives
  roughly a third of the light a 20-year-old's does at the same screen luminance. Low-contrast
  greys that read fine on a 25-year-old designer's monitor vanish.
- **Blue-yellow discrimination degrades first.** The cream palette is warm — good. But
  `--ds-tech` (#5fa4bd, cool cyan) at 2.56:1 on cream paper is the exact pairing that goes
  first.
- **Contrast sensitivity** at low spatial frequency declines; this is *why* WCAG AAA (7:1)
  exists and is not a luxury tier for this audience.
- **Tremor, arthritis, reduced fine-motor precision.** Arthritis is one of the app's own goal
  chips. A 10x10px swatch is not operable by a hand the app is written for.

### The four floors that follow

| Dimension | Floor for this app | Why not the common default |
| --- | --- | --- |
| Body/data type | **16px** min, **17–18px** for any Wallach amount, dose, or target | 14px is the usual "small but fine" default; it is not fine for presbyopia. 16px also happens to be the iOS auto-zoom threshold (§3). |
| Supporting/label type | **14px** absolute floor, nothing below it, ever | The design system's four smallest tokens are 9.6 / 11.2 / 12.48 / 13.6px and they are used *everywhere* (§2). |
| Contrast | **AAA 7:1** for body prose and every number; **AA 4.5:1** as the hard fail line for all other text; **3:1** for UI boundaries and icons | AA-only is the normal target. For this readership AAA on prose is achievable (§4 shows how) and should be the default, not the stretch. |
| Touch target | **44 x 44 CSS px** with **≥8px** clear space between adjacent targets | WCAG 2.2 SC 2.5.8 sets 24x24 as the *minimum* conformance bar. 44 is the Apple HIG / Material 48dp region and is the right number for arthritic thumbs. 24 is a floor for lawyers; 44 is a floor for users. |

**Honesty note:** WCAG specifies **no minimum font size** at all. The 16px/14px floors above are
a *design decision grounded in this audience*, not a standards citation. What WCAG does require
and this app must not break: SC 1.4.4 (text resizable to 200% without loss of content — which is
why the type scale is `rem`-based and must stay that way) and SC 1.4.10 (reflow at 320px CSS
width with no two-dimensional scrolling).

---

## §2 — Type size: the measured state

`--ds-text-*` from `design-system.css:206-224`, resolved at the 16px root:

| Token | Value | px | Verdict |
| --- | --- | --- | --- |
| `--ds-text-micro` | 0.6rem | **9.6px** | Below any usable floor. Retire on mobile. |
| `--ds-text-mini` | 0.7rem | **11.2px** | Below floor. |
| `--ds-text-xs` | 0.78rem | **12.48px** | Below floor. |
| `--ds-text-sm` | 0.85rem | **13.6px** | Below the 14px floor by 0.4px. |
| `--ds-text-base` | 1rem | 16px | OK — this is the mobile *minimum*, not the mobile body size. |
| `--ds-text-md` | 1.05rem | 16.8px | OK. |
| `--ds-text-lg` | 1.25rem | 20px | OK. |

**Measured at 390px, cream theme, distinct rendered text runs below 14px:**

| Surface | Distinct sub-14px runs |
| --- | --- |
| Coverage | 57 |
| Regimen | 54 |
| Knowledge | 43 |
| Search | 30 |
| Scanner | 28 |

Size histogram across all five (distinct selector+size pairs, 112 total):
`8.96px x1 · 9px x3 · 9.28px x3 · 9.5px x1 · 9.6px x29 · 10px x14 · 10.5px x1 · 10.6px x1 ·
11px x1 · 11.2px x23 · 11.52px x3 · 12px x4 · 12.16px x1 · 12.48px x9 · 12.8px x3 · 12.88px x1 ·
13px x1 · 13.12px x3 · 13.6px x10`.

The mode is **9.6px** (`--ds-text-micro`), 29 distinct places. Worst single case: `8.96px`
(`span.kcard-facets`, Ask-Wallach browse card, "How it works · Basics · So…").

Named offenders worth pointing at because the *content* matters:

| What | Size | Where |
| --- | --- | --- |
| `span.tile__name` — the essential's NAME on a coverage tile ("HYDROGEN", "SILVER") | 9.5px | `workspace-coverage.css` tile block |
| `span.tile__hint` — "n-3 · alpha-linolenic (ALA)" | 9.6px | ditto |
| `span.rec__price` — "$48.95", `span.rec__q` — "adds 26" | 9.6px | Coverage recommendations |
| `.sh-hint` (search suggestion chips: Calcium / Arthritis / Depression) | **9px, hard-coded** | `drawer-knowledge.css:2019` — `font-size:9px` |
| `.ep-legend__lbl` / `.ep-legend__item` (the category colour key) | 9px | entity page legend |
| `.vd-manual` "or add it by hand" — the scanner's whole fallback path | 9.6px (`--ds-text-micro`) | `workspace-scanner.css:66` |

### Contract

- **T1** No rendered text below **14px** on any mobile surface. No exceptions for eyebrows,
  kickers, legends, monospace readouts, or chip labels.
- **T2** Body prose, and every nutrient amount / dose / daily target / coverage percentage,
  renders at **≥16px**; prefer 17px for amounts.
- **T3** The mobile type scale is defined in **`rem`**, never `px`, so OS text-size settings and
  browser zoom work. (Today's tokens are already `rem` — keep it.)
- **T4** Mobile does not get its own font-size *token names*. Re-point the existing
  `--ds-text-*` tokens under the mobile layer so every consumer inherits the fix at once
  (`--ds-text-micro: 0.875rem` collapses micro/mini/xs into one legible step). See the
  `token-indirection-grep-the-readers` memory before repointing: **grep the readers first**,
  because collapsing micro/mini/xs will change rhythm in ~112 places and some of them are
  deliberate.
- **T5** No text below 16px inside an `<input>`, `<select>` or `<textarea>` — see §3 (iOS
  auto-zoom).

---

## §3 — Touch targets: the measured offenders

**77 distinct interactive elements render smaller than 44x44 at 390x844.** Geometry is identical
in both themes. The full ranked list follows; `file:line` is the rule that sets the size.

### Tier 1 — unusable, not merely small

| Rendered | Element | Rule | Fix |
| --- | --- | --- | --- |
| **10 x 10** | `button.ck-swatch` — the regimen save-slot colour picker | `workspace-regimen.css:146-153` (`width:10px; height:10px`) | Keep the 10px *dot* as the visual; wrap it in a 44x44 hit area (`padding:17px; background:none; border-radius:50%`) or use a transparent `::after { position:absolute; inset:-17px }`. Do **not** just scale the dot — the row rhythm is deliberate. |
| **11 x 56** | `div.rail__profile` — the profile trigger, all 5 surfaces | `dashboard.css:83` | 11px wide because the rail collapses at 390px. The mobile IA moves this anyway; whatever replaces it is 44x44. |
| **11.4 x 11.4** | `button.ck-swatch.is-on` | `workspace-regimen.css:157+` | Same fix as above. |
| **18 x 18** | `button.fs-pager__b--arrow` — Coverage food pager prev/next | `dashboard.css:551-558` (`min-width:18px; height:18px`), gap `4px` at `:549` | 18px targets 4px apart. Under WCAG 2.2 SC 2.5.8 even the *spacing exception* needs 24px clearance: 18+4 = 22 < 24, so this fails the minimum bar too. Mobile pager should not be numbered chiclets at all — see §7 (one-handed). |
| **22 x 22** | `button.fs-pager__b` (Regimen console pager, incl. numbers) | `dashboard.css:570` | Same. |
| **24 x 24** | `button.ck-slot__pencil` (rename save) and `.ck-slot__export` | `workspace-regimen.css:92-100` | 44x44 with the 13px glyph centred (`workspace-regimen.css:103`). |
| **28 x 28** | `button.ui-close--sm` — the canonical *small* close/remove, used for every chip and row removal app-wide | `dashboard.css:385` (`--uic-size: 28px`) | `--uic-size: 44px` under the mobile layer. One token, every instance. |
| **34 x 34** | `button.ui-close` — the canonical close, every modal/panel/drawer | `dashboard.css:373-374` (`--uic-size: 34px`) | `--uic-size: 44px`. Same token. |
| **34 x 34** | `button.scr-nav--close` — the Ask-Wallach close (a *twin* of `.ui-close`, separately declared) | `drawer-search.css:109` (`width:34px; height:34px`) | Must be fixed **separately** — it does not read `--uic-size`. This duplicate is itself worth collapsing into `.ui-close`. |

### Tier 2 — systematically short by 8–17px (height-only failures)

| Rendered | Element | Rule | Note |
| --- | --- | --- | --- |
| 17.4px tall | `button.vd-manual` "or add it by hand" | `workspace-scanner.css:66` | An underlined text link 17px tall at 9.6px type, and it is the scanner's entire manual-entry escape hatch. |
| 22px tall | `select.fs-filter__cat`, `input.fs-filter__q` | `dashboard.css:610-614` (`height:22px`) | See the iOS note below — the comment at `dashboard.css:600-609` explains the 22px is load-bearing (a `<select>` given less room than its text renders empty). Raising the height is safe; raising the *font* without the height is what broke before. |
| 17px tall | `input.ck-addfield__input` | `workspace-regimen.css:404` | Its 44px comes from the `.ck-addfield` wrapper (`:400`, `padding:11px 13px`) — measure the wrapper, but the *input itself* must still clear 16px font. |
| 22px tall | `button.sh-hint` (Calcium / Arthritis / Depression) | `drawer-knowledge.css:2019` (`padding:.25rem .6rem`, `font-size:9px`) | |
| 24 / 24.4px | `input.aw-search__input`, `input.kh-search`, `button.ck-slot__import` | `drawer-search.css:131`, `workspace-regimen.css` | |
| 26px | `button.ds-btn-primary.vd-newscan` — **"+ New Scan", the scanner's primary CTA** | `workspace-scanner.css` | The single most important button on the Scanner surface is 26px tall. |
| 27px | `button.gchip.gchip--add`, `button.kd-explore-chip` (x12) | `workspace-coverage.css:873`, `drawer-knowledge.css:1825` (`padding:4px 11px`) | |
| **28px x 27 chips** | `button.wc-goal` — every goal chip in the welcome card, on all 5 surfaces | `workspace-coverage.css:1144` (`padding:5px 12px`) | 27 targets, 28px tall, in a wrapped cloud. This is the first thing a new user touches. |
| 33.2px | `button.kd-knh__tab` x6 (Home/Explore/Products/Conditions/Absorption/ORAC) | `drawer-knowledge.css:34` (`padding:.6rem 1.2rem`) | The Knowledge tab bar — the surface he called "cheap". |
| 35px | `button.topbar__ask` "Ask Wallach" | `dashboard.css:121` | |
| 36px | `button.wc__browse` "I'm just browsing →" | `workspace-coverage.css:1151` | |
| 36.6px | `button.sh-condrow` (condition rows in search) | `drawer-knowledge.css` | |
| 38.7px | `button.rr-scan__link` "Scan your own item →" | `workspace-regimen.css` | |
| 41.6px | `button.ds-btn-primary.rail-panel__full` "FULL REGIMEN →" | `workspace-coverage.css` | Off by 2.4px. |
| 42px | `button.rail__item` x5 — every workspace nav item | `dashboard.css:72` (`padding: var(--ds-space-3)` = 12px) | Off by 2px, and it is the app's primary navigation. |
| 14.9px | `label.wc__label` "Your name" | `workspace-coverage.css` | A `label[for]` counts as a target. |

### The iOS 16px input floor

iOS Safari zooms the whole page when a text field with a computed `font-size` under 16px takes
focus, and does not zoom back out. That is a page-level layout break triggered by tapping a
search box. Measured today:

| Field | Computed size | Verdict |
| --- | --- | --- |
| `.fs-filter__q` / `.fs-filter__cat` | `12px` (`dashboard.css:611`) | **ZOOMS** |
| `.ck-addfield__input` | `--ds-text-sm` = `13.6px` (`workspace-regimen.css:404`) | **ZOOMS** |
| `#drawer-search-mount .aw-search__input` | `1.1rem` = 17.6px (`drawer-search.css:133`) | safe |
| `#drawer-knowledge-mount .sh-search input` | `--ds-text-md` = 16.8px (`drawer-knowledge.css:1997`) | safe |
| `:where(.vd) input, :where(.vd) textarea` | `font: inherit` (`workspace-scanner.css:14`) | **depends on the inherited value — verify per instance** |

This was already discovered once, on the discarded branch: `mobile-responsive`'s
`dashboard/assets/styles/mobile.css:437-461` carries a `★ THE 16px INPUT FLOOR` block with
`input, select, textarea { font-size: max(16px, 1em); }` plus per-drawer specificity escalations,
and `tools/probes/render_probe_mobile.js` on that branch fails the board on any sub-16px field.
**The finding and the probe are worth salvaging even though `mobile.css` itself is being thrown
away.**

### The viewport meta is correct — keep it

`dashboard/dashboard.html:30` is `<meta name="viewport" content="width=device-width,
initial-scale=1.0">`. No `user-scalable=no`, no `maximum-scale`. Pinch-zoom works. **Do not add
either one** to "fix" the iOS zoom — that trades a layout wobble for WCAG 1.4.4 failure, and
pinch-zoom is exactly the accommodation this audience uses.

### Contract

- **A1** Every interactive element renders **≥44x44 CSS px** at 320–430px viewport width. Where
  the visual mark must stay small (a colour dot, a hairline chevron), the *hit area* is expanded
  invisibly — never the mark.
- **A2** Adjacent targets have **≥8px** clear space. `.fs-pager` at `gap: 4px`
  (`dashboard.css:549`) is the current violation.
- **A3** No `<input>`, `<select>` or `<textarea>` computes below **16px**.
- **A4** The viewport meta stays `width=device-width, initial-scale=1.0` with no zoom lock.
- **A5** Every icon-only control carries a visible-on-focus target ring *and* an accessible name
  (§5).

---

## §4 — Contrast: the real audit

Two passes. Pass one is the **token matrix** — every foreground token against every paper token,
both themes, computed from the hex literals. Pass two is the **rendered audit** — what the app
actually paints, which catches composited translucent tints the matrix cannot see.

### 4.1 The token matrix — CREAM

Foreground token vs. paper token. `FAIL` = below AA 4.5:1 (normal text). `aa` = 4.5–6.99.
`AAA` = ≥7.

| token | on `--ds-paper` #faf5e8 | on `--ds-paper-light` #fffbf2 | on `--ds-paper-deep` #f2ead3 | on `--ds-paper-darker` #ebe2c4 |
| --- | --- | --- | --- | --- |
| `--ds-ink` #1a1612 | 16.52 AAA | 17.42 AAA | 14.98 AAA | 13.88 AAA |
| `--ds-ink-medium` #3d342a | 11.20 AAA | 11.80 AAA | 10.15 AAA | 9.41 AAA |
| `--ds-ink-soft` #6a5d50 | 5.86 aa | 6.17 aa | 5.31 aa | 4.92 aa |
| `--ds-ink-faint` #9b8e7c | **2.94 FAIL** | **3.10 FAIL** | **2.67 FAIL** | **2.47 FAIL** |
| `--ds-accent` #ff7e3c | **2.32 FAIL** | **2.45 FAIL** | **2.11 FAIL** | **1.95 FAIL** |
| `--ds-accent-bright` #ff9d5c | **1.89 FAIL** | **1.99 FAIL** | **1.71 FAIL** | **1.58 FAIL** |
| `--ds-accent-hot` #ff6420 | **2.72 FAIL** | **2.87 FAIL** | **2.46 FAIL** | **2.28 FAIL** |
| `--ds-accent-deep` #c8552a | **4.03 FAIL** | **4.25 FAIL** | **3.65 FAIL** | **3.38 FAIL** |
| `--ds-tech` #5fa4bd | **2.56 FAIL** | **2.70 FAIL** | **2.32 FAIL** | **2.15 FAIL** |
| `--ds-status-ok` #5b8a3f | **3.74 FAIL** | **3.95 FAIL** | **3.39 FAIL** | **3.15 FAIL** |
| `--ds-status-warn` #c79830 | **2.42 FAIL** | **2.55 FAIL** | **2.20 FAIL** | **2.04 FAIL** |
| `--ds-status-err` #b04a30 | 4.99 aa | 5.26 aa | 4.52 aa | **4.19 FAIL** |
| `--ds-status-info` #4a7090 | 4.81 aa | 5.07 aa | **4.36 FAIL** | **4.04 FAIL** |
| `--ds-rule` #d4c8a9 | 1.53 | 1.61 | 1.38 | 1.28 |
| `--ds-rule-bright` #c4b889 | 1.83 | 1.92 | 1.66 | 1.53 |

Headlines:

- **`--ds-ink` and `--ds-ink-medium` are excellent** — 16.52 and 11.20 on paper. Real prose is
  fine. The palette's bones are sound.
- **`--ds-ink-soft` clears AA but never AAA** (5.86 / 5.31 / 4.92). It is the app's default
  "secondary text" colour. For this audience that is the wrong default.
- **`--ds-ink-faint` fails AA in every combination.** It is used for eyebrows, hints, counts,
  placeholders — 40+ rendered instances, and often at 9.6px, which compounds.
- **The entire accent family fails as TEXT on paper.** `--ds-accent` at 2.32:1 is not a
  borderline case. Even `--ds-accent-deep`, the "for text" variant, is 4.03 — below AA.
- **`--ds-rule` at 1.53:1 fails SC 1.4.11 (3:1 for non-text UI boundaries).** Every input border,
  card edge and divider in the app is drawn at 1.5:1. In sunlight they will simply not exist.

Rules used as *component boundaries* need 3:1 (SC 1.4.11). Computed replacements, same method as
§4.4: cream `--ds-rule` #d4c8a9 → **`#a38c51`** (3.00 on `--ds-paper`) / **`#a79054`** (3.00 on
`--ds-paper-light`); dark `--ds-rule` #38322a → **`#6b6050`** (3.00 on `--ds-paper`) /
**`#726656`** (3.00 on `--ds-paper-light`). These are *meaningful-boundary* values — a purely
decorative divider may stay light, but an input edge, a card edge or a state ring may not.

### 4.2 The token matrix — DARK

Dark inverts: ink tokens flip light, paper tokens flip dark (`theme.css:27-40`).

| token | on `--ds-paper` #17130d | on `--ds-paper-light` #221d15 | on `--ds-paper-deep` #100c08 | on `--ds-paper-darker` #0b0805 |
| --- | --- | --- | --- | --- |
| `--ds-ink` #f3ead7 | 15.47 AAA | 14.00 AAA | 16.29 AAA | 16.71 AAA |
| `--ds-ink-medium` #d9ccb4 | 11.67 AAA | 10.56 AAA | 12.29 AAA | 12.60 AAA |
| `--ds-ink-soft` #a89a80 | 6.69 aa | 6.06 aa | 7.05 AAA | 7.23 AAA |
| `--ds-ink-faint` #786c58 | **3.60 FAIL** | **3.26 FAIL** | **3.79 FAIL** | **3.89 FAIL** |
| `--ds-accent` #ff7e3c | 7.31 AAA | 6.62 aa | 7.70 AAA | 7.90 AAA |
| `--ds-accent-bright` #ff9d5c | 9.01 AAA | 8.15 AAA | 9.49 AAA | 9.73 AAA |
| `--ds-accent-hot` #ff6420 | 6.25 aa | 5.66 aa | 6.58 aa | 6.75 aa |
| `--ds-accent-deep` #c8552a | **4.22 FAIL** | **3.82 FAIL** | **4.44 FAIL** | 4.56 aa |
| `--ds-tech` #5fa4bd | 6.63 aa | 6.00 aa | 6.99 aa | 7.17 AAA |
| `--ds-status-ok` #5b8a3f | 4.54 aa | **4.11 FAIL** | 4.78 aa | 4.90 aa |
| `--ds-status-warn` #c79830 | 7.01 AAA | 6.35 aa | 7.39 AAA | 7.57 AAA |
| `--ds-status-err` #b04a30 | **3.41 FAIL** | **3.08 FAIL** | **3.59 FAIL** | **3.68 FAIL** |
| `--ds-status-info` #4a7090 | **3.53 FAIL** | **3.20 FAIL** | **3.72 FAIL** | **3.82 FAIL** |
| `--ds-rule` #38322a | 1.46 | 1.32 | 1.54 | 1.58 |
| `--ds-rule-bright` #4a4132 | 1.84 | 1.67 | 1.94 | 1.99 |

Headlines:

- Dark **fixes** the accent (2.32 → 7.31) and warn (2.42 → 7.01), because a saturated colour that
  is too light for cream is right for charcoal. Confirms `dark-theme-token-remaps`.
- Dark **breaks** the two tokens cream got right: `--ds-status-err` 4.99 → **3.41**, and
  `--ds-status-info` 4.81 → **3.53**. On the Scanner — the surface whose whole job is telling you
  something is wrong — the error colour is the one that fails in dark.
- `--ds-accent-deep` fails in **both** themes (4.03 cream / 4.22 dark). It has no theme where it
  is a legal text colour, and it is used as one (`.rr-scan__link`, `.kd-knh__tab.active`,
  `.vd-step__state.is-active`).
- **`--ds-rule` fails 3:1 in dark too** (1.46:1). Borders are invisible in both themes.

### 4.3 The rendered audit — what the app actually paints

At 390x844 the walk found, per surface (AA failures / AAA-or-worse failures):

| Surface | cream AA fails | cream sub-AAA | dark AA fails | dark sub-AAA |
| --- | --- | --- | --- | --- |
| Coverage | **32** | 52 | 20 | 29 |
| Regimen | **27** | 45 | 17 | 32 |
| Knowledge | **20** | 32 | 12 | 21 |
| Search | **16** | 24 | 10 | 18 |
| Scanner | **15** | 21 | 10 | 16 |

Every measured AA failure, worst first (deduped across surfaces; `sel · fg on bg · size ·
measured ratio · required`):

| Ratio | Need | fg on bg | Size | Element | Sample |
| --- | --- | --- | --- | --- | --- |
| **1.95** | 4.5 | #ff7e3c on #ebe2c4 | 22.4px | `.essentials-section__num` | "01" |
| **1.95** | 4.5 | #ff7e3c on #ebe2c4 | 12.88px | `strong` in section stat | "5" |
| **1.95** | 4.5 | #ff7e3c on #ebe2c4 | 14.4px | `.essentials-subsection__rank` | "A" |
| **2.12** | 4.5 | #f3ead7 on #ff7e3c | 13.6px | `.vd-step__badge.is-active` (dark) | "1" |
| **2.32** | 4.5 | #ff7e3c on #faf5e8 | 9.6px | `.wc__kicker` | "// Let's get started" |
| **2.32** | 4.5 | #faf5e8 on #ff7e3c | 12px | `.fs-pager__b[aria-current]` | current page number |
| **2.32** | 4.5 | #ff7e3c on #faf5e8 | 16px | `.ck-addfield__plus`, `.kd-knh__g` | "+", "❡" |
| **2.45** | **3.0** | #ff7e3c on #fffbf2 | 21px bold | `.fs-lead__pct` | "436" — a coverage percentage |
| **2.45** | 4.5 | #ff7e3c on #fffbf2 | 10px bold | `sup` | "%" |
| **2.45** | 4.5 | #fffbf2 on #ff7e3c | 13.6px | `.vd-step__badge.is-active` (cream) | "1" |
| **2.47** | 4.5 | #9b8e7c on #ebe2c4 | 9.6px | `.essentials-subsection__hint` | "air · water · food · nothing to…" |
| **2.47** | 4.5 | #9b8e7c on #ebe2c4 | 9.6px | `.ledger-bar__eyebrow`, `.ledger__recon` | "Colour key", "counted · shown" |
| **2.67** | 4.5 | #9b8e7c on #f2ead3 | 9.6–12px | `.tile__num`, `.tile__code`, `.goalstrip__eyebrow`, `.fs-rule__label`, `.recs__eyebrow`, `.ck-recs__note`, `.fs-pager__gap`, `.vd-manual` | tile codes, section labels |
| **2.73** | **3.0** | #5aa82c on #faf5e8 | 25.6px bold | `em` in the Ask-Wallach hero | "Wallach" |
| **2.94** | 4.5 | #9b8e7c on #faf5e8 | 9–11.2px | `.wc__label`, `.wc__count`, `.wc__goal-cat`, `.goalstrip__eyebrow`, `.recs__eyebrow`, `.ck-readout__label`, `.ck-addfield__kbd`, `.vd-drop__n`, `.ep-seclabel__hint`, `.ep-legend__lbl` | welcome-card labels, "or drop / paste an image here" |
| **2.94** | **3.0** | #9b8e7c on #faf5e8 | 20px bold | `.vd-drop__ic` | the scanner upload arrow "↑" |
| **3.10** | 4.5 | #9b8e7c on #fffbf2 | 9.3–11.5px | `.gchip--add`, `.rec__add`, `.rail-panel__eyebrow`, `small`, `.ck-slot__emptysub`, `.ck-cluster__head`, `.gchip__label` | "+ ADD", "Add a food or supplement to begin" |
| **3.26** | 4.5 | #786c58 on #221d15 | 9.3–11.5px | same set, **dark** | |
| **3.38** | 4.5 | #c8552a on #ebe2c4 | 9.6–11.2px | `.essentials-section__stat`, `.essentials-subsection__count` | "/ 60 covered" |
| **3.60** | 4.5 | #786c58 on #17130d | 9–11.2px | `.wc__label`, `.wc__goal-cat`, `.fs-pager__at`, `.vd-drop__n`, `.ep-legend__lbl`, **dark** | |
| **3.65** | 4.5 | #c8552a on #f2ead3 | 12.48px bold | `.rr-scan__link` | "Scan your own item →" |
| **3.74** | 4.5 | #5b8a3f on #faf5e8 | 9.6–13.6px | `.topbar__ask-label`, `.topbar__ask-kbd` | **"Ask Wallach"** — the global CTA |
| **3.74** | 4.5 | #c8552a on #ffe9d8 | 11.2px bold | `.vd-step__state.is-active` | "Start here" |
| **3.79** | 4.5 | #786c58 on #100c08 | 9.6–12px | `.tile__num`, `.tile__code`, `.goalstrip__eyebrow`, `.fs-rule__label`, `.recs__eyebrow`, `.vd-manual`, **dark** | |
| **3.89** | 4.5 | #786c58 on #0b0805 | 9.6px | `.essentials-subsection__hint`, `.ledger-bar__eyebrow`, `.ledger__recon`, **dark** | |
| **3.95** | 4.5 | #5b8a3f on #fffbf2 | 9.6–11.2px | `.rec__val`, `.rec__q` | **"5.3 / $10", "+26 essentials"** — recommendation numbers |
| **4.03** | 4.5 | #c8552a on #faf5e8 | 10–11.2px | `.kd-knh__tab.active`, `a` | "Home", "open the full table →" |
| **4.08** | 4.5 | #ffffff on #5b8a3f | 9.5px | `.tile__name` on a covered tile | **"HYDROGEN"** — an essential's name |

Notable AAA-band (pass AA, fail 7:1) items on body-size text, which matter for this audience:
`.kd-explore-chip` #8a52d6 on paper 4.53 · `.essentials-section__sub` / `.ledger__label` /
`.ledger__n` #6a5d50 on #ebe2c4 **4.92** · `.tile__sym` / `.tile__name` / `.tile__letter` /
`.tile__abbr` / `.tile__hint` #6a5d50 on #f2ead3 **5.31** · `sup` #2b6fb0 on #fffbf2 5.08.

**The single worst structural finding:** the coverage tile — the app's central object, 90 of
them — puts the essential's symbol, name, code and hint at 9.5–17px in `--ds-ink-soft` on
`--ds-paper-deep` at **5.31:1**, and when the tile is *covered* it flips to white on
`--ds-status-ok` at **4.08:1**, which fails AA outright. The map of gaps is drawn in colours the
audience cannot reliably read.

### 4.4 The replacement values

Computed by holding hue and saturation in HLS and moving lightness until the ratio is met. All
values verified against the target ratio, not eyeballed.

**Cream — darken to reach AA 4.5:1 on `--ds-paper` #faf5e8, and AAA 7:1 on the darkest paper
`--ds-paper-darker` #ebe2c4 (the worst case, so it holds everywhere):**

| token | today | AA on paper | AA on paper-darker | **AAA on paper-darker** |
| --- | --- | --- | --- | --- |
| `--ds-accent` #ff7e3c | 2.32 | `#c84400` | `#b43d00` | `#822c00` |
| `--ds-accent-hot` #ff6420 | 2.72 | `#cd3e00` | `#b83800` | `#852900` |
| `--ds-accent-deep` #c8552a | 4.03 | `#bb5027` | `#a84723` | `#793419` |
| `--ds-tech` #5fa4bd | 2.56 | `#3b788f` | `#356c80` | `#264e5c` |
| `--ds-status-ok` #5b8a3f | 3.74 | `#527c39` | `#496f33` | `#355024` |
| `--ds-status-warn` #c79830 | 2.42 | `#8d6c22` | `#7e601e` | `#5b4516` |
| `--ds-status-err` #b04a30 | 4.99 | (passes) | `#a8472e` | `#793321` |
| `--ds-status-info` #4a7090 | 4.81 | (passes) | `#456986` | `#324b61` |
| `--ds-ink-faint` #9b8e7c | 2.94 | `#7b6f5e` | `#6e6454` | `#4f473d` |
| `--ds-ink-soft` #6a5d50 | 5.86 | (passes) | — | `#51473d` |

**Dark — lighten to reach AA on `--ds-paper` #17130d and AA/AAA on `--ds-paper-light` #221d15:**

| token | today | AA on paper | AA on paper-light | **AAA on paper-light** |
| --- | --- | --- | --- | --- |
| `--ds-accent-deep` #c8552a | 4.22 | `#d0582c` | `#d56237` | `#e29477` |
| `--ds-status-ok` #5b8a3f | 4.54 | (passes) | `#609142` | `#80b65f` |
| `--ds-status-err` #b04a30 | 3.41 | `#cb5b3f` | `#ce664c` | `#dd9684` |
| `--ds-status-info` #4a7090 | 3.53 | `#5681a6` | `#5e89ac` | `#8dabc5` |
| `--ds-ink-faint` #786c58 | 3.60 | `#897b65` | `#91836a` | `#b1a695` |
| `--ds-ink-soft` #a89a80 | 6.06 | (passes) | — | `#b3a68f` |

**On-fill text — which ink to use on a coloured button:**

| fill | cream: `#1a1612` ink | cream: `#fffbf2` paper | dark: `#221d15` | dark: `#f3ead7` |
| --- | --- | --- | --- | --- |
| `--ds-accent` #ff7e3c | **7.11 AAA** | 2.45 FAIL | **6.62 aa** | 2.12 FAIL |
| `--ds-accent-hot` #ff6420 | **6.08 aa** | 2.87 FAIL | 5.66 aa | 2.47 FAIL |
| `--ds-status-warn` #c79830 | **6.82 aa** | 2.55 FAIL | 6.35 aa | 2.21 FAIL |
| `--ds-tech` #5fa4bd | **6.45 aa** | 2.70 FAIL | 6.00 aa | 2.33 FAIL |
| `--ds-status-ok` #5b8a3f | 4.41 FAIL | 3.95 FAIL | 3.41 FAIL | — |
| `--ds-status-err` #b04a30 | 3.31 FAIL | **5.26 aa** | — | **4.54 aa** |
| `--ds-status-info` #4a7090 | 3.44 FAIL | **5.07 aa** | — | **4.38 FAIL** |

**Rule:** on the *warm* fills (accent / warn / tech) the legible text is **dark ink**, in both
themes. Today the app paints `--ds-paper` on `--ds-accent` (`.fs-pager__b[aria-current]`,
`.vd-step__badge.is-active`) at 2.32–2.45:1 — this is exactly backwards and is a one-line fix per
site. On the *cool/dark* fills (err / info) it is the reverse. `--ds-status-ok` has **no**
legible pairing at its current value in either theme and must be darkened
(`#56823b` gives white text 4.5:1) or paired with dark ink after darkening.

### 4.5 The constraint on how these land

`design-system.css` is **SEALED** — user-writer-only, hash-anchored by
`dashboard/assets/styles/design-system.golden.sha256` and policed by an ERROR-mode gate
(`tools/invariants.py:745-756`). The agent may never edit it. Every value above therefore lands
as a **shadow in a later, non-sealed layer** — the mechanism `theme.css` already uses (see its
header comment, and `theme.css:109-116` where `:root` tokens are already re-declared). Same
specificity, later cascade position, no `!important` needed.

Concretely: the mobile layer declares the accessible palette on `:root` and
`:root[data-theme="dark"]`, loading **after** `theme.css`. No sealed byte moves; the golden hash
stays green.

**Also note:** `theme.css` remaps `--ds-accent` across eight `[data-accent]` families
(`theme.css:62-91`: ember / sapphire / verdant / amethyst / rose / gold / teal / slate). Fixing
`--ds-accent` for ember alone fixes one of eight. **All eight need auditing** — this document
measured ember (the default) only; see §10.

### Contract

- **C1** Every text/background pair the app can paint clears **AA 4.5:1** (3:1 for large text).
  No exceptions, no "decorative" carve-outs for numbers.
- **C2** Body prose and every nutrient amount / dose / target / percentage clears **AAA 7:1**.
- **C3** Every non-text UI boundary that carries meaning (input borders, card edges, focus rings,
  the coverage tile's state ring, chart strokes) clears **3:1** — SC 1.4.11. `--ds-rule` at
  1.53:1 fails today.
- **C4** Both themes are audited, every time. Cream and dark break *different* tokens; a fix
  verified in one theme is not verified.
- **C5** Colour is never the only carrier of meaning — SC 1.4.1. Coverage state (covered / gap /
  partial) must also differ in shape, mark or text. This already matters here: the file comment
  at `workspace-coverage.css:363-365` records that PARTIAL was once `--ds-paper-light` on
  `--ds-paper` and "imperceptible". The category taxonomy (minerals blue / vitamins orange /
  aminos green / omegas purple) is **fixed and must not change** — so it needs a non-colour
  partner (the existing `.tile__code` prefix `V·01` / `F·01` is one, once it is legible).

---

## §5 — Screen readers: the measured state and the guarantee

### What exists today (source-counted, `dashboard/assets/js/src`)

| Attribute | Occurrences |
| --- | --- |
| `aria-label` | 85 |
| `aria-hidden` | 69 |
| `aria-pressed` | 12 |
| `aria-modal` | 6 |
| **`aria-live`** | **2** |
| `aria-expanded` | 2 |
| `aria-current` | 2 |
| `aria-selected` | 1 |
| `aria-labelledby` | 1 |
| `aria-haspopup` | 1 |
| `aria-describedby` | 1 |
| `aria-checked` | 1 |

**Good news, measured:** across all five surfaces in both themes, the walk found **zero**
interactive controls with no accessible name. The 85 `aria-label`s are doing real work — every
icon-only close, pager arrow and swatch is named. That is a genuinely better starting point than
most codebases and the redesign should not regress it.

**The gaps, measured:**

1. **There are two `aria-live` regions in the entire app**, both the same one:
   `views/profile.ts:168` (`.pf-err`, `role="alert" aria-live="polite"`). The audit found
   **`live = []` on every one of the five surfaces** — Coverage, Regimen, Scanner, Search,
   Knowledge all render with no live region at all. So:
   - the **scanner verdict** — the result of pointing a camera at a product label — is announced
     to nobody;
   - **search results** appearing under Ask Wallach are announced to nobody;
   - coverage recomputation after adding an item is announced to nobody.

   For a blind or low-vision user the scanner is currently a black box: you tap, something
   happens, and the screen reader stays silent.

2. **Heading order is broken.** Measured on Coverage:
   `H1:Coverage → H3:MINERALS → H3:VITAMINS → H3:AMINO ACIDS → H3:FATTY ACIDS →
   H3:DAILY PROTOCOL → H2:What do you want to work on?`. H1 jumps straight to H3 (SC 1.3.1 /
   2.4.10), and the H2 sits *after* the H3s in DOM order.

3. **The H1 goes stale.** Opening the Search drawer from the Scanner leaves `H1:Scanner` as the
   page heading; opening Knowledge yields **two** H1s (`H1:Scanner` and
   `H1:Everything Wallach taught, i…`). A drawer overlay changes what the page *is* without
   changing what it *says* it is.

4. **Landmark duplication with no names.** Coverage renders `aside, header, main, header,
   header, header, header, aside, nav, div[role=dialog]` — four unnamed `<header>`s and two
   unnamed `<aside>`s. A screen-reader landmark list of "banner, banner, banner, banner,
   complementary, complementary" is noise.

5. **Only one of the overlay surfaces is a real dialog.** `role="dialog"` appears twice —
   `views/profile.ts:146` and `views/welcome.ts:117`. The Search and Knowledge **drawers** are
   not dialogs and have no focus trap; the regimen popovers set `aria-modal` (`regimen.ts:952`,
   `:1108`) without the surrounding contract.

6. **The one focus trap that exists is correct and is the model.** `main.ts:401-434` traps Tab
   inside the profile dialog, with the comment *"aria-modal is advisory, so without this focus
   would fall to…"*, focuses the panel on open (`:434`), restores to the trigger on close
   (`:369` `profileTrigger.focus()`), and closes on Escape (`:463`). **Copy this pattern; do not
   reinvent it.**

### Contract

- **S1 — Landmarks.** Exactly one `<main>`. Every repeated landmark carries a distinguishing
  `aria-label` (`<nav aria-label="Workspaces">`, `<header aria-label="…">`). No unnamed
  duplicate landmarks.
- **S2 — Headings.** One `<h1>` per rendered view, matching what the user believes they are
  looking at. No skipped levels. When a sheet or drawer takes over the screen, it owns the H1 (or
  is a dialog labelled by its own heading) and the underlying view's heading is not
  simultaneously exposed.
- **S3 — Names on every icon-only control.** Already true — hold the line. A control whose visible
  text is a glyph (`+`, `❡`, `↑`, `‹`, `›`, a colour dot) has an `aria-label`, and the glyph
  itself is `aria-hidden="true"` so it is not read as punctuation.
- **S4 — Live regions, the three that matter.**
  - **Scanner result:** `role="status" aria-live="polite" aria-atomic="true"` on the verdict
    container. It announces the verdict headline and the hit count — the "hits N of 90" phrasing
    the `scanner-hits-not-covers-doctrine` memory fixes — not the raw OCR dump.
  - **Scanner progress:** a separate polite region for stage changes (scanning → confirming →
    result), and `role="alert"` for the honest failure card (`.vd-error`,
    `workspace-scanner.css:328`).
  - **Search results:** `aria-live="polite"` on a short results summary ("14 results for
    calcium"), **not** on the result list itself — announcing 14 cards is unusable.
  - Coverage recomputation announces a one-line delta, politely, and only on an explicit user
    action.
  - Live regions must exist in the DOM **before** the content lands, or the announcement is
    dropped. Render the empty container at mount.
- **S5 — Focus management on sheets.** A bottom sheet, drawer or modal:
  1. is `role="dialog" aria-modal="true"` with `aria-labelledby` pointing at its own heading;
  2. moves focus into the sheet on open — to the heading or the first control, never to the
     close button by default;
  3. traps Tab and Shift+Tab within it (`main.ts:401-434` is the reference implementation);
  4. marks the background `inert` (or `aria-hidden="true"`) so a screen reader's swipe-navigation
     cannot walk out of the sheet — `aria-modal` alone does not do this and the code comment at
     `main.ts:401` already says so;
  5. closes on **Escape** and on backdrop tap;
  6. **restores focus to the element that opened it**, on every close path — Escape, backdrop,
     close button, and swipe-to-dismiss. Swipe-dismiss is the path that is always forgotten.
- **S6 — Focus visibility.** `:focus-visible` appears **15 times** across 8,536 lines of CSS,
  versus **220** `:hover` rules. Every interactive element in the redesign has a visible focus
  ring meeting 3:1 against both its own background and the adjacent surface (SC 2.4.11/1.4.11).
  This matters on mobile: external keyboards, switch control, and Android's TalkBack focus
  rectangle all use it.
- **S7 — State, not just labels.** Toggles expose `aria-pressed`; tabs expose
  `role="tab"`/`aria-selected` inside a `role="tablist"`; the pager exposes `aria-current="page"`
  (already correct at `dashboard.css:575`); disabled controls use `disabled`, not just
  `opacity:.38` (`dashboard.css:573` currently dims to 38% with no state exposed).
- **S8 — Touch + screen reader together.** With TalkBack/VoiceOver on, a swipe gesture is
  intercepted. Any interaction that *only* works by swipe (dismiss a sheet, page a carousel,
  reveal a row action) must have a non-swipe equivalent that is reachable and named.

---

## §6 — Motion

### What exists

`design-system.css:293-307` has a global `@media (prefers-reduced-motion: reduce)` block that
clamps `--ds-motion-fast/base/slow` to `0.01s` **and** caps
`animation-iteration-count: 1 !important`. That second line is there because of a real, measured
incident recorded in the file's own comment: capping *duration* alone accelerated seven `infinite`
animations to ~100Hz — **a strobe served to precisely the users who asked for less motion**, well
past the WCAG 2.3.1 three-flashes-per-second threshold. `tools/probes/render_probe_reduced_motion.js`
exists to catch a recurrence, with a PASS-2 that stops the gate being satisfied by deleting all
animation.

**That probe is not on the invariant board.** `tools/invariants.py` has 102 gates and grepping it
for `render_probe_reduced` returns nothing. The flash hazard is guarded by a probe someone has to
remember to run. See §9-G2.

Beyond the global block, the app uses `@media (prefers-reduced-motion: no-preference)` as an
opt-in gate in 9 places (`workspace-regimen.css:241,261,290,408,468`;
`workspace-scanner.css:54,215,220,242`) and `reduce` overrides in 3
(`workspace-regimen.css:221`, `:568`, `workspace-scanner.css:323`). One JS check:
`views/regimen.ts:916`. 24 `@keyframes` total across the stylesheets.

### What a *good* reduced-motion fallback is

Disabling an animation is the lazy half. The right question is: **what was the motion telling the
user, and does that information survive?**

- **Decorative motion** (entrance rises, hover lifts, ambient pulses) → remove entirely. The
  regimen block at `workspace-regimen.css:221-228` does this correctly: it kills the slot
  entrance, switches the transition easing to `linear`, and neutralises the hover `translate`
  *and* the `transform:scale` on the swatch. That is a complete, thought-through fallback.
- **Motion that carries state** → replace with a non-moving equivalent, never delete.
  **The counter-example is in this repo.** `workspace-scanner.css:323-326`:

  ```
  @media (prefers-reduced-motion: reduce) {
    .vd-prog__fill::after { animation: none; }
    .vd-prog.is-indet .vd-prog__fill { animation: none; width: 100%; }
  }
  ```

  An *indeterminate* progress bar becomes a bar at **100% width** — which reads as *finished*.
  A reduced-motion user is told the scan is complete while it is still running. The correct
  fallback is a static striped/neutral fill at a partial width plus a text status
  ("Scanning…"), which the live region in **S4** should be announcing anyway. **Fix this.**
- **Transitions** are not exempt. Crossfade instead of slide; the sheet still needs to *appear*,
  it just must not travel.
- **Parallax, auto-advancing carousels, and looping shimmer** have no place in this app at any
  motion setting. Vestibular triggers cluster in exactly the age band this app serves, and
  vertigo/dizziness is itself a symptom the corpus discusses.

### Contract

- **M1** Every animation and transition is authored inside a
  `@media (prefers-reduced-motion: no-preference)` block, or has an explicit `reduce`
  counterpart. No animation ships that is only governed by the global duration clamp.
- **M2** No animation loops more than 3 times per second under **any** setting (SC 2.3.1).
  Enforced by promoting `render_probe_reduced_motion.js` to a board gate (§9-G2).
- **M3** Every state-carrying animation names its reduced-motion equivalent in the same patch.
  A `reduce` fallback that changes what the UI *means* is a defect, not a fallback —
  `.vd-prog.is-indet` is the standing example.
- **M4** No parallax, no auto-advancing content, no infinite ambient loop in the mobile build.
- **M5** Sheet and drawer transitions ≤ 250ms and translate ≤ 40px; under `reduce`, opacity only.

---

## §7 — Real conditions

Design constraints from where this app is actually used. Two of these are *the* mobile use cases
and should drive the IA, not be bolted on.

### Sunlight and glare

Measured relative luminance: cream `--ds-paper` #faf5e8 → **L = 0.9146**;
`--ds-paper-light` #fffbf2 → **L = 0.9667**. Dark `--ds-paper` #17130d → **L = 0.0068**.

A bright background is the *correct* choice outdoors: phone screens in daylight lose contrast to
specular reflection off the glass, and a near-white ground swamps the reflection while a
near-black ground reflects the sky and the user's own face. **Cream-as-default is the right
sunlight decision** and should stay the default on mobile — it is not merely an aesthetic call.

What breaks in sunlight is everything measured in §4: effective contrast in bright ambient light
is far below the nominal ratio, so a 4.5:1 pairing indoors is functionally unreadable outdoors,
and a **1.53:1 hairline border simply does not exist**. This is the strongest argument for the
AAA-on-prose target and the 3:1-on-borders rule.

- **R1** Sunlight-critical surfaces — the scanner verdict, the coverage tile state, any amount —
  use `--ds-ink` (16.52:1) or `--ds-ink-medium` (11.20:1), never `-soft` or `-faint`.
- **R2** State is carried by **fill**, not by a hairline. Borders below 2px at under 3:1
  disappear outdoors.
- **R3** Dark theme is offered but never auto-selected by ambient light or time of day. The user
  chooses; the app does not guess. (Cream stays the default — `dark-theme-is-a-planned-toggle`.)

### One-handed use, in a store aisle, holding a product

This is *the* Scanner use case: standing in an aisle, product in one hand, phone in the other,
thumb on the glass. It is also the case the current desktop layout is worst at.

- **R4** Every primary action lives in the **bottom third** of the screen. The natural thumb arc
  on a 390x844 device covers roughly the lower 60% and the near edge; the top corners require a
  regrip. Today the Ask Wallach CTA is in the top bar (`.topbar__ask`, 35px tall) and the
  workspace nav is a left rail — both are top/edge geometry.
- **R5** Nothing destructive within the thumb arc without a confirm. The regimen already gets
  this right: `.ck-slot__confirm` (`workspace-regimen.css:229`) is an inline confirm whose comment
  reads *"never delete on the first click"*. Keep that rule and extend it.
- **R6** The scanner's whole path — start scan, confirm what was read, see the verdict — is
  operable one-handed, with the phone held in either hand. Do not put confirm on the left and
  cancel on the right in a way that only works right-handed.
- **R7** No hover-only affordance anywhere. 220 `:hover` rules exist versus 5 `:active` rules.
  On touch there is no hover; every hover-revealed affordance is invisible. Specific case:
  `.gchip:hover .gchip__x { opacity: 1 }` (`workspace-coverage.css:1019`) — **the remove control
  on a goal chip is only reachable by hovering**, which on a phone means it does not exist.

### Walking, moving, cold hands, cracked screens

- **R8 — Tap tolerance.** Walking degrades pointing accuracy; cold or gloved fingers land a
  larger, less precise contact patch; a cracked digitiser can dead-zone whole strips. All three
  argue for the 44px floor in **A1** and the 8px gutter in **A2** — and for putting critical
  targets away from screen edges, where cracks and dead zones concentrate.
- **R9 — Every tap gives immediate feedback.** `-webkit-tap-highlight-color: transparent` is set
  on `.ck-slot` (`workspace-regimen.css:42`) with **no `:active` state to replace it** — the
  native tap flash is suppressed and nothing takes its place, so a tap on a save slot looks like
  nothing happened. Either keep the native highlight or ship a `:active` state; never remove one
  without the other. Feedback must land within ~100ms.
- **R10 — Idempotent / recoverable actions.** A mistap while walking must be undoable. Prefer
  confirm-then-commit for anything that alters the regimen.
- **R11 — Nothing time-limited.** No auto-dismissing toast that carries the only copy of a
  result, no timed carousel. SC 2.2.1.

### Low battery, low-power mode, slow mid-range Android

- **R12** iOS Low Power Mode and Android battery saver throttle animation, cap frame rate, and
  in some browsers force `prefers-reduced-motion: reduce`. That means the reduced-motion path in
  **M3** is not an edge case for a minority — it is what a large share of users see. If the
  reduced-motion fallback is wrong (as `.vd-prog.is-indet` is today), it is wrong for a lot of
  people.
- **R13** No layout that depends on an animation completing. State must be correct at every
  frame, including frame zero.
- **R14** Budget for the slow device, not the fast one: the coverage field renders **90 tiles**,
  the food catalog pages **64 pages**, and OCR runs in-browser via a vendored Tesseract
  (`tools/vendor-tesseract.js`). On a mid-range Android these are real work. Virtualise or page
  long lists; keep the main thread free during OCR and show honest progress (see M3/S4).
- **R15** The local build is `file://`, one bundle, everything inlined — no network, no CDN, no
  service worker. That is already the best possible answer to a bad connection, and it must not
  regress. The **web** build (nutrientcodex.com) may fetch (`web-build-two-targets`), and its
  split-loading path must show honest progress rather than a blank surface.

---

## §8 — Internationalisation: deferred, and how not to block it

**Policy confirmed.** `~/.claude/…/memory/legal-copyright-pass-at-end.md` records Luneth's
standing call of 2026-07-05: *one* legal + copyright + disclaimer + **a11y + i18n** pass at the
very end of the build; do not raise it mid-build; the repo stays private meanwhile. It is
corroborated in `chronicle/creators-log/digests/2026-07.md:1161`, which places
"legal/a11y/i18n" in blueprint **Phase I** (last).

**Two honest caveats:**

1. That memory names `chronicle/finalize-checklist.md §4` as the tracker. **That file does not
   exist in the repo today** (`ls chronicle/finalize-checklist.md` → not found), almost certainly
   removed in the 2026-08-20 public-repo cleanup that pruned the chronicle. The *policy* is
   confirmed; its *tracking file* is missing and should be recreated by the final pass — flagged
   here, not raised as a mid-build interruption.
2. The policy defers **a11y** as well as i18n. This document is therefore **groundwork for that
   final pass**, delivered now because the mobile redesign is being drawn now and retrofitting
   44px targets and a token palette into a finished design costs far more than designing to them.
   Nothing here asks for the legal pass to be pulled forward.

### What the redesign must avoid hard-coding, so the later pass is not blocked

- **No text baked into images, SVG paths, or CSS `content:`** for anything a human reads. Glyph
  marks (`·`, `→`, `❡`, `‹`, `›`) are fine; words are not. `.ds-kicker::before` uses a
  content-free `''` rule — that is the correct pattern.
- **No sentences assembled by concatenation.** `"adds " + n + " essentials"` is unlocalisable
  (plural rules, word order). Use a whole-string template with a placeholder, even if there is
  only one language today.
- **No `text-transform: uppercase` as the only way a label is capitalised.** It is used heavily
  (`.ds-kicker`, `.rail__item`, `.kd-knh__tab`, `.vd-steps__i`, …) and is wrong or destructive in
  several languages. Keep the source string correctly cased so the transform is presentation-only.
- **No fixed-width containers sized to English string lengths.** German and Finnish run 30–40%
  longer. `.fs-filter__q { width: 225px }` (`dashboard.css:618`) is sized to "canned salmon with
  bones" — a documented, deliberate English measure. Prefer `min-width` + wrap.
- **No physical-direction properties where logical ones exist.** Use `margin-inline-start`,
  `padding-inline`, `inset-inline-end`, `text-align: start`. Retrofitting RTL over `left/right`
  touches every one of the 8,536 CSS lines.
- **No hard-coded number, date, or currency formatting.** Prices are USD wholesale
  (`wholesale-featured-price`); route them through one formatter rather than string-building
  `'$' + n`. Doses use mg/mcg/IU — those are the corpus's units and are **not** translatable
  content; they are data.
- **Keep the `lang` attribute honest** — `dashboard.html:2` is
  `<html lang="en" data-theme="cream" data-accent="ember">` today; a later pass swaps `lang`.
- **Do not translate corpus content.** Every verbatim is a byte-exact slice of a sealed Wallach
  book (§00.A). Chrome UI is localisable; a Wallach quote is not. The redesign should keep the
  two visually and structurally distinct so the later pass can tell them apart mechanically.

---

## §9 — The checkable contract

Per §00.B-2 (*codify, don't promise*): a rule that can be a gate **is** one, shipped in the same
patch; a rule with no gate is labelled **WISH** and never sold as safe. The invariant board has
**102 gates and not one of them is an accessibility gate** (`grep "def check_" tools/invariants.py`
filtered for a11y/contrast/aria/motion/touch/focus → 0 matches). Everything below is currently a
WISH until the named gate exists.

| # | Rule | § | How it becomes checkable | Status |
| --- | --- | --- | --- | --- |
| T1 | No rendered text < 14px | §2 | G1 | WISH |
| T2 | Prose + amounts ≥ 16px | §2 | G1 | WISH |
| T3 | Type scale in `rem` | §2 | static CSS scan for `font-size:\s*\d+px` | WISH |
| T5/A3 | No form field < 16px | §3 | G1 (branch precedent: `render_probe_mobile.js`) | WISH |
| A1 | Targets ≥ 44x44 | §3 | G1 | WISH |
| A2 | ≥ 8px between adjacent targets | §3 | G1 | WISH |
| A4 | Viewport meta unlocked | §3 | static scan of `dashboard.html` | WISH |
| C1 | All text ≥ AA 4.5:1 (3:1 large) | §4 | G1, both themes | WISH |
| C2 | Prose + amounts ≥ AAA 7:1 | §4 | G1 | WISH |
| C3 | Meaningful boundaries ≥ 3:1 | §4 | G1 | WISH |
| C4 | Both themes audited every run | §4 | G1 iterates `data-theme` | WISH |
| C5 | Colour never the sole carrier | §4 | **not machine-checkable** — human review | WISH (permanent) |
| S1 | One `<main>`, named landmarks | §5 | G1 | WISH |
| S2 | One H1, no skipped levels | §5 | G1 | WISH |
| S3 | Accessible name on every control | §5 | G1 — **passing today, protect it** | WISH |
| S4 | Live regions on scanner + search | §5 | G1 asserts existence; announcement content needs human check | WISH |
| S5 | Sheet focus trap + restore | §5 | G3 | WISH |
| S6 | Visible focus ring at ≥ 3:1 | §5 | G1 | WISH |
| M1/M2 | No ≥3Hz loop under any setting | §6 | **G2 — the probe already exists**, just unregistered | WISH → cheapest win |
| M3 | State-carrying motion has a real fallback | §6 | **not machine-checkable** — human review | WISH (permanent) |
| R7 | No hover-only affordance | §7 | static scan: `:hover` rules that change `opacity`/`visibility`/`display` on a descendant with no `:focus-within`/`:active` twin | WISH |
| R9 | Tap feedback exists | §7 | static scan: `-webkit-tap-highlight-color: transparent` with no `:active`/`:focus-visible` on the same selector | WISH |

**The three gates worth building, in cost order:**

- **G2 — register `render_probe_reduced_motion.js` on the board.** Near-zero cost. The probe is
  written, has a PASS-2 anti-degenerate check, and guards a hazard that has already fired once in
  this codebase. It is currently a file nobody is required to run.
- **G1 — `tools/probes/render_probe_a11y.js`.** Promote the scratchpad instrument: contrast,
  type size, target geometry, target spacing, accessible names, landmark/heading structure, live
  regions — across every surface, both themes, at 320 / 390 / 430px, with a **1440px desktop
  control** so a finding that fires equally at 1440 is known to be an app property rather than a
  mobile defect (the `mobile_audit.js` pattern on the `mobile-responsive` branch). It **must**
  ship with a `--selftest` that injects known defects and asserts each detector fires —
  `verification-doctrine`: a detector that has never failed on purpose has not been tested.
- **G3 — a focus-management probe.** Open each sheet; assert focus moved inside, that Tab wraps,
  that the background is `inert`, and that focus returns to the trigger on **all four** close
  paths (Escape, backdrop, close button, swipe-dismiss).

Two things stay permanently human: **C5** (is colour the only carrier?) and **M3** (does the
reduced-motion fallback still mean the right thing?). Both are labelled WISH forever, honestly.

---

## §10 — What I could not determine

Stated plainly rather than guessed.

1. **The seven non-default accent families are unaudited.** `theme.css:62-91` defines eight
   `[data-accent]` palettes (ember, sapphire, verdant, amethyst, rose, gold, teal, slate) and the
   user picks one. Everything in §4 measures **ember** (the default) plus the derived cream/dark
   surfaces. The other seven — and their `color-mix()`-derived `-wash` / `-soft` / `-deep`
   variants — need the same matrix run before any of them can be called AA.
2. **`color-mix()`-derived tokens were measured only where the app painted them.** The rendered
   audit resolves them correctly because it reads computed style, but the token matrix in §4.1/4.2
   covers literals only. A `color-mix` pairing that exists in CSS but was not on screen during the
   run is unmeasured.
3. **Surfaces not reachable by the five rail clicks were not audited.** Entity pages, the
   food-sheet, ORAC, corpus, product detail, the recycle/save-slot flows, the scanner's Confirm
   and Result steps (the run measured the idle Scan step only), and both modal dialogs (profile,
   welcome — the welcome card renders inline in the shell, so it *was* measured; the profile
   dialog was not opened). Expect more offenders there, and note that the Scanner's *result* view
   is exactly where the contrast stakes are highest.
4. **No real-device testing.** Everything is headless Chromium with touch emulation. Actual
   sunlight legibility, actual thumb reach, actual Low Power Mode throttling, and actual
   TalkBack/VoiceOver behaviour are **not** verified by anything in this document. A DOM probe is
   not a visual check and it is certainly not a device check.
5. **No screen-reader run.** The ARIA findings are structural (what attributes exist, where focus
   goes). Whether VoiceOver and TalkBack actually *announce* the scanner verdict usefully is
   untested and untestable headlessly.
6. **APCA vs WCAG 2.x.** All ratios here are WCAG 2.x relative-luminance. APCA (the WCAG 3 draft
   model) scores warm-on-cream pairs differently and would likely be *kinder* to some of the
   accent findings. I used WCAG 2.x because it is the shipping, citable standard. If the redesign
   wants APCA as a second opinion, that is a separate measurement, not an override.
7. **Whether the older-skewing audience is confirmed by data.** It is inferred from the content
   (Wallach's readership, the goal-chip list, the conditions the corpus covers). There is **no
   analytics in this app by design** — no telemetry, no accounts — so there is no measurement to
   appeal to, and there never will be. The inference is stated as an inference.
8. **The 44px figure itself.** It is the Apple HIG / Material convention, not a WCAG requirement.
   WCAG 2.2 SC 2.5.8 requires 24x24 (AA) and SC 2.5.5 requires 44x44 only at **AAA**. Choosing 44
   is this project's decision for this audience, and is labelled as such rather than dressed up
   as a legal minimum.
