# Performance budget — the mobile redesign

_Groundwork for the mobile-first rebuild. Every number below is either **MEASURED** on this
repo at commit `ea7a792d` (2026-08-22) or explicitly marked **ESTIMATE** / **UNDETERMINED**.
No number here is guessed silently._

**Measurement rig.** Chrome headless via the repo's own puppeteer (`node_modules/puppeteer`),
viewport 390x844 @ DPR 3, `isMobile: true`, driving the real app — the local build from
`file://dashboard/dashboard.html`, and the web build from `dist-web/` served by
`python -m http.server` (no compression, so byte figures from that run are *decoded* bytes;
gzip figures are measured separately with `gzip -9`). CPU slowdown via CDP
`Emulation.setCPUThrottlingRate` at 1x / 4x / 6x.

> **★ THE HONEST LIMIT ON EVERY TIMING IN THIS DOCUMENT.** A 6x-throttled Chrome on this
> Windows desktop is a *proxy* for a mid-range Android, not a measurement of one. CPU
> throttling models compute; it does not model a phone's slower memory bandwidth, weaker GPU,
> slower storage, or thermal throttling. Treat the ms figures as **relative** — good for
> ranking surfaces against each other and for catching regressions — and re-measure the
> finished redesign on the owner's actual phone before declaring any time budget met.

---

## 1. Where the weight is — MEASURED

### 1.1 The local (`file://`) bundle

| Artifact | Bytes | Note |
|---|---:|---|
| `dashboard/assets/js/dist/main.js` | **14,108,023** (13.45 MiB) | the committed runtime contract |
| " gzip -9 | 3,268,926 (3.12 MiB) | irrelevant on `file://` — no compression there |
| `dashboard/assets/js/dist/main.js.map` | 19,136,566 | **not** git-tracked (`git ls-files` lists only `main.js`) |

Composition, from an esbuild `--metafile` run of the exact build command in `tools/build.mjs`
(total `bytesInOutput` 14,102,332):

| Slice | Bytes in output | Share |
|---|---:|---:|
| inlined JSON from `assets/data/` | **13,329,717** | **94.5%** |
| all TypeScript + deps | 772,615 | 5.5% |
| — of which `zod` | 128,979 | 0.9% |
| — of which 90 files under `assets/js/src/` | 643,636 | 4.6% |

**Top contributors, ranked (bytes in the bundle):**

| # | Input | Bytes |
|---:|---|---:|
| 1 | `assets/data/search/search-index.json` | 4,325,928 |
| 2 | `assets/data/corpus-embed.json` | 2,984,087 |
| 3 | `assets/data/creators-log-embed.json` | 2,685,535 |
| 4 | `assets/data/entity-page-data.json` | 1,105,850 |
| 5 | `assets/data/product-detail-data.json` | 826,049 |
| 6 | `assets/data/foods-composition-data.json` | 492,278 |
| 7 | `assets/data/glossary.json` | 250,930 |
| 8 | `assets/data/regimen-label-lookup.json` | 188,871 |
| 9 | `assets/data/product-recommender-data.json` | 165,524 |
| 10 | `node_modules/zod` | 128,979 |
| 11 | `assets/js/src/views/entity-page.ts` | 82,044 |
| 12 | `assets/data/entity-copy.json` | 58,826 |
| 13 | `assets/js/src/views/regimen.ts` | 58,360 |
| 14 | `assets/js/src/views/scanner.ts` | 51,027 |

**The top three are 9,995,550 B = 70.9% of the whole bundle.** Two of them —
`creators-log-embed` and `corpus-embed` — are needed by *no* workspace's first paint.

**Two findings worth acting on:**

- **The build does not minify.** `tools/build.mjs` runs esbuild with no `--minify`. Measured:
  minified output is **11,250,342 B** — **-2,857,648 B (-20.3%)**. Gzipped the win is only
  -158,743 B (-4.9%), but the local build is served from disk *uncompressed*, so the 2.72 MiB
  is real bytes on the user's disk and real bytes through V8's parser.
