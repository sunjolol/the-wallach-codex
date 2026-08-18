# ★★★ NEXT SESSION — READ THIS FIRST.

**Big note-batch run (2026-08-17 → 00:01 2026-08-18).** Luneth left a written list, it was
worked while he was out, then he reviewed and greenlit the ORAC port. **10 fixes + the ORAC
01-06 redesign PORT shipped across 8 commits. Board 92/92 throughout. eden/ untouched.**

**⚠ LOCAL AHEAD OF ORIGIN by 8 commits — nothing pushed (his call).** `git log origin/master..HEAD`.

**Visual sign-off status:** the ORAC port + Absorption + omega/amino + claim-stripe fixes WERE
headless-screenshotted (Puppeteer, light+dark) and sent to Luneth; his final eyes on a real
reload are still the gate. The earlier 6 fixes (see below) were board-verified but NOT
screenshotted — worth a glance too.

## ▶ START HERE
1. **GOALS EXPANSION — TOGETHER (his explicit next task).** Proposal ready +
   build-verified: `chronicle/proposals/goals-expansion-proposal.md` (+27 goals, all derive
   non-empty members via a replay of the real derive over 2162 claims; 12-category spine;
   personalization brainstorm; the 5-at-once cap decision). On approval: paste chosen
   `{id,name,conditions[]}` into `coverage-layout-skeleton.json`, re-derive, confirm 92/92 +
   the 2 goal gates, screenshot the picker.
2. His reload/eyes on the ORAC tab + the day's fixes (final visual gate).

## ✅ DONE THIS RUN
**ORAC 01-06 redesign PORTED live** (`6f5e0214`): demo `temporary/demos/orac-redesign-v2.html`
sections 01-06 on the live tab; 07/08/09 byte-untouched. New interactive mirror scrubber (01) +
league FIELD (06: dots on a log/linear axis, per-family lanes, target line, hover/pin tooltip,
legend filter). §00.A held — every number a projection from oracData()/oracFoodsData(); field
value = Number(value_display) reformat, positions baked at render; interactivity progressive via
`knowledge.ts mount()` delegation (`oracScrubInput`/`oracFieldClick`/`Hover`/`Out`). All 4 fixes
in (sec-num no-clip, spreadLane() dot spacing, 03 green→accent, nut→caramel + field-only
`--of-spice`). Dark block (L). Two orphaned copy keys noted (`kd_orac_dec_age_prefix`,
`kd_orac_dec_lbl`) — harmless, deletable. Verified headless both themes.

**Review fixes** (`fae729b2`): back+add buttons 0.7rem (add wt 600); omega/amino dark detail
`--ds-accent` #fff-mix → solid `#7cc24e`/`#a878e6` (fixed the white-purple back-hover wash);
claim left stripe 28%→50% dark (J10). **Absorption accent subtitle** (`27140ee1`): `.ds-pull-stat`
dark island pinned `--ds-accent-soft` to a solid light per-accent tint (was 34%-transparent = dim).

**Earlier batch (evening, `f7e698e2`..`cd4357de`):** empty-slot click-to-create + delete hover;
Chakra-Petch nav + twinned Add-to-regimen; family-coloured dotted-underline glosses; vitamins get
fixed `--fam-vita` (accent stops recolouring categories) + detail-screen category pins;
NOT-COVERED tick follows accent; dark light-boxes (98% Colloidal, Absorption 115M/75%/twist +
fortress `--frt-*`, ORAC §08).

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- **Primary-button-label pass: SETTLED, good as is** — do NOT re-raise.
- `chronicle/proposals/orac-redesign-port-spec.md` is now HISTORICAL (the port shipped).

## GOTCHAS
- **ORAC interactivity** is delegated from `knowledge.ts mount()`; the field/scrubber render
  STATIC-correct with zero JS (positions + tooltip data baked at render). Any ORAC number MUST
  come from `oracData()`/`oracFoodsData()` — never a literal (§00.A). Field value parses
  `value_display`.
- **Per-file endings**: `knowledge-orac.ts` + `view-copy.json` + `drawer-orac.css` render/round-trip
  as CRLF-on-disk / LF-in-git (git normalises on add; `git status` stays clean). `gloss-tooltip.ts`,
  `welcome.ts`, `scanner.ts` etc. are CRLF. `knowledge-foods.ts` is LF. `safe_write check` FIRST.
- **theme.css** dark blocks now run through (L); block (K) has the missed-dark-box fixes incl. the
  `.ds-pull-stat` island. To beat the drawers accent-deep `:is()` (1,4,0) a category rule needs (1,5,0).
- **Headless screenshots WORK** here: Puppeteer (`node_modules/puppeteer`), file:// +
  `--allow-file-access-from-files`, seed `wallachUserProfile_v1={name,browsing:false,chosenAt,theme,accent}`,
  click `[data-rail-nav="knowledge"]` then `.kd-knh__tab[data-kd-tab="<tab>"]`. Harnesses in scratchpad.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which candidate to resume**
(goals-together is the natural next) — never a flair-only boot. If a new invariant red appears, that
is the only response.
