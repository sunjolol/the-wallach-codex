# Mobile redesign — the constraints and references brief

_The one document to read before touching the mobile redesign. Written 2026-08-22 by folding eight
independent groundwork investigations into a single set of resolved facts._

**What this is.** Not a design and not an IA. This is what is *actually true* — what the engines
support, what the data really looks like, what the type system measures, what the performance budget
is, what "a proper mobile app" means as a checkable rubric, what has to be torn down, and how the
owner reviews. Where two investigations disagreed, this document **resolves the conflict and states
which way and why** rather than listing both views. Where something could not be determined, it is a
numbered UNKNOWN at the bottom with what it would take to settle it.

**Provenance.** Every number traces to one of the eight files in this directory:
`engine-capabilities.md` · `reference-study.md` · `real-data-shapes.md` · `typography.md` ·
`teardown-map.md` · `delivery-review.md` · `performance-budget.md` ·
`accessibility-conditions.md`. Read those for method and reproduction commands; read this for the
answer. Tags: **[M]** measured on this machine · **[C]** cited authoritative source · **[R]** recalled
and unverified — treat as a lead.

**Two rules that bind this document itself.** §00.A: nothing here adds, changes, or infers a Wallach
amount, dose, target, deficiency sign, or health claim. The redesign re-presents existing data and
never sources new data. §00.B.3: uncertainty is surfaced loudly, never smoothed.

---

## Read this first

The five things that most change how you would design. If you read nothing else, read these.

### 1 ★ The environment the rejection was formed in cannot show what you are building

The owner drove a **claude.ai artifact URL on his phone**. A published artifact renders inside a
sandboxed iframe on claude.ai. If that is true — and it is a strong inference, not a measurement
(UNKNOWN 1) — then the review harness **structurally cannot deliver**:

| What the design needs | What the harness does to it |
|---|---|
| `100dvh` app shell | resolves to the *iframe's* height. The URL-bar-collapse behaviour `dvh` exists to solve does not reproduce in review at all. |
| `env(safe-area-inset-*)` | `0px` unless the iframe is edge-to-edge. Notch and home-indicator padding are invisible in review and appear only on the real device. |
| `position: fixed` bottom bar | fixed to the iframe, not the screen. Looks right; behaves differently. |
| `VisualViewport` keyboard avoidance | reports the iframe's viewport. Keyboard behaviour cannot be judged in review. |
| camera / `navigator.share` / `vibrate` | need `allow="camera"` / `allow="web-share"`; vibrate is blocked in cross-origin iframes regardless. |
| the OCR engine | 16 MB artifact cap vs a 16.9 MB minimum engine. Arithmetically impossible. |

On top of that the artifact is a **15.32 MiB single blob on every load**, against the web build's
2.72 MB first paint — a 17× gap on a phone on cellular, never measured on his device (UNKNOWN 9).

**Consequence: some part of "none of this feels like a PROPER mobile app" may be the harness, not the
design.** Redesigning against the harness's behaviour instead of the phone's would be an expensive
mistake. `engine-capabilities.md` §7 contains a ready-to-publish probe page that settles every row
above in ten minutes on the real phone. **Publish it and read it before the first surface is drawn.**

### 2 ★ Startup is already fine. Interaction is what is broken.

Measured at 6× CPU throttle on a 390×844 mobile viewport, driving the real app:

| | Budget | Today |
|---|---:|---:|
| First contentful paint | ≤ 1,000 ms | **704 ms** local / 836 ms web — inside |
| App interactive | ≤ 1,500 ms | **~1,190 ms** — inside |
| Any tab switch, sync | ≤ 200 ms | Knowledge→Conditions **413–466 ms on every visit**; Products **328–332 ms on every visit** |
| Search keystroke → results | ≤ 500 ms | **1,524 ms** |

Conditions and Products are **not memoised** — they pay full DOM-construction cost every single
visit. Search builds **201 full answer bodies and 2,495 gloss spans while zero rows are open**.

**Scuffed is what a 400 ms tap feels like.** The performance work in this redesign belongs in render
volume and DOM node counts, never in a loading strategy — the entire 13.1 MB dataset is already
resident in memory at boot, so there is nothing to lazy-load and no I/O latency to hide.

### 3 ★ The data does not have the shape most layouts assume

Every one of these is measured, and each one breaks a common design instinct:

- **56 of 91 essentials have no numeric Wallach target.** Only 35 do. "No Wallach target stated" is a
  first-class state in **three distinct flavours**, not an empty slot or an error. Silver carries a
  *ceiling*, which must never render where a target renders.
- **A single claim card can be 3,456 characters** (~2,200 px of text at 375px). Median is ~900.
- **One search for "calcium" renders 201 rows and 268,497 characters of text** into the DOM,
  re-rendered on every keystroke, while only 15 rows are visible.
- **A product detail sheet is a 129-row table** with a 971-character block of unbroken blend prose in
  it. That is a page, not a card.
- **Five coverage tiles can never leave gap by buying anything.** With all 215 products in one
  regimen: chloride, sulfur, silica and flavonoids stay NOT COVERED; sodium tops out at PARTIAL. Any
  "close your gaps" affordance that routes to shopping is proposing something the data cannot
  deliver.
- **The empty Coverage state is 50 grey tiles out of 91 and 12.3 screens of scroll at 390px.**
- **The ledger always reads `90 counted · 91 shown`.** Omega-9 is `essential:false`. Any mobile
  summary that prints one number has to carry that reconciliation.

### 4 ★ The type system's own measurements force four decisions

Not taste — arithmetic, measured against the actual `.ttf` files in the repo's own Chromium:

1. **Body is 17px, not 16px.** Space Grotesk's x-height ratio is **0.490**, below every reference
   sans measured in the same engine (Roboto 0.530, Arial 0.520). 16px Space Grotesk reads like 14.8px
   Roboto, to an audience that skews older.
2. **`--ds-ink-faint` is not a text colour** — 2.94:1 on cream, failing AA in every pairing. It is
   used for kickers, eyebrows, meta lines and citations across the app, often at 9.6px. This is the
   single worst readability defect in the system.
3. **Tab labels are sentence case.** `KNOWLEDGE` at a legible 13px Chakra Petch measures 77.8px in a
   75px cell. `Knowledge` at 13px measures 66.5px and fits with slack. The discarded retrofit's
   answer was 8.3px — roughly half the legibility floor.
4. **Changing numerals go in JetBrains Mono or Space Grotesk.** Bruno Ace and Chakra Petch ship **no
   `tnum` table**, so two shipped `font-variant-numeric: tabular-nums` declarations are no-ops today,
   and Bruno Ace's `0` is 2.9× the width of its `1` — a coverage count going 11 → 90 will visibly
   jump on a narrow column.

### 5 ★ The app is built out of 2018 layout primitives. That is the mechanical cause of "feels like a web page".

Measured across `dashboard/assets/styles/*.css` on master:

| | Count | Consequence |
|---|---:|---|
| `vh` values | **13** | `100vh` is the *large* viewport on iOS: the box overhangs the screen and takes its last row with it. Seven live sites. |
| `dvh` / `svh` / `lvh` | **0** | |
| `env(safe-area-inset-*)` | **0** | Nothing knows about the notch or the home indicator. |
| `viewport-fit=cover` in the meta | **absent** | ★ **Every `env(safe-area-inset-*)` a designer writes resolves to `0px` on an iPhone until this is added.** Two tokens. Highest-value one-line prerequisite in the whole project. |
| `interactive-widget=resizes-content` | **absent** | The layout viewport does not shrink when the keyboard opens. |
| `:hover` rules | **197** | On touch, `:hover` fires on tap and *sticks*. |
| `@media (hover: hover)` guards | **0** | |
| `title=""` attributes in `src/` | **30** | 30 pieces of information are invisible on a phone. |
| `touch-action` | **0** | Without `touch-action: manipulation` taps carry a perceptible delay — the most primal "this is a web page" signal there is. |
| `@container`, nesting, `scroll-snap`, `subgrid`, `@layer`, `@supports`, `content-visibility` | **0 each** | |
| `ResizeObserver` / `IntersectionObserver` / `visualViewport` / Pointer Events / `<dialog>` / popover in `src/` | **0 each** | |

**Nothing is stopping the redesign from using the modern set. It has simply never been used here.**
That is good news: it means the gap is closable with primitives, not with a framework.

---

## Engine capability verdicts

Verdicts are for the **union of all three targets** — the strictest one wins. Where the strict target
is iOS Safari, the row is flagged **☞ iOS**. Everything marked [M] was measured on
**Chrome 149.0.7827.22** (puppeteer 25.1.0) on a real `file://` page.

**Target (b), the pinned portable engine, constrains nothing.** The decided candidate is Ungoogled
Chromium ~151 — *newer* than the 149 everything was measured in, so every green below stays green
there. It is decided but **not acquired**; the engine choice is deliberately deferred to the end.
Note that the "no fallbacks, no polyfills, no defensive coding" licence in
`2026-08-03-pinned-engine.md` was written **before** nutrientcodex.com existed and before the owner
started reviewing on a phone. That licence is scoped to target (b) only. The table below is the price
list for the other two.

### The one table

| Feature | Verdict | Notes |
|---|---|---|
| **Layout & structure** | | |
| `dvh` / `svh` / `lvh` | **SAFE** | [M] 149; [R] Safari 15.4+. **The single highest-value adoption in this redesign.** Never `vh` again. |
| `env(safe-area-inset-*)` | **SAFE — with a prerequisite** | [M] supported. ⚠ **Requires `viewport-fit=cover`, which the app does not have.** Add it *and* verify on the real phone; an emulator will lie either way. |
| Container queries (`@container`) | **SAFE** | [M]; [R] Safari 16.0+. Unused today, nothing prevents it. |
| `subgrid` | **SAFE** | [M]; [R] Safari 16.0+. |
| `:has()` | **SAFE** | [M] **and already shipping in 10 places.** |
| CSS nesting | **SAFE** | [M] `CSSNestedDeclarations`; [R] Safari 17.2+ for the relaxed syntax. esbuild does **not** transpile CSS here — sheets are copied, so what you write is what ships. |
| `aspect-ratio`, `clamp()`, `gap`, grid | **SAFE** | Already load-bearing. |
| `content-visibility` | **SAFE-WITH-FALLBACK** | [M]; [R] Safari 18.0+. Fallback is today's behaviour, so it cannot break anything. **Always pair with `contain-intrinsic-size`** or the scrollbar jumps. |
| `field-sizing: content` | **AVOID** | [M] true in 149; [C] Safari support only ~June 2026. ☞ iOS. Use fixed `rows` or JS autosize. |
| `interpolate-size: allow-keywords` | **AVOID** | [M] true in 149; [R] not in Safari. ☞ iOS. Animate height with `grid-template-rows: 0fr → 1fr` or a measured pixel height. |
| **Motion** | | |
| `prefers-reduced-motion` | **SAFE — and mandatory** | Already used 15×. See the Accessibility contract: the *fallback* is where this codebase has a live defect. |
| Web Animations API (`Element.animate`) | **SAFE** | [M]. The safest tool for anything CSS cannot do — and the only practical way to get interruptible, velocity-inheriting motion. |
| View Transitions (same-document) | **SAFE-WITH-FALLBACK** | [M]; [R] Safari 18.0+. Fallback is trivial and **must be written**: `if (!document.startViewTransition) { update(); return; }`. Best tool available for tab→tab and list→detail. |
| `@starting-style` | **SAFE-WITH-FALLBACK** | [M]; [R] Safari 17.5+. Degrades to no entry animation. |
| `transition-behavior: allow-discrete` | **SAFE-WITH-FALLBACK** | [M]; [R] Safari 17.4+. |
| **Scroll-driven animations** (`animation-timeline`) | **AVOID as load-bearing** | [M] true in 149. [C] **WebKit lists these as NEW in Safari 26.0** — every iPhone below 26 gets nothing. ☞ iOS. Decoration only, behind `@supports`; use IntersectionObserver, which is SAFE. |
| **Positioning & overlays** | | |
| `<dialog>` + `showModal()` | **SAFE** | [M]; [R] Safari 15.4+. Gives focus trap, inert background and Esc **for free** — all the things a hand-rolled mobile sheet gets wrong. Strongly preferred over the existing hand-built `.rc-backdrop` / `.wc-veil`. |
| `popover` + `:popover-open` | **SAFE** | [M]; [C] WebKit: shipped Safari 17.0. Top-layer, light-dismiss, no z-index war. |
| **CSS Anchor Positioning** | **AVOID** | [M] true in 149. [C] **WebKit lists it as NEW in Safari 26.0.** ☞ iOS, badly. (One search summary claimed 18.2+; the WebKit blog is authoritative.) Fallback: `getBoundingClientRect()` + `ResizeObserver`, which `gloss-tooltip.ts` already does. |
| `position: fixed` overlays | **SAFE** | But fixed *to the iframe* during review. See Read this first §1. |
| **Type & colour** | | |
| `color-mix()` | **SAFE** | 363 uses in production. Proven. |
| `text-wrap: balance` | **SAFE-WITH-FALLBACK** | [M]; [R] Safari 17.5+. Headings only. |
| `text-wrap: pretty` | **AVOID as load-bearing** | [M] true in 149. [C] **new in Safari 26.0.** ☞ iOS. Free to add — degrades to nothing — but never let a layout depend on it. |
| `hanging-punctuation` | **AVOID** | [M] **`false` in Chrome 149.** Safari has it; Android does not. Would give iOS one composition and Android another. The existing absolutely-positioned `.ds-pull-quote::before` already achieves the effect everywhere — keep that mechanism. |
| small caps (`smcp`) | **AVOID** | [M] only **Playfair Display** has a real table; the other six faces are **synthesised** by scaling capitals. Synthetic small caps are exactly what reads as cheap. |
| `@property` / `@layer` | **SAFE-WITH-FALLBACK / SAFE** | [M]; [R] Safari 16.4+ / 15.4+. `@layer` would help enormously with this repo's "unscoped CSS captures another surface" bug class — but adopting it is a refactor, not a mobile task. |
| `contrast-color()` | **AVOID** | [C] new in Safari 26.0; [M] not tested. Too new. |
| **JS APIs** | | |
| `ResizeObserver` / `IntersectionObserver` | **SAFE** | [M]; [R] Safari 13.1+ / 12.1+. Both unused today; both needed. |
| **`VisualViewport`** | **SAFE — and the fix for the keyboard** | [M]; [R] Safari 13+. On iOS the soft keyboard does **not** resize `window.innerHeight`. A fixed bottom bar will hide behind the keyboard unless `visualViewport.height` / `.offsetTop` are used. **Zero uses in the repo today** — very likely part of what "scuffed" meant on the Scanner's hand-entry and the Regimen's inputs. |
| Pointer Events | **SAFE** | [M]; [R] Safari 13+. Use `pointer*`, not `touch*`, and pair with `touch-action` (**0 uses today** — a likely source of scroll-vs-drag jank). |
| `navigator.share` / `canShare` | **SAFE-WITH-FALLBACK** | [M]; [R] iOS 12.2+. Needs a user gesture; needs `allow="web-share"` in an iframe. Fallback: copy to clipboard. |
| `navigator.clipboard` | **SAFE-WITH-FALLBACK** | [M]. Needs a secure context — `file://` **is** one (see below). |
| **`navigator.vibrate`** | **AVOID** | [M] present in 149. [C] **not supported by Safari/iOS**; 2026 reports are contested even in the MDN compat tracker; blocked in cross-origin iframes regardless. ☞ iOS. **Never make haptics load-bearing** — treat any call as best-effort and unobservable. Because haptic confirmation is a large part of why native swipe feels good, the **visual** commit on a swipe must be *more* emphatic here than the native equivalent, not less. |
| **`BarcodeDetector`** | **AVOID — does not exist** | [M] **`false` on this machine's Chrome**, not merely on iOS. [C] absent from Safari and every iOS browser. **Barcode/UPC scanning is dead on both target (a) and target (c).** |
| `getUserMedia` | **CONDITIONAL** | See the resolved conflict below. |

### ⚠ Resolved conflict: `getUserMedia` on `file://`

`reference-study.md` §5 stated that `file://` is not a secure context and camera access from it is
unreliable-to-blocked, flagging it as that study's largest open question. **That premise is wrong and
the measurement supersedes it.**

Measured, Chromium 149, same browser instance, same run:

| Launch config | `file://` | `http://localhost:8799` |
|---|---|---|
| default flags | `NotAllowedError` | `NotAllowedError` |
| `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` | **RESOLVED tracks=1** | **RESOLVED tracks=1** |

**The two origins behave identically.** `isSecureContext` is `true` on `file://`;
`navigator.permissions.query({name:'camera'})` returns `"prompt"`. The `NotAllowedError` under
default flags is headless Chrome having no camera, not the scheme.

**What actually gates things on `file://` is the opaque (`null`) request origin, not secure context.**
That is what kills service workers (*"origin ('null') is not supported"*), `fetch`, `XHR`, ES module
imports, cookies, and CSSOM introspection — all [M].

**So the camera is not ruled out by the file protocol.** It is made hostile by (i) a permission
prompt that very likely repeats every launch, since Chromium keys content settings by origin and
`file://` has none (UNKNOWN 4), and (ii) the review iframe. The honest primary on mobile is the path
the app **already implements** — `views/scanner.ts:12`, hand entry — with any camera path as a
feature-detected enhancement that may simply be absent.

⚠ Two copy defects fall out of this and should be fixed in the pass that touches the Scanner:
`views/scanner.ts:152` says *"Check your connection and scan again"* — the wrong sentence for an
offline-first app's user; and `state/ocr.ts:277-290`'s `assertModelReachable()` treats a **404 as
reachable** (`fetch` only rejects on network failure), which routes a missing model to
`views/scanner.ts:157` → *"Try a clearer photo."* **The app tells the user their photo was bad when
the engine is missing.** See The review loop.

### The `file://` versus web-build split

Offline-forever binds the **local** build only. The web build (nutrientcodex.com) **may** fetch.
There is deliberately **no service worker** on either.

| | Target (a) — local `file://` | Web build — nutrientcodex.com |
|---|---|---|
| Payload shape | **one 14.1 MB IIFE**, all 13.1 MB of JSON inlined | `main.<hash>.js` 2.18 MB + 3 split JSON artifacts fetched at runtime |
| First visit | everything, from disk, uncompressed | 3.30 MB critical path decoded (~1.07 MB gzip); **13.15 MB total** (~3.60 MB gzip) once the three split artifacts land |
| `fetch` / `XHR` / `import()` | **blocked** (opaque origin) | works |
| Code-splitting, lazy `import()`, runtime asset fetch | **forbidden** | permitted |
| Service worker | forbidden by rule **and** blocked by origin | forbidden by rule |
| CSSOM introspection (`styleSheet.cssRules`) | **throws** — 11 sheets, 0 readable rules [M] | works |
| `document.cookie` | writes silently dropped | works |
| Storage | localStorage + IndexedDB both work, and **both are shared by every local HTML file in the profile** [M] | per-origin |
| OCR | 38 MB vendored, model base64-inlined into `worker-offline.js` (17.2 MB) so nothing has to fetch | 21.7 MB, `eng.traineddata.gz` fetched — 12.8 MB over cellular |
| Camera | available; permission likely re-prompts each launch | available, HTTPS, permission persists |

**Design consequences.** The mobile redesign **may not introduce code-splitting, lazy `import()`, or
any runtime asset fetch** on target (a) — that is why every datastore is inlined and why
`state/ocr.ts:129` injects Tesseract with a `<script>` tag rather than `import()`. No runtime CSS
measurement technique may read the CSSOM on `file://`; parse the `.css` text or run over `http://`.

⚠ **Storage privacy, precisely.** Measured: a value written from `.../siteA/a.html` was read back
verbatim from `.../siteB/b.html`, for both localStorage **and** IndexedDB. The project's promise —
*the user owns 100% of their data on their device* — remains true; the precise version is "on their
device, in a bucket every local page in that browser profile shares," and **the 5 MB localStorage
ceiling is shared too** (`core/schemas/profile.ts:29` warns that blowing it corrupts the regimen).
The pinned-engine plan with a dedicated `--user-data-dir` fixes this cleanly, and that is another
argument for target (b).

### ⚠ Three recorded facts that measurement contradicts — surfaced, not acted on

