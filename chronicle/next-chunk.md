# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-07-30, after a SECOND failed calcium attempt)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` HIMSELF, in a NEW session. Claude runs `tools/genesis.py` ONLY in response
to that — never as a self-initiated in-session "reboot" ([[reboot-after-boot-file-changes]]).

# ★★★★★ READ FIRST — TWELVE calcium mockups have now been rejected. Read WHY before drawing anything.
Board **79/79 green · corpus kv432 · 2267 sealed claims**. Three element headers are shipped
(selenium, copper, zinc). **Calcium is element #3 and is STILL NOT DESIGNED.**

- **Round 1 + 2 (2026-07-29/30): 8 mockups rejected** — all were the same chassis (Rule 0).
- **Round 3 (2026-07-30, this session): 4 more rejected.** Luneth closed the session and moved back
  to Opus 4.8. His words: *"Still missing the mark, also a lot of weird lines cutting through text
  and just chaotic illustrations in general that aren't engaging."* Earlier in the same session:
  *"you're now shipping absolutely MINIMAL information headers, ALL of these are the worst you've
  ever done by far. I'd prefer you sticking to the repetitive template you used for Selenium and
  Copper over this garbage… MAKE SURE ALL STYLES ARE EXACTLY THE SAME AS OUR LIVE STYLES, I NEVER
  WANT TO SEE QUOTES WITH WEIRD FONTS AGAIN."*

The v3 page still exists at `temporary/calcium-header-mockups.html` (uncommitted, REJECTED — do not
build on it; read it only to see what was already turned down).

## ★★★ THE THREE THINGS ROUND 3 GOT WRONG — do not repeat any of them
1. **STROKES CROSSING TEXT.** Lines, rails, dashed guides and arrows were routed straight through
   labels. This is the #1 stated complaint and it is INVISIBLE to the existing probe, which only
   does text-vs-text bounding boxes. A needle drawn through the word "normal" passed every check.
   **Nothing may cross a label — route strokes around text, or move the label off the stroke.**
2. **CHAOTIC, UNENGAGING ILLUSTRATIONS.** Multi-exit funnels, two-lane bars, tick fields and rails
   all read as diagram-clutter rather than something a person wants to look at. Same failure family
   as the round-1 rejection of the 21-label plumbing circuit. Fewer elements, one idea per figure,
   and it has to be *engaging* — not merely legible and collision-free.
3. **MINIMAL HEADERS.** Round 3 opened with 3–5-block headers. Freeing the ORDER is not a licence to
   ship less: he would rather have the repetitive selenium/copper chassis than a sparse bespoke one.
   Density must be at copper's level or above. (v3 was rebuilt to that density and still failed on
   points 1 and 2 — so density alone is not the fix.)

## ★★ STYLE FIDELITY IS NON-NEGOTIABLE — and here is the exact markup
Round 3's quotes rendered in the wrong font because they were hand-written look-alikes. The live
pull-quote is **three nested elements**, and both outer layers matter:

```html
<div class="ds-pull-quote-wrap kd-ep-fam__quote">
  <blockquote class="ds-pull-quote"><p>…<mark class="ds-mark">…</mark></p>
  <footer>— Dr. Joel Wallach · Dead Doctors Don't Lie (3rd ed. 2011)</footer></blockquote>
</div>
```
`.kd-ep-fam__quote` carries the `--mech` size (`clamp(1.05rem,1.05vw,1.35rem)`); the inner `<p>`
carries the serif. Omit either and the text falls to the display face at the 2vw base size.

**Never invent a class.** `tools/goldens/mechanism-sections.json` holds the exact rendered DOM of all
three shipped headers — read the real markup out of it. Four SVG classes used in round 3 did not
exist at all (`__sieve`, `__rail`, `__return`, `__retdot`); the real ones are `__vessel`, `__grail`,
`__greturn`, `__gretdot`. `grep -c 'kd-ep-fam__<name>'` before using any class.

