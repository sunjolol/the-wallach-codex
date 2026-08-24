# Teardown map — everything the old mobile retrofit touched

**Author:** groundwork agent, 2026-08-22 · **Status:** reference, not a decision
**Subject:** branch `mobile-responsive` (6 commits, unmerged, unpushed), to be deleted as code and
mined as a bug report per `chronicle/decisions/2026-08-22-mobile-total-reimagining.md`.

Everything below is grounded in a command, a file path or a measured number. Where I could not
determine something it says so; nothing here is inferred silently.

## How this was gathered

    git log master..mobile-responsive --stat
    git diff --name-status master...mobile-responsive
    git merge-base master mobile-responsive           -> 79bed8b9
    git show mobile-responsive:<path>                  (mobile.css, 3 probes, followups, demo builder)
    awk 'NR>=8879' tools/invariants.py | grep '        name="'    -> 102 gate names
    grep -n "@media (max-width" dashboard/assets/styles/*.css      (master baseline)

**Branch position.** Merge-base is `79bed8b9`; master is now `ea7a792d`. The branch is therefore
**one commit behind master** (the commit that recorded his verdict and created
`chronicle/mobile-redesign/`). It is not "current with master" any more — `chronicle/next-chunk.md`
says it is, and that line is now stale.

**One measured drift in the handoff itself.** `chronicle/next-chunk.md` calls `mobile.css`
"620 lines". `git show mobile-responsive:dashboard/assets/styles/mobile.css | wc -l` returns
**523**. 620 was true before commit `1e5adb1e` deleted the two unchosen nav shells. Read the file,
not the handoff.

---

# PART A — mobile.css section by section: the bug report inside the overrides

523 lines. Section numbers run 1, 2, 3, 4, 5, **8**, 9, 10, 11, 12, 12b, 13 — the gap at 6/7 is
where the segmented-strip and slide-in-drawer shells were deleted. The gap is evidence, not
sloppiness.

For each block: what it overrode, **the real defect it was papering over**, and what the mobile-first
design must still answer. The override code is disposable; the middle column is the deliverable.

### 1 · Dynamic viewport height (`@media (pointer: coarse)`)

- **Overrode:** `height: 100vh` on `.app-shell`, `.wc-veil`, `.pf-overlay`,
  `#drawer-search-mount.sr-open`, and six `max-height: calc(100vh - X)` caps.
- **Real defect:** `100vh` is the *largest* viewport height. While the URL bar is showing, a 100vh
  box overhangs the bottom of the screen and takes its last row with it — the profile panel's Done
  button, the search popup's final results, the welcome card's goal chips. The `max-height` form is
  the same bug wearing a different hat: a cap written against 100vh is *bigger* than the screen.
- **Verified live sites on master** (`grep -n "100vh\|90vh" dashboard/assets/styles/*.css`, 8 hits):

  | file:line | declaration |
  |---|---|
  | `dashboard.css:55` | `.app-shell` `height: 100vh; overflow: hidden` |
  | `dashboard.css:215` | `.pf-panel` `max-height: calc(100vh - 96px)` |
  | `drawer-search.css:84` | `.scr` `max-height: calc(100vh - 128px)` |
  | `workspace-coverage.css:1132` | `.wc` `max-height: 90vh` |
  | `workspace-coverage.css:1170` | `.rail-list` `max-height: calc(100vh - 330px)` |
  | `workspace-regimen.css:467` | `.rc-pop` `max-height: calc(100vh - 48px)` |
  | `workspace-scanner.css:443` | `.vd-lightbox__img` `max-height: 90vh` |

  (`workspace-coverage.css:1163` is a comment referencing the 330px cap.)

- **Requirement:** the new design owns its own height model. Whatever it is, **no phone surface may
  size against `vh`**. If any of these seven declarations survives the redesign it must be `dvh`
  (or `svh`, chosen deliberately) at source, not shadowed from a later sheet.

### 2 · Token remap at phone widths

- **Overrode:** `--ds-text-micro` 0.6rem (9.6px) -> 0.75rem (12.0px); `--ds-text-mini` 0.7rem
  (11.2px) -> 0.82rem (13.1px); `--ds-space-7` 40px -> 20px.
- **Real defect:** the **sealed** `design-system.css` sets two body-text tokens below the ~12px
  legibility floor and uses them everywhere (rail labels, eyebrows, kbd hints, meta rows). Measured
  225-430 sub-12px text nodes per surface. `--ds-space-7` at 40px is 11% of a 375px screen *per
  side*.
- **The structural problem, which is the real finding:** the sealed pillar is hash-gated
  (`design_system_hash_integrity` + `design_system_write_protection`, both USER-ONLY to re-seal), so
  the retrofit could only *shadow* it from a later sheet. That is why the layer had to load last, and
  the load-order dependency is the whole reason it was fragile.
- **Requirement:** the mobile design needs a **type scale of its own**, not a shadow of a desktop
  one. Decide up front whether that scale is (a) new tokens added to the sealed sheet — needs the
  owner's re-seal, ask every time — (b) a mobile token layer that *defines* rather than *overrides*,
  or (c) fluid `clamp()` tokens correct at both ends. Option (b) reproduces the same cascade
  fragility; note that before choosing it.

### 3 · Shell becomes single-column

- **Overrode:** `.app-shell` grid from `220px | 1fr` two-column to one column with
  `topbar / workspace / rail` rows; `.app-rail::after` hairline off; `.rail__brand` hidden;
  `.app-topbar > span:empty` hidden.
- **Real defect:** the desktop shell is a fixed 220px rail (collapsing to 60px at 820px in
  `dashboard.css:347`) beside content, `height:100vh; overflow:hidden`. **Nothing about that shell
  is a phone shell.** The brand mark is an uppercase two-word letterspaced string in a 60px column —
  clipped on every mobile surface today. An empty `<span>` exists purely to hold a desktop grid
  column.
- **Requirement:** the phone shell is composed from scratch. Note the constraint it inherits:
  `dashboard.css:24` **and** `workspace-coverage.css:77` both declare
  `html, body { height: 100%; overflow: hidden }`. **The document itself cannot scroll.** If the new
  mobile design wants a natively-scrolling document (which most modern phone apps do), that is a
  change at source in two files, and it interacts with the standalone-page scroll-lock hook — see
  Part C.

### 4 · Topbar

- **Overrode:** topbar to 2 columns; `.np__deck` / `.np__rule` hidden; `.np__name` to 0.95rem;
  `.topbar__ask-kbd` hidden; `.topbar__ask` padding.
- **Real defect (and a genuine source fix that the branch made correctly):** master's
  `dashboard.css:357` `@media (max-width: 560px)` sets `.topbar__breadcrumb { display: none }` — so
  **on a phone today, nothing on screen names the current workspace.** The branch corrected that at
  source rather than shadowing it. Separately `.np__deck` is `white-space: nowrap` and measured
  protruding on every mobile viewport, and `.topbar__ask-kbd` shows a keyboard shortcut on a device
  with no keyboard.
- **Requirement:** the phone must always say where you are. The keyboard hint must not exist on
  touch. **Salvage note:** the `dashboard.css` breadcrumb correction is a real bug fix in a shared
  file — it should carry forward even though the layer around it does not.

### 5 · The bottom tab bar

- **Overrode:** `.app-rail` to a horizontal flex bar; `display: contents` on `.rail__section` /
  `.rail__footer` to promote rail items to direct flex children *without touching markup*;
  `rail__divider/spacer/section-label/kbd` hidden; the search item hidden; labels restored at
  0.52rem (0.46rem below 360px); active marker rotated from left-edge to top-edge; `z-index: 70` so
  it sits above the drawers (z-index 10).
- **Real defect:** there was no phone navigation at all — the 60px icon rail was it.
- **The tells that this was a retrofit, and they are the useful part:**
  - `display: contents` exists only to avoid a markup change. A designed phone bar has its own
    markup.
  - `html[data-mobile-nav="bar"]` is on every selector purely to raise specificity from (0,1,0) to
    (0,2,1) so the rules can beat what they were written against. **That is a cascade crutch, not a
    design decision.**
  - Label sizing was tuned to 0.52rem and then 0.46rem below 360px — i.e. **under the 12px floor
    section 2 of the same file exists to enforce.** The layer breaks its own rule to make desktop
    labels fit a phone bar. That contradiction is the clearest single proof the approach was wrong.
  - The avatar got a fixed `flex: 0 0 56px` slot because it carries no label, stealing width from
    the four targets that do.
- **Requirement:** the phone navigation is designed, with its own markup, its own labels (chosen for
  a phone, not inherited from a vertical rail), and its own z-order contract — specifically:
  **no state may bury the control that leaves it.** `--mob-nav-total` existed so every full-screen
  overlay could reserve the bar's height plus `env(safe-area-inset-bottom)`. Keep the *contract*
  (safe-area insets, always-visible escape), drop the mechanism.

### 8 · The Knowledge drawer — the worst surface

- **Overrode:** `#drawer-knowledge-mount.kd-open` un-pinned from `left: 220px` / `width: 950px` to
  `left:0; right:0; width:auto`, bottom raised above the nav; header wrapped; tab strip turned from
  a horizontal scroller into a 2-per-row, 3-row wrapped grid at 164x40 per tab.
- **Real defect, measured:** `drawer-shared.css:23` pins every drawer to `left: 220px` — the
  **desktop** rail width, wrong even at the 60px icon rail — and `drawer-knowledge.css:22` sets
  `width: 950px`. At 375px that is **575px wider than the viewport, far edge 795px off-screen, 104
  interactive elements entirely outside the world, tab bar starting at left:381.**
- **Tab strip, his finding #1:** the strip was a *working* scroller with no affordance. Measured at
  375px: box 343px, scrollWidth 717px, **376px hidden**, 3 of 6 tabs starting outside. After wrap:
  0px hidden, six 164x40 tabs, 138px of header height consumed.
- **The measurement lesson worth keeping:** counting rows said "3 across, 2 rows, 95px, everything
  inside" — and `scrollWidth − clientWidth` *per tab* then exposed 51px of label spilling out of
  three pills (Absorption +25, Conditions +21, Products +5). **A layout check that counts boxes and
  never asks whether the words fit will ship clipped labels and call it a pass.**
- **Requirement:** the Knowledge surface is the one he called "cheap and poorly thought out", and
  this section is why: six desktop destinations crammed into a phone header. The re-imagining must
  decide *what Knowledge is on a phone* — not how to fit six tabs. The data it must still carry:
  the six destinations (Home, Absorption, ORAC, Conditions, Explore, Products) plus entity pages,
  food sheets and the corpus view.

### 9 · Search drawer + profile + arrival veil

- **Overrode:** widths to auto with a `--ds-space-3` inline margin; `.wc__foot` made
  `position: sticky; bottom: 0`; `.wc__h` 1.9rem -> 1.4rem.
- **Real defect:** these three *survive* a phone because each is a **centred max-width card**
  (`width: min(600px, 100%)`, `min(760px, 92vw)`) rather than a fixed-width panel. **That single
  pattern is the difference between what works here and what does not.** But the arrival veil's
  Enter button measured **751px below the fold** inside a `max-height: 90vh` scroller with 876px
  hidden — reachable, but a first-time user sees a card whose only visible control is the X that
  opts them out permanently.
- **Requirement:** carry the pattern (fluid card, never a fixed panel width) and the rule that a
  screen's **primary action must be visible without scrolling**, not merely reachable.

### 10 · Coverage

- **Overrode:** `.essentials-section__head` from a 4-column grid to a wrapping flex row;
  `.essentials-subsection__label` given `flex-wrap: wrap` with the hint at `flex: 1 0 100%`;
  `.cov-aside` / `.rec` `min-width: 0`; `.essentials-grid--fats` from 3 columns to 2.
- **Real defects:**
  - The section head is a **grid**, so `flex-wrap` did nothing to it; at 320px its last track (the
    "5 / 60 covered" stat) was squeezed to **13.3px** (55.6px at 375px).
  - **His finding #2:** `.essentials-subsection__label` (`workspace-coverage.css:278`) is one flex
    row of five children with `align-items: baseline` and no wrap, so the long hint wrapped *inside
    its own box* while the count stayed pinned to the first baseline — the count landing mid-
    sentence. Measured at 375px: 3 of 3 subsections, hint 3 lines each, hint box squeezed to
    120-166px.
  - The recommendation panel's "+" buttons measured at **left:435 — entirely off-screen.**
  - `.tile--fat` was **the single most-clipped element in the whole matrix: 120 hits across mobile
    viewports and zero at the 1440px control**, because `.essentials-grid--fats` is `repeat(3, 1fr)`
    = ~90px tracks at 375px.
- **Deliberately NOT touched, and this must survive the redesign:** the minerals/vitamins/aminos
  grids keep `repeat(auto-fill, 100px) !important`. **Integer track positions are what keep the
  coverage ring crisp** — a fractional fill was measured dropping one ring edge to 8.00 device px
  against the other's 12.00. Three 100px tiles fit at 375px, two at 320px. **Any mobile tile grid
  that goes fractional will visibly degrade the rings.** This is the one measured constraint in the
  whole layer that binds the new design.
- **Requirement:** Coverage on a phone needs a composed information hierarchy — the section head,
  subsection label, hint and count are four data points fighting for one row that was designed at
  1440px. Also note the standing question from the followups: **the essentials field is 5,335px at
  375px, roughly 8 screens.** Ninety tiles on a phone is an IA problem, not a CSS problem.

### 11 · Regimen

- **Overrode:** `.ck-slots` made a real `overflow-x: auto` scroller with x-mandatory snap, hidden
  scrollbar, `overscroll-behavior-x: contain`; `.ck-slot` `flex: 0 0 auto; scroll-snap-align: start`.
- **Real defect:** four slots in a flex row inside an `overflow: hidden` ancestor — the fourth was
  simply **cut at the viewport edge with no scrollbar and no way to reach it.** Not overflowing:
  *clipped*.
- **Requirement:** Regimen is one of the two surfaces he called "scuffed". The four slots are a
  first-class navigation concept on a phone, not a strip to be swiped. Also carried from the
  followups: **fourteen 10x10 colour swatches in one row** in the slot tray, with hit area faked by
  a `::after` pseudo-element while the painted size stays 10px. That is a design debt, explicitly
  left for the owner's call.

### 12 · Touch (`@media (pointer: coarse)`)

The most reusable section in the file, because it is scoped to the **input device**, not a width.

- **`--uic-size` 44px / 38px** on `.ui-close`.
- **The 16px input floor.** iOS Safari zooms the page when a text field under 16px takes focus and
  **does not zoom back out** — one undersized field permanently breaks the layout for the session.
  Measured at **13.6px on both text-entry paths**: the regimen add-row and the Scanner paste box.
  The rule had to be written three times at escalating specificity ((0,0,1) -> `[class]` (0,1,1) ->
  `#drawer-*-mount` (1,1,0)) because **both drawers root every rule at their mount ID**, so nothing
  below ID specificity reaches inside them.
- **`.vd-newscan` measured 161x26 and `.topbar__ask` 151x40** — primary actions under the touch
  floor.
- **The measured nuance that matters most:** sub-44px controls are roughly as common at 1440px
  (**316**) as at 375px (**305**). *This is not a responsive-layout failure* — the app's controls are
  small everywhere. Fine for a mouse, wrong for a finger.
- `-webkit-tap-highlight-color: transparent` (Chrome's blue flash fights the palette; scoped to root
  because the app drives a lot of interaction from `cursor:pointer` divs an element-name list would
  miss); `overscroll-behavior-y: contain` on html/body to kill **pull-to-refresh**, which on this app
  means a full reload of a 13 MB bundle fired by the exact gesture used to scroll back up a
  5,335px list; `:active` states as the only press feedback available without hover; the custom 11px
  webkit scrollbars zeroed (a mouse affordance that eats 11px of every touch scroller);
  `overscroll-behavior: contain` on the overlays to stop scroll chaining.
- **Requirement:** **almost all of section 12 is a device-capability contract, not a retrofit, and
  it should be re-authored into the new design rather than thrown away.** The 16px input floor and
  the pull-to-refresh suppression in particular are correctness issues, not styling. Note the
  specificity ladder is a symptom of the drawer ID-rooting — if the mobile design owns its own
  markup and sheets, the ladder disappears.

### 12b · The smallest phones (`max-width: 360px`)

Steps the tab label to 0.46rem at 320px. **Pure symptom.** The requirement it encodes: **320px
(iPhone SE 1st gen) is the declared floor.** Keep the floor, drop the trick.

### 13 · Text

- `-webkit-text-size-adjust: 100%` — iOS silently inflates font sizes in portrait, breaking a tuned
  scale. **Keep this; it is a correctness opt-out, not a layout tweak.**
- `overflow-wrap: anywhere` on `.np__name`, `.tile__name`, `.ck-slot__name` — long unbroken strings
  (chemical names, product names with (R)/(TM)) force a whole row wide.
- **Standing measurement, taken on master today:** **61** `white-space: nowrap` declarations across
  `dashboard/assets/styles/*.css`, and **13** fixed `width: NNNpx` declarations of which several
  exceed the 320px floor: `drawer-knowledge.css:22` **950px**, `workspace-regimen.css:467` **700px**,
  `design-system.css:808` **320px**, `drawer-orac.css:26` 292px, `drawer-knowledge.css:1980` 280px.
  Plus three `min-width` floors: `drawer-orac.css:129` 232px, `workspace-regimen.css:300` 250px,
  `drawer-knowledge.css:1176` 118px. **Each is a hard-coded desktop assumption the new design either
  replaces or must scope away from the phone.**

### What master already carries (the pre-existing partial responsive attempts)

`grep -n "@media (max-width" dashboard/assets/styles/*.css` on master:

| file:line | breakpoint | what it does |
|---|---|---|
| `dashboard.css:340` | 1160px | topbar to 3 columns, `.topbar__sub` hidden |
| `dashboard.css:347` | 820px | **rail collapses to a 60px icon bar**; all rail labels hidden |
| `dashboard.css:357` | 560px | topbar trimmed; **`.topbar__breadcrumb` hidden** (the defect above); footer items hidden |
| `workspace-coverage.css:787` | 1160px | `.coverage-grid` single column — **INERT**, outranked by `.cov-d .coverage-grid` at ~1111 |
| `workspace-coverage.css:790` | 640px | tile track to `minmax(58px,1fr)` — **INERT, and deliberately so** |
| `workspace-regimen.css:418` | 640px | `.ck` / `.ck-hero` padding only |
| `workspace-scanner.css:99` | 1080px | `.vd-cf__grid` single column |
| `workspace-scanner.css:227` | 1180px | `.vd-card__body` single column |
| `drawer-knowledge.css:1344` | 620px | `.kd-pf-glance` single column |
| `drawer-knowledge.css:1812` | 780px | `.sxb-wrap` / `.frt-scene` single column, `.ue-strip` 2-col |
| `drawer-orac.css:197` | 820px | ORAC field gutters, chain/pieces/forces to 1-2 col |

**These are what the phone actually gets on master today, and it is nothing like a mobile app.**
Two of the eleven are provably inert. This table is the honest "before" state for the redesign.

---

# PART B — every file the branch touched, and what happens to it

`git diff --name-status master...mobile-responsive` — 18 files. Grouped by disposition.

## B1 · DELETE with the layer (created by it, serves only it)

| path | lines | note |
|---|---|---|
| `dashboard/assets/styles/mobile.css` | 523 | the layer itself |
| `tools/probes/render_probe_mobile.js` | 268 | asserts the retrofit's floor on 6 surfaces |
| `tools/probes/mobile_audit.js` | 582 | 8-viewport x N-state measuring instrument |
| `tools/probes/mobile_css_scan.js` | 300 | static scan: hover-to-reveal, inert media queries, 100vh |
| `chronicle/mobile-followups.md` | 143 | the parked to-do list |

**But do not delete them blind.** Three of the five carry method that outlives the design:

- **`mobile_audit.js` should be RE-POINTED, not deleted.** Its value is the **1440px CONTROL in the
  matrix** — a finding that fires equally at 1440 is a property of the app, not a mobile defect, and
  the *delta* is the signal. It also has a `--selftest` that injects four known defects into a clean
  page and asserts each detector fires. That negative-control design is the reusable asset. Its
  viewport matrix (320/360/375/390/430/768/667-landscape/1440-control) is the device contract for
  the new design.
- **`mobile_css_scan.js`'s three detectors are design-independent**: hover-to-reveal controls
  (invisible on touch), inert media queries (outranked and therefore never firing), and `100vh`.
  All three will be just as true of a new sheet.
  **Dangling reference:** its header names `tools/probes/mobile_css_scan.selftest.js` as the file
  that drives its fixtures. `git ls-tree -r --name-only mobile-responsive -- tools/probes` returns
  **only the three mobile files** — that self-test was never committed. If the scanner is salvaged,
  the self-test must be written, not assumed to exist.
- **`render_probe_mobile.js`'s header is the honest bit:** "WHAT IT CANNOT PROVE. That any of it
  looks right." It also documents its own negative control — every assertion failed against the
  2026-08-21 pre-layer build (Knowledge drawer 795px off-screen, tab bar starting at left:381, 319
  interactive elements outside the world on the entity page, nothing naming the surface below
  560px). A new mobile probe should inherit both properties and none of the selectors.
- **`mobile-followups.md` holds items that are NOT closed by the redesign** and must be re-homed
  before it is deleted — see Part E4.

## B2 · KEEP — real source fixes wearing a mobile label

These are on the branch but are **not** retrofit overrides. Discarding the branch wholesale loses
them, and master still ships the defects.

| path | what to keep |
|---|---|
| `dashboard/assets/styles/dashboard.css` | the `@media (max-width:560px)` correction. Master still hides `.topbar__breadcrumb`, so **on master today nothing names the current workspace on a phone.** |
| `dashboard/assets/styles/workspace-coverage.css` | the responsive block **relocation**. Master has `@media (max-width:1160px) { .coverage-grid … }` at line 787 where it is **inert** — outranked by `.cov-d .coverage-grid` at ~line 1111. Raising the selector is *not* enough: at equal specificity the later rule wins, so the block's position *below* line 1111 is load-bearing. Master's 340px `.cov-aside` therefore still overlaps the field on every narrow viewport. |
| `dashboard/assets/js/src/main.ts` | `wireBackGesture()` / `syncOverlayHistory()` / `closeTopOverlay()` — the **browser Back gesture**. Without it, Back from inside a full-screen overlay **exits the site**, and by the time the user notices they are already gone. One history entry total (not one per overlay), guarded so an engine without `pushState` degrades rather than throwing. `history.pushState` was verified working on a `file://` origin. Re-earn the UX, keep the mechanism. |

**Caveat on the coverage relocation:** the branch also *deliberately leaves* the
`@media (max-width:640px)` tile-track block inert, with a stated reason — reviving it gives 58px
tiles (under the touch floor once padding is removed) **and** a fractional fill that wrecks the ring.
If that block is moved or "fixed" during teardown, it is a regression twice over.

## B3 · REWRITE

| path | why |
|---|---|
| `dashboard/dashboard.html` | remove `data-mobile-nav="bar"` from `<html>` and the `mobile.css` `<link>`. **Also fix the stale count:** the header comment says *"It links the 11 stylesheets below"*; the branch shipped **12** links (`git show mobile-responsive:dashboard/dashboard.html \| grep -c 'rel="stylesheet"'` = 12) and never updated the sentence. Under §00.B a comment out of sync with its code is a defect worse than no comment. Master is currently correct at 11 — any new sheet must update it in the same patch. The `id="appRail"` added to `<aside class="app-rail">` has **no reader I could find** (the `?nav=` JS that plausibly used it was deleted in `1e5adb1e`); grep before keeping it. |
| `tools/build_demo_singlefile.mjs` | keep the tool — see Part D. |

## B4 · APPEND-ONLY — cannot be reverted, must be superseded in prose

`chronicle/build-log.md`, `chronicle/creators-log/{INDEX.md,LOG.md,log.jsonl,digests/2026-08.md}`,
`dashboard/assets/data/creators-log-embed.json`.

Both logs are **git-anchored append-only** (`creators_log_append_only`, `build_log_append_only`, both
`critical`). The branch's entries describing the retrofit are permanent. **The correct move is a new
entry recording the reversal, never an edit.** Note the embed, bundle, digest and archive each have
their own sync gate (`creators_log_{digest,embed,bundle,archive}_synced`), so a log append requires a
regen + rebuild in the same patch or four gates go amber.

## B5 · GENERATED

`dashboard/assets/js/dist/main.js` — rebuilt by `node tools/build.mjs`; never hand-edited.
`tools/canaries/safe-write-probe.txt` — the safe_write canary; it is *supposed* to change on every
write session and is currently modified in the working tree on master too.

---

# PART C — invariant gates at risk

`tools/invariants.py` registers **102** gates (counted from the `INVARIANTS` list at line 8879, not
from prose). `.claude/invariant-baseline.json` is **empty by design** — there is no tolerance to lean
on, and `exceptions_justified` REDs any entry that is not `{invariant, reason, test}`.

## C1 · Will go RED unless handled in the same patch

**`board_claims_match_reality`** *(critical)* — CLAUDE.md's "what a green board actually means"
section must state the live gate total **and** the external-anchor count, and both must match the
registry. **If the redesign registers a new mobile gate — or retires one — CLAUDE.md's "102 gates"
and "24 gates anchored outside" must change in the same commit.** A reworded claim is RED, never a
silent pass.

**`charter_gates_present`** *(meta)* — parses the R1-R9 table in `.claude/skills/charter/SKILL.md`
and REDs any gate name in the Gate column that is neither a live invariant nor labeled WISH.
**Renaming or removing a gate requires editing the Charter in the same patch.** Note the Charter has
already been caught drifting in *both* directions (R3 and R5 undersold live enforcement) and this
gate only catches over-selling.

**`workspace_coverage_no_dead_rules`** *(critical)* — **the highest-probability red in this whole
teardown.** Every class selector in `workspace-coverage.css` must trace to a live reference in
comment-stripped `src/**/*.ts`, `dashboard.html`, a coverage-layout data class field, or a dynamic
`prefix-${...}` construction. Its allowlist holds exactly **one** entry (`is-foundation`).
**A mobile-first Coverage that stops emitting a desktop class turns that class's rule dead and REDs
this gate.** It is scoped to one file (`_WC_CSS_REL`), so the same failure mode in
Regimen/Scanner/Knowledge sheets will be **silent**. Plan each CSS deletion into the same patch as
the markup change, never after.

**`no_new_dead_code`** *(critical, knip)* — ratchets against `dashboard/knip-baseline.json`
(currently 45 accepted findings; knip entry is `assets/js/src/main.ts` plus `**/*.test.ts`).
**Any new mobile TS module not reachable from `main.ts` is RED**, and any desktop module orphaned by
the redesign is RED. The baseline "may only SHRINK"; there is no generator, so regenerating it is a
hand step (`npx knip --reporter json` from `dashboard/`, keys built the way
`_knip_dead_keys` builds them).

**`css_comment_no_premature_close`** *(critical)* — a `*/` inside a comment body silently drops the
next rule. It has happened here (a `--o-*/--sev-*` token glob in `theme.css` dropped
`.rr-btn--danger`, board green throughout). Any new mobile sheet with heavy commentary — and this
codebase writes heavy commentary — is exposed.

**`no_external_style_resources`** *(critical)* and **`offline_no_runtime_network`** *(critical)* —
both glob `dashboard/assets/styles/*.css`, so **any new sheet is automatically in scope**. No Google
Fonts, no CDN, no remote `@import` or `url()`. `_shipped_surfaces()` is
`dashboard.html + styles/*.css + dist/main.js`. The CSP in `dashboard.html:29` is `default-src
'self'` with no external origin permitted at all — a mobile design cannot reach for any hosted asset.

**`fonts_declared_and_shipped`** *(critical)* — bidirectional: every file in `assets/fonts/` must be
declared by an `@font-face`, and every `@font-face` src must resolve. **If the mobile design drops a
face, the file goes in the same patch; if it adds one, the file must land.** (Merriweather was
already cut in `a9b0513b`.)

**`vendor_assets_pinned`** *(critical)* — also globs `styles/*.css` and asserts every relative
`url()` resolves, because "a 404'd font/image falls back SILENTLY".

**`no_stub_render_paths`** *(critical)* — scans git-tracked `views/*.ts` **and `styles/*.css`** for
scaffold tokens: `kn-stub`, `sh-stub`, `next chunk`, `real build`, `demo wires`, `PROTOTYPE`,
`exemplar`. **A mobile sheet or view whose comment says "PROTOTYPE" REDs the board.** Very easy to
trip while prototyping — know it before you write the comment.

**`design_system_hash_integrity` + `design_system_write_protection`** *(both critical)* — if the
mobile type scale is done by **editing** `design-system.css`, both go red until the owner re-seals.
Re-sealing is **USER-ONLY** and permission never carries forward from a past session — **ask every
time**. This pair is exactly why the old layer had to shadow tokens from a later sheet.

**`dashboard_dist_fresh`** *(warning)* — mtime of `dist/main.js` vs `src/**/*.ts`. Trips on every TS
edit until `node tools/build.mjs` runs.

**The four Creator's-Log sync gates** *(warnings)* — any log append without a regen + rebuild.

## C2 · Under-covers SILENTLY (a hole, not a red) — which is worse, because nothing fires

These gates are **surface-scoped by a hardcoded tuple**. A new mobile view file is simply not
scanned, and the gate stays green while the rule goes unenforced:

- `_CLEAN_VIEW_FILES` (`tools/invariants.py:7323`) drives **`views_no_inline_prose`**.
- `_ENTITY_VIEW_FILES` (`tools/invariants.py:7335`) drives **`entity_render_is_projection`**,
  **`view_category_not_hardcoded`**, and the view half of **`no_positional_hero`**.

Each gate's own description says the tuple "grows in the same patch as each new view". **Any mobile
view file must be added to the right tuple in the same patch that creates it.** Nothing will remind
you and nothing will fail.

Same shape: `workspace_coverage_no_dead_rules` covers exactly one stylesheet. Dead-rule liveness in a
new mobile sheet is **ungated** unless the gate is generalized — and that gate exists because a
"clean" app was carrying 51 dead class rules across two superseded UI generations (~425 lines) that
knip could not see, because **knip is blind to CSS**.

## C3 · The scroll-lock guard — a hook, not an invariant

Not in `invariants.py`. It is `tools/hooks/post_write_verify.py`, a **PostToolUse hook on Bash** that
fires on every `safe_write` of an `.html`: if the file links `dashboard/assets/styles/*.css` and has
no `html,body{…overflow: auto|visible|scroll}`, it **exits 2 and blocks the write**.

Two things the teardown must know:

1. It exists because `dashboard.css:24` and `workspace-coverage.css:77` both declare
   `html, body { height: 100%; overflow: hidden }`. **If the mobile redesign changes or removes
   either declaration, this hook's premise changes** and its comment (which cites both by line)
   drifts out of sync with its code. Re-read the hook before touching those two lines.
2. **Every mobile prototype written into `chronicle/mobile-redesign/prototypes/` as `.html` will be
   blocked unless it carries the unlock.** The pattern is the `!important` unlock in the page's own
   `<style>` after the `<link>`s, then `node tools/mockup_measure.js <path>` for the rendered proof.
   `window.scrollTo()` is **not** the test — it succeeds on a provably locked page — and neither is
   `element.screenshot()` / `fullPage:true`. `overflow-x: hidden` does **not** unlock scroll.
   This defect has recurred six times; the instruments kept sharing its blind spot.

Sibling hooks in `tools/hooks/`: `pre_write_guard.py` (blocks Write/Edit on repo files — this is why
everything routes through `safe_write.py`), `pre_bash_guard.py`, `stop_round_close.py`.

## C4 · Not a board gate, but a standing test that this teardown can break

`tools/tests/test_shared_rl_rules_scoped.py` — no guest workspace sheet may declare a bare rule for a
shared `.rl-` class. It exists because an unscoped `.rl-row__x` in `workspace-scanner.css` captured
Coverage's delete buttons and stacked all three on one point at (1537,492). **A new mobile sheet that
loads after the workspace sheets is exactly the shape that re-creates this.** Its inverse is just as
real: an *over*-scoped rule ships an unstyled control and **no existence check can see it** — the
check that binds is a cross-surface comparison of computed style (font, size, weight, transform,
padding, radius, colour), not "does the element exist". 48 tests live in `tools/tests/`.

---

# PART D — build, demo and shell tooling

| tool | knows about mobile? | what it needs |
|---|---|---|
| **`tools/build.mjs`** | **No.** Type-checks (`tsc --noEmit`), runs esbuild over `assets/js/src/main.ts` with `--define:__SPLIT_DATA__=false`, rebuilds the offline OCR worker. **It never touches CSS.** | Nothing for a CSS-only change. New TS flows through automatically — but `tsc` must pass and knip must be clean. |
| **`tools/build_web.py`** | **No, and that is good.** Line 158: `for src in sorted((DASH / 'assets/styles').glob('*.css'))` — it content-hashes **every** sheet it finds and rewrites the `<link>` hrefs in `dashboard.html` by string replacement (lines 223-227). | **Nothing.** Adding or removing a sheet is picked up automatically. Remember *why* the content-hashing exists: a SiteGround **proxy cache served a stale corpus**. `first_load` (line 335) sums html + every css + bundle, so a new sheet moves the reported first-load number. |
| **`tools/esbuild_web.mjs`** | Not inspected in depth. Sets `__SPLIT_DATA__=true` for the web build (per `build.mjs`'s own comment). | Same as build.mjs: TS only. |
| **`dashboard/dashboard.html`** | **Yes, on the branch.** `data-mobile-nav="bar"`, the `mobile.css` `<link>` as sheet #12, `id="appRail"`. | Remove all three; update the "11 stylesheets" sentence to the new count in the same patch. `<meta name="viewport" content="width=device-width, initial-scale=1.0">` is already present (line 30) and correct — note a fixture *without* it makes Chrome emulate 980px. |
| **`tools/build_demo_singlefile.mjs`** | **Only incidentally.** It regexes `<link rel="stylesheet" href="./assets/styles/([^"]+)">` out of `dashboard.html` and inlines whatever it finds, so a changed sheet list needs no edit. | **Keep this tool — it is the review loop.** It is the only way to put a build in his hand on a real phone without publishing to nutrientcodex.com. Three hardcoded things need attention: (1) `LIVE_FONTS`, a **7-face allowlist** — a new face must be added or it silently renders in a fallback; this list was **wrong about Playfair** because it was built from a network trace, and a face is only fetched when a glyph using it *renders*; (2) the Creator's Log is **stubbed to `[]`** (2.45 MB) so the profile modal claims 0 entries, which is **false for the real app** — stated on the page itself; (3) the **OCR engine (38 MB) is absent**, so the Scanner's layout and paste path work but scanning a photo does not. Rebuild with `node tools/build_demo_singlefile.mjs <out>.html --artifact` and republish the `.artifact.html` to the **same** artifact URL to keep his link alive. |
| **`tools/mockup_harness.py` / `tools/mockup_measure.js`** | No, but they are the prototype path. | The harness generates a shell carrying `html, body { height:auto !important; overflow:auto !important }`; `mockup_measure.js` dispatches a real `page.mouse.wheel()` and reads effective viewport overflow. **Never MOVE a harnessed page** — relative CSS breaks and controls silently mis-size. Any measure-to-fit must await `document.fonts.ready`. |
| **`tools/probes/render_probe_web_build.js` / `render_probe_live_host.js`** | Not mobile-specific. | The two-probe discipline stands: web-build probe **before** upload, live-host probe **after**. `dist-web/` is currently **built and driven (13/13) but NOT uploaded** — the live site is behind by the font cut, the regimen fix and the iodine work. Uploading is the owner's action. |

**Offline scope reminder:** offline-forever binds the **local** `file://` build. The web build
(nutrientcodex.com) **may** fetch. There is deliberately **no service worker**.

---

# PART E — decisions: what still binds, what is re-opened

`chronicle/decisions/2026-08-22-mobile-total-reimagining.md` is explicit and BINDING:

> Decisions taken on the `mobile-responsive` branch were made *inside* the retrofit frame and no
> longer bind automatically. Each must be re-earned by the new design on its own merits — including
> "the bottom tab bar is the shell", "search is deliberately NOT a tab", and the
> `html[data-mobile-nav="bar"]` specificity crutch.

## E1 · RE-OPENED (`next-chunk.md` lists these as "do not re-litigate" — that line is superseded)

1. **"The bottom tab bar is the shell."** He chose it from three built side by side — but all three
   were `display: contents` re-arrangements of the desktop rail. **He chose the best of three
   retrofits, not the best phone navigation.** Re-open.
2. **"Search is deliberately NOT a tab."** The argument was that Ask Wallach in the topbar is already
   the door, and that a sixth target would squeeze every other under 62px. **That constraint was
   created by the five-across bar.** With a new shell the arithmetic changes. Re-open.
3. **`html[data-mobile-nav="bar"]` stays on every selector.** A pure cascade crutch. **Dies with the
   layer**, and the redesign should be architected so nothing like it is ever needed.
4. **"Wrap the Knowledge tabs, do not signpost."** A local answer to "six desktop tabs in a phone
   header". Re-open one level up: *what is Knowledge on a phone?*
5. **Two per row, three even rows, 164x40, 138px.** Geometry of a superseded component. Gone.
6. **The 0.52rem / 0.46rem tab labels.** Below the layer's own 12px floor. **Do not carry forward.**

## E2 · STILL BINDS (project-level, unaffected by the frame change)

- §00.A: **Wallach is the only source of amounts.** A redesign re-presents existing data and never
  sources new data. No number, dose, target, deficiency sign or claim may be invented, and none may
  be moved without tracing to a book.
- Offline-first from `file://`; no network at runtime for the local build; no service worker; no CDN.
- Vanilla TS + hand-written CSS. No framework.
- No emojis in UI copy — typographic marks only.
- Category colours fixed: minerals blue, vitamins orange, aminos green, omegas purple.
- Coverage is a **map of gaps**, never a score, never gamified.
- Cream default, dark toggle.
- Wholesale is the featured price.
- **Total feature preservation is the one condition.** The inventory is the contract; anything not in
  it can be silently lost.

## E3 · MEASURED FACTS THAT SURVIVE THE FRAME CHANGE (physics, not taste)

- **The coverage ring needs integer track positions.** A fractional fill measured 8.00 vs 12.00
  device px on the two ring edges. Binding on any tile grid the new design invents.
- **The 16px input floor on iOS.** Both text-entry paths measured at 13.6px; the zoom does not
  reverse.
- **`100vh` overhangs on a phone.** Seven live sites listed in Part A §1.
- **320px is the declared floor**, 375px the primary target; the matrix is
  320/360/375/390/430/768/667-landscape + a **1440 control**.
- **`window.innerWidth` is the VISUAL viewport under emulation and expands to the content width on
  overflow** — it read **901 in a 375px viewport**. Use `document.documentElement.clientWidth`.
- **`.app-shell` is `overflow:hidden`, so document overflow is structurally 0 everywhere.** A zero is
  not a clean layout: content that does not fit is **clipped away**, and the pixels that would prove
  the defect are never painted. `clipped` and `offscreen` carry the signal; `protruding` and
  `docOverflow` understate it.
- **At equal specificity, source order decides.** Raising a selector is not a fix.
- **Both drawers root every rule at their mount ID** (1,1,0) — nothing below reaches inside.
- **A fixture with no viewport meta makes Chrome emulate 980px.**
- **The rail nav button is a TOGGLE** — re-clicking it "to make sure" closes the drawer, and a walk
  then scans the same surface N times and reads as evidence.
- **A green gate proves reachability, never taste.** 102/102 and 6/6 surfaces PASS, and the verdict
  was still "not a proper mobile app".
- **Count the boxes and you will ship clipped text.** Row count said the 3-across tabs fit;
  `scrollWidth − clientWidth` per tab found 51px of label outside three pills.

## E4 · OPEN ITEMS TO RE-HOME BEFORE `mobile-followups.md` IS DELETED

Not closed by the redesign; each is his call, not ours:

- **The Scanner has no camera path.** `capture="environment"` on the file input opens the rear
  camera. One attribute, deliberately not added because it changes the scan flow's primary action.
- **~16.9 MB OCR model over cellular** with no consent screen or progress UI before the download
  starts.
- **Copy that assumes a mouse.** Coverage says "HOVER A GOAL TO FOCUS IT"; the Scanner says
  "or drop / paste an image here". Invisible to every automated check; he reviews copy every time.
- **The search drawer with a real on-screen KEYBOARD up is the one blocker neither confirmed nor
  cleared.** The audit measured a **168px letterbox showing 7.8% of an answer set**. A keyboard
  cannot be emulated headlessly — it needs a device, or a deliberate short-viewport test.
- **The essentials field is 5,335px at 375px** (~8 screens, down from 9,631). An IA question.
- **Fourteen 10x10 colour swatches in one row** in the regimen slot tray.
- **Font subsetting: 481 KB of first load.** A weight lever, not a responsiveness one.
- **"Issues especially on the other tabs"** — his words. Every Knowledge sub-tab (Absorption, ORAC,
  Conditions, Explore, Products) must be driven **by hand and looked at**; none was opened during the
  original pass.

---

# PART F — branch and worktree strategy

## F1 · Recommended shape

1. **Do not delete `mobile-responsive`.** It is the only record of the measurements, and it is
   unpushed, so keeping it costs nothing. **Tag it** so it survives a future branch prune:

       git tag mobile-retrofit-archive mobile-responsive

   Keep the branch pointer too until the B2 salvage has landed on master.

2. **Land the B2 salvage on master first, as its own small commit,** before any redesign work.
   The breadcrumb correction, the coverage-grid relocation and `wireBackGesture()` fix defects
   master ships today. Cherry-picking is not clean — they are mixed into `0c0aa575` with the layer —
   so re-apply them by hand from the diff. Each is small; the coverage one must carry its
   "position below line 1111 is load-bearing" comment with it, or the next tidy-up will move it back.

3. **New branch off master: `mobile-native`** — a name that does not read as a responsive retrofit.

4. **Build it in a `git worktree`, not by switching branches.** Master is the surface the probes and
   the demo builder run against, and switching branches under a running probe or a published demo is
   how a stale artifact gets shipped. `.claude/worktrees/` is **already gitignored**, which makes it
   the right home:

       git worktree add .claude/worktrees/mobile-native -b mobile-native master

5. **`node_modules` must be a junction, not a copy** — `dashboard/node_modules` measures **259 MB**
   and the root `node_modules` **28 MB** (puppeteer). From **PowerShell**, not bash:

       New-Item -ItemType Junction -Path .claude\worktrees\mobile-native\node_modules -Target "C:\Users\Light\Desktop\claude\health expert\node_modules"
       New-Item -ItemType Junction -Path .claude\worktrees\mobile-native\dashboard\node_modules -Target "C:\Users\Light\Desktop\claude\health expert\dashboard\node_modules"

   **`cmd //c mklink` failed from bash on this host** — that is why PowerShell is named here. Quote
   every path (the repo path contains a space).

6. **Run the board in the worktree before the first design commit** to establish its baseline:

       PYTHONUTF8=1 python tools/invariants.py

   If it is not 102/102 there on day one, that is a worktree problem, not a redesign problem — see
   F3. Know which before you start, because **a gate can go red because of a correction**, and on a
   post-fix red the first question is what was making it pass before.

7. **Do not merge to master until he has looked at a build on a phone.** The decision file makes this
   terminal: *"Every chunk of this redesign ends at his eyes on a device — not at a passing probe."*
   The vehicle is `tools/build_demo_singlefile.mjs --artifact`, republished to the **same** URL.

## F2 · Sequencing the demolition so the board never goes red

1. Salvage commit on master (B2). Board green.
2. Branch + worktree + junctions + baseline board run.
3. **One commit** that removes the `mobile.css` `<link>`, `data-mobile-nav`, and (after a grep
   confirms no reader) `id="appRail"` from `dashboard.html`, deletes `mobile.css`, **and** updates the
   "11 stylesheets" header sentence. Removing the sheet without the link, or the link without the
   sentence, is a half-cut.
4. Delete or re-point the three probes **in the same commit as anything that references them**.
   Nothing in `tools/invariants.py` references any probe by name — verified; probes are not board
   gates — so deleting them cannot red the board. Confirm anyway with:

       grep -rn "render_probe_mobile\|mobile_audit\|mobile_css_scan" --include=*.py --include=*.mjs --include=*.js --include=*.md .

5. Re-home E4's open items into `chronicle/mobile-redesign/` **before** deleting
   `mobile-followups.md`, and append (never edit) a build-log entry recording the reversal.
6. Rebuild (`node tools/build.mjs`), re-run the board, and only then start designing.

## F3 · Things that will bite in the worktree

- **`chronicle/next-chunk.md` is gitignored and per-session** — it does not travel to a worktree.
- **`eden/corpus/books/*.txt` are gitignored.** The book-anchored gates skip with a stated reason on
  a fresh checkout, which means **the worktree's board is weaker than the main tree's, not equal**.
  Do not read a worktree green as a main-tree green.
- **`dist-web/`, `temporary/` and `engine/` are gitignored** and will be absent.
- **Line endings vary per file.** `design-system.css` and both font docs are CRLF; most of the tree
  is LF. Run `python tools/safe_write.py check <path>` before writing.
- **Never republish a surface he is currently using.**

---

# PART G — what I could not determine

1. **Whether `id="appRail"` has any live reader.** The `?nav=` switch that plausibly used it was
   deleted in `1e5adb1e`. I did not grep the branch's `dist/main.js` or full `src/` tree for
   `appRail`. **Grep before keeping or removing it.**
2. **Whether `mobile_audit.js`'s matrix and `--selftest` still run correctly** — I read the file, I
   did not execute it. Every number quoted from it here is the number its own header, its commit
   messages, or `mobile-followups.md` records, not one I reproduced.
3. **The per-surface sub-12px and sub-44px counts** (225-430 text nodes; 316 at 1440 vs 305 at 375)
   are the layer's recorded measurements. I did not re-measure them.
4. **`tools/esbuild_web.mjs` in detail** — I confirmed only that a separate web esbuild entry exists
   and that `build.mjs` documents it as setting `__SPLIT_DATA__=true`.
5. **Whether the board is 102/102 right now.** I did not run `tools/invariants.py`. The 102 is
   counted from the `INVARIANTS` registry; 102/102 is what `next-chunk.md` reports for master.
6. **Whether any gate outside Part C would move.** I read all 102 registry entries and the bodies of
   the ones plausibly in scope; I did not read all 102 check functions. Treat Part C as the
   high-probability set, not an exhaustive proof.
7. **Whether the search-with-keyboard blocker can be cleared without a device.** It could not be
   emulated headlessly on the last attempt, and I found no evidence anyone has since tried a
   deliberate short-viewport substitute.