Per §00.B.3. **Each of these is the owner's call, not the redesign's.**

1. **IndexedDB *does* work on `file://`.** `2026-08-03-file-protocol-is-sacred.md` states it does not.
   Measured: opens, **10.7 GB quota**, and survives a full browser restart with a fixed
   `userDataDir`. The **ruling is unaffected** — `file://` stays sacred, Electron and Tauri stay
   dead, and that ruling never depended on this claim. It does mean the "permanent ~5 MB cliff" is
   escapable if he ever wants it. Arguments for leaving it alone: the store is shared with every
   other local page, `navigator.storage.persisted()` returned `false` so the bucket is evictable, and
   localStorage is synchronous and simple while IDB is neither. **Recommendation: correct the
   decision file, change nothing else, and do not let the mobile redesign quietly adopt IDB.**
2. **`file://` *is* a secure context.** Same doc, §3. The rule's *effects* are right; its stated
   *reason* is wrong, and a wrong reason will mislead the next person who asks "can we use X?".
3. **The `-webkit-backdrop-filter` pairing is inconsistent** — see immediately below. A
   straightforward defect; fix it in the pass that touches those files.

### ⚠ Resolved conflict: the `backdrop-filter` count, and the two real defects

Three groundwork files reported 14, 10 and 5. Re-measured for this brief:

```
grep -rn "backdrop-filter" dashboard/assets/styles/*.css
```

→ 14 string occurrences, of which **3 are inside comments**. **8 real declaration sites. 6 are
correctly paired with `-webkit-backdrop-filter`. Two are unprefixed-only:**

- `dashboard/assets/styles/workspace-coverage.css:1131` — `.wc-veil`, `blur(9px) saturate(.9)`
- `dashboard/assets/styles/workspace-scanner.css:436` — `.vd-cf__refzoom`, `blur(2px)`

[R] Unprefixed `backdrop-filter` landed in Safari 18.0; `-webkit-` has worked since Safari 9. On any
iPhone below iOS 18, `.wc-veil` degrades to a flat 30%-opacity scrim over legible text.

**Verdict: SAFE-WITH-FALLBACK, and the fallback is the `-webkit-` pair, always written.** Per §00.B.2
this should be a gate, not a promise: a CSS lint failing on `backdrop-filter` without an adjacent
`-webkit-backdrop-filter` is roughly ten lines.

**And a separate performance rule, from a different track:** at most **one** `backdrop-filter`
visible at a time, and **never on a scrolling element**. Each is a full-surface readback on a mobile
GPU. `drawer-search.css:46` already carries a comment recording exactly this lesson.

---

## The taste rubric

Eighteen statements defining "a proper mobile app" *here*. Each is checkable by a reviewer against a
screenshot, a short screen recording, or one grep. **A surface is not done until every applicable
line is ticked.** These are the acceptance criteria the surface designs get measured against.

**Chrome and layout**

1. **No content, control, or bar bottom edge is obscured by the home indicator.** Every fixed bottom
   element pads by `env(safe-area-inset-bottom)` — as *padding*, not margin, so the material bleeds
   to the physical edge while the touch targets sit above the indicator — and the page declares
   `viewport-fit=cover`.
   _Check: screenshot on a device with a home indicator; `grep -c safe-area-inset` > 0._
2. **No `100vh` anywhere.** Full-height uses `dvh`/`svh`, chosen deliberately.
   _Check: `grep -rn "[0-9]vh" dashboard/assets/styles/` returns only `dvh`/`svh`/`lvh`._
3. **Every screen has one establishing element at the top** — a large title or equivalent — and the
   top 15% is not a dense strip of controls. _Check: screenshot at scroll-top._
4. **Chrome is transparent at scroll-top and gains material only once content is behind it**, and the
   transition is interpolated over scroll distance rather than popping at a threshold.
   _Check: slow-scroll screen recording._
5. **Primary actions sit in the bottom 40% of the screen.** Nothing done more than twice per session
   lives in a top corner. _Check: mark the primary action on a screenshot._

**Touch**

6. **Every interactive target is at least 44×44 px** including invisible hit padding, and adjacent
   targets are separated by at least 8px. _Check: overlay a 44px grid on a screenshot._
7. **No hover state can stick after a tap.** Every `:hover` rule sits inside `@media (hover: hover)`.
   _Check: count of `:hover` outside a hover media query is 0._
8. **No information is delivered only by `title=` or only by hover.**
   _Check: `grep -rn 'title="' dashboard/assets/js/src` returns 0 informational uses; each former
   tooltip has a named touch replacement._
9. **Taps respond on press, not on release** — a pressed state appears within one frame of
   `pointerdown` — and the default grey tap highlight has been replaced by a designed `:active`
   state. _Check: slow-motion recording of a single tap._

**Motion**

10. **Anything the finger dragged animates with a spring that inherits release velocity**, and can be
    grabbed and reversed mid-flight. _Check: fling a sheet hard and gently — they must not land in
    the same place; grab one mid-animation — it must catch._
11. **Nothing past a boundary follows the finger 1:1** — overscroll and over-drag are rubber-banded.
    _Check: drag a sheet above its largest detent._
12. **No animation reflows layout.** Motion is transform and opacity only.
    _Check: a Performance recording shows no layout during the transition._
13. **`prefers-reduced-motion: reduce` replaces every slide and spring with a cross-fade, and nothing
    changes meaning.** _Check: enable the OS setting and repeat the flow._

**Content**

14. **No horizontal scrolling anywhere except one deliberately designed comparison surface** — and
    that one has a pinned first column and a visible edge affordance. _Check: drag every screen
    sideways. ⚠ `body { overflow-x: hidden }` means an automated overflow reading of zero proves
    clipping, not fit — this line is a human check._
15. **Body copy runs 36–43 characters per line at 1.60 line-height, and respects the OS text-size
    setting.** _Check: count characters on a screenshot line; set device text size to XL and reload._
16. **Nested boxes are at most one deep.** Structure comes from space, weight and hairlines — not
    cards inside cards inside panels. _Check: outline every border on a screenshot._

**States**

17. **Every empty state names what will appear here and contains the action that fills it**, every
    error names the cause in plain language and offers a next step, and **no loading affordance
    exists for data already in the bundle.**
    _Check: force each state and screenshot it._
18. **Every fallible reading is confirmed before it is used.** The Scanner never presents a verdict
    built on an unconfirmed OCR pass; the correction step is editable per token and reversible.
    _Check: scan a deliberately blurry package._

**Four project-doctrine lines to keep in view while ticking the above.** Coverage is a **map of gaps**
and must not read as a score at any size. Nothing in the mobile chrome may recolour or compete with
the four fixed category colours (minerals blue, vitamins orange, aminos green, omegas purple). No
emojis — typographic marks only. Every amount on screen traces to a Wallach book, and the honest
string where none exists is "no Wallach target stated".

### ⚠ Note on rubric line 15 — the CPL figure, resolved

`reference-study.md` cites the print-derived 30–50 CPL mobile ideal. `typography.md` measured that at
375px with 17px Space Grotesk you land at **40.9 CPL** with a 20px gutter and **41.9 CPL** with a
16px gutter, and that *nothing* at or above 17px reaches the 45–75 print ideal at this width. The
resolved rubric figure is therefore **36–43 CPL, compensated with 1.60 leading** — which is where iOS
Books, Instapaper and Pocket also sit. Do not "fix" a short measure by shrinking the type.

### ⚠ Note on rubric line 17 — no fake skeletons, resolved

`reference-study.md` §9 recommends skeleton screens for content whose shape is known, then flags its
own exception. `performance-budget.md` settles it: **all data is inlined in the bundle, so there is
no I/O to hide** — a "loading" state here would be decorating parse-and-render time. Shipping a
skeleton for data already in memory is exactly the fakery the `dashboard-code` anti-fakery rule
exists to prevent. Where a render genuinely exceeds ~200 ms (Conditions, Products, search — all
measured over), the fix is to make the render faster, not to decorate the wait.

### The physics that separate native-feeling from web-feeling

Three formulas, all cited, all of which the redesign will need if it ships sheets or swipe rows:

```
momentum projection   projected = (velocity / 1000) * d / (1 - d)     d ≈ 0.998   [WWDC18 803]
rubber-band           f(x, dim) = (x * dim * 0.55) / (dim + 0.55 * |x|)
spring, gesture-driven    damping 0.8, response 0.3s    (slight overshoot — momentum earned it)
spring, everything else   damping 1.0, response 0.3-0.4s (critically damped, no bounce)
```

**Interruptibility is the actual quality bar**, and it is the one line above that costs real
engineering: a sheet mid-animation must be grabbable and reversible at any frame, animating from its
*current* value at its *current* velocity. **A CSS transition cannot do this.** A spring integrator
driven by `requestAnimationFrame`, or a Web Animations API animation cancelled and restarted from the
computed value, can. The designers should know this before they specify three sheets.

Other shared values: gesture commit threshold ~10px before locking to a drag axis; ~10px of invisible
hit padding beyond a control's visual bounds; highlight on `pointerdown`, commit on `pointerup`; glass
material `blur(20px) saturate(180%)` over ~0.6 alpha with a 1px `rgba(255,255,255,.4)` top edge (that
bright edge is what makes glass read as a physical layer rather than a translucent div); large-text
tracking ≈ −0.02em, body ≈ 0.

### Required page-level plumbing, before any of the above can work

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover,
      interactive-widget=resizes-content">
```

⚠ **Do not add `user-scalable=no` or `maximum-scale`** to "fix" the iOS input-zoom problem. That
trades a layout wobble for a WCAG 1.4.4 failure, and pinch-zoom is exactly the accommodation this
audience uses. The correct fix is the 16px input floor.

```css
@media (hover: hover) and (pointer: fine) { /* every :hover rule lives in here */ }
html            { height: 100dvh; }                              /* never 100vh */
body            { touch-action: manipulation; }                  /* kills the tap delay */
*               { -webkit-tap-highlight-color: transparent; }    /* then design your own :active */
.bar            { padding-bottom: calc(12px + env(safe-area-inset-bottom)); }
.sheet-scroller { overscroll-behavior: contain; }
input, select, textarea { font-size: max(16px, 1em); }           /* the iOS zoom floor */
html, body      { overscroll-behavior-y: contain; }              /* kills pull-to-refresh */
```

That last line is a correctness issue, not styling: on this app pull-to-refresh means **a full reload
of a 14 MB bundle**, fired by the exact gesture used to scroll back up a long list.

---

## Reference patterns

Per pattern: the product to steal from, and the specific mechanic. Aesthetics are not the point —
mechanics are.

⚠ **Sourcing caveat that applies to every dimension in this section.** `developer.apple.com`'s HIG
and `m3.material.io` are client-rendered; WebFetch returned page titles and no body. **Every Apple
and Material number below comes from a secondary source** (developer session write-ups, component doc
mirrors) and should be re-verified against the primary spec before it is written into a surface spec.
This is UNKNOWN 11.

### 1 · Bottom tab bar → **iOS 26 system tab bar**, with Material 3 for dimensions

- **Minimise on scroll down, restore on scroll up, with hysteresis.** The iOS 26 bar collapses to
  just the active tab on downward scroll and re-expands on upward (`tabBarMinimizeBehavior`). Do not
  toggle per pixel: accumulate scroll delta and change state only after ~10px of committed movement
  in one direction, then animate over ~0.3s with a critically damped spring.
- **Animate transform and opacity, never height.** Height animation reflows the scroller underneath
  and produces exactly the jank people read as "web".
- **Bar height: 56–64px of content plus `env(safe-area-inset-bottom)` as padding.** Material 3's
  navigation bar is 80dp with a 64dp active indicator and an 80dp minimum item width.
- **Fill/outline is the state, not colour alone.** Active gets a filled glyph and a pill behind it;
  inactive gets an outline glyph. **This app has four fixed category colours already doing semantic
  work**, so the tab bar's active state must be shape-and-weight driven with one neutral accent and
  must not compete with them.
- **The accessory shelf is the pattern most worth stealing.** iOS 26's `tabViewBottomAccessory` is a
  persistent strip above the bar that survives tab switches and rides down when the bar minimises
  (the Music now-playing bar). That is the right home for "scan in progress" or an open-gaps count —
  the mobile answer to what the desktop left rail does with persistent context.
- **What not to steal:** five tabs plus a "More". iOS 26's `search` role — which pulls search out to
  the trailing side as a separate pill rather than an equal sibling — is directly relevant to the
  re-opened "is Search a tab?" question.

### 2 · Bottom sheets → **iOS sheets** for physics, **Google Maps** for the three-detent non-modal case

- Detents: system `medium` (~half) and `large`, plus custom fractional (0.3 for a peek) and
  fixed-height. A grabber capsule ~36×5px at top centre signals resizability, with generous invisible
  hit padding.
- **Release by projected velocity, not by nearest position.** Project where the flick *would* land
  using the momentum formula, snap to the nearest detent *to that projection*, and hand the release
  velocity into the spring as initial velocity. This is the difference between a sheet that goes
  where you threw it and one that snaps to whatever was nearest your finger.
- Scrim opacity **interpolates with sheet position** rather than snapping on.
- `overscroll-behavior: contain` on the sheet's inner scroller, and the scroll-chaining rule: at the
  largest detent with content scrolled to top, a downward drag moves the **sheet**, not the content.
- **Where this app needs sheets:** everything the desktop shows in a right-hand drawer or a hover
  popover — the entity page opened from a Coverage tile, a food sheet, a product detail, and the
  glossary definition. Detents give back what the drawer gave on desktop: context stays visible
  behind, so tapping a nutrient tile does not feel like navigating away.

### 3 · Collapsing header → **iOS large titles** (Health, Books, Things 3, Craft)

- **Three states, not two:** standard, compact, and **scroll edge** — and scroll-edge, at the very
  top of a scroller, is *transparent*. At scroll-top the header has no background and no divider; it
  *is* the page. That transition is what makes a screen feel layered rather than "a header div".
- **Drive it from scroll position, not a threshold flip.** Interpolate title scale, title opacity,
  header background opacity and blur over roughly the first 40–60px. A binary class toggle at one
  offset reads as cheap because it pops.
- **Implementation for this codebase:** an `IntersectionObserver` on a 1px sentinel at the top of the
  scroller gives the state flip with no scroll handler; for the continuous interpolation, use one
  `requestAnimationFrame`-throttled scroll handler writing a single custom property (`--hdr-t: 0..1`)
  that the stylesheet consumes. One write per frame, no layout reads inside the handler. Any new
  scroll listener is `{ passive: true }`.
- **The large title is where the screen's identity lives.** A large part of what "cheap" diagnosed is
  a phone screen crowded with desktop chrome and no establishing shot. Note that on master today,
  `dashboard.css:357` hides `.topbar__breadcrumb` below 560px, so **nothing on screen names the
  current workspace on a phone at all.**

### 4 · Dense list rows with swipe → **Apple Mail**, **Things 3**, **Linear Mobile**

- Row height 44–56px with a hairline divider **inset to align with the text, not the screen edge** —
  a small thing that consistently reads as native.
- **Progressive reveal, not a pop-open drawer.** The action pane widens 1:1 with the finger; icon and
  label cross-fade as it grows; the background saturates approaching the full-swipe threshold
  (~50% of row width), and crossing it produces a **distinct visual commit** so the user knows
  releasing will fire. Rubber-band past the maximum.
- **Swipe is never the only path.** Every swipe action needs a long-press menu or row-overflow
  equivalent — for discoverability, and because swipe-only fails screen-reader users outright (with
  VoiceOver/TalkBack on, a swipe is intercepted).
- **Where this app needs it:** the Regimen list is the obvious candidate — swipe to remove a
  product/food row or to open its detail. Coverage tiles are a grid, not a list; swipe does not
  apply there.

### 5 · Camera capture → **Apple VisionKit `DataScannerViewController`**, **Yuka**, **Open Food Facts**

This is where "scuffed" is most expensive, because a bad capture produces a wrong result and a wrong
number here is a real harm.

- **A region of interest, drawn.** A bright rectangle roughly the aspect of an ingredients panel,
  everything outside dimmed to ~50%. Two jobs: tells the recogniser where to look, tells the user how
  to hold the phone. Without it people point the whole phone at the whole box.
- **Live per-word highlighting inside the frame.** The strongest "this is working" signal available,
  and also the honest one — if nothing lights up, the user knows to move closer instead of tapping a
  shutter and waiting for a failure.
- **Dynamic guidance copy, one line, in the dim area below the frame:** "Move closer" / "Hold steady"
  / "Too dark". One message at a time, changing at most every ~1s so it does not strobe.
- **Controls in the bottom third, shutter dead centre** (reachable from either grip — which is why
  the iOS Camera shutter sits there). Torch bottom-left, manual entry bottom-right, shutter centre at
  ~64–72px.
- **A manual-entry escape hatch that is always visible, not buried.** Today `.vd-manual` — "or add it
  by hand", the Scanner's entire fallback path — renders at **9.6px in a 17.4px-tall target**.
- **The confirm/correct step is mandatory and is a design surface in its own right.** Bottom sheet at
  the medium detent: captured crop on top, recognised text below as **editable tokenised chips**, one
  per ingredient, each tappable to correct or delete, plus a visible "+ add". Low-confidence tokens
  get a **dotted underline, not red** — red already means "bad ingredient" in this app's semantics and
  must not be overloaded. Nothing commits until a primary button is pressed.
- **Never show a confident result built on an unconfident read.** Below threshold, the correct screen
  is "I could only read part of this" with the partial chips — not a verdict.
- **From Open Food Facts:** when a product is unknown, offer to add it rather than dead-ending.
- **From Yuka:** the lesson is *immediacy* — zero taps between opening and being able to scan — and
  explicitly **not** its 0–100 score. Coverage must never gamify.

### 6 · Long-form reading and inline definitions → **Kindle**, **Apple Books**, **NYT Cooking**

- Generous margins, single column, no competing chrome; chrome hides on tap and returns on tap.
- **Paragraph spacing over indentation; hairline rules over card borders.** The current desktop design
  nests boxes; on a phone, nested boxes eat 32–48px of horizontal room and are the main *mechanical*
  cause of "cheap".
- **The hover-tooltip replacement is the Kindle-style bottom-anchored definition bar. This is the
  recommendation.** Tap a glossed term: the term takes a highlighted state and a compact panel rises
  from the bottom with the term, its definition and a "Read more" into the Knowledge entity. It never
  occludes the word you tapped, is never clipped by the viewport, has room for two lines of real
  text, dismisses on tap-outside or swipe-down, and is **the same component as every other sheet, at
  a small detent**.
  - *Inline expansion* is excellent for one definition and bad when a paragraph has four, because the
    reader loses their line each time.
  - *A floating popover pinned near the word* is what a desktop tooltip becomes if ported literally.
    Clipped, covers the sentence, reads as a web page's tooltip. **Avoid.**
  - Whichever is chosen: the tap target is the word plus ≥44px of vertical hit area (achievable
    without changing line-height via a transparent pseudo-element with `padding-block`); the glossed
    term needs a **persistent** affordance (dotted underline) because there is no hover to discover
    it with; and `@media (hover: hover)` gates every hover style.
  - **Scale check:** 1,260 glossary terms, gloss text median 68 chars and max 451 — long enough to
    need a sheet, not a tooltip. The ORAC surface alone renders **157** `.gloss` spans, each
    `tabindex="0" role="button"`, inline in running prose.

### 7 · Search designed keyboard-up → **Algolia's mobile guidance**, iOS system behaviour

- **None of `vh`, `svh`, `lvh` or `dvh` react to the keyboard.** The two real tools are
  `interactive-widget=resizes-content` in the viewport meta and `window.visualViewport`.
- Input pins to the top under the safe area; results fill downward, sized to `visualViewport.height`
  minus the field. The keyboard is expected, not fought.
- **Results update on every keystroke from the first character** — and with an in-bundle corpus there
  is no network latency to hide, so **there is no excuse for a spinner in search at all**. (There is,
  however, a 1,524 ms render cost to fix first — see Performance budget.)
- **Recents and suggested queries fill the empty state**, so the keyboard-up screen is never blank.
  Here that is also the honest answer to "what can I even ask Wallach?".
- **Scroll-to-dismiss the keyboard** — a `blur()` at a scroll-start threshold. Non-negotiable when
  results are long.
- **A visible Cancel that returns to where you were**, not a back-stack guess.
- **Group results by kind with sticky section headers.** The app already groups into five families —
  The Science, Cautions, What To Do, Wallach's Take, The Story.
- ⚠ **This is the one standing blocker nobody has cleared.** A keyboard cannot be emulated headlessly;
  the last audit measured a **168px letterbox showing 7.8% of an answer set**. It needs a device.
  UNKNOWN 5.

### 8 · Data-dense tables without horizontal scroll

A horizontally scrolling table on a phone is the clearest single "responsive web page" signal.
In order of preference:

1. **Row-to-card transposition** — each row becomes a card, each cell a label/value pair. Right when
   the row is the unit of meaning (one food's nutrient contributions).
2. **One primary column plus progressive disclosure** — show the one number that matters; tap opens a
   sheet with the full set. Right for foods and products.
3. **Transposed comparison** — attributes become rows, items become 2–3 narrow columns. Two fits
   comfortably at 390px; three is the practical ceiling.
4. **Horizontal scroll with a pinned first column** — acceptable *only* when the column relationship
   is itself the content, and only with a fading edge and a scroll shadow on the pinned column.
   **Never as the default because it was the easiest port.**

Applied here: a mobile table **restructures, it does not shrink**. One row per record, label left in
UI type at 13px, value right in JetBrains Mono at 14px with real tabular numerals. Anything that
genuinely cannot restructure goes in its own `overflow-x: auto` container — the page body never
scrolls horizontally.

### 9 · Empty, loading and error states

- **Empty states:** the research-backed shape is *explain what will appear here, and contain the
  action that fills it*. The sharper 2026 version — an empty state that feels **already partly
  filled** — turns instruction into completion. Applied here without gamifying: the Regimen empty
  state should not say "No items yet"; it should say what a regimen is, show two or three
  high-leverage starting points, and let one tap start it. Coverage with no profile shows the map of
  gaps *as it would look*, dimmed, with the single action that populates it.
- **Loading:** see the resolved note in the taste rubric. No skeletons for in-bundle data.
- **Errors:** name what went wrong in plain language, name what the user can do, and never present a
  partial result as a whole one. For the Scanner, "I could not read this" is a **designed screen**
  with a retry and a manual path — not a toast.

### 10 · First-run that is not a slideshow

- **The first screen is the app, not a story about the app.** There is no account and no network, so
  there is nothing to gate on: the first screen can legitimately be Coverage in a real, populated
  example state.
- **One question at a time, and only questions that change what the user sees.** ⚠ Doctrine: a goal
  changes **attention and ordering, never the denominator**. A first-run that asks for a goal is
  honest; one that implies the goal changes the score is a doctrine violation. Ask at most two things.
- **Teach the two non-discoverable gestures in context** — the swipe on a Regimen row, and the tap on
  a glossed term — as one-time inline coach marks the first time the user lands on that surface, not
  as a launch carousel.
- **A visible, dismissible "how this works" entry point that survives onboarding**, so the
  explanation is retrievable rather than one-shot.
- **Avoid:** a paged intro carousel with dots; any permission prompt before the user has seen why; a
  modal tour with Next / Next / Next.
- ⚠ Note the current arrival veil's failure mode, measured: its Enter button sat **751px below the
  fold** inside a `max-height: 90vh` scroller, so a first-time user saw a card whose only visible
  control was the X that opts them out permanently. **A screen's primary action must be visible
  without scrolling, not merely reachable.**

---

## The real data shapes

Every number here was **measured**, either by reading the generated JSON or by driving the real app
headless from `file://` at 390×844. Per this project's own doctrine — *drive the app, don't reason
about the data* — every count about coverage states and search volume came from the running app,
never from re-implementing its engine.

