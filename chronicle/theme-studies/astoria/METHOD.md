# Porting a reference design 1:1 — the Astoria study

_Recorded 2026-08-03. Permanent. This is the method, not a diary: it exists so the next
theme port takes an afternoon instead of a day, and so this one can be turned into a live
dashboard theme later without re-deriving anything._

Source: `https://codepen.io/pharaohleap/pen/wBojQLN` — "copy because i keep breaking
everything", by Pharaoh Leap. A character directory for a roleplay forum.
Result: `temporary/review-dashboard.html`, our demo index wearing that design exactly.

---

## §1 · Why 1:1 first, and what that actually means

Luneth's framing, which turned out to be the whole reason this worked:

> High design is delicate — add or change one element and the rest crumbles. It's best to
> 1:1 copy first THEN slowly but surely introduce changes.

The first attempt at this page did the opposite. It took the *techniques* (grain-as-a-blend,
a hue per entity, a light/dark blend swap), re-implemented them cleanly with our own
vendored faces and a procedurally generated grain, and invented a principled per-family
palette. Every individual decision was defensible. The result was **inert** — because in the
original, one specific desaturated pink (`#ba6a87`) is doing the structural work of tying
every surface together, and a "principled" muted violet in its place ties nothing to
anything. The lesson generalises:

> A palette is not a set of colours. It is a set of *relationships*. Substituting a colour
> with similar saturation and lightness does not preserve the relationship, and a design
> that depends on the relationship stops working even though nothing looks obviously wrong.

So the rule for a port is: **colours, fonts and graphics are copied exactly. Content,
arrangement, sizing and component selection are adapted.** Anything you feel tempted to
"improve" during the port, write down and change *after* the faithful version renders.

## §2 · The pipeline

Five steps, each of which can be run again for a different reference.

### 2.1 Get the rendered document, not the editor page
The pen page is a React app; the pen itself lives in a cross-origin iframe you cannot
script, screenshot through, or scroll from the parent. Fetch the render frame directly:

```
https://cdpn.io/<user>/fullpage/<slug>          ← needs Referer: https://codepen.io/
https://codepen.io/<user>/fullpage/<slug>       ← redirects to the above
```

`.../pen/debug/<slug>` returns 403 without a session. If you only need the *source*, the
editor page holds it in CodeMirror instances: `[...document.querySelectorAll('.CodeMirror')]
.map(e => e.CodeMirror.getValue())` returns HTML/CSS/JS. Do that from the browser tool, and
write it to disk from a fetch script — never pull 100 KB of CSS through the model's context.

### 2.2 Find EVERY stylesheet — the one that nearly sank this
The pen links a second sheet at the very **end of `<body>`**:

```html
<link media="all" href=".../astoria_bounds_embedded.css" rel="stylesheet">
```

42 KB, and because it loads last it wins the cascade on a great deal. The first fetch missed
it because the regex assumed `rel` precedes `href`. Symptom: the page renders, colours are
right, and yet major components are visually dead — in this case the giant wordmark did not
scale or take its fill.

**Rule: match `<link ... rel=stylesheet>` with attributes in ANY order, and scan the whole
document, not just `<head>`.** Then preserve load order in the concatenated theme file. This
is very likely why the design never looked right when it was saved by hand.

### 2.3 Pull every asset and rewrite the URLs — that is the only edit
`fetch-astoria.js` (kept beside this file) walks the CSS and HTML for `url(...)`,
`src=`/`href=` and inline `background-image:` and downloads everything into `assets/`. Then
one function repoints absolute URLs at the local copies. **No rule is added, removed,
reordered or retuned.** That constraint is what makes the fidelity claim checkable rather
than a matter of opinion.

Also vendor anything the document loads from elsewhere: this one needed Google's Noto Serif
(the body face), jQuery 1.7.2 and fitty. Miss those and the page silently falls back.

### 2.4 Reuse their components; substitute only text
Lift the component markup out of the source with a balanced-subtree extractor, use it as a
template, and replace the text inside. Do **not** hand-write markup that "looks like" theirs
— the CSS depends on exact nesting.

### 2.5 Render it and compare against the real thing
The design is the spec. Screenshot both, look at both, fix the differences.

---

## §3 · The traps, all of which cost real time

**A wrapper element around a grid child destroys the grid.** Cards were wrapped in a
`<div class="GID-Passion">` to carry the accent. `.aug-boards` lays out `.aug-bored`
children, so the wrapper became the grid item and every card went full-width and
1,000 px tall. **Put the extra class ON the component, never around it.**

**Text substitution must run on text nodes only.** A global replace of `guidebook →
the newest work` rewrote `class="aug-guidebook"` into `class="aug-the newest work"` and
detonated that whole block. Split on `(<[^>]*>)` and transform only the even indices.

