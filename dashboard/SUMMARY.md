# Dashboard v3.27 — Summary

_Round 161 sealing pass · 2026-06-21 · 59/60 invariants passing · zero external runtime resources_

This document is the single-page orientation for the v3.27 shipping system. For deeper architectural detail see `ARCHITECTURE.md`. For round-by-round history see `../chronicle/versions/v3.27-2026-06-21-total-dashboard-overhaul.md`.

---

## What ships

A self-contained personal health dashboard for the Wallach framework. **One HTML file + ~22MB vendored Tesseract + the design-system / data / source assets. Opens in any browser from `file://`. Works offline. No internet required ever after one-time vendor setup.**

Six surfaces:

| Surface | Role | Rail key |
|---------|------|----------|
| **Coverage workspace** | Periodic table of 92 essentials · live coverage from active regimen · per-tile detail flyout with Wallach stance + citation + covering products | ⌘1 |
| **Regimen workspace** | 5 save-slot cartridges · active-slot item editor with dose-block UI · recommendations + wishlist rail · cart actions (save/duplicate/import/export/vault) | ⌘2 |
| **Scanner workspace** | Drop / paste / upload a supplement label → Tesseract OCR → Eden grammar parse → vault lookup → Wallach-alignment verdict (ADD / SAVE / REJECT) · scan history rail | ⌘3 |
| **Knowledge drawer** | 4 tabs (Corpus · Essentials · Products · Doctrine) · live search filter · sealed-source corpus | K |
| **Journey drawer** | 4 tabs (Timeline · Goals · Check-ins · Milestones) · inline LOG EVENT form persisting to LS | J |
| **Command Palette ⌘K** | Centered modal · 3 result modes (JUMP TO / LOOKUP / ASK WALLACH) · stopwords-filtered fuzzy match · keyboard-first navigation | ⌘K |

---

## File layout

```
dashboard/
├── dashboard.html              ← slim shell (2.5MB) · single source of truth
├── ARCHITECTURE.md             ← module graph + chokepoint discipline + build doc
├── SUMMARY.md                  ← THIS FILE — one-page orientation
├── README.md                   ← legacy doc · merges into ARCHITECTURE.md in a future round
├── package.json                ← TS + esbuild devDeps (npm install once)
├── tsconfig.json               ← strict-mode TypeScript config
│
├── assets/
│   ├── styles/
│   │   ├── design-system.css           ← SEALED · golden hash cdf0ebd4… · user-only-writer
│   │   ├── design-system.golden.sha256 ← hash anchor for integrity checking
│   │   ├── dashboard.css               ← app-shell layout (grid · scrollbar · animations)
│   │   └── legacy-dashboard.css        ← parked legacy teal CSS · shrinks per future round
│   │
│   ├── fonts/                  ← 5 in-housed font families (TTF, SIL OFL 1.1)
│   ├── data/                   ← 8 JSON + 5 markdown data files (extracted from legacy R1·A)
│   │
│   ├── js/
│   │   ├── dist/main.js                ← RUNTIME CANONICAL TRUTH · 210KB hand-bundled IIFE
│   │   ├── legacy-dashboard.js         ← 489KB parked legacy · §31 chokepoints + OCR pipeline + verdict scoring
│   │   └── src/                        ← TS modules · partial R2/R3 impls + scaffolds (full sync pending)
│   │       ├── main.ts                 — entry
│   │       ├── core/{storage,events,eden,source-rule}.ts
│   │       ├── state/{regimen,coverage,scanner,goals,journey}.ts
│   │       └── views/{coverage,regimen,scanner,knowledge,journey,palette}.ts
│   │
│   └── vendor/tesseract/       ← 22MB vendored OCR engine + eng.traineddata
│
└── components/                 ← v3 mockup HTML files · design-locked references
```

---

## Three things to know if you're new to this codebase

**1. `dist/main.js` is the canonical runtime truth.** The `.ts` source files in `src/` are partial implementations — Round 2 (Coverage) and Round 3 (Regimen state chokepoints) are fully in TS source, but Round 4 (Scanner), Round 5 (Knowledge/Journey/Palette), and the entire polish pass were hand-bundled directly into `dist/main.js`. A future round syncs `src/` to match. Until then: **edit `dist/main.js` for behavior changes**, treat `src/` as partial scaffolds.

**2. §31 chokepoint discipline is now architectural.** Every regimen LS mutation flows through one of 5 named helpers (`persistRegimen`, `saveRgOverride`, `saveRgManual`, `saveRgRemoved`, `saveRgUserGoals`). These live in `state/regimen.ts` and are exposed via `window.*` at boot. The bridge installation overwrites legacy IIFE-local definitions for cross-IIFE callers, while bare-name calls inside the legacy IIFE still hit the local defs (intentional — "re-theme don't rewrite logic"). The 5 chokepoints emit typed `regimen:changed` events; subscribers in `core/events` cascade re-renders.

