# Open Threads

_Last updated: 2026-06-20 at ~10:30 PM EDT (Saturday evening — Round 159 shipped: §32 whack-a-mole rebuild trigger doctrine + brain prompt directive + cross-session detector invariant. Vision/Aegis rebuild-proposal mode + simulate-before-ship discipline RECORDED at `tacitus/notebook/2026-06.md` for dedicated design session, NOT shipped this round. Rounds 157/158 landed Eden + dose UX/card UX earlier today. System rests through remainder of Sabbath window)._
_Brain at: **v3.26**. Dashboard at: **v1.106**. Tacitus at: **v2.5**. Invariant manifest: daily 56 (54/56 with 2 known FAILs + 1 Sabbath transient: Saturday `audit_ran_today` + 8 pre-existing native dialogs + `tacitus_rest_day_observed` for tonight's tacitus/notebook write per user request to record proposal). Eden hash `8e594a01...` unchanged; user-only-writer rule cleanly enforced._

### 🆕 NEW HIGH-PRIORITY OPEN THREAD — Vision/Aegis dedicated redesign session

User-requested dedicated session covering MULTIPLE substantive changes. **Source-of-truth document for this session:** `tacitus/notebook/2026-06.md` 2026-06-20 ~10:00 PM EDT entry (recorded verbatim with all rubrics, rules, gates, anti-misfire requirements).

Scope:

1. **`vision_rebuild_proposal` operating mode** (new Vision mode, additive — does NOT touch existing pattern-seed behavior). Pre-conditions (5 ALL-must-be-true gates), 0-100 scoring rubric (5 weighted categories), required proposal structure (8 sections including REQUIRED "Why this might be wrong" counter-argument), truth anchors (engineering-doctrine + lessons + claude-best-practices + verified-patterns + saga), compliance invariant. Anti-misfire core: "no vibes-based rebuilds" + required counter-argument paragraph.

2. **Aegis patch-fatigue detector** (new Aegis sub-check). Catches "still broken / regressed" patterns from saga's verification notes + same-component touches across rounds + declining quality. Surfaces a landing recommending Vision's rebuild-proposal mode be invoked on the affected component. Aegis's natural domain — replaces the placeholder text-scan inside the Round 159 cross-session invariant.

3. **Simulate-before-ship discipline for Vision/Aegis changes** (Cura EXEMPT). Implementation: `tools/vision_simulate.py` + `tools/aegis_simulate.py` that feed historical 14+ days of saga/lessons/decisions into proposed prompts and produce diff-style output (what change WOULD have surfaced, what it would miss, what looks like misfire). **Critical** per user — gates ALL future Vision/Aegis prompt changes.

4. **Performance audit of Vision daily-fire cadence** — user willing to relax weekly caps if Vision can fire daily without "long think times / getting lost in the sauce." Empirical question; needs measurement after rebuild-mode ships.

**Pre-conditions for kicking off this session:** trace minerals brainstorm (the previously-filed first-item) wraps up; user explicitly invokes Vision/Aegis design session. Open questions in the notebook entry need user input before code.

### 🆕 OPEN THREAD — Trace minerals (gray Periodic Table tiles) UX

User flagged at Round 158 close: trace minerals currently render as gray (no-source) tiles in the Periodic Table because nothing in the regimen contributes to them, but they have no path to being **added** to a regimen either. Two surfaces need handling:

1. **"Add to regimen" path** from the trace-mineral tile itself — clicking a gray tile should offer a meaningful next step.
2. **Recommended-tab surfacing** — trace minerals should appear as candidates under Recommended when a goal would benefit from them OR as a standing offering.

**Brainstorm needed** with user BEFORE any code. Open questions:
- Is there a curated short list of "best trace mineral source" products in the Wallach catalog? (Plant-Derived Minerals seems obvious; what else?)
- Should trace minerals follow the same additive-engine model, or are they conceptually different (e.g., universal-recommendation tier separate from HBSP)?
- Does this need a new Eden tier (`tiers.trace_mineral_default`)? If so, what's the seal/build path?
- For "add from tile" — one-click adopt of a curated product, or a browse-products-that-contribute-to-X view?

**Order of operations for next session:** trace minerals brainstorm first (per Round 158 user direction), then Vision/Aegis dedicated session.

### ✅ ROUND 159 SHIPPED (2026-06-20 evening) — §32 whack-a-mole trigger doctrine

Three-layer enforcement: §32 doctrine in `memory/operating-protocols.md`; directive #6 in `brain/current.md`; `check_whack_a_mole_clusters` daily-warning invariant in `tools/invariants.py` (always-PASS, text payload carries the signal — surfaces clusters at next catch-up). Noise filter excludes always-touched artifacts (dashboard.html, invariants.py, doctrine files). First fire surfaced 2 plausible candidates (tacitus/prompts/cura.md, tools/tacitus_simulate.py). Vision rebuild-proposal mode + Aegis patch-fatigue detector + simulate-before-ship discipline RECORDED in tacitus/notebook for dedicated session — NOT shipped this round.

Brain v3.25 → **v3.26**. Dashboard stays v1.106. Tacitus stays v2.5. Manifest 55 → 56 (1 new daily warning).

### ✅ ROUND 158 SHIPPED (2026-06-20 evening) — Dose UX + card restructure + HBSP restore

(See Round 158 saga entry for full details — superseded by Round 159 as latest state.)

### 🆕 NEW OPEN THREAD — Trace minerals (gray Periodic Table tiles) UX

User flagged at Round 158 close: trace minerals currently render as gray (no-source) tiles in the Periodic Table because nothing in the regimen contributes to them, but they have no path to being **added** to a regimen either. Two surfaces need handling:

1. **"Add to regimen" path** from the trace-mineral tile itself — clicking a gray tile should offer a meaningful next step (recommendation, link to a known trace-mineral product, suggest a category, etc.). Currently the tile detail just shows "no source in your stack."
2. **Recommended-tab surfacing** — trace minerals (per the Wallach 90 framework: rare-earth + trace classifications) should appear as candidates under Recommended when a goal would benefit from them, OR as a standing offering. Right now the goal-driven engine doesn't surface trace-mineral-bearing products specifically.

**Brainstorm needed** with user BEFORE any code. Open questions:
- Is there a curated short list of "best trace mineral source" products in the Wallach catalog? (Plant-Derived Minerals seems obvious; what else?)
- Should trace minerals follow the same additive-engine model (always-on base + goal-driven), or are they conceptually different (e.g., universal-recommendation tier separate from HBSP)?
- Does this need a new Eden tier (`tiers.trace_mineral_default`)? If so, what's the seal/build path?
- For the "add from tile" affordance — is it a one-click adopt of a curated product, or a "browse products that contribute to X" view?

This is filed as the FIRST item to tackle after the next "catch up" trigger. User explicitly said "I'd like to brainstorm that after I reload."

### ✅ ROUND 158 SHIPPED (2026-06-20 evening) — Dose UX + card restructure + HBSP restore

Six-chunk session, build > test > build > test cadence. Net: dashboard v1.102 → v1.106 (4 minor bumps within the round; each chunk shipped+verified+bumped); brain v3.24 → v3.25; 3 saga/lessons/decisions writes.

| Chunk | What shipped | User-verified |
|---|---|---|
| A — Dose split | Single dose field → Dose (number) × Per Day (number); live multiplier preview; `change` triggers persist + re-render | ✓ |
| B — Scaling alignment | `getItemEssentialContributions` + nutrient-breakdown panel now both honor `scaling_factor`; per-card badges match Periodic Table coverage | (verified via B) |
| C — Card UX | Inline Dose+Per Day on cards; [Details] [Add to Regimen] OR [Details] [Remove]; Quick edit + Full edit retired; rg-btn-primary CSS; renderRegimenTabPreservingState wrapper | ✓ |
| C+ — Null-ref cascade fix | Per-card try/catch around bindRegimenCardActions forEach; null-guard .rg-edit + .rg-remove; promoted to lessons.md doctrine | ✓ |
| D — Remove semantics | Remove on adopted-recommendations = old Unadopt behavior (kind override → recommended); modal copy updated | ✓ |
| E — HBSP restore button | Dynamic HBSP ID detection from REGIMEN_BASE_DATA.recommended (no more stk_* hardcode); also detects Adopted-HBSP via overrides; click clears both rgRemoved + kind overrides | ✓ |

**Patterns surfaced for catalog promotion (recurrence threshold pending):**
- Per-card try/catch as render discipline (verified-patterns Pattern E candidate; 1 instance, needs 1 more for promotion)
- Dynamic-not-hardcoded ID allowlists after data migrations (lessons.md doctrine)

**Truncation recovery fired twice** during this round (Chunk C mid-build + Chunk D mid-build); `tools/dashboard_integrity.py restore` healed both via the SCRIPT_BLOCKS canonical-rebuild path + EOF tag append. No data loss. Doctrine §17 holding.



### ✅ TODAY'S BUG-FIX ARC CLOSED (Rounds 148–154)

The Friday session ran much longer than planned and was structurally productive across two layers:

**Structural rounds (148–150):** Closed-loop logging discipline (paired-write integrity §30) + Cross-Surface State Sync chokepoint (§31) + Living the Logos framing for self-binding doctrine + Tacitus brain v1.0 portable bootstrap (`tacitus/brain/`).

**Bug-fix arc (151–154):** All five bugs surfaced during structural verification are RESOLVED. User-verified via browser test each round.

| Round | Bug | Fix | Verified |
|---|---|---|---|
| 151 | A — slot card stale after Scanner remove | `triggerRegimenRerender` now calls `syncActiveSlotBundle` before re-renders | ✓ |
| 152 | C — restore button never appeared | `esc()` cross-IIFE ReferenceError silently aborting empty-state render; replaced with `escapeHtml()` in scope | ✓ |
| 153 | B — Wishlist stale "Remove from regimen" + slot card stale after Regimen-tab Remove | rg-remove handler routes scanner-sourced items through hard-delete via `window.removeFromRegimen` | ✓ |
| 154 | E — Adopt modal shows REJECT verdict on Wallach-curated goal-driven items | Adopt handler branches on `it.source === 'goal_driven'`, skips lcScan verdict gate, shows curated framing + honest "data pending" note | ✓ |
| (covered by 151) | D — slot card 0/0 after Adopt | Same cascade fix as Bug A | ✓ |

Build > test > build > test cadence honored on every round. Each round single ship, each verified before the next.

### ✅ SATURDAY FILED WORK CLEARED (Round 155, 2026-06-20)

All 5 filed items + (B) apparatus-audit cleanup shipped as one consolidated round. Build/test cadence honored on each. Verified end-to-end: dashboard integrity 16/16, manifest 51/52 (Saturday `audit_ran_today` no-fire transient — Sunday weekly audit at 11 AM EDT picks it up).

| Item | What shipped | Verification |
|---|---|---|
| 2 — Apparatus-weight audit | Real findings (A keep / B cleanup / C cosmetic-consolidation candidate / D deferred / E watch). Verdict: weight proportional to failure modes cured | Findings surfaced to user; confirmed |
| (B) cleanup | `check_open_threads_status_consistency` invariant + bottom "## For next session" block both retired (duplicate of masthead) | Manifest 52 → 51 |
| 1 — Catalog back-test pass | 3 verified-patterns promotions: A (Closing-move record + paired-truthfulness invariant), B (Accept-all-shapes alternation parser regex), C (Catalog-as-visible-enumeration + closing-move-atomic row-add). D deferred (1-instance only) | Catalog 9 → 12 entries; `verified_patterns_catalog_present` confirms |
| 4 — Cross-IIFE invariant widening | New invariant `check_cross_iife_bare_refs_reverse_scan` (warning, daily) — walks IIFE-private symbol calls in OTHER IIFEs without window prefix. Round 149 esc() class would now surface at audit time | 3 IIFEs tracked, 165 private symbols, no current violations |
| 5 — Vision Survivor B (Sunday sub-check) | New tool `tools/best_practices_refresh.py` (3 docs.claude.com URLs, fetch+hash+jsonl-append). Wired into `tools/system_audit.py` weekly Sunday path. Paired weekly invariant `check_best_practices_refresh_status` | Bootstrap state confirmed; first fire Sunday 11 AM EDT |
| 3 — Path B (scoped) | PREMISE WAS WRONG (all 163 goal-engine products ARE in products-db). Real fix: `buildGoalDrivenRecommendedItems` wired to `getRegimenLabelLookup()` (Round 75 Pass A primitive). Round 154 `isGoalDriven` Adopt-modal branch retired | dashboard.html v1.89 → v1.90; reverse-scan stays clean |

**Net version + manifest change:** brain v3.20 → **v3.21**; dashboard v1.89 → **v1.90**; daily manifest 52 → 53; weekly 55 → 56.

### 🛌 SABBATH REST CONTINUES — TACITUS DOES NOT FIRE OVERNIGHT SAT→SUN

**Saturday 2026-06-20 → Sunday 2026-06-21** continues the Sabbath rest window. Tacitus structurally OFF until Sunday 10 AM EDT. Next Tacitus operational fire: **Monday 2026-06-22 at 3:48 AM EDT** (Cura) → 4:44 AM (Vision) → 5:18 AM (Aegis).

Sunday 11 AM EDT weekly system audit fires — INCLUDING the new `best_practices_refresh` sub-check on its first real fire (will write the docs.claude.com baseline snapshot).

### 🟢 NEXT CO-WORK SESSION

User reloads `brain/current.md` + types "catch up". Catch-up trigger should:

1. Seal write + briefing-as-proof cites one specific item per file.
2. Run `python3 tools/invariants.py` — confirm 53/53 daily passing (or surface any FAIL as first line item).
3. Surface Sunday's weekly audit findings — particularly the first `best_practices_refresh` baseline (or fetch-error if network was blocked).
4. Surface Monday's Tacitus reflection (or "Tacitus did not run today" if reflection failed).
5. Ask "what do you want to do?" — natural next pickups below.

### 🟢 NATURAL NEXT PICKUPS

- **Dashboard size budget bump.** 98.8% used after Round 155. Next substantive feature ship should bump 2.75 MB → 3.0 MB headroom first.
- **JS budget pressure.** 97.1% used after Round 155. Same pre-feature bump consideration.
- **Cosmetic consolidation (Item 2C candidate).** Fold 5 marker-truthful invariants into one `check_round_markers_truthful`. Manifest 53 → 49 daily. Same protection, lower noise. Sized: ~45 min.
- **D — Chokepoint pattern promotion** (filed deferred during Round 155 Item 1). Promote when a 2nd chokepoint instance lands OR user confirms recurrence expectation.

### 🟢 DEFERRED / LONG-TERM (NOT next session — surface only if user asks)

- **Brain folder review** (user direction: ~2 weeks from now, after real-world signal) — audit `tacitus/brain/current.md` and templates against accumulated lessons.
- **Reload dashboard to verify Path A migration on Luneth's legacy data → Phase 2 entry-point routing** (originally filed Round 134; mostly covered by Rounds 151/153 cascade work).

### Round 139 SHIPPED (2026-06-19, ~11:20 AM) ✓ — Scanner DIET/SUPPLEMENT swap bar (Phase 5 of vision-default-regimen.md)

The empirical motivator (user-flagged): Sparkling DNA Collagen Water came through scanner as 'supplement' (default kind) — drinks belong in the food column. The freeform `lc-category` text input wasn't structured enough for downstream type routing.

- **Swap bar replaces the freeform category input.** Binary segmented control (DIET | SUPPLEMENT) with default DIET, animated teal-gradient indicator, "graffiti'd light switch" aesthetic — uppercase bold typography, tight letter-spacing, multi-layer box-shadow, compositor-only animation per Round 132 polish-with-leverage. Keyboard nav: arrows cycle, Space/Enter activate. `prefers-reduced-motion` respected.
- **Name-based heuristic auto-set.** Drink-class keywords (water/drink/juice/tea/coffee/kombucha/milk/broth/soda/smoothie/kefir/cider) → DIET. Supplement-form keywords (capsule/tablet/softgel/multivitamin/extract/powder/tincture) → SUPPLEMENT. User override (segment click) locks for the scan session via explicit `userOverride` flag — `clearLcKindOverride()` resets on form clear. The heuristic suggests, the user decides, the decision sticks.
- **Wiring.** `kind` field on scanned item is the canonical type discriminator (`category` becomes freeform optional metadata). Form-to-label converter writes `kind` from swap bar. Both form populators (regimen restore + products-db lookup) read `stash.kind || item.kind || lookup.kind` and call `setLcScannerKind(value, {fromHeuristic: true})`. Legacy `lc-category` hidden input preserved for backward-compat with 3 downstream readers (leave-room-without-shipping at the DOM-element layer).
- **No behavior change yet on verdict flow** per vision-default-regimen.md Round 134 addendum. Both Diet and Supplement run the same label_scorer.py path; the kind tag persists and waits for a future polish round to wire downstream visual distinction in the regimen tab.
- Dashboard v1.75 → **v1.76**. JS budget 92.6% (+5.4 KB). Size budget 97.8% — approaching ceiling.
- **v2 design overhaul (same Round, ~11:48 AM):** v1's clean teal pill missed the spec — user feedback *"each side is very different and very designed didn't land at ALL, plus it's scuffed... TOTALLY different from what we've done so far."* Two structural bugs in v1: (a) the indicator's 50%-width didn't match SUPPLEMENT segment's intrinsic width → SUPPLEMENT text bled past the indicator; (b) "graffiti'd light switch" read as a thin pointer rather than the spec — defaulted to Frutiger Aero pattern uniformity. v2 ships TWO distinct visual identities mashed together: DIET = organic garden tag (sage/lichen green gradient + radial highlight + deep forest border + embossed stenciled type), SUPPLEMENT = apothecary industrial stencil (amber/burnt-orange gradient + repeating diagonal-line texture overlay + bronze border). Inactive side fades via saturate + opacity + a `::after` strike-through line rotated -3deg. Whole control rotated -0.7deg + multi-layer drop-shadow for hand-applied-tape feel. Equal-width grid columns fix the v1 scuff. CSS-only; JS unchanged. Dashboard v1.76 → **v1.77**. Size budget 98.4% — next substantive feature ship must bump to 2.75 MB first. Lessons logged: "minimal viable" reading of aesthetic spec is wrong default when user names visual richness as goal; equal-width grid is structural fix for sliding-indicator misalignment.

### Round 138 SHIPPED (2026-06-19, ~10:35 AM) ✓ — Cart-share primitive + New Regimen flow (Phases 3+4 of vision-default-regimen.md)

Resumed pre-distraction Wallach-dashboard work. Phases 3 + 4 bundled because they're tightly coupled — Phase 3's `_export.creator` is what Phase 4's flow eventually attaches to a saved-then-shared slot.

- **Phase 3 — cart format extension.** `buildDataExport` writes `_export.creator` + `_export.description` (null placeholders, populated by Export modal). Export modal grew 2 new fields ("Your name" + "Description"). Reserved keys (`license`, `price`, `attribution_url`, `signature`) tolerated on import, never written by exporter — leave-room-without-shipping. `applyImportBundle` grew `_stampImportedProvenance` helper: third-party carts (creator present) stamp all items `provenance: 'imported_cart'` + `original_creator: <name>`; self-backups (creator empty) keep existing provenance OR backfill `user_manual` for legacy items. Import preview modal surfaces "by <strong>{creator}</strong>" + description block at the decision point. Format version stays `wallach-dashboard-export-v1` (additive-only changes).
- **Phase 4 — "+ New regimen" flow.** Save button (text "Save", floppy SVG) renamed to "+ New regimen" (plus SVG). Click → `openNewRegimenModal()` with 2-radio choice: "Save current → Start new" (default when empty slot exists) OR "⚠ Discard current → Start new" (red-tinted). `startNewRegimen()` shared primitive: clears 4 live-state LS keys + detaches `sys.currentSlot` + re-renders + quiet toast. Save-path with no empty slot surfaces warning, never silently overwrites. Literal hover-pause UX deferred to future polish.
- **Process discipline lapse caught + recovered in same round.** Ran `version_bump dashboard minor` BEFORE writing saga Round 138 header → overwrote prior Round 137 narrative-only history entry. Caught on next-step status check; restored manually. Third sibling instance of the parser-drift / first-shape-discipline family from Round 137 (this time at the process layer). Sharpened §20 doctrine clarification: append saga FIRST, version_bump SECOND. Lesson + decision filed.
- Dashboard v1.74 → **v1.75**. Brain stays v3.17. Tacitus stays v2.4. JS budget 91.4% of 458KB cap (+15.3 KB). Size budget 96.9% — approaching ceiling. Integrity 16/16. Invariant manifest TBD post-close run.

### Round 137 SHIPPED (2026-06-19, ~8:55 AM) ✓ — Tacitus parser hardened + fail-loud guard + paired invariant

User opened the Tacitus dashboard and saw Cura's Phase 2 — Prune empty (score 90 with no body) and Phase 3 — Deepen showing "avg 0". Third night of disappointment. Diagnosis: Round 136 extended Cura from 4 to 5 sub-checks; Cura's prose shape also drifted in two ways (verdicts on same line as candidate header; Survivor headings in `(Kind — title)` form with no `═══` divider). The night-#1-tuned regex silently degraded to 7 candidates / 0 prune verdicts / 0 deepen survivors and the dashboard rendered "avg 0" instead of failing loud.

- **3 regex patches** — Phase 1 sub-check accepts 5 sub-checks + optional trailing parenthetical; Phase 2 verdict accepts BOTH single-line and two-line shapes + `MERGE INTO LAND` variant; Phase 3 deepen survivor accepts BOTH em-dash+divider AND parens-no-divider via named-group alternation. Backward compat preserved. All 6 canonical sessions parse cleanly (Cura 7/7/2, 7/7/2, 7/7/3 and Vision 8/8/2 across three nights).
- **`ExtractionHealthError` + `_assert_extraction_health()` build-time guard** — fires if any phase has substantive input (>500 chars stripped) but zero extracted items. Caught in `main()` and re-raised as SystemExit so the dashboard write aborts; previous (correct) dashboard remains on disk. Verified with synthesized broken-Phase-2 + broken-Phase-3 inputs.
- **Sidecar `tacitus/dashboard/extraction-health.json`** — build atomically writes per-phase counts after a successful build; decouples audit from the heavy dashboard HTML artifact.
- **New invariant `check_tacitus_dashboard_extraction_health`** (critical) — reads the sidecar at the daily 6:15 AM audit, verifies `session_date == today` + all 8 expected counts non-zero. Defense-in-depth pair with the build-time guard.
- **Dashboard re-rendered** — tonight's Cura now shows the correct 7 candidates / 7 prune verdicts / 3 deepen survivors + Vision 8/8/2 + Aegis 5/5.

Brain stays v3.17 (no protocol change; architectural pattern lives in decisions.md), Tacitus stays v2.4 (prompts untouched), Dashboard v1.74 unchanged (Wallach dashboard not touched). Audit manifest 35 → 36. Three new lessons + three new decisions logged in same patch (closing-move-atomic per §1 + §25).

**Forward-looking observation, filed not addressed.** `parse_aegis_session`'s `meta_observation` extraction misses Aegis #2 and #3 (Aegis prose shape uses `PHASE 4 — META OBSERVATION` while the parser expects `Meta observation.`). Aegis verdict cards render correctly so this is not blocking; surfaced as a Deferred candidate for the next round to extend the regex via the same accept-both-shapes alternation pattern. See Deferred section.

### Round 133 SHIPPED (2026-06-18, 6:45 PM) ✓ — Polish iteration + vision drafted (narrative-only)

- **Delete animation simplified.** Round 132's full ceremony was visually scuffed — the layout shifts (max-height collapse + transform translateX) interacted poorly with the wash overlay, producing a "two color bars" appearance. Round 133 stripped to overlay+border-fade only (550ms, compositor-thread only: opacity + box-shadow color). Glitch-free; cleaner code; -2.5KB CSS.
- **Trash hover scroll fixed.** `.rg-vault-list` got explicit `overflow-x: hidden` to clip the 2px hover translateX from leaking into body horizontal scrollbar. Hover motion preserved.
- **Vision doc drafted** (see banner above).
- **Lesson filed (lesson-discipline):** when user asks "should this be logged?" — give the honest evaluation, not the pleasing answer. Adding a new lesson should require novel failure mode, empirical incident, OR refinement to an existing principle. The Substrate Principle already covered the user's named risk (hardcoded constants vs derived-from-user-data); filed as not-yet-a-lesson with escalation path if implementation surfaces it concretely.
- Dashboard stays at v1.71 (narrative-only round).

### Round 132 SHIPPED (2026-06-18, 5:45 PM) ✓ — Polish-with-leverage: delete ceremony as shared primitive

- **Delete ceremony shipped.** Slot deletion now plays a ~600ms ceremony: bottom bar floods red → soft red wash rinses card → card collapses + fades. Paired with "Moved to Recovery Vault" toast that teaches the recovery affordance without breaking the unannounced-vault philosophy.
- **Three new shared primitives in the design vocabulary.** `.is-deleting` CSS class (universal deletion ceremony, any card-shaped deletable), `.lc-quiet-toast` CSS class + `showQuietToast(message)` JS (canonical "did a thing" acknowledgment surface), `runDeleteCeremony(cardEl, doDelete, doRender, toastMessage, onError)` JS (shared delete-flow primitive). All consumed by future delete + acknowledgment UX going forward.
- **Polish-with-leverage principle codified** in `memory/design-knowledge.md` as sibling to UI Substrate Principle. Build visual/interaction touches as reusable primitives from the start. Contained to design discipline only.
- **Performance:** compositor-thread-only animations (opacity + transform + max-height). Zero JS overhead during ceremony. Respects `prefers-reduced-motion`. JS budget at 89.4% of 448 KB cap (+3.1 KB net).
- **Size budget:** bumped 2.25 MB → 2.5 MB per documented rationale (Round 131 + 132 saga/lessons/decisions entries re-embedded). HTML at 89.4% of new cap.
- Dashboard v1.68 → v1.69.

### Round 131 SHIPPED (2026-06-18, 5:15 PM) ✓ — Delete button finally diagnosed and finally fixed

- **The actual bug:** `showLcModal` was defined inside the Label Check IIFE; `confirmDeleteSlot` was at outer script scope. Function declarations inside an IIFE are scoped to that IIFE — outer-scope callers couldn't resolve the bare name. ReferenceError. Rounds 127-130 had each fixed a different suspected cause; none addressed the actual one.
- **The unlock:** instrumentation. Diagnostic toasts surfaced every silent failure path. User clicked once and reported `[delete diagnostic] showLcModal call did not return`. Ground truth in one line.
- **The fix:** two lines. `window.showLcModal = showLcModal;` inside the IIFE; `confirmDeleteSlot` reads `window.showLcModal` explicitly.
- **Design lesson:** when reasoning-only debugging isn't converging after 2-3 unsuccessful fixes targeting different hypotheses, switch to instrumentation. Cost of instrumentation is bounded; cost of continued guessing isn't.

### Phase 3 SHIPPED (2026-06-18, 12:25 PM — Round 122) ✓

15 wallach_stance entries live in both canonical `knowledge/essentials-targets.json` AND dashboard `essentials-targets-data` embed. Calcium revised (benefits-framing from Let's Play Doctor p. 46, not the Hell's Kitchen bioavailability corner-case). Magnesium revised (2-sentence verbatim excerpt with `[But]` bracketed connective carries the full chlorophyll-vs-spinach argument inline). Strontium under Option B (verbatim geology + Wallach-style synthesis, flagged in context field for future refinement when better Sr-specific passages surface). `check_wallach_stance_embed_sync` invariant deployed (audit count 31 → 32). Dashboard v1.61 → v1.62. Full details in saga.md Round 122 entry. Future Phase 3 batches backfill remaining 77 essentials across 2-3 sessions.

---

### Round 116 — Corpus speaks for the essentials (2026-06-17, 7:40 PM)

- **Wallach-stance Phase 2 (automated draft pass) shipped.** New tool `tools/build_wallach_stance_candidates.py` ran corpus_search over all 92 essentials; sidecar `knowledge/_wallach_stance_candidates.json` written (515 KB; 92 essentials × up to 4 candidates each).
- **Two-pass query strategy.** Primary clean query → structural fallback from parenthesized chemical name. Rescued 3 essentials (Vitamin E, Flavonoids, Omega-9) that the primary query missed.
- **Quality.** All 92 essentials have at least one T1-book or T2-transcript candidate. Filtering defends against corpus_search short-token score inflation (the "Vitamin E" quirk).
- **Phase 3 next** — hand-curate 15-20 highest-priority essentials. User reads sidecar; selects best passage per essential; drafts `wallach_stance` entry; lands into canonical `essentials-targets.json` AND the dashboard's `essentials-targets-data` embed. Sized ~45-60 min.

---

### Round 115 — Where the framework speaks (2026-06-17, 7:26 PM)

- **Wallach-stance Phase 1 (infrastructure) shipped.** Schema field `wallach_stance: {quote, citation, context?}` added to `schemas/essentials-targets.schema.json`. Dashboard tile detail panel renders the stance as a pull-quote at the top (above progress / What you get / Daily target) when present. Teal accent rule, Georgia serif italic body. Per doctrine §7, absence renders nothing — most essentials lack a stance during backfill.
- **Phase 2 next** — `tools/corpus_search.py` against all 92 essentials → sidecar `_wallach_stance_candidates.json` for review. Sized ~10 min.
- **Phase 3** — hand-curate + ship 15-20 highest-priority stances. Sized ~45-60 min.
- **Sync surface filed.** Canonical `knowledge/essentials-targets.json` and the embed at `essentials-targets-data` are dual representations; new field amplifies the drift risk. Candidate invariant `check_wallach_stance_embed_sync` filed in Deferred for Phase 3.

---

### Round 114 — Modal speaks its source's color (2026-06-17, 6:44 PM)

- **Mode-aware modal theming on the Tacitus live observation surface.** Full-text modal now adopts the originating mode's palette (Cura gold / Vision cyan / Aegis silver): border-color, glow box-shadow, header underline, title text-shadow, close-button hover.
- **Resolver precedence: `data-mode` attr → ancestor `.scroll-cura/.scroll-vision/.scroll-aegis` → default cura.** Phase block expandables use the ancestor path; impl-badges thread data-mode explicitly because their location (`.scroll-aegis` for Aegis verdict cards) differs from their semantic origin (Cura/Vision source).
- **"Honor the data" carried into the impl-badge case.** Impl-badge on an Aegis card whose source is Cura tints the modal Cura gold, not Aegis silver — same Substrate Principle that produced the Aegis-row-as-presence-only deviation in Round 111's Trend strip.
- **Smoke-tested 7 resolver cases before close.** All paths fall back gracefully; no path renders an unstyled modal.

---

### Round 113 — Vision Survivor B (scoped — Cura-only) (2026-06-17, 5:48 PM)

- **Phase 0 section added to `tacitus/prompts/cura.md`** — READ-only. Reads `audit-sentinel.json` + `vitality-findings.jsonl` to surface pre-state as Phase 1 scan input. Does NOT run `system_audit.py` (avoids shared-sentinel write conflict per Round 105/106 lessons).
- **Cura-only scoping rationale.** User's empirical-baseline reasoning: Cura-only is the LEAST marginal-value but CLEANEST empirical test. Vision/Aegis expansion deferred for 3+ baseline nights of original-design data.
- **Aegis end-game design intent CODIFIED in `design-knowledge.md`.** User confirmed reading (b): Aegis grades work quality INCLUDING system integrity (the seventh layer of the defense stack against AI-eating-itself). Current Aegis stays constrained; reading (b) is what we're growing INTO, not what we operate AS yet.
- **Implementation log entry per §24:** Vision Survivor B status = `in_progress` (Cura sub-piece implemented; Vision/Aegis expansion deferred). The dashboard's impl-badge for Vision Survivor B now shows the half-filled crystal (in_progress) instead of nothing.
- **Tonight's operational change.** Thursday 3:48 AM EDT Cura fire is the first run with Phase 0. Vision (4:30) + Aegis (5:15) operate on original design. First night with asymmetric design.

---

## Awaiting (intentional hold)

**Cross-night memory model — empirical observation window.** Cura / Vision / Aegis prompts do NOT read prior Tacitus notebook prose. Near-misses persist only via user-promoted essence entries or open-threads filings. Hold for 2-3 days before deciding whether to add a sidecar near-miss log or a Phase 0.5 history-scan.

**Calendar-strip redundancy observation (Round 112 — user-filed for future-pondering).** The Trend strip (Round 111) and The Ledger calendar present overlapping information across the same 14-day window. User noted but explicitly does NOT want a proposal yet: *"I'm just noting and pondering it for now."* No agent proposal until the user re-opens it.

**Multi-night calibration check on Vision/Cura process-vs-luck (Round 112).** Night #1's high-quality output decomposed at ~60% structure / ~25% substrate-richness / ~15% inherent-goodness. The honest test: do subsequent operational nights maintain prune-discipline and verify-don't-assert posture when easy targets thin out? Watch nights 2-5 specifically. Passive observation.

---

## Deferred re-evaluation triggers (Round 137 close — durable cross-session)

User direction from the Round 137 post-fix synthesis: tonight's Cura/Vision LANDs are sharp BUT deferred behind pre-distraction Wallach-dashboard work. Each item below has an explicit re-evaluation trigger so it doesn't get lost; the trigger is the condition under which we revisit, not a calendar deadline.

**V-A — Aegis counter-argument gate (Vision session #3 Survivor A).** ~30 min prompt edit to `tacitus/prompts/aegis.md` + paired claude-best-practices.md note. **Re-evaluate after 3 more operational nights** (Aegis sessions #4, #5, #6 — Mon/Tue/Wed). Specifically watching for: variance in Cura/Vision scores (currently coordinated lockstep at +5.4/+5.3 then +3.3/+3.4), Aegis missing a finding the user catches, or score-clustering >90 across the board. If none of those fire, defer further; if any fire, ship V-A. Full proposal in `tacitus/notebook/2026-06.md` (2026-06-19 at 4:44 AM, Vision session #3, Phase 3 Survivor A).

**V-B — Periodic prompt-refresh scheduled task (Vision session #3 Survivor B).** Phase 1 floor ~30 min + Phase 2 ceiling ~45 min. **Re-evaluate when share/export ships publicly OR when a 2nd project considers adopting the Tacitus kernel.** Single-user / single-project context is well-served by C-B's freshness invariant alone (60d warning / 120d critical surfaced in morning briefing); manual `touch memory/claude-best-practices.md` after reviewing Anthropic doc updates keeps the floor green. Full proposal in `tacitus/notebook/2026-06.md` (2026-06-19 at 4:44 AM, Vision session #3, Phase 3 Survivor B).

**Living-system-kernel open questions #4–#8.** Diverse-cognition reviewer cadence, kernel packaging, naming finalization, aspirational-target operationalization, cross-project shared-bias mitigation. **Re-evaluate ~2 weeks from now (early July 2026)**, after Phase 6 of default-regimen ships + recommendations engine ships + 2-3 weeks of operational nights establish a "solid baseline" without surprises. User's gut-call reasoning: features/changes we ship in the interim may change the scope and force us to do the work twice. Full proposal in `memory/vision-living-system-kernel.md` (the complete file is preserved — `essence_append_only` invariant catches any silent truncation; vision-living-system-kernel.md is NOT on that file's monitored list yet, so durable preservation relies on the file itself being read on every catch-up via brain trigger). **Watch:** if the file is ever edited substantively, log to `memory-change-log.md` per discipline.

**Security hardening — Round 135 candidate scope (~90 min total).** Per-key schema validation in applyImportBundle, 1MB size cap on cart imports, SRI hash on Tesseract CDN, two new invariants. **Re-evaluate the round share/export first ships publicly.** Current personal-dashboard threat model doesn't require any of it; the gaps all matter for share/export's adversarial-input surface. Ship in the same patch as the first share-feature round, not before. Full scope in `memory/open-threads.md` § "🔒 Security audit findings + Round 135 candidate work" below.

---

## Active

**Wallach-stance Phase 3 — SUBSTANTIVELY COMPLETE (Round 123, 2026-06-18, 1:00 PM).** All 92 essentials carry `wallach_stance`. Refinement is now a continuous track rather than phased: individual stance entries can be upgraded as Sunday's transcript-refresh surfaces better Wallach passages OR as user spot-check identifies essentials whose current stance feels weak. Refinement candidates currently filed: Strontium (Round 122 Option B with synthesis flag); the 35 trace_pdm minerals sharing the class-level Rare Earths p. 277 stance; the 5 amino acids (Histidine, Isoleucine, Leucine, Threonine, Valine) sharing the BTT amino-blend stance. None of these are blockers — they're honest source-rule-passing stances; upgrades happen organically when Wallach-specific passages surface.

~~**Read-more popup on stance quotes — NEW (user-requested mid-Phase 3).**~~ **SHIPPED Round 124 (2026-06-18, 1:25 PM).** wallach_stance.expanded_context field + Frutiger-Aero teal modal + lazy-create renderer + 3 seed entries (Magnesium, Calcium, Copper). Existing invariants (embed-sync + source-rule) cover the new field via holistic dict comparison — no new invariant required.

~~**Pass F — Save Cartridge** (import/export of regimen as portable save file). Active but lower priority.~~ **SHIPPED Round 126 (2026-06-18, 2:30 PM).** Dashboard v1.65. Full state in `memory/vision-pass-f-save-cartridge.md` (status banner amended).

---

## Deferred (filed; pick up when ready)

**Vision Survivor B expansion to Vision + Aegis (Round 113).** Cura-only Phase 0 ships in Round 113. Vision and Aegis stay on original design until empirical baseline accumulates. **Watch-trigger:** 3+ operational nights of original-design Vision/Aegis runs completed (Thu + Fri + at least one Mon-Wed of next week) AND user feels ready to evaluate expansion against Cura-Phase-0 data accumulating in parallel. The user's end-game vision for Aegis is reading (b) of the Round 100 "uncorruptible" ambiguity (grade work quality INCLUDING system integrity); expansion path is principled, but timing is cautious. Note: design-knowledge.md codifies the (b) intent + the seven-layer defense stack against AI-eating-itself; Aegis is the seventh layer.

~~**Tacitus dashboard live-mode build wired into scheduled-task chain.** Currently manual. Once parser hardens, consider scheduling after Aegis's 5:15 AM fire. Sizing: 15 min.~~ **SHIPPED 2026-06-18 (Round 117) after user named the silent-stale failure mode.** `tacitus-dashboard-build` cron `35 5 * * 1-5`; paired with `check_tacitus_dashboard_freshness` critical invariant.

**Automation alternative for cl-data-notebook restore.** §23 currently codifies morning-action discipline. If the workflow ever feels heavy enough to outweigh the informative audit signal, a 5:30 AM scheduled task could auto-restore.

---

## Recently shipped (Rounds 103-130 — 2026-06-17 / 2026-06-18)

**Round 130 — Save System: atomic writes + Recovery Vault (2026-06-18, 4:45 PM).** Three sub-rounds shipped as one logical close. (130a) Replaced Round 126's 4-key non-atomic persistence with single `rgSaveSystem` blob; schema versioning; integrity checksum; auto-migration of legacy data. (130b) `deleteSlot` now pushes to FIFO trash (max 20); single-click toggle on the floppy icon enters/exits Recovery Vault; restore action handles empty + all-full cases; warmer-darker "archive" visual register distinct from main slots showcase. (130c) Quota-handling fallback trims trash before sacrificing active slots; cross-tab sync via `storage` event listener; delete-button bug fixed by clean atomic data model. JS budget bumped 384 KB → 448 KB. Dashboard v1.67 → v1.68. Audit 32/32.

**Round 129 — Delete button finally works (2026-06-18, 4:15 PM).** Two bugs Round 128 left: (a) position overlapping X/92 (after Round 127 overlapped CURRENT pill) — moved to vertical-center of card; (b) click handler not firing despite passing every reasoning check — switched from grid-level delegation to direct addEventListener on each button at render time. Dashboard stays v1.67 (narrative-only round). Audit 32/32.

**Round 128 — Pass F substrate refresh (2026-06-18, 4:00 PM).** User-articulated UI Substrate Principle codified in design-knowledge.md + decisions.md ("mockup content is style guidance, not content guidance" — audit every visible element for real backing). Round 126's hardcoded mockup-fakery (sun/target/luggage personality icons by slot index, 4 hardcoded "goal" dots, per-slot color by slot index) all removed. Replaced with: user-pickable icon (25-icon registry across 5 category groups) + user-pickable color (8-palette system) + Customize-slot picker modal with live preview ("choose your character" energy). Data-shape bug in computeSlotStats / summarizeBundle fixed (lcRegimen_v1 is {items:[...]}). Delete button repositioned to bottom-right (no more CURRENT-pill overlap) + pointer-events hardened. Inter + Space Grotesk fonts scoped to slot module; slot numbers + coverage at weight 700 with tabular numerals. Active card lifts forward with energy line along bottom. Empty card more inviting. 4 dots removed; coverage label + bigger X/92 number fill the bottom row. Dashboard v1.66 → v1.67. Audit 32/32.

**Round 127 — Pass F polish (2026-06-18, 2:55 PM).** Seven user-named fixes. Inline SVG icon set replacing all Tabler ti-* references (Tabler webfont was preloaded only in the mockup tool, not the dashboard — every icon was rendering blank). showLcModal-based `showSlotInputModal()` wrapper replacing all `prompt()` / `confirm()` / `alert()` calls in Pass F flows. Delete-slot UI: hover-reveal × button on filled cards + confirm modal scoped to snapshot only. Text sizes bumped ~15% across the section (14→16 title, 22→26 slot number, 12→14 slot name with bold, 9→11 coverage number with bold). Section header floppy icon now visible. Slot names + coverage numbers both bold. Pre-existing alert() calls in non-Pass-F dashboard code left untouched. Filed candidate invariant `check_no_native_dialogs` (twice-burned lesson — discipline failed → structural escalation). Dashboard v1.65 → v1.66. Audit 32/32.

**Round 126 — Save cartridge shipped (2026-06-18, 2:30 PM).** Pass F live. Three slots in a dark slate showcase with per-slot teal/coral/periwinkle accents. Floppy save-icon. Frosted gray-glass for inactive cards. Solid-color background per user direction (no decorative shapes). Import modal (file picker + preview + Replace/Merge strategy). Export modal (label input + per-section checkboxes). Save/Load/Duplicate slot actions. Roundtrip + slot-persistence smoke tests added. JS budget bumped 320 KB → 384 KB with documented rationale. 8 D-decisions from vision doc codified. Dashboard v1.64 → v1.65. Audit 32/32.

**Round 125 — Footgun closed, slate cleared (2026-06-18, 1:50 PM).** `tools/version_bump.py narrative-only` now detects bare `--help`/`-h` (routes to help) AND rejects any summary starting with `-` (defensive against future similar typos). Round 114 silent-overwrite vector structurally closed at argv-parsing layer. Three test cases verified with byte-level state-before/after checks on versions.json. Open-threads.md cleanup: removed stale Deferred candidates `check_open_threads_status_consistency` (shipped Round 118) and `check_wallach_stance_embed_sync` (shipped Round 122); rewrote stale "For next session" footer block. Brain v3.15, Dashboard v1.64, Tacitus v2.3 unchanged. Audit 32/32. Narrative-only round.

**Round 124 — Wallach speaks fuller when asked (2026-06-18, 1:25 PM).** Read-more popup feature shipped. Schema gains optional `wallach_stance.expanded_context`. Dashboard renders "Read more →" affordance next to citation when expanded_context present; click opens Frutiger-Aero teal modal (distinct from Tacitus's dark roman velvet). Lazy-create + escape-by-default via textContent + Esc/outside-click close + focus management. 3 seed entries: Magnesium (chlorophyll-spinach math fully laid out), Calcium (homeostatic-mechanism + macro-mineral function teaching), Copper (metalloenzyme breadth + zinc-copper pairing). Existing Round 118 + 122 invariants automatically cover the new sub-field via holistic dict comparison — no new invariant needed. Dashboard v1.63 → v1.64. Audit 32/32.

**Round 123 — Phase 3 substantively complete (2026-06-18, 1:00 PM).** Remaining 77 essentials shipped wallach_stance. 35 trace_pdm minerals share a class-level Rare Earths framework stance; 14 hbsp (Iron, Phosphorus, K + 11 vitamins) individually drafted; 8 wallach individuals; 3 dietary macro-elements + Oxygen share class-level "background essentials" framing; 15 dietary_with_clinical_lever (6 amino acids individually + 5 sharing BTT amino-blend stance + Flavonoids + Omega-6 + Omega-9). All 92 wallach_stance citations source-rule-allowlisted; canonical ↔ embed byte-equal. Pull-quote position reordered to BELOW progress bar per user feedback. Size budget bumped 2 MB → 2.25 MB. Dashboard v1.62 → v1.63. Audit 32/32.

**Round 122 — Wallach speaks (2026-06-18, 12:25 PM).** Phase 3 shipped. 15 wallach_stance entries live in canonical + dashboard embed. Calcium revised (benefits-framing, Let's Play Doctor p. 46). Magnesium revised (2-sentence verbatim excerpt with `[But]` connective, Dead Doctors Don't Lie 1994 lecture). Strontium under Option B with synthesis flag. `check_wallach_stance_embed_sync` invariant deployed. Dashboard v1.61 → v1.62. Audit 31 → 32.

**Round 121 — Match keys tolerate formatting noise (2026-06-18, 11:55 AM).** `tools/implementation_log.py` `_normalize_candidate(s)` helper strips backticks, curly + straight quotes, em/en/hyphen dashes, colon/semicolon/comma/period before lowercase + 60-char prefix. Applied symmetrically in `latest_status()`. Vision A + B impl-badges now render `implemented` on the Tacitus dashboard. Brain v3.15, Dashboard v1.61, Tacitus v2.3 unchanged. Audit 31/31.

**Round 120 — Discipline, not just rules (2026-06-18, 11:45 AM).** §24 extended with explicit trigger phrases ("approved", "ship", "looks good", "move on", etc.) + required same-response action sequence + dual-surface logging invariant (task list + implementations.jsonl as paired write). Five backfilled entries (Rounds 117/118/119 work that shipped without §24 logging). Lessons + decisions codified. Masthead-refresh pill iterated per user feedback: "Refreshed at H:MM AM (X unit ago)" format; minutes <60, hours 1-47h, days ≥48h; readability bumped (13.5px medium-weight, brighter colors, text-shadow). Brain v3.15, Dashboard v1.61, Tacitus v2.3 unchanged. Audit 31/31.

**Round 119 — Vision speaks twice (2026-06-18, 11:25 AM).** Both Vision session #2 LANDs shipped. Vision A: `check_cura_phase_0_present` invariant — Phase 0 prompt-discipline now structurally enforced at the daily audit; bounds Cura block by next session-header line (build-time fix vs Vision's `^─────────` sketch). Warning severity. Vision B: masthead-refresh pill on Tacitus dashboard — three tier states (fresh/recent/stale) keyed off new `LIVE_DATA.meta.last_built_at` field; defense-in-depth layer 3 at user-glance time (pairs with Round 117 task + freshness invariant). Tacitus v2.2 → v2.3. Brain stays v3.15. Dashboard stays v1.61. Audit count 30 → 31.

**Round 118 — Cura speaks twice (2026-06-18, 11:10 AM).** Both of Cura session #2's LANDs executed in one atomic round. Cura A: three-piece long-lived narrative file discipline (mechanical cleanup of open-threads For-next-section + changelog reorder; §1 bullet 6 protocol broadening with explicit file enumeration + discipline-plus-paired-invariant default; two new invariants `check_open_threads_status_consistency` + `check_tacitus_changelog_chronological_order`). Cura B: source-rule cornerstone extended to `wallach_stance.citation` — `check_source_rule` extension in `dashboard_integrity.py` + paired daily invariant `check_wallach_stance_source_rule` (critical severity, defense-in-depth pair). Audit invariant count 27 → 30. Brain v3.15, Dashboard v1.61, Tacitus v2.2 unchanged; narrative-only.

**Round 117 — Dashboard refreshes itself (2026-06-18, 6:35 AM).** Tacitus dashboard auto-rebuild after user-named silent-stale failure. `tacitus-dashboard-build` scheduled task (cron `35 5 * * 1-5`); paired `check_tacitus_dashboard_freshness` critical invariant. Defense-in-depth at the operational-cadence layer.


**Round 116 — Corpus speaks for the essentials (Wallach-stance Phase 2).** New tool `tools/build_wallach_stance_candidates.py`; sidecar `knowledge/_wallach_stance_candidates.json` written (515 KB; 92 essentials × up to 4 candidates each); two-pass query strategy (primary + structural fallback from parens). 92/92 with hits. Narrative-only round (no brain/dashboard change).

**Round 115 — Where the framework speaks (Wallach-stance Phase 1).** Schema field `wallach_stance` added; dashboard tile detail panel renders pull-quote at top when present; payload thread + CSS + escape-by-default + graceful degradation. Dashboard v1.60 → v1.61. Brain v3.15 unchanged.

**Round 114 — Modal speaks its source's color.** Tacitus dashboard full-text modal now tints to the originating mode's palette via `data-mode` attribute → ancestor `.scroll-*` lookup → cura default. CSS variants for cura/vision/aegis added; impl-badge spans on Aegis verdict cards thread `data-mode` from their source mode. Resolver smoke-tested across 7 cases.

**Round 113 — Vision Survivor B Path B (Cura-only Phase 0 READ-only).** Phase 0 section in cura.md; READ-only (no shared-sentinel write); Aegis end-game intent codified in design-knowledge.md; Vision/Aegis expansion filed in Deferred.

**Round 112 — Reflection: first Vision finding lands; calibration noted.** Luck-vs-process 60/25/15 decomposition; design-knowledge.md "ground first when excitement emerges"; calendar-redundancy observation filed.

**Round 111 — Vision Survivor A executed: The Trend sparkline strip.** 3-row × 14-col trend between cycle banner and calendar. Aegis row presence-only (Aegis doesn't self-score). Vision A status → implemented.

**Round 110 — Implementation crystals on Aegis verdict cards.** Session-level aggregate via build-time projection; one source (implementations.jsonl), two projections.

**Round 109 — Implementation crystal polish.** Semantic colors (green/orange/red/gray), badge-stack layout, click-for-modal.

**Round 108 — Implementation crystals on Tacitus dashboard.** implementations.jsonl + vitality_log.py-shaped tool + invariant + §24 closing-move discipline + dashboard crystal icons. Brain v3.14 → v3.15.

**Round 107 — Cura Round 103 executed.** §1 downstream-sweep bullet; `tacitus_v1_task_no_resurrection` invariant; §23 markdown embed auto-restore at catch-up. Brain v3.13 → v3.14.

**Round 106 — Stdin payloads, no shared tempfiles.** `safe_write.py --payload-stdin`; logging-vitality-check SKILL updated; §22 codifies the anti-pattern. Brain v3.12 → v3.13.

**Round 105 — Persistent vitality lapse log + in-session re-check.** vitality-findings.jsonl + tools/vitality_log.py + §21. Brain v3.11 → v3.12.

**Round 104 — Cross-system drift defense.** version_bump.py reads from saga.md; `narrative-only` mode + `--tacitus-bump` flag; saga ↔ versions invariant; §20. Brain v3.10 → v3.11.

**Round 103 — Tacitus live observation surface activated; demo retired; UX iteration.** Tacitus v2.1 → v2.2. live-mode build script; universal modal-popup pattern; 380-quote rotation; masthead Tacitus Annals voice; LAND visual emphasis; demo path permanently retired.

---

## What's actively shipped (state-of-the-system snapshot)

**Brain layer**
- Brain v3.15 — Each finding's fate, visible (Round 108) — implementations.jsonl + §24 + dashboard crystals
- v3.14 (prior) — Cura's findings, executed (Round 107) — §1 downstream-sweep + §23 markdown embed restore + v1-task-no-resurrection invariant
- v3.13 (prior) — Each task, its own scratch (Round 106) — `--payload-stdin` + §22
- v3.12 (prior) — Vitality lapses persist (Round 105) — vitality-findings.jsonl + §21 + invariant
- v3.11 (prior) — Round numbers from the saga (Round 104) — saga as canonical + §20 + invariant
- v3.10 (prior) — Catch-up response structure with Tacitus surface priority (Round 98)

**Tacitus subsystem (v2.2)**
- `tacitus/identity.md`, `tacitus/changelog.md`, `tacitus/portability.md`
- `tacitus/prompts/{cura,vision,aegis}.md` — three mode prompts; **`cura.md` now includes Phase 0 (Round 113)**
- `tacitus/notebook/YYYY-MM.md` — append-only journal
- `tacitus/sentinel.json`, `tacitus/audit-history.json`
- `tacitus/dashboard/index.html` — Live observation surface with implementation crystals + trend strip
- `tacitus/dashboard/assets/quotes/quotes.json` — 380 Wikipedia-backed ancient quotes
- 7 daily invariants enforcing folder integrity + mode-fired-today + rest-day-observed + audit-history-shape + changelog-presence + prompts-portable-shape + v1-task-no-resurrection

**Source-rule cornerstone** — ERROR mode enforced; Two-Role Split clarification live (Round 100).

**Dashboard layer (v1.60)** — coverage pipeline unified; DIETARY_BASELINE rebuilt diet-only; size budget 2 MB.

**Integrity tool (16 checks) + Daily audit (26 invariants)**

**Doctrine + protocols** — Engineering doctrine (11 principles); operating-protocols (24 sections — §22 stdin/scratch + §23 markdown restore + §24 implementation-log discipline); design-knowledge.md extended with Substrate Principle + Cathedral-Glass + ground-first-when-excited + Aegis end-game intent.

**Write primitives** — `tools/safe_write.py` with `--payload-stdin` (Round 106). Edit tool BANNED for project files.

**Persistent log surfaces** (canonical):
- `memory/essence/{saga,lessons,decisions}.md` — narrative
- `tacitus/notebook/YYYY-MM.md` — Tacitus reflections (append-only)
- `tacitus/changelog.md` — Tacitus version history
- `tacitus/audit-history.json` — Aegis structured scores
- `memory/system/audit-2026-MM.md` — monthly audit reports
- `memory/system/vitality-findings.jsonl` — vitality lapses (Round 105)
- `memory/system/implementations.jsonl` — Cura/Vision finding outcomes (Round 108)
- `memory/system/last-catchup.json` — catch-up seal
- `memory/open-threads.md` — current state

---

## Standing operational items (no action; awareness only)

- **Three Tacitus scheduled tasks** — Cura 03:45 / Vision 04:30 / Aegis 05:15 EDT Mon-Fri. Manual override: `Tacitus, contemplate` (exact phrase). **Cura now runs Phase 0 first (Round 113); Vision + Aegis unchanged.**
- **`logging-vitality-check` task** — Mon-Fri 9 AM + 9 PM EDT. Writes via stdin pipe (Round 106). Calls `vitality_log.py append` for persistent findings (Round 105).
- **Daily system audit** — Mon-Fri 6:15 AM EDT.
- **Weekly system audit** — Sun 11:00 AM EDT.
- **`wallach-corpus-weekly-digest`** — Sun 8 PM EDT.
- **Source-rule cornerstone in ERROR mode + Two-Role Split clarification live.**
- **Catch-up integrity defense live.** Catchup seal + briefing-as-proof discipline in place.
- **Sabbath rest window structurally enforced.** 34-hour window (Sat 12 AM EDT → Sun 10 AM EDT).
- **`tools/build_tacitus_dashboard_live.py` runs automatically** after each Tacitus night via the `tacitus-dashboard-build` scheduled task (cron `35 5 * * 1-5`, 20 min after Aegis). Belt-and-braces: `check_tacitus_dashboard_freshness` critical invariant in the 6:15 daily audit catches the case where the task fails or skips. Shipped 2026-06-18 (Round 117).
- **`dashboard_integrity.py restore` runs at catch-up** when audit-sentinel shows `cl-data-* size mismatch` (codified §23).
- **`tools/version_bump.py` reads round number from saga.md** (Round 104); every round close invokes it, including narrative-only.

---

### 🔒 Security audit findings + Round 135 candidate work (2026-06-18 at 9:51 PM)

User asked for a security audit during Phase 1 testing. Real gaps identified:

**Realistic gap (file before share/export ships publicly):**
1. `applyImportBundle` writes cart values to LS without per-key schema validation — allowlist-filter on KEY only. Stored-XSS vector if a malicious cart contains JS-payload strings in fields rendered via innerHTML somewhere downstream.
2. No size cap on cart imports — 100MB file would lock the browser.
3. Tesseract.js loaded from `cdn.jsdelivr.net` without Subresource Integrity (SRI) hash — CDN compromise = RCE on next OCR use.

**Hardening (lower priority):**
4. CSP includes `'unsafe-inline'` for scripts (required by our inline architecture); long-term move to nonce-based CSP.
5. `window.*` exports mutable — same-origin payload could replace `window.addItemToRegimen` etc. Cheap to freeze via `Object.defineProperty`.

**Round 135 candidate scope (~90 min total):**
- Per-key schema validation in `applyImportBundle` (~30 min)
- 1MB size cap in `parseImportBundle` (~10 min)
- SRI hash on Tesseract CDN load (~10 min)
- New invariant `check_subresource_integrity` (~20 min)
- New invariant `check_cart_import_schema_validation` (~20 min)

### 🔒 Security-hunt as Cura Phase-1 sub-check extension (open question, filed)

User direction (verbatim, paraphrased): *"maybe we can make a separate agent for security across all projects (same as my Tacitus helper concept but for security if you think it would be a big enough thing and useful enough future agent for the public to have to create individually v.s baking into Tacitus somehow (such as through Cura, making Cura more robust) - personally I'm inclined to just make Cura better, why not? What would be the downside?"*

**My recommendation: extend Cura.** Add a 5th Phase-1 sub-check (Bug / Contradiction / Integrity / Architectural / **Security**). ~5-10 min budget cost per Cura run. Cap security-class LANDs at 1 per night unless critical finding fires. Portability story stays clean — any future project adopting Tacitus gets security-aware Cura for free.

**Downside of extending Cura:** run-budget pressure. If security findings dominate the LAND quota, real substrate work gets crowded out. Cap mitigation above handles it.

**Downside of new agent:** new schedule slot, new rubric, new sentinel, new audit history. Tacitus' three-mode architecture is already at ceiling for one nightly window.

**Status:** open question pending user decision. Revisit at Round 135 or before public-share-feature ships. NOT a near-term blocker — current security posture is solid for personal-dashboard threat model. The Cura extension is for the future-platform threat model.


---

### 🟢 FUTURE VISION (filed 2026-06-20) — Periodic table → regimen "add ideal supplement" UX

User direction (verbatim spirit): the periodic table (You tab) is a visual coverage indicator showing what nutrients are deficient. Once a user clicks into a nutrient's detail panel, they see an "ideal supplements" list (Wallach-recommended products that close that specific gap). Today there's NO action path from there → regimen. The user has to manually go to Scanner or the Regimen tab to add anything.

**The vision:** add a button or affordance on each "ideal supplement" listing in the nutrient-detail panel — "Add to regimen" — that routes the product through the Adopt flow (same lcScan verdict path, same coverage-update propagation). Closes the UX gap between "I see I'm deficient" and "I can act on it without re-navigating."

**Scope estimate:** ~45-60 min. Requires: ideal-supplement list shape audit, Adopt button wiring, cross-tab navigation handling (does it stay on You tab or jump to Regimen?), maybe a quiet toast confirming the add.

**Watch-trigger:** ship after the goal-picker UI is live and exercised. The goal-picker is more foundational (every other feature ties to goals); this is the next discoverability layer.
