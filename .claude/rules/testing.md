# Testing

_Read before authoring a probe or running verification._

## Pattern
Views are verified end-to-end by headless probes that assert visible state. Unit tests cover pure functions in `state/` and `core/`.

## Render probes (the "views verified visually" contract)
- Location: `tools/render_probe*.js`.
- One probe per surface (or per critical user path).
- Each probe: launches puppeteer headless, navigates the surface, asserts visible state, exits 0 / non-zero.
- A view chunk is not "shipped" until its probe passes.

## Existing probes
- `render_probe.js` — Coverage default
- `render_probe_seeded.js` — Coverage with seeded regimen
- `render_probe_scan.js` — Scanner verdict path
- `render_probe_ocr.js` — Scanner OCR (no WASM load)
- `render_probe_adopt.js` — Scanner → adopt → Coverage cascade
- `render_probe_knowledge.js` — Knowledge drawer

## Unit tests
- Location: `dashboard/assets/js/src/state/*.test.ts` (and `core/*.test.ts` when added).
- Runner: `(cd dashboard && npx vitest run "assets/js/src/state/**")`.
- Empty-glob exit 1 is N/A, not a failure — when no `*.test.ts` exist for the surface yet, the render probe is the verification surface.

## When to add a probe vs a unit test
- Pure function in `state/` or `core/` → unit test.
- DOM render, event wiring, cascade through chokepoints → render probe.
- Both? Both.
