# Typography and reading on a 375px column

_Groundwork for the mobile-first redesign. Every number below is either read out of a repo file
(path + line cited) or measured by driving a real engine (script + method cited). Where I could not
determine something, it says so — see §15._

---

## 1 · Method, and one instrument that lied

Font metrics were measured in the repo's own bundled Chromium (`node_modules/puppeteer`,
**Chrome/149.0.7827.22**) against the actual `.ttf` files in `dashboard/assets/fonts/`, served over
`http://127.0.0.1:8787` from a scratchpad harness. Layout facts were measured by driving the real
app at a 375px viewport (`file://dashboard/dashboard.html`).

**Two false readings I caught, recorded because the next person will hit them:**

1. **`page.setContent()` runs on `about:blank`, so every `@font-face` fetch fails silently.** The
   first run reported *identical* advance widths for JetBrains Mono (a monospace) and six
   proportional faces — 39.128/100px across the board. That is the fallback face, not our fonts.
   Only Playfair Display differed, because Playfair happens to be **installed on this Windows host**
   and was resolved locally. `document.fonts.check()` returned `true` for it while the file fetch
   was throwing `NetworkError`. A negative control against one generic family did **not** catch this
   — the control resolved to the default *sans* and the test spans to the default *serif*, so they
   differed and everything looked fine. The fix that worked: navigate to a real `http://` page, call
   `document.fonts.load()` per face, and assert the monospace measures exactly `0.600 em/char`.
2. **`getClientRects().length` cannot detect a wrapped `.ds-mark`.** `.ds-mark` is
   `display:inline-block` (`design-system.css:462`), so it always returns exactly **one** rect no
   matter how many lines the text inside it occupies. My first wrap probe reported "ok (one line)"
   for a mark that was in fact on three lines. Correct detection is `round(height / lineHeight)`.
   Any future gate on the one-line rule must use the height method — see §12.

Scripts live in the session scratchpad (`measure2.js` … `m11.js`); they are throwaway instruments,
not project files.

---

## 2 · What is actually available

`ls dashboard/assets/fonts/` — **11 `.ttf` files, 7 families**, all SIL OFL 1.1
(`dashboard/assets/fonts/LICENSE.md`):

| Family | File(s) | Weights | Role today |
|---|---|---|---|
| Unbounded | `Unbounded-VariableFont_wght.ttf` | 200–900 var | `--ds-font-display` — headings, hero titles |
| Space Grotesk | `SpaceGrotesk-VariableFont_wght.ttf` | 300–700 var | `--ds-font-sans` **and** `--ds-font-serif` — body prose + UI chrome |
| Chakra Petch | `-Regular` / `-SemiBold` / `-Bold` (static) | 400/600/700 | `--ds-font-display-interface` — small interface text |
| JetBrains Mono | `JetBrainsMono-VariableFont_wght.ttf` | 100–800 var | `--ds-font-mono` — readouts, technical labels |
| Bruno Ace | `BrunoAce-Regular.ttf` | 400 | `--ds-font-display-artifact` — big numeric readouts |
| Playfair Display | roman + italic variable | 400–900 var | **one deliberate serif carve-out** — Wallach verbatim pull-quotes |
| Crimson Pro | roman + italic variable | 200–900 var | **declared but dead** — see below |

**Merriweather is confirmed gone.** Commit `a9b0513b` removed it; no `Merriweather*.ttf` exists and
no CSS references it. The tokens that used to point at it (`--ds-font-serif`, `--ds-font-serif-light`)
are remapped to Space Grotesk in `dashboard/assets/styles/type-futurist.css:29-31`.

### Which faces are proven in use

`type-futurist.css` loads **after** the sealed `design-system.css` and after every drawer/workspace
sheet, and it is the **authoritative** declaration of the live faces (its own header says so, lines
1-17). The serif stack still declared at `design-system.css:185-189` is **declared but not
authoritative** — do not design against it.

- **Unbounded, Space Grotesk, Chakra Petch, JetBrains Mono, Bruno Ace** — in use, everywhere.
- **Playfair Display** — in use, narrowly. `type-futurist.css:58-63` carves it out for
  `.kd-foods-pq .ds-pull-quote` (Absorption) and `.kd-ep-fam__quote .ds-pull-quote` (essentials
  pages), body **and** `::before` glyph. `#drawer-search-mount .vq` also renders it and is
  untouched by that sheet. I confirmed it live: the Absorption pull-quotes compute to
  `Playfair Display` at 375px (§6).
- **Crimson Pro** — I could **not** find a live consumer. It is declared at `design-system.css:60-73`
  and referenced only via `--ds-font-serif-light`, which `type-futurist.css:31` overwrites with
  Space Grotesk. `design-system.css:1025` and `:384` read `--ds-font-serif-light`, so they now render
  Space Grotesk. **Treat Crimson Pro as unused until someone proves otherwise by driving the app** —
  I did not exhaustively enumerate every surface. It is also the worst-suited face here for mobile
  (x-height ratio 0.420, §3).
- `.kd-claim__verbatim` is **not** a live serif site — `type-futurist.css:38-48` records that nothing
  emits that class; its rules are deliberately kept, not evidence of use.

### Doc drift found (worth a one-line fix)

`dashboard/assets/fonts/README.md` still says *"Eight typefaces"*, *"The five editorial families"*
above a table listing **four**, *"already in-housed … as eight `.ttf` files"* (those four families
are **six** files), and *"All eight bundled typefaces"*. The true count is **7 families / 11 files**.
This is leftover from the Merriweather cut.

---

## 3 · Measured font metrics (the basis for every size below)

At `font-size: 100px`, in Chrome 149, against the repo `.ttf` files. `avg advance` is over a
representative 155-character sentence in this product's register.

