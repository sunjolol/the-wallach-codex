# Groundwork — the delivery & review loop

**How a phone surface actually gets in front of him, and how his verdict gets back into the repo.**

Written 2026-08-22 as independent groundwork for the mobile re-imagining
(`chronicle/decisions/2026-08-22-mobile-total-reimagining.md`). Everything below is measured on
this machine or cited to a file and line. Where I could not determine something it is in §8, not
guessed.

> A phone surface is not shipped until he has looked at it on a phone. The review loop is part of
> the deliverable, not an afterthought to it.

---

## 1. The builds — what each one is, and how long it takes

Three build entry points exist. Only two of them produce something a phone can open.

| command | wall clock (measured) | typechecks? | output | phone-reviewable |
|---|---|---|---|---|
| `node tools/build.mjs` | **6.9 s** | **yes** (`tsc --noEmit`) | `dashboard/assets/js/dist/main.js` 13.5 MB + map 18.2 MB | no — `file://` on one machine's disk |
| `node tools/build_demo_singlefile.mjs <out>.html --artifact` | **0.53 s** (537 ms, 526 ms on two consecutive runs) | **no** | one 15.32 MiB `.html` + one 15.32 MiB `.artifact.html` | **yes — the artifact** |
| `PYTHONUTF8=1 python tools/build_web.py` | **5.5 s** | no | `dist-web/` — 34.38 MB across 63 files | **yes — after an upload** |

Measured in a detached worktree of `mobile-responsive` @ `5b32e936` with `node_modules` junctioned
in from the main checkout (the method recorded in `chronicle/next-chunk.md`).

**Sequencing fact that saves time and can also cost correctness:** neither the demo builder nor the
web builder reads `dashboard/assets/js/dist/main.js`. `build_demo_singlefile.mjs` calls esbuild's
`build()` on `assets/js/src/main.ts` directly; `build_web.py` shells `tools/esbuild_web.mjs`. So you
do **not** need `build.mjs` first — but `build.mjs` is the **only** one of the three that runs
`tsc --noEmit`. A type error therefore reaches a review build silently. **Run `node tools/build.mjs`
before publishing anything he will look at**; it is 6.9 s and it is the only typecheck in the loop.

Full honest cost of one artifact review build: **~7.5 s** of compute. That is the point — rejection
has to be cheap, and at 7.5 s it is.

**The demo builder lives only on `mobile-responsive`** (`git log --all -- tools/build_demo_singlefile.mjs`
→ `5b32e936`, `0c0aa575`). It is not on `master`. Whatever branch the redesign lands on must carry it.

---

## 2. The artifact loop, precisely

### The live target
```
codex-mobile-demo.artifact
https://claude.ai/code/artifact/7c8a1858-7f04-4e2e-a7d4-9bf0f9cce92b
```
Confirmed present and last updated 2026-08-23 via the Artifact tool's own listing. **Private** —
artifacts start private and are shared only if he chooses.

### The loop
1. **Check out the branch the mobile work is on.** A detached worktree keeps `master` untouched:
   `git worktree add --detach <path> <branch>`, then a `node_modules` junction
   (PowerShell `New-Item -ItemType Junction`; `cmd //c mklink` fails from bash here).
2. **`node tools/build.mjs`** — the typecheck gate. 6.9 s.
3. **`node tools/build_demo_singlefile.mjs <ABSOLUTE-OUT>.html --artifact`** — 0.53 s. Writes
   `<out>.html` (a whole document, openable from disk) and `<out>.artifact.html` (page **content
   only**, for a host that supplies its own document shell).
   ⚠ **Use an absolute path outside the repo.** The builder's default is `tmp-demo/codex-mobile-demo.html`
   and **`tmp-demo/` is not gitignored** — verified: `git check-ignore -v tmp-demo/x.html` exits 1.
   The default drops a ~15 MB untracked file into the working tree.
4. **Publish `<out>.artifact.html`** with the Artifact tool, passing
   `url: https://claude.ai/code/artifact/7c8a1858-7f04-4e2e-a7d4-9bf0f9cce92b`.
   **Publishing to the same URL redeploys in place and his link keeps working.** Publishing without
   `url` mints a *new* artifact and silently strands him on the old one.
5. **Send him the link with the exact tap path** for what changed. Never "have a look".

