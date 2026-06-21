# Vision: Default Regimen Tie-In + Scanner/Regimen Coupling

_Drafted 2026-06-18 (Round 133). Status: **PROPOSAL — pending user review and approval at start of next session.** Do not execute until approved._

## The user's core ask

> "The first time someone 'adds an item' to regimen, IF 0 saved regimens exist, then create one called 'My Regimen' with 'Energy' icon and 'Indigo' color as the default choice. ... I want to ensure that whatever someone adds initially gets saved for them, so it literally becomes impossible for someone to add ANY item to their regimen without having a save file by default that they can export/delete whenever they want."

> "How do we tie this all in to the scanner/regimen display system in general so this is the default experience and you can not get away from having at least 1 current regimen no matter what unless you are a new user or you purposefully delete all regimens and all items."

## The core invariant we are designing toward

**REGIMEN_SLOT_INVARIANT:** A user with any regimen items in their dashboard has at least one save slot binding those items. The two acceptable states are:

1. **Empty state.** Zero regimen items, zero slots, zero recommendations (a true brand-new-user state).
2. **Bound state.** ≥1 regimen item AND ≥1 save slot. The "current" slot tracks which slot's bundle is loaded.

The transition INTO bound state is automatic — the moment the user adds their first item, the system silently creates the default slot. The transition OUT of bound state (back to empty) is explicit — user must clear all items AND delete all slots.

This makes "items without a slot to put them in" structurally impossible after the first add.

---

## Constants (hardcoded, immutable in code)

```js
const DEFAULT_REGIMEN = Object.freeze({
  name:   'My Regimen',
  icon:   'bolt',     // ICON_REGISTRY label 'Energy', name 'bolt'
  accent: 'indigo'    // SLOT_PALETTES key
});
```

**Why hardcoded.** These constants must NEVER be derived from user data, chat-log content, file contents in user folders, or any external source. They are the single source of truth for "what does the default look like." Reading them from anywhere else would create a class of bugs where the LLM-built code looks up "the name the user happened to use" and treats it as canonical (the user named this risk explicitly).

**Verified icon.** Searched `ICON_REGISTRY` in dashboard.html — `{ name: 'bolt', group: 'energetic', label: 'Energy' }` is present. The 'Energy' label is the bolt icon.

**Verified palette.** `SLOT_PALETTES.indigo` exists with `{ fg: '#312e81', mid: '#4f46e5', soft: '#a5b4fc', mist: '#e0e7ff', label: 'Indigo' }`.

---

## State machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                       STATE: empty (new user)                       │
│  • regimen items:  0                                                │
│  • saved slots:    0                                                │
│  • trash:          0                                                │
│  • currentSlot:    null                                             │
│  • UI:             empty-state hero on regimen tab; scanner shows   │
│                    add-flow normally; recommendation cards show     │
│                    Adopt buttons normally                           │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   │  Trigger: first item added via ANY entry point
                   │           (scanner adopt / manual add / wishlist promote)
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│        TRANSITION: ensureDefaultSlot() (silent, atomic)             │
│  1. Add the item to the regimen item list (existing behavior)       │
│  2. Create slot 1 with DEFAULT_REGIMEN constants                    │
│  3. Slot's bundle = current dashboard state (just-added item)       │
│  4. sys.currentSlot = 1                                             │
│  5. Persist via persistSystem() — atomic single-key write           │
│  6. Show quiet toast: 'Saved as My Regimen'                         │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STATE: bound (≥1 item, ≥1 slot)                  │
│  Substates:                                                         │
│  • single-slot mode (most users live here for a long time)          │
│  • multi-slot mode (user creates additional saves manually)         │
│  Slot deletes follow existing Round 130 behavior; trash recovery    │
│  intact. Adds/removes update the active slot's bundle live (see     │
│  "Auto-save policy" below).                                         │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   │  Trigger: user clears all items AND deletes all slots
                   │           (must be explicit — no silent return)
                   ▼
                   STATE: empty (return to top)