- **Five declared runtime dependencies contribute zero bytes.** `animejs`, `d3`, `lottie-web`,
  `motion`, `roughjs` are in `dashboard/package.json` `dependencies` and appear nowhere in the
  metafile; a grep of `assets/js/src/**/*.ts` for each import specifier returns nothing. They
  cost the bundle nothing — but they are 5 entries claiming to be runtime deps that are not.

### 1.2 Stylesheets — MEASURED

627,082 B raw across 11 sheets, 128,968 B gzip -9 combined, 2,785 rule blocks.
**All 11 are render-blocking `<link>`s in `<head>`.**

| Sheet | Bytes | Rules |
|---|---:|---:|
| `drawer-knowledge.css` | **208,487** | **1,015** |
| `workspace-coverage.css` | 72,803 | 204 |
| `theme.css` | 57,831 | 184 |
| `workspace-scanner.css` | 53,443 | 313 |
| `dashboard.css` | 51,077 | 242 |
| `design-system.css` | 47,248 | 121 |
| `workspace-regimen.css` | 46,697 | 289 |
| `drawer-orac.css` | 41,364 | 224 |
| `drawer-search.css` | 34,124 | 157 |
| `drawer-shared.css` | 9,437 | 28 |
| `type-futurist.css` | 4,571 | 8 |

`drawer-knowledge.css` alone is 33% of all CSS and blocks the first paint of a
Coverage-only visit.

### 1.3 Fonts — MEASURED, and the Merriweather claim checked

| | Files | Bytes |
|---|---:|---:|
| local `assets/fonts/*.ttf` | 9 | 2,472,876 (dir total 2,486,049 with LICENSE/README) |
| web `dist-web/assets/fonts/*.woff2` | 9 | 867,164 (dir total 880,337) |

**Fetched at boot on a 390px mobile viewport landing on Coverage — 7 faces, 480,952 B:**

| Face | Bytes (woff2) |
|---|---:|
| Unbounded-VariableFont_wght | **260,448** |
| JetBrainsMono-VariableFont_wght | 72,760 |
| SpaceGrotesk-VariableFont_wght | 48,996 |
| ChakraPetch-SemiBold | 26,564 |
| ChakraPetch-Bold | 26,056 |
| ChakraPetch-Regular | 25,528 |
| BrunoAce-Regular | 20,600 |

Playfair Display x2 and Crimson Pro x2 (383 KB of woff2) are correctly **not** fetched at
boot. **Unbounded is 54% of the boot font payload** and is a display face.

**Commit `a9b0513b` ("cut Merriweather — 8.73 MB off the download, 4.70 MB off the web"):**

- The **8.73 MB** is VERIFIED as arithmetic: `git show --stat a9b0513b` removes exactly
  9,159,580 B of `.ttf` = 8.735 MiB. It is a **repo / GitHub-download** saving.
- The **4.70 MB** is consistent: `dist-web/` measures **36,003,528 B = 34.34 MiB** today
  against the commit's stated 34.31 MiB post-cut (the small delta is later rebuilds).
- **Neither number is a first-paint saving**, and the commit says so itself: *"First load
  unchanged at 2.68 MB, because these faces were never in it — the win is the deploy and the
  GitHub download."* Do not carry the 8.73 MB into a mobile-load story.

### 1.4 Avatars — MEASURED

25 PNGs (`Men/01-12`, `Women/01-12`, `Generic`), **all 128x128**, **760,616 B total,
30,425 B average**. `views/profile.ts:353` already sets `img.loading = 'lazy'` on picker
tiles. No `width`/`height` attributes and no `decoding="async"` anywhere.

### 1.5 Vendored libraries — MEASURED

`dashboard/assets/vendor/` holds exactly one thing: Tesseract.

| File | Local bytes | In `dist-web` |
|---|---:|---:|
| `worker-offline.js` (model base64-inlined by `build.mjs`) | 17,219,896 | — (file build only) |
| `lang-data/eng.traineddata.gz` | 12,821,300 | 12,821,300 |
| `tesseract-core-simd.wasm.js` | 4,735,153 | 4,735,153 |
| `tesseract-core-simd-lstm.wasm.js` | 3,938,657 | 3,938,657 |
| `worker.min.js` | 123,724 | 123,724 |
| `tesseract.min.js` | 66,695 | 66,695 |
| **total** | **38,905,425** | **21,685,529** |