### Things that will bite in this loop

**Size, and it is tighter than it reads.** Measured on the current branch build:

| | bytes | |
|---|---|---|
| document `<out>.html` | 16,064,095 | 15.32 MiB |
| **`<out>.artifact.html`** (the one published) | **16,064,627** | **15.32 MiB** |
| 16 MiB ceiling | 16,777,216 | |
| headroom | **712,589** | **4.2 %** |

Two problems with that.

- **The builder's guard checks the wrong file.** `build_demo_singlefile.mjs` compares `size` of the
  *document* against `16 * 1048576` and exits 1 if over. It never measures the `.artifact.html`,
  which is **532 bytes larger** (the injected viewport / `<html>`-attribute shim). Today that is
  harmless; at the ceiling it is a build that says "fits" about a file it did not weigh.
- **MiB vs MB is undetermined and it decides whether we have headroom at all.** If the host's
  "16 MB" is decimal (16,000,000), the current artifact is already **64,627 bytes over**. See §8.

**Where the 15.32 MiB comes from** (builder's own report): bundle 10.90 MB · stylesheets 3.44 MB
(12 sheets, 12 font refs embedded, 2 dead `@font-face` dropped) · avatars 25 at 0.97 MB. The
2026-08-22 build-log records 14.03 MB before commit `5b32e936` inlined Playfair and the favicons;
Playfair's two faces are 582,236 bytes raw → ~776 KB as base64, which accounts for the jump. **The
growth is structural: the app's data grows every round.** `dashboard/assets/data/*.json` (excluding
the Creator's Log) is 10,428,060 B on `master` vs 10,416,778 B on the branch — the branch is
*behind*, and master's data is already 11,282 B heavier. The 712 KB of headroom is a budget, not a
cushion.

**The artifact form is not the app.** `--artifact` strips the CSP meta, the viewport meta, the
charset meta and the `<title>`, then re-installs the viewport and every `<html>` attribute from a JS
shim that runs before anything else parses (builder §6). Theme, accent and the phone nav shell are
all selected off `<html>` attributes, so that shim is load-bearing — it was added because stripping
the wrapper rendered the app **with no nav shell at all** while every other check passed. Treat any
difference from `file://` behaviour as suspect-the-shim first.

**Housekeeping on the gallery.**

- The artifact's gallery name is currently **`codex-mobile-demo.artifact`** — the filename fallback,
  because the builder deliberately strips `<title>` so a review build is not mistaken for the
  product. The fix is to pass an explicit `title` at publish time (e.g. *Codex Phone Review*), not to
  put the title back in the file.
- **A second, stale mobile artifact exists in his gallery:** *Codex Goes Mobile*
  (`98d8ca16-a577-465c-90e2-b89f079aa9f5`, 2026-08-21). He can open the wrong one. Retire or clearly
  re-title it before the next review round.
- **Never republish while he is on it** (standing rule: never republish a surface in use). Ask, or
  wait for his answer on the current batch, before pushing batch N+1 to the same URL.

---

## 3. The two stated absences — one of them is described wrongly

The builder's header and `chronicle/next-chunk.md` both state two absences. **One of the two stated
symptoms is not what the code does.**

### 3a. The Creator's Log — the demo does not lie about a count, it hides the surface

**Measured:** `dashboard/assets/data/creators-log-embed.json` — **931 entries, 2,674,470 bytes
(2.55 MiB)** on `master`. The builder's comment says 2.45 MB; it is a stale measurement of a file
that grows on every round-close.

**The stated symptom is wrong.** `dashboard/assets/js/src/views/profile.ts:134-140`:

```ts
function renderLog(): string {
  const entries = getEntries();
  if (entries.length === 0) {
    return '';
  }
  return `<details class="pf-log"><summary class="pf-log__sum">Creator's Log · <b>${entries.length}</b> entries</summary>…`;
}
```

With the log stubbed to `[]`, `renderLog()` returns the empty string. **The profile modal does not
say "0 entries" — the entire `<details class="pf-log">` block is absent.** He sees no Creator's Log
at all. The builder header, `next-chunk.md` and the 2026-08-22 build-log line all describe a false
count that is never rendered.

That is worse for a review build, not better: a **silently missing** surface cannot be reviewed, and
its absence is indistinguishable from a design decision he might otherwise object to.

**Cost of just including it:** +2,674,470 B → artifact ≈ 18.7 MB, roughly **2.0 MB over** the 16 MiB
ceiling. Not possible. That is arithmetic, not a judgement.

**Proposed honest fix — do both halves:**

1. **Ship the newest entries to a BYTE budget, not an entry count.** Mean entry is
   2,674,470 / 931 = **2,873 B**, but the distribution is violently skewed (the newest entries are
   multi-kilobyte build-log paragraphs), so a fixed *entry* count would blow the budget on a bad day.
   Reserve headroom for data growth and spend **400 KB** → roughly **140 recent entries** at the
   current mean, fewer if they run long. That gives him a genuinely long, genuinely scrolling list —
   which is exactly what has to be reviewed on a phone. Cost: 400 KB of a 712 KB budget.
2. **Say so on the surface.** A footer row inside the `<details>`: *"Showing 140 of 931 — review
   build."* Cost: ~120 bytes.

**Implement it in the builder, not in app source.** The existing `stubLog` esbuild plugin already
intercepts `creators-log-embed.json`; make it emit a truncated array plus a marker the demo-only DOM
shim reads to append the footer — the same containment pattern the avatar shim already uses
(builder §3). No demo-only branch enters `views/profile.ts`.

### 3b. The OCR engine — including it is impossible, and the current failure message lies

**Measured minimum set for the http path** (the artifact runs over https, so the `file://`
self-contained worker is not the one it would use):

