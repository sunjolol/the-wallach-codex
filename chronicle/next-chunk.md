# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — CLOSED.** Authority was `chronicle/tweak-list-master-2026-08-15.md`; every item is now ✅ (see it for the ledger). Board **91/91.** eden/ untouched — no seal applied. Session closed **2026-08-17** after #9 shipped + pushed to origin/master.

## ✅ DONE (2026-08-17) — #9 goal-picker/veil, committed + pushed
- **Veil everywhere:** Regimen’s “＋ Add goal” now opens the SAME full arrival veil Coverage uses (fires `wallach:open-welcome`); the old inline `ck-goalmenu` dropdown is fully severed (renderGoalMenu fn + call + data-goal-pick handler + .ck-goalmenu CSS). Commit 1e657165.
- **Veil close ×** (`.ui-close.wc__x`): on reopen cancels (goals untouched), on first arrival records `{browsing:true}` so it never re-nags.
- **Hide “I’m just browsing” + name field on reopen** (existing profile → pure goal picker).
- **Close colour:** the × follows the THEME accent (`--ds-accent`, colour-picker-driven), NOT green. I first shipped GREEN; Luneth corrected it (green is only for the green-coded search surface). See [[close-x-follows-theme-accent]].
- **A-sweep:** every remaining ad-hoc × now uses the one `.ui-close` (goal-chip `.gchip__x` sized via `--uic-size:20px`, knowledge `.kd-knh__close`, profile `.pf-close`, scanner OCR-suspect `.vd-ocr__x`, recycle `.rc-pop__x`). The Ask-Wallach search close `.scr-nav--close` deliberately stays `--aw-green`.
- **Dead-CSS verify:** `.ck-addcard*`/`.ck-scan*` = zero refs (purged by `938a407c`); `.rl-dose*` is LIVE (the coverage dose stepper) — left as-is.
- **Deferred (Luneth left open):** on reopen the veil kicker/heading still read like first-time onboarding; a slightly wide gap where the name field used to sit; the goal-chip × (20px) is heavier than the old 12px text × — all left pending his call.

## ✅ ALSO DONE (2026-08-17) — the two deferred regimen findings, committed + pushed
- **Finding 1:** `coverage.ts::addVaultProduct` now delegates the §10 add-or-bump dedup to the shared `state/regimen.ts::addOrBumpRegimenItem` (was a duplicated rule); the freed-up dead `loadRgManual` export removed. Behaviour-identical; dedup + coverage probes green.
- **Finding 2:** the regimen refusal toast (`.ck-undo`, which had ZERO css → bare page text) is now a styled floating pill (`.ck-toast`, bottom-centre, `--ds-elev-3` + accent edge). Dead undo button/param removed; renamed `ck-undo`→`ck-toast` / `undoTimer`→`toastTimer`. Verified by a real import-invalid trigger.

## ▶ START HERE — the big list is CLOSED; ask which candidate to resume
No item is forced. Candidates:
1. **Profile feature build** — name/avatar/themes; the profile console already exists (avatars + theme picker + Cream/Charcoal). Scope what remains vs [[profile-feature-spec]].
2. **scanner-r2 R2-6 WS2** — shared `core/escape.ts` + single-source gate — PARKED by Luneth (raise only if he asks).

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.

## GOTCHAS
- **Per-file endings**: `views/welcome.ts`, `views/scanner.ts`, `state/scanner.ts`, `state/ocr.ts`, `styles/workspace-scanner.css`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; the other views + `styles/*.css` + chronicle `.md` are **LF**. `safe_write check` FIRST.
- **In-app file:// preview is a static snapshot** — no live clicks ([[in-app-preview-is-static-snapshot]]). Drive the real app headless: Puppeteer `--allow-file-access-from-files`; `require` puppeteer from the repo `node_modules` (scripts in scratchpad can’t resolve it otherwise); seed `localStorage.wallachUserProfile_v1={name,browsing:false,chosenAt}`. Both Coverage AND Regimen expose `[data-goal-add]` — scope selectors to `#workspace-regimen-mount`.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which candidate to resume** (the big list is closed) — never a flair-only boot. If a new invariant red appears, that is the only response.
