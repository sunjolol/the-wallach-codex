# Big tweak list — MASTER reconciliation (Luneth, 2026-08-15 away-run)

_Luneth's original away-time message (session `local_acbaa2f2`, first user turn) reconstructed
byte-faithfully and reconciled item-by-item against what shipped in `12be0627` + `4087b16e`. This is
the authority the next-chunk handoff pointed at with its ⚠ "MORE REMAINS — reconcile item-by-item"
banner. Status marks: **✅ shipped+verified · 🟡 shipped, needs his LIVE sign-off · ⬜ not built ·
⚠ needs a decision.** Where I marked ✅ off the away-session's own report + the commit, that means
committed, not independently re-verified — flagged inline._

## Products tab (knowledge drawer)
| # | His ask | Status |
|---|---------|--------|
| P1 | Colored "add to regimen ›" button below "‹ all products" (colored by supplement-type), navigates to Regimen with the item **flashing** into the active stack | ✅ shipped+verified (`4087b16e`; full flow screenshot-tested) |

## Regimen tab
| # | His ask | Status |
|---|---------|--------|
| R1 | Coverage-square hover uses the slow native tooltip → use the **fast dotted-underline helper** | ✅ shipped+verified (`4087b16e`; instant `.gloss`/`[data-tip]` box) |
| R2 | "Steering goals · Default" → **"Your Goals"** | ✅ shipped (`12be0627`) |
| R3 | **ALL** micro-text unreadable — bump **0.6→0.7rem, weight 700** (he listed ~14 specific labels) | ✅ shipped (`12be0627`). VERIFY every label he named got bumped (he enumerated many) |
| R4 | Deck → **"Design your own protocols based on your goals + Import and export regimens for yourself or others"** | ✅ shipped (`12be0627`) |
| R5 | **Import & Export per slot** — export icon on each slot; import icon on **empty** slots; MAXIMUM bulletproof security (never run scripts/code) | ✅ shipped+verified (`4087b16e`; import proven bulletproof — no proto-pollution, provenance forced, capped 500, foreign/at-max refused) |

## Scanner
| # | His ask | Status |
|---|---------|--------|
| S1 | "did you mean X?" fires when X **is** the OCR'd word (e.g. Protein) | ✅ shipped (`4087b16e`; self-suggest early-return + scorer self-skip) |
| S2 | Deck "Scan → Confirm → Result…" → "Scan a label to see how your favorite supplements stack up… or type/paste ingredients to see if it's safe" | ✅ shipped+verified (idle screenshot) |
| S3 | Remove "The hero step · verdict withheld until confirmed" **and add a close box** to that step | 🟡 shipped, **confirm-state unverified** (needs a live OCR to reach) |
| S4 | Remove "amounts are the label's own, not a Wallach target" **AND** "Yours · user-provided" from the uploaded-photo box (redundant) | 🟡 shipped ("3 strings removed"), **confirm-state unverified** — verify BOTH gone |
| S5 | Remove "Default is image upload — OCR pre-fills the panel you confirm next." | ✅ shipped+verified (idle) |
| S6 | Same 0.6rem font bump on the Scanner tab | 🟡 shipped; idle+result verified, **confirm-state unverified** |
| S7 | **Sideways/upside-down labels not scanning** (rotation OCR) — example label attached | ✅ SHIPPED (batch ①, 2026-08-16). Offline brute-force 4-way orientation in state/ocr.ts — NO OSD model (offline-first). e2e-verified on all 3 test labels (90°/180°/upright); confirm-state screenshot signed off by Luneth. **Parser accuracy on 2-column labels → batch ②.** |
| S8 | **Paste-ingredients checker** — verdict on a food; smart ("gluten free oats" must not trip); single-ingredient works; separate on/without commas; only reject BAD, else SAVE; make clear scanner=supplement labels vs paste=food ingredients | ✅ shipped+verified (paste checker; wheat→REJECT, clean→NEUTRAL; guidance copy). Note: **"modified = auto-reject"** was ratified DOWN to a **serious flag** (§00.A — no direct Wallach "modified" claim; basis = his anti-processed stance; Luneth-ratified this session) |
| S9 | "WORTH IT" on Save makes no sense → **"Neutral"** | 🟡 shipped (chip → NEUTRAL; "Partial" → "Neutral" head). **Copy nuance:** the SAVE **headline** still reads "Worth considering" — confirm if that should change too |
| S10 | **Click the thumbnail** to see the full label image (verify OCR) | ✅ shipped+verified (2026-08-16; top thumb + sidebar photo → full-size `.vd-lightbox` scrim; Esc/scrim/× close; e2e + Luneth sign-off) |
| S11 | **Per-row (X) delete** for each supplement row; reduce name-input width **30%** to make room | ✅ shipped+verified (2026-08-16; `.ui-close--sm` ×, name col 1.4fr→1fr; `removedRows` Set so `readCorrectedLabel` drops it; live recount; e2e 7→6 rows + Luneth sign-off) |
| S12 | **Live-update "Possible OCR errors"** as the ingredients list is edited (remove options as fixed) | ✅ shipped+verified (2026-08-16; debounced 250ms refreshSuspects; dismiss records to `dismissed`; e2e 0→5 suspects + Luneth sign-off) |
| S13 | **Gluten source = AUTO REJECT no matter what** (Tangy Tangerine 2.5 + "wheat" wrongly showed SAVE) | ✅ shipped+verified (gluten → `hardRejectTerms` unconditional REJECT; wheat→REJECT confirmed) |
| S14 | **(added 2026-08-16, live review)** Plural-tolerant nutrient match (Total Sugar≡Sugars) + OCR-dict false-flag gap (74 common words) + nutrient-aware ingredient suggestions | ✅ shipped+verified (2026-08-16; `pluralEq`; +74 `fuzzyDict`; `findSuggestionCandidates` fuzzy∪known; e2e + Luneth sign-off) |
| S15 | **(live review 2026-08-16)** Live nutrient-row feedback — a corrected read must re-check + show a check immediately; also fix "Fat"->"Oat" mis-snap + recognize standard panel labels | ✅ shipped+verified (reevaluateNutrientRow on 150ms input; fat/saturated/trans -> fuzzy; +7 panel labels -> known; e2e + Luneth sign-off) |
| S16 | **(live review 2026-08-16)** Progress bar bounces back/forth on sideways/upside-down labels (glitchy) | ✅ shipped+verified (inOrientationSweep gates the OCR logger -> sweep runs indeterminate; e2e 0 resets / 1 fill on label-test-2; Luneth sign-off) |
| S17 | **(live review 2026-08-16)** Horizontal/linear panels (small tubs) parse almost nothing (label-test-2 = WF cheese only got Protein+Fiber) | ✅ shipped+verified (comma-segment parsing + header-noise guard; synthetic 10, label-test-2 2->4; ceiling: OCR-mangled amounts + %-DV-only minerals need Confirm correction; ingredient-block under-read now FIXED in S18) |
| S18 | **(live review 2026-08-16)** WF-cheese INGREDIENT block mis-read (grabbed the "DISTRIBUTED BY" text, no villains flagged) | ✅ shipped+verified (INGREDIENTS header line-anchored + distributor reject; headerless heuristic = comma-rich run after the last %DV, truncated at the distributor tail; label-test-2 now reads the real cheese ingredients + flags modified/processed; label-test.png no regression; Luneth sign-off) |