```

---

## Auto-save policy (the critical design decision)

When the user is in bound state and modifies their regimen (add/remove/edit an item), how does that change relate to the saved slot?

Three candidate policies:

**Policy A — Live-bind (recommended for first ship).** The active slot's bundle IS the live dashboard state. Any add/remove updates the slot atomically. There's no "unsaved changes" — modifying regimen items is implicitly modifying the active slot. The slot's `lastEdited` timestamp bumps on every change.
- *Pro:* No surprise data loss; matches user mental model ("my regimen is my regimen").
- *Pro:* Simplest contract for the user — no save button needed for normal use.
- *Con:* No multi-slot quick experimentation; if user switches to slot 2 mid-tweak, slot 1 is already committed.

**Policy B — Explicit-save (Round 126's current model).** Active slot is a SNAPSHOT; user must hit Save to commit changes. Active slot can go out of sync with live state.
- *Pro:* Supports experimentation — user can tweak without committing.
- *Con:* "Save your regimen" / "Discard changes" workflow needed; matches the user's stated frustration with current system.

**Policy C — Hybrid (live-bind primary slot, snapshot secondaries).** Slot 1 (or the "default" slot) live-binds; additional user-created slots are snapshots.
- *Pro:* Best-of-both; default is the always-current "what I take right now"; secondaries are explicit "save this state" snapshots for travel-mode / experimental-mode.
- *Con:* More complex mental model; needs UI cue for which mode a slot is in.

**Recommendation: Policy A for first ship, evolve to Policy C if user-tested need surfaces.** The user's stated philosophy ("ensure that whatever someone adds initially gets saved") points strongly at live-bind. Snapshot semantics can be added later as a per-slot flag without breaking the core invariant.

🟡 **Decision needed:** confirm Policy A.

---

## Entry points that must trigger `ensureDefaultSlot()`

Audit needed at implementation time. Candidates from current dashboard:
1. **Scanner adoption** (`Add to Regimen` button on scanned product → `promoteToRegimen()` flow).
2. **Recommendation adoption** (Pass D — Recommended cards `Adopt` button → promote via kind override).
3. **Manual add** (regimen tab `+ Add item` button → form flow).
4. **Wishlist promote** (wishlist → regimen path, if it exists).
5. **Cart import** (.cart file imported via Recovery Vault sister flow → already creates a slot natively; pre-existing slot becomes the default if it's slot 1; no special handling needed).

Implementation surface: a single `ensureDefaultSlot()` helper called by EVERY add-to-regimen path. The helper does nothing if a slot already exists; otherwise creates the default per constants above. This is the **single-point-of-injection** pattern — every entry point routes through it, no entry point bypasses it.

---

## Default-slot delete behavior

Should the default slot be deletable like any other slot? The user asked this directly.

**Recommendation: yes, deletable, with a warning modal that explains the consequence.** The "always have one slot" invariant is too rigid — users sometimes want a clean slate. The right discipline is to communicate the consequence honestly, not prevent the action.

Specifically:
- If deleting the LAST remaining slot, the modal copy reads: *"This is your last saved regimen. Deleting it clears your regimen items too. Your items will move to the Recovery Vault with the slot — you can restore both together."*
- The delete flow runs through `runDeleteCeremony` as today, but ALSO clears the live regimen items state.
- Trash recovery now stores both the slot bundle AND a marker indicating "this entry restores items too" — restoring re-populates regimen items from the bundle.

This makes "delete to start over" a single clear action with a single clear consequence. No silent edge cases.

🟡 **Decision needed:** confirm "default slot is deletable with consequence-warning modal" vs "default slot is structurally undeletable (delete button hidden when only one slot exists)".

---

## Migration: existing users who already have items but no slots

The current dev user (Luneth) has regimen items in `regimen-items` LS key WITHOUT a corresponding slot, because items predate the Round 126 slot system. Two paths:

**Path A — Silent auto-wrap on next dashboard load.** First time dashboard loads after this ships AND finds items without any slot: silently call `ensureDefaultSlot()` with the existing items as the slot's bundle. Show a one-time quiet toast: *"Your regimen was saved as 'My Regimen'."*
- *Pro:* Zero friction; users with old data just work.
- *Con:* Silent migration without user awareness; risk of confusion if the toast is missed.

**Path B — One-time onboarding modal.** First load detects the no-slot-but-items state and shows a friendly modal: *"Want to save your current regimen so you can switch between setups later? Tap 'Save' to lock it in as 'My Regimen'. You can rename or customize the icon/color anytime."*
- *Pro:* User awareness; teaches the feature.
- *Con:* More implementation; modal adds friction for users who don't care.

**Recommendation: Path A.** The toast is the right level of acknowledgment for an automatic save. Path B's "teach the feature" benefit is covered by the existing Customize slot UI which is already discoverable.

🟡 **Decision needed:** confirm Path A.

**Reset-this-user case:** per user direction in this conversation, the dev user (Luneth) wants to start fresh. The reset is performed by the implementer at start of next session: clear `regimen-items` LS, clear `rgSaveSystem` LS (or the per-slot legacy keys if any remain), clear `wishlist` if user wants (TBD per next session). This is a one-time manual operation — NOT part of the shipped reset flow.

---

## Scanner / regimen-tab tie-in points

Architectural commitment: every "add to regimen" code path uses ONE shared helper:

```js
function addItemToRegimen(item) {
  // 1. Append item to live regimen-items LS via existing primitive
  appendToRegimenItems(item);

  // 2. Ensure a slot exists (no-op if already exists)
  ensureDefaultSlot();

  // 3. Sync the active slot's bundle with current live state (Policy A)
  syncActiveSlotBundle();

  // 4. Re-render affected surfaces (regimen tab, slot card, coverage)
  refreshAffectedSurfaces();
}
```

Every entry point above (scanner adopt, recommendation adopt, manual add, wishlist promote) calls `addItemToRegimen` and only `addItemToRegimen`. The scanner doesn't know about slots; the recommendation flow doesn't know about slots; the manual-add form doesn't know about slots. They all delegate.

**This is the same architectural pattern as `runDeleteCeremony`** from Round 132 — one shared primitive per behavior class, every consumer routes through it, individual surfaces stay simple.

---

## Reset-to-new-user mechanism (future user-facing surface)

Currently no user-facing reset action exists. Should it?

**Recommendation: defer.** The "clear all items + delete all slots" path through existing UI is already two explicit user actions (clear regimen items, delete the slot). A "Reset everything" mega-button is high-stakes UI that risks accidental clicks. If user testing shows demand, a "Reset Dashboard to New User State" action lives under Settings (we don't have a Settings surface today — that's its own design).

For the dev user's reset in this conversation: performed manually by the implementer at start of next session via shell. NOT a permanent UI feature.

🟡 **Decision needed:** confirm "no user-facing reset action for now; future Settings surface."

---

## Test-time invariant

Add a runtime sanity check that fires after every regimen-state mutation:

```js
function assertRegimenSlotInvariant() {
  const items = lsRead('regimen-items', []);
  const sys = loadSystem();
  const hasSlots = !!Object.values(sys.slots).find(s => s !== null);
  if (items.length > 0 && !hasSlots) {
    // INVARIANT VIOLATION — items exist but no slot binds them
    console.error('[REGIMEN_SLOT_INVARIANT] items exist without a slot; calling ensureDefaultSlot()');
    ensureDefaultSlot();
    syncActiveSlotBundle();
  }
}
```

Fires after every add/remove. Self-healing — if the invariant ever breaks for ANY reason (bug, race, partial migration), the next mutation restores it. This is the **trust-but-verify-and-self-heal** pattern from Cura's audit work.

---

## Implementation plan (after user approval)

1. **Phase 0 (reset).** Implementer clears Luneth's `regimen-items` + `rgSaveSystem` LS keys. (Optional: wishlist + recommendations cache too — confirm with user.)

2. **Phase 1 (constants + ensureDefaultSlot helper).** Add `DEFAULT_REGIMEN` constant block to dashboard.html. Implement `ensureDefaultSlot()` and `syncActiveSlotBundle()`. Wire `assertRegimenSlotInvariant()`. Test in isolation via console.

3. **Phase 2 (route every entry point through addItemToRegimen).** Audit existing entry points (scanner, recommendations, manual add, wishlist). Replace direct `appendToRegimenItems` calls with `addItemToRegimen`. Verify each path still works end-to-end.

4. **Phase 3 (delete-the-last-slot consequence flow).** Update `confirmDeleteSlot` to detect last-remaining case and show the consequence-aware modal. Implement the items-clear-on-last-slot-delete flow. Update Recovery Vault restore to handle the items-too case.

5. **Phase 4 (migration).** Add the auto-wrap-on-load logic for users with items-but-no-slot state. Test on a synthetic legacy LS state.

6. **Phase 5 (atomic close).** Saga / lessons / decisions. Invariant added to `tools/invariants.py` for the integrity layer to verify `REGIMEN_SLOT_INVARIANT` holds across the canonical LS state in tests.

Each phase is independently shippable — they don't have to land in one round. Phase 1 + 2 are the minimum viable cut (creates the default, routes adds through it). Phase 3 + 4 polish the edges. Phase 5 closes.

---

## Open questions for next-session resolution

1. **Auto-save policy:** confirm Policy A (live-bind active slot to current state)?
2. **Default-slot deletability:** keep deletable with consequence warning, OR structurally undeletable?
3. **Migration path:** confirm Path A (silent auto-wrap with toast on next load)?
4. **Reset action:** defer user-facing reset for now? (Implementer-only reset happens manually at start of next session.)
5. **Wishlist scope at reset:** clear wishlist too, or preserve it as orthogonal data?
6. **Quiet toast copy:** "Saved as My Regimen" on first auto-create — confirm the wording?
7. **Phase ordering:** ship all phases in one round, or split across rounds? (Recommendation: Phase 1+2 in one round, Phase 3+4 in a second round, Phase 5 closing.)

---

## On the "hardcoded constants vs derived-from-data" lesson

The user asked whether to log "don't get tricked by user's trash/chat-log content as a 'default' reference" as a coding lesson NOW or wait.

**My honest read:** wait. The underlying principle ("hardcoded constants for defaults, never derive from user data") is foundational software engineering hygiene — it's well-established outside our project. Logging it as a lesson would dilute the lessons file's signal-to-noise ratio. We already have substrate (Round 99/100/128) which is close-enough adjacent: "art rooted in truth, never substituted for it" — and a default value sourced from chat-log content would be exactly that kind of substitution. The substrate principle covers the failure mode.

If the failure mode bites us at implementation time (e.g., a code review catches me almost using a derived value), THEN we log it as a follow-up to substrate with the specific LLM-coding angle. Until then, the existing principle suffices and the implementation note in this doc (the `Object.freeze({...})` constant block above) is the operational defense.

Filed as not-yet-a-lesson. User has confirmed-deny authority on this read at next session if they want to escalate.

---

## Summary for fast catch-up

Default regimen tie-in: every add-to-regimen path routes through `addItemToRegimen()` → ensures a slot exists, creates default if not, syncs bundle. Invariant: items-with-no-slot is structurally impossible after first add. Hardcoded constants. Self-healing invariant check. Migration via silent auto-wrap. Implementer resets dev user manually at start of next session before Phase 1.

Five-phase ship plan, all phases independently shippable. Eight open questions for user resolution. Recommend pre-implementation review session at start of next session before Phase 0 runs.


---

## Round 134 addendum — Two-lane architecture + cart-as-share-primitive (2026-06-18 at 7:55 PM)

This addendum updates the vision in light of the user's articulation of the BIGGER frame: the scanner is the **freedom lane** in a two-lane architecture where the recommendation engine is the **authoritative lane**, and the save-cart is the future **share/export/monetize primitive** that lets users (and eventually influencers, gurus, doctors, experts) publish their own regimens.

### Two-lane architecture (load-bearing)

| Lane | Input | Authority | Where items land |
|---|---|---|---|
| **Authoritative** | Goals + concerns picker → recommendation engine → Adopt | Wallach + Youngevity (source-rule cornerstone) | Active save slot via `addItemToRegimen()` |
| **Freedom** | Scanner verdict → user choice | User's own judgment (or another expert's, eventually imported) | Active save slot via `addItemToRegimen()` OR scanner-local wishlist |

The regimen is intentionally a **mixed bag**. Per-item provenance preserves the source. The cart that exports it is the **share primitive** for the future platform vision.

### User's articulated vision, paraphrased

> *"We can recommend and give the layman STRONG, SOLID Wallach-plus-Youngevity-based recommendations that will absolutely save lives and heal people who don't know the truth and are seeking it, the ones who have no knowledge of good health and need a guiding hand. That's what MOST people will need... but that's only half of the equation — the other half is allowing other people into our system to make their own regimens, scan their own items, and track their own goals their own way and share their ideas with the world."*

The platform stays Wallach-aligned for default users; the freedom lane preserves user sovereignty and creates the surface for non-Wallach experts to participate. The cornerstone source-rule applies to the dashboard's RECOMMENDATIONS (the authoritative lane). The user's regimen and its export cart are theirs — mixed sources OK, source-confidence preserved per item.

### Per-item `provenance` field on regimen items

Every regimen item carries:

```js
provenance: 'wallach_essential'              // baseline (HBSP etc.)
          | 'wallach_recommendation_adopted'  // surfaced by engine, adopted
          | 'user_scanned'                    // came through the scanner
          | 'user_manual'                     // user typed it in
          | 'imported_cart'                   // pulled from a shared cart