| file | bytes |
|---|---|
| `assets/vendor/tesseract/lang-data/eng.traineddata.gz` | 12,821,300 |
| `assets/vendor/tesseract/tesseract-core-simd-lstm.wasm.js` | 3,938,657 |
| `assets/vendor/tesseract/worker.min.js` | 123,724 |
| `assets/vendor/tesseract/tesseract.min.js` | 66,695 |
| **total raw** | **16,950,376 (16.17 MiB)** |
| **as base64 (×1.333)** | **≈ 22.6 MB** |

The artifact is already at 15.32 MiB. **Including OCR is arithmetically impossible** — the minimum
engine alone exceeds the whole page budget before the app is added. (`worker-offline.js`, the
bundled-model `file://` worker, is 17,219,896 B on its own; the whole `assets/vendor/` tree is 38 MB.)

**And the failure it produces today is a lie.** Traced through the source:

1. `state/ocr.ts:305` — `const onFile = window.location.protocol === 'file:'` → **false** on the artifact.
2. `state/ocr.ts:277-290` — `assertModelReachable()` does `await fetch(TRAINEDDATA_URL)` inside a
   `try`, and only a **throw** is caught. A 404 **resolves**, so `modelReachable = true` and it
   proceeds. `OCR_MODEL_UNREACHABLE` is never raised.
3. `state/ocr.ts:121-139` — `loadTesseract()` injects
   `<script src="./assets/vendor/tesseract/tesseract.min.js">`; the file is absent, `onerror` fires,
   and it rejects with a **developer** message: *"Could not load local OCR engine. Run
   `node tools/vendor-tesseract.js` once to vendor Tesseract files…"*.
4. `views/scanner.ts:149-157` — `scanErrorMessage()` matches neither `OCR_MODEL_UNREACHABLE` nor
   `OCR_TIMEOUT`, so it falls through to the default:
   **"Something went wrong while reading that image. Try a clearer photo, or scan again."**

**The review build tells him his photo was bad.** He re-shoots, it fails again, and he concludes the
Scanner is broken — a rejection aimed at a defect that does not exist in the real app. Given he has
already called the Scanner "scuffed", this is the single most expensive thing in the current loop.

*(Caveat, §8: I did not drive the artifact host to confirm it returns a 404 for an unknown relative
path. If claude.ai answers 200 with the artifact shell, the `<script>` loads HTML as JS and throws a
syntax error instead — different route, same lying end state.)*

**Proposed honest fix — again both halves:**

1. **A builder shim that disables the photo path and names the reason.** In the demo build only, set
   a flag the Scanner's upload/camera control reads, rendering it disabled with:
   *"Photo scanning is off in this review build — the 16.9 MB OCR engine was stripped to fit. Paste
   or type a label instead."* Cost: ~300 bytes. This reviews the thing that actually matters on the
   Scanner — layout, the paste path, the verdict engine — without a false statement.
