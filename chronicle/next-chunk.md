# ★★★ NEXT SESSION — READ THIS FIRST.

Session 2026-08-15 shipped the **Scanner R2 review (8 issues, all done)** + a **10-point UX pass**
from Luneth's live review — the close-icon standard and the full **regimen roster-first redesign**.
Board 91/91 throughout, all verified (probes + headless reproductions + screenshots). Nothing about
the corpus/eden changed. Committed at round close.

## THE THREE LEDGERS — read these, they hold EVERY disposition
1. **`chronicle/ux-pass-2026-08-15.md`** — Luneth's 10-point UX review. **THE MASTER for the live pass.**
   ~6 of 10 done; the rest carry locked dispositions + a "still open" list at the bottom.
2. `chronicle/scanner-review-r2.md` — the 8 scanner issues. ALL DONE (with the diagnosis trail).
3. `chronicle/qol-audit-2026-08-14.md` — the ORIGINAL 30-item QOL audit. A subset done; many still
   open (§6 below). Each has a locked disposition. Reconcile against what the redesign now covers.

## SHIPPED THIS SESSION
- **Scanner:** R2-4 (verdict alarm — a scanned product can now earn "Add"; honest "form not on a
  label" instead of a fake 0%; honest "already covered" vs "counts toward your 90"), R2-7 (a
  scan-history id collision made a re-opened Saved row resolve to the WRONG entry — reproduced
  headlessly, fixed via index-based re-open + a monotonic id minter), R2-6 caps (maxlength on 9
  inputs + schema `.max()` backstop), rail overlap/width/×, R2-5 editable amounts, R2-8 close, R2-1
  note, R2-2/3 rail, **#6** (a re-opened Saved item says **Delete**, removes from the shelf).
- **A — the canonical close:** `.ui-close` / `.ui-close--sm` in **dashboard.css** (non-sealed), round
  neumorphic, **SVG X (never a text glyph)**, **ORANGE hover**. On the scanner card × + saved-row ×.
- **Regimen Variant B (roster-first — Luneth picked from a mockup):** #3 typeahead (top-3 after typing,
  each an Add button, **"covers N of 90 essentials"** meta), #4 per-item delete → inline
  **"Remove? → Trash · [Keep] [Remove]"** confirm (lands in the restorable trash), #5 (add-card owns
  the add; the orange scan button is GONE; scan → a centered secondary **"Scan your own item →"**
  link), #1 (`.ui-close` on the delete). Refinements from live testing: header "scan a label →"
  removed, scroll-overlap fixed (panel `position: static`), and **`syncStackHeight` neutralised —
  which fixed #2 (auto-update/height) AND the "I'm just browsing" collapse bug (SAME root cause: the
  box was capped to the console height, which is 0 while the tab is hidden, collapsing it to 0px).**

## UNFINISHED — ordered, dispositions locked

### 1. FINISH THE REGIMEN (close out Variant B)
- **Dead-CSS cleanup (§00.B):** `.rl-dose*`, `.ck-addcard*`, `.ck-scan*` are now ORPHANED in
  workspace-regimen.css (B replaced them). The `workspace_coverage_no_dead_rules` gate ONLY scans
  coverage.css, so it did NOT catch them. Remove by hand. **Do NOT remove `.rl-row`, `.rl-src`,
  `.rl-row__name`, `.rl-row__foot`** — the SCANNER rail still uses those.
- **#8 fuller:** (a) confirm-before-slot-delete (the slot delete has no confirm); (b) a **Trash
  browser/restore UI** — items already reach the trash via `saveRgRemoved` (verified), and
  `restoreFromTrash(itemId)` EXISTS in state/regimen.ts with NO UI. Build restore-to-original-slot,
  or a chosen slot if the original is gone (the loop Luneth designed).
- **REG-03 (double-count):** adding a product already in the slot (typeahead OR scanner adopt) still
  APPENDS and double-counts (coverage.accumulate SUMS). Dedup by case-insensitive name + bump dose
  via `saveRgOverride`. Overlaps #4/#7.

### 2. C — GOAL-PICKER / VEIL (#9 + NAV-05/06)
- Regimen "+ Add goal" should open the SAME full veil as Coverage (NAV-06 "veil everywhere");
  currently it's an inline dropdown.
