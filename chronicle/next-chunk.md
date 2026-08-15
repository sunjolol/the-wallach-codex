# ★★★ NEXT SESSION — READ THIS FIRST.

Session 2026-08-15 (long) pushed hard on §1 "finish the regimen" across 3 commits + this Batch-2
round-close. Board 91/91 throughout; everything probe- + screenshot-verified. **eden/ untouched all
session — no seal applies.**

## SHIPPED THIS SESSION (newest first)
- **#8b recycle bin — Batch 2 (UI)** [this commit]: the sticky dashed **"Restore Deleted Slots &
  Items"** trigger in the rail (shows only when the bin is non-empty) + the **style-D popup** (signed
  off): a gallery of deleted-save mini-tiles (colour / name / coverage / item count / relative-time) +
  a removed-items list. Restore an item (→ its origin save if it still exists, else the active save) or
  a **non-full** save; the popup live-refreshes; ×/Esc/backdrop close. Bin stamps are now **full ISO
  timestamps** (enables the "N ago" timer AND kills a same-day `deletedAt` restore-key collision).
  Popup sub-text derives the 7/4 from the caps. Probe: `render_probe_recycle_ui.js`.
- **#8b recycle bin — Batch 1 (state foundation)** [4067b544]: schema (`slotName`,
  `SlotTrashEntrySchema`, `slotTrash .max(7)`); ops (`deleteSlot` → whole-slot snapshot into the save
  bin; `saveRgRemoved` → item bin cap 4 + slotName; `restoreDeletedItem` origin-or-active;
  `restoreDeletedSlot` with the replace-when-full swap); **non-destructive `backfillRecycle`
  migration** (NO version bump — the safer backfillP4 pattern; a FLAGGED deviation from the approved
  plan); gate `slot_invariants` now enforces `slotTrash .max(7)`; removed the dead slot-delete undo
  path. Probe: `render_probe_recycle.js`.
- **dead-CSS + REG-03 + #8a** [938a407c]: purged 18 dead regimen CSS rules; REG-03 add-or-bump dedup
  (shared `addOrBumpRegimenItem`, matches coverage); #8a slot-delete inline confirm.

## #8b IS NOT DONE — BATCH 3 IS NEXT (the ONE remaining piece)
The recycle bin works EXCEPT the replace-when-full UI. Right now, restoring a save when all 4 slots are
full shows a **refusal toast** (`restoreDeletedSlot` returns `ok:false` without a `replaceSlotId`).
Batch 3 = build the **D2 "Replace a save" step** — clicking Restore on a save at 4/4 opens a second
popup view listing the 4 current saves; you pick one to move to the bin, and the restored save takes
its place. **The STATE already supports it**: `restoreDeletedSlot(deletedAtKey, replaceSlotId)` does the
swap (proven by `render_probe_recycle.js`). So Batch 3 is **UI-only**: a D2 view + wiring
(Restore-at-full → D2 → pick + confirm → call `restoreDeletedSlot` with the `replaceSlotId`; a back
arrow to D1), then round-close #8b. Signed-off D2 mockup: `scratchpad/trash_D_refined.html` /
`shot_D.png` (state D2). Item-meta format is LOCKED: `from <save> · <when>` OR
`<save> · deleted · will restore to active save slot · <when>`.

## FLAGGED FINDINGS (surfaced this session, not done)
- **#1** `coverage.ts::addVaultProduct` still carries its OWN copy of the add-or-bump dedup rule (the
  rule now lives in two places: it + `state/regimen.ts::addOrBumpRegimenItem`). Consolidation offered,
  not done (signed-off code). Behavior-identical if consolidated.
- **#2** `.ck-undo` / `.ck-undo__btn` have ZERO CSS anywhere. After removing the slot-delete undo this
  session, it only affects the remaining `showToast` REFUSAL messages (at-slot-limit, restore-full) —
  they render as bare bottom-of-page text. Style it, or route those refusals elsewhere.

## AFTER #8b — REST OF §1 (order)
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
  `removedAt` are now **full ISO timestamps** (restore key + timer); `createdAt`/`editedAt` stay
  date-only. Caps: `MAX_SLOT_TRASH=7`, `MAX_ITEM_TRASH=4` (state/regimen.ts).
- **The popup is a fixed-position overlay inside `.ck`** — works because no ancestor keeps a lingering
  transform. If a future change adds one, move the host to `document.body`.
- Drive/screenshot the REAL app with the headless Puppeteer probes; the in-app Claude_Browser renders
  file:// as a STATIC snapshot. Seed `wallachUserProfile_v1={chosenAt}` to dodge the arrival veil.
- Recycle regression probes: `render_probe_recycle.js` (state: migration/restore/replace/caps) +
  `render_probe_recycle_ui.js` (popup wiring). `render_probe_slot_delete_confirm.js` now checks
  `slotTrash` (a deleted save → the save bin), not the old item trash.

## GENESIS
Luneth types `genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then ask which task to
resume. **Suggested first move: #8b Batch 3 — the D2 replace-when-full step (UI-only; the state is
ready).**