2. **Route the photo-scan review to the web build** (§4). OCR genuinely works there: the 2026-08-21
   build-log records the live model returning 200, `Content-Encoding` absent, gzip magic
   `1f 8b 08 08` intact, all 12,821,300 bytes.

**Separately, and this belongs to the redesign, not the loop:** even on the web build the model is
12.8 MB over cellular. "The 16.9 MB OCR model over cellular" is already a **deferred** item in
`chronicle/build-log.md:1226`. A phone user tapping *scan a label* on mobile data currently starts a
12.8 MB download. That is a mobile design problem the re-imagining has to answer.

---

## 4. Artifact vs. the web build as the review vehicle

**Neither is right for everything. Split by surface.**

| | demo artifact | web build (nutrientcodex.com) |
|---|---|---|
| privacy | **private** by default, unlisted | **public** — reviewing there publishes the work |
| rebuild → in his hands | **~7.5 s** + one publish | ~12.4 s + a **manual FTP / File-Manager upload** of 34.38 MB across 63 files |
| link stability | same URL, republished in place | same URL |
| first load | **15.32 MiB, every time** — one blob, nothing cacheable by part | **2.72 MB raw** (html + 12 css + bundle); build-log 2026-08-21 measured **0.92 MB on the wire** live, brotli |
| Scanner photo path | **impossible** (§3b) | **works** — verified on the live host |
| Creator's Log | truncated at best (§3a) | **real** — shipped as a content-hashed split artifact, 958 KB |
| fidelity | a *third* form: host shell, CSP/viewport/title stripped and re-installed by a JS shim | **one of the two real distributions** — what he reviews is what ships |
| host risk | none | three traps, below |

**The 17× first-load gap is the sharpest practical point.** On a phone on cellular, a 15.32 MiB
artifact is the entire review budget before he has looked at anything; the web build's first paint is
under a megabyte. Against that, the artifact is private and rebuilds in seconds, and **the whole
reason `build_demo_singlefile.mjs` exists is that pushing a work-in-progress to nutrientcodex.com
would publish it** (its header, lines 5-9).

### Recommendation

- **Artifact for everything except the Scanner photo path and the full Creator's Log.** Private,
  7.5 s, and rejection stays cheap — which is the property the loop is designed around.
- **Web build only** (a) once the redesign is far enough along that publishing it is fine, or (b) via
  a staging path he approves; and specifically for **step 5** of the review script.
- **A third option worth putting to him, which I cannot verify from here:** an unlinked subdirectory
  (`nutrientcodex.com/m/`) or a SiteGround staging subdomain. A subdirectory is still publicly
  reachable, needs its own `.htaccess` / robots handling and a second 34 MB copy of the tree. Whether
  his plan offers real staging is a question for him, not something to assume.

### The three SiteGround traps — sourced

**1. NGINX Direct Delivery.** `tools/build_web.py` (the `★★` block immediately above the `HTACCESS`
template) and `chronicle/build-log.md:1177`. SiteGround fronts Apache with NGINX and by default
serves static files **directly, bypassing `.htaccess` entirely** — every rule silently does nothing.
`index.html` then returns `Cache-Control: max-age=15552000` (180 days), pinning a returning visitor
to one build for six months and defeating the content-hashing outright. Tell: `Server: nginx` with
none of our own headers present. One-line proof:

```
curl -sI https://nutrientcodex.com/ | grep -iE 'x-content-type-options|referrer-policy'
```

Fix: Site Tools → Speed → Caching → **NGINX Direct Delivery OFF**. **It is a host setting and a host
setting can revert without touching this repo.**

**2. The `.gz` trap.** The `<FilesMatch "\.traineddata\.gz$">` block in the generated `.htaccess`
(`RemoveEncoding .gz` / `ForceType application/octet-stream` / `Header unset Content-Encoding`).
tesseract.js fetches `eng.traineddata.gz` and gunzips it **itself**; if the host tags the response
`Content-Encoding: gzip` the browser gunzips it in transit and tesseract then fails on already-plain
data — **the Scanner breaks on the web only**, and the download is unaffected and looks fine.

