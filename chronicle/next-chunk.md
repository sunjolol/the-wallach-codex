# ★★★ NEXT SESSION — READ THIS FIRST.

**No forced task.** The big-tweak list (2026-08-15) is closed, the two deferred regimen findings are done, and the **Profile feature was audited + hardened + given a new avatar set + a systemic dark-theme pass** this session (all committed + pushed). Board **91/91.** eden/ untouched — no seal applied. Session closed **2026-08-17**.

## ✅ DONE (2026-08-17, profile + dark session) — committed + pushed to origin/master
- **Avatars replaced** — aura/gem/world → **Generic (1) / Men (12) / Women (12)** real portraits (25); old 32 files deleted; retired-id migration (degrades to the default initial, keeps name/theme); count derived; profile tiny-text 0.52→0.65rem.
- **Profile audit → 4 fixes** (from a 12-finding adversarial audit): modal focus a11y (focus-in / Tab-trap / restore-on-close); a11y labeling (tile names, aria-pressed on theme/accent/filter/avatar, live-region errors); import safety = **true-replace** restore + partial-import surfaced (#8 decided: replace, not merge).
- **Dark-theme pass** — a 6-agent sweep found 51 defects; fixed at the TOKEN root in theme.css (--ds-accent-wash/soft, --ds-status-*-soft, --ds-ok-wash, --ds-tech-wash → translucent tints) + mark-text / `.ui-close`-glow / `#fff`-hover / inverting-island overrides. Named surfaces verified live.

## ▶ START HERE — candidates (nothing forced; ask via AskUserQuestion)
1. **Scanner Confirm/Result in DARK** — token-fixed by the dark pass but not yet screenshot-verified (needs a scan flow; the [[in-app-preview-is-static-snapshot]] headless gotcha applies). Quick to verify; tweak if any pill/check/step-ring still reads off.
2. **Absorption + ORAC redesign** — Luneth said both are getting redesigned from earlier demos; their dark-theme issues were DEFERRED to that redesign (excluded from this pass).
3. **Low-severity dark nits** (optional, mostly already auto-fixed by the token remaps): input focus-ring hues, `.vd-cf__refzoom` badge, the `vd-pulse` keyframe warn-tint. Full 51-finding list: the **wmpaftluu** workflow output in this session’s transcript dir.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.

## GOTCHAS
- **Per-file endings**: `views/welcome.ts`, `views/scanner.ts`, `state/scanner.ts`, `state/ocr.ts`, `styles/workspace-scanner.css`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; other views + `styles/*.css` + chronicle `.md` are **LF**. `safe_write check` FIRST.
- **theme.css is the dark/appearance layer (NOT sealed).** Dark overrides go there via `:root[data-theme="dark"]`, placed AFTER the `[data-accent]` blocks (equal specificity → source order wins). Prefer remapping a wash/soft TOKEN once over per-surface rules; per-surface only for hardcoded literals (#fff, rgba cream) + inverting ink/paper islands. [[dark-theme-token-remaps]].
- **In-app file:// preview is a static snapshot** ([[in-app-preview-is-static-snapshot]]). Drive headless: Puppeteer `--allow-file-access-from-files`; require puppeteer from the repo `node_modules`; seed `localStorage.wallachUserProfile_v1={name,browsing:false,chosenAt[,theme:'dark']}`.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which candidate to resume** (nothing forced) — never a flair-only boot. If a new invariant red appears, that is the only response.
