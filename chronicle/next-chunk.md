# ★★★ NEXT SESSION — READ THIS FIRST.

**No forced task.** Dark-theme polish on 2026-08-17 across three rounds: (1) low-severity nits + a CSS-comment gate, (2) a full **dark foreground-colour brightening sweep** + profile popup fixes, (3) **three dark FILL/hover control fixes** (this round). Board **92/92**. eden/ untouched. **All 4 dark commits PUSHED to origin/master** this round.

## ✅ DONE (2026-08-17)
- **Dark FILL/hover fixes** (`88acd1a3`, this round, PUSHED): three controls Luneth spotted were mis-using the foreground-only `--ds-accent-deep` token as a solid FILL (so it washed out in dark), plus a specificity collision on the delete button. theme.css block (J6/J7), all `:root[data-theme="dark"]`: `.pf-done` gradient deep end + `.rc-btn-restore:hover` bg → saturated `--ds-accent-hot`; `.vd-nrow__del.ui-close:hover` border → `color-mix(--ds-status-err 55%, --ds-ink)` (RED on every accent; two-class 0,5,0 beats the generic accent-close `:is(...,.ui-close:hover,...)` 0,4,0). Cream already hovered red (the accent-close rule is dark-only) → light/dark parity. Verified: 5-accent Puppeteer probe (ember/amethyst/teal/rose/slate), getComputedStyle + real hover, canvas-normalised → ALL PASS. [[dark-theme-token-remaps]] (the dual-use FILL trap), [[close-x-follows-theme-accent]].
- **Dark foreground sweep** (`f8652c5d`, PUSHED): every non-orange/yellow colour used as FOREGROUND (text/link/label/icon/border) brightened for dark; solid fills kept saturated. `--ds-accent-deep` (fg-only) remapped bright; facet/entity tokens brightened; bare `--ds-accent` fg (~110 selectors) routed to accent-deep; status/tech text → color-mix(token 62%, ink); hardcoded hexes brightened. Profile popup fixes. theme.css blocks (I)/(J1–J5).
- **Dark low-nits + gate** (`87f63219`, `db28cd68`, PUSHED): refzoom badge, 3 status-text lifts, + `css_comment_no_premature_close` gate.

## ▶ START HERE — candidates (nothing forced; ask via AskUserQuestion)
1. **ORAC + Absorption redesign** — both slated for redesign; their dark internals were EXCLUDED from the sweep (deferred to the redesign). When built, apply the same fg-brightening + fill-saturation method ([[dark-theme-token-remaps]]).
2. **Dark loose ends** (optional, deferred): primary-button LABEL colour on the darkest accents (amethyst/slate) is `--ds-paper-light` = dark-on-saturated (a FILL, borderline — leave or flip to a fixed light). Deep-drawer internals (essential/condition/product deep-dives, foods figures) got the sweep CSS but weren't each screenshot-verified — spot-check if a specific one is reported off. (The three controls fixed this round — Done button, Restore hover, delete-row hover — ARE verified across ember/amethyst/teal/rose/slate.)

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- Reusable dark-verify harnesses in gitignored `temporary/` (shoot_dark.js, probe_profile.js, scan_contrast.js) + the self-contained A/B harness. This round's probe (5-accent fill/hover check) is in the session scratchpad.

## GOTCHAS
- **Per-file endings**: `views/welcome.ts`, `views/scanner.ts`, `state/scanner.ts`, `state/ocr.ts`, `styles/workspace-scanner.css`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; other views + `styles/*.css` (incl. theme.css) + chronicle `.md` are **LF**. `safe_write check` FIRST.
- **theme.css is the dark/appearance layer (NOT sealed).** Dark overrides via `:root[data-theme="dark"]`, AFTER the `[data-accent]` blocks. Brighten a wash/soft/accent-deep TOKEN once; per-surface only for hardcoded literals, inverting islands, **dual-use FILLs** (accent-deep used as a fill → route to saturated `--ds-accent-hot`), and backgroundless-button UA #f0f0f0. Never a `*/` in a comment (gated). [[dark-theme-token-remaps]].
- **Verify dark headless** (pane won't display, file:// → data: snapshot): Puppeteer `--allow-file-access-from-files`, seed `wallachUserProfile_v1={name,browsing:false,chosenAt:'YYYY-MM-DD',theme:'dark',accent}` (chosenAt = ISO **day string**). getComputedStyle color-mix → `color(srgb 0..1)` floats, not rgb 0-255; hover/transition can serialise as `oklab(...)` — canvas-normalise (paint to a 1×1 canvas, read the pixel) before comparing colours. [[in-app-preview-is-static-snapshot]].

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which candidate to resume** (nothing forced) — never a flair-only boot. If a new invariant red appears, that is the only response.
