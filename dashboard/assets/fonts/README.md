# Font Procurement — Design System v3

_Five typefaces, all SIL OFL 1.1 licensed (perpetual free use, redistributable forever). Self-hosted to honor the "no external resources" rule._

---

## What you need to drop into this folder

| Family | Filename(s) expected | Variable-font weights | Source |
|---|---|---|---|
| **Playfair Display** | `PlayfairDisplay-VariableFont_wght.woff2` + `.ttf` (roman) + `PlayfairDisplay-Italic-VariableFont_wght.woff2` + `.ttf` | 400-900 | <https://fonts.google.com/specimen/Playfair+Display> |
| **Merriweather** | `Merriweather-VariableFont_opsz,wdth,wght.woff2` + `.ttf` (roman) + `Merriweather-Italic-VariableFont_opsz,wdth,wght.woff2` + `.ttf` | 300-900 | <https://fonts.google.com/specimen/Merriweather> |
| **Crimson Pro** | `CrimsonPro-VariableFont_wght.woff2` + `.ttf` (roman) + `CrimsonPro-Italic-VariableFont_wght.woff2` + `.ttf` | 200-900 | <https://fonts.google.com/specimen/Crimson+Pro> |
| **Space Grotesk** | `SpaceGrotesk-VariableFont_wght.woff2` + `.ttf` | 300-700 | <https://fonts.google.com/specimen/Space+Grotesk> |
| **JetBrains Mono** | `JetBrainsMono-VariableFont_wght.woff2` + `.ttf` (roman is sufficient) | 100-800 | <https://fonts.google.com/specimen/JetBrains+Mono> |

---

## Easiest procurement path (~5 minutes)

1. Visit each Google Fonts URL above (links open the official specimen page).
2. Click **"Get font"** → **"Download all"** — you get a ZIP per family.
3. Extract each ZIP. The variable font files live at the top level of each ZIP:
   - For most families: `<FontName>/<FontName>-VariableFont_wght.ttf` and `<FontName>/<FontName>-Italic-VariableFont_wght.ttf`
   - For Merriweather: longer name with `opsz,wdth,wght` axes
4. Drop the `.ttf` files into THIS folder (`dashboard/assets/fonts/`).
5. (Optional but recommended) Convert each `.ttf` → `.woff2` for ~30% smaller file size. Tools that don't require online uploads:
   - `pyftsubset` from `fonttools` (already in the project's Python env): `pyftsubset input.ttf --output-file=output.woff2 --flavor=woff2`
   - Or `ttf2woff2` CLI: `ttf2woff2 < input.ttf > output.woff2`
   - The `design-system.css` references both `.woff2` (preferred) AND `.ttf` (fallback). If only `.ttf` is present, browsers use that — totally fine for v3.

That's it. Once the files exist here, every dashboard surface that uses `design-system.css` renders with the correct typography automatically.

---

## How to verify the fonts are wired correctly

After dropping the files, open the dashboard locally. The font-stack fallbacks (`'Times New Roman', Georgia, serif` for serif faces; `system-ui` for sans; `ui-monospace` for mono) will render text in standards-compliant fallbacks if a font is missing. You can spot a missing font by comparing against the v3 reference at `outputs/trace-minerals-popup-v3.html` — headers should render in Playfair Display (heavy display serif with elegant terminals), body in Merriweather (workhorse serif), italics in Crimson Pro (lighter italic), UI labels in Space Grotesk (geometric sans), readouts in JetBrains Mono (clean monospace).

If a header is rendering in Times New Roman, that family's font file is missing or mis-named.

---

## What the `design-system.css` declarations point to

```
@font-face {
  font-family: 'Playfair Display';
  src: url('../fonts/PlayfairDisplay-VariableFont_wght.woff2') format('woff2'),
       url('../fonts/PlayfairDisplay-VariableFont_wght.ttf') format('truetype');
}
```

The path is `../fonts/` from the CSS file's location, which resolves to this folder. Don't rename the files unless you also update `design-system.css` — and that file is user-only-writer after sealing, so renaming after Round 3 of migration requires a co-work co-edit cycle.

---

## License attribution

All five typefaces are licensed under the **SIL Open Font License (OFL) 1.1**. Full license text + per-family attribution is in `LICENSE.md` in this folder. The OFL grants perpetual rights to use, modify, redistribute. The fonts are safe to bundle with this project forever.

---

_If the procurement process ever changes (Google Fonts moves, etc.), the upstream sources are all on GitHub under permissive licenses:_
- _Playfair Display: <https://github.com/clauseggers/Playfair>_
- _Merriweather: <https://github.com/SorkinType/Merriweather>_
- _Crimson Pro: <https://github.com/Fonthausen/CrimsonPro>_
- _Space Grotesk: <https://github.com/floriankarsten/space-grotesk>_
- _JetBrains Mono: <https://github.com/JetBrains/JetBrainsMono>_
