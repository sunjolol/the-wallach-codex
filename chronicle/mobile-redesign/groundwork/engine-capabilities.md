# Engine capabilities — what the three target engines actually support

_Groundwork for the mobile-first redesign. Written 2026-08-22. Every verdict below is tagged with how
it was established: **MEASURED** (I ran it, command included), **CITED** (authoritative source,
linked), or **RECALLED** (my own knowledge, not re-verified — treat as a lead, not a fact)._

This document does **not** design anything. It answers one question: _what is the design fleet
allowed to assume?_

---

## 0. TL;DR for a designer in a hurry

- **Almost everything on the fleet's wish list is fine.** The two engines that matter (the owner's
  desktop Chromium and current iOS Safari) support container queries, `:has()`, nesting, `dvh/svh/lvh`,
  `env(safe-area-inset-*)`, popover, dialog, scroll-snap, `overscroll-behavior`, `color-mix()`,
  subgrid, `@starting-style`, View Transitions, VisualViewport, ResizeObserver, IntersectionObserver,
  and the Pointer Events model.
- **Five things are genuinely unsafe.** Anchor positioning, scroll-driven animations,
  `text-wrap: pretty`, `field-sizing`, and the Vibration API. Four of the five are unsafe *because
  iOS Safari is the laggard* — and iOS Safari is the review device.
- **Two hard blockers, both about the Scanner.** `BarcodeDetector` does not exist on iOS at all, and
  it is **MEASURED absent on this machine's Chrome too**. And the OCR asset bundle is **38 MB** —
  larger than a claude.ai artifact is allowed to be (16 MB), so *the scan flow cannot be demoed in
  the environment the owner reviews in.*
- **Three recorded facts in `chronicle/` are wrong or incomplete**, all measured. See §6. The most
  consequential: **IndexedDB works on `file://`** with a 10.7 GB quota and survives a browser
  restart, contradicting `2026-08-03-file-protocol-is-sacred.md`. I am reporting this, not acting on
  it — the ruling is the owner's.
- **The one-line fix that will do the most for "feels like a proper mobile app":** `dashboard.html`
  ships `<meta name="viewport" content="width=device-width, initial-scale=1.0">` with **no
  `viewport-fit=cover`**. Without it every `env(safe-area-inset-*)` the designers write resolves to
  `0px` on an iPhone, and the design will sit under the notch and the home indicator.

---

## 1. The three targets, kept separate

| | Target (a) — LOCAL `file://` | Target (b) — PINNED PORTABLE ENGINE | Target (c) — REVIEW PHONE |
|---|---|---|---|
| What it is | `dashboard/dashboard.html` opened in whatever browser the user has | Ungoogled Chromium, trimmed, shipped beside the app | The owner's phone, driving a claude.ai artifact URL |
| Status | Ships today | **DECIDED, NOT ACQUIRED** | In use right now — this is what produced the rejection |
| Engine | Unknown-but-modern Chromium in practice | Chromium ~151 (see below) | iOS WebKit (Safari) and/or Chrome for Android |
| Constrains | `file://` scheme restrictions (§5) | Nothing meaningful | iOS Safari feature gaps (§4) **+ an iframe** (§7) |

### (a) The local `file://` build
No pinned engine exists, so this is "the owner's everyday browser." The honest floor is therefore
**whatever a current Chromium does**, and the only Chromium I can measure here is the one Puppeteer
25.1.0 vendors:

```
browserVersion: "Chrome/149.0.7827.22"
UA:             HeadlessChrome/149.0.0.0
```

That is the engine every number in §3 and §5 was measured in. It is a reasonable proxy for the
owner's live browser but **is not proof about it** — I cannot see what he has installed.

### (b) The pinned portable engine — decided, not acquired
Per `chronicle/decisions/2026-08-03-pinned-engine-acquisition.md`:

- **Nothing is installed.** `engine/` was downloaded, measured, leak-tested, then deliberately
  deleted (428.9 MB + a 187.6 MB archive).
- Preferred candidate: **Ungoogled Chromium `151.0.7922.71-1.1`, Windows x64** — *"Not binding — the
  final pick is made against the shipped feature set."*
- The doc warns: *"A newer release will exist by the time this is picked up. Re-derive the version
  and hash from the release API."*
- The engine choice is **deferred to the very end**, on the stated grounds that *"Chromium is
  effectively unlimited for our purposes, so no design decision is waiting on this."*

**What that implies for this redesign:** Chromium 151 is *newer* than the Chromium 149 I measured, so
**every green in §3 stays green on the pinned engine**. Target (b) imposes no constraint the design
must work around. `2026-08-03-pinned-engine.md` explicitly authorises *"No fallbacks. No polyfills.
No defensive coding."*

⚠ **But that licence is scoped to target (b) only.** It was written before nutrientcodex.com existed
and before the owner started reviewing on a phone. The moment a surface is reviewed on iOS Safari or
served to the public web, "no fallbacks" stops being free. §4 is the price list.