### The dataset, and what it means for layout

36 files, **13,102,530 B**, all inlined into a **14,108,023 B** bundle. No lazy loading, no network.
The phone parses all of it at boot.

| file | bytes | what it is |
|---|---:|---|
| `search/search-index.json` | 4,230,504 | 547 entities + 2,579 search claims |
| `corpus-embed.json` | 2,953,976 | 7 books, 2,601 sealed claims |
| `creators-log-embed.json` | 2,674,470 | the build log — **not a user surface** |
| `entity-page-data.json` | 1,040,133 | 91 essential pages + 510 condition pages |
| `product-detail-data.json` | 804,668 | 215 products, full label composition |
| `foods-composition-data.json` | 405,875 | 192 foods |
| `glossary.json` | 251,191 | 1,260 term glosses |
| …29 smaller files | ~741,000 | targets, layout, copy, scanner dicts, ORAC, recommender |

**A mobile design cannot assume "we'll fetch that page's data when the user opens it."** Everything
is already in memory. The cost is boot-time parse and **DOM volume**, never fetch latency.

### The 90 essentials

**91 rows, 90 counted.** The 91st is Omega-9 (Oleic Acid), marked `"essential": false` — shown for
completeness, never counted. The app renders the reconciliation string `90 counted · 91 shown`.

| category | rows | counted |
|---|---:|---:|
| minerals | 60 | 60 |
| vitamins | 16 | 16 |
| amino_acids | 12 | 12 |
| fatty_acids | 3 | 2 |
| **total** | **91** | **90** |

**Targets — the state that dominates the detail screens:**

| `target.kind` | rows | numeric? | what the UI must say |
|---|---:|---|---|
| `wallach` | 35 | yes | a real daily amount + unit + range |
| `trace_pdm` | 34 | no | no individual amount; one shared group verdict |
| `dietary_with_clinical_lever` | 15 | no (1 carries a `ceiling`) | no maintenance amount stated |
| `dietary` | 3 | no | air · water · food · nothing to take |
| `wallach_collective` | 2 | no | omega-3 + omega-6 share ONE collective amount |
| `mirrors` | 1 | no | verdict written by another tile |
| `unspecified` | 1 | no | no Wallach target stated |

**35 of 91 (38%) have a number. 56 do not**, and the honest string for those is never a number from
anywhere else. **Silver carries `ceiling: 400 mcg` with
`ceiling_reason: "stated-as-safe-intake-not-a-requirement"` — a ceiling is not a target and must not
render in the target slot.** Every numeric target also drags **provenance**: a 40–60 character
book-attribution line, and for 26 of the 35 an `other_claims` list of older books' numbers. Project
rule requires every essential to explain *why this target* — so budget a second block of text under
every number.

**Name lengths — the number that kills fixed-width chips.** Two different name strings exist and they
are **not** interchangeable:

| string | n | min | median | p90 | max |
|---|---:|---:|---:|---:|---:|
| canon `name` | 91 | 3 | 8 | 23 | **50** ("Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)") |
| tile `name` (uppercase short form) | 91 | 3 | 8 | 10 | **16** ("PANTOTHENIC ACID") |
| `slug` | 91 | 3 | 8 | 10 | 13 |

**The distribution is bimodal, not smooth** — 60 short mineral names, then a tail of 14 long
vitamin/omega/flavonoid names. A layout tuned on the median (8) breaks on exactly those 14 rows.

### Coverage states — driven, step by step

`state/coverage.ts:103` defines exactly six: `'covered' | 'partial' | 'trace' | 'gap' | 'present' |
''`, merged by rank `'' < gap < present < partial < trace < covered`. The five ledger labels on
screen are **COVERED · PARTIAL · PRESENT · NOT COVERED · NO WALLACH NUMBER YET**, always summing to
90.

| after adding | COVERED | PARTIAL | NOT COVERED | NO NUMBER YET |
|---|---:|---:|---:|---:|
| **(empty regimen)** | 5 | 0 | 35 | **50** |
| ultimate-classic | 12 | 51 | 12 | 15 |
| + ultimate-daily | 14 | 50 | 12 | 14 |
| + beyond-tangy-tangerine-2.5 | 63 | 12 | 11 | 4 |
| + ultimate-efa-plus | 63 | 14 | 11 | 2 |
| **+ btt-2.0-tablets (the 5-product starter pack)** | **70** | **9** | **9** | **2** |
| (all 215 products) | 85 | 1 | 4 | 0 |

**Design against the starter-pack row — ~70 covered / 9 partial / 9 gap / 2 pending.** Not the empty
state, and not the all-215 state.

**The empty state is the hostile one:** 50 of 91 tiles grey, 5 covered, and the Coverage workspace
measures a **scrollHeight of 9,631px against a 784px viewport — 12.3 screens of scroll at 390px**.
The mobile design has to make 50 grey tiles read as "not measured yet", not as failure, and it cannot
do that by shipping the same grid dimmed.

**★ The single most design-relevant fact in the whole dataset.** With the **entire 215-product
catalogue** in one regimen: **CHLORIDE, SULFUR, SILICA and FLAVONOIDS stay NOT COVERED. SODIUM tops
out at PARTIAL.** Any mobile screen that frames coverage as "add products until it's green" is
proposing something the data cannot deliver. The path for those five is food — which is exactly what
`recommend-generic-supplements-when-ygy-cannot-reach` and "Coverage is a MAP OF GAPS" already say.

### The claim card — the height budget

All four fields render on one card. 2,579 search claims measured:

| field | min | median | p90 | p99 | **max** |
|---|---:|---:|---:|---:|---:|
| `question` | 12 | **43** | 61 | 75 | **93** |
| `answer_short` | 52 | **171** | 260 | 374 | **892** |
| `answer` (full) | 61 | **436** | 846 | 1,434 | **2,381** |
| `verbatim` | 60 | **258** | 501 | 922 | **1,186** |

Every claim has a verbatim — **2,601 of 2,601, never null**.

- **The worst real card is `WAL-CLM-IMMORT-000485`: 3,456 characters** (35 + 235 + 2,381 + 805). At
  375px that is roughly **91 lines ≈ 2,200 px of text** for one claim fully expanded. **Progressive
  disclosure is not a nicety here — it is the only way the card fits**, and the collapsed state is
  driven by `answer_short`, whose max (892) exceeds the median full answer.
- **Verbatims are byte-exact OCR slices with hard line breaks inside sentences.** Newlines per
  verbatim: median 3, p90 9, **max 57**. Honouring them (`pre-wrap`) turns a 1,186-char quote into an
  18-line block; collapsing them reflows the quote but it is no longer byte-faithful on screen.
  **Both are defensible. Make the choice on purpose and state it — do not let it be an accident of a
  `white-space` default.**
- Citations must render both "Book, p.29" and bare "Book": **755 of 2,579 claims carry a page number;
  1,824 do not.**

### Search — the volume problem

Driven: the Ask-Wallach drawer opened, real queries typed, the rendered DOM counted. Visible rows are
capped in code (`FAM_CAP = 3` per family × 5 families = 15 visible); everything else is rendered with
class `arow--hidden` behind a "See N more".

| query | family groups | rows rendered | hidden | visible | rendered text |
|---|---:|---:|---:|---:|---:|
| `calcium` | 5 | **201** | 186 | 15 | **268,497 chars** |
| `selenium` | 5 | 163 | 148 | 15 | 233,512 |
| `cancer` | 5 | 104 | 89 | 15 | 128,168 |
| `diabetes` | 5 | 53 | 39 | 14 | 72,695 |
| `arthritis` | 4 | 51 | 39 | 12 | 67,548 |
| `what causes cramps` | 4 | 6 | 0 | 6 | 10,677 |
| `zzz` | 0 | 0 | 0 | 0 | 92 |

**One query puts a quarter of a megabyte of text into the DOM, 186 rows collapsed but fully built,
re-rendered on every keystroke.** On desktop that is invisible; on a phone it is ~150 screens of
content in a scroll container. See the windowing rule in Performance budget.

Entity index (547 entries): types are condition 314, nutrient 91, concept 52, substance 39, topic 38,
element 10, person 2, event 1. `display_name` max 35 chars. **`claim_count` median 2, max 58** — so a
design that assumes "an entity page is a few claims" is right for half the index and wrong for the
other half.

### Entity pages — the 2-to-201 range

| | essentials (91) | conditions (510) |
|---|---|---|
| payload per page | median 2,123 B, **max 8,233 B** (calcium) | median 624 B, max 3,984 B (cancer) |
| `claim_count` | median 6, p90 72, **max 150** | median 2, max 76 |
| `distinct_claim_count` | median 16, **max 201** | unused |
| `conditions` linked | median 3, p90 56, **max 103** | n/a |
| `related` | max 8 (hard-capped) | max 8 |

**The calcium page legitimately wants to render 201 claims and 103 condition links.** That is not an
edge case to design away — it is the flagship nutrient. One layout must serve 2 and 201 without
looking broken at either end.

### Foods, ORAC, products

**Foods — 192.** Name max 29 chars; `usda_description` max 106; `portion_label` max 54
("1 large (2-1/4 per pound, approx 3-3/4\" long, 3\" dia.)"). **Nutrients per food: median 4, max
13** — a card designed around 4 chips must render 13 without becoming a second screen. 11 categories.
26 essentials have food rows; **65 have none**. ⚠ Do not mis-read the omegas as unsourced: the EFA
figure lives in a separate `efa` object, and **52 of 192 foods carry `efa.qualifies == true`**.
Longest food list for one nutrient: choline **149** foods, then potassium 63, sodium 60, copper 60.

**ORAC — 60 rows across 9 categories, values spanning 949 (Plums) to 314,446 (Cloves) — a 331×
range.** A single linear axis is unreadable: cloves makes plums a 0.3% sliver. The data already ships
a precomputed `bar` percentage per row and per-category local scales precisely because of this.
**Keep the grouping, and render the basis** — one table is per-100 g and the other eight are per
serving, and the basis is a per-table field. Daily target 20,000–25,000; disease target 100,000+.

**Products — 215, all priced.** Name median 24, **max 69** chars. Wholesale (the featured price)
median $41.95, **max $301.95** — so the price element fits 7 characters plus a symbol, twice if both
prices show. **Ingredient rows per product: median 11, p90 31, max 129** (`3-0-rise-and-restore`).
Quantified nutrient rows in one component: median 3, **max 34**. **206 proprietary blends**, each
with an `as_labeled` string of median 124 and **max 971 characters** of unbroken comma-separated
prose. **A product detail sheet is a page, not a card.**

### Gloss density on a real surface — driven

| surface | rendered text | `.gloss` terms | DOM nodes | buttons |
|---|---:|---:|---:|---:|
| Coverage (empty) | 2,821 | 0 | 612 | 11 |
| Regimen | 1,300 | 0 | 1,018 | 49 |
| Scanner | 447 | 0 | 1,061 | 53 |
| Knowledge · Home | 1,399 | 0 | 166 | 51 |
| Knowledge · Absorption | 10,203 | **79** | 696 | 23 |
| Knowledge · ORAC | 14,742 | **157** | 1,107 | 26 |
| Knowledge · Conditions | 29,413 | 0 | 3,059 | 8 |
| Knowledge · Explore | 2,188 | 0 | 183 | **149** |
| Knowledge · Products | 26,341 | 0 | 2,757 | 11 |

**157 hover-only tooltips on one screen, each `tabindex="0" role="button"`, inline in running prose,
on a device with no hover at all.**

### The other structures the design must hold

| structure | shape |
|---|---|
| Coverage sections | 4 sections; minerals splits into 3 subsections (FOUNDATIONAL 5, INDIVIDUALLY DOSED 21, PLANT DERIVED 34); vitamins 16, aminos 12, fats 3 |
| Subsection chrome | each has `rank` (A/B/C), `label`, and a `hint` — e.g. "air · water · food · nothing to take" |
| Goals | **30** goals in 6 categories; name median 16, **max 26**; members per goal median 14, max 27 |
| Regimen | `SLOT_CAP = 4` saved slots, 14 slot colours; a row is name + `−` + qty + `+` + a per-product unit string |
| Coverage caps | `REC_PAGE = 3`, `REC_GAP_FILL = 4`, `FOOD_PAGE = 3`, `FOOD_MAX = 12` |
| Scanner dictionaries | 14 goal keyword sets, 8 anti-list groups, **210 hard-reject terms**, 5 serious-anti |
| OCR dictionary | 522 fuzzy entries + 57 known nutrient names |
| Conditions taxonomy | 12 categories over 502 conditions |
| UI copy | 444 strings; median 19 chars, p90 137, **max 685** |

### The fifteen layout implications, condensed

Each is a consequence of a number above, not a preference.

1. **No fixed-width nutrient chip.** 3 to 50 characters, bimodal. Either the chip wraps, or the design
   commits to the uppercase tile name (max 16) and shows the long canon name only on detail.
2. **A claim card must survive 3,456 characters.** Progressive disclosure is structural.
3. **A verbatim block must survive 1,186 characters across 18 hard line breaks.** Decide `pre-wrap`
   vs reflow deliberately.
4. **Search cannot render what it renders today.** 201 rows / 268,497 chars, per keystroke.
5. **The empty Coverage state is 50 grey tiles and 12.3 screens.** It needs its own treatment.
6. **Five tiles have a ceiling no product can lift.** Route them to food or send the user shopping
   for something that does not exist.
7. **56 of 91 essentials render "no Wallach target stated"** — in three distinct flavours, as a
   first-class state. A ceiling never renders where a target renders.
8. **Every number drags provenance.** Budget a second block of text under it.
9. **A product sheet is a page:** 129 rows, 34 nutrient rows, 971 characters of blend prose.
10. **A food card is 4 chips that must stretch to 13**, with a 54-character portion label.
11. **ORAC cannot share one linear axis.** Keep the grouping; render the basis.
12. **157 hover-only tooltips on one screen** is a touch-platform bug waiting to happen. Glosses
    average 68 chars and reach 451 — a sheet, not a tooltip.
13. **An entity page must scale from 2 claims to 201.**
14. **The whole dataset is resident at boot.** Perf work is render volume, never loading strategy.
15. **The ledger sums to 90 and shows 91.** Any single-number summary must carry the reconciliation.

⚠ **One constraint from the teardown that binds any tile grid the new design invents:** the coverage
rings need **integer track positions**. A fractional fill was measured degrading one ring edge to
8.00 device px against the other's 12.00. The desktop grid holds `repeat(auto-fill, 100px)` for
exactly this reason — three tiles fit at 375px, two at 320px. **Any mobile tile grid that goes
fractional will visibly degrade the rings.**

---

## Typography

The mobile type system, ready to paste. Every size below is derived from a measured font metric, not
chosen. Measured in Chrome 149 against the actual `.ttf` files.

### What is actually available

**11 `.ttf` files, 7 families, 2,472,876 B**, all SIL OFL 1.1.

⚠ *Resolved conflict:* `performance-budget.md` reported "9 files"; `typography.md` and
`delivery-review.md` both reported 11. Re-counted for this brief: **11**. The byte total performance
quoted (2,472,876) is the exact sum of all eleven, so only its file count was wrong.

| Family | Weights | Role |
|---|---|---|
| Unbounded | 200–900 var | `--ds-font-display` — headings, hero titles |
| Space Grotesk | 300–700 var | `--ds-font-sans` **and** `--ds-font-serif` — body prose + UI chrome |
| Chakra Petch | 400/600/700 **static** | `--ds-font-display-interface` — small interface text |
| JetBrains Mono | 100–800 var | `--ds-font-mono` — readouts, technical labels |
| Bruno Ace | 400 only | `--ds-font-display-artifact` — big numeric readouts |
| Playfair Display | 400–900 var + italic | the one deliberate serif carve-out — Wallach pull-quotes |
| Crimson Pro | 200–900 var + italic | **declared but no live consumer found** — UNKNOWN 7 |

**`type-futurist.css` is authoritative**, not `design-system.css`. It loads after the sealed sheet and
after every drawer/workspace sheet. The serif stack still declared at `design-system.css:185-189` is
declared but dead — **do not design against it.** Merriweather is confirmed gone (`a9b0513b`).

⚠ **Doc drift, one-line fix:** `dashboard/assets/fonts/README.md` still says "Eight typefaces" and
"The five editorial families" above a table listing four. True count is **7 families / 11 files**.

### The measured metrics that drive everything

At `font-size: 100px`, same engine, same run:

| Face | avg advance (em/char) | **x-height / em** | default line box |
|---|---:|---:|---:|
| Unbounded 400 / 700 | 0.5865 / 0.6192 | **0.570** | 1.25 |
| Space Grotesk 400 | 0.4818 | **0.490** | 1.27 |
| Chakra Petch 400 | 0.4500 | **0.500** | 1.30 |
| JetBrains Mono 400 | **0.6000** (true mono) | **0.550** | 1.32 |
| Playfair Display 400 | 0.4376 | **0.520** | 1.33 |
| Bruno Ace 400 | 0.6162 | **0.550** | 1.20 |
| Crimson Pro 400 | 0.3880 | **0.420** | 1.11 |

Reference faces measured **in the same engine**, so the comparison is apples to apples: Roboto 0.530
· Arial/Helvetica 0.520 · Verdana 0.550 · system-ui 0.500 · Georgia 0.480.

**★ Space Grotesk's x-height (0.490) is lower than every reference sans** — 7.5% below Arial, 8.2%
below Roboto. A 16px body in Space Grotesk reads like a **14.8px** body in Roboto. To match the
perceived size of a conventional 16px mobile body: `16 × 0.530 / 0.490 = 17.3px` → **17px is the
mobile body size.** Arithmetic of the face we ship, not taste — and it matters more than usual
because the audience skews older.

### The scale

Root stays at the browser default. **Never `html { font-size: __px }`** — that overrides the user's
own preference. All values `rem`. **No `vw` units anywhere.**

| Role | Family | Weight | Size | Line-height | Tracking | CPL @ 335px |
|---|---|---|---|---|---|---|
| **display** | Unbounded | 700 | `1.875rem` / 30px | 1.08 | −0.02em | 18.0 |
| **title** | Unbounded | 600 | `1.375rem` / 22px | 1.18 | −0.015em | 24.9 |
| **section** | Space Grotesk | 700 | `1.125rem` / 18px | 1.28 | −0.005em | 38.6 |
| **body** | Space Grotesk | 400 | `1.0625rem` / **17px** | **1.60** | 0.005em | **40.9** |
| **caption** | Space Grotesk | 400 | `0.9375rem` / 15px | 1.45 | 0.005em | 46.4 |
| **label** (UI chrome) | Chakra Petch | 600 | `0.8125rem` / 13px | 1.15 | 0.02em | — |
| **mono** | JetBrains Mono | 400/500 | `0.875rem` / 14px | 1.50 | 0 | 39 cols |
| **quote** | Playfair Display *italic* | 400 | `1.1875rem` / 19px | 1.45 | 0 | 35.2 † |

† against the quote's own inset column (293px), not the page column.

Why these: *display* is the only Unbounded 700 on a phone — Unbounded is 28% wider than Space
Grotesk, so at 30px a line holds ~18 characters and display strings must be 1–3 short words.
*title* drops to 600 because Unbounded gets appreciably wider as it gets heavier. *section* switches
family to Space Grotesk 700 — Unbounded at 18px holds only ~29 characters in a 335px column, too few
for a real section heading; Space Grotesk 700 holds 38.6, and the family change plus weight jump
carries the hierarchy without more size.

**Weight availability, measured:** Chakra Petch is **static 400/600/700 — it has no 500** (400 and
500 return identical advances). Bruno Ace is **400-only** — every weight measures identical, so
`font-weight: 700` on it is ignored or faux-bolded. Add `font-synthesis: none` to make that failure
visible rather than ugly.

### The measure, and the two gutters

Measured CPL for Space Grotesk 400 at a 375px viewport:

| pad each side | column | 16px | **17px** | 18px | 20px |
|---|---|---|---|---|---|
| 16px | 343 | 44.5 | **41.9** | 39.6 | 35.6 |
| **20px** | **335** | 43.5 | **40.9** | 38.6 | 34.8 |

**The honest trade-off: at 375px you cannot have both 17px type and the 45–75 CPL print ideal.**
Anything at or above 17px lands in the 36–43 band. Compensate with leading, not width — which is why
body line-height is **1.60**, not 1.45.

- `--m-pad-read: 20px` — reading surfaces (claim text, entity pages, prose, quotes). **40.9 CPL.**
  The wider gutter is also most of what separates "considered" from "cheap": a generous margin is the
  cheapest editorial signal there is.
- `--m-pad-dense: 16px` — lists, tables, cards, the Coverage grid, Scanner rows. **41.9 CPL.**

**Never below 16px, and never let a reading surface use the dense gutter.**

### The legibility floor — derived, not asserted

Nominal `font-size` is the wrong unit for a floor, because these faces differ by 36% in x-height
(0.420 to 0.570). **Set the floor on x-height, then convert per face.** Anchors, both converted with
Roboto as the measurable proxy: Material's 12sp caption minimum → 6.36px x-height; Apple's 11pt body
minimum → 7.78px. **This audience skews older, so the floor takes the upper half of that range.**

| Tier | x-height floor |
|---|---|
| **Required reading** — body, captions, claim text, doses, citations, table cells | **7.0px** |
| **Glanceable chrome** — tab labels, badges, status pills | **6.3px** |
| **Never** | below 6.3px, no exceptions |

Converted per face (`size = floor / xRatio`):

| Face | required-reading min | glanceable min |
|---|---|---|
| Unbounded / Bruno Ace / JetBrains Mono | **13px** | 12px |
| Playfair Display | **14px** | 13px |
| Chakra Petch | **14px** | **13px** |
| Space Grotesk | **15px** | 13px |

Every size in the scale clears its floor. **The caption is 15px, not 14px, for exactly this reason** —
Space Grotesk at 14px gives a 6.86px x-height, just under the required-reading floor.

**For contrast, what the discarded retrofit shipped:** tab labels at `0.52rem` (**8.3px**), stepping
to `0.46rem` (**7.4px**) below 360px — x-heights of 4.2px and 3.7px, roughly **half** the glanceable
floor. Repo-wide there are **41 declarations below 0.75rem** in `dashboard/assets/styles/`, with
hard-px sizes down to **9px** (6 occurrences) and 10px (8). **Every one is a candidate the mobile
pass must raise or delete. This is a large part of why the surfaces read as cheap.**

### The tab bar, measured

Five tabs across 375px = **75.0px per tab.** Widths in Chakra Petch 600:

| Label | 12px | 12px + 0.04em | 13px |
|---|---:|---:|---:|
| `KNOWLEDGE` (caps) | 71.8 | 76.1 | **77.8 — overruns** |
| `Knowledge` (sentence) | — | — | **66.5 — fits, 8.5px slack** |
| `COVERAGE` / `SCANNER` / `REGIMEN` | 61.4 / 54.6 / 51.4 | | |

**Uppercase labels do not fit at a legible size.** Adopt **sentence-case labels at 13px Chakra Petch
600**; drop `text-transform: uppercase` and the 0.04em tracking uppercase needs (tracking alone costs
4.3px on the longest label). Keep `white-space: nowrap`, but an ellipsis should never be what a 375px
screen shows.

### Per-content-type treatment

- **Claim text** — body role. Paragraph spacing `0.9em`, not a blank-line 1.6em: at 40 CPL paragraphs
  are short and frequent. Set `overflow-wrap: anywhere` on nutrient and product names — chemical
  names and `(R)`/`(TM)` strings are a known source of one element forcing a row wide.
- **Wallach pull-quotes** — the surface most responsible for whether the app reads as a library or a
  webpage, and **currently broken at mobile width.** Measured live at 375px: `.ds-pull-quote` renders
  Playfair 20.8px with `padding: 32px 40px` and a **96px** `::before` glyph — leaving a 255px inner
  measure (**28.0 CPL**) with the decorative glyph occupying **29% of the card's width.** Both are
  desktop geometry surviving into a phone. **Mobile spec: padding `20px 20px 20px 22px`, 19px, 1.45,
  `::before` at 3.25rem (52px), `top: -0.28em`, `left: 0.08em` → 293px inner, 35.2 CPL.**
  ⚠ **Style the `::before` too.** It reads `--ds-font-display` (Unbounded) **directly** and inherits
  nothing from its host; styling only the body ships a silent font mismatch that has been reported
  three times before.
- **Citations** — UI face 600/13px/0.02em in `--ds-ink-soft`, as a `footer` inside the quote card,
  book title in body italic 14px so a title reads as a title. Every amount traces to a book, so the
  citation is **load-bearing content, not chrome**: it gets a legible size and a passing colour.
- **Tables** — mono 14px/1.50 gives 39 monospace columns at the dense gutter: enough for
  `label … value unit`, not for a 4-column desktop table. **Restructure, do not shrink.**
- **UI labels** — UI face 600/13px, **sentence case**.

### The numeral defect — found while measuring, costs nothing to fix

`font-variant-numeric: tabular-nums` only does anything if the face ships a `tnum` table. Measured
per face (width of `1111111111` vs `0000000000`):

| Face | `1` | `0` | **tnum works** |
|---|---:|---:|---|
| JetBrains Mono | 0.600 | 0.600 | n/a — already tabular |
| Space Grotesk | 0.418 | 0.641 | **YES** |
| Unbounded | 0.471 | 0.893 | **YES** |
| Playfair Display | 0.370 | 0.600 | **NO** |
| Chakra Petch | 0.358 | 0.628 | **NO** |
| **Bruno Ace** | **0.313** | **0.901** | **NO** |

**Bruno Ace — the face used for the big numeric readouts — has no `tnum` table and the widest
proportional digits here: `0` is 2.9× the width of `1`.** Two shipped declarations are therefore
**no-ops today**: `workspace-regimen.css:287` (`.ck-gauge__num`) and `workspace-scanner.css:265`
(`.vd-cov-gnum`). A coverage count going 11 → 90 changes width by ~2.9× in the gauge; on desktop
there is slack, on a 375px column it will visibly jump. Chakra Petch has the same problem, and
`drawer-knowledge.css:1335` sets a 1.3rem Chakra Petch numeral with `white-space: nowrap`.

**Mobile rule: any numeral that *changes* — coverage counts, doses, percentages, scan results — is
set in JetBrains Mono or Space Grotesk.** Bruno Ace and Chakra Petch are for **static** numerals
only. If Bruno Ace must carry a changing number, reserve width with `min-width: Nch` measured against
`0`, not against the current value. **The amounts are Wallach's and they should not shimmer.**

### Optical adjustments — support verified, not assumed

| Feature | Chrome 149 | Use it? |
|---|---|---|
| `text-wrap: pretty` | true | Yes on body/captions/claim text — but never load-bearing (Safari 26.0) |
| `text-wrap: balance` | true | Yes on display/title/section only. Browsers cap it at a small line count (UNKNOWN 8) |
| `font-variant-numeric: tabular-nums` | true | Yes — **only on faces that have the table** |
| `font-synthesis: none` | true | **Yes** — makes missing weights fail loudly |
| `-webkit-text-size-adjust: 100%` | true | **Yes** — a correctness opt-out, not a tweak |
| `text-box-trim` | true | Optional; verify on target Safari first |
| `hanging-punctuation: first` | **false** | **No** — see the engine table |

### Scaling under the user's own settings

Two mechanisms, often conflated. **(1) Browser default font size** — both iOS Safari and Android
Chrome let the user raise it; it scales `rem` and unitless `em` and nothing else. **This is the
mechanism the scale must ride**, which is why every size is `rem`, why `html { font-size: __px }` is
forbidden, and why `px` sizes and `vw`-based `clamp()` are both disqualified. **(2) Automatic text
inflation / font boosting** — engines heuristically enlarge text in narrow containers, silently
distorting a tuned scale. `-webkit-text-size-adjust: 100%` opts out.

⚠ **Consequence for the existing tokens.** `--ds-text-3xl/4xl/5xl` (`design-system.css:222-224`) are
`clamp(… vw …)`. At 375px the `vw` term is always below the floor, so each resolves to its flat `rem`
floor and the `vw` term never participates — and `--ds-text-5xl`'s floor is 5rem = **80px, 21% of a
375px viewport**. **The mobile scale must not consume the 3xl/4xl/5xl tokens at all.** It defines its
own `--m-text-*`, which is why those are plain `rem`.

### ⚠ The one thing that needs the owner's ruling: the `.ds-mark` one-line rule

The rule (memory `quote-typography`, a repeated correction from him): a highlighted `.ds-mark` phrase
must sit on **one line**; the fix is always to make the quote **smaller**, never bigger, and **never**
to change what is highlighted. The mechanism is in `design-system.css:460-495` — `.ds-mark` is
`display: inline-block` with an absolutely-positioned `::before` carrying the `feTurbulence` texture.
It **physically cannot** wrap; `box-decoration-break: clone` does not reach an absolutely-positioned
pseudo-element.

**Measured by driving the real app** (Absorption tab, drawer forced to a narrow column):

| Mark text | 950px (desktop) | 375px | 360px | 320px |
|---|---|---|---|---|
| `the consumption of gluten will produce a "contact enteritis"` (59 chars) | 1 line | **3 lines** | **3 lines** | **3 lines** |
| `the acid is not acid enough` | 1 | 1 | 1 | 1 |
| `sterile` | 1 | 1 | 1 | 1 |

At the mobile quote spec one line holds **35 characters**. To fit 59 the quote would have to drop to
**11.3px** — far below every floor, and the rule forbids growing the quote instead.

**Three project rules collide, and this brief will not pick silently:**
1. The one-line rule says: shrink the quote.
2. The floor says: never below 14px for Playfair.
3. The rule says: never change what is highlighted.

`design-system.css:455` already states the intended constraint — *"1-3 words max per mark"*. **This
mark is ten words**, so the *content* violates the design system's own stated limit, which is why no
amount of sizing rescues it. The options, **for the owner to choose**:

- **(a)** The **two-real-marks split** on mobile — the hack he himself described, already prototyped
  in `temporary/highlight-hack-proto.html`: the phrase is split into two abutting `.ds-mark`
  elements, one per line, each the untouched sealed marker. He **declined automating it** in a
  previous session ("leave it as is, I'll deal with it later"), so this would be a hand-split per
  quote, not runtime JS.
- **(b)** Re-choose the highlighted span on the affected quotes to ≤ 32 characters, bringing the
  content back inside the design system's own 1-3 word limit. This contradicts "never change what is
  highlighted", so it needs his explicit ruling.
- **(c)** A different, wrap-capable treatment on mobile only. **Already rejected once** — a
  background-based reproduction was built and the verdict was *"This looks NOTHING like the original.
  REVERT."* Recorded only so nobody re-proposes it as new.

**Whichever is chosen, the gate ships with it**, because it is now cheap: for every visible
`.ds-mark`, assert `round(getBoundingClientRect().height / lineHeight) === 1` at 375px. ⚠ **Do not
use `getClientRects().length`** — `.ds-mark` is `inline-block`, so it returns exactly 1 for a wrapped
element and will pass a broken layout. That instrument already produced a false "ok (one line)"
reading for a mark that was in fact on three lines.

### Ready-to-paste

```css
/* ===========================================================================
 * MOBILE TYPE SYSTEM — 375px-first, mobile-only scope.
 *
 * Sizes are rem so the browser's default-font-size preference scales the whole
 * app. NEVER set html{font-size:__px} and NEVER use a vw unit in this block —
 * both defeat that preference. The app's 3xl/4xl/5xl tokens are vw-clamped and
 * are deliberately NOT consumed here.
 *
 * Families resolve through the LIVE tokens. type-futurist.css is authoritative;
 * design-system.css's serif tokens are declared but dead — do not read them.
 * =========================================================================== */
:root {
  /* -- families ---------------------------------------------------------- */
  --m-font-display: var(--ds-font-display);            /* Unbounded          */
  --m-font-body:    var(--ds-font-sans);               /* Space Grotesk      */
  --m-font-ui:      var(--ds-font-display-interface);  /* Chakra Petch       */
  --m-font-mono:    var(--ds-font-mono);               /* JetBrains Mono     */
  --m-font-numeral: var(--ds-font-display-artifact);   /* Bruno Ace (static) */
  --m-font-quote:   'Playfair Display', 'Times New Roman', Georgia, serif;

  /* -- sizes ------------------------------------------------------------- */
  --m-text-display: 1.875rem;   /* 30px */
  --m-text-title:   1.375rem;   /* 22px */
  --m-text-section: 1.125rem;   /* 18px */
  --m-text-body:    1.0625rem;  /* 17px — NOT 16px; Space Grotesk x-height is 0.490 */
  --m-text-caption: 0.9375rem;  /* 15px — NOT 14px; 14px is under the x-height floor */
  --m-text-label:   0.8125rem;  /* 13px — glanceable floor for Chakra Petch */
  --m-text-mono:    0.875rem;   /* 14px */
  --m-text-quote:   1.1875rem;  /* 19px */

  /* -- line heights ------------------------------------------------------ */
  --m-lh-display: 1.08;   --m-lh-title:   1.18;
  --m-lh-section: 1.28;   --m-lh-body:    1.60;   /* compensates a 41-char measure */
  --m-lh-caption: 1.45;   --m-lh-label:   1.15;
  --m-lh-mono:    1.50;   --m-lh-quote:   1.45;

  /* -- tracking ---------------------------------------------------------- */
  --m-track-display: -0.02em;   --m-track-title:   -0.015em;
  --m-track-section: -0.005em;  --m-track-body:     0.005em;
  --m-track-caption:  0.005em;  --m-track-label:    0.02em;
  --m-track-mono:     0;        --m-track-quote:    0;

  /* -- the measure ------------------------------------------------------- */
  --m-pad-read:  20px;   /* reading surfaces  -> 335px column -> 40.9 CPL @17px */
  --m-pad-dense: 16px;   /* lists/tables/grid -> 343px column -> 41.9 CPL @17px */

  /* -- text colour: PASSING tokens only ---------------------------------- */
  --m-ink-primary:   var(--ds-ink);         /* cream 16.52 · dark 15.47 — AAA */
  --m-ink-secondary: var(--ds-ink-medium);  /* cream 11.20 · dark 11.67 — AAA */
  --m-ink-tertiary:  var(--ds-ink-soft);    /* cream  5.86 · dark  6.69 — AA  */
  /* --ds-ink-faint is 2.94:1 on cream. It is a RULE colour here, never text. */
}

html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

.m-display { font-family: var(--m-font-display); font-weight: 700;
  font-size: var(--m-text-display); line-height: var(--m-lh-display);
  letter-spacing: var(--m-track-display); color: var(--m-ink-primary);
  text-wrap: balance; }
.m-title { font-family: var(--m-font-display); font-weight: 600;
  font-size: var(--m-text-title); line-height: var(--m-lh-title);
  letter-spacing: var(--m-track-title); color: var(--m-ink-primary);
  text-wrap: balance; }
.m-section { font-family: var(--m-font-body); font-weight: 700;
  font-size: var(--m-text-section); line-height: var(--m-lh-section);
  letter-spacing: var(--m-track-section); color: var(--m-ink-primary);
  text-wrap: balance; }
.m-body { font-family: var(--m-font-body); font-weight: 400;
  font-size: var(--m-text-body); line-height: var(--m-lh-body);
  letter-spacing: var(--m-track-body); color: var(--m-ink-primary);
  text-wrap: pretty; }
.m-body + .m-body { margin-top: 0.9em; }
.m-body .name, .m-body code { overflow-wrap: anywhere; }

.m-caption { font-family: var(--m-font-body); font-weight: 400;
  font-size: var(--m-text-caption); line-height: var(--m-lh-caption);
  letter-spacing: var(--m-track-caption); color: var(--m-ink-tertiary);
  text-wrap: pretty; }
.m-label {                        /* tab labels, badges, kickers — SENTENCE CASE */
  font-family: var(--m-font-ui); font-weight: 600;
  font-size: var(--m-text-label); line-height: var(--m-lh-label);
  letter-spacing: var(--m-track-label); color: var(--m-ink-secondary);
  text-transform: none;           /* uppercase does not fit — 77.8px in a 75px cell */
  white-space: nowrap; }
.m-mono { font-family: var(--m-font-mono); font-weight: 400;
  font-size: var(--m-text-mono); line-height: var(--m-lh-mono);
  letter-spacing: var(--m-track-mono); color: var(--m-ink-primary);
  font-variant-numeric: tabular-nums; }   /* real: JetBrains Mono IS monospaced */

/* Numerals that CHANGE must use a face that actually has a tnum table.
   Bruno Ace and Chakra Petch do not — tabular-nums is a no-op on them. */
.m-num-live   { font-family: var(--m-font-body); font-weight: 700;
                font-variant-numeric: tabular-nums; }
.m-num-static { font-family: var(--m-font-numeral); }   /* Bruno Ace, static only */

/* Missing weights should fail loudly, not get faux-bolded.
   Chakra Petch has no 500; Bruno Ace is 400-only. */
.m-label, .m-num-static { font-synthesis: none; }

/* -- the Wallach pull-quote, mobile geometry ------------------------------- */
.m-quote .ds-pull-quote {
  font-family: var(--m-font-quote); font-style: italic; font-weight: 400;
  font-size: var(--m-text-quote); line-height: var(--m-lh-quote);
  padding: 20px 20px 20px 22px;         /* was 32px 40px — desktop geometry */
}
/* The ::before glyph reads --ds-font-display (Unbounded) DIRECTLY and inherits
   nothing from its host. Style BOTH or you ship a silent font mismatch. */
.m-quote .ds-pull-quote::before {
  font-family: var(--m-font-quote);
  font-size: 3.25rem;                   /* was 6rem = 29% of a 375px card */
  top: -0.28em; left: 0.08em;
}
```

