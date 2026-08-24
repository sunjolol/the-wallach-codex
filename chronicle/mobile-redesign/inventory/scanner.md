# Scanner — feature inventory

_Read in full: `dashboard/assets/js/src/views/scanner.ts` (1347 lines),
`dashboard/assets/styles/workspace-scanner.css` (444), plus the engine layer the surface is a
window onto: `state/scanner.ts` (894), `state/ocr.ts` (888), `core/schemas/scanner.ts`,
`core/schemas/scanner-corpus.ts`, `core/schemas/ocr-dict.ts`,
`dashboard/assets/data/scanner-corpus-data.json`, `dashboard/assets/data/ocr-dict-data.json`._

This is the CONTRACT for the mobile rebuild. Anything not written down here can be silently
dropped. The Scanner is the most stateful surface in the app and the one with the most
non-obvious rules; several of its behaviours are deliberately counter-intuitive and are called
out as **SUBTLE** below.

---

## Destinations & states

The Scanner never navigates. It is one mount (`#workspace-scanner-mount`) whose `innerHTML` is
replaced wholesale by `render()`. There is no history entry, no URL, no back affordance — the
browser Back button does nothing inside the flow.

The frame is always the same:

```
<div class="vd">
  <div class="coverage-grid">
    <div class="vd-main"> ...step blocks... </div>
    <aside class="vd-rail"> Saved shelf + Recent captures </aside>
  </div>
</div>
```

`renderRail()` runs on **every** paint, in every state — the Saved shelf is meant to be
reachable at all times.

Internal state is four values (`ScState = 'idle' | 'scanning' | 'confirming' | 'result'`) plus
`label`, `result`, `fileName`, `imageDataUrl`, `scanError`, `resultOrigin`, `reopenedSavedId`,
`dismissed:Set`, `removedRows:Set`.

### The Step-1 card is permanent
`renderScan()` is emitted in **every** state, including `result`. Step 1 never collapses or
scrolls away; Step 2/3 append below it. On a phone this is dead vertical cost above the actual
task on every single screen.

| # | State | Composition | Notes |
|---|---|---|---|
| S1 | **Idle** | `renderScan(idle)` only | Badge `1` is-active, chip "Start here". Contains: `+ New Scan` primary, `or add it by hand` link, drop zone (a `<button>`), and the paste-an-ingredients block. |
| S2 | **Idle + scan error** | `renderScanError(msg)` **above** `renderScan(idle)` | `role="alert"`. Three copy variants (see Failure modes). |
| S3 | **Scanning** | `renderScan(scanning)` -> `renderScanning()` | Badge `1` is-active, chip "Reading...". `New Scan` button is rendered but `disabled`. Drop zone replaced by the 3-stage progress panel. |
| S4 | **Confirming — scanned** | `renderScan(done, typed=false)` + `renderConfirm(typed=false)` | Step 1 shows a 56x56 thumbnail + filename + "checkmark decoded locally · reads confirmed below" + `Yours · user-scanned` chip. Step 2 is `.vd-step--hero` (accent left border, rise animation). |
| S5 | **Confirming — typed (hand-entry)** | `renderScan(done, typed=true)` + `renderConfirm(typed=true)` | No thumbnail. "No photo — entered by hand" / "nothing was read by OCR" / `Yours · typed in`. **Every "what we read" string flips to "what you entered"** — see Copy. |
| S6 | **Result — verdict** | `renderScan(done)` + `renderResult(result, origin)` | Three verdicts x three origins (`scan` \| `saved` \| `recent`). Origin only changes the Reject button label. |
| S7 | **Result — unreadable** | `renderScan(done)` + `renderUnreadable(typed)` | Fires only when `sparseNutrients && sparseIngredients`. Two copy variants (photo vs typed). No verdict is shown at all. |
| S8 | **Result from the paste-checker** | same as S6 but `label.entry='typed'`, `name='Pasted ingredients'`, `imageDataUrl=null` | Skips Confirm entirely — paste goes straight to a verdict. |
| S9 | **Lightbox overlay** | `.vd-lightbox` appended to `document.body` | `role="dialog" aria-modal="true"`, full-size photo, close x, scrim tap, Escape. Deliberately outside the view root so a re-render can't wipe it. |
| S10 | **Rail — Saved shelf** | empty or <=100 rows | Empty copy: "Nothing saved yet." / "Hit "Save for later" on a verdict." |
| S11 | **Rail — Recent captures** | empty or <=5 rows | Empty copy: "No scans yet." / "Your captures land here." |

### Transient in-place states (no re-render)
- **Adopted**: the `Add to regimen` button rewrites its own `textContent` to `Added to regimen`
  or `Already saved — bumped to N/day` and sets `disabled`.
- **Saved**: the `Save for later` button becomes `Saved`, `disabled`, then `refreshRail()`.
- **Confirm scoring error**: a `.vd-cf__err` `role="alert"` line is appended into the CTA row.
- **Suggestion strip dismissed** (`x keep`): the `.vd-sug` element is removed from the row.
- **Row deleted**: the `.vd-nrow` is removed from the DOM (no re-render) and the tally recounted.
- **Suspect panel refresh**: `[data-ocr-host]` innerHTML swapped, count text updated.
- **Nutrient row re-evaluation**: glyph / status / suggestion strip rewritten in place; the
  input itself is never touched so the caret survives.
- **OCR progress tick**: stepper chips + bar + message + pct updated in place (fires many times
  per second — a re-render here would be catastrophic).

**SUBTLE:** because Adopt/Save mutate their own button text rather than re-render, ANY subsequent
full `render()` silently resets them to their un-pressed state. The rebuild must decide whether
that latch is state or decoration.

---

## Controls

Touch-hostile column: **YES** = fails today on a phone (target < 44px, hover-only, pointer-only,
or keyboard-dead).