### (c) The review phone — the constraint that actually bit
The owner drives a **claude.ai artifact URL on his phone**. Two separate constraint layers stack
here, and they are easy to confuse:

1. **iOS WebKit / Chrome for Android feature gaps** — §4. Real, permanent, and the reason four
   wish-list features are AVOID.
2. **The artifact host's iframe and CSP** — §7. Possibly severe, and **I could not determine it from
   this machine.** I have written the probe that settles it.

---

## 2. The proven floor — what the repo already ships and therefore already works

A feature already in production is the strongest evidence available: it has been rendered and signed
off by human eyes. Counts from:

```bash
grep -roh --include=*.css '<pattern>' dashboard/assets/styles/
```

| Feature | Occurrences in `dashboard/assets/styles/` | Reading |
|---|---|---|
| `color-mix()` | **363** | Load-bearing. The whole theme system rests on it. |
| `:is()` | 65 | Load-bearing. |
| `clamp()` | 22 | Load-bearing (fluid type). |
| `backdrop-filter` | 14 declarations, **only 5 paired with `-webkit-`** | ⚠ see §4.1 |
| `:has()` | 10 | Proven — `workspace-coverage.css:1226` even notes *"`:has()` availability is not the constraint; this is a preference."* |
| `prefers-reduced-motion` | 15 | Proven. |
| `aspect-ratio` | 4 | Proven. |
| `overscroll-behavior` | 1 | Barely used. |

**Never used anywhere in the repo today** (so nothing about them is proven by production use):
`@container` / `container-type` (0), CSS nesting (0 — no `&` rules), `dvh`/`svh`/`lvh` (**0**),
`env(safe-area-inset-*)` (**0**), `scroll-snap` (0), `view-transition-name` (0), `subgrid` (0),
`text-wrap` (0), `@layer` (0), `@property` (0), `@supports` (**0**), `touch-action` (**0**),
`content-visibility` (0), `animation-timeline` (0), `anchor-name` (0), `prefers-color-scheme` (0 —
the dark theme is a class toggle, not a media query).

On the JS side, `dashboard/assets/js/src/` uses **none** of: `ResizeObserver`, `IntersectionObserver`,
`MutationObserver`, `visualViewport`, `navigator.share`, `getUserMedia`, Pointer Events,
`navigator.vibrate`, `startViewTransition`, popover, `<dialog>`. `matchMedia` appears **once**.
Build target is `es2022` (`tools/build.mjs:61`, `--target=es2022`; `dashboard/tsconfig.json` target
`ES2022`).

**The honest read:** the app is currently built almost entirely out of 2018-era layout primitives.
That is a large part of why it does not feel like a mobile app — not a browser limitation. Nothing is
stopping the redesign from using the modern set; it simply has never been used here.

---

## 3. MEASURED — Chromium 149 on `file://`

Reproduce with the script in Appendix A. All of the following returned **`true`** via
`CSS.supports()` / feature detection on a `file:///` page:

**CSS:** `container-type: inline-size` · `selector(:has(a))` · CSS nesting (`CSSNestedDeclarations`) ·
`color-mix()` · `backdrop-filter` (unprefixed) · `100dvh` · `100svh` · `100lvh` ·
`env(safe-area-inset-bottom)` · `text-wrap: balance` · `text-wrap: pretty` · `subgrid` ·
`scroll-snap-type` · `overscroll-behavior` · `view-transition-name` · `animation-timeline: scroll()` ·
`animation-timeline: view()` · `anchor-name` · `position-anchor` · `position-area` ·
`content-visibility` · `field-sizing: content` · `transition-behavior: allow-discrete` ·
`interpolate-size` · `scrollbar-gutter` · `touch-action` · `accent-color` · `aspect-ratio` ·
`@layer` · `@starting-style` · `popover` attribute · `selector(:popover-open)`

**JS:** `ResizeObserver` · `IntersectionObserver` · `visualViewport` · `document.startViewTransition` ·
`HTMLDialogElement.showModal` · `showPopover` · `navigator.share` · `navigator.canShare` ·
`navigator.clipboard` · `navigator.mediaDevices.getUserMedia` · `navigator.vibrate` · `PointerEvent` ·
`Element.animate` · `ScrollTimeline` · `ViewTimeline` · `CSS.registerProperty` · `structuredClone` ·
`crypto.randomUUID` · `Object.groupBy` · `Array.prototype.toSorted`

**The two falses:**

| | Result | Why it matters |
|---|---|---|
| `BarcodeDetector` | **`false`** | Not just an iOS gap — absent on **Windows Chrome**. It is Android/macOS/ChromeOS-only. Any barcode-scanning idea for the Scanner is dead on both the owner's desktop *and* his iPhone. |
| `CSS.supports('-webkit-backdrop-filter', …)` | **`false`** | Chromium 149 no longer recognises the prefixed alias. The 5 prefixed declarations in the repo are inert here and live only for older Safari. Harmless — but see §4.1. |

---

## 4. The verdict table — SAFE / SAFE-WITH-FALLBACK / AVOID

