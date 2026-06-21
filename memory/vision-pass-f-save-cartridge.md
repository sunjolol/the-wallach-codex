# Pass F — Save Cartridge (Import/Export Vision)

**Status: SHIPPED in dashboard v1.65 (Round 126 — 2026-06-18 at 2:30 PM EDT).**
Originally scoped + visioned 2026-06-15 at ~11:55 PM EDT; shipped 3 days later. All 8 enumerated decisions (D1-D8) codified in `memory/essence/decisions.md`. Saga entry: Round 126. Lessons: recursive-bundle exclusion pattern + JS budget bump rationale + cached-stats trade-off.

**Tier shipped:** Option C (full cartridge), refined as Option C v2 per user feedback during the mockup phase. Solid dark slate showcase background, per-slot accent colors (teal/coral/periwinkle), frosted gray-glass for inactive cards, floppy-disk save-icon as the subtle gameboy reference.

**Deferred to Pass F.1:** D7 share-safe export mode (requires per-field sensitivity annotations in LS_SCHEMAS; revisit once operational evidence shows what fields are sensitive in practice). Cartridge gallery view (Tier C bonus from the vision below) was also out of scope this pass.

---

_Original vision (filed 2026-06-15) preserved below for historical context. Brain v3.9, Dashboard v1.55 at filing time._

---

**Originally filed:** 2026-06-15 at ~11:55 PM EDT (end of Round 97 session).
**Reload trigger:** Standard "catch up" after Tacitus's 2026-06-16 5:05 AM EDT fire.
**Reload target:** Brain v3.9, Dashboard v1.55.

This document is the **single source of truth** for the Pass F feature concept. Saga / lessons / decisions / open-threads all point here rather than restating. A fresh-session Claude reading this should be able to pick up Pass F cold and ship it with full conceptual fidelity to what the user is actually trying to build.

---

## The user's vision (verbatim language preserved)

The user has articulated this feature across multiple sessions. Direct quotes, in chronological order, with date markers:

**(2026-06-15 at ~3:20 PM EDT — Pass C.1 / Round 75 context):**
> *"import/export feature ... save/load like a video-game save cartridge"*

> *"shareable plans (socials, instructors, influencer stacks)"*

> *"you own your regimen, not the app"*

**(2026-06-15 at ~6:15 PM EDT — Pass D wrap context):**
> Side-note logged in decisions.md per the user's "high-priority finishing-touches" framing: the import/export of regimen as a portable "save file" — the vision being shareable plans (socials, instructors, influencer stacks), user-owned data ("you own your regimen, not the app"), save/load like a video-game save cartridge.

**(2026-06-15 at ~11:55 PM EDT — Round 97 deferral context):**
> *"huge potential project I am super interested in"*

> *"you could even take it to the next level and 'sell' the effect with graphics/styling that plays into that"*

> *"save for a fresh session because we've done a LOT and need to close up here so I can start a fresh new chat with a current.md reload and 'catch up' command and continue either later tonight or in the morning after Tacitus does his thing"*

These quotes are the cornerstone. The user has chosen "save cartridge" as the metaphor twice now, unprompted, and explicitly named the visual/styling extension as part of the vision. Treat this as architectural intent, not flavor text.

---

## What this feature actually does (the functional spec)

The dashboard currently has one half of portability: **export**. Round 58 / Pass P4.10 (dashboard v1.24) shipped a "⤓ Export data" button in the Regimen tab controls that bundles every `LS_SCHEMAS`-registered key into a timestamped JSON file tagged `_export.format === 'wallach-dashboard-export-v1'` and triggers a browser download. There's an existing smoke-test invariant guarding the export shape (Round 58 invariant: `buildDataExport()` produces a well-formed bundle).

Pass F adds the **other half**: **import**. A user — or anyone they've shared their bundle with — can load a saved bundle back into the dashboard, validate it, optionally migrate it through the `LS_MIGRATIONS` chain if it's from an older schema, and choose how to merge it into the current state.

**Minimum viable import flow:**

1. "⤒ Import data" button next to the existing "⤓ Export data" button.
2. File picker → read JSON → validate `_export.format === 'wallach-dashboard-export-v1'`.
3. If `format_version` is older than current, run through `LS_MIGRATIONS` (the framework already exists).
4. Show a **merge-strategy modal**: **Replace** (overwrite all current data with the file's data) vs. **Merge** (add file's items to existing, skip duplicates by id). Modal shows item counts and what each option commits to.
5. On confirm: write all keys to `lsWrite()`, re-render the Regimen tab and any other surface that reads the affected keys.
6. **Closing-move smoke test extension:** roundtrip behavior assertion — export → clear LS → import → assert state restored.