```
curl -sI https://nutrientcodex.com/assets/vendor/tesseract/lang-data/eng.traineddata.gz
# Content-Encoding must be ABSENT
```

⚠ Check the **decoded** body, not raw wire bytes. `build-log.md:1216` records that the first draft of
this check read the raw stream, which the trap leaves untouched — it passed cheerfully on exactly the
failure it existed to catch.

**3. The proxy cache.** `chronicle/build-log.md:1206`. On 2026-08-22 the live site read **2,611
sourced claims** where the build read **2,601** — a fresh bundle hydrating from the *previous*
deploy's split artifacts, with no error anywhere. Headers: `x-proxy-cache: HIT`, stale
`Last-Modified`, an ETag sizing the old file (0x2d44c5 = 2,966,725 B against the new 2,953,976 B).
**`fetch(url, {cache:'reload'})` and `{cache:'no-store'}` both still returned HIT** — those govern
the *browser's* cache, not an upstream proxy's object store. A manual flush cleared it, but a step
you can silently forget is not a fix. **Fixed by content-hashing the three split artifacts**:
`tools/esbuild_web.mjs` owns the hash and bakes the map in as `__SPLIT_MANIFEST__`;
`tools/build_web.py` reads the sidecar manifest and hard-fails if the bundle names a file it did not
write, or a name that does not carry that file's hash. One hasher, never two.

### The two probes that bracket a deploy

- **Before upload:** `node tools/probes/render_probe_web_build.js` — serves `dist-web/` over a real
  http server on an OS-chosen port and drives it. 13 checks. Its method is a *comparison* between the
  two distributions, not an assertion about a literal.
- **After upload:** `node tools/probes/render_probe_live_host.js [url]` — 33 checks, exit 0 pass /
  1 fail / 2 host did not resolve. Every header assertion is **parsed out of the `HTACCESS` template
  in `build_web.py`** rather than retyped, so the contract lives in one place. It cannot be an
  invariant (R7) — a gate reaching a third-party host would make the board's colour depend on
  SiteGround and on whether this machine has wifi.
- **Neither can enumerate the superseded artifacts piling up in `public_html/`** (~9 MB and growing;
  an overlay deploy never deletes, and `Options -Indexes` means there is no listing to read).

**Deploy hygiene note:** `dist-web.zip` sits at the repo root — **25,953,578 B, dated 2026-08-21
00:17** — two days stale, produced by no tool in `tools/`, and referenced nowhere in the repo. The
upload step is entirely manual and entirely undocumented. If the web build becomes a review vehicle,
that step needs writing down before it becomes the thing that goes wrong at 1 a.m.

---

## 5. The review script

### The rules the script is built on

1. **Small batches, his review every time** — the project's standing rule, and the direct lesson of
   2026-08-22, where six surfaces were handed over at once and came back as one undifferentiated
   "none of this feels like a proper mobile app". A batch that big cannot be diagnosed.
2. **One question per step.** Answerable in a sentence.
3. **Never ask "does this look good?"** Ask about the specific thing this batch changed.
4. **Phrase it so "no" is cheap.** Tell him explicitly: *one word is enough — name the surface and
   the word.* A rejection that costs him a paragraph will arrive late, or not at all.
5. **Give him the tap path.** Exactly where to go and what to do. Never "have a look".
6. **One URL, forever.** Batch N+1 republishes over batch N. Never mint a second link.
7. **Pre-flight is mine, not his.** Before any publish: `node tools/build.mjs` clean, the mobile
   probe (or its successor) green, and **screenshots at 375×667 and 393×852 that I have actually
   looked at**. A DOM probe is not a visual check — and a green probe is what produced the rejection
   we are recovering from.

### The ordered list

Shell first, because everything else sits inside it. Then Coverage — the one surface he did **not**
name — because establishing the bar on a surface he tolerates is the cheapest place to find out
whether the new design language lands at all. Then the three he named, worst-diagnosed last.