## Dark theme
| # | His ask | Status |
|---|---------|--------|
| D1 | Hover effects revert to bright (search-popup close button) | ✅ shipped+verified (hover → dark) |
| D2 | Search-popup box shadow inverts to a light glow (want faint dark glow) | ✅ shipped+verified |
| D3 | Scanner "aligns"/"out" pills too bright on dark → dark-friendly like the "best next moves" pills | 🟡 shipped (translucent color-mix tints), **needs a live scan to see the result-state pills** |
| D4 | Grid too distracting on Coverage in dark → remove grid entirely in dark | ✅ shipped+verified |
| D5 | Fully-covered cards still bright in dark → clear-but-dark covered styling | ✅ shipped+verified (dark-green plate) |

## Both themes
| # | His ask | Status |
|---|---------|--------|
| B1 | Shadows/glows/hovers scuffed when primary color changes (orange glow on a purple button) → must match the chosen primary across **ALL** tabs/instances | ✅ shipped+verified for the mapped set (~20 ember literals across 6 files + tokens; proven with amethyst purple button). VERIFY "all tabs/instances" — spot-check other accents/surfaces |

## Side panel
| # | His ask | Status |
|---|---------|--------|
| N1 | 1/2/3 do nothing; ensure **ALL** shortkeys work; "x1/x2/x3" is terrible labeling (S/K are fine) | ✅ shipped+verified (bare 1/2/3 wired + guard-tested; relabeled). VERIFY a full audit of **every** shortkey was done, not just 1/2/3 |

## ⚠ Flagged by him at session-end, NOT in the list above
- **"Removing the two boxes from the results I asked you to remove."** Ambiguous — needs his call:
  - (a) His morning 10-point review **#7**: the verdict card's two stat tiles ("form not on a label"
    + the redundant +N box) — that review said **REDESIGN into a full-width "N of 90" hero, NOT delete**.
  - (b) The two redundant strings in the confirm "uploaded photo" box (= S4 above) — already removed.
  His words ("the results") point at (a). → **RESOLVED 2026-08-16: (a) REDESIGN shipped** as ux-pass #7 — concept **B "Gap Arc"** (built A first, then Luneth re-ranked B>D>A>C and picked B); confirmed redesign, not delete; 4 mockups; live sign-off.

## Adjacent open threads (from his earlier 2026-08-15 reviews, not this away-list)
- **ux-pass #7** — result 2-box **redesign** → ✅ SHIPPED 2026-08-16 (concept **B "Gap Arc"** radial gauge — unlit arc = the gap; `.vd-side` → self-contained `.vd-cov-*` "N of 90" hero; mockup-first, 4 concepts; built A first (06c582e9) then Luneth re-ranked B>D>A>C and picked B; live sign-off; committed on master). Deferred: soften +0/zero-add · maybe drop the "+N reach the 90" fact (dupes rail legend) · card-wide width follow-up. **FOLLOW-ON (same session): scan hero reframed from coverage → the item's "hits N of 90" (≥3% of the Wallach target) + Copper→"Pepper" parse fix; the "0 reach the 90" concern resolved (pumpkin → "delivers 6, 2 strongly"). See build-log 2026-08-16 23:54.**
- **ux-pass #9** — goal-picker/veil (C task): veil everywhere, veil close ×, hide "I'm just browsing"
  for an existing profile, close orange→green.
- **A-sweep** — `.ui-close` onto every remaining × (goal chips, veil, knowledge drawers).
- **Dead-CSS** — `.rl-dose*`/`.ck-addcard*`/`.ck-scan*` (VERIFY vs the `938a407c` purge).
- **scanner-r2 R2-6 WS2** — shared `core/escape.ts` + single-source gate — PARKED by Luneth.

## Parked (raise only after the list closes — his timing instruction)
- Two deferred regimen findings: `addVaultProduct` dedup duplication; unstyled `.ck-undo`.

---
_Reconciled by Claude 2026-08-16 from the `local_acbaa2f2` transcript. Marks with 🟡/⬜/⚠ are the live
work. Update this file as items close — do not let it drift._