**Their CSS appends words to your content.** `.aug-bored-num span:nth-child(1)::after
{ content: ' created' }`. Putting a state word in that slot rendered "picked created". Those
slots are numeric by design; if your data is not numeric, omit the block rather than fight
the stylesheet — omission is an adaptation, restyling is not.

**Display type may not be text.** The giant wordmark reads ` <b></b>  A`
— three private-use codepoints plus an "A". They are bespoke ligatures inside the display
font that draw ASTORIA and no other word can borrow them. Replace with real letters in the
same face, keeping the two-layer fill/stroke structure and the `<b>` that takes the accent
and the marble fill.

**Whitespace hides inside inline elements.** `</b>A</span>` collapsed for display is
actually `</b>A\n          </span>`. A literal string replace fails silently; use a
whitespace-tolerant pattern.

**A demo/trial font watermarks glyphs outside its licensed subset — including digits.**
`ALLOVER_MODERN_DEMO.otf` stamps "TRIAL FONT / 177studio.com" across any unlicensed glyph.
"Foods §04" printed the watermark across a card title. See §5.

**Bash heredocs corrupt Python payloads.** Writing a patch script through a heredoc turned
`\b` into byte `0x08` and `\1` into `0x01` inside the target file, after which Edit could not
match the visibly-identical text. Stage patch scripts with the Write tool, not a heredoc,
whenever the payload contains regex escapes.

---

## §4 · What the design is actually made of

Worth knowing before adapting it, because these are the load-bearing parts.

**Grain as a blend, pinned to the viewport.** A flat colour, a grunge PNG over it via
`background-blend-mode`, and `background-attachment: fixed`. The fixed attachment is the
trick: every panel shows one continuous field, so the page reads as a printed sheet rather
than a stack of separately-textured boxes. Light surfaces `multiply`, dark surfaces
`soft-light` — one asset, both modes.

**A hue per entity.** `--Hope`, `--Fate`, `--Unity`, `--Liberty`, `--Fortune`, `--Entropy`,
`--Passion`, `--Knowledge`, `--Vitality`, `--Destruction`, `--Time`, `--Space`, `--Order`,
`--Unbound`, `--Archived`, `--OOC` — all muted, all roughly equal in weight, applied through
`GID-*` classes. `--accent: var(--Passion)` picks the page's own. This is what makes a long
directory scannable, and it maps directly onto our 90 essentials and their categories.

**"Toggle mode" is not light/dark.** It swaps `mix-blend-mode` so the same greyscale
line-art reads either as quiet grey texture or as solid accent-coloured graphics.

**The images are not decoration, they are the design.** Marbled pours, ink splashes,
line-art renders, gear engravings. This aesthetic cannot be reproduced with CSS alone, and
attempting it is what made the first attempt fall flat.

---

## §5 · What stands between this study and a live theme

Honest blockers, in order of severity.

1. **The display face is a trial build and cannot set numbers.** For a dashboard about
   doses, targets and amounts, that is disqualifying on its own. Either licence
   Allover from 177studio, or find a display serif with the same high-contrast
   character and full glyph coverage. **This is the first thing to resolve.**
2. **The artwork is third-party.** Fine for an internal study; a shipped theme needs either
   licensed art, commissioned art, or generated art in the same register.
3. **Weight: 18.8 MB**, dominated by one 12.5 MB WebP. A shipped theme wants that pour
   re-encoded or replaced.
4. **The CSS is a single 127 KB sheet written against their markup.** A live theme has to
   be re-expressed against OUR component classes. That is the real work, and it is the
   reason this study exists — so it is a translation exercise rather than a design one.
5. **Contrast is unmeasured.** Our own surfaces are gated at WCAG AA; this study was never
   put through that gate, and its muted-hue-on-mid-grey combinations will not all pass.

---

## §6 · Files

| Path | What |
|---|---|
| `theme.css` | Their compiled CSS + the second sheet + Noto Serif, URLs localised. **No other edit.** |
| `assets/` | 59 files — both display faces, Noto Serif woff2s, every image, jQuery, fitty |
| `assets-ledger.json` | Every asset, its source URL and its size |
| `fetch-astoria.js` | The downloader. Re-runnable, and the template for the next port |
| `build-review-dashboard.py` | The generator: templates lifted from their markup, our text substituted |
| `temporary/review-dashboard.html` | The rendered result (gitignored; rebuild with the generator) |

Rebuild:

```bash
PYTHONUTF8=1 python chronicle/theme-studies/astoria/build-review-dashboard.py <scratchpad> . <manifest.json>
```