That's the minimum. The vision goes well past minimum.

---

## The cartridge metaphor — extended into the experience

The user wants the import/export to *feel* like a save cartridge — not just function like one. This is where the "sell the effect with graphics/styling" direction lives. Concrete design hooks the cartridge metaphor invites:

**The bundle itself as an artifact.** A `.json` file is functional but emotionally flat. The vision is the bundle has weight — feels like an object the user owns. Options:

- Custom file extension (`.cart`, `.regimen`, `.youwallach`, `.stack`) — a visible signal "this is MY data." Same JSON underneath; the extension is a UX cue. Browser file-picker uses `accept=".cart,.json"` so both work.
- Embedded preview metadata in the filename pattern: `regimen-2026-06-15-cognition-longevity-32items.cart` — at a glance you know what's inside before opening.
- A short "label" field in the export bundle: user-typeable cartridge name ("My pre-prep stack", "Mom's regimen v2", "Cognition-stack-trial-1"). Surfaces on import preview.

**Visual treatment of the import/export UI.** The cartridge metaphor wants:

- Slot-shape buttons (vs. flat rectangles). A slot has direction; "insert" reads as a verb.
- "Eject" framing on export. *Eject Cartridge* > *Export Data*. Same action, more honest about what it is.
- A small animation on successful import — slot lights up, cartridge "clicks in", a satisfying confirmation moment. Even 200ms of well-tuned motion changes the perceived weight of the operation.
- Plastic-shell aesthetic option: the bundle preview modal styled as a translucent cartridge body with a label sticker. Could go full Gameboy / N64 / SNES depending on which era reads cleanest in the Frutiger Aero language already established.

**Save-slot UX (the deeper version).** Beyond single import/export, the cartridge metaphor unlocks slot-based persistence in localStorage:

- "Save to Slot 1 / 2 / 3" — overwrite vs. add named saves the user keeps in-app.
- "Load from Slot N" — instant restore without going through file dance.
- Useful for fast A/B-style experimentation: save current state to Slot 2 before trying a regimen overhaul; if it doesn't feel right after a week, restore from Slot 2.
- Slots are still exportable; export is just "eject current slot to a file."

**Write-protect tab metaphor.** A small toggle on each export bundle: *write-protected*. A write-protected bundle imports as read-only — useful when sharing your stack with someone who shouldn't accidentally save changes back to your file. SNES carts had this; the UX hook is there.

**Cartridge gallery.** If multiple slots exist + the bundle has a label, the import UI can show a small "cartridge gallery" view — past slots and recent imports as labeled cartridges arranged in a row. Pick one to load.

The user's *"sell the effect with graphics/styling"* language is the explicit invitation to go heavier here than the rest of the dashboard's relatively quiet aesthetic. Pass F is a feature where the visual delight reinforces what the feature is conceptually about. The slot interaction is the moment of "I own my data" — the dashboard handing the user their stack back, packaged with care.

---

## Why this matters (the load-bearing rationale)

Four functional unlocks, in priority order:

**1. Save-cartridge experimentation — the safety net.** Right now, big regimen changes are one-way decisions. Major reshuffling, multi-week protocol switches, testing what happens if you wipe everything and start over — all currently unrecoverable. Pass F turns these into reversible decisions, which paradoxically accelerates iteration speed. Same psychological function as a video-game save slot: you try the thing more boldly because you know you can roll back.

**2. Shareable stacks — the network effect.** Sending a `.cart` file to a friend / clinician / Wallach distributor and having them load your exact regimen with one click underpins:

- **Socials.** "Here's my current stack — feel free to load it as a starting point." Image of cartridge + share button.
- **Instructor / coach.** A health coach can curate starter stacks for new clients and hand them out as files.
- **Influencer.** Someone in the Wallach community shares "my morning cognition stack" as a downloadable cartridge alongside their content.
- **Practitioner.** A Wallach-trained distributor sends a new customer a tailored starter regimen as a `.cart` file. The customer loads it and is already running on something thoughtful from day one.

This is the multi-user pathway the project has been pointing at since Round 33 (Tacitus autonomous + multi-user product future) and Round 52 (user-prefs refactor for multi-user safety). Pass F is the network-effect lever — once stacks are portable, the catalog of community stacks becomes a real artifact.

