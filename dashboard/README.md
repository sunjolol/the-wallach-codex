# dashboard/

The app itself — an offline-first, single-page dashboard that opens straight from
`dashboard.html` (double-click it; it runs in any browser, fully offline).

- **`dashboard.html`** — the shell. It carries no data of its own; it loads the stylesheets
  and the one bundled script.
- **`assets/js/src/`** — the TypeScript source, layered **`core/ → state/ → views/`**: `core/`
  is pure logic + the Zod schemas, `state/` is the single localStorage chokepoint, `views/`
  renders each surface (coverage, regimen, scanner, search, knowledge, profile, welcome).
  Bundled by `tools/build.mjs` into `assets/js/dist/main.js`.
- **`assets/styles/`** — `design-system.css` (the **sealed** token + primitive layer),
  `theme.css` (the themeable appearance layer — cream / dark + accent), and the per-surface
  stylesheets.
- **`assets/data/`** — the generated data the app reads (inlined into the bundle at build
  time). **Never hand-edit these** — they are derived from the `eden/` pillars.
- **`assets/fonts/`** — the in-housed offline fonts. **`assets/vendor/tesseract/`** — the
  vendored on-device OCR engine the Scanner uses.

The build config lives here (`tsconfig.json`, `package.json`, `eslint.config.js`, `knip.json`).
Build from the repo root: `node tools/build.mjs`.