| Face | avg advance (em/char) | **x-height / em** | cap / em | ascender (d) | descender (p) | default line box |
|---|---|---|---|---|---|---|
| Unbounded 400 | 0.5865 | **0.570** | 0.75 | 0.77 | 0.17 | 1.25 |
| Unbounded 600 | 0.6110 | 0.570 | 0.75 | — | — | — |
| Unbounded 700 | 0.6192 | 0.570 | 0.75 | — | — | — |
| Space Grotesk 400 | 0.4818 | **0.490** | 0.70 | 0.70 | 0.20 | 1.27 |
| Space Grotesk 600 | 0.4822 | 0.490 | 0.70 | — | — | — |
| Space Grotesk 700 | 0.4823 | 0.490 | 0.70 | — | — | — |
| Chakra Petch 400 | 0.4500 | **0.500** | 0.70 | 0.72 | 0.22 | 1.30 |
| Chakra Petch 600 | 0.4665 | 0.500 | 0.70 | — | — | — |
| JetBrains Mono 400 | **0.6000** (true mono) | **0.550** | 0.73 | 0.73 | 0.18 | 1.32 |
| Playfair Display 400 | 0.4376 | **0.520** | 0.71 | 0.79 | 0.18 | 1.33 |
| Bruno Ace 400 | 0.6162 | **0.550** | 0.70 | 0.75 | 0.20 | 1.20 |
| Crimson Pro 400 | 0.3880 | **0.420** | 0.58 | 0.68 | 0.22 | 1.11 |

Reference faces measured in the **same engine** so the comparison is apples-to-apples:

| Reference | x-height / em |
|---|---|
| Roboto | 0.530 |
| Arial / Helvetica | 0.520 |
| `sans-serif` (default) | 0.520 |
| Verdana / Tahoma | 0.550 |
| `system-ui` / Segoe UI | 0.500 |
| Georgia | 0.480 |

### The single most consequential finding

**Space Grotesk has a low x-height (0.490) — lower than every reference sans measured.** It is 7.5%
smaller than Arial and **8.2% smaller than Roboto** at the same nominal `font-size`. A 16px body in
Space Grotesk reads like a **14.8px** body in Roboto.

To match the perceived size of a conventional 16px mobile body:
`16 × 0.530 / 0.490 = 17.3px` → **17px is the mobile body size**, not 16px. This is not taste; it is
the arithmetic of the face we ship, and it matters more than usual because the audience skews older.

---

## 4 · The mobile type scale

Root stays at the browser default (**never** `html { font-size: __px }` — that overrides the user's
own font-size preference). All values in `rem` against a 16px root. **No `vw` units anywhere** — see
§9 for why the existing `clamp(…vw…)` tokens must not cross onto mobile.

| Role | Family | Weight | Size | Line-height | Tracking | x-height | CPL @ 335px col |
|---|---|---|---|---|---|---|---|
| **display** | Unbounded | 700 | `1.875rem` / 30px | `1.08` → 32.4px | `-0.02em` | 17.1px | 18.0 |
| **title** | Unbounded | 600 | `1.375rem` / 22px | `1.18` → 26.0px | `-0.015em` | 12.5px | 24.9 |
| **section** | Space Grotesk | 700 | `1.125rem` / 18px | `1.28` → 23.0px | `-0.005em` | 8.8px | 38.6 |
| **body** | Space Grotesk | 400 | `1.0625rem` / 17px | `1.60` → 27.2px | `0.005em` | 8.3px | **40.9** |
| **caption** | Space Grotesk | 400 | `0.9375rem` / 15px | `1.45` → 21.8px | `0.005em` | 7.4px | 46.4 |
| **label** (UI chrome) | Chakra Petch | 600 | `0.8125rem` / 13px | `1.15` | `0.02em` | 6.5px | — |
| **mono** | JetBrains Mono | 400/500 | `0.875rem` / 14px | `1.50` → 21.0px | `0` | 7.7px | 39 cols |
| **quote** | Playfair Display *italic* | 400 | `1.1875rem` / 19px | `1.45` → 27.6px | `0` | 9.9px | 35.2 † |

† quote CPL is against its own inset column (293px), not the page column — see §6.