**3. Cross-instance migration.** Move between browser profiles, devices, or fresh installs without losing months of accumulated data. Today's dashboard is single-file and runs locally; the LS scope is per-origin per-browser-profile. Pass F is the bridge that doesn't depend on cloud sync to keep the data alive.

**4. Real fulfillment of doctrine §9 (reversibility).** The current export is only half the guarantee — you can capture state but not restore it. Pass F closes that gap and makes §9 honest. It's also load-bearing for any future schema migration that ships a breaking change: the export bundle is the off-ramp for users who need to roll back to a prior dashboard version.

---

## The technical substrate (what's already built)

Pass F inherits a lot. The fresh-session Claude should not rebuild any of this:

**Wire format (already defined, Round 58):**
- `_export.format === 'wallach-dashboard-export-v1'`
- `_export.timestamp` (ISO)
- `_export.versions.dashboard` + `_export.versions.brain`
- `_export.keys` — object keyed by LS key name, each value `{type: 'json'|'raw', data: <value>}`

**LS access framework (Round 54 / Pass P3.7):**
- `lsRead(key, defaultValue)` / `lsWrite(key, value)` / `lsRemove(key)`
- `LS_SCHEMAS` registry — every persisted key registered with a `type` ('json' or 'raw')
- `LS_MIGRATIONS` array — `{from, to, migrate}` entries for schema evolution
- Enforced by `check_no_direct_ls` invariant: direct `localStorage.*` outside the framework is forbidden in code review and integrity check.

**Defensive shape checks (Round 62 / Pass P5.4):**
- All 7 LS loaders perform shape validation on read. An import that delivers malformed shapes degrades gracefully — the loaders detect it and substitute defaults rather than crashing. Pass F can lean on this; it doesn't need to be defensive at the import layer for *internal consistency*, only at the validation layer for *bundle format*.

**Smoke test infrastructure (Round 58 invariant):**
- `tools/dashboard_smoke.js` exercises the export bundle shape end-to-end. Pass F's roundtrip extension just adds one more behavior assertion: export → `localStorage.clear()` → import → re-assert state. Pattern already established.

**UI patterns to reuse (Round 56 + Pass D + Pass E.1):**
- `showLcModal({title, bodyHtml, confirmText, cancelText})` — proven modal surface. Pass F's merge-strategy modal builds on it.
- `.benefit-pill` + similar small-element styling lives in CSS. The cartridge visual can be a new component class without conflicting.
- `bindRegimenCardActions` + delegated-handler pattern — the toggle pattern for import button wiring follows.

---

## What is new work (the actual Pass F surface area)

Distinguishing what's new from what's reused:

**JS — new:**
- `parseImportBundle(text)` — validates `_export.format`, runs through migrations if needed, returns canonical-shape object or throws with user-readable error string.
- `applyImportBundle(bundle, strategy)` — `strategy` ∈ `'replace' | 'merge'`. Writes through `lsWrite()` for each key. Calls re-render.
- `showImportModal()` — file picker → parse → preview → merge-strategy choice → confirm.
- Smoke-test extension: roundtrip assertion.

**HTML — new:**
- "⤒ Import data" button (markup near the existing "⤓ Export data" button).
- Import modal scaffolding (reuse `showLcModal`).

**CSS — new (if pursuing the cartridge aesthetic):**
- Slot-shape button treatment.
- Cartridge-preview component (translucent shell, label sticker, "click-in" transition).
- Slot-gallery layout if save-slots are in scope.

**Integrity tool — minor extension:**
- The roundtrip smoke-test behavior assertion. No new invariants needed; the existing `buildDataExport()` shape check stays as-is.

**Documentation — required:**
- saga.md entry for the Pass F shipping round.
- decisions.md entry codifying the slot-count decision (if save-slots are in scope) and the merge-strategy default.
- lessons.md if anything novel surfaces during build.

---

## Decisions to make in the fresh session (don't pre-commit)

These are the open product decisions. The fresh-session Claude should bring them to the user, not pre-decide:

**D1. Cartridge aesthetic — how far?** Three tiers to choose between:
- **Tier A (functional minimum):** Plain Import/Export buttons matched to existing dashboard styling. Reliable, fast to ship, lowest risk. No cartridge visual.
- **Tier B (named cartridges + slot UX):** Bundles carry a label field, save-slots in localStorage, "cartridge gallery" view. Visual treatment quiet but the slot metaphor is real.
- **Tier C (full cartridge aesthetic):** Tier B + cartridge-shaped UI, slot animations, plastic-shell preview, eject/insert language throughout, write-protect tab. The "sell the effect" version.