```

Drives UI distinction (Wallach-baked-in vs user/other-expert choice) and drives the cart format's confidence layer when shared. `imported_cart` items also carry an `original_creator` field for attribution.

### Cart format — leave room for the share future

Current cart format (Pass F): `{items, slots, meta}`. Round 134 extension:

```js
// shipping in this round
{
  ...existing,
  creator: string?,        // optional, free-text, capped (doctrine §8)
  description: string?,    // optional, the pitch / why
  items: [
    { ...existing, provenance: <enum above> }
  ]
}

// reserved-but-undefined (shipping leaves room; never written, tolerated on read)
{
  license: ?,
  price: ?,
  attribution_url: ?,
  signature: ?
}
```

The reserved keys are tolerated by the importer (unknown keys ignored, not errored). The exporter never writes them yet. This is the **leave-room-without-shipping discipline** — the schema doesn't have to be touched again when the share/monetize features land.

### Scanner mechanically unchanged (this round)

Per explicit user direction: *"leave the scanner as is for now, we're not improving how the scanner works right now we're just ensuring that it seamlessly blends into the save cart/regimen features/system."*

The only scanner-side change Round 134 ships:

- Category input field → **DIET / SUPPLEMENT swap bar** (two-state, default DIET, "graffiti'd light switch" aesthetic). The verdict-flow differences between Diet and Supplement are deferred; both run the existing `label_scorer.py` path. The category tag is recorded on the item and drives downstream visual distinction in the regimen tab.

The three exits from the scanner verdict stay as today, semantically clarified:

- **Add to regimen** → routes through the new shared `addItemToRegimen()` helper with `provenance: 'user_scanned'`. If multiple save slots exist, confirm which slot. If only the active slot, no confirm.
- **Save for later** → stays on scanner screen via the existing `product-wishlist.json` substrate. Does NOT pollute the regimen tab. Discoverable on return to the scanner.
- **Reject / clear** → wipes scanner fields, ready for next scan.

### Goal taxonomy reconciliation (Phase 0)

Two taxonomies exist today:
- `catalog-index/goal-to-products.json` — 18 goals
- `memory/user-prefs/index.md` — 14 goals, NOT identical to the catalog (missing 5; adds `hydration_electrolyte`)

**Phase 0 reconciliation:** canonical list becomes the catalog's 18 + `hydration_electrolyte` = **19 goals total**. `user-prefs/index.md` is updated to match. `dashboard.html`'s `GOAL_DISPLAY_NAMES` map updated. `catalog-index/goal-to-products.json` gets `hydration_electrolyte` as a new key (empty product list until a tagging pass populates it).

**Caveat:** until products get tagged for hydration_electrolyte, the recommendation engine will return an empty list for that goal. UI shows "No matches yet" rather than an error. The empty state is honest.

### Chat as deferred escape hatch — minimal room only

User direction: *"I personally don't imagine we're going to ever have a chat feature honestly (90% sure currently), because it's too risky for a project like this (adds a layer of potential failure/hallucination/fake info/lies/whatever plus liability issues around health), so don't waste too much effort making room for it, I think a simple note is enough if anything."*

Implementation note (the minimal room): the recommendation engine's input source is abstracted behind a thin function (`getCurrentGoals() / getCurrentConcerns()`). Today they read from LS-backed pickers. A future free-text input could be added as an alternative source without rearchitecting. That's the only structural concession; no UI surface, no plumbing, no tests for chat ship in Round 134.

### Implementation plan (revised)

**Phase 0 (reset + taxonomy reconciliation).**
- Clear Luneth's `regimen-items` + `rgSaveSystem` + (TBD) `wishlist` LS keys.
- Add `hydration_electrolyte` to `knowledge/catalog-index/goal-to-products.json` with empty product list.
- Update `memory/user-prefs/index.md` to match the canonical 19.
- Update `dashboard.html`'s `GOAL_DISPLAY_NAMES` map to the canonical 19.
- Run integrity check.

**Phase 1 (constants + helpers + invariant).**
- `DEFAULT_REGIMEN` constant block.
- `ensureDefaultSlot()`, `syncActiveSlotBundle()`, `addItemToRegimen()` (with `provenance` arg).
- `assertRegimenSlotInvariant()` (fires on every mutation AND on load — the migration logic IS the load-time arm).

**Phase 2 (route entry points).**
- Scanner adopt path → `addItemToRegimen(item, 'user_scanned')`.
- Recommendation adopt path → `addItemToRegimen(item, 'wallach_recommendation_adopted')`.
- Manual add → `addItemToRegimen(item, 'user_manual')`.
- Wishlist → regimen (if exists) → routes through with appropriate provenance.

**Phase 3 (cart format extension).**
- Add `creator`, `description` to cart schema.
- Add `provenance` to per-item shape.
- Importer tolerates unknown reserved keys (`license`, `price`, etc.).
- LS_MIGRATIONS upgrades existing cart bundles to `provenance: 'user_manual'` for legacy entries (best-guess default).

**Phase 4 (UI: New Regimen rename + confirm modal).**
- `+ Save current` button → `+ New regimen`.
- Three-button confirm modal: `Save current → Start new` (default), `Discard current → Start new` (red, hover-pause), `Cancel`.
- Default-slot delete behavior from original vision: deletable with consequence-warning modal.

**Phase 5 (scanner DIET/SUPPLEMENT swap bar).**
- Replace category input on scanner with two-state swap bar.
- Visual treatment per "graffiti'd light switch" aesthetic.
- Category tag persists on the scanned item, drives no behavior change YET.

**Phase 6 (atomic close).**
- Saga / lessons / decisions entries.
- `REGIMEN_SLOT_INVARIANT` added to `tools/invariants.py`.
- Integrity check.
- Round-close downstream-sweep (open-threads, etc.).

Each phase remains independently shippable. Phase 0 must run first (taxonomy is the foundation). Phase 1+2 are the minimum viable cut. Phase 3+4 polish the share/save UX. Phase 5 is the scanner UI change. Phase 6 closes.

### Remaining open questions for next touch-base

1. **Scanner add-to-regimen slot confirm:** when >1 save slot exists, confirm which slot, OR always default to active slot with quiet toast saying "added to {slotName}"?
2. **Wishlist scope at reset:** clear scanner wishlist (`product-wishlist.json`) at Phase 0, or preserve as orthogonal data?
3. **Visual distinction for provenance on the regimen tab:** how distinct? A small colored dot? A pill? Hover tooltip only? — propose at build time, get user feedback.
4. **`hydration_electrolyte` empty state:** does the goal picker show goals with zero product matches (with "No matches yet" empty state) or hide them until products exist? — recommend show, with the honest empty state.

### Open questions count cleanup

Original vision doc summary said "8 open questions"; numbered list had 7. Round 134 addendum adds 4 new ones. Round 134's revised open-questions count is 7 + 4 - (any resolved by the user's reply) = the four above plus whatever from the original list isn't yet decided.

User's reply this round resolved:
- Original Q1 (Policy A: live-bind) — IMPLIED confirmed via lack of objection
- Original Q4 (defer user-facing reset) — IMPLIED confirmed
- Original Q6 (toast copy "Saved as My Regimen") — IMPLIED confirmed
- Original Q7 (phase ordering) — REVISED above into 6 phases

Original Q2 (default-slot deletability with consequence warning) — IMPLIED confirmed via user not pushing back on the recommendation.
Original Q3 (silent auto-wrap migration Path A) — still open; depends on whether Phase 0 wipes Luneth's data first (which the user authorized — so Path A goes untested on real data unless we run it on Luneth's existing state BEFORE wiping. Worth deciding.)
Original Q5 (wishlist scope at reset) — re-asked as Q2 above.

So the count after Round 134: **4 open questions** (the four numbered above), plus a request for resolution on:
- Whether to test Path A migration on Luneth's current legacy state BEFORE Phase 0 wipes the LS (recommend yes — only real legacy-shape data we have).
- Whether to log the cart-as-share-primitive architectural realization as a `decisions.md` entry now (Round 134) or wait for the actual format extension to ship (Round 135+).



---

## Round 134 follow-up — Six pre-Phase-0 questions resolved (2026-06-18 at 9:31 PM)

User answered all six remaining items from the prior touch-base.

### 1. Scanner add-to-regimen confirm + provenance-aware default constants

**Resolution.** No confirm modal when 0 slots exist — auto-create the default. The default constants BRANCH by entry point:

```js
// Used when first add is via recommendation engine OR manual
const DEFAULT_REGIMEN_ENGINE = Object.freeze({
  name:   'My Regimen',
  icon:   'bolt',     // ICON_REGISTRY label 'Energy', name 'bolt' — verified
  accent: 'indigo'    // SLOT_PALETTES key — verified
});