Verdicts are **for the union of all three targets**, i.e. the strictest one. Where the strict target
is iOS Safari, it is flagged **☞ iOS is the laggard**.

Confidence tags: **[M]** measured here · **[C]** cited authoritative source · **[R]** recalled,
unverified.

### Layout & structure

| Feature | Verdict | Notes |
|---|---|---|
| `dvh` / `svh` / `lvh` | **SAFE** | [M] Chromium 149. [R] iOS Safari 15.4+. The single highest-value adoption in this redesign — it is what makes a full-height mobile shell stop jumping when the URL bar hides. |
| `env(safe-area-inset-*)` | **SAFE-WITH-PREREQUISITE** | [M] supported. ⚠ **Requires `viewport-fit=cover` in the viewport meta, which the app does not have.** See §4.3. |
| Container queries (`@container`) | **SAFE** | [M] Chromium 149. [R] Safari 16.0+. Nothing in the repo uses them yet; nothing prevents it. |
| `subgrid` | **SAFE** | [M]. [R] Safari 16.0+. |
| `:has()` | **SAFE** | [M] + **already shipping in 10 places**. |
| CSS nesting | **SAFE** | [M] `CSSNestedDeclarations` present. [R] Safari 17.2+ for the relaxed (bare-`&`-optional) syntax. Note esbuild does **not** transpile the CSS — the sheets are copied, so what you write is what ships. |
| `aspect-ratio`, `clamp()`, `gap`, grid | **SAFE** | Already load-bearing. |
| `content-visibility` | **SAFE-WITH-FALLBACK** | [M]. [R] Safari 18.0+. Fallback is simply not applying it — it is a pure perf hint. Worth considering for the long Knowledge lists. |
| `field-sizing: content` | **AVOID** | [M] true in Chromium 149; [C, weak] Safari support only claimed as of ~June 2026. ☞ **iOS is the laggard.** Too new to be load-bearing on a review device. Fallback: fixed `rows`/JS autosize. |
| `interpolate-size: allow-keywords` | **AVOID** | [M] true in Chromium 149. [R] not in Safari. ☞ **iOS is the laggard.** Animating to `height: auto` must still be done with `grid-template-rows: 0fr → 1fr` or a measured pixel height. |

### Motion & transitions

| Feature | Verdict | Notes |
|---|---|---|
| `prefers-reduced-motion` | **SAFE — and mandatory** | Already used 15×. The redesign must keep honouring it. |
| Web Animations API (`Element.animate`) | **SAFE** | [M]. Universally available. The safest way to do anything the CSS set cannot. |
| View Transitions (same-document) | **SAFE-WITH-FALLBACK** | [M] `document.startViewTransition` present. [R] Safari 18.0+. Fallback is trivial and must be written: `if (!document.startViewTransition) { update(); return; }`. Genuinely the best tool for tab-to-tab and list-to-detail on mobile. |
| View Transitions (cross-document) | **AVOID** | Irrelevant — this is a single-page app with no navigations. |
| `@starting-style` | **SAFE-WITH-FALLBACK** | [M]. [R] Safari 17.5+. Fallback: the element appears without its entry animation. Acceptable degradation. |
| `transition-behavior: allow-discrete` | **SAFE-WITH-FALLBACK** | [M]. [R] Safari 17.4+. Same shape of fallback. |
| **Scroll-driven animations** (`animation-timeline: scroll()` / `view()`) | **AVOID as load-bearing** | [M] true in Chromium 149. [C] **WebKit lists scroll-driven animations and `animation-timeline: view()` as NEW in Safari 26.0** — so every iPhone below 26 gets nothing. ☞ **iOS is the laggard.** Use only as pure decoration behind `@supports (animation-timeline: view())`, or use IntersectionObserver, which is SAFE. |

### Positioning & overlays

| Feature | Verdict | Notes |
|---|---|---|
| `<dialog>` + `showModal()` | **SAFE** | [M]. [R] Safari 15.4+. Gets you focus trap, inert background, and Esc for free — all things a hand-rolled mobile sheet gets wrong. Strongly recommended over the current hand-built `.rc-backdrop` / `.wc-veil` overlays. |
| `popover` attribute + `:popover-open` | **SAFE** | [M]. [C] WebKit: popover *"shipped in Safari 17.0."* Top-layer, light-dismiss, no z-index war. The right primitive for the gloss tooltips and menus. |
| **CSS Anchor Positioning** | **AVOID** | [M] true in Chromium 149. [C] **WebKit lists "Anchor Positioning" as NEW in Safari 26.0.** ☞ **iOS is the laggard, badly.** ⚠ *Source conflict:* one search summary claimed Safari 18.2+; the WebKit release blog is authoritative and says 26.0. I trust the blog. Fallback: measure with `getBoundingClientRect()` + a `ResizeObserver`, which is what the existing `gloss-tooltip.ts` already does. |
| `z-index` / `position: fixed` overlays | **SAFE** | But note §7 — `position: fixed` inside the review iframe is relative to the iframe, not the phone screen. |

### Typography & colour