**MEASURED lazy:** after navigating to the Scanner workspace and idling, the count of
`performance.getEntriesByType('resource')` entries whose URL contains `tesseract` was **0**.
The OCR engine costs nothing until a scan actually starts. This is the one big thing in the
tree that is already right — do not regress it.

### 1.6 Distribution totals — MEASURED

| | Bytes | MiB |
|---|---:|---:|
| Local runtime set (`dashboard.html` + styles + `main.js` + fonts + vendor + avatars + favicons) | 56,915,803 | 54.28 |
| " without the OCR engine | 18,010,378 | 17.18 |
| `dashboard/` on disk minus `node_modules` | 90,928,418 | 86.71 |
| `dist-web/` (62 files) | 36,003,528 | 34.34 |

Note the local build does **not** need `assets/data/` (13,102,530 B) at runtime — it is
inlined into `main.js` — yet it ships in the repo, as does the 19.1 MB sourcemap (untracked).

### 1.7 A single-file demo build — MEASURED by constructing one

**There is no single-file build in this repo.** Nothing under `tools/` emits one; the
`*-demo*.html` files under `temporary/` are standalone mockups, not builds of the app.

I built one to get a real number: shell + all 11 stylesheets inlined + `main.js` inlined =
**14,745,192 B**; plus fonts as base64 (3,297,184) + avatars as base64 (1,014,184) +
favicons (5,144) = **19,061,704 B = 18.18 MiB**, excluding the OCR engine, which cannot
practically be inlined into an HTML file.

---

## 2. Startup — what actually happens, and what it costs

### 2.1 The sequence between load and first paint

1. Browser parses the 10,691 B shell, then blocks on **11 stylesheets (627 KB raw)**.
2. One **synchronous** `<script>` at the end of `<body>` — the whole 14.1 MB IIFE
   (`format=iife`, not a module, because a `file://` page has a null origin). V8 parses it,
   then executes it.
3. Execution **materialises 13.3 MB of inlined JSON as JavaScript object literals**. Verified
   in the emitted bundle at `dashboard/assets/js/dist/main.js:41190`:
   `var search_index_default = { schema_version: 1, ... }` — object literals, not
   `JSON.parse("...")` strings. Every one of the ~40 `import x from '...json'` statements in
   `assets/js/src/` is a top-level static import, so **all of it is constructed at boot**,
   nothing is deferred.
4. `bootstrap()` (`main.ts:470`) installs the recompute trigger, the regimen window bridges,
   rail wiring, profile chip + identity, the welcome veil wiring, topbar search, the drawer
   mounts, drawer keys, and the gloss tooltip.
5. `setTimeout(() => navigateTo('coverage'), 0)` — the Coverage field renders on the next task.
6. `prefetchSplit(['creators-log-embed', 'corpus-embed', 'search/search-index'])`
   (`main.ts:524`) — a no-op on `file://`; on the web build it starts three fetches.
7. `ensureKnowledgeData()`.

### 2.2 Boot timings — MEASURED (ms, mobile viewport)

**Local `file://` build**

| CPU | domInteractive | DCL | load | FCP |
|---|---:|---:|---:|---:|
| 1x | 148 | 172 | 174 | 476 |
| 4x | 820 | 971 | 986 | 652 |
| 6x | 899 | 1,097 | 1,112 | 704 |

**Web build over HTTP**

| CPU | domInteractive | DCL | load | FCP |
|---|---:|---:|---:|---:|
| 1x | 90 | 108 | 155 | 476 |
| 6x | 575 | 745 | 1,343 | 836 |

FCP lands *before* DCL because the shell markup paints before the trailing script finishes.

### 2.3 Web first load — MEASURED

23 requests, **13,153,831 B decoded**.