**3. Tesseract.js is in-housed.** `tools/vendor-tesseract.js` is a one-shot Node script that downloads ~22MB of Tesseract files into `assets/vendor/tesseract/`. After running it once (`node tools/vendor-tesseract.js`), the dashboard works fully offline — no CDN calls, no internet required. `legacy-dashboard.js`'s `loadTesseract` + `runOcr` point at the local vendor directory. CSP allows `worker-src 'self' blob:` (Tesseract worker via blob URL) + `'wasm-unsafe-eval'` (WebAssembly.instantiate).

---

## How to run

**Just open `dashboard.html` in any browser.** That's it. The dashboard is self-contained.

If you want to edit `.ts` source and rebuild:
```bash
cd dashboard
npm install                      # one-time, ~5MB devDeps
bash ../tools/build-dashboard.sh # tsc --noEmit + esbuild bundle → dist/main.js
```

If you don't already have the Tesseract vendor files (first time only):
```bash
node tools/vendor-tesseract.js   # one-shot, ~22MB download
```

---

## Doctrinal anchors

- **Source-rule cornerstone** — every numeric claim cites a Wallach allowlist primary. Enforced by `tools/invariants.py` `check_source_rule`. The allowlist: `dddl` (Dead Doctors Don't Lie), `rbs` (Rare Earths: Forbidden Cures), `eps` (Epigenetics), `ygy` (YGY Product Compendium), `wallach-lecture`.
- **§17 Edit-tool ban** — Edit tool banned for memory/, knowledge/, chronicle/, tools/, dashboard/, schemas/. Use `tools/safe_write.py` for surgical edits to those surfaces. Silent-truncation pattern (Rounds 22/41/43/54/56/71b/72/73) taught us this.
- **§31 chokepoint discipline** — see "Three things to know" above. Cross-surface state sync via typed events.
- **§32 whack-a-mole trigger** — when 3+ consecutive fixes to the same surface don't land cleanly, STOP and consider a rebuild instead of more patches.
- **Eden sealed-canonical** — sealed canonical files (design-system.css, Eden corpus) carry SHA-256 hash anchors. Drift detection at startup. Agent reads freely, never writes after seal.
- **No external runtime resources** — every font, asset, and library is local. Tesseract was the last external; in-housed in this round.
- **4-year-portability promise** — open `dashboard.html` 4 years from now and it still works exactly as today.

---

## Polish++ deferred items

Things that work but could be better. Future rounds:

- **TS source sync** — bring `src/*.ts` fully in line with current `dist/main.js` behavior so `npm run build` reproduces the shipping bundle
- **Ask Wallach TF-IDF** — Command Palette's BETA section currently shows a scaffold message; future round builds the local-corpus TF-IDF index
- **Recommendations + Wishlist rail** in Regimen workspace — placeholders today; will pull from legacy goal-driven engine
- **Scan history row click → re-open scan in stage** — logs to console today
- **Goal-edit modal** in Journey drawer — read-only today
- **Milestone trigger logic** — currently shows hardcoded demo milestones; real triggers based on doctrine-met invariants
- **Drag-and-drop on Scanner drop zone** — paste works; drag doesn't due to `<label>` wrap intercepting drag events
- **Per-tile dedup tightening** in Scanner parsed list — Zinc + Copper occasionally appear twice
- **Product name extraction** — `parseOcrText` falls back to "POWDER" when the OCR'd region lacks a clear brand line

---

## Invariant scoreboard

**59/60 passing.** The one remaining failure is `tacitus_rest_day_observed` — a warning-severity historical observation (writes happened during a defined rest-day window yesterday; can't be un-failed retroactively). Three sealing-pass changes that brought us here:

- `feature_flags_present` — repaired silent §17 truncation in `tacitus/feature-flags.json` (the file ended mid-key; reconstructed the missing `design_system_enforcement` block)
- `brain_version_sync` — added v3.27 entry to `chronicle/CHANGELOG.md` + `chronicle/versions/`
- `dashboard_integrity` — saga.md re-embed with proper `</script>` escaping; `tools/dashboard_integrity.py` updated to reflect R1·B layout (creators-log-handler now in legacy-dashboard.js, localStorage migration framework moved with it)
- `design_system_hash_integrity` + `design_system_write_protection` — golden hash `cdf0ebd4d7e55305…` sealed; both invariants promoted from warning → critical severity
- `no_external_style_resources` — promoted to critical (was warning); all 6 surfaces ship without external resources, Tesseract in-housed

---

## The promise this version honors

> Open `dashboard.html` in any browser, online or offline, in 2030 — it should look and behave exactly as it does today.

Zero CDN dependencies. All 5 fonts local. Tesseract.js + 12MB English language model local. Modular architecture with strict types and sealed canonical files. Hash anchors detect drift. Build pipeline is optional (the `dist/` artifact is the runtime contract). Every chokepoint has an invariant guard.