| Feature | Verdict | Notes |
|---|---|---|
| `color-mix()` | **SAFE** | 363 uses in production. Proven. |
| `text-wrap: balance` | **SAFE-WITH-FALLBACK** | [M]. [R] Safari 17.5+. Fallback is normal wrapping. Safe for headings. |
| `text-wrap: pretty` | **AVOID as load-bearing** | [M] true in Chromium 149. [C] **WebKit: "Safari 26.0 adds support for `text-wrap: pretty`."** ☞ **iOS is the laggard.** Free to add — it degrades to nothing — but never let a layout depend on it. |
| `@property` / `CSS.registerProperty` | **SAFE-WITH-FALLBACK** | [M]. [R] Safari 16.4+. |
| `@layer` | **SAFE** | [M]. [R] Safari 15.4+. Would help enormously with the "unscoped CSS captures another surface" class of bug this repo has been bitten by — but adopting it is a large refactor, not a mobile-redesign task. |
| `contrast-color()` | **AVOID** | [C] new in Safari 26.0; [M] **not tested here**. Too new. |

### 4.1 ⚠ `backdrop-filter` — a real, present defect

14 `backdrop-filter` declarations exist; **only 5 carry the `-webkit-` companion.** Two sites are
unprefixed-only:

- `dashboard/assets/styles/workspace-coverage.css:1131` — `.wc-veil` (`blur(9px) saturate(.9)`)
- `dashboard/assets/styles/workspace-scanner.css:436` — `.vd-cf__refzoom` (`blur(2px)`)

[R] Unprefixed `backdrop-filter` landed in Safari **18.0**; `-webkit-backdrop-filter` has worked since
Safari 9. So on any iPhone below iOS 18 those two blurs silently vanish — `.wc-veil` becomes a flat
30%-opacity scrim over legible text.

**Verdict: SAFE-WITH-FALLBACK. The fallback is the `-webkit-` pair, and it must always be written.**
This is exactly the kind of rule that should be a gate, not a promise (§00.B.2): a CSS lint that fails
if `backdrop-filter` appears without an adjacent `-webkit-backdrop-filter` would be ~10 lines.

### 4.2 JS APIs

| API | Verdict | Notes |
|---|---|---|
| `ResizeObserver` | **SAFE** | [M]. [R] Safari 13.1+. Unused today; the redesign will need it. |
| `IntersectionObserver` | **SAFE** | [M]. [R] Safari 12.1+. The portable substitute for scroll-driven animations. |
| **`VisualViewport`** | **SAFE — and the fix for the on-screen keyboard** | [M] present. [R] Safari 13+. On iOS the soft keyboard does **not** resize `window.innerHeight`; a fixed bottom bar will be hidden behind the keyboard unless `visualViewport.height` / `.offsetTop` are used. Currently **zero uses in the repo**. This is very likely part of what "scuffed" meant on the Scanner's hand-entry and the Regimen's inputs. |
| Pointer Events | **SAFE** | [M]. [R] Safari 13+. Use `pointer*` events, not `touch*`, and pair with `touch-action` (**0 uses today** — a likely source of scroll-vs-drag jank). |
| `navigator.share` / `canShare` | **SAFE-WITH-FALLBACK** | [M] present. [R] iOS Safari 12.2+. Requires a user gesture. ⚠ In an iframe it needs `allow="web-share"` (§7). Fallback: copy-to-clipboard. |
| `navigator.clipboard` | **SAFE-WITH-FALLBACK** | [M]. Requires a secure context — `file://` **is** one here ([M] `isSecureContext: true`). |
| **`navigator.vibrate`** | **AVOID** | [M] present in Chromium 149. [C] **Not supported by Safari / iOS**; reports of it working in 2026 are contested even within the MDN compat issue tracking it, and Apple has gated it behind user interaction where it exists at all. ☞ **iOS is the laggard.** Never make haptics load-bearing; treat any call as best-effort and unobservable. |
| **`BarcodeDetector`** | **AVOID — does not exist** | [M] **`false` on this machine's Chrome.** [C] absent from Safari and every iOS browser. Rules out barcode/UPC scanning on both target (a) and target (c). |
| `getUserMedia` | **CONDITIONAL — see §5.2** | [M] the API resolves on `file://`. The blockers are permission and iframe policy, not the scheme. |

### 4.3 ★ The viewport meta — a prerequisite nobody has met

```bash
$ grep -o '<meta name="viewport"[^>]*>' dashboard/dashboard.html dist-web/index.html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Both builds. **No `viewport-fit=cover`.** [R] Without it, iOS keeps the page inside the safe area and
every `env(safe-area-inset-*)` resolves to `0px`.

Consequence: if the surface designers write a bottom tab bar with
`padding-bottom: env(safe-area-inset-bottom)`, it will look correct in a desktop emulator and **wrong
on the actual iPhone** — either flush against the home indicator or, with `viewport-fit=cover` added
later and the padding forgotten, underneath it. This is a two-token change that must land before any
safe-area work is designed against, and it should be verified on the real phone, not in an emulator
(a DOM probe is not a visual check).

---

## 5. `file://` — MEASURED restrictions, and what degrades