- The veil needs a proper close: the canonical `.ui-close`, **ORANGE on hover** (Luneth: "same style
  as the search popup, orange not green"). NAV-05: Esc / backdrop / X cancel that does NOT write goals.
- **Hide "I'm just browsing" when a profile already exists** (welcome.ts — first-run copy, nonsense
  for a returning user).

### 3. D — RESULT 2-BOX REDESIGN (#7 — MOCKUP FIRST)
- Drop the alignment box AND the redundant "+N of 90 added" box (the illustrated coverage panel
  already says it). Stats was a 4-box grid; with 2 signals it needs a **redesign, not a literal
  deletion** (Luneth's standing complaint — don't take removals literally). Full-width **"N essentials
  hit out of 90"** hero + the ingredient-flags indicator. Reword "nutrients reach the 90" →
  "essentials hit out of 90". Mockup → his pick → build.

### 4. A-SWEEP — `.ui-close` onto the REMAINING × (after C sets the veil close)
- goal chips `.gchip__x`, the veil close, knowledge drawer closes (`.kd-knh__close`,
  `.kd-essential-deep__close`, `.kd-book-deep__close`), the scanner OCR × `.vd-ocr__x`. (Scanner card
  × + saved-row × already done.) The search popup `.scr-nav--close` is the REFERENCE — leave it (or
  flip to orange only if Luneth confirms).

### 5. R2-6 WS2 — THE ESCAPER GUARD (PARKED by Luneth)
- The "red-board any unescaped innerHTML" gate is NOT reliably grep-able (views interpolate
  `${renderChild(...)}` everywhere; no taint analysis in grep). The honest, achievable guard =
  consolidate the **17** `escHTML` copies → one `core/escape.ts` + a single-source gate. App is
  already XSS-safe; caps (WS1) shipped. Do when Luneth asks.

### 6. THE REST OF THE ORIGINAL QOL AUDIT (qol-audit-2026-08-14.md) — still open
REG-01, REG-04/05/06/08/09/10/11, PROF-01/03/04/05/06/07/08/09, NAV-01/03, KNOW-01/03/04, ASK-02/04,
COV-03, FOOD-01, SCAN-08. Each carries a locked disposition IN that ledger. Some may now be covered by
the redesign — reconcile, don't re-decide.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL — held.** eden/ UNTOUCHED this session; nothing to seal. `eden/corpus/drafts/` has 7
  unreviewed draft books (a dedicated per-claim review session, never a byproduct).
- **design-system.css is SEALED** (`design-system.golden.sha256`). The `.ui-close` standard lives in
  dashboard.css BY DESIGN. Never edit design-system.css without Luneth's sign-off + golden update.
- 29 corpus claims (fatigue/seizures/eye) + small corpus threads await rulings. HEADERS parked.
- Online plan: Cloudflare + local-GitHub-download; keep new work on both file:// and http.

## GOTCHAS THAT WILL SAVE THE NEXT SESSION HOURS
- **Line endings differ per file.** `views/regimen.ts` is **LF**; `views/scanner.ts`,
  `state/scanner.ts`, and the CSS are **CRLF**. safe_write is byte-exact — run `safe_write.py check`
  FIRST. (regimen.ts was normalised to LF in an earlier session — it bit this one.)
- **`.ui-close` is THE close standard.** Use it for EVERY × (SVG X, orange hover). Never invent
  another close style — that was Luneth's #4 fury (8+ ad-hoc × styles existed).
- **The dead-rule gate only scans workspace-coverage.css** — orphaned classes in regimen/scanner CSS
  are invisible to it. Check dead CSS by hand when you replace markup.
- **A height cap measured from a sibling collapses to 0 when the tab is hidden** (the syncStackHeight
  bug). Any "match my neighbour's height" JS breaks on a hidden-tab re-render. Watch for the pattern.
- **The in-app Claude_Browser renders file:// as a STATIC data: snapshot** (no JS, no localStorage).
  Drive/screenshot the REAL app with the headless Puppeteer harness (see the render probes + the
  scratch shot_*.js scripts). Seed `wallachUserProfile_v1={chosenAt}` + clear `#welcomeHost` to dodge
  the arrival veil in shots.
- **Reproduce before fixing.** R2-7 was a probabilistic id collision — proven by a headless repro, not
  guessed. Static analysis alone said it "should work."

## GENESIS
Luneth types `genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then ask which task to
resume. Suggested first move: **finish the regimen (§1: dead-CSS + #8 Trash-UI + REG-03)**, then C, then D.