## ✔ WHAT DID LAND THIS SESSION (committed `974f5574`, pushed, green)
The structural blocker from the previous handoff is GONE — this part is done and verified:
- `core/schemas/mechanism-clarity.ts` takes EITHER shape: legacy (`MechanismSchema`, untouched) or
  **COMPOSED** `{slug, facet, blocks[]}` — an ordered self-describing list where NOTHING is required.
  Types: `eyebrow` · `kill` · `opener` · `figure` · `prose`(`tone: bridge|coda`) · `split` ·
  `beats`(`items[]`, `layout: stack|row`) · `stat` · `quote`. `figure.width` is a closed required
  enum (`mech` 600 / `fork` 700 / `rail` 660).
- `views/entity-page.ts`: every renderable is ONE shared emitter called by both paths;
  `renderMechBlocks` walks the declared order with an EXHAUSTIVE switch (a new schema type without a
  render case is a COMPILE error, not a silently-empty block).
- **The three signed-off headers are byte-identical**, proven by sha256 pre vs post and re-checked
  every run by `tools/render_probe_mech_shape.js` (18/18) against `tools/goldens/mechanism-sections.json`,
  with a negative control that mutates the DOM by one character and asserts the compare FAILS.
- New gate `mechanism_blocks_wellformed` (critical, 17-case negative test): schema types ↔ render
  cases both directions, figure keys drawable, cited claims resolve.
- **Honest gap (R7):** the composed RENDER path has no runtime coverage until an element uses it. The
  first composed header must bring its own probe.