---

## Accessibility contract

Not a checklist copied from a blog post. Every number was measured by a headless walk of the real
`file://` app at 390×844 dPR 3, touch-emulated, across all five surfaces in **both** themes, with
every colour alpha-composited over its true ancestor background. Page errors during the run: **0**.

⚠ **Standing policy, and why this is here now.** The owner's 2026-07-05 call defers legal, copyright,
disclaimer, **a11y and i18n** to one pass at the very end. This document does **not** ask for that
pass to be pulled forward. It is delivered now because retrofitting 44px targets and a corrected
palette into a *finished* design costs far more than designing to them.
⚠ One caveat: that policy names `chronicle/finalize-checklist.md §4` as its tracker, and **that file
no longer exists in the repo** (almost certainly pruned in the 2026-08-20 cleanup). The policy is
confirmed; the tracking file should be recreated by the final pass.

### Why the floors here are stricter than the usual defaults

The audience skews older — inferred from the content, not from analytics, because this app has none
by design (UNKNOWN 12). Its goal chips read *Stronger bones · Healthy joints · Prostate & men's
health · Women's health & cycles*. Presbyopia is effectively universal past ~45; lens yellowing and
pupil miosis mean a 60-year-old's retina receives roughly a third of the light a 20-year-old's does;
blue-yellow discrimination degrades first (so `--ds-tech`'s cool cyan at 2.56:1 on cream is the exact
pairing that goes first); and **arthritis is one of the app's own goal chips** — a 10×10px swatch is
not operable by a hand this app is written for.

And the core act here is a judgement about what to put in your body. **A 9.6px amount that a
62-year-old squints at and misreads is the same failure class as a wrong amount, arrived at from the
other end.**

**Honesty note:** WCAG specifies **no minimum font size at all**, and 44×44 is the Apple HIG /
Material convention, not a WCAG requirement (SC 2.5.8 requires 24×24 at AA; 44×44 is AAA). **These
floors are this project's decision for this audience**, labelled as such rather than dressed up as a
legal minimum. What WCAG *does* require and this app must not break: SC 1.4.4 (text resizable to 200%
— which is why the scale is `rem` and must stay that way) and SC 1.4.10 (reflow at 320px with no
two-dimensional scrolling).

### Type — the measured state

`--ds-text-*` resolved at a 16px root: `micro` 0.6rem = **9.6px** · `mini` 0.7rem = **11.2px** ·
`xs` 0.78rem = **12.48px** · `sm` 0.85rem = **13.6px** · `base` 1rem = 16px.

**112 distinct sub-14px rendered runs**, distributed: Coverage 57 · Regimen 54 · Knowledge 43 ·
Search 30 · Scanner 28. **The mode is 9.6px, in 29 distinct places.** Worst single case: **8.96px**
(`span.kcard-facets`, the Ask-Wallach browse card).

Named offenders where the *content* makes it worse:

| What | Size | Where |
|---|---|---|
| `.tile__name` — **the essential's NAME on a coverage tile** ("HYDROGEN") | **9.5px** | `workspace-coverage.css` |
| `.tile__hint` — "n-3 · alpha-linolenic (ALA)" | 9.6px | ditto |
| `.rec__price` "$48.95" / `.rec__q` "adds 26" | 9.6px | Coverage recommendations |
| `.sh-hint` search suggestion chips | **9px, hard-coded** | `drawer-knowledge.css:2019` |
| `.ep-legend__lbl` — the category colour key | 9px | entity page |
| `.vd-manual` "or add it by hand" — **the Scanner's whole fallback path** | 9.6px | `workspace-scanner.css:66` |

**Resolved against Typography:** the a11y track sets a flat 14px absolute floor; the typography track
derives per-face floors from x-height. **The per-face floors are stricter where it matters and are
the ones to use** — nothing under 15px Space Grotesk, 14px Chakra Petch/Playfair, 13px
JetBrains Mono/Unbounded/Bruno Ace. They satisfy the 14px rule everywhere except the three faces
whose x-height earns 13px, and those are glanceable chrome only.

- **T1** No rendered text below the per-face floor on any mobile surface. No exceptions for eyebrows,
  kickers, legends, monospace readouts, or chip labels.
- **T2** Body prose, and **every nutrient amount / dose / daily target / coverage percentage**,
  renders at ≥16px — 17px preferred, per the type scale.
- **T3** The scale is `rem`, never `px`.
- **T4** ⚠ Before repointing `--ds-text-*` under a mobile layer, **grep the readers first**
  (`token-indirection-grep-the-readers`). Collapsing micro/mini/xs changes rhythm in ~112 places and
  some of them are deliberate.
- **T5** No text below 16px inside an `<input>`, `<select>` or `<textarea>`.

### Touch targets — 77 measured offenders

**77 distinct interactive elements render smaller than 44×44 at 390×844.** Geometry is identical in
both themes. The worst:

| Rendered | Element | Rule | Fix |
|---|---|---|---|
| **10 × 10** | `.ck-swatch` — the regimen slot colour picker | `workspace-regimen.css:146` | Keep the 10px **dot** as the visual; expand the **hit area** to 44×44 (`::after { position:absolute; inset:-17px }`). Never scale the mark — the row rhythm is deliberate. |
| **11 × 56** | `.rail__profile` — the profile trigger, all 5 surfaces | `dashboard.css:83` | 11px wide because the rail collapses. The mobile IA replaces this anyway. |
| **18 × 18** | `.fs-pager__b--arrow` — Coverage food pager, `gap: 4px` | `dashboard.css:551`, `:549` | 18 + 4 = 22 < 24, so it fails even WCAG 2.2's **spacing exception**. A mobile pager should not be numbered chiclets at all. |
| **22 × 22** | `.fs-pager__b` | `dashboard.css:570` | same |
| **24 × 24** | `.ck-slot__pencil`, `.ck-slot__export` | `workspace-regimen.css:92-100` | 44×44 with the 13px glyph centred |
| **28 × 28** | `.ui-close--sm` — the canonical small close, **app-wide** | `dashboard.css:385` (`--uic-size`) | one token → 44px, every instance |
| **34 × 34** | `.ui-close` — the canonical close, **every modal/panel/drawer** | `dashboard.css:373` | same token |
| **34 × 34** | `.scr-nav--close` — the Ask-Wallach close, a **twin** of `.ui-close` | `drawer-search.css:109` | ⚠ **does not read `--uic-size`** — must be fixed separately. Worth collapsing into `.ui-close`. |
| **26px tall** | `.vd-newscan` — **"+ New Scan", the Scanner's primary CTA** | `workspace-scanner.css` | |
| **28px tall × 27** | `.wc-goal` — every goal chip in the welcome card, all 5 surfaces | `workspace-coverage.css:1144` | 27 targets in a wrapped cloud, and the first thing a new user touches |
| **33.2px** | `.kd-knh__tab` ×6 — **the Knowledge tab bar**, the surface he called cheap | `drawer-knowledge.css:34` | |
| **42px** | `.rail__item` ×5 — **the app's primary navigation** | `dashboard.css:72` | off by 2px |
| **17.4px tall** | `.vd-manual` — the Scanner's manual-entry escape hatch | `workspace-scanner.css:66` | an underlined text link 17px tall at 9.6px type |

⚠ **The measured nuance that reframes all of this:** sub-44px controls are roughly as common at
**1440px (316)** as at **375px (305)**. **This is not a responsive-layout failure — the app's
controls are small everywhere.** Fine for a mouse, wrong for a finger.

### The iOS 16px input floor

iOS Safari zooms the whole page when a text field with a computed `font-size` under 16px takes focus,
and **does not zoom back out** — one undersized field permanently breaks the layout for the session.
Measured today:

| Field | Computed | Verdict |
|---|---|---|
| `.fs-filter__q` / `.fs-filter__cat` | 12px (`dashboard.css:611`) | **ZOOMS** |
| `.ck-addfield__input` | 13.6px (`workspace-regimen.css:404`) | **ZOOMS** |
| `.aw-search__input` | 17.6px | safe |
| `.sh-search input` | 16.8px | safe |
| `:where(.vd) input, textarea` | `font: inherit` | **depends on the inherited value — verify per instance** |

⚠ Note `dashboard.css:600-609`'s comment: the 22px height on `.fs-filter__cat` is **load-bearing** —
a `<select>` given less room than its text renders empty. Raising the *height* is safe; raising the
*font* without the height is what broke before.

⚠ The discarded branch already solved this — `mobile.css:437-461` carries a `★ THE 16px INPUT FLOOR`
block with `input, select, textarea { font-size: max(16px, 1em); }` plus per-drawer specificity
escalations, and its probe fails the board on any sub-16px field. **The finding and the probe are
worth salvaging even though the layer is not.** The specificity ladder was needed because **both
drawers root every rule at their mount ID** (1,1,0) — if the mobile design owns its own markup and
sheets, the ladder disappears.

- **A1** Every interactive element renders **≥44×44 CSS px** at 320–430px. Where the visual mark must
  stay small, the **hit area** is expanded invisibly — never the mark.
- **A2** Adjacent targets have **≥8px** clear space.
- **A3** No form control computes below 16px.
- **A4** The viewport meta gains `viewport-fit=cover` and `interactive-widget=resizes-content` and
  **never** `user-scalable=no` or `maximum-scale`.
- **A5** Every icon-only control carries a visible-on-focus ring **and** an accessible name.

### Contrast — the audit, and the replacement values

Two passes: a **token matrix** computed from the hex literals (catches pairs the app can paint but
did not during the run), and a **rendered audit** (catches composited translucent tints the matrix
cannot see).

**Rendered AA failures per surface**, cream / dark: Coverage **32** / 20 · Regimen **27** / 17 ·
Knowledge **20** / 12 · Search **16** / 10 · Scanner **15** / 10.

**The four structural findings:**

1. **`--ds-ink-faint` fails AA in every pairing** — cream 2.47–3.10, dark 3.26–3.89. It is the app's
   eyebrow/hint/count/placeholder/citation colour, 40+ rendered instances, **often at 9.6px, which
   compounds**. **Mobile rule: `--ds-ink-faint` is a rule-and-divider colour, never a text colour.**
   Every caption, eyebrow and citation goes to `--ds-ink-soft` (5.86 cream / 6.69 dark).
2. **The entire accent family fails as text on cream.** `--ds-accent` 2.32 · `-hot` 2.72 ·
   `-bright` 1.89 · **`-deep` 4.03** — and `-deep` is the "for text" variant. On cream there is **no
   accent token that passes AA at body size**; the honest answer is to carry emphasis with **weight
   or a mark, not colour**. Dark is the opposite (accent is AAA at 7.31), so **a treatment verified
   in dark is not verified**.
3. **`--ds-rule` is 1.53:1 cream / 1.46:1 dark — every border in the app fails SC 1.4.11 (3:1).** On
   mobile, where a 1px hairline is the usual card boundary, any control whose affordance depends on
   its border needs a 3:1 outline or a filled ground instead. Computed replacements for
   *meaningful* boundaries: cream `#a38c51`, dark `#6b6050`. A purely decorative divider may stay
   light; an input edge, a card edge or a state ring may not.
4. **Dark fixes what cream breaks and breaks what cream fixed.** `--ds-status-err` goes 4.99 → **3.41**
   and `-info` 4.81 → **3.53**. **On the Scanner — the surface whose whole job is telling you
   something is wrong — the error colour is the one that fails in dark.** `--ds-accent-deep` fails in
   **both** themes (4.03 / 4.22) and has no theme where it is a legal body-text colour, yet it is
   used as one (`.rr-scan__link`, `.kd-knh__tab.active`, `.vd-step__state.is-active`).

**★ The single worst structural finding:** the coverage tile — the app's central object, 90 of them —
puts the essential's symbol, name, code and hint at 9.5–17px in `--ds-ink-soft` on `--ds-paper-deep`
at **5.31:1**, and when the tile is *covered* it flips to **white on `--ds-status-ok` at 4.08:1**,
which fails AA outright. **The map of gaps is drawn in colours the audience cannot reliably read.**

**Replacement values** (computed by holding hue and saturation and moving lightness until the ratio
is met; verified against the target, not eyeballed):

*Cream — AA on `--ds-paper`, AAA on the darkest paper `--ds-paper-darker` (the worst case, so it
holds everywhere):*

| token | today | AA on paper | **AAA on paper-darker** |
|---|---:|---|---|
| `--ds-accent` #ff7e3c | 2.32 | `#c84400` | `#822c00` |
| `--ds-accent-hot` #ff6420 | 2.72 | `#cd3e00` | `#852900` |
| `--ds-accent-deep` #c8552a | 4.03 | `#bb5027` | `#793419` |
| `--ds-tech` #5fa4bd | 2.56 | `#3b788f` | `#264e5c` |
| `--ds-status-ok` #5b8a3f | 3.74 | `#527c39` | `#355024` |
| `--ds-status-warn` #c79830 | 2.42 | `#8d6c22` | `#5b4516` |
| `--ds-ink-faint` #9b8e7c | 2.94 | `#7b6f5e` | `#4f473d` |
| `--ds-ink-soft` #6a5d50 | 5.86 | (passes) | `#51473d` |

*Dark — AA on `--ds-paper`, AA/AAA on `--ds-paper-light`:*

| token | today | AA on paper | **AAA on paper-light** |
|---|---:|---|---|
| `--ds-accent-deep` #c8552a | 4.22 | `#d0582c` | `#e29477` |
| `--ds-status-err` #b04a30 | 3.41 | `#cb5b3f` | `#dd9684` |
| `--ds-status-info` #4a7090 | 3.53 | `#5681a6` | `#8dabc5` |
| `--ds-ink-faint` #786c58 | 3.60 | `#897b65` | `#b1a695` |
| `--ds-status-ok` #5b8a3f | 4.54 | (passes) | `#80b65f` |

**The on-fill rule.** On the **warm** fills (accent / warn / tech) the legible text is **dark ink**,
in both themes (`--ds-ink` on `--ds-accent` = 7.11 AAA). Today the app paints `--ds-paper` on
`--ds-accent` at 2.32–2.45:1 (`.fs-pager__b[aria-current]`, `.vd-step__badge.is-active`) — **exactly
backwards, and a one-line fix per site**. On the **cool/dark** fills (err / info) it is the reverse.
`--ds-status-ok` has **no** legible pairing at its current value in either theme and must be darkened
(`#56823b` gives white text 4.5:1).

⚠ **How these land: `design-system.css` is SEALED** — hash-anchored by
`design-system.golden.sha256`, policed by an ERROR-mode gate, and **the agent may never edit it**.
Every value above therefore lands as a **shadow in a later, non-sealed layer** — the mechanism
`theme.css` already uses. Same specificity, later cascade position, no `!important`. No sealed byte
moves and the golden hash stays green.

⚠ **And this measured only ember.** `theme.css:62-91` defines **eight** `[data-accent]` families and
the user picks one. Fixing `--ds-accent` for ember fixes one of eight. UNKNOWN 6.

- **C1** Every text/background pair the app can paint clears **AA 4.5:1** (3:1 large). No
  "decorative" carve-outs for numbers.
- **C2** Body prose and every amount/dose/target/percentage clears **AAA 7:1**.
- **C3** Every non-text UI boundary that carries meaning clears **3:1**.
- **C4** **Both themes are audited every time.** A fix verified in one theme is not verified.
- **C5** Colour is never the sole carrier of meaning. Coverage state must also differ in shape, mark
  or text — `workspace-coverage.css:363-365` already records that PARTIAL was once "imperceptible".
  The category taxonomy is **fixed and must not change**, so it needs a non-colour partner (the
  existing `.tile__code` prefix `V·01` / `F·01` is one, once it is legible). **Permanently a WISH —
  not machine-checkable.**

### Screen readers

**Good news, measured, and it must not regress: across all five surfaces in both themes the walk
found ZERO interactive controls with no accessible name.** The 85 `aria-label`s are doing real work.
That is a better starting point than most codebases.

**The gaps, measured:**

1. **There are two `aria-live` regions in the entire app, and they are the same one**
   (`views/profile.ts:168`). The audit found `live = []` on **every one of the five surfaces**. So
   **the scanner verdict — the result of pointing a camera at a product label — is announced to
   nobody**; search results are announced to nobody; coverage recomputation is announced to nobody.
   For a blind or low-vision user the Scanner is a black box: you tap, something happens, silence.
2. **Heading order is broken.** Coverage renders `H1 → H3 → H3 → H3 → H3 → H3 → H2` — H1 jumps to H3,
   and the H2 sits *after* the H3s in DOM order.
3. **The H1 goes stale.** Opening Search from the Scanner leaves `H1:Scanner`; opening Knowledge
   yields **two H1s**. A drawer changes what the page *is* without changing what it *says* it is.
4. **Landmark duplication with no names** — Coverage renders four unnamed `<header>`s and two unnamed
   `<aside>`s. A landmark list of "banner, banner, banner, banner" is noise.
5. **Only one overlay is a real dialog.** The Search and Knowledge drawers are not dialogs and have
   no focus trap; the regimen popovers set `aria-modal` without the surrounding contract.
6. **★ The one focus trap that exists is correct and is the model.** `main.ts:401-434` traps Tab,
   focuses the panel on open, restores to the trigger on close, closes on Escape — and its own
   comment notes *"aria-modal is advisory, so without this focus would fall to…"*. **Copy this
   pattern; do not reinvent it.**

- **S1** Exactly one `<main>`. Every repeated landmark carries a distinguishing `aria-label`.
- **S2** One `<h1>` per rendered view, matching what the user believes they are looking at, no
  skipped levels. When a sheet takes over the screen it owns the H1 (or is a dialog labelled by its
  own heading) and the underlying view's heading is not simultaneously exposed.
- **S3** Accessible name on every icon-only control, with the glyph itself `aria-hidden="true"` so it
  is not read as punctuation. **Passing today — hold the line.**
- **S4** Three live regions that matter: the **scanner verdict** (`role="status" aria-live="polite"
  aria-atomic="true"`, announcing the verdict headline and the "hits N of 90" phrasing — not the raw
  OCR dump); **scanner progress/failure** (a polite region for stage changes, `role="alert"` for the
  honest failure card); and a **short search summary** ("14 results for calcium") — **not** the result
  list itself, because announcing 14 cards is unusable. ⚠ **Live regions must exist in the DOM before
  the content lands** or the announcement is dropped: render the empty container at mount.
- **S5** A sheet/drawer/modal: is `role="dialog" aria-modal="true"` with `aria-labelledby` on its own
  heading; moves focus inside on open (to the heading or first control, never the close button);
  traps Tab; marks the background **`inert`** (`aria-modal` alone does not do this); closes on Escape
  **and** backdrop tap; and **restores focus to the opener on every close path — Escape, backdrop,
  close button, and swipe-to-dismiss. Swipe-dismiss is the path that is always forgotten.**
- **S6** `:focus-visible` appears **15 times** against **220** `:hover` rules. Every interactive
  element gets a visible focus ring at ≥3:1 against both its own background and the adjacent surface.
  This matters on mobile: external keyboards, switch control, and TalkBack's focus rectangle all use
  it.
- **S7** State, not just labels: `aria-pressed` on toggles; `role="tab"`/`aria-selected` inside a
  `role="tablist"`; `aria-current="page"` on the pager (already correct); `disabled` on disabled
  controls, not just `opacity:.38` (`dashboard.css:573` dims with no state exposed).