| Control | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| `+ New Scan` (`[data-sc-upload]`) | `pickImage()` — creates an ad-hoc `<input type=file accept="image/*">` and `.click()`s it | Step 1 idle | No (44px+ via the old mobile patch) — but **there is no `capture` attribute and no explicit "Take photo" path**. Camera only if the OS sheet offers it. |
| `+ New Scan` (`[data-sc-new]`) | same `pickImage()`; supersedes the current scan | Step 1 done/confirming/result | No |
| `+ New Scan` (disabled) | inert during OCR | Step 1 scanning | n/a |
| `or add it by hand` (`[data-sc-manual]`) | Creates `{name:'', entry:'typed', nutrients:[{name:'',unit:''}], ingredients:''}`, jumps to `confirming`, focuses the name field | Step 1 idle, under New Scan | **YES** — underlined micro text link, ~10-11px, `.vd-manual` has zero padding; hover-only colour feedback |
| Drop zone (`.vd-drop[data-sc-upload]`) | Whole zone is a `<button>` -> `pickImage()` | Step 1 idle | Target fine; **its own copy ("or drop / paste an image here") is a desktop lie on a phone** |
| Drag & drop (`dragover`/`drop` on the container) | `handleImageFile(dataTransfer.files[0])` | container-wide | **YES — cannot exist on touch** |
| Clipboard paste (`document` `paste`) | Scans the first `image/*` clipboard item; guarded by `container.offsetParent === null` so a hidden Scanner never starts a background OCR | document-level | **YES — no equivalent on iOS/Android** |
| Ingredients paste box (`[data-sc-paste]`) | `<textarea rows=3 maxlength=4000 spellcheck=false>` | Step 1 idle, below the drop zone | `resize: vertical` handle is pointer-only |
| `Check ingredients` (`[data-sc-paste-check]`) | Builds a `typed` label named "Pasted ingredients", runs `runScan`, jumps straight to Result | Step 1 idle | No |
| Photo thumbnail (`[data-sc-zoom]`) | `openLightbox()` | Step 1 done card (56x56) **and** the Confirm photo panel (<=216px) | 56px OK; `cursor: zoom-in`, hover `translateY`/`brightness` are dead on touch; `title=` tooltip dead |
| Lightbox close (`[data-lb-close]`) | `closeLightbox()` | fixed top-right of `.vd-lightbox` | 34px — **below 44** |
| Lightbox scrim | click on the overlay itself closes | full-screen | No |
| Escape key | closes the lightbox (`AbortController`-scoped listener) | document | **YES — no hardware key on a phone** (scrim + x still work) |
| Product name (`[data-sc-name]`) | `<input maxlength=80 spellcheck=false>`; read back by `readCorrectedLabel` | Confirm, first section | No |
| Nutrient name (`[data-nedit="i"]`) | `<input maxlength=60>`; 150 ms debounced `reevaluateNutrientRow` | each Confirm row | Field is fine; **the row grid squeezes it — see Desktop-only assumptions** |
| Amount (`[data-aedit="i"]`) | `<input type=text inputmode=decimal maxlength=12>`; parsed with `Number.parseFloat`, falls back to the stored amount if NaN | each Confirm row | 83px wide, ~26px tall — **YES** |
| Unit (`[data-uedit="i"]`) | `<input maxlength=8>`; on **change** (not input) `unitAbbreviation()` rewrites a single-word long form ("milligrams" -> "mg"); multi-word ("mcg RAE", "million CFU") is left alone | each Confirm row | 83px wide — **YES** |
| Row delete (`[data-ndel="i"]`) | Adds the ORIGINAL index to `removedRows`, removes the `.vd-nrow` from the DOM, recounts. No re-render (would lose in-flight edits) | right edge of each Confirm row | **YES — `--uic-size: 24px`, 12px glyph** |
| `Add a row we missed` / `Add another row` (`[data-nadd]`) | Commits current edits via `readCorrectedLabel(true)`, appends a blank nutrient, clears `removedRows`, re-renders, focuses the new name input | below the nutrient list | ~30px tall pill — **YES** |
| Suggestion chip (`[data-nfix]`, `[data-nfix-val]`) | Writes the candidate into the row's name input and re-evaluates in place | `.vd-sug` strip under a warned row; up to 4, first is `.is-best` with a CSS `::after` "best" tag | ~28px tall — **YES** |
| `x keep` (`[data-nkeep]`) | Removes the whole `.vd-sug` strip (keeps the read as typed) | end of the suggestion strip | **YES** |
| Ingredients line (`[data-ing]`) | `<textarea rows=2 maxlength=4000>`, `min-height:60px`, `resize:vertical`; 250 ms debounced `refreshSuspects` | Confirm, second section | resize handle pointer-only |
| Suspect chip (`[data-ifix]`, `[data-ifix-val]`) | `ta.value = ta.value.replace(from, to)` — **first occurrence only, case-sensitive** — then refresh | `.vd-ocr__card`, up to 4 chips | **YES** (~26px) |
| Dismiss suspect (`[data-idismiss]`) | Adds the lowercased word to `dismissed`, refreshes | x on each suspect card | **YES — `--uic-size: 24px`** |
| `Confirm scan -> verdict` / `Judge what I entered` (`[data-sc-confirm]`) | `readCorrectedLabel()` -> if nothing to judge use `scoreLabel` (no history write) else `runScan` (writes history) -> Result | Confirm CTA row | No |
| Confirm close (`[data-sc-clear]`) | Resets everything to idle | `.ui-close` top-right of the Confirm step header | 34px — **below 44** |
| Verdict close (`[data-sc-clear]`) | same reset | `.vd-card__top` right | 34px — **below 44** |
| `Add to regimen` (`[data-sc-adopt]`) | Mints a `RegimenItem` with `provenance: 'user_typed'` or `'user_scanned'`, calls `addOrBumpRegimenItem` (adds, or bumps an existing same-name item's `scaling_factor` by 1), then latches the button | verdict card footer | No |
| `Save for later` (`[data-sc-save]`) | `saveScan(label, result)` -> durable shelf; latches; `refreshRail()` | verdict card footer | No |
| `Reject` / `Delete` (`[data-sc-reject]`) | Reject: reset to idle. Delete (only when `resultOrigin === 'saved'`): `removeSaved(id)` **then** reset | verdict card footer | No |
| `Edit the reads` / `Add the details` (`[data-sc-edit]`) | Returns to `confirming` with the current label | unreadable card | No |
| `Scan a clearer image` / `Scan a photo instead` (`[data-sc-upload]`) | `pickImage()` | unreadable card | No |
| `Try again` (`[data-sc-upload]`) | `pickImage()` | scan-error card | No |
| Rail row (`[data-sc-open]` + `data-sc-src` + `data-sc-idx`) | Re-scores the stored label with `scoreLabel` against the CURRENT regimen and opens Result | every Saved / Recent row | **YES — `role="button" tabindex="0"` but there is NO keydown handler; Enter/Space do nothing.** Row height reaches ~44px only by accident |
| Remove from saved (`[data-sc-unsave]`) | `removeSaved(id)` + `refreshRail()` | x on Saved rows only (`padding-right:44px` gutter reserves the space) | **YES — `.ui-close--sm` 28px, absolutely positioned** |
| Rail nav item "Scanner" | `data-rail-nav="scanner"`, glyph, keyboard digit `3` | app left rail (shell, not this view) | Keyboard shortcut is desktop-only |

### Controls that DO NOT exist (gaps the rebuild may want to close)
- No **camera capture** entry point (`capture="environment"` is not set anywhere).
- No way to **delete a Recent row** — Recent evicts only by FIFO at 5.
- No way to **re-edit a saved/recent label** except through the unreadable card's back-door.
- No **undo** for a deleted nutrient row.
- No **"clear all history"** control anywhere in this surface.
- No visible marker for which rail row is currently open (`.vd-hrow.is-current` CSS exists,
  nothing ever emits the class — dead).

---

## Data points rendered

| Datum | Source field / function | Format / unit | Why it matters |
|---|---|---|---|
| Uploaded file name | `File.name` | raw string, mono micro | Confirms which photo is being judged |
| Photo thumbnail | `FileReader.readAsDataURL` -> `imageDataUrl` | base64 data URL; 56x56 cover in Step 1, <=216px in Confirm, <=900px/90vh in lightbox | The user verifies OCR against the real label |
| OCR stage | `lcscan:progress` `detail.stage` (0/1/2) | 3 chips: Prepare · Load engine · Read label; done chips get a check prefix | Honest pipeline reporting, not theatre |
| OCR message | `detail.message` | uppercase display-interface | See Copy for the nine real strings |
| OCR determinacy | `detail.determinate` | `.is-indet` sweep vs a real fill | Setup phases genuinely have no percentage |
| OCR percent | `detail.fraction` x 100, clamped 0-100 | `NN%`, tabular mono; hidden while indeterminate | |
| Nutrient name | `label.nutrients[i].name` | editable text | The join key into the 90 |
| Nutrient amount | `.amount` | editable decimal | Feeds every downstream number |
| Nutrient unit | `.unit` | editable; canonicalised on blur | `mg`/`mcg`/`g`/`iu` are the only comparable families |
| Row mapping | `matchEssential(name)` -> `ess.name` | arrow + bold essential name | Says the read actually landed on one of the 90 |
| Row coverage note | `getOrCompute().tiles[].covered` | `· already covered` \| `· counts toward your 90` | |
| Row `+1` mark | `coverageDeltaForLabel(label).addedEssentials` | `+1` | **Never hand-typed** — live coverage snapshot + this label's own amounts, and only when `delivered + scan >= targetLow` on a not-yet-covered tile |
| Untracked read | `isKnownNutrient(name)` true, `matchEssential` null | `· read OK · not one of the 90` | A correct read of Protein is not an OCR error |
| Blank row | name `''` | `· type a name from the label` | Never scolds an untouched field |
| Garbled read | neither | `not recognized · pick a match or edit` + <=4 ranked candidates | |
| Nutrient tally | `nutrientCountLabel(counted, mapped)` | `N lines · M mapped · K to check` (blank rows excluded); `no rows yet` at zero | |
| Ingredients line | `label.ingredients` | editable textarea | **The only place a bad ingredient can be caught** — the nutrition panel never carries one |
| Suspect count | `findIngredientSuspects().length` | `N suspect word(s)` | |
| Suspect word + candidates | `IngredientSuspect` | word chip + <=4 candidate chips | |
| Anti-flag term | `AntiFlag.terms[0]` (falls back to category) | bold | The exact matched string, so a mis-fire is legible |
| Anti-flag category | `AntiFlag.category` | uppercase | One of 8 (see below) |
| Anti-flag reason | `AntiFlag.nuance` or `On Wallach's anti-list (<category>).` | serif; plus a `Wallach` cite chip | |
| Verdict | `ScanResult.verdict` | `ADD`\|`SAVE`\|`REJECT` -> **Aligns / Neutral / Out** | |
| Verdict sub | `verdictHeadline` | `Worth adding` / (none) / `Doesn't fit the framework` | SAVE has **no** sub-line |
| Verdict tone | `VERDICT_TONE` | `--ds-status-ok` / `--ds-status-warn` / `--ds-status-err`, applied as **inline style** to 4 elements | |
| Tier track | 3 chips Add/Save/Reject with `aligns`/`neutral`/`out` sub-labels; active one inline-styled | `role="img"` with an aria-label | Shows the ladder, not just the outcome |
| Hits headline | `result.hits` / `essentialCount()` | "Meaningfully delivers N of your 90 essentials" or "Delivers no essential in a meaningful amount" | >=3% of the **Wallach** target, per serving, uncapped by current coverage |
| Flags in headline | `result.anti.length` | ", and the ingredient scan flagged N." | |
| Gauge | SVG semicircle arc, `pathLength="90"`, `stroke-dasharray="${hits} 90"` | big numeral + `OF 90` | **The map-of-gaps reading: the UNLIT arc is what is missing** |
| Strong hits | `result.hitsStrong` | `N` / `delivered strongly` | >=10% of the Wallach target |
| Flag count fact | `result.anti.length` | `N` / `ingredient flag(s)` | |
| Reasons FOR | `result.reasonsFor[]` | `+` glyph, bold label, items joined inline with `, ` | |
| Reasons AGAINST | `result.reasonsAgainst[]` | minus or `!` glyph (`!` when the label matches `/flag\|reject\|conflict/i`); items rendered as **separate bordered lines** | Each anti-flag term on its own line so a mis-fire reads loud |
| Provenance chip | `label.entry` | `Yours · typed in` / `Yours · user-scanned` | Present in Step 1, the rail rows, AND the verdict footer |
| Rail row name | `humanizeName(label.name)` | Container tokens mapped: `aluminum_can`/`can`->Canned drink, `capsule`->Capsules, `tablet`->Tablets, `softgel`->Softgels, `powder`->Powder, `liquid`->Liquid, `bottle`->Bottled product; else title-cased; else "Scanned label" | Never shows a raw parser token |
| Rail verdict pill | stored `HistoryEntry.verdict` | Aligns / Save / Out | **SUBTLE: this is the verdict as of capture. Re-opening RE-SCORES against your current regimen, so the pill and the re-opened verdict can legitimately disagree.** |
| Rail age | `relAge(ts)` | `Now` \| `Nd` \| `Nw` | |

### Engine constants and tables the surface depends on
- `essentialCount()` = tiles where `essential !== false` = **90** (91 tiles ship; Omega-9 renders
  but is excluded).
- `HIT_THRESHOLD = 0.03`, `HIT_STRONG = 0.10`, meaningful gap-fill cut `>= 10%`,
  `REDEEM_MIN_HITS = 3`, `MEANINGFUL_PCT = 10` for goals.
- `MAX_RECENT = 5` (`lcRecentScans_v1`), `MAX_SAVED = 100` (`lcSavedScans_v1`). Both read through
  `getValidated` / written through `setValidated` (Zod), so corrupt storage degrades to empty.
- Anti-list: **8 categories** — `fried oils / seed oils` (13 terms), `added sugar` (35),
  `caffeine` (4), `gluten sources` (30), `msg / glutamate` (2), `modified / processed` (6),
  `preservatives / additives` (9), `artificial dyes` (**181**). `hardRejectTerms` = 210 terms.
  `seriousAnti` = the 5 categories other than added sugar / caffeine / artificial dyes.
- Goals: 14 keyword sets, 14 nutrient->goal maps, **19** display names.
- OCR dictionaries: `fuzzyDict` 522 food/ingredient terms, `knownNutrientNames` 57 panel labels.

### Existing data the UI NEVER surfaces (re-presentation opportunity, not new data)
1. **`antiListNotes`** — 8 long, fully-cited Wallach doctrine notes (one per anti-list category),
   including the ratification history for each term. Loaded, schema-validated, never rendered.
2. **`nutrientToGoalMap[goal][].why`** — a Wallach citation for every nutrient->goal pairing
   (e.g. "Wallach: 45-150 mg/day for testosterone protocol"). Only the goal's display NAME
   reaches the screen.
3. **`result.gapFills[]`** — the per-nutrient gap-fill percentages. Only the top 3 that clear
   10% appear, inside one reason line. The rest are computed and discarded.
4. **`result.goals[]` beyond the first 4** — truncated by `.slice(0, 4)`.
5. **`result.hitEssentials[]`** — the NAMES of the essentials hit are computed and never shown;
   only the count reaches the gauge.
6. **`HistoryEntry.alignment` / `.goals` / `.gapFills`** — stored on every rail row, never read
   back for display.

---

## Copy

Every user-visible string, verbatim. Hand-entry variants are given as `scanned ⟂ typed`.

### Shell
- Topbar name: `Scanner`
- Topbar deck: `Scan a label to see how your favorite supplements stack up against your goals, or type/paste ingredients to see if it's safe`
- Rail item label: `Scanner` · glyph `⌖` · kbd `3`

### Step 1 — Scan
- Title: `Scan a label` ⟂ `Added by hand`
- Sub: `Upload or drop a photo — decoded on your machine, nothing uploaded.` ⟂ `No photo and no OCR — you type the panel, we judge exactly that.`
- State chip: `Start here` (idle) · `Reading…` (scanning) · `Done ✓` (scanned, done) · `By hand` (typed, done)
- Buttons: `+ New Scan` · `or add it by hand`
- Drop zone: `↑` / `Upload a label image` / `or drop / paste an image here`
- Paste block label: `Or check an ingredients list`
- Paste placeholder: `Paste or type an ingredients list — e.g. water, modified tapioca starch, canola oil, salt. Or a single ingredient like wheat.`
- Paste CTA: `Check ingredients →`
- Done meta (scanned): `<filename>` / `✓ decoded locally · reads confirmed below` / `Yours · user-scanned`
- Done meta (typed): `No photo — entered by hand` / `✓ nothing was read by OCR` / `Yours · typed in`
- Thumbnail title / alt: `See the full label — click to enlarge` / `Your scanned label — click to enlarge`

### Step 1 — Scanning progress
- Stage chips: `Prepare` · `Load engine` · `Read label` (a completed chip is prefixed `✓ `)
- Note: `OCR runs locally — nothing uploaded`
- Live messages (all real, from `state/ocr.ts`):
  - `Preparing the image…`
  - `Warming up the OCR engine…`
  - `Starting the OCR engine…`
  - `Loading the language model…`
  - `Preparing the engine — <status>…` (any Tesseract status string under 40 chars)
  - `Reading the label…`
  - `Checking the label orientation…`
  - `Re-reading at the correct orientation…`
  - `Reading the label at the correct orientation…`

### Step 2 — Confirm
- Title: `Confirm what we read` ⟂ `Enter what the label says`
- Sub: `OCR is imperfect — fix any misread word before we judge it.` ⟂ `Type the panel yourself — we judge exactly what you enter, nothing more.`
- Close aria / title: `Cancel this scan` / `Cancel scan` ⟂ `Cancel this entry` / `Cancel entry`
- Name label: `Product name` · placeholder `Name this product`
- Name hint: `Name it so your saved items and regimen read cleanly — not a raw container guess.` ⟂ `Name it so your saved items and regimen read cleanly.`
- Nutrients section title: `Supplement Facts — what we read` ⟂ `Supplement Facts — what you entered`
- Nutrients hint: `Every row is editable. Clean reads are mapped ✓; garbled reads show ranked suggestions — pick one, or keep as-is.` ⟂ `One nutrient per row. A name we recognize maps ✓ and counts toward your 90; anything else offers the closest matches.`
- Tally: `N lines · M mapped · K to check` · `no rows yet`
- Empty list: `No nutrient lines read — add one below, edit the ingredients, or rescan.` ⟂ `No rows yet — add one below, or just enter the ingredients.`
- Add-row button: `+ Add a row we missed` ⟂ `+ Add another row`
- Row placeholders / aria: `Nutrient` · `Nutrient name` · `Nutrient read (editable)` · `Garbled read (editable)` · `Amount` · `Amount (editable)` · `Unit` · `Unit (editable)` · delete `Remove this row`
- Row statuses: `· type a name from the label` · `· counts toward your 90` · `· already covered` · `+1` · `· read OK · not one of the 90` · `not recognized · pick a match or edit`
- Suggestion strip: `Did you mean` + up to 4 chips (first chip carries a CSS-generated `best` tag) + `× keep`
- Ingredients section title: `Other ingredients — what we read` ⟂ `Other ingredients — what you entered`
- Ingredients hint: `These never appear on the nutrition panel — only the ingredients list can catch a bad ingredient such as a gluten source.`
- Ingredients field label: `Ingredients line (editable)` ⟂ `Ingredients line`
- Suspect panel: `Possible OCR errors` ⟂ `Possible typos` · hint `Click a suggestion to fix, or × to dismiss` · count `N suspect words`
- Flags panel title: `Ingredient flags · Wallach doctrine`
- Flags note: `These surface once the reads are confirmed — and only the ingredients scan catches them, never the nutrition panel.`
- Flag fallback reason: `On Wallach's anti-list (<category>).` · cite chip `Wallach`
- Photo panel: `Your uploaded photo` · zoom badge `⤢ Enlarge` · alt `Your uploaded label — click to enlarge`
- CTA: `Confirm scan → verdict` ⟂ `Judge what I entered →`
- CTA note (scanned only): `Locks your corrections, then judges the confirmed reads against the Wallach corpus. No verdict is shown until you confirm.`
- Inline scoring error: `Something went wrong scoring this scan. Adjust a read and try Confirm again.`

### Step 3 — Result
- Title: `The verdict` · sub `Fires only now — judged on the reads you confirmed.` ⟂ `Fires only now — judged on exactly what you entered.`
- State chip: `Result`
- Card eyebrow: `Wallach-alignment verdict · <name>` · tag `Local · confirmed` · close aria `Close this verdict`
- Verdict eyebrow: `The verdict`
- Tier chips: `Add`/`aligns` · `Save`/`neutral` · `Reject`/`out` · aria `Verdict: <head> — <sub>`
- Headlines: `Aligns` + `Worth adding` · `Neutral` (no sub) · `Out` + `Doesn’t fit the framework`
- Deck: `Meaningfully delivers N of your 90 essential(s)` OR `Delivers no essential in a meaningful amount`, then `, and the ingredient scan flagged N.` ⟂ `, and the ingredients you entered flagged N.` OR `.`
- Reasons header: `Why — grounded in Wallach doctrine`
- Reason labels, the complete set (`decideVerdict`):
  - FOR: `High form alignment (S/2.0, A/T aligned)` · `Moderate form alignment (S/2.0)` · `Meaningful gap-fill` (+ up to 3 items `Essential (+N%)`) · `Goal coverage` (+ up to 4 goal display names)
  - AGAINST: `N misaligned form(s) — non-Wallach-preferred` · `No nutrient closes >10% of a current gap` · `Hard-reject ingredients` · `Serious anti-list flags` · `Seed / fried oil — rejected` (item suffix `· needs 3+ essentials in a meaningful amount to be neutral (has N)`) · `Seed / fried oil — offset to neutral` (item suffix `· offset by N meaningful essential(s) — neutral, never recommended`) · `Mild / softened flags (nuance applied)` · `High-severity conflicts`
  - Anti-flag item format: `<category> — "term", "term" +N more`
- Gauge aria: `Meaningfully delivers N of 90 essentials in a meaningful amount`
- Gauge caption: `hit in a meaningful amount` · facts `delivered strongly` and `ingredient flag(s)`
- Footer: `Add to regimen →` · `Save for later` · `Reject` (or `Delete` when re-opened from Saved)
- Footer note: `Yours · user-scanned lands marked user-provided` ⟂ `Yours · typed in lands marked user-provided`
- Latched states: `✓ Added to regimen` · `✓ Already saved — bumped to N/day` · `✓ Saved`

### Step 3 — Unreadable (verdict withheld)
- Title: `Couldn't read this label` ⟂ `Nothing to judge yet`
- Sub: `No verdict — we couldn't make out enough to judge it fairly.` ⟂ `No verdict — the panel and the ingredients line are both empty.`
- State chip: `No read` ⟂ `Nothing entered`
- Body line: `We couldn't read the nutrition panel or the ingredients on this image.` ⟂ `No nutrient rows and no ingredients were entered.`
- Message: `A verdict here would be about the photo, not the product — so we're withholding it. Try a sharper, straight-on photo, or add the reads yourself.` ⟂ `We are withholding a verdict because there is nothing to judge — not because the product failed. Add what the label says and confirm again.`
- CTAs: `Scan a clearer image` + `Edit the reads` ⟂ `Add the details` + `Scan a photo instead`

### Rail
- Saved panel: eyebrow `Saved` · title `Saved for later` · meta `Kept until you remove them · click to re-open`
- Saved empty: `Nothing saved yet.` / `Hit “Save for later” on a verdict.`
- Recent panel: eyebrow `Recent` · title `Recent captures` · meta `Your last few scans · click to re-open`
- Recent empty: `No scans yet.` / `Your captures land here.`
- Row: name · verdict pill (`Aligns` / `Save` / `Out`) · `Yours · user-scanned` ⟂ `Yours · typed in` · age · row title `Re-open this verdict` · remove aria `Remove from saved`, title `Remove`

### Lightbox
- aria-label `Full-size scanned label` · img alt `Your scanned label at full size` · close aria `Close full-size label`, title `Close`

---

## Failure modes

| # | Failure | Where it is raised | What the user sees | Notes |
|---|---|---|---|---|
| F1 | OCR language model unreachable | `assertModelReachable()` throws `OCR_MODEL_UNREACHABLE` | Error card: `Couldn't reach the OCR language model. Check your connection and scan again.` | **Only reachable on the http/https build.** On `file://` the offline worker has the model bundled and this branch is never taken. |
| F2 | OCR timeout | `withTimeout(..., 90_000, 'OCR_TIMEOUT')` | `The OCR engine took too long to load and timed out. Scan again.` | 90 s. A slow phone can legitimately hit it. |
| F3 | Tesseract script fails to load | `loadTesseract()` rejects with the vendoring instruction | Falls through to the **generic** message — `scanErrorMessage` only matches the two codes above, so the "run `node tools/vendor-tesseract.js`" text never reaches a user. Deliberate (it is a developer message), worth knowing. |
| F4 | Any other OCR/recognition failure | `ocrToLabel` rejects | `Something went wrong while reading that image. Try a clearer photo, or scan again.` | |
| F5 | `FileReader` error or abort | explicit `error` / `abort` listeners → `failScan` | same generic message | **Load-bearing:** without these handlers an unreadable file leaves Step 1 stuck on "Reading the label…" forever. |
| F6 | Superseded scan fails | `failScan` seq guard | **nothing** — silently dropped | A stale scan's failure must never reset the live view. |
| F7 | 2D canvas context unavailable | `preprocessImage` rejects | **not a user-visible failure** — caught, falls back to the raw un-preprocessed image | |
| F8 | Scoring throws at Confirm | `runScan` / `scoreLabel` return `null` | Inline `role="alert"` in the CTA row: `Something went wrong scoring this scan. Adjust a read and try Confirm again.` | Never a dead button. |
| F9 | Nothing readable on the photo | `sparseNutrients && sparseIngredients` | The **unreadable card** — verdict withheld, "A verdict here would be about the photo, not the product" | Blames the photo, not the product. |
| F10 | Hand-entry confirmed empty | same flags, `typed=true` | Unreadable card, typed copy — "not because the product failed" | Must never say "we couldn't read this label" to someone who never took a photo. |
| F11 | Empty paste box | `[data-sc-paste-check]` with `text.length === 0` | **NOTHING — a silent no-op.** No message, no shake, no focus. | A real gap. See Open questions. |
| F12 | Ingredients text shorter than 10 chars | `findIngredientSuspects` early-returns `[]` | Suspect panel simply never appears | A very short ingredient entry gets no correction help at all. |
| F13 | Corrupt localStorage | `getValidated` fails the Zod parse | Empty Saved / Recent lists | Degrades, never crashes, never enters typed-land unvalidated. |
| F14 | Unit that cannot be normalised (`million CFU`, `mL`) | `normalize()` returns `null` | The row still shows and still maps, but contributes **nothing** to hits / gap-fill / `+1` | Silent by construction. A rebuild could make this visible without inventing anything. |

---

## Interaction dependencies

Each of these **cannot survive as-is on a touch screen.**

1. **⚠ DRAG-AND-DROP IMAGE INPUT.** `container.addEventListener('dragover'/'drop')` is a whole
   input path with no touch equivalent — and its copy ("or drop / paste an image here") is
   printed on the primary idle affordance.
2. **⚠ CLIPBOARD IMAGE PASTE.** A `document`-level `paste` listener reading `ClipboardData.items`
   for `image/*`. It also carries a load-bearing guard (`container.offsetParent === null`) that
   exists only because the Scanner is hidden rather than unmounted. Any global listener the
   rebuild keeps needs the same guard, or a paste in another workspace starts a hidden OCR.
3. **⚠ ESCAPE KEY** closes the lightbox. Scrim tap and the × both work, so it degrades safely —
   but there is no swipe-to-dismiss.
4. **⚠ KEYBOARD-DEAD ROWS.** Rail rows advertise `role="button" tabindex="0"` and have **no
   keydown handler**. They focus, they announce as buttons, and they cannot be activated by
   keyboard. Existing a11y defect — fix it in the rebuild rather than porting it.
5. **⚠ HOVER-ONLY FEEDBACK**, with no `:active` or touch equivalent anywhere:
   `.vd-drop:hover`, `.vd-manual:hover` (**the only colour cue that the hand-entry link is
   interactive at all**), `.vd-nadd:hover`, `.vd-sug__btn:hover` (translateY + shadow),
   `.vd-chip:hover`, `.vd-sug__keep:hover`, `.vd-reject:hover`, `.vd-nrow__del:hover`
   (**the only red-danger cue on delete**), `.vd-hrow:hover`, `.vd-scan__imgbtn:hover`,
   `.vd-cf__refbtn:hover .vd-cf__refimg` (brightness), `.vd-edit:hover`, `.vd-ing:hover`,
   `.vd-amt/.vd-unit:hover`, `.vd-link:hover`.
6. **⚠ `title=` TOOLTIPS CARRYING REAL INSTRUCTIONS**, all dead on touch:
   `See the full label — click to enlarge` (×2), `Remove this row`, `Dismiss`,
   `Re-open this verdict`, `Remove`, `Close`, `Cancel scan` / `Cancel entry`,
   `Close full-size label`.
7. **⚠ `cursor: zoom-in` / `zoom-out` / `pointer`** used as the affordance signal — invisible on
   touch.
8. **⚠ `resize: vertical`** on both textareas (`.vd-ing`, `.vd-paste__in`) — a pointer-only drag
   handle. On a phone a long ingredients list is trapped in a 60px box.
9. **⚠ SUB-44px TARGETS**, itemised: row delete **24px**, suspect dismiss **24px**, saved-row
   remove (`.ui-close--sm`) **28px**, confirm/verdict/lightbox close (`.ui-close`) **34px**,
   suggestion chips **~26–28px**, `.vd-nadd` **~30px**, `.vd-sug__keep` **~28px**, `.vd-manual`
   link **~14px tall**, amount/unit inputs **~26px tall × 83px wide**.
10. **⚠ TWO NESTED SCROLLERS.** `.rail-list { max-height: calc(100vh - 330px); overflow-y: auto }`
    inside a page that already scrolls — a scroll trap on touch, and `100vh` is wrong under
    mobile browser chrome.
11. **⚠ STICKY PHOTO PANEL.** `.vd-cf__ref { position: sticky; top: … }` — meaningless once the
    column stacks.
12. **⚠ `max-height: 90vh`** on the lightbox image (not `dvh`). The retired retrofit had to patch
    exactly this line.
13. **Digit shortcut `3`** is how the Scanner is reached from the keyboard — desktop-only; the
    new IA needs a touch route.
14. **`.vd-sug__btn.is-best::after { content: 'best' }`** — the "best" ranking label exists only
    as CSS generated content, not in the DOM.

### Mobile-specific engine risks (not UI, but they land on the phone)
- **⚠ EXIF ORIENTATION IS NEVER READ.** `preprocessImage` draws into a canvas with no EXIF
  handling. The safety net is an offline brute-force sweep: score the as-shot read, and if it
  produced **zero** label anchors, OCR downscaled 90/180/270 rotations and keep the best (only if
  it out-scores the original AND surfaces an anchor). A rotated phone photo therefore costs
  **four OCR passes**. This was designed for desktop uploads; on mobile it is the common case.
- **⚠ MEMORY.** `preprocessImage` upscales to 2000px on the longest side, runs a per-pixel
  grayscale+contrast loop over the whole `ImageData`, then `toDataURL('image/png')`. On a 12MP
  phone photo that is a large allocation on a device with far less headroom than a laptop.
- **⚠ PAYLOAD.** Tesseract loads lazily on the first scan: ~17MB self-contained offline worker on
  `file://` (model bundled), or ~4–5MB WASM core + ~13MB compressed model over http. The first
  scan on a phone is a long silent wait covered only by the `Load engine` stage.
- The full-resolution photo lives in memory as a base64 data URL for the whole session and is
  re-embedded into the DOM on every `render()`. It is **never** persisted, so a re-opened
  Saved/Recent row has no photo (`imageDataUrl` is explicitly nulled).

---

## Desktop-only assumptions

1. **The outer two-column grid.** `.vd .coverage-grid` inherits
   `grid-template-columns: minmax(0,1fr) 380px` from `workspace-coverage.css`. Unlike the Coverage
   workspace (which nests as `.cov-d .coverage-grid` and therefore ignores its own responsive
   fallback), the Scanner uses the **bare** class, so the `@media (max-width: 1160px)`
   single-column fallback **does** apply here. Today's mobile result: the entire Saved + Recent
   rail simply drops to the bottom of an already very long page. Nobody designed that; it just
   falls out of a rule written for a different surface.
2. **The reserved photo column.** `.vd-cf__grid { minmax(0,1fr) minmax(0,248px) }`, collapsing at
   1080px. The column is deliberately reserved **even when empty** (a hand-entry has no photo) so
   the edit fields are one width in both cases — a measured decision recorded in the CSS. On
   mobile the whole premise evaporates.
3. **The verdict card's two columns.** `.vd-card__body { minmax(0,1fr) minmax(0,336px) }`,
   collapsing at 1180px. The gauge + facts are designed as a sidebar beside the reasoning.
4. **The four-column nutrient row.** `.vd-nrow__main` is `20px | name 1fr | amt auto | 24px`
   with areas `"g name amt del" / ". map map map"`. The `amt` cell holds two **fixed 83px**
   inputs. At 375px minus `.vd` padding, the name input — the most important field on the
   surface — is left roughly 80–90px. The CSS itself records that at 380px of column, "Vitamin C"
   rendered as "Vit" and the row grew to 169.9px tall. **This row must be redesigned from
   scratch, never squeezed.**
5. **Horizontal padding of `--ds-space-7`** on `.vd`, `.vd-card__body`, `.vd-card__foot`,
   `.vd-card__top`.
6. **`clamp(2rem, 3.4vw, 2.9rem)`** on the verdict headline — viewport-width driven, so on a
   phone it pins to its 2rem floor and the verdict loses all its scale exactly where it matters
   most.
7. **Measure caps for a wide canvas:** `.vd-cf__ctanote { max-width: 42ch }`,
   `.vd-unread__m { max-width: 52ch }`, `.vd-verdict__deck { max-width: 48ch }`.
8. **The permanent Step-1 card.** A small strip above the work on desktop; a full screen of chrome
   to scroll past on a phone, in every state, forever.
9. **The rail rendered in every state.** Correct as a persistent desktop shelf; on a phone it is
   up to 105 rows appended after the verdict.
10. **The lightbox as the only way to see the label at size.** On a phone the photo IS the source
    of truth and wants to be a first-class, pinch-zoomable surface, not a modal afterthought.
11. **Simultaneous multi-field editing.** Confirm assumes you can see the photo, the name field,
    N nutrient rows and the ingredients box at once and cross-check them. That assumption is the
    core of the surface, and it does not survive 375px.
12. **No virtual-keyboard consideration anywhere.** Focusing an amount input covers roughly half
    a phone screen; nothing scrolls the focused row into view, and no sticky/absolute element is
    `dvh`-aware.

### Dead CSS in `workspace-scanner.css` (no emitter in `views/scanner.ts` — confirmed by grep)
**Do not port:** `.vd-flow*`, `.vd-stepper`, `.vd-stp*` (a retired in-content 1·2·3 stepper strip —
`render_probe_scanner.js` actively asserts `.vd-flow` is ABSENT, because a second copy of the step
state is free to drift from the per-step badges), `.vd-label*` (a faux-label mockup thumbnail),
`.vd-cite*`, `.vd-nrow__sub*`, `.vd-nrow.is-unknown`, `.vd-nrow__cf`, `.vd-nrow__x`,
`.vd-scan__foot`, `.vd-link`, `.vd-foot__sub`, `.vd-step__herotag`, `.vd-hrow.is-current`.
The last one is a **missing feature**, not merely dead CSS: nothing ever marks which rail row is
currently open.

### Token override to be aware of
`.vd { --ds-text-micro: var(--ds-text-mini); }` — the Scanner locally repoints a design-system
token to lift its dense micro labels, then holds three elements back at `0.6rem`
(`.vd-tier__c small`, `.vd-pill`, `.vd-card__eyebrow`) and pushes the three nutrient inputs up to
`0.95rem`. A rebuild that drops this override silently shrinks the whole surface's labels.

---

## Feature-preservation contract

A rebuilt Scanner must satisfy every line below.

**Input paths**
1. Image from the file picker (`accept="image/*"`), reachable from every state.
2. Image from a live camera — today only whatever the OS sheet happens to offer. Preserving
   "pick from library" is mandatory; making capture explicit is a design decision, not a data one.
3. Drag-and-drop image (desktop parity, if the same build serves desktop).
4. Clipboard-paste image (same), with the "am I visible" guard intact.
5. **Hand entry** with no photo: opens the Confirm surface with one blank row, `entry: 'typed'`.
6. **Paste / type an ingredients list** → straight to a verdict, no OCR, `entry: 'typed'`,
   name `Pasted ingredients`. A single word ("wheat") is a valid input.

**Scan step**
7. Real staged progress fed by `lcscan:progress` — three named stages, indeterminate for setup,
   a genuine percentage for the read. **No fabricated timings, no decorative decode animation.**
8. "OCR runs locally — nothing uploaded" stays visible during the scan.
9. Last-wins sequencing: a new image bumps `scanSeq` and aborts the previous `FileReader`; stale
   OCR/reader callbacks no-op. Exactly one Tesseract injection is shared across concurrent loads —
   a double injection wedges the worker and hangs the step forever.
10. `FileReader` `error` **and** `abort` both routed to the failure path.
11. The three distinct error messages (F1/F2, F4) in a `role="alert"` card with a Try-again that
    re-opens the picker.

**Confirm step (the hero — do not weaken it)**
12. Every read is editable: name, amount, unit, plus the product name and the ingredients line.
13. Four row states with distinct glyph and copy: blank (`·`), mapped-to-an-essential (`✓` +
    arrow + essential name), known-but-untracked (`✓` + "not one of the 90"), garbled (`!` +
    ranked suggestions).
14. Live re-evaluation as the name is typed (150 ms debounce), updating glyph / status /
    suggestions **without touching the input**, so the caret survives.
15. Ranked nutrient suggestions from `findNutrientCandidates` (max 4, first marked best) with a
    `keep` escape. An exact — or singular/plural-exact — known read must **never** be offered a
    "correction".
16. `+1` marks from `coverageDeltaForLabel` — the live coverage snapshot plus this label's own
    amounts. Never a hand-typed number, and conservative by design: a nutrient that will not
    unit-convert simply does not add, so the mark can under-count but never over-claim.
17. Per-row "already covered" vs "counts toward your 90".
18. Honest tally `N lines · M mapped · K to check`, blank rows excluded, recounted **from the DOM**
    after a delete rather than re-rendered.
19. Add-row commits current edits first (index compaction), clears `removedRows`, focuses the new
    row's name field.
20. Delete-row records the ORIGINAL index so the readback drops it, removes the node, recounts —
    **no re-render**, which would discard in-flight edits.
21. Ingredients suspect walker (250 ms debounce) with per-word dismiss and click-to-fix, capped at
    12 suspects and ≤4 candidates each, skipping exact dictionary hits and known nutrient names.
22. **Anti-list words are protected** (`getAntiIngredientWords`), so the corrector can never offer
    `modified` → `certified` and erase the flag that makes a product REJECT.
23. Wallach ingredient flags previewed at Confirm via `scoreLabel` (**non-logging**), each with
    its matched term, category, nuance text and a `Wallach` cite.
24. Unit long-forms canonicalised on **change**, never on **input**; multi-word units untouched.
25. The photo is viewable at full size from both Step 1 and Confirm.
26. Cancel returns to a clean idle.
27. The complete copy fork for hand-entry — no surface may claim something was "read" when
    nothing was photographed.

**Result step**
28. The verdict fires ONLY after an explicit confirm. Never on OCR completion.
29. ADD / SAVE / REJECT rendered as **Aligns / Neutral / Out** on a three-chip tier track, active
    chip toned by `--ds-status-ok|warn|err`.
30. The full reasons ledger: reasonsFor with `+`, reasonsAgainst with `−` or `!`, anti-flag terms
    on their own bordered lines, and **both directions** of the seed-oil rule made legible
    (`rejected · needs 3+…` vs `offset to neutral · offset by N…`).
31. `hits of 90` with `hitsStrong` and the flag count, read as a **map of gaps** — the unlit arc is
    the point. Never a score, never a streak, never gamified.
32. The withheld-verdict state when nothing could be read AND nothing was entered, with correct
    blame (photo vs typed) and a route back to Confirm.
33. Adopt mints `provenance: 'user_typed'` / `'user_scanned'` as **two separate spread literals** —
    Eden's wall (`scanner_user_items_marked`) greps this source for the literals, and a computed
    token makes the mint invisible to the gate that polices it.
34. Adopt bumps an existing same-name regimen item's dose rather than duplicating, and says so.
35. Save-for-later writes the durable shelf; Reject closes; Delete (saved origin only) removes.
36. Inline `role="alert"` when scoring throws — never a dead button.
37. A confirm with nothing to judge uses `scoreLabel`, **not** `runScan`, so no phantom
    "Untitled item" row bearing a verdict pill lands in Recent for a verdict the app declined to
    give.

**Rail / history**
38. Saved shelf (durable, ≤100, user-removable) and Recent captures (auto FIFO, ≤5, **no
    name-dedup** — container names are low-cardinality and deduping collapsed distinct products),
    both present in every state.
39. Rows re-open by **(source list, index)**, never by id — legacy ids can collide and an id
    lookup re-opens the wrong row.
40. Re-opening **re-scores against the current regimen** (`scoreLabel`, non-logging).
41. Provenance mark on every row plus relative age.
42. `humanizeName` container-token mapping, so no raw parser token ever reaches the screen.
43. Both stores read/written through the Zod-validated storage boundary; corrupt data degrades to
    an empty list.

**Cross-cutting**
44. Every name written via `.textContent` or through `escHTML` — no unescaped interpolation.
45. `scanner:scan-cleared` resets the surface; `scanner:scan-complete` fires on every logged scan.
46. The bridges must survive: `window.lcScan`, `window.lcLastResult`, `window.lcScanImage`,
    `window.lcParseLabel`, `window.lcOcrToLabel`. Five probes drive them —
    `render_probe_scan.js`, `render_probe_scan_addrow.js`, `render_probe_scan_verdicts.js`,
    `render_probe_scanner.js`, `render_probe_scanner_concurrency.js`.
47. Any shared `.rl-*` / `.rail-*` rule the new sheet adds MUST be scoped to the Scanner root —
    pinned by `tools/tests/test_shared_rl_rules_scoped.py` after an unscoped rule silently tore
    the Coverage rail's per-row remove buttons out of their grid and stacked them all on one spot.
48. §00.A: no amount, target, deficiency sign or claim may be authored in the view. Every number
    traces to `scanner-corpus-data.json` plus the Wallach targets DB.

---

## Open questions

1. **Camera.** No `capture` attribute exists today. Should the mobile Scanner open the camera
   directly (scan-first) with library-pick secondary, or keep the OS sheet? This is the single
   biggest lever on whether the Scanner reads as "a proper mobile app".
2. **EXIF.** Should the rebuild read EXIF orientation before preprocessing, so a portrait phone
   photo costs one OCR pass instead of four? An engine change, not a design change — flagged
   because it is the difference between a ~6 s and a ~25 s scan on a phone.
3. **The Confirm row.** The four-column row cannot survive 375px. Card-per-nutrient? One row at a
   time? A bottom-sheet editor per row? Nothing else on this surface can be laid out until this
   is decided.
4. **The photo's home on mobile.** Modal lightbox, pinned strip, split view, or swipe between
   photo and fields? The Confirm task is fundamentally "compare screen to label".
5. **The rail.** Up to 105 rows appended after the verdict is untenable. Separate tab? Bottom
   sheet? A collapsed History entry point?
6. **Step-1 persistence.** Should the completed scan card collapse to a one-line summary once
   Confirm opens? It currently never does, in any state.
7. **The unshown data** (`antiListNotes`, the per-nutrient goal `why` citations, `hitEssentials`
   names, the full `gapFills` table). All are already in the bundle and all are Wallach-cited.
   Should the mobile Result step expose them — tap a flag, get its full doctrine note? §00.A
   permits it (re-presentation, not new data), but it is a scope decision.
8. **`pathLength="90"` and `stroke-dasharray="${hits} 90"` are hard-coded literals** in the gauge
   SVG while the caption reads `OF ${essentialCount()}`. They agree today only because the count
   happens to be 90. Counts are supposed to derive from truth. Flagging, not fixing — this
   inventory is not a patch.
9. **Empty paste is a silent no-op** (F11). Intentional, or a gap to close?
10. **Dead reason families.** `alignmentScore` is 0 for every real scan (a photo cannot state a
    chemical form) and `containerFlag()` always returns `[]`. So `High/Moderate form alignment`,
    `N misaligned forms` and `High-severity conflicts` **can never appear** from a scan or a
    hand-entry today, and a verdict can land with an entirely empty reasonsFor list. Should the
    mobile Result step say something when there is no positive reason at all?
11. **Recent has no delete.** Only Saved rows carry an ×. Deliberate (it is an auto log), or a gap?
12. **The rail pill can disagree with the re-opened verdict** (stored-at-capture vs re-scored
    against the current regimen). Surfaced nowhere. Should it be?
13. **Both `SAVE` verdicts are the same chip.** "Nothing bad found" (a clean paste) and "has
    softened flags but is not rejected" both land on `Neutral`. The reasons list is the only thing
    that distinguishes them. On a small screen the reasons list is far below the fold.