`file://` in Chromium 149 reports `location.origin === "file://"` and **`isSecureContext === true`**.
So "no secure-context APIs on file://" — as stated in `2026-08-03-file-protocol-is-sacred.md` §3 — is
**not** what actually gates things. What gates things is the **opaque (`null`) request origin**.

### 5.1 What is genuinely blocked — all MEASURED

| Thing | Result on `file://` | Works on the web build? |
|---|---|---|
| `fetch('./sibling.html')` | `TypeError: Failed to fetch` | ✓ Yes |
| `XMLHttpRequest` to a sibling file | `XHR ERROR` — *"blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-extension, chrome-untrusted, data, http, https, isolated-app"* | ✓ Yes |
| `import('./mod.js')` (dynamic **or** static ES modules) | `TypeError: Failed to fetch dynamically imported module` — same CORS message | ✓ Yes |
| `navigator.serviceWorker.register()` | *"The URL protocol of the current origin ('null') is not supported."* | ✓ Technically — but a service worker is **forbidden by project rule** on both targets. |
| `document.cookie` | Writes are dropped — reads back `""` | ✓ Yes |
| `styleSheet.cssRules` on a linked stylesheet | **Throws / inaccessible** (origin `null`). My probe counted 11 stylesheets and **0 readable rules**. | ✓ Yes |

That last one is a live trap for tooling: **no runtime CSS introspection is possible on `file://`.**
Any measure-to-fit or dead-rule technique that reads the CSSOM must run over `http://` or parse the
`.css` text itself.

**Nothing here is new damage** — the app already solves all of it. `<script src>` and `<link href>`
are **not** CORS-restricted, which is why `state/ocr.ts:129` injects Tesseract with a `<script>` tag
rather than `import()`, and why esbuild inlines every datastore into a single 14.1 MB IIFE. The
design consequence is simply: **the mobile redesign may not introduce code-splitting, lazy `import()`,
or any runtime `fetch` of an asset** on target (a).

### 5.2 `getUserMedia` — the prompt's premise is **not confirmed**

The brief states "no getUserMedia on file:// in Chrome." I ran a controlled A/B — same browser, same
run, `file://` vs `http://localhost` — twice:

| Launch config | `file://` | `http://localhost:8799` |
|---|---|---|
| default flags | `NotAllowedError: Permission denied` | `NotAllowedError: Permission denied` |
| `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` | **`RESOLVED tracks=1`** | **`RESOLVED tracks=1`** |

**The two origins behave identically.** The `NotAllowedError` under default flags is headless Chrome
having no camera and auto-denying — not the `file://` scheme. `navigator.permissions.query({name:
'camera'})` returns `"prompt"` on `file://`, i.e. Chrome is willing to ask.

**Honest verdict:** the camera API is *available* on `file://` in Chrome. What I could **not**
determine is whether a granted permission **persists** across launches — Chromium keys content
settings by origin, and `file://` has no persistable origin, so the strong expectation is a **fresh
prompt on every launch**. I did not verify this and will not assert it. **UNDETERMINED — flagged.**

I also could not test **iOS Safari on `file://`** at all (no device here). iOS has no ordinary way to
open a local file tree in Safari, so target (a) on iPhone is largely hypothetical anyway.

**Design implication:** a camera-capture Scanner is *not* ruled out by the file protocol. It is ruled
out — or at least made hostile — by (i) a permission prompt that likely repeats every session on
target (a), and (ii) the artifact iframe on target (c), §7. The honest degraded behaviour is the one
the app **already implements**: `views/scanner.ts:12` — *"BY HAND: a label with no photo (unreadable,
no camera, or just faster to type)"*. That hand-entry path is the correct primary on mobile, with any
camera path as an enhancement that must be feature-detected and may silently be unavailable.

⚠ Note the existing copy in `views/scanner.ts:152` — *"Couldn't reach the OCR language model. **Check
your connection** and scan again."* That string can only ever fire on http/https (`runOcr` skips the
probe when `protocol === 'file:'`), so it is correct today — but "check your connection" is exactly
the wrong sentence for a mobile user of an offline-first app, and a mobile rewrite of the Scanner
should re-word it.

### 5.3 ★ Storage on `file://` is shared across **every local HTML file** — MEASURED

I wrote `localStorage['codex-secret'] = 'PROFILE-DATA-FROM-A'` from
`.../siteA/a.html`, then opened `.../siteB/b.html` in the same browser:

```json
"B_read": { "origin": "file://", "readsA": "PROFILE-DATA-FROM-A", "keys": ["codex-secret"] }
```

IndexedDB behaves the same way — a database written from one file path was read back verbatim from a
different directory (`"idbReadBack": "written-by-file:"`).

**All `file://` pages share one storage bucket.** Two consequences the redesign should know:

1. **Privacy.** Any other local `.html` the user ever opens in the same browser profile can read the
   Codex's stored profile and regimen. The project's promise is *"the user owns 100% of their data on
   their device"* — which remains true — but "on their device, in a bucket every local page shares"
   is the precise version. The pinned-engine plan (a dedicated `--user-data-dir` used for this app
   only) fixes this cleanly; it is another argument for target (b).
2. **The 5 MB ceiling is shared too.** `core/schemas/profile.ts:29` warns that blowing localStorage
   corrupts the regimen. That budget is not the app's alone.

### 5.4 The web build is a *different* payload — do not design as if they are the same

```
dist-web           35M total
  assets/vendor    21M   (tesseract, model fetched at runtime)
  assets/data     9.5M   (fetched at runtime — NOT inlined)
  assets/js       2.1M   (main.js, data stripped out)
  assets/fonts    884K
```
versus the local build's single `dashboard/assets/js/dist/main.js` at **14,108,023 B (14.1 MB)**.

On the phone over cellular, the web build's first meaningful interaction costs ~2.1 MB of JS plus
whatever slice of the 9.5 MB data it needs. That is a **mobile design constraint the local build does
not have**, and it belongs in the IA discussion (what must be present on first paint vs what can wait).

### 5.5 ★ The OCR bundle vs the review environment — a hard blocker

```
dashboard/assets/vendor/tesseract        38M
  worker-offline.js                    17,219,896 B   ← base64-inlined eng.traineddata
  tesseract-core-simd.wasm.js           4,735,153 B
  tesseract-core-simd-lstm.wasm.js      3,938,657 B
  lang-data/eng.traineddata.gz         12,821,300 B
```

`worker-offline.js` begins `self.WALLACH_TRAINEDDATA="H4sICGU3…"` — the 12.8 MB model base64-encoded so
that `file://` never has to `fetch` it. Elegant, and the only way to keep OCR offline. But:

- **A claude.ai artifact must be ≤ 16 MB rendered.** `worker-offline.js` alone is 17.2 MB. **The OCR
  scan flow physically cannot be shipped in an artifact.** Any mobile Scanner mockup the owner reviews
  on his phone will have to fake or stub the OCR step — and the reviewers must be told that, because
  otherwise "the scanner is scuffed" gets attributed to the design rather than to a stubbed engine.
- **Memory.** Base64-decoding 17 MB plus instantiating a ~4.7 MB WASM core is comfortable on desktop
  (measured heap limit 3,586 MB) and **not** comfortable on an iPhone, where WebKit will discard a tab
  under memory pressure. **UNDETERMINED — I have no device to measure it on.** It should be measured
  on the owner's actual phone before the mobile Scanner commits to an on-device OCR step.

---

## 6. ⚠ Three recorded facts that measurement contradicts

Surfacing these per §00.B.3. **I am not acting on any of them** — each is the owner's call.

### 6.1 IndexedDB *does* work on `file://`
`chronicle/decisions/2026-08-03-file-protocol-is-sacred.md` states: *"IndexedDB and a larger quota are
NOT available to us, because they need a real origin."*

Measured, Chromium 149, `file://`:
```json
"idbOpen": "OPENED",
"quota": 10737491968,          // 10.7 GB
"storageEstimate": "{\"quota\":10737491968,\"usage\":73728,\"usageDetails\":{\"indexedDB\":73728}}"
```
And across a **full browser restart** with a fixed `userDataDir`: pass 1 read `(empty)` and wrote;
pass 2 read back **`"survived"`**. Both IndexedDB and localStorage persisted.

**What this does and does not change.** It does **not** touch the ruling — `file://` is sacred,
Electron and Tauri stay dead, and that ruling never depended on this claim. It **does** mean the
"~5 MB localStorage cliff" described as permanent is escapable if the owner ever wants it. Caveats
that argue for leaving it alone: the store is shared with every other local page (§5.3),
`navigator.storage.persisted()` returned `false` so the bucket is evictable, and `localStorage` is
synchronous and simple while IDB is neither. **Recommendation: record the correction in that decision
file, change nothing else, and do not let the mobile redesign quietly adopt IDB.**

### 6.2 `file://` **is** a secure context
Same doc, §3: *"No secure-context-only APIs."* Measured: `isSecureContext === true`, `navigator.clipboard`
present, `crypto.randomUUID` present, `getUserMedia` reachable. The real gate is the **opaque origin**,
which is what actually kills service workers (*"origin ('null') is not supported"*) and `fetch`. The
rule's *effects* are right; its stated *reason* is wrong, and the wrong reason will mislead the next
person who asks "can we use X?"

### 6.3 The `-webkit-backdrop-filter` pairing is inconsistent
§4.1. Two of fourteen declarations lack the prefix. This one is a straightforward defect and, per the
project's fix-as-found habit, should be fixed in the pass that touches those files.

---

## 7. ★ The review environment is not the target environment — UNDETERMINED, with a probe

The owner reviews on **a claude.ai artifact URL on his phone**. A published artifact renders inside a
**sandboxed iframe on claude.ai**, not as a top-level document. I state that as a strong inference
from how the artifact host works and from its documented strict CSP — **I could not verify it from
this machine, and I am not going to assert it as measured.**