| Group | Decoded bytes | gzip -9 (measured on the files) |
|---|---:|---:|
| `index.html` | 10,823 | ~3,000 |
| 11 CSS | 625,712 | 128,968 |
| `main.<hash>.js` | 2,179,332 | 452,683 |
| 7 woff2 | 480,952 | 480,952 (already compressed) |
| **critical-path subtotal** | **3,296,819** | **~1,065,600** |
| `search-index.<hash>.json` | 4,230,504 | 983,369 |
| `corpus-embed.<hash>.json` | 2,953,976 | 723,024 |
| `creators-log-embed.<hash>.json` | 2,670,169 | 1,003,801 |
| **split-data subtotal** | **9,854,649** | **2,710,194** |
| **TOTAL first visit** | **13,153,831** | **~3,778,800 (3.60 MiB)** |

At 6x CPU the three split fetches start at t=743 ms and finish by t=1,526 ms. They are
prefetched **eagerly at boot for all three**, even though `creators-log-embed` (1.00 MB gzip)
feeds only the Creator's Log and no workspace.

> **UNDETERMINED:** I could not reproduce the *"First load unchanged at 2.68 MB"* figure
> recorded in `a9b0513b`. Its definition — which resources it counted, compressed or not — is
> not written down anywhere I could find. I neither confirm nor contradict it; the table above
> states its own definition and is reproducible.

### 2.4 A counter-finding: do NOT switch the inlined data to `JSON.parse`

The standard advice is that `JSON.parse("...")` beats an equivalent object literal. **Measured
on this payload, it is the opposite, at every throttle level.**

Method: the five largest artifacts emitted as two standalone scripts — one as object literals
(10,198,575 B), one as `JSON.parse` of escaped strings (12,385,089 B) — loaded as plain pages,
3 runs each, median, timing **navigationStart to domContentLoadedEventEnd** so that *script
parse* is inside the window, not just execution.

| CPU | object literals | `JSON.parse` |
|---|---:|---:|
| 1x | **126 ms** | 158 ms |
| 4x | **204 ms** | 318 ms |
| 6x | **282 ms** | 413 ms |

gzip: literals 2,827,447 B vs `JSON.parse` 2,910,387 B — literals also win on the wire,
because the string form has to escape every quote.

**Recorded here so a future round does not "optimise" the build in the wrong direction.**
(If only *execution* is timed — starting the clock after V8 has already parsed the script —
literals appear 3x faster still, 9.5 ms vs 29.8 ms at 1x. That framing is misleading; the
end-to-end figure above is the one that matters.)

---

## 3. Runtime cost per surface — MEASURED

Node counts are `root.querySelectorAll('*').length` on the real app, mobile viewport,
after the arrival veil is dismissed.

| Surface | DOM nodes | innerHTML bytes | Rows built eagerly |
|---|---:|---:|---|
| Boot `<body>` (veil up) | 738 | 41,018 | — |
| **Coverage field** | 609 | 32,058 | **91 tiles** (60 `.tile` mineral, 16 `--vitamin`, 12 `--amino`, 3 `--fat`), ~6.7 nodes/tile, max depth 12 |
| Regimen | 406 | 26,081 | — |
| Scanner (idle) | 43 | 2,574 | — |
| Knowledge · Home | 166 | 9,965 | — |
| Knowledge · Absorption (foods) | 696 | 77,532 | 15 food items, 79 `.gloss` |
| Knowledge · ORAC | 1,107 | 145,921 | 60 dots, 33 claims, 157 `.gloss` |
| Knowledge · Explore | 183 | 118,160 | 141 chips |
| **Knowledge · Products (catalog)** | **2,757** | 311,760 | **407 cards** — head reads `ALL 215 PRODUCTS + 192 FOODS` |
| **Knowledge · Conditions** | **3,059** | **1,134,772** | **510 condition rows** |
| Knowledge · product detail open | 3,059 | 331,828 | — |
| **Search · "calcium"** | **4,936** | **1,012,815** | **201 result rows + 201 `.arow__body` + 2,495 `.gloss`** |

Peak measured `<body>` in one session: 6,056 nodes / 1,079,716 B. JS heap 42.6-54.2 MB.

**The Coverage field is not a problem.** 91 tiles at ~6.7 nodes each is cheap and it renders
in 94.5 ms at 6x. It must also stay whole — it is the map of gaps, and you cannot read a map
of gaps through a 20-row window.

### 3.1 Eager-list flags (read from the source, confirmed in the DOM)