User has explicitly invited Tier C. Recommend asking which tier fits their session bandwidth before building.

**D2. Merge default.** When user imports without explicit choice, does *Replace* or *Merge* win? Replace is honest about destructive action; Merge is forgiving. Probably Replace with very clear modal copy explaining what gets overwritten.

**D3. Save-slot count.** If slots are in scope: how many? 3 keeps it Gameboy-honest. 9 (3×3 grid) keeps it SNES-honest. The number is more art than science; the slot count is also memory-cost on every page load (each slot is a serialized bundle).

**D4. Custom file extension.** Use `.json` (universal) or a custom like `.cart` (cartridge metaphor + emotional weight)? Custom extensions don't change anything technical; the file is JSON inside. The cost is a small "what app opens this?" speedbump for fresh users. Probably worth it.

**D5. Bundle versioning policy.** Today's wire format is `wallach-dashboard-export-v1`. When schema breaks: do we bump to `v2` and stop accepting `v1` (clean break) or keep both formats accepted forever via the migration chain (forever-compat)? Forever-compat is the right answer for a multi-user product; pick it now, codify in saga.

**D6. Cross-version compatibility.** If someone exports on dashboard v1.55 and imports on dashboard v1.42, what happens? The migration chain works forward (old → new), not backward. Probably: refuse with a clear message ("This cartridge was saved by a newer version. Please update.") — set the expectation that forward-only is the supported direction.

**D7. Shareability concerns.** Bundles will contain personal data — symptom history, lab results (if those layers ever land), regimen specifics that might be sensitive. Is there a "share-safe" export mode that strips personal/identifying fields while keeping the regimen + outcomes structure? If yes, that's another button: *Export for Sharing* alongside *Export All*.

**D8. The "Wishlist" carve-out.** Wishlist is currently in `LS_SCHEMAS`. Should it ride along in exports (someone shares their stack and their wishlist comes too) or be export-excluded by default? Probably export-included with a per-section opt-out checkbox in the export modal.

---

## Open questions for the user (surface during fresh-session catch-up)

These are higher-order questions the fresh-session Claude should ask early — they shape the whole pass:

- *Which tier of cartridge aesthetic (D1)? Session-bandwidth-dependent.*
- *Save-slot UX in scope, or just file-based import/export this pass?*
- *Custom file extension or just `.json`?*
- *Single-shot delivery (one pass ships everything), or staged (Tier A this pass, Tier C as Pass F.1 polish round later)?*
- *Any other personal-fit-related framing the user wants reinforced? "Save cartridge" is the metaphor, but if the user has been thinking about it in a different direction since this artifact was written, capture it before building.*

---

## Scope estimate

- **Tier A only:** ~45–60 min focused work + closing-move.
- **Tier A + Tier B (slot UX, named cartridges):** ~75–90 min.
- **Tier A + B + C (full cartridge aesthetic):** ~2 hours, possibly with a design back-and-forth on visual elements.

The estimates assume the substrate inventory above holds. The cartridge aesthetic Tier C is the wildcard — if the user wants a very specific visual feel (specific game-era reference, specific color palette), the iteration time on the visual treatment can dominate.

---

## Closing-move-atomic checklist for the Pass F shipping session

When this pass ships, the closing-move-atomic includes:

- saga.md narrative entry for the round
- decisions.md codifies D2 + D3 + D4 + D5 (whichever decisions were taken)
- lessons.md if anything novel surfaced
- This vision artifact gets a "Status: SHIPPED in v1.XX" header amendment + the unaddressed Tier items (if Tier A only shipped, mark Tier B/C as carried forward)
- Roundtrip smoke test added to `tools/dashboard_smoke.js`
- Version bump per existing protocol; backup file `dashboard-vX.YY-2026-MM-DD.html`
- open-threads.md updated: Pass F moves from "active" to "shipped"; anything carried forward becomes its own thread

---

## For the fresh-session Claude reading this on catch-up

You are picking up Pass F cold. The work in this artifact represents *the user's intent*, not just a feature ticket. The cartridge metaphor is real — the user named it twice, unprompted, and explicitly invited the visual extension. Don't treat it as flavor.

Start by reading this entire artifact. Then check `open-threads.md` for any newer context. Then bring D1 + the open questions to the user before writing code. The user explicitly deferred this pass to a fresh session because they want focused attention on it — give them that focus.

Brain v3.9. Dashboard v1.55. Audit 17/17 as of session close.
