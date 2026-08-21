# Font Procurement — Design System v3

_Eight typefaces, all SIL OFL 1.1 licensed (perpetual free use, redistributable forever). Self-hosted to honor the "no external resources" rule: the page holds `font-src` to `self` in its Content-Security-Policy, so nothing may be fetched from a font CDN._

---

## The five editorial families

All five families below are **already in-housed in this folder** as eight `.ttf`
files (verified present). This table documents the expected filenames + upstream
sources for re-procurement or replacement. No `.woff2` file is used anywhere in
the project — the shipped CSS declares a single `format('truetype')` src per face.

| Family | Filename(s) | Variable-font weights | Source |
|---|---|---|---|
| **Playfair Display** | `PlayfairDisplay-VariableFont_wght.ttf` (roman) + `PlayfairDisplay-Italic-VariableFont_wght.ttf` | 400-900 | <https://fonts.google.com/specimen/Playfair+Display> |
| **Merriweather** | `Merriweather-VariableFont_opsz,wdth,wght.ttf` (roman) + `Merriweather-Italic-VariableFont_opsz,wdth,wght.ttf` | 300-900 | <https://fonts.google.com/specimen/Merriweather> |
| **Crimson Pro** | `CrimsonPro-VariableFont_wght.ttf` (roman) + `CrimsonPro-Italic-VariableFont_wght.ttf` | 200-900 | <https://fonts.google.com/specimen/Crimson+Pro> |
| **Space Grotesk** | `SpaceGrotesk-VariableFont_wght.ttf` | 300-700 | <https://fonts.google.com/specimen/Space+Grotesk> |
| **JetBrains Mono** | `JetBrainsMono-VariableFont_wght.ttf` (roman is sufficient) | 100-800 | <https://fonts.google.com/specimen/JetBrains+Mono> |

---

## Easiest procurement path (~5 minutes)

1. Visit each Google Fonts URL above (links open the official specimen page).
2. Click **"Get font"** → **"Download all"** — you get a ZIP per family.
3. Extract each ZIP. The variable font files live at the top level of each ZIP:
   - For most families: `<FontName>/<FontName>-VariableFont_wght.ttf` and `<FontName>/<FontName>-Italic-VariableFont_wght.ttf`
   - For Merriweather: longer name with `opsz,wdth,wght` axes
4. Drop the `.ttf` files into THIS folder (`dashboard/assets/fonts/`).
5. (Optional but recommended) Convert each `.ttf` → `.woff2` for ~30% smaller file size. Tools that don't require online uploads:
   - `pyftsubset` from `fonttools` (install it first with `pip install fonttools[woff]`; the repo pins no Python dependency file): `pyftsubset input.ttf --output-file=output.woff2 --flavor=woff2`
   - Or `ttf2woff2` CLI: `ttf2woff2 < input.ttf > output.woff2`
   - `design-system.css` references the `.ttf` files only, a single `format('truetype')` src per face. Converting to `.woff2` therefore also means editing that sealed file and re-sealing it in the same change.

That's it. Once the files exist here, every dashboard surface that uses `design-system.css` renders with the correct typography automatically.

---

## How to verify the fonts are wired correctly

After dropping the files, open the dashboard locally. The font-stack fallbacks (`'Times New Roman', Georgia, serif` for serif faces; `system-ui` for sans; `ui-monospace` for mono) will render text in standards-compliant fallbacks if a font is missing. What correctly-wired type looks like: headings in Unbounded (geometric display), body and italic decks in Space Grotesk, UI labels in Chakra Petch, big numerals in Bruno Ace, readouts in JetBrains Mono, and the Wallach pull-quotes in Playfair Display — the one deliberate serif carve-out, declared in `type-futurist.css`.

If a header is rendering in Times New Roman, that family's font file is missing or mis-named.

---

## What the `design-system.css` declarations point to

```
@font-face {
  font-family: 'Playfair Display';
  font-style: normal;
  font-weight: 400 900;
  font-display: swap;
  src: url('../fonts/PlayfairDisplay-VariableFont_wght.ttf') format('truetype');
}
```

The path is `../fonts/` from the CSS file's location, which resolves to this folder. Don't rename the files unless you also update `design-system.css` — and that file is sealed against `design-system.golden.sha256`, so a rename means re-sealing it as part of the same change.

---

## License attribution

All eight bundled typefaces are licensed under the **SIL Open Font License (OFL) 1.1**. Full license text + per-family attribution is in `LICENSE.md` in this folder. The OFL grants perpetual rights to use, modify, redistribute. The fonts are safe to bundle with this project forever.

---

_If the procurement process ever changes (Google Fonts moves, etc.), the upstream sources are all on GitHub under permissive licenses:_
- _Playfair Display: <https://github.com/clauseggers/Playfair>_
- _Merriweather: <https://github.com/SorkinType/Merriweather>_
- _Crimson Pro: <https://github.com/Fonthausen/CrimsonPro>_
- _Space Grotesk: <https://github.com/floriankarsten/space-grotesk>_
- _JetBrains Mono: <https://github.com/JetBrains/JetBrainsMono>_
- _Unbounded: <https://github.com/googlefonts/unbounded>_

---

## The three display / interface families

Three more families are in-housed beyond the five editorial ones, and they are what the app actually leads with: Unbounded for display headings, Chakra Petch for small interface text, Bruno Ace for the big numeric readouts. Without them every shell/title element falls back to Space Grotesk and the typographic hierarchy flattens.

| Family | Filename(s) | Weights | Source |
|---|---|---|---|
| **Unbounded** | `Unbounded-VariableFont_wght.ttf` (variable) | 200-900 | <https://fonts.google.com/specimen/Unbounded> |
| **Chakra Petch** | `ChakraPetch-Regular.ttf` + `-SemiBold.ttf` + `-Bold.ttf` (static) | 400 / 600 / 700 | <https://fonts.google.com/specimen/Chakra+Petch> |
| **Bruno Ace** | `BrunoAce-Regular.ttf` (static) | 400 | <https://fonts.google.com/specimen/Bruno+Ace> |

Unbounded's `@font-face` lives in `dashboard/assets/styles/type-futurist.css`, which loads after the sealed token layer and supersedes its serif font tokens app-wide. Chakra Petch and Bruno Ace, plus the `--ds-font-display-interface` / `--ds-font-display-artifact` tokens, live in `dashboard/assets/styles/workspace-coverage.css` (lines 39-73). NOTE: Chakra Petch's three `@font-face` blocks are ALSO duplicated in `dashboard/assets/styles/drawer-knowledge.css` (lines 2483-2488) — change both, or consolidate them, or one surface silently keeps pointing at the old file.

Upstream (GitHub, OFL): Unbounded <https://github.com/googlefonts/unbounded> · Chakra Petch <https://github.com/cadsondemak/Chakra-Petch> · Bruno Ace <https://github.com/google/fonts/tree/main/ofl/brunoace>