- **`views/knowledge-products.ts::renderProductsTab`** builds *every* card into one HTML
  string — `catalogEntries(kind, ...).map(e => e.html).join('')` — 407 cards, no pagination,
  no windowing. The All/Products/Foods control re-renders the whole grid. The drawer's text
  search *hides* rows rather than removing them, so the full node set stays live under a
  filter.
- **Conditions tab** — 510 rows of the same shape, 1.13 MB of HTML string built per visit.
- **Search results** — every one of the 201 rows carries a complete answer body and verbatim
  quote, built up front, while **0 rows are open**. Plus 2,495 `.gloss` tooltip spans inside
  those never-visible bodies. This is the single biggest avoidable DOM cost in the app.
- **Explore** — 141 chips / 183 nodes. Cheap. Leave alone.

### 3.2 Interaction cost — MEASURED at 6x CPU (sync click to forced layout, ms)

| Action | cold (1st visit) | warm (repeat) |
|---|---:|---:|
| Knowledge to Absorption | 864.5 | 118.5 - 141.4 (memoised) |
| Knowledge to ORAC | 465.2 | 173.9 - 176.3 |
| **Knowledge to Conditions** | 475.2 | **412.8 - 466.2 — not memoised** |
| **Knowledge to Products** | 344.5 | **328.0 - 331.9 — not memoised** |
| Knowledge to Home | 98.3 | 63.4 - 70.6 |
| Rail to Regimen | 220.9 | 81.1 |
| Rail to Coverage | — | 94.5 |
| Rail to Scanner | 74.0 | — |
| Open product detail | 353.9 | — |
| **Search "calcium" keystroke to rows** | **1,524 ms** (1,086 at 4x; 235 at 1x) | — |

The Absorption tab's 864 ms is a **one-time compute** (food composition maths over 192 foods),
memoised thereafter. Conditions and Products pay their full cost on **every** visit — that is
a different, worse bug shape, and it is DOM construction, not maths.

### 3.3 Platform primitives present today — MEASURED by grep

| Thing | Count across `assets/styles/*.css` or `assets/js/src/**/*.ts` |
|---|---:|
| `content-visibility` | **0** |
| `contain:` | **0** |
| `will-change` | **0** |
| `backdrop-filter` | 10 (dashboard 1, drawer-search 4, coverage 1, regimen 2, scanner 2) |
| `box-shadow` declarations | 268 |
| `filter:` declarations | 19 |
| `addEventListener` | 60 total, across 98 source files — only **1** inside a loop |
| `{ passive: true }` | **0** |
| scroll listeners | **1**: `window.addEventListener('scroll', hide, true)` — `views/gloss-tooltip.ts:119`, **capture phase, non-passive** |
| IntersectionObserver / ResizeObserver / MutationObserver | **0 / 0 / 0** |
| `requestAnimationFrame` | 2 (both `views/regimen.ts`) |
| `createDocumentFragment` | 2 |
| `.innerHTML =` assignments | 37 |

Read that table as good news twice over: **event delegation is already the house pattern**
(60 listeners for an app this size), and **the containment primitives are an untouched
surface** — nothing has to be undone before using them.

One thing to keep an eye on: `dashboard.html` declares an SVG `feTurbulence` +
`feDisplacementMap` filter (`#ds-filter-rough`) applied to `<mark>`. Zero `<mark>` elements
were live on any surface I measured, so it costs nothing today — but it is a per-element
CPU/GPU filter and must never be applied across a long list.

### 3.4 What gates this today — MEASURED

**Nothing on the invariant board.** Grepping `tools/invariants.py` for
size / byte / weight / budget / perf / dom returns no invariant. The only guard is
`size-limit` in `dashboard/package.json`, run by `npm run check-size` and the pre-push hook:

| size-limit entry | Limit | Actual | Headroom |
|---|---:|---:|---:|
| `main.js` gzipped — self-described "runaway tripwire, NOT a design constraint" | 8 MB | 3.12 MiB | 2.6x |
| `assets/styles/*.css` gzipped | 400 KB | 126 KiB | 3.2x |

Both are loose enough that a mobile-first rewrite could double the CSS and add a megabyte of
JS without tripping anything.

