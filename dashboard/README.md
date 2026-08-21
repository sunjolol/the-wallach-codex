# dashboard/

The app itself — an offline-first, single-page dashboard that opens straight from
`dashboard.html` (double-click it; it runs in any browser, fully offline).

- **`dashboard.html`** — the shell. It carries no data, no logic and no inline blocks; it
  links the 11 stylesheets and the one bundled script, `assets/js/dist/main.js`. That bundle
  is emitted as an IIFE, not an ES module, because a `file://` page has a null origin and a
  browser refuses to load an ES module from disk.
- **`assets/js/src/`** — the TypeScript source, in three layers. The dependency arrow runs
  **`views/ → state/ → core/`**: a lower layer may never import a higher one, which
  `eslint-plugin-boundaries` enforces. `core/` is pure logic, the Zod schemas, and the single
  localStorage chokepoint (`core/storage.ts`); `state/` holds the per-domain stores that read
  and write through it; `views/` renders each surface (coverage, regimen, scanner, search,
  knowledge, profile, welcome). Bundled by `tools/build.mjs` into `assets/js/dist/main.js`,
  which is committed — that file is the runtime contract, and Node is needed only to rebuild it.
- **`assets/styles/`** — `design-system.css` (the **sealed** token + primitive layer, hashed by
  `design-system.golden.sha256`), `type-futurist.css` (loads after it and supersedes its serif
  font tokens app-wide — Unbounded and Space Grotesk are the live faces), `theme.css` (the
  themeable appearance layer — cream / dark plus accent, shadowing the sealed tokens under
  `[data-theme]` / `[data-accent]` rather than editing them), the per-surface stylesheets, and
  `STYLE-GUIDE.md`.
- **`assets/data/`** — the data the app reads, inlined into the bundle at build time. Most of it
  is **generated** from the `eden/` pillars and must never be hand-edited. A smaller set is
  deliberately hand-authored editorial config and prose — `home-curation.json`,
  `foods-curation.json`, `coverage-layout-skeleton.json`, `glossary.json`, `view-copy.json`,
  `entity-copy.json` and a few others. Every file states which it is in its own `_purpose` /
  `_doc` field, and `eden/derived/MANIFEST.json` is the full ledger: check there before editing.
- **`assets/fonts/`** — the eight in-housed typefaces (all SIL OFL 1.1). Bundling them is what
  lets the page's Content-Security-Policy hold `font-src` to `'self'`.
- **`assets/avatars/`** — the 25 bundled profile portraits.
- **`assets/vendor/tesseract/`** — the vendored on-device OCR engine the Scanner loads from disk
  when a scan starts. **`tools/design-libs/`** — five hash-pinned, browser-ready design
  libraries (inventory and hashes in `vendor-manifest.json`). Those five back the standalone
  design mockups only; nothing under `assets/js/src/` imports them, so the shipped bundle does
  not include them.

The build config lives here (`tsconfig.json`, `package.json`, `eslint.config.js`, `knip.json`,
`knip-baseline.json`, `.prettierrc`). Build from the repo root: `node tools/build.mjs`.

The git hooks declared in `package.json` — `pre-commit` runs lint-staged, `pre-push` runs
`npm run check-all` — are a WISH, not a gate. They exist only after someone runs
`npx simple-git-hooks` once inside their own clone; a fresh checkout has none installed.
