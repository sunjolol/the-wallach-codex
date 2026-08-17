# ★★★ NEXT SESSION — READ THIS FIRST.

**No forced task.** The low-severity dark nits are closed (2026-08-17, second session that day). Board **92/92** — a gate was added this session (see below). eden/ untouched — no seal applied. **Committed to master as `87f63219` but NOT pushed** (Luneth's call) — run `git push origin master` when he says.

## ✅ DONE (2026-08-17, dark-nits + gate session) — committed to master, NOT pushed
- **4 low-severity dark fixes** (of the 9 low findings; the other 5 were already auto-fixed by the prior dark pass's (A) token remaps / (C)(G) overrides — confirmed via `getComputedStyle`, not re-touched):
  - `.vd-cf__refzoom` (scanner ref-image zoom badge) — flipped tokens inverted it over a label photo; now theme-independent fixed literals `rgba(18,14,10,.78)` + `#f3ead7` (workspace-scanner.css, mirrors `.vd-lightbox`).
  - theme.css **(H) block** — dark text lifts: `.rr-btn--danger` 3.4→5.9:1, `:is(.rr-results__meta,.rec__val)` 4.1→7.2:1, `.rr-scan__link` accent-deep→accent-bright 3.9→8.9:1.
- **NEW GATE `css_comment_no_premature_close`** (invariants.py, structural/critical) + negative test `tools/test_css_comment_no_premature_close.py`. A `*/` in a theme.css comment closed it early and silently dropped `.rr-btn--danger` past a GREEN board; now caught board-wide. **CLAUDE.md gate count 91→92** (a boot file changed — external stays 23). [[css-comment-star-slash-drops-rule]].

## ▶ START HERE — candidates (nothing forced; ask via AskUserQuestion)
1. **Push** — commit `87f63219` is local-only; offer `git push origin master`.
2. **Scanner Confirm/Result in DARK** — token-fixed by the dark pass but STILL not screenshot-verified live (needs a real scan flow; [[in-app-preview-is-static-snapshot]]). NOTE: the in-app browser pane was not displayable this session and file:// pages render as non-screenshottable `data:` snapshots — drive headless (Puppeteer), or have Luneth open the app. For CSS colour introspection, inline all sheets into one file and read `getComputedStyle` (the A/B harness in gitignored `temporary/dark-nits-selfcontained.html` is the pattern).
3. **Absorption + ORAC redesign** — both slated for redesign from earlier demos; their dark issues were DEFERRED to that redesign (excluded from the dark pass).

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.

## GOTCHAS
- **Per-file endings**: `views/welcome.ts`, `views/scanner.ts`, `state/scanner.ts`, `state/ocr.ts`, `styles/workspace-scanner.css`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; other views + `styles/*.css` (incl. theme.css) + chronicle `.md` are **LF**. `safe_write check` FIRST.
- **theme.css is the dark/appearance layer (NOT sealed).** Dark overrides go there via `:root[data-theme="dark"]`, placed AFTER the `[data-accent]` blocks (equal specificity → source order wins). Prefer remapping a wash/soft TOKEN once over per-surface rules; per-surface only for hardcoded literals (#fff, rgba cream) + inverting ink/paper islands. Never put a `*/` in a comment (e.g. a `--x-*/` glob) — it drops the next rule; now gated. [[dark-theme-token-remaps]].
- **In-app file:// preview is a static snapshot** ([[in-app-preview-is-static-snapshot]]). Drive headless: Puppeteer `--allow-file-access-from-files`; require puppeteer from the repo `node_modules`; seed `localStorage.wallachUserProfile_v1={name,browsing:false,chosenAt[,theme:'dark']}`.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which candidate to resume** (nothing forced) — never a flair-only boot. If a new invariant red appears, that is the only response.