---

## 4. The budget

Every line is a number the redesign is held to, with today's measured value beside it so the
gap is visible. Times are at **6x CPU throttle** on the rig described at the top — a proxy,
not a phone.

### 4.1 Bytes

| Budget | Target | Today | Verdict |
|---|---:|---:|---|
| Web critical path (html + CSS + JS + boot fonts), gzip | **<= 900 KB** | ~1,066 KB | over by 18% |
| Web total first visit, gzip | **<= 2.0 MB** | ~3.60 MB | over by 80% |
| Local `main.js`, raw | **<= 12 MB** | 13.45 MiB | `--minify` alone lands 10.73 MiB |
| `main.js` gzip tripwire (`size-limit`) | **tighten 8 MB to 4 MB** | 3.12 MiB | — |
| All CSS gzip (`size-limit`) | **tighten 400 KB to 200 KB** | 126 KiB | — |
| CSS blocking the *first* mobile screen, raw | **<= 250 KB** | 627 KB (all 11 sheets) | over by 2.5x |
| Fonts fetched for the first mobile screen | **<= 250 KB** | 481 KB | over by 92% |
| Avatar images, each / all 25 | **<= 8 KB / <= 200 KB** | 30.4 KB / 760.6 KB | over by ~3.8x |

The single largest byte lever is not the bundle: it is that **all three split artifacts are
prefetched at boot** (`main.ts:524`). Moving `creators-log-embed` alone to fetch-on-open
removes 1.00 MB gzip from every first visit and nothing on any workspace notices.

### 4.2 Time (6x CPU)

| Budget | Target | Today |
|---|---:|---:|
| First contentful paint | **<= 1,000 ms** | 704 (local) / 836 (web) — **inside** |
| App interactive (first tap answers) | **<= 1,500 ms** | ~1,190 local / ~840 web — **inside** |
| Any tab or route switch, sync | **<= 200 ms** | Conditions 413-466, Products 328 — **over** |
| Any tab or route switch, to painted frame | **<= 300 ms** | Conditions 568, Products 382 — **over** |
| Search keystroke to first result | **<= 500 ms** | 1,524 ms — **3x over** |
| Longest single synchronous task | **<= 200 ms** | Absorption cold 864, Conditions 466 — **over** |

FCP and interactivity are already inside budget. **The whole time problem is interaction, not
startup** — which matches the owner's verdict ("scuffed", "cheap"), because scuffed is what a
400 ms tap feels like.

### 4.3 DOM

| Budget | Target | Today's worst |
|---|---:|---:|
| Nodes per screen, at rest | **<= 1,500** | Search 4,936 · Conditions 3,059 · Products 2,757 |
| Nodes added per scroll page (one viewport of new content) | **<= 400** | n/a — nothing is incremental today |
| Nodes per list row | **<= 10** | product row ~6.8 OK · condition row ~6 OK · **search row ~24 FAIL** |
| Max element depth | **<= 14** | 12 (Coverage) OK |

Coverage (609) and Regimen (406) already pass and need no work.

### 4.4 The windowing rule

> **A list MUST be windowed or virtualised when BOTH hold: more than 60 rows, AND the rows
> together would put more than 600 nodes in the DOM.**
>
> **One carve-out, permanent: the Coverage field is never windowed.** It is a map of gaps;
> seeing all 90 at once is the feature. Its layout cost is controlled with
> `content-visibility` on the category groups instead.

Applied to today's surfaces:

| Surface | Rows | Nodes | Window? |
|---|---:|---:|---|
| Search results | 201 | 4,936 | **yes** |
| Conditions | 510 | 3,059 | **yes** |
| Products catalog | 407 | 2,757 | **yes** |
| Explore chips | 141 | 183 | no — cheap rows, under the node bar |
| Coverage field | 91 | 609 | **no — carve-out** |
| ORAC | 33 claims | 1,107 | no — under the row bar |
| Regimen | — | 406 | no |

Both halves of the test matter. Rows alone would send 141 cheap Explore chips through a
virtualiser for nothing; nodes alone would exempt a 400-row list of one-node items that is
still 400 rows of scroll-position bookkeeping.