- **S8** With TalkBack/VoiceOver on, **a swipe gesture is intercepted**. Any interaction that only
  works by swipe must have a non-swipe equivalent that is reachable and named.

### Motion

`design-system.css:293-307` has a global `prefers-reduced-motion` block that clamps the motion
durations **and** caps `animation-iteration-count: 1 !important`. That second line exists because of
a **real measured incident recorded in the file's own comment**: capping duration alone accelerated
seven `infinite` animations to ~100Hz — **a strobe served to precisely the users who asked for less
motion**, well past the WCAG 2.3.1 three-flashes-per-second threshold.

⚠ **`tools/probes/render_probe_reduced_motion.js` exists, has an anti-degenerate PASS-2, and is NOT
on the invariant board.** A flash hazard that has already fired once in this codebase is guarded by a
probe someone has to remember to run.

**Disabling an animation is the lazy half.** The right question is: *what was the motion telling the
user, and does that information survive?*

- Decorative motion → remove entirely. `workspace-regimen.css:221-228` does this correctly and is the
  model: it kills the entrance, switches easing to `linear`, and neutralises the hover translate
  *and* the swatch scale.
- **★ The counter-example is in this repo.** `workspace-scanner.css:323-326` turns an
  **indeterminate** progress bar into `width: 100%` under reduce — **which reads as *finished*. A
  reduced-motion user is told the scan is complete while it is still running.** The correct fallback
  is a static partial fill plus a text status that the S4 live region should be announcing anyway.
  **Fix this.**
- ⚠ **This is not an edge case for a minority.** iOS Low Power Mode and Android battery saver
  throttle animation and in some browsers force `prefers-reduced-motion: reduce`. If the fallback is
  wrong, it is wrong for a large share of users.

- **M1** Every animation is authored inside `@media (prefers-reduced-motion: no-preference)` or has
  an explicit `reduce` counterpart. Nothing ships governed only by the global duration clamp.
- **M2** No animation loops more than 3× per second under **any** setting. Enforced by promoting the
  existing probe to a board gate.
- **M3** Every state-carrying animation names its reduced-motion equivalent in the same patch. A
  `reduce` fallback that changes what the UI *means* is a defect, not a fallback. **Permanently a
  WISH — not machine-checkable.**
- **M4** No parallax, no auto-advancing content, no infinite ambient loop. Vestibular triggers cluster
  in exactly the age band this app serves, and vertigo is itself a symptom the corpus discusses.
- **M5** Sheet and drawer transitions ≤250ms and translate ≤40px; under `reduce`, opacity only.

### Real conditions

**Sunlight.** Measured relative luminance: cream `--ds-paper` **L = 0.9146**; dark **L = 0.0068**. A
bright ground is the *correct* outdoor choice — phone screens lose contrast to specular reflection
off the glass, and a near-white ground swamps the reflection while a near-black one reflects the sky
and the user's own face. **Cream-as-default is the right sunlight decision, not merely an aesthetic
one, and should stay the mobile default.** What breaks outdoors is everything in the contrast audit:
effective contrast in bright ambient light is far below the nominal ratio, so **a 1.53:1 hairline
simply does not exist**. This is the strongest argument for the AAA-on-prose target and the
3:1-on-borders rule.

- **R1** Sunlight-critical surfaces — the scanner verdict, coverage tile state, any amount — use
  `--ds-ink` or `--ds-ink-medium`, never `-soft` or `-faint`.
- **R2** State is carried by **fill**, not by a hairline.
- **R3** Dark is offered but **never auto-selected** by ambient light or time of day. The user
  chooses; the app does not guess.

**One-handed, in a store aisle, holding a product.** This is *the* Scanner use case and the one the
current desktop layout is worst at.

- **R4** Every primary action lives in the **bottom third**. The natural thumb arc on a 390×844
  device covers roughly the lower 60% and the near edge; the top corners require a regrip. Today the
  Ask Wallach CTA is a 35px-tall control in the **top bar** and the workspace nav is a **left rail**.
- **R5** Nothing destructive within the thumb arc without a confirm. The regimen already gets this
  right — `.ck-slot__confirm`'s comment reads *"never delete on the first click"*. Keep and extend it.
- **R6** The whole scan path is operable one-handed **in either hand**. Do not put confirm on the
  left and cancel on the right in a way that only works right-handed.
- **R7** No hover-only affordance anywhere. **220 `:hover` rules versus 5 `:active` rules.** Specific
  live case: `.gchip:hover .gchip__x { opacity: 1 }` (`workspace-coverage.css:1019`) — **the remove
  control on a goal chip is reachable only by hovering, which on a phone means it does not exist.**
- **R8** Walking degrades pointing accuracy; cold or gloved fingers land a larger contact patch; a
  cracked digitiser dead-zones whole strips. All three argue for the 44px floor and the 8px gutter,
  **and for keeping critical targets away from screen edges** where cracks and dead zones
  concentrate.
- **R9** Every tap gives feedback within ~100ms. `-webkit-tap-highlight-color: transparent` is set on
  `.ck-slot` (`workspace-regimen.css:42`) **with no `:active` to replace it** — the native flash is
  suppressed and nothing takes its place, so a tap looks like nothing happened. **Never remove one
  without the other.**
- **R10** A mistap while walking must be undoable — prefer confirm-then-commit for anything that
  alters the regimen.
- **R11** Nothing time-limited. No auto-dismissing toast carrying the only copy of a result (SC 2.2.1).

### i18n — deferred, but do not block it

The redesign should avoid hard-coding these, so the final pass is not a rewrite:

- **No text baked into images, SVG paths, or CSS `content:`** for anything a human reads. Glyph marks
  are fine; words are not.
- **No sentences assembled by concatenation.** `"adds " + n + " essentials"` is unlocalisable. Use a
  whole-string template with a placeholder even with one language.
- **No `text-transform: uppercase` as the only way a label is capitalised** — keep the source string
  correctly cased so the transform is presentation-only. (The type scale already drops uppercase from
  tab labels for an unrelated reason.)
- **No fixed-width containers sized to English string lengths.** German and Finnish run 30–40% longer.
- **Logical properties, not physical** — `margin-inline-start`, `padding-inline`, `text-align: start`.
  Retrofitting RTL over `left`/`right` touches all 8,536 CSS lines.
- **One number/price formatter**, not `'$' + n`. Doses in mg/mcg/IU are **corpus data, not
  translatable content**.
- **Do not translate corpus content.** Every verbatim is a byte-exact slice of a sealed book (§00.A).
  Chrome is localisable; a Wallach quote is not. **Keep the two visually and structurally distinct so
  the later pass can tell them apart mechanically.**

### Gate status — honest

**The board has 102 gates and not one is an accessibility gate.** Everything above is a **WISH** until
the named gate exists. The three worth building, in cost order:

- **G2 — register `render_probe_reduced_motion.js` on the board.** Near-zero cost. The probe is
  written, has an anti-degenerate check, and guards a hazard that has already fired here. **Cheapest
  win available.**
- **G1 — `tools/probes/render_probe_a11y.js`.** Promote the scratchpad instrument: contrast, type
  size, target geometry, target spacing, accessible names, landmark/heading structure and live
  regions, across every surface, **both themes**, at 320 / 390 / 430px, **plus a 1440px desktop
  control** so a finding that fires equally at 1440 is known to be an app property rather than a
  mobile defect. It **must** ship with a `--selftest` that injects known defects and asserts each
  detector fires — *a detector that has never failed on purpose has not been tested.*
- **G3 — a focus-management probe.** Open each sheet; assert focus moved inside, Tab wraps, the
  background is `inert`, and focus returns to the trigger on **all four** close paths.

**C5 and M3 are labelled WISH permanently** and honestly: whether colour is the only carrier, and
whether a reduced-motion fallback still means the right thing, are human judgements.

---

## Performance budget

★ **The honest limit on every timing below.** A 6× CPU-throttled headless Chrome on a Windows desktop
is a **proxy** for a mid-range Android, not a measurement of one. Throttling models compute; it does
not model a phone's slower memory bandwidth, weaker GPU, slower storage, or thermals. **Treat every
ms figure as relative** — good for ranking surfaces and catching regressions — and re-measure on the
owner's actual phone before declaring any time budget met. UNKNOWN 10.

### Where the weight actually is

`main.js` = **14,108,023 B**. **94.5% of it is inlined JSON**; all TypeScript plus dependencies is
**772,615 B**. Top three inputs — `search-index` (4.33 MB), `corpus-embed` (2.98 MB),
`creators-log-embed` (2.69 MB) — are **70.9% of the bundle, and two of the three are needed by no
workspace's first paint.**

**CSS: 627,082 B across 11 sheets, all render-blocking `<link>`s in `<head>`.**
`drawer-knowledge.css` alone is **208,487 B / 1,015 rules — 33% of all CSS — and it blocks the first
paint of a visit that only ever opens Coverage.**

**Fonts fetched at boot on a 390px viewport landing on Coverage: 7 faces, 480,952 B.** **Unbounded
alone is 260,448 B — 54% of the boot font payload, for a display face.** Playfair ×2 and Crimson Pro
×2 are correctly **not** fetched at boot, which proves the mechanism already works.

**Avatars: 25 PNGs, all 128×128, 760,616 B total, 30,425 B average.**

**OCR: MEASURED lazy.** After navigating to the Scanner and idling, the count of resource entries
whose URL contains `tesseract` was **0**. The engine costs nothing until a scan starts. **This is the
one big thing in the tree that is already right — do not regress it.**

### The budget

| Bytes | Target | Today | Verdict |
|---|---:|---:|---|
| Web critical path (html + CSS + JS + boot fonts), gzip | **≤ 900 KB** | ~1,066 KB | over by 18% |
| Web total first visit, gzip | **≤ 2.0 MB** | ~3.60 MB | over by 80% |
| Local `main.js`, raw | **≤ 12 MB** | 13.45 MiB | `--minify` alone lands 10.73 MiB |
| `main.js` gzip tripwire (`size-limit`) | **tighten 8 MB → 4 MB** | 3.12 MiB | — |
| All CSS gzip (`size-limit`) | **tighten 400 KB → 200 KB** | 126 KiB | — |
| CSS blocking the *first mobile screen*, raw | **≤ 250 KB** | 627 KB | over by 2.5× |
| Fonts for the first mobile screen | **≤ 250 KB** | 481 KB | over by 92% |
| Avatars, each / all 25 | **≤ 8 KB / ≤ 200 KB** | 30.4 KB / 760.6 KB | over by ~3.8× |

| Time (6× CPU) | Target | Today |
|---|---:|---:|
| First contentful paint | ≤ 1,000 ms | 704 local / 836 web — **inside** |
| App interactive | ≤ 1,500 ms | ~1,190 local / ~840 web — **inside** |
| Any tab or route switch, sync | ≤ 200 ms | Conditions 413–466, Products 328 — **over** |
| Any tab or route switch, to painted frame | ≤ 300 ms | Conditions 568, Products 382 — **over** |
| Search keystroke → first result | ≤ 500 ms | **1,524 ms — 3× over** |
| Longest single synchronous task | ≤ 200 ms | Absorption cold 864, Conditions 466 — **over** |

| DOM | Target | Today's worst |
|---|---:|---|
| Nodes per screen at rest | **≤ 1,500** | Search **4,936** · Conditions **3,059** · Products **2,757** |
| Nodes added per scroll page | ≤ 400 | n/a — nothing is incremental today |
| Nodes per list row | **≤ 10** | product ~6.8 OK · condition ~6 OK · **search row ~24 FAIL** |
| Max element depth | ≤ 14 | 12 (Coverage) OK |

**Coverage (609 nodes) and Regimen (406) already pass and need no perf work.**

### ★ The windowing rule

> **A list MUST be windowed or virtualised when BOTH hold: more than 60 rows, AND the rows together
> would put more than 600 nodes in the DOM.**
>
> **One carve-out, permanent: the Coverage field is never windowed.** It is a map of gaps; seeing all
> 90 at once is the feature, and you cannot read a map of gaps through a 20-row window. Its layout
> cost is controlled with `content-visibility` on the category groups instead.

Both halves matter. Rows alone would send 141 cheap Explore chips through a virtualiser for nothing;
nodes alone would exempt a 400-row list of one-node items that is still 400 rows of scroll-position
bookkeeping.

| Surface | Rows | Nodes | Window? |
|---|---:|---:|---|
| Search results | 201 | 4,936 | **yes** |
| Conditions | 510 | 3,059 | **yes** |
| Products catalog | 407 | 2,757 | **yes** |
| Explore chips | 141 | 183 | no — cheap rows, under the node bar |
| ORAC | 33 claims | 1,107 | no — under the row bar |
| Regimen | — | 406 | no |
| **Coverage field** | **91** | **609** | **no — permanent carve-out** |

### The clean slate, and the techniques that fit

**Zero `content-visibility`, zero `contain:`, zero `will-change`, and zero observers anywhere in the
app.** Nothing has to be undone before using them. And **event delegation is already the house
pattern** — 60 listeners across 98 source files, only 1 inside a loop.

Ordered by measured value per unit of risk:

1. **`content-visibility: auto` + `contain-intrinsic-size` on every list row and card.** Zero JS, no
   markup change, and the unsupported fallback is *today's behaviour*, so it cannot break anything.
   It converts the 510-row Conditions list from 3,059 laid-out nodes to roughly one viewport of
   layout work **while the nodes stay in the DOM** — so the existing hide-based drawer filter and
   in-page find keep working untouched. ⚠ **Always pair with `contain-intrinsic-size`** or the
   scrollbar jumps as rows realise.
2. **Do not build the 201 search answer bodies up front.** Render the summary row; build the body on
   first expand and keep it. **This removes 201 bodies and 2,495 gloss spans — the largest single DOM
   win available** — and takes search from ~24 nodes/row to under 10, inside budget with no
   virtualiser at all.
3. **Real windowing only where construction (not layout) is the cost** — the search list after (2),
   if still over. Build rows into a `DocumentFragment` and append once; never row-by-row into a live
   parent.
4. **`contain: layout style paint` on each card/row; `contain: content` on drawer panels.** Cheap,
   invisible, and it stops one card's re-render invalidating the whole drawer.
5. **Keep the one-big-`innerHTML`-string pattern for initial paint** (37 sites today) — it is
   genuinely fast for bulk construction. `DocumentFragment` is for *incremental* appends only.
6. **Codify event delegation: no per-row listener, ever.** Under windowing a per-row listener also
   becomes a *correctness* bug, because rows get recycled.
7. **Passive listeners.** The app's only scroll listener — `views/gloss-tooltip.ts:119` — is
   **capture-phase and non-passive**, and it runs for every scroll container in the app while only
   calling `hide()`. Add `{ passive: true }`. Every new scroll/touch listener is passive by default.
8. **`will-change` is at 0 today — keep it near 0.** Only on an element actively animating, set on
   interaction start and removed on end. **Never in a static rule on a list row**: that promotes every
   row to its own compositor layer and exhausts GPU memory on a phone faster than anything else here.
9. **`backdrop-filter`: at most one visible at a time, never on a scrolling element.**
10. **Keep `#ds-filter-rough` (feTurbulence + feDisplacementMap) off every list.** Fine on a single
    pull-quote; ruinous across rows. Zero `<mark>` elements were live on any measured surface, so it
    costs nothing today.
11. **Avatars** — add explicit `width`/`height` (kills layout shift in the picker) and
    `decoding="async"`; `loading="lazy"` is already set. Re-encoding to WebP needs no network and no
    library, so offline-first is unaffected — but the ~200 KB target is an **ESTIMATE** from typical
    encoder behaviour, not a measurement. UNKNOWN 13.
12. **Fonts** — Unbounded is 260 KB of the 481 KB boot payload. Either subset it to the glyphs the
    display copy actually uses, or give it `font-display: swap` so first paint uses the fallback.
13. **Turn on `--minify` in `tools/build.mjs`.** `tools/build.mjs` **never passes `--minify`.**
    Measured minified: **11,250,342 B — −2,857,648 B (−20.3%)**. The `file://` build is served
    uncompressed, so **this is the only compression it will ever get**, and the sourcemap is already
    emitted for debugging.
14. **Split the CSS by route.** 208 KB of `drawer-knowledge.css` render-blocks a Coverage-only visit.
15. **Move `creators-log-embed` out of the boot prefetch** (`main.ts:524`) to fetch-on-open.
    **−1.00 MB gzip from every web first visit, and no workspace reads it.** The single largest byte
    lever available, and it is not the bundle.

### ⚠ Two counter-findings, recorded so nobody optimises in the wrong direction

1. **Do NOT convert the inlined JSON to `JSON.parse`.** The standard advice is that `JSON.parse` beats
   an equivalent object literal. **Measured on this payload it is the opposite at every throttle
   level** — 282 ms vs 413 ms to DCL at 6×, 204 vs 318 at 4×, 126 vs 158 at 1× — and literals are
   *also* smaller gzipped (2,827,447 vs 2,910,387), because the string form escapes every quote.
   (If only *execution* is timed, starting the clock after V8 has already parsed the script, literals
   look 3× faster still. That framing is misleading; the end-to-end figure is the one that matters.)
2. **Do not carry the Merriweather commit's 8.73 MB into a mobile-load story.** It is **verified as
   arithmetic** — `a9b0513b` removes exactly 9,159,580 B of `.ttf` — but it is a **repo/GitHub-download
   saving**, not a first-paint saving, and the commit itself says so.

### Gate it, or label it WISH

**There is no perf or size gate on the 102-gate board.** The only guard is `size-limit`, at 2.6×/3.2×
headroom — loose enough that a mobile rewrite could double the CSS and add a megabyte of JS without
tripping anything.

- **Can be gated — propose `mobile_perf_budget`.** A headless probe at 390×844 that walks every
  surface plus one search and asserts the DOM node counts and the windowing rule (row count vs live
  node count), plus a byte assertion over `dist-web/` for the critical path. Its `anchor_class` is
  **`consistency`** — it compares our DOM to our own budget and says nothing about whether the design
  is good.
- **Can be gated cheaply — tighten the two `size-limit` entries** to 4 MB / 200 KB in the same patch.
  No new machinery.
- **Cannot be gated — label WISH, do not sell as safe: every millisecond figure.** Frame timing and
  interaction latency are device-and-thermal dependent; a CI number would be a number about this
  desktop. The honest version is a repeatable manual measurement on his phone at the end of each
  mobile chunk, recorded in the chronicle.

---

## Teardown

**Subject:** branch `mobile-responsive` — 6 commits, unmerged, unpushed, **523 lines** of
`mobile.css` — to be deleted as code and mined as a bug report.

⚠ **Two stale facts in the handoff, corrected.** `chronicle/next-chunk.md` says the branch is "current
with master" (merge-base is `79bed8b9`, master is `ea7a792d` — it is **one commit behind**) and calls
`mobile.css` "620 lines" (it is **523**; 620 was true before `1e5adb1e` deleted two unchosen nav
shells). **Read the file, not the handoff.**

### ★ Three things on that branch are real source fixes, and master still ships the defects

Discarding the branch wholesale loses these. **Land them on master first, as their own small commit,
before any redesign work.** Cherry-picking is not clean — they are mixed into `0c0aa575` with the
layer — so re-apply by hand from the diff.

| file | what to keep |
|---|---|
| `dashboard.css` | the `@media (max-width:560px)` correction. **Master still hides `.topbar__breadcrumb`, so on a phone today nothing on screen names the current workspace.** |
| `workspace-coverage.css` | the responsive block **relocation**. Master's `@media (max-width:1160px) { .coverage-grid … }` at line 787 is **inert** — outranked by `.cov-d .coverage-grid` at ~1111. ⚠ Raising the selector is **not** enough: at equal specificity the later rule wins, so **the block's position below line 1111 is the fix**, and the comment saying so must travel with it or the next tidy-up moves it back. |
| `main.ts` | `wireBackGesture()` / `syncOverlayHistory()` / `closeTopOverlay()` — **without it, Back from inside a full-screen overlay exits the site**, and by the time the user notices they are already gone. One history entry total, guarded so an engine without `pushState` degrades rather than throwing. Verified working on a `file://` origin. |

⚠ **Caveat on the coverage relocation:** the branch *deliberately leaves* the `@media (max-width:640px)`
tile-track block inert, with a stated reason — reviving it gives 58px tiles (under the touch floor
once padding is removed) **and** a fractional fill that wrecks the ring. **Moving or "fixing" that
block during teardown is a regression twice over.**