If it is an iframe, these consequences follow, and every one of them touches the mobile redesign:

| Thing the designers want | What an iframe does to it |
|---|---|
| `100dvh` full-height app shell | Resolves to the **iframe's** height, not the phone viewport. The URL-bar-collapse behaviour that `dvh` exists to solve **does not reproduce in review at all.** |
| `env(safe-area-inset-*)` | Resolves to **`0px`** unless the iframe itself is edge-to-edge. Notch/home-indicator padding will be **invisible during review** and appear only on the real device. |
| `position: fixed` bottom bar | Fixed to the iframe, not the screen. Looks right; behaves differently. |
| `VisualViewport` keyboard handling | Reports the iframe's viewport. Keyboard-avoidance logic cannot be judged in review. |
| `getUserMedia` (camera) | Requires `allow="camera"` on the iframe. **Almost certainly not granted.** |
| `navigator.share` | Requires `allow="web-share"`. |
| `navigator.vibrate` | Blocked in cross-origin iframes regardless of iOS support. |
| Fullscreen | Requires `allow="fullscreen"`. |
| The 38 MB OCR bundle | 16 MB artifact cap — cannot ship (§5.5). |

**This is the most important thing in this document.** The rejection — *"none of this feels like a
PROPER mobile app"* — was formed in an environment that structurally cannot deliver several of the
things that make an app feel native. Some of the "scuffed" feeling may be the harness. Redesigning
against the harness's behaviour, rather than the phone's, would be a real and expensive mistake.

### The probe that settles it — 10 minutes, one artifact, one look
Publish this as an artifact, open it on the phone, and read the values off the screen. It answers
every row above with facts.

```html
<title>Harness Reality Check</title>
<style>
  body{font:14px/1.5 ui-monospace,Menlo,monospace;margin:0;padding:16px;
       background:#faf6ef;color:#1a1612}
  @media (prefers-color-scheme:dark){body{background:#151210;color:#efe7db}}
  dt{font-weight:700;margin-top:10px}
  dd{margin:0 0 0 12px;word-break:break-all}
  .bar{position:fixed;left:0;right:0;bottom:0;padding:10px;
       padding-bottom:calc(10px + env(safe-area-inset-bottom));
       background:#c8452d;color:#fff;text-align:center}
</style>
<dl id="o"></dl>
<div class="bar">bottom bar — is it above the home indicator?</div>
<script>
  const rows = {
    'framed (self !== top)': window.self !== window.top,
    'location.origin': String(location.origin),
    'isSecureContext': isSecureContext,
    'innerHeight (px)': innerHeight,
    '100dvh resolves to': getComputedStyle(document.documentElement).getPropertyValue('--dvh') || (() => {
      const d = document.createElement('div'); d.style.height = '100dvh';
      document.body.append(d); const h = d.getBoundingClientRect().height; d.remove(); return h;
    })(),
    'screen.height': screen.height,
    'visualViewport.height': visualViewport ? visualViewport.height : 'ABSENT',
    'safe-area-inset-top': getComputedStyle(document.body).paddingTop,
    'navigator.share': typeof navigator.share === 'function',
    'navigator.vibrate': typeof navigator.vibrate === 'function',
    'mediaDevices present': !!navigator.mediaDevices,
    'BarcodeDetector': typeof BarcodeDetector !== 'undefined',
    'anchor-name supported': CSS.supports('anchor-name', '--a'),
    'animation-timeline: view()': CSS.supports('animation-timeline', 'view()'),
    'text-wrap: pretty': CSS.supports('text-wrap', 'pretty'),
    'backdrop-filter (unprefixed)': CSS.supports('backdrop-filter', 'blur(2px)'),
    'field-sizing: content': CSS.supports('field-sizing', 'content'),
    'startViewTransition': typeof document.startViewTransition === 'function',
    'userAgent': navigator.userAgent,
  };
  // safe-area probe: read the real inset off a test element
  const probe = document.createElement('div');
  probe.style.paddingTop = 'env(safe-area-inset-top)';
  probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
  document.body.append(probe);
  const cs = getComputedStyle(probe);
  rows['env(safe-area-inset-top)'] = cs.paddingTop;
  rows['env(safe-area-inset-bottom)'] = cs.paddingBottom;
  probe.remove();
  document.getElementById('o').innerHTML = Object.entries(rows)
    .map(([k, v]) => `<dt>${k}</dt><dd>${String(v)}</dd>`).join('');
  navigator.mediaDevices?.getUserMedia({ video: true })
    .then(s => { s.getTracks().forEach(t => t.stop());
      document.getElementById('o').insertAdjacentHTML('beforeend','<dt>getUserMedia</dt><dd>RESOLVED</dd>'); })
    .catch(e => document.getElementById('o').insertAdjacentHTML('beforeend',
      `<dt>getUserMedia</dt><dd>${e.name}: ${e.message}</dd>`));
</script>
```