## ★ THE PROBE GAP THAT MUST BE CLOSED BEFORE THE NEXT ATTEMPT
`tools/render_probe_*` collision checking is **text-vs-text only**. It cannot see:
- a **stroke crossing a label** (complaint #1 above — it shipped twice this session), or
- a label painted *under* an opaque shape (already recorded in the playbook).

Add a stroke/shape-vs-text intersection check, intersect each shape against its nearest `clip-path`
ancestor (a clipped-away shape still reports a full bbox and over-fires), and ship it with a negative
control proving the detector fires ([[negative-control-or-it-proves-nothing]]). Until that exists,
every figure needs a SCREENSHOT read by eye before it is shown to him
([[screenshot-verify-visual-chunks]]) — measurements alone certified all four rejected variants.

## The content IS solved — reuse it, do not re-derive it
All re-read at BYTE level from the sealed shards, all mapped to `calcium`, all clean unless noted:
- **IMMORT-000015** — ~10 deficiency diseases per missing mineral, but calcium "as many as 147".
- **LETS-000078** — cramps/eye twitches with blood calcium still "normal"; convulsions from low CELL
  calcium come BEFORE a low blood reading; "The normal range is 9-10.8 mg".
- **LETS-000079** — spontaneous fractures from raging osteoporosis with normal blood calcium.
  **MAPPED SOURCE ONLY — NEVER QUOTE:** its verbatim reads "nonnal".
- **RARE-000305** — up to 75 % of consumed Ca lost in feces, 2 % in urine/sweat; excess urinary loss
  → kidney stones, bone spurs, calcium deposits. (Also maps magnesium + boron.)
- **DDDL-000088** — bladder/kidney stones ironically caused by a Ca/Mg-deficient diet + raging
  osteoporosis; "The minerals in the 'stones' come from your own bones". (No terminal period.)
- **DDDL-000058** — "osteoporosis is easy to prevent and cure with proper supplementation of stomach
  acid (HCl) and calcium." Clean, calcium-only, terminal period — **the safest quote available.**
- **RARE-000106** — metallic calcium absorption "may be limited to 10 percent or less".
- **IMMORT-000073** — nutritional secondary hyperparathyroidism; the surgeon calls the enlarged gland
  a "tumor"; usable calcium resolves it; ends "DO NOT GET SURGERY!" Highest-stakes close.

**FORBIDDEN (verified defective):** DDDL-000087 (severed before the payoff) · LETS-000285
("phosphoms" ×4) · LETS-000168 ("magnesiumat", "t.i.d.foras") · EPIGEN-000232 (stray period
mid-sentence) · RARE-000082 and EPIGEN-000143 (both open mid-sentence).

## ⚠ TWO CALCIUM BLOCKERS, both still open
1. **The 99/1 split has NO HOME.** Both carriers — `WAL-CLM-IMMORT-000065` and
   `WAL-CLM-EPIGEN-000232` — have an **empty `essentials` array**, so calcium's most famous fact maps
   to nothing and cannot be pulled by id (Rule 6). **The "cofactor and activator for numerous enzyme
   systems" phrase is in those SAME two claims** — measured this session — so it is equally
   unusable. Closing this needs: add `calcium` → `corpus_resnap` → **Luneth** re-seals. Grep
   `source_claim_id` first ([[remap-claim-can-orphan-target]]).
2. **The lede already states the split.** `entity-copy.json` calcium `lede` reads "99% locked in bone
   and teeth, the last 1% running your muscles, nerves and heartbeat." A header built on 99/1
   restates it three rows above. Approved prose — his call, never a silent edit.

## Also not usable for calcium
`RARE-000061`'s 98 %-vs-8–12 % absorption figure is about plant-derived minerals generally and is
**not mapped to calcium** — do not draw it, or any proportion derived from it, in a calcium figure.

## Source-purification queue (separate pass, needs his re-seal)
`LETS-000079` "nonnal" → normal (+ front-severed) · `LETS-000285` "phosphoms" ×4 ·
`LETS-000168` "magnesiumat"/"t.i.d.foras" · `EPIGEN-000232` "one percent is. found in" ·
`DDDL-000088` missing terminal period. All in calcium's BEST passages.

## ★ TOOLING TRAPS found this session (both cost real time)
1. **`safe_write` writes Windows text mode, so an LF payload lands as CRLF.** A byte-exact HTML
   snapshot committed through it read as "all 256 lines differ" against an unchanged render. Store
   byte-exact snapshots **inside JSON** (a newline becomes a two-char `\n` escape and survives both
   that write path AND git normalization — verified). Also: when calling `safe_write.safe_rewrite`
   from a script, hand it **LF** text; CRLF becomes `\r\r\n` and fails its own verify.
2. **The sealed claim shards key the id as `id`, NOT `claim_id`.** A gate written against `claim_id`
   built an empty id set and reddened all 26 genuine references — a gate lying about clean data.

## Zinc, still open (flagged, not fixed)
Lightening the nail to `#f9d7c2` moved it close to the lunula `__nlun` (`#fae2d0`) — blue-channel gap
fell 24 → 14, so the half-moon reads fainter. His call whether to nudge it.

## LOAD FIRST next session
- `.claude/rules/element-headers.md` — **Rule 0 first**, then "THE SCHEMA WAS THE TEMPLATE" (the
  block vocabulary) and Rule 2's trap list.
- `.claude/rules/visual-verification.md` (the STOP gate) + `.claude/rules/data-flow.md`.
- `tools/goldens/mechanism-sections.json` — the exact live markup for all three shipped headers.
- `temporary/copper-header-combined.html` / `zinc-header-B3.html` — the real-container mockup shells.
- Memories: [[element-header-playbook]] · [[element-header-illustration-failure-modes]] ·
  [[element-header-only-four-things-fixed]] · [[svg-render-traps-fill-and-content-width]] ·
  [[measured-change-not-extremes]] · [[header-mockups-in-real-container]] ·
  [[negative-control-or-it-proves-nothing]] · [[screenshot-verify-visual-chunks]] ·
  [[daily-target-provenance-always]].

## OPEN DEFERRAL (unchanged)
`entity-copy.json` holds **4 of 91** (calcium · selenium · copper · zinc). The other 87 have neither
a `lede` nor a why-this-number line — a labelled WISH, not a covered gap.

## MAINTENANCE
Memory index at **190 lines** (limit 200). Compact by shortening HOOKS first — lossless — never by
dropping entries ([[memory-consolidation-threshold]]). Luneth deferred this 2026-07-30 in favour of
the calcium work.

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food; nutrients from the DIET (food OR supplements). 3. NEVER fabricate — verbatim ⊆ sealed book, or GAP.
4. `corpus_seal` + `catalog_seal` are USER-ONLY. 5. A DOM probe is not a visual check — screenshot it, then STOP for his eyes.

**Corpus kv432 · 2267 claims · board 79/79 green. Next: calcium's header — the structure is ready and
the content is solved; what has failed three times is the ILLUSTRATION and the restraint around it.**
