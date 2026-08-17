# ★★★ NEXT SESSION — READ THIS FIRST.

**Autonomous note-batch run (2026-08-17 evening).** Luneth left a written list of notes and stepped
out; I worked them while he was gone. **6 UI/theme fixes shipped as 5 commits + this proposals/handoff
commit. Board 92/92 throughout. eden/ untouched.** Two big items were deliberately NOT blind-shipped —
staged as reviewed proposals in `chronicle/proposals/` instead.

**⚠ NOT VISUALLY VERIFIED.** Every fix is board-green and driven off exact recon, but the browser pane
was not driven this session — NONE of the 6 were screenshot-verified. A green board is not a visual
check. **First order of business: his eyes on all six** (and a screenshot pass if anything looks off).

**⚠ LOCAL AHEAD OF ORIGIN.** These commits are LOCAL ONLY (no push, his call). `git log origin/master..HEAD`.

## ✅ DONE (2026-08-17 evening) — Luneth's note list
- **Empty save-slots + delete hover** (`f7e698e2`): click anywhere on an empty `.ck-slot--empty` creates a save (Import branch runs first + returns, so Import still opens the import box); `.rr-btn`/`.rr-btn--danger` got the missing :hover. regimen.ts + workspace-regimen.css.
- **Nav buttons + fonts + glosses** (`92786231`): `.kd-ep-back` + `.kd-crumbs` → Chakra Petch; `.kd-ep-add-regimen` reshaped to the back-button geometry but SOLID `var(--form)` fill; `.gloss` underline + `<body>`-parented tip now take the claim family colour (`var(--kd-ep-fam, …)` + a JS bridge in gloss-tooltip.ts), orange only where no family. drawer-knowledge.css + theme.css + gloss-tooltip.ts.
- **NOT COVERED follows accent** (`4d823c5b`): coverage gap tick + legend swatch `--ds-status-warn` → `var(--ds-accent-deep)` (muted, per-accent, in sync). workspace-coverage.css.
- **Category colour immutable** (`a5b55274`): the real bug — vitamins alone had no fixed token and rode `--ds-accent`. NEW `--fam-vita:#ff7e3c` (+ dark remap); repointed the two vitamin→accent rules (`:1979` sh-tile/legend, `:1317` pf-nrow); added `[data-category=vitamin/amino_acid/fatty_acid]` detail-accent blocks + dark twins (vitamin=exact ember → default look unchanged; amino/omega DERIVED from `--fam-*`). drawer-knowledge.css + theme.css. **Coverage BOARD paints by state not category — nothing there follows the accent bar the intentional hover glow; confirm that's what he meant by "coverage page".**
- **Dark light-boxes the sweep skipped** (`cd4357de`): theme.css block (K) — 98% Colloidal node fill, `.ds-pull-stat` island re-pin (115M/75%), `.sx-callout` (twist), ORAC §08 ×4; + fortress "same gut" figures parameterised (`--frt-*` on `.frt-cell`, knowledge-foods.ts SVG). theme.css + knowledge-foods.ts.

## ▶ START HERE — candidates (ask via AskUserQuestion)
1. **His visual review of the 6 fixes** (the real gate). Flagged risk items to eyeball first: the **fortress dark adaptation** (BLIND — `--frt-*` knobs on `.frt-cell` are the tuning surface) and the **amino/omega detail palettes** (derived via color-mix, may need tuning).
2. **Goals expansion** — `chronicle/proposals/goals-expansion-proposal.md`. He chose PROPOSE-FIRST. A grounded, build-verified list of **+27 goals** (all derive non-empty members — replayed the real derive over 2162 claims), by the 12 categories, + a personalization brainstorm + the 5-at-once cap decision. On his approval: paste into `coverage-layout-skeleton.json`, re-derive, confirm 92/92 + the 2 goal gates, screenshot the picker. §00.A: members auto-derive; adding a goal adds curation, not a number.
3. **ORAC 01–06 redesign port** — `chronicle/proposals/orac-redesign-port-spec.md`. The signed-off demo (`temporary/demos/orac-redesign-v2.html`) is the spec; executable capture with his 4 fixes (number clip, dot spacing, 03 green→accent, nut colours), the §00.A data-wiring (numbers from `oracFoodsData()`, bake positions at render), interactivity via mount() delegation, dark plan. NOT blind-shipped — it's a large interactive rebuild on the flagship tab needing a verification pass. Ready to execute on his go (or do it together). 07+ STAYS.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- **Primary-button-label pass: SETTLED 2026-08-17, good as is** (Luneth) — do NOT re-raise.

## GOTCHAS
- **Per-file endings**: still-CRLF this tree — `views/welcome.ts`, `views/scanner.ts`, `views/gloss-tooltip.ts` (CRLF! not on the old list), `state/scanner.ts`, `state/ocr.ts`, `styles/workspace-scanner.css`, `scanner-corpus-data.json`, `ocr-dict-data.json`. `views/knowledge-foods.ts` is LF. Other views + `styles/*.css` + chronicle `.md` are LF. `safe_write check` FIRST.
- **theme.css dark layer**: block (K) appended for the missed dark boxes; the vitamin/amino/fatty dark detail twins sit after the mineral one. To beat the drawers-block accent-deep `:is()` (specificity 1,4,0) a category rule needs (1,5,0). Never a `*/` in a comment (gated).
- **dist/main.js is committed with each TS batch; main.js.map is gitignored** (don't `git add` it).

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which candidate to resume** (his visual review of the 6 fixes is the natural first) — never a flair-only boot. If a new invariant red appears, that is the only response.