// Used when first add is via the scanner (freedom lane)
const DEFAULT_REGIMEN_SCANNED = Object.freeze({
  name:   'My Regimen (Scanned)',
  icon:   'heart',    // ICON_REGISTRY label 'Cardio', name 'heart' — verified
  accent: 'amber'     // SLOT_PALETTES key — verified
});
```

`ensureDefaultSlot(provenance)` selects the constant block based on the triggering provenance: `'user_scanned'` → SCANNED; `'wallach_recommendation_adopted'` or `'user_manual'` → ENGINE. Visual separation aids both UX and bug-spotting. Both constants `Object.freeze`-d; hardcoded; immutable.

When >1 slot exists at scan time, future polish round may add a "which slot?" picker. For Round 134 ship: always add to active slot with quiet toast `"Added to {slotName}"`.

### 2. Wishlist scope at Phase 0 reset

**Resolution.** Clear `memory/product-wishlist.json` (Luneth's personal scanner wishlist) as part of Phase 0 reset.

### 3. Provenance visual distinction on regimen tab

**Resolution.** Use an icon per provenance kind, plus a hover/click popup explaining what the icon means. Specific icon choices are build-time decisions; user wants to see the surface before committing to a direction. Default proposal:

| Provenance | Icon (initial proposal — iterate at build) | Popup gist |
|---|---|---|
| `wallach_essential` | shield (steady, baseline) | "Wallach 90-essentials baseline" |
| `wallach_recommendation_adopted` | sparkle (recommended) | "Adopted from goal-driven recommendation" |
| `user_scanned` | scanner-shape (matches scanner button) | "Added via scanner — your own choice" |
| `user_manual` | pencil | "Added manually" |
| `imported_cart` | gift-box (with original_creator surfaced on hover) | "From {original_creator}'s shared regimen" |

Round 134 ships ONE provenance icon system; user reviews and iterates.

### 4. `hydration_electrolyte` empty state

**Resolution.** Hide from goal picker until at least one product is tagged. Picker filter: `goals.filter(g => goalToProducts[g].length > 0)`. The taxonomy still includes hydration_electrolyte as the canonical 19th goal — it's just not surfaced in the picker yet. Tagging happens later in a natural pass — **NOT added to open-tasks per user direction.**

### 5. Test Path A migration on Luneth's legacy data first

**Resolution.** Yes. Implementation order becomes:

1. Phase 1 helpers + invariant land (no reset yet).
2. **Migration verification step:** Luneth's current items-without-slot state triggers the auto-wrap on first load post-Phase-1. Verify the toast fires, the default slot creates correctly, and the items bind into the slot's bundle.
3. After verification: Phase 0 reset wipes everything for the clean dev experience.
4. Phase 2+ proceed.

This sequence puts Phase 1 BEFORE Phase 0 reset. Phase numbering stays for clarity but execution order is: 1 → migration verify → 0 → 2 → 3 → 4 → 5 → 6.

### 6. Cart-as-share-primitive log to decisions.md

**Resolution.** Done in same patch as this addendum. Three entries appended to `memory/essence/decisions.md` (2026-06-18 at 9:31 PM):
- Cart-as-share-primitive + two-lane architecture + per-item provenance enum
- Goal taxonomy canonicalized at 19
- Provenance-aware default-regimen constants (two templates)

### Phase 0 ready signal

All six items resolved. Execution order finalized as: **Phase 1 → migration verify → Phase 0 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6.**

Phase 1 starts on user go-ahead.

