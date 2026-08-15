# Scanner — round-2 review (Luneth, 2026-08-15)

_The visual/QOL pass owed on his #1 feature. Luneth reviewed the shipped scanner
redesign and enumerated 8 issues (layout, flow, correctness, and one alarm about the
scoring result). This is the master list — execute all 8; do not drop one. Cadence:
auto on pure-logic/gate-verifiable fixes, STOP for his eyes on anything visual._

Four of the eight are diagnosis-first and are under a read-only investigation
(workflow `wf_1b852158-ee4`, threads: scoring / regimen-add / input-hardening /
rail-layout). Dispositions for those land once the diagnosis returns.

---

## The 8 items (his words, condensed) + status

| ID | Item | Kind | Status |
|----|------|------|--------|
| **R2-1** | Remove the rail footer note "Every capture is marked Yours — registered against the 90, never written into the sealed pillars." | copy/trivial | CLEAR — delete `.vd-rail__note` (scanner.ts renderRail ~530) |
| **R2-2** | On scroll the Recent box overlaps the Saved box above it; **and** the Recent captures box is not wide enough — it must match the Saved box's width. | layout | DIAGNOSING (rail-layout thread) — suspect shared `position:sticky` on `.rail-panel` + a width mismatch in shared coverage CSS |
| **R2-3** | The Saved-for-later box is scuffed: the × overlaps the design, and the × is too small / easy to miss. | layout | DIAGNOSING (rail-layout thread) — `.rl-row__x` position:absolute over row content |
| **R2-4** | **ALARM.** The scan result is incoherent: +1 of 90 added, yet 0 of 17 aligned. Scanned = **Tangy Tangerine 2.5** (flagship YGY multivitamin). If a top-of-the-line product still scores 0, the measurement is wrong — it will make it seem nothing is ever good enough. | correctness / §00.A | DIAGNOSING (scoring thread) — likely: alignment metric + coverage-delta + "already covered" mislabel all incoherent. Any fix to alignment/target numbers is §00.A — Wallach-sourced, never fabricated. |
| **R2-5** | You can't change the nutrient **amounts** (only the names). They're also too small / easy to miss. Add editable inputs for the amounts too. | feature + visual | CLEAR-ish — nutrientRow amounts are a display `<span>` (scanner.ts:195, 204); make them inputs and read them back in readCorrectedLabel. Visual sign-off needed. |
| **R2-6** | Character limits on ALL input boxes (reasonable, lean longer), esp. the name box. AND further harden so NO input-box attack (script/HTML injection) can happen at all — knows a maxlength isn't the real defense. Applies to every content box, not just the scanner. | security (app-wide) | DIAGNOSING (input-hardening thread) — audit every input surface, verify no raw user string reaches innerHTML, add maxlength + systemic escape. |
| **R2-7** | Adding a **second** item to the regimen (pulled from Saved) doesn't add — possibly because it's near-duplicate info (only the name differs). Bug; fix it. | correctness | DIAGNOSING (regimen-add thread) — adopt path `id: Date.now()` + possible dedup drop; cross-ref REG-03. |
| **R2-8** | No way back to the default scanner state when a Saved item is open — you're forced to Add/Save/Reject to close it. Add a "Clear"/"×" to close the re-opened item and return to idle. | flow + small visual | CLEAR-ish — add a clear/close control on the re-opened result → reset to idle (reuse the reject/`scanner:scan-cleared` reset). Visual sign-off needed. |

---

## Cross-references to the existing QOL ledger
- **R2-7** overlaps **REG-03** (dedup double-count) — same regimen-add code path; reconcile the two so the fix is coherent (add must succeed AND not double-count).
- **R2-6** is broader than any single ledger item — it's an app-wide input/XSS pass.
- **R2-4** may interact with `coverageDeltaForLabel` / `matchEssential` used elsewhere (Coverage, Regimen) — a fix there must not regress those surfaces.

## Locked so far
Nothing locked beyond his explicit asks. R2-1 is a straight delete. The rest await the
diagnosis before I propose exact fixes — then small batches with a board + his visual sign-off.

---

## Progress — 2026-08-15 session

- **R2-6 caps (WS1): SHIPPED.** `maxlength` on all 9 uncapped inputs (name 80 · nutrient 60 ·
  ingredients 4000 · searches 120 · add-product 80) + generous schema `.max()` backstop on the
  stored scan label (name 200 · brand 200 · nutrient 120 · ingredients 10000). Board 91/91, build+tsc clean.
- **R2-6 guard (WS2): PARKED** (Luneth: do the user-facing bugs first). Honest finding: the
  "red-board any unescaped `innerHTML`" gate is NOT reliably grep-able — these views interpolate
  `${renderChild(...)}` everywhere and grep can't tell a safe HTML-returning call from a raw user
  value without taint analysis; shipping it would false-alarm or give false confidence (§00.B forbids
  selling a WISH as a gate). The achievable, honest guard = consolidate the **17** `escHTML` copies
  into one `core/escape.ts` + a single-source gate (zero local redefinitions), with "escape at the
  sink" kept as a documented convention. Deferred as a tracked follow-up; the app is already XSS-safe today.