### What gets deleted

| path | lines | note |
|---|---:|---|
| `dashboard/assets/styles/mobile.css` | 523 | the layer itself |
| `tools/probes/render_probe_mobile.js` | 268 | asserts the retrofit's floor on 6 surfaces |
| `tools/probes/mobile_audit.js` | 582 | the 8-viewport measuring instrument |
| `tools/probes/mobile_css_scan.js` | 300 | static scan: hover-to-reveal, inert media queries, 100vh |
| `chronicle/mobile-followups.md` | 143 | the parked to-do list |

**But do not delete them blind — three carry method that outlives the design:**

- **`mobile_audit.js` should be RE-POINTED, not deleted.** Its value is the **1440px CONTROL in the
  matrix**: a finding that fires equally at 1440 is a property of the app, not a mobile defect, and
  **the delta is the signal**. It also has a `--selftest` that injects four known defects into a
  clean page and asserts each detector fires — that negative-control design is the reusable asset.
  Its viewport matrix — **320 / 360 / 375 / 390 / 430 / 768 / 667-landscape / 1440-control** — is the
  device contract for the new design.
- **`mobile_css_scan.js`'s three detectors are design-independent**: hover-to-reveal controls, inert
  media queries, and `100vh`. All three will be just as true of a new sheet. ⚠ Its header names
  `mobile_css_scan.selftest.js` as the file that drives its fixtures; **that self-test was never
  committed.** If the scanner is salvaged, the self-test must be written, not assumed to exist.
- **`render_probe_mobile.js`'s header is the honest bit** — *"WHAT IT CANNOT PROVE. That any of it
  looks right."* It documents its own negative control against the pre-layer build. A new mobile
  probe should inherit both properties and none of the selectors.
- **`mobile-followups.md` holds items the redesign does NOT close** — re-home them before deleting.

`dashboard/dashboard.html` is a **rewrite**: remove `data-mobile-nav="bar"`, the `mobile.css` link,
and (after a grep confirms no reader — UNKNOWN 14) `id="appRail"`. ⚠ **Also fix the stale count:** the
header comment says *"It links the 11 stylesheets below"*; the branch shipped **12** and never
updated the sentence. Master is currently correct at 11 — **any new sheet must update it in the same
patch**, because §00.B calls a comment out of sync with its code a defect worse than no comment.

The Creator's Log and build log are **git-anchored append-only**. The branch's entries describing the
retrofit are permanent. **The correct move is a new entry recording the reversal, never an edit** —
and a log append requires a regen + rebuild in the same patch or four sync gates go amber.

### The requirements mined out of the retrofit — the real deliverable

The override code is disposable; these are what the new design must still answer.

1. **The height model.** Seven live `vh` sites on master (`dashboard.css:55` `.app-shell` `100vh`;
   `:215` `.pf-panel`; `drawer-search.css:84` `.scr`; `workspace-coverage.css:1132` `.wc` `90vh` and
   `:1170` `.rail-list`; `workspace-regimen.css:467` `.rc-pop`; `workspace-scanner.css:443`). ⚠ A
   `max-height` written against `100vh` is the same bug wearing a hat — **the cap is bigger than the
   screen.** **No phone surface may size against `vh`.** If any of those seven survives, it becomes
   `dvh`/`svh` **at source**, not shadowed from a later sheet.
2. **The document cannot scroll today.** `dashboard.css:24` **and** `workspace-coverage.css:77` both
   declare `html, body { height: 100%; overflow: hidden }`. If the mobile design wants a natively
   scrolling document — which most modern phone apps do — **that is a change at source in two files**,
   and it interacts with the scroll-lock hook (below).
3. **The type scale must be its own, not a shadow.** The retrofit could only *shadow* the sealed
   `design-system.css` from a later sheet, and that load-order dependency is why the layer was
   fragile. **Decide up front** whether the mobile scale is (a) new tokens in the sealed sheet —
   needs the owner's re-seal, **ask every time** — (b) a mobile layer that *defines* rather than
   overrides, or (c) fluid tokens correct at both ends. ⚠ Option (b) reproduces the same cascade
   fragility; note that before choosing it.
4. **The phone navigation is designed, with its own markup.** The retrofit's `display: contents` and
   `html[data-mobile-nav="bar"]` existed **only** to avoid a markup change and to raise specificity
   from (0,1,0) to (0,2,1). **Both are cascade crutches, not design decisions.** Keep the *contract* —
   safe-area insets reserved by every full-screen overlay, and **no state may bury the control that
   leaves it** — and drop the mechanism.
5. **The fluid-card pattern is what actually survives a phone.** The search drawer, profile and
   arrival veil work because each is a **centred max-width card** (`width: min(600px, 100%)`) rather
   than a fixed-width panel. **That single pattern is the difference between what works and what does
   not.** Carry it, plus the rule that a screen's primary action is **visible without scrolling**,
   not merely reachable.
6. **Hard-coded desktop widths.** **61** `white-space: nowrap` declarations and **13** fixed
   `width: NNNpx` declarations, several over the 320px floor: `drawer-knowledge.css:22` **950px**,
   `workspace-regimen.css:467` **700px**, `design-system.css:808` 320px, `drawer-orac.css:26` 292px.
   Plus `drawer-shared.css:23` pinning **every drawer to `left: 220px`** — the desktop rail width,
   wrong even at the 60px icon rail. At 375px that put the Knowledge drawer **575px wider than the
   viewport, its far edge 795px off-screen, with 104 interactive elements entirely outside the
   world.** Each is a desktop assumption the new design replaces or scopes away.
7. **★ Almost all of the retrofit's `@media (pointer: coarse)` section is a device-capability
   contract, not a retrofit, and should be re-authored into the new design** — it is scoped to the
   *input device*, not a width. The 16px input floor and the pull-to-refresh suppression in
   particular are **correctness issues, not styling**.
8. **320px is the declared floor**, 375px the primary target.
9. **Integer tile tracks** — see the note at the end of The real data shapes.

### Invariant gates at risk

`tools/invariants.py` registers **102** gates. `.claude/invariant-baseline.json` is **empty by
design** — there is no tolerance to lean on.

**Will go RED unless handled in the same patch:**

- **`workspace_coverage_no_dead_rules`** *(critical)* — ★ **the highest-probability red in this whole
  teardown.** Every class selector in `workspace-coverage.css` must trace to a live reference. Its
  allowlist holds exactly **one** entry. **A mobile-first Coverage that stops emitting a desktop class
  turns that rule dead and REDs the gate.** Plan each CSS deletion into the same patch as the markup
  change, never after.
- **`board_claims_match_reality`** *(critical)* — CLAUDE.md's "102 gates" and "24 anchored outside"
  must match the registry. **Registering or retiring a mobile gate requires editing CLAUDE.md in the
  same commit.** A reworded claim is RED, never a silent pass.
- **`charter_gates_present`** *(meta)* — renaming or removing a gate requires editing the R1–R9 table
  in the Charter skill in the same patch.
- **`no_new_dead_code`** *(critical, knip)* — **any new mobile TS module not reachable from `main.ts`
  is RED**, and any desktop module orphaned by the redesign is RED. The 45-entry baseline "may only
  SHRINK" and has no generator — regenerating it is a hand step.
- **`no_stub_render_paths`** *(critical)* — scans `views/*.ts` **and `styles/*.css`** for scaffold
  tokens including the literal word **`PROTOTYPE`**. **A mobile sheet whose comment says "PROTOTYPE"
  REDs the board.** Very easy to trip while prototyping — know it before you write the comment.
- **`css_comment_no_premature_close`** *(critical)* — a `*/` inside a comment body silently drops the
  next rule. **It has happened here** (a token glob in `theme.css` dropped `.rr-btn--danger`, board
  green throughout). Any new sheet with heavy commentary — and this codebase writes heavy commentary
  — is exposed.
- **`no_external_style_resources`** + **`offline_no_runtime_network`** + **`vendor_assets_pinned`**
  *(all critical)* — all glob `styles/*.css`, so **any new sheet is automatically in scope**. No
  Google Fonts, no CDN, no remote `@import` or `url()`. The CSP in `dashboard.html:29` is
  `default-src 'self'` with no external origin permitted at all.
- **`fonts_declared_and_shipped`** *(critical)* — bidirectional. If the mobile design drops a face,
  the file goes in the same patch; if it adds one, the file must land.
- **`design_system_hash_integrity` + `design_system_write_protection`** *(both critical)* — if the
  mobile type scale is done by **editing** `design-system.css`, both go red until the owner re-seals.
  ⚠ **Re-sealing is USER-ONLY and permission never carries forward — ask every time.** This pair is
  exactly why the old layer had to shadow tokens from a later sheet.

**★ Under-covers SILENTLY — worse than a red, because nothing fires:**

- **`_CLEAN_VIEW_FILES` (`tools/invariants.py:7323`)** drives `views_no_inline_prose`.
- **`_ENTITY_VIEW_FILES` (`:7335`)** drives `entity_render_is_projection`,
  `view_category_not_hardcoded`, and the view half of `no_positional_hero`.

Both are **hardcoded tuples**. **Any mobile view file must be added to the right tuple in the same
patch that creates it. Nothing will remind you and nothing will fail.** Same shape:
`workspace_coverage_no_dead_rules` covers exactly one stylesheet, so **dead-rule liveness in a new
mobile sheet is ungated** unless the gate is generalised — and that gate exists because a "clean" app
was carrying 51 dead class rules across two superseded UI generations that **knip could not see,
because knip is blind to CSS**.

**★ The scroll-lock guard is a HOOK, not an invariant.** `tools/hooks/post_write_verify.py` fires on
every `safe_write` of an `.html`: if the file links `dashboard/assets/styles/*.css` and has no
`html,body{…overflow: auto|visible|scroll}`, it **exits 2 and blocks the write**. Two consequences:
(1) its premise cites `dashboard.css:24` and `workspace-coverage.css:77` by line — **if the redesign
changes either, re-read the hook first**; (2) **every mobile prototype written into
`chronicle/mobile-redesign/prototypes/` as `.html` will be blocked unless it carries the unlock**
(the `!important` unlock in the page's own `<style>` after the `<link>`s), then
`node tools/mockup_measure.js <path>` for the rendered proof. ⚠ **`window.scrollTo()` is not the
test** — it succeeds on a provably locked page — and neither is `fullPage:true`. `overflow-x: hidden`
does not unlock scroll. **This defect has recurred six times and the instruments kept sharing its
blind spot.**

Also live: `tools/tests/test_shared_rl_rules_scoped.py` — no guest sheet may declare a bare rule for a
shared `.rl-` class. **A new mobile sheet that loads after the workspace sheets is exactly the shape
that re-creates this**, and its inverse is just as real: an *over*-scoped rule ships an unstyled
control that **no existence check can see** — the check that binds is a cross-surface comparison of
*computed style*, not "does the element exist".

### Build tooling — what needs editing

| tool | needs? |
|---|---|
| `tools/build.mjs` | **Nothing for CSS.** It typechecks and bundles TS and **never touches CSS**. New TS flows through automatically, but `tsc` must pass and knip must be clean. |
| `tools/build_web.py` | **Nothing** — it globs `assets/styles/*.css`, content-hashes every sheet it finds and rewrites the `<link>` hrefs. ⚠ Remember *why* the content-hashing exists: a SiteGround **proxy cache served a stale corpus**. |
| `tools/build_demo_singlefile.mjs` | **Nothing structural** — it regexes the `<link>`s out of `dashboard.html` and inlines whatever it finds. **Keep this tool: it is the review loop.** |
| `dashboard/dashboard.html` | Yes — see the rewrite above. |

### What still binds, and what is re-opened

`chronicle/decisions/2026-08-22-mobile-total-reimagining.md` is explicit and **BINDING**: decisions
taken on the retrofit branch were made *inside* the retrofit frame and **no longer bind
automatically**. Each must be re-earned.

**RE-OPENED** (⚠ `next-chunk.md` lists these as "do not re-litigate" — **that line is superseded**):

1. **"The bottom tab bar is the shell."** He chose it from three built side by side — but **all three
   were `display: contents` re-arrangements of the desktop rail.** He chose the best of three
   retrofits, not the best phone navigation.
2. **"Search is deliberately NOT a tab."** The argument was that a sixth target would squeeze every
   other under 62px — **but that constraint was created by the five-across bar.** With a new shell
   the arithmetic changes. (See the iOS 26 `search` role pattern in Reference patterns.)
3. **`html[data-mobile-nav="bar"]`** — a pure cascade crutch. **Dies with the layer**, and the
   redesign should be architected so nothing like it is ever needed.
4. **"Wrap the Knowledge tabs, do not signpost."** A local answer to "six desktop tabs in a phone
   header". **Re-open one level up: what *is* Knowledge on a phone?**
5. **The 0.52rem / 0.46rem tab labels.** Below the layer's own floor. **Do not carry forward.**

**STILL BINDS:** §00.A Wallach is the only source of amounts · offline-first from `file://`, no
runtime network for the local build, no service worker, no CDN · vanilla TS + hand-written CSS, no
framework · no emojis · category colours fixed · Coverage is a map of gaps, never a score, never
gamified · cream default, dark toggle · wholesale is the featured price · **total feature
preservation is the one condition — the inventory is the contract, and anything not in it can be
silently lost.**

**MEASURED FACTS THAT SURVIVE THE FRAME CHANGE — physics, not taste:**

- **`.app-shell` is `overflow: hidden`, so document overflow is structurally 0 everywhere.** ⚠ **A
  zero is not a clean layout: content that does not fit is clipped away, and the pixels that would
  prove the defect are never painted.** `clipped` and `offscreen` carry the signal; `protruding` and
  `docOverflow` understate it.
- **`window.innerWidth` is the VISUAL viewport under emulation and expands to the content width on
  overflow** — it read **901 in a 375px viewport**. Use `document.documentElement.clientWidth`.
- **At equal specificity, source order decides.** Raising a selector is not a fix.
- **A fixture with no viewport meta makes Chrome emulate 980px.**
- **The rail nav button is a TOGGLE** — re-clicking it "to make sure" closes the drawer, and a walk
  then scans the same surface N times and reads as evidence.
- **★ Count the boxes and you will ship clipped text.** Row count said the 3-across Knowledge tabs
  fit; `scrollWidth − clientWidth` **per tab** then found 51px of label spilling out of three pills.
  **A layout check that counts boxes and never asks whether the words fit will ship clipped labels
  and call it a pass.**
- **★ A green gate proves reachability, never taste.** 102/102 and 6/6 surfaces PASS, and the verdict
  was still "not a proper mobile app."

### Branch strategy

1. **Do not delete `mobile-responsive`** — it is the only record of the measurements and it is
   unpushed, so keeping it costs nothing. **Tag it:** `git tag mobile-retrofit-archive mobile-responsive`.
2. **Land the salvage on master first**, as its own small commit.
3. **New branch off master: `mobile-native`** — a name that does not read as a responsive retrofit.
4. **Build it in a `git worktree`, not by switching branches.** Master is the surface the probes and
   the demo builder run against, and switching branches under a running probe is how a stale artifact
   gets shipped. `.claude/worktrees/` is **already gitignored**:
   `git worktree add .claude/worktrees/mobile-native -b mobile-native master`
5. **`node_modules` must be a junction, not a copy** — 259 MB + 28 MB. ⚠ **From PowerShell, not
   bash** (`cmd //c mklink` fails from bash on this host): `New-Item -ItemType Junction -Path … -Target …`,
   quoting every path (the repo path contains a space).
6. **Run the board in the worktree before the first design commit** to establish its baseline. ⚠ **A
   worktree's board is weaker than the main tree's, not equal** — `eden/corpus/books/*.txt` are
   gitignored, so the book-anchored gates skip with a stated reason. `next-chunk.md`, `dist-web/`,
   `temporary/` and `engine/` are all gitignored and will be absent. **Line endings vary per file** —
   run `python tools/safe_write.py check <path>` before writing.
7. **Do not merge to master until he has looked at a build on a phone.** The decision file is
   terminal on this: *"Every chunk of this redesign ends at his eyes on a device — not at a passing
   probe."*

**Sequence the demolition so the board never goes red:** salvage commit → branch/worktree/baseline →
**one commit** that removes the link, the attribute and the sheet **and** updates the "11 stylesheets"
sentence (removing the sheet without the link, or the link without the sentence, is a half-cut) →
delete or re-point the probes → re-home the open items → rebuild and re-run the board → **then** start
designing.

### Open items to re-home before `mobile-followups.md` is deleted

Not closed by the redesign; **each is his call, not ours**:

- **The Scanner has no camera path.** `capture="environment"` on the file input opens the rear camera.
  One attribute, deliberately not added because it changes the scan flow's primary action.
- **~16.9 MB OCR model over cellular** with no consent screen or progress UI before the download
  starts.
- **Copy that assumes a mouse.** Coverage says *"HOVER A GOAL TO FOCUS IT"*; the Scanner says
  *"or drop / paste an image here"*. Invisible to every automated check; he reviews copy every time.
- **Search with a real on-screen keyboard up** — the one blocker neither confirmed nor cleared.
- **Fourteen 10×10 colour swatches in one row** in the regimen slot tray.
- **Font subsetting: 481 KB of first load.**
- **"Issues especially on the other tabs" — his words.** Every Knowledge sub-tab (Absorption, ORAC,
  Conditions, Explore, Products) must be **driven by hand and looked at**; none was opened during the
  original pass.

---

## The review loop

> A phone surface is not shipped until he has looked at it on a phone. **The review loop is part of
> the deliverable, not an afterthought to it.**

### The exact commands

| command | wall clock | typechecks? | output | phone-reviewable |
|---|---:|---|---|---|
| `node tools/build.mjs` | **6.9 s** | **yes** (`tsc --noEmit`) | `dist/main.js` | no |
| `node tools/build_demo_singlefile.mjs <ABSOLUTE-OUT>.html --artifact` | **0.53 s** | no | `<out>.html` + `<out>.artifact.html`, 15.32 MiB each | **yes** |
| `PYTHONUTF8=1 python tools/build_web.py` | **5.5 s** | no | `dist-web/` — 34.38 MB, 63 files | **yes, after an upload** |

★ **Sequencing fact that saves time and can cost correctness.** Neither the demo builder nor the web
builder reads `dist/main.js` — both invoke esbuild on `main.ts` directly. So you do **not** need
`build.mjs` first, but **`build.mjs` is the only one of the three that runs `tsc --noEmit`. A type
error therefore reaches a review build silently.** Run it before publishing anything he will look at;
it is 6.9 s and it is the only typecheck in the loop.

**Full honest cost of one artifact review build: ~7.5 s of compute.** That is the point — **rejection
has to be cheap**, and at 7.5 s it is.

⚠ **The demo builder lives only on `mobile-responsive`.** It is not on `master`. Whatever branch the
redesign lands on must carry it.

### The artifact loop, precisely

Live target: `https://claude.ai/code/artifact/7c8a1858-7f04-4e2e-a7d4-9bf0f9cce92b` — **private**.

1. Check out the branch in a worktree; junction `node_modules` from PowerShell.
2. `node tools/build.mjs` — the typecheck gate.
3. `node tools/build_demo_singlefile.mjs <ABSOLUTE-OUT>.html --artifact`.
   ⚠ **Use an absolute path outside the repo.** The builder's default is `tmp-demo/…` and
   **`tmp-demo/` is not gitignored** (verified: `git check-ignore -v` exits 1) — the default drops a
   ~15 MB untracked file into the working tree.
4. **Publish `<out>.artifact.html` passing the existing `url`.** ★ **Publishing to the same URL
   redeploys in place and his link keeps working. Publishing without `url` mints a new artifact and
   silently strands him on the old one.**
5. **Send the link with the exact tap path** for what changed. Never "have a look".

**Things that will bite:**

- **Size, and it is tighter than it reads.** The published `.artifact.html` is **16,064,627 B**
  against a 16 MiB ceiling of 16,777,216 — **712,589 B / 4.2% headroom.** ⚠ Two problems: **the
  builder's guard weighs the wrong file** (it checks the 16,064,095 B *document*, never the
  532-byte-larger `.artifact.html` it publishes); and **whether the host's "16 MB" is MiB or MB is
  undetermined** — if decimal, the current artifact is already **64,627 B over**. UNKNOWN 2.
  **The 712 KB is a budget, not a cushion: the app's data grows every round**, and master's data is
  already 11,282 B heavier than the branch's.