**Notes on the choices.**
- *display* is the only Unbounded 700 on a mobile screen. Unbounded is a **wide** face (0.619 em/char
  at 700 vs Space Grotesk's 0.482 — 28% wider). At 30px a line holds ~18 characters, so display
  strings must be 1–3 short words. "The Wallach Codex" (17 chars) fits one line; anything longer
  wraps and needs `text-wrap: balance` (§7).
- *title* drops to weight 600 because Unbounded gets appreciably wider as it gets heavier
  (0.5865 → 0.6192 from 400 to 700) and a heavy 22px eats the column.
- *section* switches from Unbounded to **Space Grotesk 700**. Unbounded at 18px in a 335px column
  holds only ~29 characters — too few for a real section heading. Space Grotesk 700 at 18px holds
  38.6. The weight jump plus the family change carries the hierarchy without needing more size.
- *label* is the tab-bar / badge / kicker size. 13px is deliberate — see §10 and §11.
- The **cream default** and the dark toggle share this scale unchanged; only colour changes (§13).
  Dark type on a dark ground optically thickens, so if a title looks heavier in dark, drop the
  *weight* by 100, never the size.

### Weight availability check

Chakra Petch is **static, 400/600/700 only** (three files). It has **no 500**. Asking for 500 gets
you 400 (measured: Chakra Petch 400 and 500 return identical advances, 0.44998). Do not specify
Chakra Petch 500 and expect a mid-weight. Bruno Ace is 400-only — every weight measured identical
(0.6162), so `font-weight: 700` on Bruno Ace is either ignored or **synthesised** (faux bold). Add
`font-synthesis: none` (supported, §7) to make that failure visible rather than ugly.

---

## 5 · The measure, and the padding that achieves it

Measured CPL for **Space Grotesk 400** at a 375px viewport, column = `375 − 2 × pad`:

| pad each side | col width | 15px | 16px | **17px** | 18px | 19px | 20px |
|---|---|---|---|---|---|---|---|
| 12px | 351 | 48.6 | 45.5 | 42.9 | 40.5 | 38.3 | 36.4 |
| 16px | 343 | 47.5 | 44.5 | **41.9** | 39.6 | 37.5 | 35.6 |
| **20px** | **335** | 46.4 | 43.5 | **40.9** | 38.6 | 36.6 | 34.8 |
| 24px | 327 | 45.2 | 42.4 | 39.9 | 37.7 | 35.7 | 33.9 |

**The honest trade-off: at 375px you cannot have both 17px type and the 45–75 CPL print ideal.**
Anything at or above 17px lands in the **36–43** band. That is normal for mobile long-form (iOS
Books, Instapaper and Pocket all sit in the high 30s to mid 40s), and the compensation is leading,
not width — which is why body line-height is **1.60**, not 1.45.

**Recommendation — two gutters, not one:**

- `--m-pad-read: 20px` for reading surfaces (claim text, entity pages, Knowledge prose, quotes).
  Column 335px, **40.9 CPL at 17px**. The wider gutter is also most of what separates "considered"
  from "cheap" — a generous margin is the cheapest editorial signal there is.
- `--m-pad-dense: 16px` for lists, tables, cards, the Coverage grid and the Scanner result rows,
  where content width beats margin. Column 343px, 41.9 CPL at 17px.

Never go below 16px, and never let a reading surface use the dense gutter.

Corresponding CPL for the other faces at the 335px reading column:

| Face | 17px | 18px | 19px | 20px |
|---|---|---|---|---|
| Playfair Display 400 | — | 42.5 | 40.3 | 38.3 |
| Crimson Pro 400 | 50.8 | 48.0 | 45.4 | 43.2 |
| JetBrains Mono 400 | 32.8 cols | 31.0 | 29.4 | 27.9 |

(Crimson Pro reaches a comfortable measure only because its x-height is 0.420 — the text is
physically smaller, not better set. It is not a candidate for mobile body.)

---

## 6 · Per-content-type treatment

### Long-form claim text (the product's core content)
`--m-font-body` / 17px / 1.60 / `0.005em`. Max width is the column; do not centre. Paragraph spacing
`0.9em` (not a blank-line 1.6em — at 40 CPL paragraphs are short and frequent). Apply
`text-wrap: pretty` (§7). Set `overflow-wrap: anywhere` on nutrient and product names — chemical
names and `(R)`/`(TM)` strings are a known source of a single element forcing a row wide; the old
retrofit already learned this (`mobile.css` §13 on branch `mobile-responsive`).

### Verbatim Wallach quotes (pull-quotes)
This is the surface most responsible for whether the app reads as a library or as a webpage, and it
is currently **broken at mobile width**. Measured live at 375px:

```
.ds-pull-quote  fam=Playfair Display  fs=20.8px  lh=28.08px
                padding = 32px 40px  (var(--ds-space-6) var(--ds-space-7))
                ::before = 96px (6rem) Playfair Display
```

In a 335px reading column that padding leaves a **255px** inner measure → **28.0 CPL**. A 96px
decorative quote glyph occupies **29% of the card's width**. Both are desktop geometry surviving into
a phone.

**Mobile pull-quote spec:** padding `20px 20px 20px 22px`; `font-size: 19px`; `line-height: 1.45`;
`::before` glyph `font-size: 3.25rem` (52px), `top: -0.28em`, `left: 0.08em`. Inner measure 293px →
**35.2 CPL**. Keep the Playfair carve-out on **both** the body and the `::before` — the pseudo-element
reads `--ds-font-display` (Unbounded) directly and inherits nothing from its host; styling only the
body is a silent font mismatch that has been reported three times before
(`type-futurist.css:50-63`).

### Citations
`--m-font-ui` (Chakra Petch) 600 / 13px / `0.02em` / `--ds-ink-soft`. Set them as a `footer` inside
the quote card, not as body text. Book title in `--m-font-body` 400 italic 14px so the title reads
as a title. Every amount and every claim traces to a Wallach book — the citation is load-bearing
content, not chrome, so it gets a legible size (13px clears the glanceable floor, §10) and a colour
that actually passes contrast (`--ds-ink-soft`, **not** `--ds-ink-faint` — see §13).

### Tables (dose tables, composition, ORAC, coverage rows)
`--m-font-mono` 14px / 1.50 gives **39 monospace columns** at the dense gutter — enough for
`label … value unit` but not for a 4-column desktop table. Mobile tables must **restructure**, not
shrink: one row per record, label left in `--m-font-ui` 13px, value right in `--m-font-mono` 14px
with `font-variant-numeric: tabular-nums` (works in JetBrains Mono — it is a true monospace).
Any table that genuinely cannot restructure goes in its own `overflow-x: auto` container; the page
body must never scroll horizontally.

### UI labels
`--m-font-ui` (Chakra Petch) 600 / 13px / `0.02em`. **Sentence case, not caps** — see §11.

---

## 7 · Optical adjustments (support verified, not assumed)

Tested with `CSS.supports()` in Chrome 149 and by measuring rendered widths:

| Feature | Chromium 149 | Use it? |
|---|---|---|
| `text-wrap: pretty` | **true** | **Yes** — on body, captions, claim text |
| `text-wrap: balance` | **true** | **Yes** — on display/title/section only |
| `font-variant-numeric: tabular-nums` | true | Yes, **but only on faces that have the table** — §8 |
| `font-optical-sizing: auto` | true | Harmless; I did not verify any face exposes an `opsz` axis |
| `font-synthesis: none` | true | **Yes** — makes missing weights fail loudly |
| `-webkit-text-size-adjust` | true | **Yes**, set to `100%` — §9 |
| `text-box-trim` | true | Optional; useful for tightening display headings. Verify on target Safari first |
| `hanging-punctuation: first` | **false** | **No** — see below |

**Hanging punctuation: do not use it.** `CSS.supports('hanging-punctuation','first')` returns
**false** in Chrome 149, so Android Chrome will not honour it. Safari does. Building the pull-quote's
optical alignment on it would give iOS one composition and Android another. The existing
`.ds-pull-quote::before` already achieves a hanging opening quote by absolute positioning, on every
engine — keep that mechanism.

**`text-wrap: balance` caveat:** browsers cap it at a small number of lines (Chrome caps it; I did
not measure the exact cap). Use it only where a heading is a few lines, which is exactly display /
title / section. Do not put it on body — that is what `pretty` is for.

**Small caps: do not use them.** I tested `font-feature-settings: "smcp" 1` — which browsers do
**not** synthesise — against plain, per face. Only **Playfair Display** has a real `smcp` table.
All six other faces change under `font-variant-caps: small-caps` only because Chrome **synthesises**
by scaling capitals. The proof is JetBrains Mono: a monospace whose "abc" goes from 180px (0.600
em/char, correct) to 126px (0.420 em/char) — genuine monospaced small caps would keep 0.600. Synthetic
small caps are precisely the kind of thing that reads as "cheap". If small caps are ever wanted, they
are available **only on Playfair**, i.e. only inside a Wallach quote, and should be verified on
device first.

---

## 8 · The numeral defect (found while measuring; costs nothing to fix)

`font-variant-numeric: tabular-nums` only does something if the face ships a `tnum` table. Measured
per face — width of `1111111111` vs `0000000000` at 100px:

| Face | `1` | `0` | digits proportional by default | **tnum actually works** |
|---|---|---|---|---|
| JetBrains Mono | 0.600 | 0.600 | no (already tabular) | n/a — already tabular |
| Space Grotesk | 0.418 | 0.641 | yes | **YES** |
| Unbounded | 0.471 | 0.893 | yes | **YES** |
| Crimson Pro | 0.332 | 0.565 | yes | **YES** |
| Playfair Display | 0.370 | 0.600 | yes | **NO** |
| Chakra Petch | 0.358 | 0.628 | yes | **NO** |
| **Bruno Ace** | **0.313** | **0.901** | yes | **NO** |

**Bruno Ace — `--ds-font-display-artifact` (`workspace-coverage.css:70`), the face used for the big
numeric readouts — has no `tnum` table and the widest proportional digits of any face here: `0` is
2.9× the width of `1`.** Two shipped declarations are therefore **no-ops**:

- `workspace-regimen.css:287` — `.ck-gauge__num { font-family: var(--ds-font-display-artifact); … font-variant-numeric: tabular-nums; }`
- `workspace-scanner.css:265` — `.vd-cov-gnum { font-family: var(--ds-font-display-artifact); … font-variant-numeric: tabular-nums; }`

A coverage count going 11 → 90 changes width by a factor of ~2.9 in the gauge. On desktop there is
slack to absorb it; on a 375px column it will visibly jump. Chakra Petch
(`--ds-font-display-interface`) has the same problem, and `drawer-knowledge.css:1335` sets a 1.3rem
Chakra Petch numeral with `white-space: nowrap`.

**Mobile rule:** any numeral that **changes** (coverage counts, doses, percentages, scan results)
must be set in **JetBrains Mono** or **Space Grotesk**, both of which are genuinely tabular. Bruno
Ace and Chakra Petch are fine for **static** numerals only. If Bruno Ace must carry a changing
number, reserve the width with `min-width: Nch` measured against `0`, not against the current value.

The amounts are Wallach's and they should not shimmer, so this belongs in the mobile build rather
than a later pass.

---

## 9 · The scale under user scaling (iOS / Android)

Two mechanisms, often conflated:

1. **Browser default font size.** Both iOS Safari and Android Chrome let the user raise the default
   font size. That scales `rem` and unitless-`em` type and nothing else. **This is the mechanism the
   scale must ride**, which is why every size in §4 is `rem` and why `html { font-size: __px }` is
   forbidden. `px` font-sizes and `vw`-based `clamp()` both ignore it completely.
2. **Automatic text inflation / font boosting.** Engines heuristically enlarge text in narrow
   containers. `-webkit-text-size-adjust: 100%` opts out. The old retrofit set this
   (`mobile.css` §13 on `mobile-responsive`) with the correct reasoning: boosting silently distorts a
   tuned scale, enlarging some elements and not others.

**Consequence for the existing tokens.** `--ds-text-3xl`, `--ds-text-4xl` and `--ds-text-5xl`
(`design-system.css:222-224`) are `clamp(… vw …)`. At 375px the `vw` term is always below the floor,
so each resolves to its flat `rem` floor and the `vw` term never participates. `--ds-text-5xl`'s
floor is `5rem` = 80px — **21% of a 375px viewport**. **The mobile scale must not consume the
`3xl`/`4xl`/`5xl` tokens at all**; it defines its own `--m-text-*` (§4), which is why those are
plain `rem`.

**What I could not determine:** whether Android Chrome's "Text scaling" accessibility slider still
scales `rem` once `text-size-adjust: 100%` is set, or whether that setting is implemented purely as
boosting (in which case opting out would deny the benefit to exactly the users who asked for it).
I have no Android device here and I will not guess. **This needs a 10-minute on-device check:** set
Android Chrome text scaling to 200%, load the build, and measure whether body type grows. If it does
not, the mitigation is to keep `text-size-adjust: 100%` and add an in-app text-size control, which
this offline-first app can own entirely.

---

## 10 · Minimum legible size — derived, not asserted

Nominal `font-size` is the wrong unit for a legibility floor, because our faces differ by 36% in
x-height (0.420 to 0.570). **Set the floor on x-height, then convert per face.**

Anchors, both converted using faces measured in the same engine:
- Material's caption minimum is 12sp Roboto → `12 × 0.530` = **6.36px** x-height.
- Apple's HIG body minimum is 11pt ≈ 14.67px; using Roboto as the measurable proxy → **7.78px**.

**This audience skews older, so the floor takes the upper half of that range.**

| Tier | x-height floor | Rationale |
|---|---|---|
| **Required reading** — body, captions, claim text, doses, citations, table cells | **7.0px** | Between the two anchors, biased toward the iOS body floor |
| **Glanceable chrome** — tab labels, badges, status pills | **6.3px** | At the Material caption anchor; never for anything the user must read to decide |
| **Never** | below 6.3px | No exceptions |

Converting the floor per face (`size = floor / xRatio`):

| Face | x-ratio | required-reading min | glanceable min |
|---|---|---|---|
| Unbounded | 0.570 | 12.3px → **13px** | 11.1px → 12px |
| Bruno Ace | 0.550 | 12.7px → **13px** | 11.5px → 12px |
| JetBrains Mono | 0.550 | 12.7px → **13px** | 11.5px → 12px |
| Playfair Display | 0.520 | 13.5px → **14px** | 12.1px → 13px |
| Chakra Petch | 0.500 | 14.0px → **14px** | 12.6px → **13px** |
| Space Grotesk | 0.490 | 14.3px → **15px** | 12.9px → 13px |
| Crimson Pro | 0.420 | 16.7px → **17px** | 15.0px |

Every size in §4 clears its floor. **The caption is 15px, not 14px, for exactly this reason** —
Space Grotesk at 14px gives a 6.86px x-height, just under the required-reading floor.

### What the discarded retrofit shipped, for contrast

On branch `mobile-responsive`, `mobile.css` set the tab label to `font-size: 0.52rem` (**8.3px**) and,
below 360px, `0.46rem` (**7.4px**). In Chakra Petch those are x-heights of **4.2px** and **3.7px** —
roughly **half** the glanceable floor. Repo-wide there are **41** declarations below `0.75rem` (12px)
in `dashboard/assets/styles/`, with hard-`px` sizes down to **9px** (6 occurrences) and 10px (8).
Every one of those is a candidate the mobile pass must either raise or delete. This is a large part
of why the surfaces read as "cheap".

---

## 11 · The tab bar, measured

Five tabs across 375px = **75.0px per tab**. Widths measured in Chakra Petch 600:

| Label | 11px | 12px | 12px + `0.04em` | 13px | 14px |
|---|---|---|---|---|---|
| `KNOWLEDGE` (caps) | 65.8 | 71.8 | 76.1 | **77.8 — overruns** | — |
| `Knowledge` (sentence) | — | — | — | **66.5 — fits, 8.5px slack** | 71.6 |
| `COVERAGE` | — | 61.4 | — | — | — |
| `SCANNER` | — | 54.6 | — | — | — |
| `REGIMEN` | — | 51.4 | — | — | — |

**Uppercase labels do not fit at a legible size.** `KNOWLEDGE` must drop to 12px — below the 13px
Chakra Petch glanceable floor — to fit at all, and the retrofit's answer was 8.3px plus an ellipsis
backstop. **Sentence case at 13px fits every label with slack to spare** and clears the floor. Adopt
sentence-case tab labels; drop the `text-transform: uppercase` and the `0.04em` tracking that
uppercase needs (tracking alone costs 4.3px on the longest label).

Keep `white-space: nowrap` on labels, but the ellipsis should never be what a 375px screen shows.

---

## 12 · The two explicit project rules — where they are, and where mobile breaks one

### No emojis
Doctrine, stated in `CLAUDE.md`, in `chronicle/decisions/2026-08-22-mobile-total-reimagining.md:37`,
and in memory. **It has no gate** — `grep -ci emoji tools/invariants.py` returns **0**. Under §00.B
that makes it a **WISH**, not an enforced rule. Typographic marks and symbols only: `·` `—` `→` `✓`
`↑` `↓` `§` `†` `⚠`. All are in the fallback stacks; none of our seven faces need to supply them.
Marks used in status positions must not be the *only* signal — pair with text.

*(A gate is cheap here: scan the emitted `dist/main.js` string literals and the CSS `content:` values
for `\p{Extended_Pictographic}`. Offered, not built — that is an implementer's call, not mine.)*

### The pull-quote `.ds-mark` must never wrap — **this rule is unsatisfiable on mobile as things stand**

The rule (memory `quote-typography`, a repeated correction from the owner): a highlighted `.ds-mark`
phrase must sit on **one line**; the fix is always to make the quote **smaller**, never bigger, and
**never** to change what is highlighted. The mechanical reason is in `design-system.css:460-495` —
`.ds-mark` is `display: inline-block` with an absolutely-positioned `::before` carrying the
`feTurbulence` texture. It **physically cannot** wrap; `box-decoration-break: clone` does not reach
an absolutely-positioned pseudo-element.

**It also has no gate and no probe.** `grep` finds one incidental mention in `tools/invariants.py`
(line 8163, about verbatim trimming — unrelated), and the six probes that touch `.ds-mark` only read
its `textContent`. Nothing asserts line count.

**Measured, by driving the real app** (Absorption tab, Knowledge drawer forced to a narrow column):

| Mark text | Column 950px (desktop) | 375px | 360px | 320px |
|---|---|---|---|---|
| `the consumption of gluten will produce a "contact enteritis"` | 1 line (527px wide) | **3 lines** | **3 lines** | **3 lines** |
| `the acid is not acid enough` | 1 line | 1 line | 1 line | 1 line |
| `sterile` | 1 line | 1 line | 1 line | 1 line |

The first mark is **59 characters**. At the mobile quote spec (§6: Playfair 19px, 293px inner) one
line holds **35 characters**. To fit 59 characters on one line the quote would have to drop to
**11.3px** — far below every floor in §10, and the rule explicitly forbids growing the quote instead.

**Three things collide here and I am not going to pick silently:**
1. The one-line rule says: shrink the quote.
2. §10 says: never below 14px for Playfair.
3. The rule says: never change what is highlighted.

`design-system.css:455` already states the intended constraint — *"1-3 words max per mark"*. This
mark is **ten words**, so the content violates the design system's own stated limit, which is why no
amount of sizing rescues it.

**The options, for the owner to choose — this is a decision, not an implementation detail:**
- **(a)** Adopt the **two-real-marks split** on mobile — the hack the owner himself described,
  already prototyped (`temporary/highlight-hack-proto.html`): the phrase is split into two abutting
  `.ds-mark` elements, one per line, each the untouched sealed marker. He **declined automating it**
  in a previous session ("leave it as is, I'll deal with it later"), so this would be a hand-split
  per quote, not runtime JS.
- **(b)** Re-choose the highlighted span on the affected quotes to ≤ 32 characters, bringing the
  content back inside the design system's stated 1-3 word limit. This contradicts "never change what
  is highlighted", so it needs his explicit ruling.
- **(c)** Give the mark a different, wrap-capable treatment on mobile only. **Already rejected once**
  — a background-based reproduction was built and the verdict was "This looks NOTHING like the
  original. REVERT." Recorded only so nobody re-proposes it as new.

Whichever is chosen, the gate is now easy and should ship with it: for every visible `.ds-mark`,
assert `round(getBoundingClientRect().height / lineHeight) === 1` at 375px. **Do not use
`getClientRects().length`** — it returns 1 for a wrapped inline-block and will pass a broken layout
(§1).

---

## 13 · Contrast, computed (WCAG 2.1, sRGB relative luminance)

Thresholds: normal text **4.5:1** (AA) / **7:1** (AAA); large text (≥18.66px bold or ≥24px)
**3:1** / **4.5:1**; non-text UI **3:1**.

### Cream (default) — `--ds-paper` `#faf5e8`

| Token | Value | vs `--ds-paper` | vs `--ds-paper-light` `#fffbf2` | vs `--ds-paper-deep` `#f2ead3` | Verdict (body) |
|---|---|---|---|---|---|
| `--ds-ink` | `#1a1612` | **16.52** | 17.42 | 14.98 | **AAA** |
| `--ds-ink-medium` | `#3d342a` | **11.20** | 11.80 | 10.15 | **AAA** |
| `--ds-ink-soft` | `#6a5d50` | **5.86** | 6.17 | 5.31 | **AA** |
| `--ds-ink-faint` | `#9b8e7c` | **2.94** | 3.10 | 2.67 | **FAIL** |
| `--ds-accent` | `#ff7e3c` | **2.32** | 2.45 | 2.11 | **FAIL** |
| `--ds-accent-hot` | `#ff6420` | 2.72 | 2.87 | 2.46 | **FAIL** |
| `--ds-accent-bright` | `#ff9d5c` | 1.89 | 1.99 | 1.71 | **FAIL** |
| `--ds-accent-deep` | `#c8552a` | **4.03** | 4.25 | 3.65 | large-only |
| `--ds-tech` | `#5fa4bd` | 2.56 | 2.70 | 2.32 | **FAIL** |
| `--ds-status-ok` | `#5b8a3f` | 3.74 | 3.95 | 3.39 | large-only |
| `--ds-status-warn` | `#c79830` | 2.42 | 2.55 | 2.20 | **FAIL** |
| `--ds-status-err` | `#b04a30` | **4.99** | 5.26 | 4.52 | **AA** |
| `--ds-status-info` | `#4a7090` | **4.81** | 5.07 | 4.36 | **AA** |

### Dark — `--ds-paper` `#17130d` (`theme.css:26-40`)

| Token | Value | vs `--ds-paper` | vs `--ds-paper-light` `#221d15` | vs `--ds-paper-deep` `#100c08` | Verdict (body) |
|---|---|---|---|---|---|
| `--ds-ink` | `#f3ead7` | **15.47** | 14.00 | 16.29 | **AAA** |
| `--ds-ink-medium` | `#d9ccb4` | **11.67** | 10.56 | 12.29 | **AAA** |
| `--ds-ink-soft` | `#a89a80` | **6.69** | 6.06 | 7.05 | **AA** |
| `--ds-ink-faint` | `#786c58` | **3.60** | 3.26 | 3.79 | large-only |
| `--ds-accent` (ember) | `#ff7e3c` | **7.31** | 6.62 | 7.70 | **AAA** |
| `--ds-accent-hot` | `#ff6420` | 6.25 | 5.66 | 6.58 | **AA** |
| `--ds-accent-bright` | `#ff9d5c` | 9.01 | 8.15 | 9.49 | **AAA** |
| `--ds-accent-deep` (remapped) | `#faaf82` * | **10.15** | 9.18 | 10.68 | **AAA** |
| `--ds-tech` | `#5fa4bd` | 6.63 | 6.00 | 6.99 | **AA** |
| `--ds-status-ok` | `#5b8a3f` | 4.54 | 4.11 | 4.78 | **AA** |
| `--ds-status-warn` | `#c79830` | 7.01 | 6.35 | 7.39 | **AAA** |
| `--ds-status-err` | `#b04a30` | 3.41 | 3.08 | 3.59 | large-only |
| `--ds-status-info` | `#4a7090` | 3.53 | 3.20 | 3.72 | large-only |

\* dark remaps `--ds-accent-deep` to `color-mix(in srgb, var(--ds-accent) 55%, var(--ds-ink))`
(`theme.css:268`); computed in sRGB for the ember default.

### The three findings that matter

1. **`--ds-ink-faint` fails as text on cream — 2.94:1, well under 4.5.** It is used widely for
   kickers, eyebrows, meta lines, tick labels and citations
   (e.g. `drawer-knowledge.css:30`, `:1332`, `drawer-orac.css:39`). For an audience that skews older
   this is the single worst readability defect in the type system. **Mobile rule: `--ds-ink-faint`
   is a *rule and divider* colour, never a text colour.** Every caption, eyebrow and citation goes to
   **`--ds-ink-soft`** (5.86 cream / 6.69 dark — AA both). Dark gets away with `--ds-ink-faint` at
   3.60 for large text only; keeping the rule symmetric across themes is simpler and safer.
2. **`--ds-accent` fails as text on cream — 2.32:1.** Orange text on cream is not readable at body
   size. On cream, accent-coloured *text* must use **`--ds-accent-deep`** (4.03) and even that is
   large-text-only; for body-size accent text on cream there is **no passing token**, and the honest
   answer is to carry emphasis with weight or a mark, not colour. Dark is the opposite — accent text
   is AAA there (7.31). Do not assume a treatment that reads fine in dark is fine in cream.
3. **Rules and hairlines are all below 3:1 in both themes** — cream `--ds-rule` 1.53,
   `--ds-rule-soft` 1.22, `--ds-rule-bright` 1.83; dark 1.46 / 1.22 / 1.84. Fine as decorative
   separators, **not** fine as the only boundary of an interactive control. On mobile, where a
   1px hairline is the usual card boundary, any control whose affordance depends on its border needs
   a 3:1 outline or a filled ground instead.

### The eight swappable accents (`theme.css:62-91`) as text

| Accent | base on cream | `-deep` on cream | base on dark | dark `-deep` |
|---|---|---|---|---|
| ember `#ff7e3c` | 2.32 | 4.03 | 7.31 | 10.15 |
| azure `#2f9dba` | 2.90 | **6.52** | 5.86 | 9.16 |
| green `#5aa82c` | 2.73 | **4.81** | 6.23 | 9.54 |
| amethyst `#8a52d6` | **4.53** | **7.99** | 3.75 | 7.40 |
| rose `#e5687f` | 2.91 | **6.09** | 5.83 | 9.04 |
| gold `#e0a92e` | 1.95 | 3.58 | 8.71 | 11.29 |
| teal `#2bb2a3` | 2.41 | **5.83** | 7.05 | 9.91 |
| slate `#5f7599` | 4.30 | **8.62** | 3.96 | 7.89 |

**Only `-deep` is ever safe for text on cream, and even then ember (4.03) and gold (3.58) fail AA.**
Any mobile component that sets accent-coloured text must either use `-deep` **and** be large text, or
not use colour for that job. This is the same trap `theme.css` already documents at (J6)/(J8) — an
accent that reads on one ground disappears on another.

### Highlighter marks (ink on the mark), cream
`--ds-hl-warm` `#ffe69c` → **14.61** · `--ds-hl-rose` `#f7c4b8` → **11.60** ·
`--ds-hl-mint` `#c8e5b8` → **13.15**. All AAA. The marks are safe; only their wrapping is a problem
(§12).

---

## 14 · Ready-to-paste CSS

```css
/* ===========================================================================
 * MOBILE TYPE SYSTEM  —  375px-first, mobile-only scope.
 *
 * Sizes are rem so the browser's default-font-size preference scales the whole
 * app. NEVER set html{font-size:__px} and NEVER use a vw unit in this block —
 * both defeat that preference. The app's 3xl/4xl/5xl tokens are vw-clamped and
 * are deliberately NOT consumed here.
 *
 * Families resolve through the LIVE tokens. type-futurist.css is authoritative;
 * design-system.css's serif tokens are declared but dead — do not read them.
 * =========================================================================== */
:root {
  /* -- families ---------------------------------------------------------- */
  --m-font-display: var(--ds-font-display);            /* Unbounded          */
  --m-font-body:    var(--ds-font-sans);               /* Space Grotesk      */
  --m-font-ui:      var(--ds-font-display-interface);  /* Chakra Petch       */
  --m-font-mono:    var(--ds-font-mono);               /* JetBrains Mono     */
  --m-font-numeral: var(--ds-font-display-artifact);   /* Bruno Ace (static) */
  --m-font-quote:   'Playfair Display', 'Times New Roman', Georgia, serif;

  /* -- sizes ------------------------------------------------------------- */
  --m-text-display: 1.875rem;   /* 30px */
  --m-text-title:   1.375rem;   /* 22px */
  --m-text-section: 1.125rem;   /* 18px */
  --m-text-body:    1.0625rem;  /* 17px — NOT 16px; Space Grotesk x-height is 0.490 */
  --m-text-caption: 0.9375rem;  /* 15px — NOT 14px; 14px is under the x-height floor */
  --m-text-label:   0.8125rem;  /* 13px — glanceable floor for Chakra Petch */
  --m-text-mono:    0.875rem;   /* 14px */
  --m-text-quote:   1.1875rem;  /* 19px */

  /* -- line heights ------------------------------------------------------ */
  --m-lh-display: 1.08;
  --m-lh-title:   1.18;
  --m-lh-section: 1.28;
  --m-lh-body:    1.60;   /* generous: compensates for a 41-character measure */
  --m-lh-caption: 1.45;
  --m-lh-label:   1.15;
  --m-lh-mono:    1.50;
  --m-lh-quote:   1.45;

  /* -- tracking ---------------------------------------------------------- */
  --m-track-display: -0.02em;
  --m-track-title:   -0.015em;
  --m-track-section: -0.005em;
  --m-track-body:     0.005em;
  --m-track-caption:  0.005em;
  --m-track-label:    0.02em;
  --m-track-mono:     0;
  --m-track-quote:    0;

  /* -- the measure ------------------------------------------------------- */
  --m-pad-read:  20px;   /* reading surfaces  -> 335px column -> 40.9 CPL @17px */
  --m-pad-dense: 16px;   /* lists/tables/grid -> 343px column -> 41.9 CPL @17px */

  /* -- text colour: PASSING tokens only ---------------------------------- */
  --m-ink-primary:   var(--ds-ink);         /* cream 16.52 · dark 15.47 — AAA */
  --m-ink-secondary: var(--ds-ink-medium);  /* cream 11.20 · dark 11.67 — AAA */
  --m-ink-tertiary:  var(--ds-ink-soft);    /* cream  5.86 · dark  6.69 — AA  */
  /* --ds-ink-faint is 2.94:1 on cream. It is a RULE colour here, never text. */
}

html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

/* -- roles ----------------------------------------------------------------- */
.m-display {
  font-family: var(--m-font-display); font-weight: 700;
  font-size: var(--m-text-display); line-height: var(--m-lh-display);
  letter-spacing: var(--m-track-display); color: var(--m-ink-primary);
  text-wrap: balance;
}
.m-title {
  font-family: var(--m-font-display); font-weight: 600;
  font-size: var(--m-text-title); line-height: var(--m-lh-title);
  letter-spacing: var(--m-track-title); color: var(--m-ink-primary);
  text-wrap: balance;
}
.m-section {
  font-family: var(--m-font-body); font-weight: 700;
  font-size: var(--m-text-section); line-height: var(--m-lh-section);
  letter-spacing: var(--m-track-section); color: var(--m-ink-primary);
  text-wrap: balance;
}
.m-body {
  font-family: var(--m-font-body); font-weight: 400;
  font-size: var(--m-text-body); line-height: var(--m-lh-body);
  letter-spacing: var(--m-track-body); color: var(--m-ink-primary);
  text-wrap: pretty;
}
.m-body + .m-body { margin-top: 0.9em; }
.m-body .name, .m-body code { overflow-wrap: anywhere; }

.m-caption {
  font-family: var(--m-font-body); font-weight: 400;
  font-size: var(--m-text-caption); line-height: var(--m-lh-caption);
  letter-spacing: var(--m-track-caption); color: var(--m-ink-tertiary);
  text-wrap: pretty;
}
.m-label {                        /* tab labels, badges, kickers — SENTENCE CASE */
  font-family: var(--m-font-ui); font-weight: 600;
  font-size: var(--m-text-label); line-height: var(--m-lh-label);
  letter-spacing: var(--m-track-label); color: var(--m-ink-secondary);
  text-transform: none;           /* uppercase does not fit — see §11 */
  white-space: nowrap;
}
.m-mono {
  font-family: var(--m-font-mono); font-weight: 400;
  font-size: var(--m-text-mono); line-height: var(--m-lh-mono);
  letter-spacing: var(--m-track-mono); color: var(--m-ink-primary);
  font-variant-numeric: tabular-nums;   /* real: JetBrains Mono IS monospaced */
}

/* Numerals that CHANGE must use a face that actually has a tnum table.
   Bruno Ace and Chakra Petch do not — tabular-nums is a no-op on them (§8). */
.m-num-live {
  font-family: var(--m-font-body); font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.m-num-static { font-family: var(--m-font-numeral); }   /* Bruno Ace, static only */

/* Missing weights should fail loudly, not get faux-bolded.
   Chakra Petch has no 500; Bruno Ace is 400-only. */
.m-label, .m-num-static { font-synthesis: none; }

/* -- the Wallach pull-quote, mobile geometry ------------------------------- */
.m-quote .ds-pull-quote {
  font-family: var(--m-font-quote); font-style: italic; font-weight: 400;
  font-size: var(--m-text-quote); line-height: var(--m-lh-quote);
  padding: 20px 20px 20px 22px;         /* was 32px 40px — desktop geometry */
}
/* The ::before glyph reads --ds-font-display (Unbounded) DIRECTLY and inherits
   nothing from its host. Style BOTH or you ship a silent font mismatch. */
.m-quote .ds-pull-quote::before {
  font-family: var(--m-font-quote);
  font-size: 3.25rem;                   /* was 6rem = 29% of a 375px card */
  top: -0.28em; left: 0.08em;
}
```

---

## 15 · What I could not determine

Stated plainly rather than guessed:

1. **Android Chrome text scaling under `text-size-adjust: 100%`** (§9). Whether the accessibility
   slider still scales `rem` once boosting is opted out. Needs a real device. This is the one open
   item that could change a recommendation.
2. **Whether Crimson Pro has any live consumer** (§2). I traced the token chain and found none, but
   I did not enumerate every surface by driving the app. If it is genuinely dead it is another
   ~0.5 MB of the download — the same argument that cut Merriweather in `a9b0513b`.
3. **`text-wrap: balance` line cap** (§7). Chrome caps it; I did not measure the exact number.
4. **`opsz` axis presence** per variable font (§7). `font-optical-sizing: auto` is supported by the
   engine, but I did not check whether any of our faces actually expose an optical-size axis. If
   none do, the declaration is inert — harmless, but do not claim it is doing anything.
5. **`text-box-trim` on the target Safari version.** Supported in Chrome 149; iOS support not
   verified here.
6. **The Knowledge drawer has no mobile layer on `master`.** Driving it at a 375px viewport, the
   drawer renders at a fixed **950 × 812** (`kd-open`, `display:flex`). That is expected — the
   retrofit lives on `mobile-responsive` — but it means every measurement in §12 that needed a narrow
   column was taken by forcing the drawer width, not by a real mobile layout. The wrap result is a
   property of the text and the column width, so it holds; but nobody should read those numbers as
   "this is what master renders on a phone".
7. **Nothing in this document is a Wallach amount, dose, target, deficiency sign, or health claim.**
   No corpus data was read, written, or inferred. The only content quoted is an existing verbatim
   already rendered on the Absorption surface, quoted solely to measure its width.

---

## 16 · The short version, for an implementer

1. **Body is 17px Space Grotesk / 1.60, not 16px** — the face's x-height is 0.490, 8% below Roboto.
2. **20px reading gutter, 16px dense gutter.** 40.9 CPL and 41.9 CPL. Accept the short measure; pay
   for it in leading.
3. **Floors are on x-height, not font-size: 7.0px required-reading, 6.3px glanceable, never below.**
   In practice: nothing under 15px Space Grotesk, 14px Chakra Petch, 13px JetBrains Mono.
4. **Sentence-case tab labels at 13px Chakra Petch 600.** Uppercase does not fit at a legible size.
5. **`--ds-ink-faint` is not a text colour** (2.94:1 on cream). Captions and citations use
   `--ds-ink-soft`.
6. **`--ds-accent` is not a text colour on cream** (2.32:1). Weight or a mark, not orange.
7. **Changing numerals go in JetBrains Mono or Space Grotesk.** Bruno Ace and Chakra Petch have no
   `tnum` table — two shipped `tabular-nums` declarations are no-ops today.
8. **No small caps** (synthetic in six of seven faces). **No `hanging-punctuation`** (unsupported in
   Chromium). **Yes** to `text-wrap: pretty` on prose and `balance` on headings.
9. **All sizes in `rem`, no `vw`, never `html{font-size:__px}`.**
10. **The `.ds-mark` one-line rule cannot be met on mobile without a ruling from the owner** (§12).
    Do not silently pick an option; when it is settled, ship the height-based gate with it.