⚠ Publish it **without** `viewport-fit=cover` first, then republish **with** it. The difference in
`env(safe-area-inset-bottom)` between the two runs is the direct proof for §4.3, on the real device.

---

## 8. What I could not determine

Listed plainly rather than guessed, per §00.A's never-guess-silently rule.

1. **What browser the owner actually has** for target (a). Everything in §3 and §5 was measured in
   Chromium 149 (Puppeteer 25.1.0's bundle) as a proxy.
2. **Whether the review artifact is really iframed**, and with which `allow` list. §7 is inference
   plus a probe, not measurement.
3. **Which iOS version the owner's phone runs.** Four of the five AVOID verdicts flip to SAFE on iOS
   26. If he is on 26, anchor positioning, scroll-driven animations, and `text-wrap: pretty` all open
   up. **This is worth one question and would materially widen the design space.**
4. **Whether a `file://` camera grant persists** across Chrome launches (§5.2). Strong expectation:
   no. Not verified.
5. **Whether an iPhone can hold the OCR bundle in memory** (§5.5). No device here.
6. **Chrome for Android specifics.** I measured desktop Chromium; Android Chrome tracks the same
   engine version, so the CSS/JS verdicts should hold, but `BarcodeDetector` is one known place where
   Android is *more* capable than desktop Windows — which is a trap, not a licence, since iOS still
   has none.
7. **Exact iOS Safari version numbers** tagged **[R]** above. The Safari 26.0 items are **[C]** from
   the WebKit release blog and are solid; the older ones are recalled and should be spot-checked
   against caniuse if a design decision hangs on one.

---

## Appendix A — reproducing the measurements

Three probe scripts were run against `node_modules/puppeteer` (v25.1.0, Chrome 149.0.7827.22) from the
repo root. They were written to the session scratchpad, which is ephemeral. To reproduce:

1. **Feature matrix** — write a `file://` page, then in `page.evaluate()` collect
   `CSS.supports(prop, value)` for every property in §3 and `typeof` checks for every JS API, plus
   `location.origin`, `isSecureContext`, and async probes for `indexedDB.open`, `getUserMedia`,
   `fetch('./sibling')`, `serviceWorker.register`, and `navigator.storage.estimate()`.
2. **Origin A/B** — same browser instance, one page on `file://` and one on a local `http://` server,
   run twice: once with default flags and once with
   `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`. Then a second `file://` page in
   a *different directory* to test storage sharing. Then two sequential launches with a fixed
   `userDataDir` to test restart persistence.
3. **Mobile-viewport cost** — `setViewport({width:390,height:844,deviceScaleFactor:3,isMobile:true,
   hasTouch:true})` + `Emulation.setCPUThrottlingRate`.

Measured load cost of the current desktop app at a 390×844 viewport, `file://`:

| | 1× CPU | 4× CPU throttle |
|---|---|---|
| wall-clock to `load` | 268 ms | 898 ms |
| `domContentLoadedEventEnd` | 263 ms | 888 ms |
| first contentful paint | 892 ms | 744 ms |
| DOM nodes at rest | 758 | 758 |
| JS heap used | 32 MB | 32 MB |
| horizontal overflow at 390px | **none** (`scrollWidth 390`, `body{overflow-x:hidden}`) | same |
| readable `cssRules` across 11 sheets | **0** — CSSOM blocked on `file://` (§5.1) | same |

Read that last-but-one row carefully: **there is no horizontal overflow at 390 px, but `body` has
`overflow-x: hidden`.** The absence of overflow is therefore not evidence that the layout fits — it is
evidence that overflow is being clipped. A DOM probe cannot tell those apart, and this is not a visual
check.

## Appendix B — sources cited

- [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) —
  authoritative for Anchor Positioning, scroll-driven animations / `animation-timeline: view()`,
  `text-wrap: pretty`, `contrast-color()` all being **new in 26.0**, and for popover having shipped in
  Safari 17.0.
- [WebKit Features for Safari 26.5](https://webkit.org/blog/17938/webkit-features-for-safari-26-5/) —
  continued anchor-positioning fixes through May 2026.
- [MDN: Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) and
  [mdn/browser-compat-data#29166](https://github.com/mdn/browser-compat-data/issues/29166) — Safari/iOS
  vibration support is absent and, where claimed, contested.
- [MDN: BarcodeDetector](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector) and
  [caniuse: BarcodeDetector](https://caniuse.com/mdn-api_barcodedetector) — no Safari, no iOS.
- [caniuse: css-field-sizing](https://caniuse.com/css-field-sizing) — Safari support only very recent.
- In-repo: `chronicle/decisions/2026-08-03-pinned-engine.md`,
  `chronicle/decisions/2026-08-03-pinned-engine-acquisition.md`,
  `chronicle/decisions/2026-08-03-file-protocol-is-sacred.md`,
  `dashboard/tsconfig.json`, `tools/build.mjs:61`, `tools/vendor-tesseract.js`,
  `dashboard/assets/js/src/state/ocr.ts`, `dashboard/assets/js/src/views/scanner.ts`,
  `dashboard/dashboard.html:29-30`.
