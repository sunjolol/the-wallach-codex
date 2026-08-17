# ★★★ NEXT SESSION — READ THIS FIRST.

**No forced task.** Two dark-theme sessions on 2026-08-17: (1) low-severity nits + a CSS-comment gate, (2) a full **dark foreground-colour brightening sweep** + profile popup fixes. Board **92/92**. eden/ untouched. **3 commits on master, NOT pushed** (`git push origin master` when Luneth says).

## ✅ DONE (2026-08-17) — committed to master, NOT pushed
- **Dark foreground sweep** (`f8652c5d`): every non-orange/yellow colour used as FOREGROUND (text/link/label/icon/border) brightened for dark so it reads on charcoal; solid fills kept saturated. Method: `--ds-accent-deep` (fg-only) remapped bright; facet/entity tokens brightened at token level; bare `--ds-accent` fg (~110 selectors, 3-agent map) routed to accent-deep; status/tech text → color-mix(token 62%, ink); hardcoded hexes (mineral-page override, vit-A, product `--form`) brightened. Profile: mono labels→0.65rem, `.pf-fchip` transparent (killed UA #f0f0f0), `.pf-modeb` theme-previews + accent ring, search icon→accent, monogram light. All in theme.css blocks (I)/(J1–J5). [[dark-theme-token-remaps]] now documents the fg-vs-fill method.
- **Dark low-nits + gate** (`87f63219`, `db28cd68`): refzoom badge, 3 status-text lifts, + `css_comment_no_premature_close` gate.

## ▶ START HERE — candidates (nothing forced; ask via AskUserQuestion)
1. **Push** — 3 commits are local-only; offer `git push origin master`.
2. **ORAC + Absorption redesign** — both slated for redesign; their dark internals were EXCLUDED from the sweep (deferred to the redesign). When built, apply the same fg-brightening method ([[dark-theme-token-remaps]]).
3. **Dark loose ends** (optional, deferred from the sweep): primary-button LABEL colour on the darkest accents (amethyst/slate) is `--ds-paper-light` = dark-on-saturated (a FILL, borderline — leave or flip to a fixed light). Deep-drawer internals (essential/condition/product deep-dives, foods figures) got the CSS but weren't each screenshot-verified — spot-check if a specific one is reported off. Verify the 4 untested accents (verdant/rose/gold/teal/slate); amethyst+sapphire were verified.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- Reusable dark-verify harnesses in gitignored `temporary/` (shoot_dark.js, probe_profile.js, scan_contrast.js) + the self-contained A/B harness.

## GOTCHAS
- **Per-file endings**: `views/welcome.ts`, `views/scanner.ts`, `state/scanner.ts`, `state/ocr.ts`, `styles/workspace-scanner.css`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; other views + `styles/*.css` (incl. theme.css) + chronicle `.md` are **LF**. `safe_write check` FIRST.
- **theme.css is the dark/appearance layer (NOT sealed).** Dark overrides via `:root[data-theme="dark"]`, AFTER the `[data-accent]` blocks. Brighten a wash/soft/accent-deep TOKEN once; only per-surface for hardcoded literals, inverting islands, dual-use fills, and backgroundless-button UA #f0f0f0. Never a `*/` in a comment (gated). [[dark-theme-token-remaps]].
- **Verify dark headless** (pane won't display, file:// → data: snapshot): Puppeteer `--allow-file-access-from-files`, seed `wallachUserProfile_v1={name,browsing:false,chosenAt:'YYYY-MM-DD',theme:'dark',accent}` (chosenAt = ISO **day string**). getComputedStyle color-mix → `color(srgb 0..1)` floats, not rgb 0-255 (parse accordingly). [[in-app-preview-is-static-snapshot]].

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which candidate to resume** (nothing forced) — never a flair-only boot. If a new invariant red appears, that is the only response.