### 4.5 Gate it, or label it WISH

Per §00.B ("a rule that can be a gate *is* one, shipped in the same patch"):

**Can be gated — propose `mobile_perf_budget` as a board invariant.** A headless probe at
390x844 that walks Coverage, Regimen, Scanner and each Knowledge tab, plus one search, and
asserts the §4.3 node counts and the §4.4 windowing rule (row count vs live-node count). It is
`anchor_class="consistency"` — it compares our DOM to our own budget, and says nothing about
whether the design is *good*. Add a byte assertion over `dist-web/` for the §4.1 critical path.

**Can be gated cheaply — tighten the two existing `size-limit` entries** to 4 MB / 200 KB in
the same patch. No new machinery.

**Cannot be gated — label WISH, do not sell as safe:** every millisecond figure in §4.2.
Frame timing and interaction latency are device-and-thermal dependent; a CI number would be a
number about this desktop. The honest version is a repeatable manual measurement on the
owner's phone at the end of each mobile chunk, recorded in the chronicle.

---

## 5. Techniques that fit this codebase — no framework, offline-first

Ordered by measured value per unit of risk.

1. **`content-visibility: auto` + `contain-intrinsic-size` on every list row and card.**
   Zero JS, no markup change, works in Chrome/Android WebView and Safari 18+. The fallback
   when unsupported is *today's behaviour*, so it cannot break anything. It converts the
   510-row Conditions list from 3,059 laid-out nodes to roughly one viewport of layout work
   **while the nodes stay in the DOM** — which means the existing hide-based drawer filter and
   in-page find keep working untouched. **Always pair it with `contain-intrinsic-size`** or
   the scrollbar jumps as rows realise.
2. **Do not build the 201 search answer bodies up front.** Render the summary row; build the
   body on first expand and keep it. This removes 201 bodies + 2,495 `.gloss` spans and is the
   largest single DOM win available — search goes from ~24 nodes/row to under 10, inside
   §4.3 without any virtualiser at all.
3. **Real windowing only where construction (not layout) is the cost** — the search result
   list after (2), if it is still over. Build rows into a `DocumentFragment` and append once;
   never append row-by-row into a live parent.
4. **`contain: layout style paint` on each card/row; `contain: content` on drawer panels.**
   Cheap, invisible, and it stops one card's re-render invalidating the whole drawer.
5. **Keep the one-big-`innerHTML`-string pattern for initial paint** (37 sites today) — it is
   genuinely fast for bulk construction. Use `DocumentFragment` only for *incremental* appends
   during windowed scroll.
6. **Event delegation is already the pattern — codify it.** 60 listeners across 98 files, one
   inside a loop. Rule for the redesign: *no per-row listener, ever.* Under windowing a
   per-row listener also becomes a correctness bug, because rows get recycled.
7. **Passive listeners.** Add `{ passive: true }` to `views/gloss-tooltip.ts:119` — it only
   calls `hide()` and never `preventDefault()`s, yet it is the app's only scroll listener and
   it runs in capture phase for every scroll container in the app. Every new scroll/touch
   listener in the redesign must be passive by default.
8. **`will-change` discipline: it is at 0 today — keep it near 0.** Only on an element that is
   actively animating, set on interaction start and removed on end. Never in a static rule on
   a list row: that promotes every row to its own compositor layer and exhausts GPU memory on
   a phone faster than anything else on this list.
9. **`backdrop-filter` budget: at most one visible at a time, never on a scrolling element.**
   There are 10 today. Each is a full-surface readback on a mobile GPU.
10. **Keep `#ds-filter-rough` (feTurbulence + feDisplacementMap) off every list.** Fine on a
    single pull-quote; ruinous applied across rows.
11. **Avatar images.** Re-encode the 25 128x128 PNGs (30.4 KB average, MEASURED) to WebP —
    **ESTIMATE: a 128px portrait at WebP q80 typically lands 4-6 KB; I did not re-encode them,
    so treat the ~200 KB total in §4.1 as a target to verify, not a measured result.** Add
    explicit `width`/`height` attributes (kills layout shift in the picker) and
    `decoding="async"`; `loading="lazy"` is already set at `views/profile.ts:353`. WebP needs
    no network and no library, so offline-first is unaffected. Keep PNG for any portrait a
    re-encode visibly degrades.