- **The artifact form is a *third* form, not the app.** `--artifact` strips the CSP, viewport,
  charset and `<title>` metas, then **re-installs the viewport and every `<html>` attribute from a JS
  shim that runs before anything else parses.** Theme, accent and the nav shell are all selected off
  `<html>` attributes, so **that shim is load-bearing** — it was added because stripping the wrapper
  rendered the app **with no nav shell at all** while every other check passed. **Treat any
  difference from `file://` behaviour as suspect-the-shim first.**
- **Housekeeping.** The gallery name is currently the filename fallback `codex-mobile-demo.artifact`
  (the builder deliberately strips `<title>` so a review build is not mistaken for the product) — fix
  it by passing an explicit `title` at publish time, not by putting the title back in the file. And
  ⚠ **a second, stale mobile artifact exists in his gallery** — *Codex Goes Mobile*
  (`98d8ca16-…`, 2026-08-21). **He can open the wrong one.** Retire or re-title it before the next
  round.
- ⚠ **Never republish while he is on it.** Standing rule. Ask, or wait for his answer on the current
  batch, before pushing batch N+1 to the same URL.

### The demo's two honest absences — one of which is currently described wrongly

**(a) The Creator's Log — the demo does not lie about a count, it hides the surface.**

The builder header, `next-chunk.md` and the build log all state the symptom as "the profile modal
claims 0 entries". **That is not what the code does.** `views/profile.ts:134-140` returns `''` when
the log is empty, so with the log stubbed to `[]` **the entire `<details class="pf-log">` block is
absent. He sees no Creator's Log at all.**

That is **worse** for a review build, not better: **a silently missing surface cannot be reviewed,
and its absence is indistinguishable from a design decision he might otherwise object to.**

Real figures: **931 entries, 2,674,470 B.** Including it puts the artifact at ~18.7 MB — **~2.0 MB
over. That is arithmetic, not a judgement.**

**Proposed fix, both halves.** (1) Ship the newest entries to a **byte budget, not an entry count** —
the mean entry is 2,873 B but the distribution is violently skewed toward multi-kilobyte recent
entries, so a fixed count would blow the budget on a bad day. Spend **400 KB → roughly 140 recent
entries**, which gives him a genuinely long, genuinely scrolling list — exactly what has to be
reviewed on a phone. (2) **Say so on the surface:** a footer row inside the `<details>` reading
*"Showing 140 of 931 — review build."* ⚠ **Implement it in the builder, not in app source** — the
existing `stubLog` esbuild plugin already intercepts the file; make it emit a truncated array plus a
marker the demo-only DOM shim reads. **No demo-only branch enters `views/profile.ts`.**

**(b) The OCR engine — inclusion is impossible, and the current failure message lies.**

Minimum http-path set: `eng.traineddata.gz` 12,821,300 + `tesseract-core-simd-lstm.wasm.js` 3,938,657
+ `worker.min.js` 123,724 + `tesseract.min.js` 66,695 = **16,950,376 B raw ≈ 22.6 MB as base64**,
against a page already at 15.32 MiB. **The minimum engine alone exceeds the whole page budget before
the app is added.**

**★ And the failure it produces today tells him his photo was bad.** Traced: `ocr.ts:305` sees
`protocol !== 'file:'` → `assertModelReachable()` at `:277-290` does `await fetch(TRAINEDDATA_URL)`
inside a `try` and **only a throw is caught, so a 404 resolves and `modelReachable = true`** →
`loadTesseract()` at `:121-139` injects the absent script, `onerror` fires, and it rejects with a
**developer** message → `scanner.ts:149-157` matches neither known error code and falls through to
**"Something went wrong while reading that image. Try a clearer photo, or scan again."**

**He re-shoots, it fails again, and he concludes the Scanner is broken — a rejection aimed at a defect
that does not exist in the real app. Given he has already called the Scanner "scuffed", this is the
single most expensive thing in the current loop.**

**Proposed fix, both halves.** (1) **A builder shim that disables the photo path and names the
reason**, in the demo build only: *"Photo scanning is off in this review build — the 16.9 MB OCR
engine was stripped to fit. Paste or type a label instead."* ~300 bytes, and it reviews what actually
matters on the Scanner — layout, the paste path, the verdict engine — **without a false statement.**
(2) **Route the photo-scan review to the web build**, where OCR genuinely works: the 2026-08-21 build
log records the live model returning 200 with `Content-Encoding` absent and gzip magic intact.

⚠ Caveat (UNKNOWN 3): I did not drive the artifact host to confirm it 404s an unknown relative path.
If it answers 200 with the artifact shell, the `<script>` loads HTML as JS and throws a syntax error
instead — **different route, same lying end state**, so the fix holds either way.

### Artifact vs web build — split by surface

| | demo artifact | web build |
|---|---|---|
| privacy | **private**, unlisted | **public — reviewing there publishes the work** |
| rebuild → in his hands | **~7.5 s** + one publish | ~12.4 s + a **manual upload** of 34.38 MB / 63 files |
| first load | **15.32 MiB every time** — one blob, nothing cacheable by part | **2.72 MB raw**; measured **0.92 MB on the wire** live, brotli |
| Scanner photo path | **impossible** | **works — verified on the live host** |
| Creator's Log | truncated at best | **real** — a content-hashed split artifact, 958 KB |
| fidelity | a **third** form (host shell, metas stripped and re-installed by a shim) | **one of the two real distributions — what he reviews is what ships** |

**Recommendation: the artifact for everything except the Scanner photo path and the full Creator's
Log** — private, 7.5 s, and rejection stays cheap, which is the property the loop is designed around.
**The web build only** once publishing is fine, or via a staging path he approves (UNKNOWN 15), and
specifically for the photo-scan step.

⚠ **The three SiteGround traps**, if the web build becomes a review vehicle:
**(1) NGINX Direct Delivery** — SiteGround fronts Apache with NGINX and by default serves static
files **bypassing `.htaccess` entirely**, so every rule silently does nothing and `index.html`
returns a 180-day `max-age`, pinning a returning visitor to one build for six months and defeating
the content-hashing outright. **It is a host setting, and a host setting can revert without touching
this repo.**
**(2) The `.gz` trap** — tesseract fetches `eng.traineddata.gz` and gunzips it **itself**; if the host
tags the response `Content-Encoding: gzip` the browser gunzips in transit and tesseract fails on
already-plain data. **The Scanner breaks on the web only, and the download looks fine.** ⚠ Check the
**decoded** body, not raw wire bytes — the first draft of this check read the raw stream and **passed
cheerfully on exactly the failure it existed to catch.**
**(3) The proxy cache** — on 2026-08-22 the live site read 2,611 sourced claims where the build read
2,601: a fresh bundle hydrating from the *previous* deploy's split artifacts, with no error anywhere.
⚠ **`fetch(url, {cache:'reload'})` and `{cache:'no-store'}` both still returned `x-proxy-cache: HIT`**
— those govern the *browser's* cache, not an upstream proxy's object store. Now fixed by
content-hashing the split artifacts.

**Two probes bracket a deploy:** `render_probe_web_build.js` **before** upload (13 checks, serving
`dist-web/` over a real http server), `render_probe_live_host.js` **after** (33 checks, every header
assertion parsed out of the `HTACCESS` template rather than retyped). ⚠ Neither can be an invariant —
a gate reaching a third-party host would make the board's colour depend on SiteGround and on whether
this machine has wifi.

### The review script

**The rules it is built on:**

1. **Small batches, his review every time** — the direct lesson of 2026-08-22, where six surfaces
   were handed over at once and came back as one undifferentiated *"none of this feels like a proper
   mobile app"*. **A batch that big cannot be diagnosed.**
2. **One question per step**, answerable in a sentence.
3. **Never ask "does this look good?"** Ask about the specific thing this batch changed.
4. **Phrase it so "no" is cheap.** A rejection that costs him a paragraph will arrive late or not at
   all.
5. **Give him the tap path.** Never "have a look".
6. **One URL, forever.** Batch N+1 republishes over batch N.
7. **Pre-flight is mine, not his:** `build.mjs` clean, the probe green, **and screenshots at 375×667
   and 393×852 that I have actually looked at.** ⚠ A DOM probe is not a visual check — **and a green
   probe is what produced the rejection we are recovering from.**

**The ordered list.** Shell first, because everything sits inside it. Then Coverage — the one surface
he did **not** name — because establishing the bar on a surface he tolerates is the cheapest place to
find out whether the new design language lands at all. Then the three he named.

| # | what goes in front of him | the one question |
|---|---|---|
| 0 | *(no human)* build + typecheck + probe + screenshots I have read | — |
| 1 | **The shell alone.** Nav, topbar, one placeholder screen. | "Tap between every destination. Does moving around this app feel right for a phone — yes, or what's wrong?" |
| 2 | **Coverage**, one surface, complete. | "Can you read this at arm's length and tell what you're missing?" |
| 3 | **Regimen.** | "You called this scuffed. Is it still?" |
| 4 | **Scanner — paste/type path only**, with the OCR shim in place. | "Photo scanning is off in this build and it says so. Everything else — is the flow from label to verdict right?" |
| 5 | **Scanner — the photo path**, on the web build or approved staging. | "Point your camera at a real label. Does it work, and how long did the wait feel?" |
| 6 | **Knowledge — home + explore.** | "You called this cheap and poorly thought out. What specifically is cheap about it now?" |
| 7 | **Knowledge — the deep surfaces**, across ≥2 batches: (a) entity + topic, (b) foods + food-sheet + ORAC, (c) products + corpus. | per batch: "Anything here that still reads as an afterthought?" |
| 8 | **Search / Ask Wallach, with a real on-screen keyboard up.** | "With the keyboard up, type a question. How much of the answer can you see without dismissing the keyboard?" |
| 9 | **Profile, theme, accent** — including the Creator's Log at whatever truncation ships. | "Does the log read like a real feature here, or like a list that got squeezed in?" |
| 10 | **The whole app, end to end, one sitting, on cellular if he'll do it.** | "Does this feel like a proper mobile app now?" |

**Notes on specific steps.** **Step 6 is deliberately open** — "cheap" is the one verdict we have no
diagnosis for, and a closed question there would just get a yes/no about a theory of mine. **Steps 3
and 6 quote his own words back**, so he can say "no, that's fixed, but X" instead of re-issuing the
same global verdict. **Step 8 needs hardware and nothing on this machine can clear it** — it must be
a numbered step or it will be missed again. **Step 10's question is his rejection sentence, and it
should be the acceptance sentence** — asking it earlier invites a global verdict on a partial app,
which is exactly what went wrong.

**The standing instruction to send with batch 1:**

> One word is enough. Name the surface and what's wrong with it — "regimen, cramped" is a complete
> answer and more useful than a paragraph. If it's fine, "fine" is a complete answer too.

### Capturing his verdict so it survives

★ **The trap: `chronicle/next-chunk.md` is gitignored.** *"Regenerated locally each session."* **A
verdict recorded only there does not exist in the repository** — it lives on one machine until the
next session overwrites the file. The 2026-08-22 verdict survived only because it was written to
**three** places, two of them committed.

**Per review step:** paste his words **byte-exact into a committed file** —
`chronicle/mobile-redesign/verdicts/<date>-<step-slug>.md`, append-only, one block per round,
containing: the artifact URL **and the sha256 of the published `.artifact.html`** (so the words
attach to a specific build, not to "the demo"); **the question asked, verbatim** (a verdict without
its question is un-interpretable); **his answer, verbatim, in a blockquote, with no paraphrase in the
same block**; a **separately headed section for inference, explicitly labelled as inference**; and the
disposition. Route the write through `safe_write.py append`. `next-chunk.md` carries a **pointer** to
that file, never the only copy. A rejection that changes the direction of the work gets its own
`chronicle/decisions/` doc, as 2026-08-22 did.

⚠ *The `verdicts/` directory is a proposal* — the decision doc lists inventory / ia / surfaces /
system / groundwork and does not name it. Confirm rather than assume.

Why verbatim, in the project's own words: *"Recorded verbatim because a paraphrase would soften it,
and the point is that it should not be softened."*

### Defects found while mapping the loop — checkable, none fixed here

1. **`tmp-demo/` is not gitignored.**
2. **The demo builder's 16 MB guard weighs the wrong file.**
3. **`build_demo_singlefile.mjs`'s own header says it "is not committed". It is.**
4. **The retracted font claim still stands in `tools/build_web.py:36-37`** — *"exactly 7 of the 13
   faces… the other 6 (Merriweather ×2, Playfair ×2, Crimson Pro ×2) are never requested"*. Both
   halves are false now: the directory holds **11** `.ttf` and the Playfair half was explicitly
   retracted. ⚠ **The build-log entry that retracted it claims "all four homes are corrected" — this
   one was not. The ledger is wrong about its own fix.**
5. **`dist-web.zip`** — 25,953,578 B at the repo root, dated 2026-08-21, built by no tool in `tools/`
   and referenced nowhere. **The upload step is entirely manual and entirely undocumented.** If the
   web build becomes a review vehicle, that needs writing down before it becomes the thing that goes
   wrong at 1 a.m.
6. **Two mobile artifacts in his gallery** — he can open the wrong one.
7. **`assertModelReachable()` treats a 404 as reachable** — and would equally mis-report a genuinely
   404'd model on the **live** web build.
8. **`dashboard/assets/fonts/README.md` still says "eight typefaces" / "five editorial families".**
   True count: 7 families / 11 files.

---

## UNKNOWNS

Numbered, each with what would settle it. Nothing below is guessed; several would materially widen or
narrow the design space, and three are cheap enough to clear this week.

1. **Is the review artifact actually iframed, and with which `allow` list?** Everything in *Read this
   first §1* is inference plus a probe, not measurement. **★ Settle it:** publish the probe page in
   `engine-capabilities.md` §7 as an artifact, open it on his phone, read the values off the screen —
   ten minutes. Publish it **once without `viewport-fit=cover` and once with**; the difference in
   `env(safe-area-inset-bottom)` between the two runs is direct proof on the real device. **This is
   the highest-value unknown on the list.**
2. **Is the artifact host's "16 MB" MiB (16,777,216) or MB (16,000,000)?** It decides whether the
   current 16,064,627-byte artifact has 712 KB of headroom **or is already 64,627 B over**. Nothing
   in this repo answers it; the host's documentation does. **Settle it before spending the budget.**
3. **What does claude.ai return for an unknown relative path under an artifact URL** — a 404, or the
   shell with a 200? Decides which of two routes the Scanner's OCR failure takes. **Both end in the
   same wrong message, so the fix holds either way**; only the trace is incomplete. Settle by
   fetching a known-absent path from a published artifact.
4. **Does a `file://` camera grant persist across Chrome launches?** Strong expectation: no — Chromium
   keys content settings by origin and `file://` has none. **Not verified.** Settle by granting once,
   quitting, relaunching, and re-checking `navigator.permissions.query({name:'camera'})`.
5. **★ Search with a real on-screen keyboard up.** The one blocker nobody has cleared. A keyboard
   cannot be emulated headlessly; the last audit measured a **168px letterbox showing 7.8% of an
   answer set**. **Settle it:** read `window.visualViewport.height` on his device with the keyboard
   up — that is also the real keyboard-height fraction the search layout must be designed against
   (~45–55% is a planning figure, not a measurement). It is numbered step 8 of the review script
   precisely so it is not missed again.
6. **Seven of the eight `[data-accent]` families are unaudited.** The contrast work measured **ember**
   (the default) only; `theme.css:62-91` defines eight, and the user picks one. Settle by running the
   same token matrix over the other seven and their `color-mix()`-derived `-wash`/`-soft`/`-deep`
   variants. Until then, "AA" is a claim about ember.
7. **Does Crimson Pro have any live consumer?** The token chain was traced and none was found, but the
   app was not driven surface by surface. **If it is genuinely dead that is ~0.5 MB** — the same
   argument that cut Merriweather. Settle by driving every surface and collecting computed
   `font-family`.
8. **Android Chrome text scaling under `text-size-adjust: 100%`.** Does the accessibility slider still
   scale `rem` once boosting is opted out, or is the setting implemented purely as boosting — in
   which case opting out denies the benefit to exactly the users who asked for it? **This is the one
   open item that could change a recommendation in the type system.** Settle with a 10-minute
   on-device check: set Android Chrome text scaling to 200%, load the build, measure whether body
   type grows. If it does not, the mitigation is to keep the opt-out and add an in-app text-size
   control, which this offline-first app can own entirely.
9. **Real load time for a 15.32 MiB artifact on his phone and his connection.** **Never measured, by
   anyone.** A plausible contributor to "feels cheap" that has never been ruled in or out. Settle by
   asking him to time it once, or by measuring on any phone on cellular.
10. **Real-device performance numbers.** Every ms figure is a 6×-throttled desktop proxy; it does not
    model memory bandwidth, GPU, storage or thermals. **Scroll jank in particular is unmeasured** —
    the headless sample was not credible and is reported only to say so, which means "the 407-card
    grid janks on scroll" remains a *reasoned expectation from node counts*, not a measurement.
    Settle with a device trace.
11. **Primary-source dimensions from Apple HIG and Material 3.** Both sites are client-rendered and
    returned only page titles. **Every Apple and Material number in Reference patterns is secondary.**
    Also unsettled: the exact iOS 26 "scroll edge effect" parameters (gradient, blur, or both, and its
    depth). Settle by re-checking on a machine that can render those pages before any of it is written
    into a surface spec.
12. **Whether the older-skewing audience is confirmed by data.** It is **inferred** from the content —
    Wallach's readership, the goal-chip list, the conditions the corpus covers. **There is no
    analytics in this app by design and there never will be**, so there is no measurement to appeal
    to. The inference is stated as an inference; the only thing that would settle it is him saying so.
13. **WebP savings on the 25 avatars.** Estimated from typical encoder behaviour; the files were not
    re-encoded. Settle by re-encoding them and measuring — and keep PNG for any portrait a re-encode
    visibly degrades.
14. **Does `id="appRail"` have any live reader?** The `?nav=` switch that plausibly used it was deleted
    in `1e5adb1e`. **Grep `src/` and the built bundle before keeping or removing it.** ⚠ Note the
    bundle-grep trap: `dist/main.js` inlines the creators-log, so a hit there may be log prose rather
    than code.
15. **Does his SiteGround plan offer a real staging subdomain?** The middle-ground review vehicle
    depends on it. **A question for him**, not something to assume. A public subdirectory
    (`nutrientcodex.com/m/`) is still publicly reachable, needs its own `.htaccess`/robots handling,
    and means a second 34 MB copy of the tree.
16. **Pixel heights of the Knowledge sub-surfaces.** The data-shapes probe's root reported
    `scrollHeight == clientHeight` because the scrolling element is an inner child that was not
    identified. **The text-volume and DOM-node counts stand; the pixel heights do not and were
    omitted.** Coverage's 9,631px is measured on `.app-workspace` and is reliable. Settle by
    identifying the drawer's real scroller.
17. **Whether the board is 102/102 right now**, and whether any gate outside the named set would move.
    The 102 is counted from the registry; the at-risk list was built by reading all 102 entries and
    the bodies of those plausibly in scope, **not all 102 check functions**. **Treat the teardown's
    gate list as the high-probability set, not an exhaustive proof.** Settle by running
    `PYTHONUTF8=1 python tools/invariants.py`.
18. **Two data-curation questions nobody should read a health conclusion into.** Why the four tiles
    (chloride, sulfur, silica, flavonoids) are product-unreachable — the ceiling was measured, the
    reason was not investigated; and which 51 essentials `product-recommender-data.json` covers, and
    why not 90. Both are curation questions for the owner, **not data-shape questions**, and neither
    was guessed. Also open and smaller: whether `entity-copy.json`'s empty `conditions: {}` is
    intentional or an unfilled slot.

---

_Eight groundwork investigations, ~5,400 lines, folded into one. Where they disagreed — the camera on
`file://`, the font-file count, the `backdrop-filter` count, the CPL target, skeleton loaders, the
legibility floor — this document picked, and said why. Where they could not determine something, it
is numbered above rather than smoothed over. Nothing here is a design; everything here is a
constraint the design has to satisfy or consciously overturn._
