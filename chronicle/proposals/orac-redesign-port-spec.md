# ORAC 01–06 redesign — executable port spec

> **STATUS: SHIPPED.** This port landed — `kd-orac-*` is live in `views/knowledge-orac.ts` and
> `styles/drawer-orac.css`. The document is kept as the record of the reasoning; **the line ranges
> below describe the pre-port files and no longer resolve** — both files have grown well past the
> largest line number cited here. The demo it cites, `temporary/demos/orac-redesign-v2.html`, is
> local-only and is not part of this repository.

_2026-08-17. The signed-off demo `temporary/demos/orac-redesign-v2.html` is the spec.
This turns it into a concrete port with the four review fixes baked in. It was held for a
verification pass because it is a large interactive rebuild landing on the flagship tab — not
blind-shipped._

## Boundary (do not violate)
Port demo sections **01–06 only**. Everything from **07 (`renderSupplements`) onward STAYS
byte-untouched** — that is why the demo stops at 06.
- View: `dashboard/assets/js/src/views/knowledge-orac.ts` — replace 01–06 render fns
  (hero inline 402–415, `renderMirror` 116–131, `renderSteal` 135–155, `renderChain` 162–174,
  `renderTarget` 178–195, `renderReach` 251–257, `renderScale` 260–264, `renderTables` 267–275).
  STAY: `renderSupplements` (294–323), `renderPieces` §08 (199–246), claims §09 (352–389).
- CSS: `dashboard/assets/styles/drawer-orac.css` — 01–06 styles are lines 5–89 (+ parts of the
  138–146 media query); STAY = 90–136, 148–181. Rename demo `ov-*` → `kd-orac-*`.
- Dark: `dashboard/assets/styles/theme.css` — add a `:root[data-theme="dark"] .kd-orac-*` block
  (the demo is light-only). ORAC §08 dark is ALREADY done (block K, 2026-08-17).
- Interactivity wiring: `dashboard/assets/js/src/views/knowledge.ts` `mount()` (delegated listeners).

## §00.A — no hand-typed numbers (the hard rule)
The current tab is already PURE PROJECTION: every number comes from `oracData()` /
`oracFoodsData()` (state/orac*.ts, byte-gated). The demo hardcodes `data-v` on every field
dot — those exact values must instead come from `oracFoodsData().tables.categories`.
- The `tables` rows carry `value_display` (e.g. "314,446") + `bar` (%), and per the recon **no
  numeric `value`**. Two options: **(A)** parse `Number(value_display.replace(/,/g,''))` in the
  view — the number still ORIGINATES from the sealed-derived data, so this is reformatting, not
  authoring; **(B, cleaner)** extend `TableRow` schema + `eden/tools/orac_foods_derive.py` to
  emit a numeric `value` from the same sealed verbatim. Prefer (A) for a no-derive-change port;
  (B) if we're touching the derive anyway.
- **Bake dot positions AT RENDER.** Compute the log/linear position in TS from the numeric value
  and emit `style="left:X%"`. The field then renders correctly with ZERO post-render JS; the
  interactivity below is progressive enhancement.

## Interactivity (progressive — static render must be correct without it)
Demo ships two IIFEs; port their logic into delegated listeners initialised when the ORAC tab
mounts (knowledge.ts already attaches container-level click/input handlers):
1. **Mirror scrubber** (01): a range input drives fill height + readout + tick highlight.
   ~30 lines; interpolates the four Wallach-measured ages from `oracData()` (NOT the demo's
   hardcoded MEAS array — those figures live in orac-data).
2. **League field** (06): mode toggle log↔linear (recompute `left`), hover/click tooltip anchored
   to the dot, legend-as-filter (toggle lane display). ~100 lines. Pin/unpin on click.

## The four fixes (your notes)
1. **Section numbers clipped on the right.** Demo `.ov-sec__n` (4rem, `letter-spacing:-.045em`,
   `background-clip:text`) and `.ov-hd__n` (`-.05em`) shave the last digit. Fix: use the LIVE
   value `--ds-track-tight` (-0.025em) + a small `padding-right:.08em` on the number element.
   The existing live `.kd-orac-sec__num` / `.kd-orac-hd__num` already don't clip — match them.
2. **League dots too close to hover.** There is NO spacing logic — dots position purely by value
   at a shared `top:64%`, so clustered values collapse. Fix: after computing each dot's %, run a
   spread pass per lane — sort by value, enforce a min horizontal gap (≈ dot-diameter in %),
   nudging colliders apart; allow a SMALL alternating vertical `top` offset for unavoidable
   stacks (you asked: still stack slightly, just hoverable). Emit the adjusted left/top at render.
3. **Section 03 green → accent.** Demo `--live:#2f7d4f` on `.ov-tgt__m` border-left (174) and
   `.ov-tgt__n em` dash (179). Change BOTH to `var(--ds-accent)`. CAUTION: `--live` is reused for
   the §06 green target-line marker + §04 `.ov-rest` border — scope the change to those two §03
   selectors only; keep the target-line green.
4. **Pecan/hazelnut/nuts puke-brown.** Live resolves food colours by `--o-*` token
   (`drawer-orac.css:5`): current nuts `--o-nut:#7c3aed` (that's the LIVE value; the DEMO uses an
   earthy `#a2761c` inline). Pick a more appealing nut colour and a coherent food palette overall.
   CAUTION: `--o-spice`/`--o-leaf` bleed into STAY §07/§08 (supp fallback + forces/payoff) — if you
   recolour those, introduce field-specific tokens instead so 07/08 don't shift.

## Dark theme (demo is light-only)
Add dark overrides for the new components (recon-mapped breakers):
- The `--ds-ink`-as-background bars (scrubber label, field control bar) → a real dark plate.
- Chain cards `background:var(--f)` (pale-orange ramp) + ink text → keep text dark / darken cards.
- Lane `:nth-child(even)` hardcoded `rgba(212,200,169,.17)` → token-based translucent stripe.
- `.ov-h2 em` highlight `--p1` → token-based.
- Everything already on `--ds-paper*/--ds-rule*/--ds-ink*` adapts automatically.

## Verify before commit
`npm run build` green · `invariants.py` 92/92 · headless screenshot (Puppeteer file:// → data:,
`--allow-file-access-from-files`, seed profile theme light AND dark) of the whole tab + an
interaction state (a pinned dot, linear mode) · console clean. Then stop for your eyes.

## Estimated size
~200 lines new CSS + ~130 lines JS + view rewrite of 6 sections + data-parse + dark block.
A focused session with iterative screenshotting. Ready to execute on your go.