- **R2-4 (the alarm): SHIPPED (engine + display), AWAITING Luneth's visual sign-off.** Root cause was
  threefold: (1) `alignmentScore` reads a `form_alignment` field that lives ONLY on the Youngevity
  product DB — a photographed label never carries it — so alignment was 0 on every scan, and the ADD
  verdict gate required `score >= 1.0`, making **ADD structurally unreachable for any scanned product**;
  (2) the "+0 (already covered)" row label fired for every not-newly-added nutrient (false — only ~5
  were actually covered); (3) "+1 of 90" sat confusingly next to "17 mapped". Fix (Luneth-ratified
  'neutral', §00.A): unassessed form no longer blocks ADD (a future product-DB-backed scan that DOES
  carry form still needs `score >= 1.0`); the alignment tile shows honest **"form not on a label ·
  judged on gaps + ingredients"** instead of a damning 0%; rows show honest **"already covered"** (only
  when truly covered) vs **"counts toward your 90"**. No form judgment fabricated. Board 91/91;
  `render_probe_scan` + `render_probe_ocr` now return `verdict: ADD`.

### Still TODO (this review)
- **R2-7** — second-item-won't-add: reproduce in the real browser (static analysis shows it *should*
  work; only the timestamp-id collision on re-open fits), then id-hardening + REG-03 reconcile.
- **R2-5** — editable nutrient AMOUNT inputs (visual).
- **R2-8** — Clear/× to close a re-opened Saved item back to idle (flow + small visual).
- **R2-2 / R2-3** — rail CSS: `.rail-panel` `position:sticky`+`align-self:start` overlap/width; the
  cramped absolute × (visual).
- **R2-1** — delete the rail footer note (trivial).

### R2-7 update — SHIPPED + reproduced (2026-08-15)

**Cause (proven by a headless UI reproduction, not a guess):** the scan-history id scheme
`Date.now() + Math.floor(random()*1000)` collides when two saves fall within ~1s. The re-open
handler resolved a clicked row by that id (`[...getSaved(),...getHistory()].find(h => h.id === oid)`),
so on a collision clicking the SECOND Saved row re-opened the FIRST entry — adopting a duplicate of
it, and the differently-named second scan never landed. Repro (real app, real clicks):

| | before fix | after fix |
|---|---|---|
| distinct ids | `["Alpha","Beta"]` ✓ | `["Alpha","Beta"]` ✓ |
| **colliding ids** | **`["Alpha","Alpha"]`** ✗ | **`["Alpha","Beta"]`** ✓ |

**Fix:** (1) re-open resolves by **(source list, index)** not id — robust even for a user whose saved
scans already collide; (2) a monotonic `nextScanId()` minter so scan ids never collide again. Board
91/91; 5 scanner probes PASS (scanner, scan, adopt, concurrency, rail-sync).

**Still open / adjacent:** REG-03 — a genuine duplicate (same product adopted twice) still
double-counts coverage (`coverage.accumulate` sums items). That is a separate behavior change (dedup
by name + bump dose) with its own disposition in the QOL ledger; NOT bundled here.

### Remaining in this review (all visual → your sign-off)
- R2-5 editable amount inputs · R2-8 Clear/× on a re-opened item · R2-2/R2-3 rail overlap+width+×
  · R2-1 delete rail note.

### Visual batch — SHIPPED (2026-08-15), board 91/91, headless-screenshot verified

- **R2-1 delete rail note** — removed the "Every capture is marked Yours…" line + its now-dead
  `.vd-rail__note` CSS. Confirmed gone in the shot.
- **R2-2/R2-3 rail** — scoped `.vd-rail .rail-panel { position: static; align-self: stretch; }`
  (kills the two-panel sticky overlap on scroll + the width mismatch — Saved and Recent now equal
  width). The remove × moved into a reserved right gutter on saved rows, enlarged to 26px, clear of
  the verdict pill. Confirmed in the shot.
- **R2-5 editable amounts** — nutrient rows now render an editable amount + unit input (were
  read-only spans); `readCorrectedLabel` reads them back so a corrected amount flows into scoring.
  Builds + tsc clean; **visual NOT yet confirmed** (the Confirm panel needs a live OCR scan a headless
  probe can't reach — Luneth's refresh confirms this one).
- **R2-8 close ×** — a neutral `data-sc-clear` × on the verdict card top-right resets to idle (same
  as Reject, without the verdict connotation). Confirmed in the shot.

**R2-4 visual CONFIRMED in the shot:** verdict "Aligns · Worth Adding" (ADD reachable), stat tile
"— form not on a label · judged on gaps + ingredients" (no 0%).

### Bonus find (PRE-EXISTING, not from this pass) — verdict-card overflow
At a narrow window (~1280px) the scanner's main column is squeezed by the 380px rail, so the verdict
card's `.vd-card__body` (`minmax(0,1fr) minmax(0,336px)`) has almost no room for the left column — the
"Aligns" headline + tier chips overlap the coverage panel. The `@media (max-width:1180px)` single-col
fallback keys on VIEWPORT width, which stays >1180 even though the CARD is narrow. Fix candidates: a
higher/scanner-scoped breakpoint, or a container query. Flagged for Luneth's call (out of R2 scope).

## R2 review status: 7 of 8 shipped (+ R2-6 guard parked)
Caps · verdict/alarm · id-collision · rail · amounts · close × · note — all shipped, board green.
R2-6 WS2 (shared escaper + single-source gate) parked by Luneth. Awaiting his refresh sign-off on the
Confirm panel (R2-5 amounts) + a decision on the pre-existing card overflow. Nothing committed.
