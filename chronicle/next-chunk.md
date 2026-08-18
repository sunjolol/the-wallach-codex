# ★★★ NEXT SESSION — READ THIS FIRST.

**Next task, agreed with Luneth: GOALS EXPANSION, together.** Everything else from the big
2026-08-17 note-batch run is done, reviewed, signed off, and **pushed** — local == origin/master.

## ▶ START HERE — GOALS EXPANSION (together)
`chronicle/proposals/goals-expansion-proposal.md`. Luneth chose propose-first; the proposal is a
grounded, **build-verified** list of **+27 goals** (all derive non-empty members — replayed the real
`coverage_layout_derive` over 2162 sealed claims; 12-category spine) + a personalization brainstorm +
the 5-at-once cap decision. **Do it together** (his words). On approval: paste chosen
`{id,name,conditions[]}` into `dashboard/assets/data/coverage-layout-skeleton.json`, re-run the
derive/build, confirm 92/92 + the two goal gates (`goal_members_actionable`,
`pdm_group_goals_wallach_sourced`), screenshot the picker. §00.A: members auto-derive — adding a goal
adds curation, not a Wallach number.

## ✅ DONE + SIGNED OFF (2026-08-17 → 2026-08-18, PUSHED)
- **ORAC 01-06 redesign PORTED live** — demo `temporary/demos/orac-redesign-v2.html` §01-06 on the
  live tab; **07/08/09 byte-untouched**. Interactive mirror scrubber (01) + league FIELD (06: dots on
  a log/linear axis, per-family lanes, target line, hover/pin tooltip, legend filter). §00.A held (all
  numbers project from `oracData()`/`oracFoodsData()`; field value = `Number(value_display)` reformat;
  positions baked at render). Interactivity progressive via `knowledge.ts mount()` delegation. Luneth's
  on-reload review fixes all in: target-line knockout on `.kd-orac-top` (+ Berries label hidden), the
  `--p0..--p4` ramp now accent-derived (chain + slider rail + mirror fill follow the accent),
  less-flat + darker-on-dark mirror fill. Screenshot-verified light+dark, ember+amethyst. SIGNED OFF.
- **Note-batch (10 fixes):** empty-slot click-create + delete hover; Chakra-Petch nav + twinned
  Add-to-regimen; family-coloured glosses; fixed `--fam-vita` (accent stops recolouring categories) +
  detail category pins; NOT-COVERED follows accent; dark light-boxes (98% Colloidal, Absorption
  115M/75%/twist + fortress `--frt-*`, ORAC §08); button sizes 0.7rem; omega/amino back-hover wash;
  claim left stripe 50% dark; Absorption pull-stat accent subtitle.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- **Primary-button-label pass: SETTLED, good as is** — do NOT re-raise.
- `chronicle/proposals/orac-redesign-port-spec.md` is HISTORICAL (the port shipped + was reviewed).
- ORAC minor leftovers (Luneth's call, none blocking): two orphaned copy keys
  `kd_orac_dec_age_prefix`/`kd_orac_dec_lbl`; the hero (01) kept as the existing live markup (already
  matched the demo, no clip).

## GOTCHAS
- **ORAC interactivity** is delegated from `knowledge.ts mount()`; the field/scrubber render
  STATIC-correct with zero JS. Any ORAC number MUST come from `oracData()`/`oracFoodsData()` (§00.A).
  The accent-accumulation ramp `--p0..--p4` = `color-mix(--ds-accent-hot N%, #fff)`; the mirror fill +
  chain + slider rail all read it. Dark ORAC lives in theme.css block **(L)**.
- **Per-file endings**: `knowledge-orac.ts`, `view-copy.json`, `drawer-orac.css` are CRLF-on-disk /
  LF-in-git (git normalises on add; status stays clean). `gloss-tooltip.ts`, `welcome.ts`,
  `scanner.ts`, `workspace-scanner.css` etc. CRLF. `knowledge-foods.ts`, most `styles/*.css`,
  chronicle `.md`, theme.css LF. `safe_write check` FIRST.
- **Headless screenshots WORK**: Puppeteer (`node_modules/puppeteer`), file:// +
  `--allow-file-access-from-files`, seed `wallachUserProfile_v1={name,browsing:false,chosenAt,theme,accent}`,
  click `[data-rail-nav="knowledge"]` then `.kd-knh__tab[data-kd-tab="<tab>"]`. Harnesses in the scratchpad.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which candidate to resume**
(goals-together is the agreed next) — never a flair-only boot. If a new invariant red appears, that is
the only response.