12. **Fonts.** Unbounded is 260 KB of the 481 KB fetched at boot. Either subset it to the
    glyphs the display copy actually uses, or give it `font-display: swap` so the first paint
    uses the fallback and Unbounded arrives behind it. The four faces correctly *not* fetched
    at boot (Playfair x2, Crimson Pro x2) show the mechanism already works — this is about the
    seven that are.
13. **Turn on `--minify` in `tools/build.mjs`.** -2,857,648 B (-20.3%) on the local build, at
    the cost of nothing: the sourcemap is already emitted for debugging. The `file://` build is
    served uncompressed, so this is the only compression it will ever get.
14. **Split the CSS by route.** `drawer-knowledge.css` is 208 KB / 1,015 rules — 33% of all CSS
    — and it render-blocks a visit that only ever opens Coverage.
15. **Move `creators-log-embed` out of the boot prefetch** (`main.ts:524`) to fetch-on-open.
    -1.00 MB gzip from every web first visit; no workspace reads it.
16. **Do NOT convert the inlined JSON to `JSON.parse`.** Measured slower end-to-end at 1x, 4x
    and 6x, and larger gzipped. See §2.4.

---

## 6. What I could not determine

- **Real-device numbers.** Everything timed here is Chrome headless on this Windows desktop
  with CDP CPU throttling as a stand-in for a mid-range Android. It does not model memory
  bandwidth, GPU, storage or thermals. Re-measure on the owner's phone before calling any
  §4.2 target met.
- **Scroll jank.** My headless scroll sample returned median 7.0 ms / p95 8.4 ms / max 9.1 ms
  over 234 frames. **That is not credible** — headless compositing plus the probe's own 50 ms
  sleeps dominate it. I report it only to say it proves nothing. Real scroll jank needs a
  device trace, and until there is one, "the 407-card grid janks on scroll" remains a
  *reasoned expectation from node counts*, not a measurement.
- **The "first load 2.68 MB" figure** in `a9b0513b` — definition unrecorded, not reproduced.
  §2.3 states its own definition instead.
- **WebP savings on the avatars** — estimated from typical encoder behaviour, not measured. I
  did not re-encode the files.
- **Whether Android WebView honours `loading="lazy"`** inside the profile picker's scroll
  container at these tile sizes — untested here.
- **Whether the 5 unused runtime dependencies** (`animejs`, `d3`, `lottie-web`, `motion`,
  `roughjs`) are dead or parked for a planned surface. They cost the bundle zero bytes today;
  I did not rule on whether they should be removed, because a parked dependency may be a
  deliberate hedge and this document is not the place to decide it.

---

## 7. Reproducing the measurements

```bash
# Bundle composition (writes a metafile, then rank inputs)
cd dashboard && npx esbuild assets/js/src/main.ts --bundle --format=iife --target=es2022 \
  --platform=browser --define:__SPLIT_DATA__=false --metafile=meta.json --outfile=probe.js

# The minify delta
npx esbuild assets/js/src/main.ts --bundle --format=iife --target=es2022 --platform=browser \
  --define:__SPLIT_DATA__=false --minify --outfile=min.js

# Wire bytes
gzip -9 -c dashboard/assets/js/dist/main.js | wc -c
cat dashboard/assets/styles/*.css | gzip -9 -c | wc -c

# Web build, served without compression, then read the Resource Timing entries
cd dist-web && python -m http.server 8731 --bind 127.0.0.1
```

DOM counts and interaction timings come from puppeteer scripts written for this pass
(viewport 390x844 @ DPR 3, `Emulation.setCPUThrottlingRate`, arrival veil dismissed, then
`root.querySelectorAll('*').length` and `performance.now()` around each click). They follow
the same shape as the probes in `tools/probes/` — `render_probe_knowledge.js` is the closest
template. If the `mobile_perf_budget` gate in §4.5 is built, it should absorb them so the
numbers in this document stay checkable rather than becoming a snapshot nobody can re-run.
