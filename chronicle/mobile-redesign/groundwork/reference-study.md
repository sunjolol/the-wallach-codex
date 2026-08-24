# Reference study — what "a proper mobile app" means in 2026

_Groundwork for the mobile-first redesign. Written 2026-08-22. Independent of the inventory / IA /
surface-design fleet — this is the external standard those designs get measured against._

## Why this document exists

The rejection was comparative, not itemised: "Both regimen and scanner tabs are both scuffed, and the
knowledge tab just feels cheap and poorly thought out. None of this feels like a PROPER mobile app."

"Proper" is not a vibe. It decomposes into roughly ten interaction patterns this app actually needs,
each of which has a small number of best-in-class implementations whose *mechanics* — not aesthetics —
are the reason they feel right. This study extracts those mechanics so a designer can specify them and
a reviewer can tick them off.

## Method and honesty note

- Every claim below is tagged with where it came from. `[measured]` = a command run against this repo,
  shown inline. `[cited]` = a source in the list at the bottom. `[unverified]` = I believe it, could
  not confirm it from a primary source in this session, and am saying so rather than guessing.
- **Two primary sources I could not read.** `developer.apple.com/design/human-interface-guidelines/*`
  and `m3.material.io/components/*` are client-rendered; WebFetch returned page titles and no body for
  tab-bars, sheets, and navigation-bar/specs. Numbers attributed to Apple HIG and Material 3 below come
  from secondary sources (Apple developer session write-ups, Material component doc mirrors) and are
  marked as such. **Anyone specifying a hard dimension off this document should re-check it against the
  primary spec on a machine that can render those pages.**
- I did not drive any of these apps on a device in this session. Behavioural descriptions of named
  products come from published documentation, developer write-ups and reviews, not from my own
  observation, unless stated.

---

## Part 0 — Measured baseline: how far this codebase is from mobile-first

Run in the repo root, 2026-08-22, on `master`:

