# ★★★ NEXT SESSION — READ THIS FIRST.

Session 2026-08-15 finished **§1 #8b — the recycle bin** by shipping Batch 3 (the D2 replace-when-full
step), then round-closed. **#8b is now COMPLETE (all three batches).** Board 91/91 throughout;
everything probe- + screenshot- + **human-signed-off**. **eden/ untouched all session — no seal
applied (corpus seal still held).**

## ⇒ NEXT SESSION IS LUNETH'S BIG TWEAK LIST
Luneth ended the #8b session early **on purpose** to conserve usage for a **large list of tweaks** he
wants to drive next. So the next genesis boot should be clean and ready: **let him lead with his
list.** Do not pre-empt it with the parked §1 queue below.

## DEFERRED — raise ONLY AFTER the big-tweak session (his explicit instruction)
Two open regimen findings are parked with a **timing** instruction: surface them in the session
**after** the big tweak list, NOT during it. Also recorded in memory ([[regimen-two-deferred-findings]]).
- **#1** `coverage.ts::addVaultProduct` still carries its OWN copy of the add-or-bump dedup rule (now
  duplicated with `state/regimen.ts::addOrBumpRegimenItem`). Behavior-identical if consolidated.
- **#2** `.ck-undo` / `.ck-undo__btn` have ZERO CSS. They now only style the remaining `showToast`
  REFUSAL messages (at-slot-limit; the rare restore-full failure path) — bare bottom-of-page text.

## SHIPPED THIS SESSION — #8b Batch 3 (D2 "Replace a save")
When you hit Restore on a deleted save while all 4 slots are full, a **D2 step** now opens (instead of
the old refusal toast): the four current saves as a radio group, each with its colour bar + `covered/90
· N items · edited …` meta; pick one, the footer live-summary reads `"X" → bin · "Y" restored`, and
**Replace & restore** calls `restoreDeletedSlot(key, replaceSlotId)` — the chosen save drops to the bin
as the restored one takes its place. Back-arrow **and** Cancel return to D1; **×** closes; **Esc** in D2
backs out to D1 first, then closes. UI-only — the swap was already in state (batch 1).
- Files: `views/regimen.ts` (populateReplace + dispatcher + D2 click/Esc handlers + MAX_SLOTS import),
  `workspace-regimen.css` (D2 rules appended: `.rc-pop__back/__foot`, `.rc-rep-*`, `.rc-btn-cancel/
  -primary`). Signed-off mockup was `trash_D_refined.html` / `shot_D.png` (state D2).
- Probe: **`tools/render_probe_recycle_d2.js`** (new) — drives open-at-4/4 → pick → back+Esc → swap.
  Add it to the regression set alongside `render_probe_recycle.js` + `render_probe_recycle_ui.js`.

## AFTER THE TWEAK LIST — REST OF §1 (parked order, unchanged)
C (#9 goal-picker/veil: regimen "+ Add goal" opens the SAME full veil as Coverage; orange `.ui-close`) →
D (#7 result 2-box redesign, mockup-first) → A-sweep (`.ui-close` onto the remaining × — goal chips,
the veil close, knowledge-drawer closes, the scanner OCR ×). Then the §6 QOL-audit remainder.

## THE THREE LEDGERS (master records for the earlier passes)
1. `chronicle/ux-pass-2026-08-15.md` — the 10-point live UX review.
2. `chronicle/scanner-review-r2.md` — the 8 scanner issues (all done).
3. `chronicle/qol-audit-2026-08-14.md` — the original 30-item QOL audit (a subset done; many open).

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/` (a dedicated
  per-claim review session, never a byproduct).
- `design-system.css` is SEALED. The `.ui-close` standard + all recycle CSS live in NON-sealed
  workspace files (dashboard.css / workspace-regimen.css).
- 29 corpus claims + small threads await rulings. HEADERS parked. Online plan (Cloudflare) pending.

## GOTCHAS THAT SAVE HOURS
- **Per-file line endings.** `state/regimen.ts`, `views/regimen.ts`, `core/schemas/regimen.ts`, and the
  CSS are **LF**; `views/scanner.ts` + some tools probes are **CRLF**. Run `safe_write.py check` FIRST.
- **The recycle bin lives INSIDE `rgSlots_v1`** (Luneth's storage choice — atomic, §31). `deletedAt` /
  `removedAt` are full ISO timestamps (restore key + timer); `createdAt`/`editedAt` stay date-only.
  Caps: `MAX_SLOT_TRASH=7`, `MAX_ITEM_TRASH=4`; `MAX_SLOTS=4` (state/regimen.ts).
- **Slot colours must be palette hexes** (`slot-colours-data.json`) or `isSlotColour` rejects them and
  the bar falls back to `DEFAULT_SLOT_COLOUR` (orange). Seed real palette hues in screenshots/probes.
- **The popup is a fixed-position overlay inside `.ck`** — works because no ancestor keeps a lingering
  transform. If a future change adds one, move the host to `document.body`.
- Drive/screenshot the REAL app with the headless Puppeteer probes; the in-app Claude_Browser renders
  file:// as a STATIC snapshot. Seed `wallachUserProfile_v1={chosenAt}` to dodge the arrival veil.

## GENESIS
Luneth types `genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then ask which task to
resume. **Suggested first move: hand him the floor for his big tweak list** (see the top of this file).
