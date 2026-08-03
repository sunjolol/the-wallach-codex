# Decision: `file://` is sacred — the app must always open in any browser

_2026-08-03. Luneth's ruling, made after a full head-to-head against Electron and Tauri. **SETTLED.
Do not re-raise, and do not propose an app shell again.**_

## The ruling
**The Wallach Codex opens from `file://`, in any browser, forever.** It is static files. It is not,
and will not become, a packaged desktop application.

**Electron and Tauri are ruled out permanently** — not deferred, not "maybe later." A future session
that rediscovers their advantages should read this file and stop.

## Why — the escape hatch is the product
The promise is that this runs for years with no upkeep and **cannot be broken by someone else's
release schedule**. A pinned browser delivers that only while the pinned browser still runs.

Static files survive the engine. If the pinned build one day fails on some future Windows, the user
opens `dashboard/dashboard.html` in whatever browser exists and the dashboard still works. An app
shell cannot offer that: when the shell dies, the app dies with it, and the user's own health data
becomes hostage to a binary.

That single property outweighs every advantage the alternatives had.

## What this permanently accepts — the taxes, eyes open
These are **consequences of the ruling, not defects to be fixed.** Do not re-litigate them as
problems; they are the price that was knowingly paid.

1. **No `fetch()` at runtime.** A `file://` page cannot fetch local files, so every data store is
   inlined into the bundle at build time by esbuild. That is why `main.js` is ~12 MB. Already noted
   at `state/copy.ts:9`, `state/corpus.ts:5`, `state/foods-curation.ts:10`, `core/schemas/log.ts:68`.
2. **The ~5 MB localStorage ceiling stands.** `core/schemas/profile.ts:29` warns that blowing it
   corrupts the user's regimen. IndexedDB and a larger quota are NOT available to us, because they
   need a real origin. Storage discipline stays a design constraint forever.
3. **No secure-context-only APIs**, no service workers.
4. **The pinned browser stays a full browser**, with the attack surface that implies. Mitigated by
   policy, not by architecture: it is for this app only and must never be used to browse the web.

If storage pressure ever becomes acute, the answer is to store less or to export more aggressively —
**never to change the origin.**

## What was compared, and why each lost

**Electron** — genuinely better on the merits it was judged by: a real origin restores `fetch()`
(the 12 MB inline tax disappears), IndexedDB replaces the 5 MB cliff, it writes no registry, its
provenance is stronger (official SHASUMS vs community builds), and a frozen shell that only loads
local files has a far smaller attack surface than a frozen browser. **It lost on the one thing that
matters most: it cannot survive its own engine.**

**Tauri** — its small size is an illusion under our constraints. It ships no engine; on Windows it
borrows Microsoft's WebView2. In Evergreen mode **Microsoft auto-updates the rendering engine on the
user's machine**, which is the exact failure this project exists to prevent, and worse than Chrome
because we would have no control at all. In Fixed Version mode it stops updating but **adds ~180 MB**
— the same weight as shipping Chromium — while adding a Rust toolchain and a dependency on Microsoft
continuing to publish that runtime. Strictly worse on every axis we care about.

## Consequence for the engine
The pinned engine must be a **real browser**, which is what
`2026-08-03-pinned-engine-acquisition.md` specifies (Ungoogled Chromium). Its job is to be the
*known-good* way to run the app — never the *only* way.

## Consequence for design
Every surface is still authored against the pinned engine's capabilities (per
`2026-08-03-pinned-engine.md`), because that is what Luneth will actually look at. This ruling does
not reinstate defensive coding for unknown browsers. It only guarantees the files remain openable.
