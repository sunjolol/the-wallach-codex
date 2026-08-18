# ★★★ NEXT SESSION — READ THIS FIRST.

**FINAL STRETCH — 3 TASKS LEFT before the app is FINISHED.** Luneth will name and explain the three
remaining tasks at the START of the next session. Until he does: **boot, report the board, and WAIT.**
Do NOT assume, propose, or start a task — the three are HIS to define. The "context threads" further
down are my prior notes, **NOT confirmed as the three**. Everything through 2026-08-18 is shipped,
reviewed, signed off, and **pushed** — local == origin/master, 92/92 green.

## ⏳ THE 3 REMAINING TASKS — Luneth defines them next session
Unknown until he explains them. When he does: capture the three HERE (overwrite this section), then
work them ONE AT A TIME to the gold-standard + round-close bar (build 0 → 92/92 → touched-surface render
probe → screenshot for his eyes → build-log + Creator's Log → rebuild → commit + push). The app is
otherwise complete — treat these as finishing work, measured and reviewed, not a place to invent scope.

## ✅ JUST SHIPPED — GOALS EXPANSION (2026-08-17, PUSHED, commit 96768d94)
The arrival-veil goal picker grew **14 → 31 goals** in **6 compact categories**, curated end-to-end
with Luneth (+2 new: `nerves-neuro` "Nerves, Seizures, MS & ALS" and `cancer-support`; the two colliding
heart goals unified into one **"Heart health"**). Layout: category label is an inline
`<span class="wc__goal-cat">` on the same flex-wrap row as its chips (no header line) + a density pass →
**measured 813px at 1920×1080**, under Luneth's **850px / no-scroll budget**. MAX_GOALS stays **5** (more
pick-hues = chaotic field gradients; regimens cover more). §00.A held — members auto-derive; the goal
SET is curation. 92/92, render probe 31 checks, screenshots signed off. Proposal file now HISTORICAL.

## (CONTEXT ONLY — my prior threads, NOT the 3 unless Luneth says so)
- **Symptom-first entry + life-stage presets** (personalization glue): start from "what's bothering
  you?" (164 catalog symptoms → conditions → the SAME goal members, no new data). Where the DEFERRED
  goal-enrichment merges finally pay off — measured: most enrichment adds NO new member nutrient until
  symptom→goal matching exists (mouth/oral +8, kidney +3; blood-sugar cluster +1 only, left out). Enrich
  WHEN building this.
- **Dashboard mining** — Luneth's own stated plan: work through the 936-claim
  `claim-ruling-dashboard-final.html` (576 introduce / 300 reject / 60 merge; priority themes
  chronic-fatigue 86, eye-health 31, seizures 24). Corpus seal + per-claim review apply.
- **Category reshuffle** (cheap): "Reproductive & whole-body" is the loosest of the 6 buckets. One-line
  `category` edit per goal in the skeleton → rebuild.

## ✅ DONE + SIGNED OFF (2026-08-17 → 2026-08-18, PUSHED)
- **ORAC 01-06 redesign PORTED live** — demo `temporary/demos/orac-redesign-v2.html` §01-06 on the
  live tab; **07/08/09 byte-untouched**. Interactive mirror scrubber (01) + league FIELD (06). §00.A held
  (numbers project from `oracData()`/`oracFoodsData()`). Review fixes in: target-line knockout on
  `.kd-orac-top` (+ Berries label hidden), `--p0..--p4` accent-derived, darker-on-dark mirror fill.
  Screenshot-verified light+dark, ember+amethyst. SIGNED OFF.
- **Note-batch (10 fixes):** empty-slot click-create + delete hover; Chakra-Petch nav + twinned
  Add-to-regimen; family-coloured glosses; fixed `--fam-vita` (accent stops recolouring categories) +
  detail category pins; NOT-COVERED follows accent; dark light-boxes (98% Colloidal, Absorption
  115M/75%/twist + fortress `--frt-*`, ORAC §08); button sizes 0.7rem; omega/amino back-hover wash;
  claim left stripe 50% dark; Absorption pull-stat accent subtitle.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- **Goal cap = 5, SETTLED** (palette length in `core/goal-display.ts` IS the cap) — do NOT re-raise.
- **Primary-button-label pass: SETTLED, good as is** — do NOT re-raise.
- `chronicle/proposals/orac-redesign-port-spec.md` + `goals-expansion-proposal.md` are HISTORICAL (shipped).
- ORAC minor leftovers (Luneth's call, none blocking): two orphaned copy keys
  `kd_orac_dec_age_prefix`/`kd_orac_dec_lbl`; the hero (01) kept as the existing live markup.

## GOTCHAS
- **Goal picker** (`views/welcome.ts`): goals render GROUPED by `category` (first-seen order) with the
  label an inline `<span class="wc__goal-cat">` flowing in the same `.wc__goal-group` flex-wrap row as its
  chips — no `.wc__goal-row` wrapper. `category` lives on each goal in `coverage-layout-skeleton.json`
  (optional in `LayoutGoalSchema`, copied through by the derive). Height budget **≤850px @ 1920×1080** (no
  scroll) — re-measure with the scratchpad Puppeteer harness if you touch it. MAX_GOALS + the pick-order
  hues both live in `core/goal-display.ts` (palette length == cap).
- **ORAC interactivity** is delegated from `knowledge.ts mount()`; field/scrubber render STATIC-correct
  with zero JS. Any ORAC number MUST come from `oracData()`/`oracFoodsData()` (§00.A). Ramp `--p0..--p4`
  = `color-mix(--ds-accent-hot N%, #fff)`. Dark ORAC lives in theme.css block **(L)**.
- **Per-file endings**: `welcome.ts`, `coverage-layout.ts`, `coverage-layout-skeleton.json`,
  `knowledge-orac.ts`, `view-copy.json`, `drawer-orac.css`, `scanner.ts` etc. are CRLF-on-disk /
  LF-in-git (git normalises on add; status stays clean). `workspace-coverage.css`, `knowledge-foods.ts`,
  most `styles/*.css`, `theme.css`, chronicle `.md` are LF. `safe_write check` FIRST, ALWAYS.
- **Headless screenshots WORK**: Puppeteer (`node_modules/puppeteer`), file:// +
  `--allow-file-access-from-files`. The arrival veil (`.wc-veil`) mounts on a fresh (no-profile) load;
  measure `.wc` scrollHeight for the picker height. The IN-APP browser pane renders file:// as a STATIC
  data: snapshot (no JS/CSS) and blocks localhost — use Puppeteer, or real Chrome if connected.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report the board, then **WAIT for Luneth to
explain the 3 remaining tasks** — do NOT resume a context thread or prescribe scope. If a new invariant
red appears, that is the only response.