| # | what goes in front of him | the one question |
|---|---|---|
| 0 | *(no human)* build + typecheck + probe + screenshots I have read | — |
| 1 | **The shell alone.** Nav, topbar, one placeholder screen. Nothing else built. | "Tap between every destination. Does moving around this app feel right for a phone — yes, or what's wrong?" |
| 2 | **Coverage.** The map of gaps, one surface, complete. | "Can you read this at arm's length and tell what you're missing?" |
| 3 | **Regimen.** | "You called this scuffed. Is it still?" |
| 4 | **Scanner — paste / type path only**, with the OCR shim from §3b in place. | "Photo scanning is off in this build and it says so. Everything else — is the flow from label to verdict right?" |
| 5 | **Scanner — the photo path**, on the web build or an approved staging path. | "Point your camera at a real label. Does it work, and how long did the wait feel?" |
| 6 | **Knowledge — home + explore.** | "You called this cheap and poorly thought out. What specifically is cheap about it now?" |
| 7 | **Knowledge — the deep surfaces**, split across at least two batches: (a) entity page + topic, (b) foods + food sheet + ORAC, (c) products + corpus. | per batch: "Anything here that still reads as an afterthought?" |
| 8 | **Search / Ask Wallach, with a real on-screen keyboard up.** | "With the keyboard up, type a question. How much of the answer can you see without dismissing the keyboard?" |
| 9 | **Profile, theme, accent** — including the Creator's Log at whatever truncation ships. | "Does the log read like a real feature here, or like a list that got squeezed in?" |
| 10 | **The whole app, end to end, one sitting, on cellular if he'll do it.** | "Does this feel like a proper mobile app now?" |

**Notes on specific steps.**

- **Step 6 is deliberately open.** "Cheap" is the one verdict we have no diagnosis for, and a closed
  question there would just get a yes/no about a theory of mine. Everywhere else the question is
  closed, because closed questions are cheaper to answer.
- **Steps 3 and 6 quote his own words back.** A direct callback makes the answer specific and lets him
  say "no, that's fixed, but X" instead of re-issuing the same global verdict.
- **Step 8 is the standing blocker and it needs hardware.** `next-chunk.md`: the audit measured a
  **168 px letterbox showing 7.8 % of an answer set** with a keyboard up, and a keyboard cannot be
  emulated headlessly. Nothing on this machine can clear it. It must be a numbered review step or it
  will be missed again.
- **Step 10's question is the only place that sentence is asked.** It is his rejection sentence; it
  should be the acceptance sentence, and asking it earlier invites a global verdict on a partial app —
  which is exactly what went wrong.

### The standing instruction to send with batch 1

> One word is enough. Name the surface and what's wrong with it — "regimen, cramped" is a complete
> answer and more useful than a paragraph. If it's fine, "fine" is a complete answer too.

---

## 6. Capturing his verdict so the next session inherits it

### The trap, and it is a real one

**`chronicle/next-chunk.md` is gitignored.** `.gitignore`: *"Rolling per-session development
hand-off. Regenerated locally each session."* `chronicle/README.md` says the same. **A verdict
recorded only there does not exist in the repository** — it lives on one machine until the next
session overwrites the file.

The 2026-08-22 verdict survived only because it was written to **three** places, two of them
committed:

- `chronicle/build-log.md:1226` (committed)
- `chronicle/decisions/2026-08-22-mobile-total-reimagining.md` (committed)
- `chronicle/next-chunk.md` (local, and the copy that will vanish)

### The recipe, per review step

1. **Paste his words byte-exact into a committed file.** Proposed home:
   `chronicle/mobile-redesign/verdicts/<date>-<step-slug>.md`, **append-only**, one block per review
   round, containing:
   - the artifact URL **and the sha256 of the published `.artifact.html`** — so the words attach to a
     specific build rather than to "the demo";
   - **the question I asked, verbatim** (a verdict without its question is un-interpretable);
   - **his answer, verbatim, in a blockquote, with no paraphrase in the same block**;
   - a separately headed section for my inference, explicitly labelled as inference. The 2026-08-22
     build-log entry models this exactly: *"MY READ FOR THE NEXT SESSION, recorded as inference and
     explicitly not as his words"*;
   - **disposition** — what changed, what was deferred, what was ruled.

   *(This directory is a proposal. The 2026-08-22 decision doc lists inventory / ia / surfaces /
   system / groundwork and does not name a verdicts folder — someone should confirm it rather than
   assume it.)*
2. **Route the write through `python tools/safe_write.py append <path> --payload-stdin`.** Never a
   direct write; hooks block it and the byte-readback is the point.