```
grep -rno "[0-9.]*vh" dashboard/assets/styles/*.css | wc -l          ->  13
grep -rn "dvh\|svh\|lvh" dashboard/assets/styles/*.css | wc -l       ->   0
grep -rn "safe-area-inset" dashboard/assets/styles/*.css | wc -l     ->   0
grep -rn "pointer: coarse\|hover: hover" dashboard/.../*.css | wc -l ->   0
grep -rn ":hover" dashboard/assets/styles/*.css | wc -l              -> 197
grep -rn 'title="' dashboard/assets/js/src --include=*.ts | wc -l    ->  30
grep -rn "backdrop-filter" dashboard/assets/styles/*.css | wc -l     ->  10
grep -rn "prefers-reduced-motion" dashboard/assets/styles/*.css      ->  15
grep -n "viewport" dashboard/dashboard.html
  -> <meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Read that as a diagnosis, not a scold. `[measured]`

1. **13 `vh` values, 0 dynamic viewport units.** On iOS Safari `100vh` is the *large* viewport — it
   includes browser chrome that is actually on screen, so any full-height element is taller than the
   visible area and its bottom is cut off. This alone makes a page feel like a web page. `[cited]`
2. **0 `safe-area-inset` references.** Nothing in the app knows about the home indicator or the notch.
   A bottom bar built without `env(safe-area-inset-bottom)` sits under the home indicator on every
   modern iPhone. This is the single most recognisable "this is a website" tell.
3. **197 `:hover` rules and 30 `title=""` attributes, with 0 `@media (hover: hover)` guards.** On touch,
   `:hover` fires on tap and *sticks* until you tap elsewhere; `title=` never appears at all. So 30
   pieces of information are currently invisible on a phone, and up to 197 rules can produce stuck
   states. Section 6 covers what to replace them with.
4. **The viewport meta lacks `viewport-fit=cover` and `interactive-widget=resizes-content`.** Without
   the first, `env(safe-area-inset-*)` returns 0 even if you use it; without the second the layout
   viewport does not shrink when the keyboard opens. `[cited]`
5. **`backdrop-filter` already appears 10 times, and `prefers-reduced-motion` 15 times.** The material
   vocabulary and the motion-accessibility habit already exist. Good news: the redesign extends an
   existing practice rather than introducing one.

---

## 1. Bottom tab bars — material, blur, elevation

### What the best do

**iOS 26 system tab bar (Apple).** The tab bar no longer sits welded to the screen edge. It is a
floating, rounded, translucent Liquid Glass slab over the content, and it *minimises on scroll down* —
collapsing to just the active tab, then re-expanding on scroll up (`tabBarMinimizeBehavior`). There is a
first-class **accessory shelf** directly above the bar that persists across tabs (the Music now-playing
bar is the canonical example) and rides down with the bar when it minimises
(`tabViewBottomAccessory`). A tab may be given a `search` role, which pulls it out to the trailing side
as a separate pill rather than an equal sibling. `[cited: Donny Wals, createwithswift, WWDC25 284]`

**Material 3 navigation bar (Google).** 80dp container height; the active destination is marked by a
filled icon plus a pill-shaped "active indicator" (64dp wide by default, 56dp in Material 3
Expressive); inactive destinations use outlined icons; items have a minimum width of 80dp.
`[cited: m3 secondary sources — the primary specs page did not render for me]`

### The mechanics to steal

- **Bar height: content 56–64px plus `env(safe-area-inset-bottom)` as *padding*, not margin.** The glass
  must bleed to the physical bottom edge; the touch targets must sit above the home indicator. Getting
  this wrong in either direction is the tell.
- **Fill/outline as the state, not colour alone.** Active gets a filled glyph and a pill behind it;
  inactive gets an outline glyph. Colour-only state fails at a glance and fails colour-blind users. This
  app already has four fixed category colours (minerals blue, vitamins orange, aminos green, omegas
  purple) doing semantic work, so the tab bar's active state should be shape-and-weight driven with one
  neutral accent, and must not compete with them.
- **Minimise on scroll down, restore on scroll up — with hysteresis.** Do not toggle per pixel.
  Accumulate scroll delta and change state only after ~10px of committed movement in one direction
  (Apple's own gesture-commit threshold is ~10px) `[cited]`, then animate over ~0.3s with a critically
  damped spring.
- **Material: `backdrop-filter: blur(20px) saturate(180%)` over a ~60%-opaque surface, plus a 1px bright
  top edge (`rgba(255,255,255,0.4)` in light).** That bright edge is what makes glass read as a physical
  layer rather than a translucent div. `[cited: apple-design skill]`
- **The accessory shelf is the pattern to steal here.** A persistent strip above the tab bar that
  survives tab switches is the right home for "scan in progress" or an open-gaps count. It is the mobile
  answer to what the desktop left rail does with persistent context.

### What NOT to steal

- Do not ship five tabs plus a "More". Three workspaces (Coverage, Regimen, Scanner) plus Search and
  Knowledge is already five destinations; the iOS 26 search-role pattern argues Search should be a
  trailing pill, not the fifth equal tab.
- Do not animate the bar's *height*. Animate transform and opacity; height animation reflows the
  scroller underneath and produces exactly the jank people read as "web".

---

## 2. Bottom sheets — detents, drag physics, dismissal

### What the best do

iOS sheets rest at *detents*: system `medium` (~half the screen height) and `large`, plus custom
fractional detents (e.g. 0.3 for a peek) and fixed-height detents. A grabber — a small horizontal
capsule at the top — signals resizability. A dimming scrim behind dismisses on tap. Dragging past a
detent applies force; releasing snaps to the nearest detent *given the release velocity*, not the
nearest detent by position. `[cited: Sarunw, Nil Coalescing, mackuba WWDC21 notes]`

Google Maps is the reference for a *non-modal* three-detent sheet (peek / half / full) that never fully
leaves the screen. Apple Maps and Yuka's product panel are the same family.

### The mechanics to steal — this is the section with real formulas

**Momentum projection (Apple's own, "Designing Fluid Interfaces", WWDC18 session 803):**

```
projectedDistance = (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate)
decelerationRate  ~ 0.998 for normal scroll feel; 0.99 for snappier
```

Take the pointer's release velocity, project where it *would* end up, pick the nearest detent to that
projected point, then animate there with the release velocity handed into the spring as initial
velocity. This is the difference between a sheet that "goes where you threw it" and one that snaps to
whatever happened to be nearest your finger. `[cited: WWDC18 803 / Nathan Gitter / apple-design skill]`

**Rubber-banding past a bound:**

```
rubberband(overshoot, dimension, c = 0.55) = (overshoot * dimension * c) / (dimension + c * |overshoot|)
```

The further past the bound, the less the sheet follows the finger. `[cited: apple-design skill]`

**Springs, not easings, for anything the finger touched.** Published Apple-style values: drawer/sheet =
damping 0.8, response 0.3s (slight overshoot, because the motion is momentum-driven); default UI =
damping 1.0, response 0.3–0.4s (critically damped, no bounce). Damping below 1.0 overshoots — reserve
that bounce for gesture-driven motion only. `[cited: apple-design skill]`

**Interruptibility is the actual quality bar.** A sheet mid-animation must be grabbable and reversible
at any frame, animating from its *current* value with its *current* velocity. A CSS transition cannot do
this well; a spring integrator driven by `requestAnimationFrame`, or a Web Animations API animation you
cancel and restart from the computed value, can. This is a genuine implementation cost and the designers
should know it before they specify three sheets.

**The other required details:** grabber capsule at top centre, roughly 36x5px with generous invisible
hit padding (Apple's ~10px hit padding around interactive elements applies) `[cited]`; scrim opacity
interpolating with sheet position rather than snapping on; `overscroll-behavior: contain` on the sheet's
inner scroller so a flick inside the content does not scroll the page behind; and the scroll-chaining
rule — when the sheet is at its largest detent and its content is scrolled to the top, a downward drag
must move the *sheet*, not the content.

### Where this app needs sheets

Everything the desktop shows in a right-hand drawer or a hover popover: the Knowledge entity page opened
from a Coverage tile, a food sheet opened from the foods list, a product detail, and (section 6) the
glossary definition. Detents give you back the thing a drawer gave you on desktop — context stays
visible behind the sheet, so tapping a nutrient tile does not feel like navigating away.

---

## 3. Large-title collapsing headers and scroll-linked chrome

### What the best do

iOS large titles render large and left-aligned at rest and collapse into the compact centred nav-bar
title as you scroll. There are three distinct appearance states — **standard**, **compact**, and
**scroll edge**, where scroll-edge (the state at the very top of a scroller) is *transparent*.
`[cited: Chariot Solutions, Apple developer forums]` iOS 26 formalises a "scroll edge effect": a soft
gradient/blur under the chrome so content passing beneath stays legible without a hard divider.
`[unverified — I could not read the primary HIG page; confirm the exact treatment before specifying it.]`

Apple Health, Apple Books, Things 3 and Craft all use the same skeleton: large title, then a horizontal
segmented control or filter row that scrolls away with the content, then the content.

### The mechanics to steal

- **Three states, not two.** At scroll-top the header has no background and no divider — it *is* the
  page. Once content is behind it, it gains material and a hairline. That transition is what makes a
  screen feel layered rather than "a header div".
- **Drive it from scroll position, not a threshold flip.** Interpolate title scale, title opacity,
  header background opacity and blur radius over roughly the first 40–60px of scroll. A binary class
  toggle at a single offset reads as cheap because it pops.
- **Implementation note for this codebase (offline, vanilla TS):** an `IntersectionObserver` on a 1px
  sentinel at the top of the scroller gives the state flip with no scroll handler; for the continuous
  interpolation, use a scroll handler on the scroll container throttled with `requestAnimationFrame`,
  writing a single CSS custom property (e.g. `--hdr-t: 0..1`) that the stylesheet consumes. One write
  per frame, no layout reads inside the handler.
- **The large title is where the screen's identity lives** — "Coverage", "Regimen", "Scanner". If the
  title is the only thing at the top, the phone screen has room to breathe. A large part of what "cheap"
  was diagnosing is a phone screen crowded with desktop chrome and no establishing shot.

---

## 4. Dense list rows with swipe actions

### What the best do

**Apple Mail:** swipe left reveals up to three actions (a customisable flag, delete/archive, and More);
swipe right reveals one. Both edges support the **full swipe** — dragging all the way across commits the
primary action without a tap. `[cited: MacRumors]` SwiftUI exposes this as
`swipeActions(edge:allowsFullSwipe:)`. `[cited: Apple docs]`

**Things 3:** swipe-to-select rows, then a bottom toolbar acts on the selection; ships haptic feedback.
`[cited: Cultured Code]`

**Linear Mobile:** native Swift/Kotlin specifically to guarantee fluidity; "tap to take action, swipe to
delete, snooze to deal with it later." `[cited: linear.app/mobile]`

### The mechanics to steal

- **Row height and rhythm.** Best-in-class dense rows run roughly 44–56px tall with a hairline divider
  inset to align with the text, not the screen edge — a small thing that consistently reads as native.
  Minimum touch target: Apple 44pt, Material 48dp, WCAG 2.2 AA floor 24x24 CSS px (SC 2.5.8), AAA 44x44
  (SC 2.5.5). `[cited: WCAG 2.2 sources]` Use 44 as the design floor; 24 is a legal minimum, not a
  target.
- **Progressive reveal, not a pop-open drawer.** The action pane widens 1:1 with the finger, icon and
  label cross-fade as it grows, and the background colour saturates as you approach the full-swipe
  threshold. That threshold is typically ~50% of row width; crossing it must produce a distinct visual
  commit (the icon jumps to the leading edge) so the user knows releasing will fire.
- **Rubber-band the swipe past its maximum**, using the formula from section 2.
- **Swipe is never the only path.** Every swipe action needs a non-gesture equivalent (long-press menu or
  a row overflow), both for discoverability and because swipe-only is an accessibility failure.
  `[cited: LogRocket]`
- **Haptic caveat, stated plainly:** haptic confirmation is a large part of why native swipe feels good,
  and the Web Vibration API is widely reported as unavailable in Safari on iOS. `[unverified — I did not
  test it this session; confirm on the owner's device before designing around it.]` If it is
  unavailable, the visual commit must carry the whole signal, which means it has to be *more* emphatic
  than the native equivalent, not less.

### Where this app needs it

The Regimen list (`dashboard/assets/js/src/views/regimen.ts`, 1,803 lines `[measured]`) is the obvious
candidate: swipe a product/food row to remove it, or to open its detail. Coverage tiles are a grid, not
a list, so swipe does not apply there.

---

## 5. Camera capture for reading text off a package

This is where "scuffed" is most expensive, because a bad capture produces a wrong result and this
project's prime rule is that a wrong number is a real harm.

### What the best do

**Yuka** — 85M users, barcode-first: the camera *is* the home screen after a short onboarding, scanning
is the app's first and default verb, and the result panel uses colour-coded rows with expandable
sections. `[cited: screensdesign, store listings]` The lesson is not the 0–100 score (this app must
never gamify coverage) but the **immediacy**: zero taps between opening the app and being able to scan.

**Open Food Facts** — larger database, explicitly "less polished" interface. `[cited: TMS Outsource]`
Its useful contribution is the *contribution loop*: when a product is unknown, it immediately offers to
let you add it rather than dead-ending.

**Apple VisionKit `DataScannerViewController`** — the platform reference for live text-from-camera. It
ships built-in **guidance** (system hints when the user should move closer or steady up), customisable
**item highlighting**, and a **region of interest** so only text inside a frame is considered.
`[cited: Apple docs, WWDC22 10025, WWDC23 10048]`

### The mechanics to steal

- **A region of interest, drawn.** A bright rectangle roughly the aspect of an ingredients panel, with
  everything outside dimmed to ~50%. It does two jobs: tells the recogniser where to look, and tells the
  user how to hold the phone. Without it, people point the whole phone at the whole box and the
  recogniser gets soup.
- **Live per-word highlighting inside the frame while scanning.** Seeing individual words light up as
  they are recognised is the strongest "this is working" signal available, and it is also the honest
  one — if nothing lights up, the user knows to move closer instead of tapping a shutter and waiting for
  a failure.
- **Dynamic guidance copy — one line, in the dim area below the frame:** "Move closer" / "Hold steady" /
  "Too dark — turn on the light". One message at a time, changing at most every ~1s so it does not
  strobe.
- **Controls in the bottom third; shutter dead centre.** The bottom 25–40% of the screen is the natural
  one-handed zone, and centre-bottom is reachable from either grip — which is exactly why the iOS Camera
  shutter sits there. `[cited: thumb-zone sources]` Torch bottom-left, gallery / manual-entry
  bottom-right, shutter centre at ~64–72px diameter.
- **A manual-entry escape hatch that is always visible.** Not buried. Some packages will never OCR.
- **The confirm/correct step is mandatory and is a design surface in its own right.** OCR is fallible and
  this app's rules forbid acting on an uncertain reading silently. The pattern that works: a bottom sheet
  at the medium detent showing the captured crop at the top and the recognised text below as
  **editable, tokenised chips** — one chip per recognised ingredient, each tappable to correct or delete,
  with a visible "+ add" chip. Low-confidence tokens are marked with a dotted underline, **not red** —
  red already means "bad ingredient" in this app's semantics and must not be overloaded. Nothing is
  committed until the user hits a primary button. Rejecting the whole read returns to the viewfinder
  with the frame still in place.
- **Never show a confident result built on an unconfident read.** If too few tokens were recognised, or
  mean confidence is below threshold, the correct screen is "I could only read part of this" with the
  partial chips — not a verdict.

### Constraint check for this project

`getUserMedia` requires a secure context, and `file://` is not a secure context in Chrome; camera access
from `file://` is unreliable-to-blocked across browsers. `[unverified — must be tested on the owner's
actual local build and device. This is an architectural fact-find, not a design question.]` If the
camera is only available on the web build (nutrientcodex.com, HTTPS), the mobile Scanner design needs a
defined, non-embarrassing behaviour in the local build — most likely manual entry as the primary path
with the camera affordance simply absent rather than present-and-broken. The scanner view is 1,347 lines
today `[measured: dashboard/assets/js/src/views/scanner.ts]`; whichever way this resolves it changes the
mobile Scanner IA, so it should be resolved **before** that surface is designed.

---

## 6. Long-form reading on a phone — and inline definitions on touch

### What the best do

**Apple Books / Kindle:** generous margins, a single column, no competing chrome; chrome hides on tap and
returns on tap. Kindle's tap-to-define shows a compact definition **anchored at the bottom of the
screen** with a "Full definition" affordance into the dictionary — deliberately not a floating tooltip.
`[cited: Kindle iOS behaviour write-ups]`

**Readwise Reader / Craft / NYT Cooking:** typographic hierarchy carries the structure — a display face
for headings, one body face, and rules and space instead of boxes-within-boxes. NYT Cooking in
particular is the reference for reference content you read while doing something else: big numbers,
short lines, steps that survive a glance.

**Wikipedia iOS:** link previews open as a card rather than navigating, so following a definition never
loses your place.

### The measurable rules

- **Measure: 30–50 characters per line on a phone**, versus 50–75 on desktop with ~66 the classic
  optimum. `[cited: UXPin, Baymard, Imperavi]` On a 390px-wide phone at 17px the constraint enforces
  itself, so the failure mode here is not lines that are too long — it is *side padding that is too
  small*.
- **Body 17px with line-height 1.5–1.6** (1.6 for long Wallach verbatims). `[cited: line-height sources;
  the "iOS body is 17pt" figure is unverified from the primary HIG page]`
- **Support Dynamic Type.** On the web that means sizing the type scale in `rem` and never setting a
  `px` font-size on body copy, so the OS text-size setting works. An app that ignores the OS text-size
  setting is instantly identifiable as a web page.
- **Paragraph spacing over indentation; hairline rules over card borders.** The current desktop design
  nests boxes; on a phone, nested boxes eat 32–48px of horizontal room and are the main *mechanical*
  cause of "cheap".

### Replacing the hover tooltip — the specific problem this app has

`[measured]` 197 `:hover` rules, 30 `title=` attributes, 0 `@media (hover: hover)` guards, and a
`dashboard/assets/js/src/views/gloss-tooltip.ts` whose own header comment says the definition shows "on
hover (desktop), focus (keyboard), or tap (touch)". So a tap path already exists — the open question is
what it should *look like* on a phone.

The three patterns the best apps use, in descending order of suitability here:

1. **Bottom-anchored definition bar (Kindle).** Tap a glossed term: the term takes a highlighted state
   and a compact panel rises from the bottom with the term, its definition, and a "Read more" that opens
   the Knowledge entity. It never occludes the word you tapped, never gets clipped by the viewport, has
   room for two lines of real text, dismisses on tap-outside or swipe-down, and is the *same component*
   as the app's other bottom sheets at a small detent. **This is the recommendation.**
2. **Inline expansion.** Tapping pushes the paragraph apart and reveals the definition in place.
   Excellent for one definition; bad when a paragraph has four glossed terms, because the reader loses
   their line each time.
3. **A floating popover pinned near the word.** This is what a desktop tooltip becomes if you port it
   literally. On a phone it is clipped, it covers the sentence, and it is the pattern most likely to
   read as "a web page's tooltip". Avoid.

Whichever is chosen, the touch rules are the same: the tappable target must be the word plus at least
44px of vertical hit area (achievable without changing line-height via a transparent pseudo-element with
`padding-block`); the glossed term needs a *persistent* visual affordance (dotted underline), because
there is no hover to discover it with; and `@media (hover: hover)` must gate every hover style so
nothing sticks after a tap.

---

## 7. Search designed keyboard-up

### The constraint, stated numerically

On a modern phone the software keyboard plus its accessory bar occupies roughly **45–55% of viewport
height** in portrait. `[unverified as an exact figure — it varies by device, language and keyboard; the
design consequence holds regardless]`. So "search" on mobile is really a design problem inside a roughly
350x350px box.

### The platform mechanics

- **None of `vh`, `svh`, `lvh` or `dvh` react to the keyboard.** The two real tools are
  `interactive-widget=resizes-content` in the viewport meta (which shrinks the layout viewport so `dvh`
  reflects the reduced space) and `window.visualViewport` for anything that must track the keyboard
  precisely. `[cited: HTMHell, bramus explainer, Moretti]`
- `dvh`/`svh`/`lvh` reached Baseline Widely Available in June 2025 and are supported in Safari 15.4+.
  `[cited: viewport-unit sources]` This project can use them with no fallback concern on any device the
  owner is likely to hold.

### What the best do

- **The input pins to the top, results fill downward, and the keyboard is expected rather than fought.**
  Layout: search field under the safe area, then a scrolling result list sized to
  `visualViewport.height` minus the field.
- **Results update on every keystroke, from the first character.** `[cited: Algolia]` An offline,
  in-bundle corpus makes this trivial here — there is no network latency to hide, which means there is
  no excuse for a spinner in search at all.
- **Recent and suggested queries fill the empty state**, so the keyboard-up screen is never blank.
  `[cited: Algolia]` Here: recent questions plus a small curated set of starter questions — which is
  also the honest answer to "what can I even ask Wallach?"
- **Scroll-to-dismiss the keyboard.** Dragging the result list down dismisses the keyboard and returns
  half the screen. iOS does this system-wide; on the web it is a `blur()` at a scroll-start threshold.
  Non-negotiable when results are long.
- **A visible Cancel that returns to where you were**, not a back-stack guess.
- **Group results by kind with sticky section headers** rather than one flat mixed list — in a 350px-tall
  box the user sees three or four rows at a time and needs to know what kind of thing they are looking
  at.

---

## 8. Data-dense tables and comparisons without horizontal scroll

### The rule

A horizontally scrolling table on a phone is the clearest single "responsive web page" signal. The
established alternatives, in order of preference:

1. **Row-to-card transposition.** Each row becomes a card; each cell becomes a label/value pair, the
   label coming from the column header (commonly a `data-label` attribute plus a `::before`).
   `[cited: Quackit, dev.to]` Right when the row is the unit of meaning — e.g. one food's nutrient
   contributions.
2. **One primary column plus progressive disclosure.** Show the one number that matters per row; tapping
   opens a sheet with the full set. Right for long lists (foods, products).
3. **Transposed comparison.** For two or three items, swap the axes: attributes become rows, items
   become 2–3 narrow columns. Two fits comfortably at 390px; three is the practical ceiling.
4. **Horizontal scroll with a pinned first column** — acceptable *only* when the column relationship is
   itself the content, and only with a visible affordance (fading edge plus a scroll shadow on the
   pinned column). `[cited: UXmatters, UX Movement]` Some sources argue a genuine comparison table needs
   horizontal scroll to preserve relationships; if this app ever needs it, it needs it on exactly one
   surface, deliberately, with the affordance built.

**Never** use pattern 4 as the default because it was the easiest port.

### Specific to this app

Coverage is "a map of gaps, not a score", and 90 tiles is a lot of tiles. A 90-cell grid at 390px is
either horizontally scrolling or has unreadable labels — both are the failure the owner named. The
honest mobile-first form of a gap map is therefore probably not a shrunken desktop grid but a
**gaps-first list** (what is uncovered, ordered), with the full 90-grid as a second view. That is an IA
call for the IA fleet; the table rule above is what forces the question.

---

## 9. Empty, loading, and error states that feel considered

### Loading

- **Skeletons for content whose shape is known** (a list, a sheet, a detail panel); **spinners only for
  short blocking actions** (submitting, processing). Skeletons must mirror the real layout — same row
  heights, same row count. `[cited: Onething, LogRocket, NN/g]`
- Skeletons are the wrong tool below ~1s of wait; a flash of skeleton is worse than nothing.
  `[cited: LogRocket]`
- **The honest note for this project:** the local build has no network at runtime and all data is inlined
  in the bundle, so most "loading" here is not I/O — it is parse and render time. The right answer is
  usually *no loading state at all*, and where a render genuinely exceeds ~100ms the fix is to make the
  render faster (virtualised lists, deferred off-screen sections), not to decorate the wait. Shipping a
  fake skeleton for data already in memory is exactly the fakery the `dashboard-code` anti-fakery rule
  exists to prevent.

### Empty

The research-backed shape of a good empty state: it explains what will appear here, and it contains the
action that fills it. `[cited: NN/g]` The 2026 onboarding literature adds the sharper version — **an
empty state that feels already partly filled** performs far better than a blank one, because it turns
instruction into completion. `[cited: Digia, UserOnBoarding]`

Applied here, without gamifying: the Regimen empty state should not say "No items yet." It should say
what a regimen is, show two or three high-leverage starting points, and let one tap start it. Coverage
with no profile should show the map of gaps *as it would look*, dimmed, with the single action that
populates it.

### Error

Three requirements, all of which this codebase's doctrine already implies: name what went wrong in plain
language, name what the user can do, and never present a partial result as a whole one. For the Scanner
specifically, "I could not read this" is a designed screen with a retry and a manual path — not a toast.

---

## 10. First-run that is not a slideshow

### What the evidence says

The top-performing 2026 onboarding flows share a very small pattern set: **a meaningful first action,
progressive disclosure, and an empty state that feels filled**. `[cited: Digia]` Value-first apps drop
the user into real content within ~30 seconds and defer account and personalisation until after.
`[cited: productgrowth.in, designstudiouiux]` Progressive onboarding teaches in context, the first time a
feature is used, rather than front-loading screens. `[cited: UserOnBoarding Academy]`

### What to steal, specifically

- **The first screen is the app, not a story about the app.** There is no account and no network here, so
  there is nothing to gate on: the first screen can legitimately be Coverage in a real, populated
  example state.
- **One question at a time, and only questions that change what the user sees.** This project has a
  standing ruling that a goal changes attention and ordering, never the denominator — so a first-run that
  asks for a goal is honest, and one that implies the goal changes the score would be a doctrine
  violation. Ask at most two things.
- **Teach the two gestures that are not discoverable** — the swipe action on a Regimen row, and the tap
  on a glossed term — as one-time inline coach marks the first time the user lands on that surface, not
  as a carousel at launch.
- **A visible, dismissible "how this works" entry point** that survives onboarding, so the explanation is
  retrievable rather than one-shot.
- **Avoid:** a paged intro carousel with dots; any permission prompt before the user has seen why; a
  modal tour with Next / Next / Next.

---

## 11. Cross-cutting mechanics — the shared vocabulary

| Thing | Value | Source |
|---|---|---|
| Gesture commit threshold | ~10px before locking to a drag axis | apple-design skill |
| Hit padding around controls | ~10px beyond the visual bounds | apple-design skill |
| Touch target floor | 44pt Apple / 48dp Material / WCAG 2.2 AA 24px min, AAA 44px | WCAG 2.2 |
| Highlight timing | on `pointerdown`, commit on `pointerup` | apple-design skill |
| Momentum projection | `(v / 1000) * d / (1 - d)`, d ~ 0.998 | WWDC18 803 |
| Rubber-band | `(x * dim * 0.55) / (dim + 0.55 * abs(x))` | apple-design skill |
| Sheet / drawer spring | damping 0.8, response 0.3s | apple-design skill |
| Default UI spring | damping 1.0, response 0.3–0.4s | apple-design skill |
| Glass material | `blur(20px) saturate(180%)`, ~0.6 alpha, 1px `rgba(255,255,255,.4)` top edge | apple-design skill |
| Large-text tracking | ~ -0.02em; body ~0 | apple-design skill |
| Reduced motion | replace slides and springs with short opacity cross-fades | apple-design skill |
| Mobile measure | 30–50 characters per line | UXPin / Baymard |
| Body line-height | 1.4–1.6 | line-height sources |
| Material 3 nav bar | 80dp tall, 64dp active indicator (56dp Expressive) | m3, secondary |

**Required page-level plumbing before any of the above can work:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover,
      interactive-widget=resizes-content">
```

```css
@media (hover: hover) and (pointer: fine) { /* every :hover rule lives in here */ }
.bar            { padding-bottom: calc(12px + env(safe-area-inset-bottom)); }
.sheet-scroller { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
html            { height: 100dvh; }                    /* never 100vh */
*               { -webkit-tap-highlight-color: transparent; }  /* then design your own :active */
body            { touch-action: manipulation; }        /* kills double-tap-zoom tap delay */
```

The last line matters more than it looks. Without `touch-action: manipulation`, taps can carry a
perceptible delay, and a delayed tap is the most primal "this is a web page" signal there is.

---

## 12. THE TASTE RUBRIC

Eighteen statements. Each is checkable by a reviewer against a screenshot, a short screen recording, or
one grep. A surface is not done until every applicable line is ticked.

**Chrome and layout**

1. **No content, control, or bar bottom edge is obscured by the home indicator.** Every fixed bottom
   element pads by `env(safe-area-inset-bottom)`, and the page declares `viewport-fit=cover`.
   _Check: screenshot on a device with a home indicator; `grep -c safe-area-inset` > 0._
2. **No `100vh` anywhere.** Full-height uses `dvh`/`svh`.
   _Check: `grep -rn "[0-9]vh" dashboard/assets/styles/` returns only `dvh`/`svh`/`lvh`._
3. **Every screen has one establishing element at the top** — a large title or equivalent — and the top
   15% of the screen is not a dense strip of controls. _Check: screenshot at scroll-top._
4. **Chrome is transparent at scroll-top and gains material only once content is behind it**, and the
   transition is interpolated over scroll distance rather than popping at a threshold.
   _Check: slow-scroll screen recording._
5. **Primary actions sit in the bottom 40% of the screen.** Nothing done more than twice per session
   lives in a top corner. _Check: mark the primary action on a screenshot._

**Touch**

6. **Every interactive target is at least 44x44px** including invisible hit padding, and adjacent targets
   are separated by at least 8px. _Check: overlay a 44px grid on a screenshot._
7. **No hover state can stick after a tap.** Every `:hover` rule sits inside `@media (hover: hover)`.
   _Check: count of `:hover` outside a hover media query is 0._
8. **No information is delivered only by `title=` or only by hover.**
   _Check: `grep -rn 'title="' dashboard/assets/js/src` returns 0 informational uses; each former
   tooltip has a named touch replacement._
9. **Taps respond on press, not on release** — a pressed state appears within one frame of `pointerdown`
   — and the default grey tap highlight has been replaced by a designed `:active` state.
   _Check: slow-motion recording of a single tap._

**Motion**

10. **Anything the finger dragged animates with a spring that inherits release velocity**, and can be
    grabbed and reversed mid-flight. _Check: fling a sheet hard and gently — they must not land in the
    same place; grab one mid-animation — it must catch._
11. **Nothing past a boundary follows the finger 1:1** — overscroll and over-drag are rubber-banded.
    _Check: drag a sheet above its largest detent._
12. **No animation reflows layout.** Motion is transform and opacity only.
    _Check: a Performance recording shows no layout during the transition._
13. **`prefers-reduced-motion: reduce` replaces every slide and spring with a cross-fade**, and nothing
    breaks. _Check: enable the OS setting and repeat the flow._

**Content**

14. **No horizontal scrolling anywhere except one deliberately designed comparison surface** — and that
    one has a pinned first column and a visible edge affordance. _Check: drag every screen sideways._
15. **Body copy runs 30–50 characters per line at 1.5–1.6 line-height, and respects the OS text-size
    setting.** _Check: count characters on a screenshot line; set device text size to XL and reload._
16. **Nested boxes are at most one deep.** Structure comes from space, weight and hairlines — not cards
    inside cards inside panels. _Check: outline every border on a screenshot._

**States**

17. **Every empty state names what will appear here and contains the action that fills it**, no empty
    state is a bare sentence, every error names the cause in plain language and offers a next step, and
    no loading affordance exists for data already in the bundle.
    _Check: force each state and screenshot it._
18. **Every fallible reading is confirmed before it is used.** The Scanner never presents a verdict built
    on an unconfirmed OCR pass; the correction step is editable per token and reversible.
    _Check: scan a deliberately blurry package._

**Two project-doctrine lines to keep in view while ticking the above:** Coverage is a map of gaps and
must not read as a score at any size; and nothing in the mobile chrome may recolour or compete with the
four fixed category colours.

---

## 13. What I could not determine

Stated plainly rather than guessed, per this project's prime rule.

1. **Primary-source dimensions from Apple HIG and Material 3.** Both sites are client-rendered; WebFetch
   returned only page titles for `human-interface-guidelines/tab-bars`,
   `human-interface-guidelines/sheets`, and `m3.material.io/components/navigation-bar/specs`. Every
   Apple and Material number above comes from a secondary source and should be re-verified before it is
   written into a spec.
2. **The exact iOS 26 "scroll edge effect" treatment** — gradient, blur, or both, and its depth.
   Secondary sources name the three appearance states but not the effect's parameters.
3. **Whether the Web Vibration API works on the owner's device and browser.** Widely reported as
   unsupported in Safari on iOS; I did not test it. This decides whether swipe and long-press need extra
   visual compensation.
4. **Whether `getUserMedia` works from the local `file://` build.** The largest open question in this
   study, because it determines the Scanner's mobile IA. Needs a device test, not a search.
5. **The real keyboard-height fraction on the owner's phone.** I used ~45–55% as a planning figure; read
   the actual value off `window.visualViewport.height` on the device before laying out search.
6. **The current mobile build's measured behaviour.** I did not drive the app on a phone this session.
   Part 0 is a static read of CSS and markup — evidence of *risk*, not evidence of what the owner saw.
   The inventory fleet's findings supersede Part 0 wherever they conflict.

---

## Sources

Tab bars and navigation:
- [Exploring tab bars on iOS 26 with Liquid Glass — Donny Wals](https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/)
- [Making the tab bar collapse while scrolling — Create with Swift](https://www.createwithswift.com/making-the-tab-bar-collapse-while-scrolling/)
- [Build a UIKit app with the new design — WWDC25 session 284](https://developer.apple.com/videos/play/wwdc2025/284/)
- [Navigation bar — Material Design 3 (specs)](https://m3.material.io/components/navigation-bar/specs)
- [Material 3 Expressive Navigation Bar](http://ui.banegasn.dev/navigation-bar/)

Sheets and gesture physics:
- [How to present a Bottom Sheet in iOS 15 — Sarunw](https://sarunw.com/posts/bottom-sheet-in-ios-15-with-uisheetpresentationcontroller/)
- [Overview of resizable sheet APIs in SwiftUI — Nil Coalescing](https://nilcoalescing.com/blog/ResizableSheetInSwiftUI/)
- [Customize and resize sheets in UIKit — WWDC21 notes, mackuba](https://mackuba.eu/notes/wwdc21/customize-and-resize-sheets-uikit/)
- [Designing Fluid Interfaces — WWDC18 session 803](https://developer.apple.com/videos/play/wwdc2018/803/)
- [Building Fluid Interfaces — Nathan Gitter](https://medium.com/@nathangitter/building-fluid-interfaces-ios-swift-9732bb934bf5)
- [apple-design skill — concrete parameters](https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md)

Headers:
- [Large Titles For Navigation Bars in iOS 11 — Chariot Solutions](https://chariotsolutions.com/blog/post/large-titles-ios-11/)

Lists and swipe:
- [swipeActions(edge:allowsFullSwipe:content:) — Apple](https://developer.apple.com/documentation/swiftui/view/swipeactions(edge:allowsfullswipe:content:))
- [How to Customize Mail App Inbox Gestures — MacRumors](https://www.macrumors.com/how-to/customize-apple-mail-inbox-gestures-ios-11/)
- [Things — Features, Cultured Code](https://culturedcode.com/things/features/)
- [Linear Mobile](https://linear.app/mobile)
- [Designing swipe-to-delete and swipe-to-reveal interactions — LogRocket](https://blog.logrocket.com/ux-design/accessible-swipe-contextual-action-triggers/)

Camera and OCR:
- [DataScannerViewController — Apple](https://developer.apple.com/documentation/visionkit/datascannerviewcontroller)
- [Capture machine-readable codes and text with VisionKit — WWDC22 10025](https://developer.apple.com/videos/play/wwdc2022/10025/)
- [What's new in VisionKit — WWDC23 10048](https://developer.apple.com/videos/play/wwdc2023/10048/)
- [Yuka — Food & Cosmetic Scanner UI Breakdown](https://screensdesign.com/showcase/yuka-food-cosmetic-scanner)
- [Must-Try Apps Like Yuka — TMS Outsource](https://tms-outsource.com/blog/posts/apps-like-yuka/)

Reading and typography:
- [Optimal Line Length for Readability — UXPin](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/)
- [Readability: The Optimal Line Length — Baymard](https://baymard.com/blog/line-length-readability)
- [Line length — Imperavi, UI Typography](https://imperavi.com/books/ui-typography/basis/line-length/)
- [Typography for Long-Form Reading — Designer Daily](https://www.designer-daily.com/typography-for-long-form-reading-designing-pages-people-actually-finish-213373)

Viewport and keyboard:
- [Control the Viewport Resize Behavior with interactive-widget — HTMHell](https://www.htmhell.dev/adventcalendar/2024/4/)
- [viewport-resize-behavior explainer — bramus](https://github.com/bramus/viewport-resize-behavior/blob/main/explainer.md)
- [Fix mobile keyboard overlap with visualViewport — Francisco Moretti](https://www.franciscomoretti.com/blog/fix-mobile-keyboard-overlap-with-visualviewport)
- [CSS dvh, svh and lvh explained — CSS Toolkit](https://csstoolkit.net/blog/css-dvh-svh-lvh-guide/)

Search:
- [Mobile search UX best practices — Algolia](https://www.algolia.com/blog/ux/mobile-search-ux-best-practices)
- [Best practices for search autocomplete on mobile — Algolia](https://www.algolia.com/blog/ecommerce/search-autocomplete-on-mobile)

Tables:
- [Designing Mobile Tables — UXmatters](https://www.uxmatters.com/mt/archives/2020/07/designing-mobile-tables.php)
- [Stacked Rows on Mobile Table Template — Quackit](https://www.quackit.com/html/templates/tables/Stacked_Rows_on_Mobile_Table.cfm)
- [Stacked lists: the best pattern for large data tables — UX Movement](https://uxmovement.substack.com/p/stacked-lists-the-best-pattern-to)

States and onboarding:
- [Skeleton Screens vs. Progress Bars vs. Spinners — NN/g](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/)
- [Empty States in Application Design: 3 Guidelines — NN/g](https://www.nngroup.com/videos/empty-states-in-application-design-guidelines/)
- [Skeleton Screens vs Loading Spinners — Onething Design](https://www.onething.design/post/skeleton-screens-vs-loading-spinners)
- [Skeleton loading screen design — LogRocket](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/)
- [Mobile App Onboarding: Activation, Patterns, Retention — Digia](https://www.digia.tech/post/mobile-app-onboarding-activation-retention/)
- [What Is Progressive Onboarding? — UserOnBoarding](https://useronboarding.academy/post/progressive-onboarding)

Touch targets and reach:
- [Target Size (Minimum) — WCAG 2.2 SC 2.5.8 (AA)](https://wcag22aa.org/new-criteria/target-size/)
- [WCAG 2.5.5 Target Size (Enhanced) — Silktide](https://silktide.com/accessibility-guide/the-wcag-standard/2-5/input-modalities/2-5-5-target-size-enhanced/)
- [Designing for the Thumb Zone — Timothy Graf](https://timgraf.com/ux-design/designing-for-the-thumb-zone-a-modern-guide-to-mobile-ux-that-respects-human-anatomy/)
- [Mastering the Thumb Zone — Parachute Design](https://parachutedesign.ca/blog/thumb-zone-ux/)