3. **At round-close:** one `chronicle/build-log.md` line and one
   `PYTHONUTF8=1 python tools/creators_log.py append …` entry. The Creator's Log is append-only and
   has no delete path.
4. **`next-chunk.md` carries a POINTER to the verdicts file, never the only copy.** It may lead with
   the quote for the next session's benefit — it just must not be the only place the quote exists.
5. **A rejection gets its own `chronicle/decisions/` doc** when it changes the direction of the work,
   as 2026-08-22 did.

### Why verbatim, in the project's own words

> "Recorded verbatim because a paraphrase would soften it, and the point is that it should not be
> softened." — `chronicle/build-log.md:1226`

---

## 7. Defects found while doing this groundwork

Each is checkable. None was fixed here — this is groundwork, not a patch.

1. **`tmp-demo/` is not gitignored.** `git check-ignore -v tmp-demo/x.html` → exit 1. The demo
   builder's default output path drops a ~15 MB untracked file into the working tree.
2. **The demo builder's 16 MB guard weighs the wrong file.** It checks the document (16,064,095 B)
   and never the `.artifact.html` it publishes (16,064,627 B, 532 B larger).
3. **`build_demo_singlefile.mjs`'s own header says it "is not committed".** It is:
   `git ls-tree mobile-responsive --name-only tools/` lists it, on commits `0c0aa575` and
   `5b32e936`. A comment out of sync with its code (§00.B.3).
4. **The retracted font claim still stands in `tools/build_web.py:36-37`** — *"exactly 7 of the 13
   faces. The other 6 (Merriweather ×2 = 9.16 MB, Playfair ×2, Crimson Pro ×2) are never
   requested"*. Both halves are now false: `ls dashboard/assets/fonts/*.ttf | wc -l` → **11**
   (Merriweather was deleted in `a9b0513b`), and `build-log.md:1226` explicitly retracts the Playfair
   half. **That same build-log entry claims "all four [homes] are corrected" — this one was not.**
   The ledger is wrong about its own fix.
5. **`dist-web.zip`** — 25,953,578 B at the repo root, dated 2026-08-21 00:17, built by no tool in
   `tools/` and referenced nowhere. The upload step is manual and undocumented.
6. **Two mobile artifacts in his gallery** — the current one and *Codex Goes Mobile*
   (`98d8ca16-…`, 2026-08-21). He can open the wrong one.
7. **The artifact's gallery name is `codex-mobile-demo.artifact`** — a filename fallback. Pass an
   explicit `title` at publish time.
8. **`assertModelReachable()` treats a 404 as reachable** (`state/ocr.ts:277-290`) — `fetch` only
   rejects on network failure. That is why the demo's OCR failure routes to the wrong message (§3b),
   and it would equally mis-report a genuinely 404'd model on the live web build.

---

## 8. What I could not determine — stated, not guessed

1. **Whether the artifact host's "16 MB" is MiB (16,777,216) or MB (16,000,000).** It decides whether
   the current 16,064,627-byte artifact has 712 KB of headroom or is already 64,627 B over. Nothing
   in this repo answers it; the host's own documentation does. **Establish this before spending the
   budget.**
2. **What claude.ai returns for an unknown relative path under an artifact URL** — a 404, or the
   artifact shell with a 200. It decides which of two routes the Scanner's OCR failure takes. Both
   end in the same wrong message, so the §3b fix holds either way, but the trace is incomplete.
3. **Whether the Artifact viewer's sandbox permits `document.createElement('script')` injection at
   all** (`state/ocr.ts:128`). If it is blocked outright, the failure route differs again.
4. **Whether his SiteGround plan offers a real staging subdomain.** The middle-ground review vehicle
   in §4 depends on it and I have no way to check.
5. **Actual load time for a 15.32 MiB artifact on his phone and his connection.** Never measured, by
   anyone. It is a plausible contributor to "feels cheap" that has never been ruled in or out.
6. **Why `creators-log-embed.json` differs between `master` (2,674,470 B) and the `mobile-responsive`
   worktree (2,680,690 B)** when the branch is four commits *behind*. Probably retention pruning; not
   investigated.
7. **Whether a successor to `render_probe_mobile.js` should gate anything at all in the new design.**
   Out of scope here, but the standing lesson is that its green board is what produced a false
   "done" — whoever rebuilds it should write into its header what it cannot see.
