# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-07-30, after the block-list refactor landed)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` HIMSELF, in a NEW session. Claude runs `tools/genesis.py` ONLY in response
to that — never as a self-initiated in-session "reboot" ([[reboot-after-boot-file-changes]]).

# ★★★★★ READ FIRST — THE BLOCKER IS GONE. Calcium's header can now be designed to its content.
Board **79/79 green · corpus kv432 · 2267 sealed claims**. Three element headers are shipped
(selenium, copper, zinc). **Calcium is element #3 and its header is still NOT designed** — eight
mockups were rejected across two rounds on 2026-07-29/30, and both mockup pages were deleted.

The previous handoff said the FIRST task was structural, not visual, because the schema itself only
permitted one shape. **That work is DONE (2026-07-30).** What changed:

- `core/schemas/mechanism-clarity.ts` now takes EITHER shape. Legacy (`MechanismSchema`, untouched)
  or **COMPOSED**: `{slug, facet, blocks:[…]}` — an ordered, self-describing list where NOTHING is
  required. Types: `eyebrow` · `kill` · `opener` · `figure` · `prose`(`tone: bridge|coda`) ·
  `split` · `beats`(`items[]`, `layout: stack|row`) · `stat` · `quote`. An entry may carry no beats,
  no stat, no quote, the quote first, or nothing but an annotated figure.
- `views/entity-page.ts` — every renderable unit is now ONE shared emitter called by both paths;
  `renderMechBlocks` walks the declared order, `renderMechLegacy` declares the old fixed order and
  nothing else. The frame (tan box · disclaimer · Best-Youngevity-sources dock) is the only fixed
  structure, exactly what Rule 0 fixes.
- **Proof the three signed-off headers did not move:** `tools/render_probe_mech_shape.js` (18/18)
  byte-compares each live section to `tools/goldens/mechanism-sections.json`, captured from the
  PRE-refactor bundle. All three are byte-identical (same sha256, verified pre vs post). It carries a
  negative control that mutates the live DOM by one character and asserts the comparison fails.
- **New gate:** `mechanism_blocks_wellformed` (critical, 17-case negative test) — schema block types
  and `renderMechBlocks` cases must be the SAME set in both directions, every figure key must be one
  `mechanismFigure` draws, every cited claim must resolve in the sealed corpus. It also covers the
  legacy entries, which never had the last two.

**So the next task IS the design.** Read `.claude/rules/element-headers.md` (Rule 0 first, then the
"THE SCHEMA WAS THE TEMPLATE" section, which now documents the block vocabulary). Build calcium's
header as a COMPOSED entry, shaped to calcium's material. Do not build a new header on the legacy
shape.

## ⚠ ONE HONEST GAP in what just landed
The composed RENDER path has no runtime coverage yet, because no element declares `blocks`. Its DATA
contract is gated (the invariant above) and its code is type-exhaustive (adding a schema type without
a render case is a COMPILE error, not a silent ''), but the first composed header must bring its own
probe that actually renders it. That is not a covered gap — it is a labelled one (R7).

## What was rejected, so it is not re-attempted (all eight calcium mockups)
**Round 1** — (A) a drawn human FACE: *"looks psychotic and low quality… absurd, ridiculous."* Note
the scope: zinc's fingertip/nail crop is fine and shipped; a whole face is not. (B) a plain bar chart
of the 1,000 mg tablet table: *"straight up boring and a waste of space."* (C) a 21-label plumbing
circuit: *"probably closest but… so complex and convoluted I don't even want to read it"* — closest on
CONTENT, fatal on execution. (D) a vinegar/bone-broth pot: *"what the hell does vinegar have to do
with anything and why is it never explained how it even enters the equation? Just bizarre and
random"* — an object must be REQUIRED by the argument and earned in the first sentence of prose.

**Round 2** — cut to 4/5/7/8 labels, one figure each, ≤3 beats, adversarially critiqued. Still
rejected, for Rule 0: every one was the same chassis. The content was right by then; the SHAPE was
the problem — and the shape is now free, so this is the round to get it right.

## The content IS solved — reuse it, do not re-derive it
Every claim below was re-read at the BYTE level from the sealed shards. The story that survived both
rounds (he confirmed round-1 C was "closest" on content):

  1. **Importance.** Calcium is not a bone mineral. The 1% outside bone is "a cofactor and activator
     for numerous enzyme systems" — it clots blood, fires nerves. Wallach counts **147** diseases
     from this one deficiency vs about ten for a typical mineral (IMMORT-000015, clean, whole).
  2. **Mechanism.** That 1% is non-negotiable — below the range, convulsions come before a low blood
     reading (LETS-000078, first two sentences clean). So the body takes it from the 99% in bone.
  3. **The unique surprise.** (a) The blood test therefore reads NORMAL throughout — spontaneous
     fractures from raging osteoporosis with normal blood calcium (LETS-000079, FACTS only, verbatim
     unprintable). (b) Kidney stones, bone spurs and calcium deposits are the SHORTAGE, not an
     excess (RARE-000305 numbers; DDDL-000088 for the line, co-bills magnesium, no terminal period).
  4. **Resolution.** Usable calcium AND the stomach acid to absorb it (DDDL-000058, clean,
     calcium-only, terminal period — the safest quote available). Absorption may be limited to
     10 percent or less (RARE-000106, clean). Highest-stakes close: the parathyroid a surgeon calls
     a "tumor" resolving on usable calcium (IMMORT-000073, clean, ends "DO NOT GET SURGERY!").

**FORBIDDEN claims (verified defective, do not reach for them):** DDDL-000087 (severed before the
payoff) · LETS-000285 ("phosphoms" ×4) · LETS-000168 ("magnesiumat", "t.i.d.foras") ·
EPIGEN-000232 (stray period mid-sentence) · RARE-000082 and EPIGEN-000143 (both open mid-sentence).

## ⚠ TWO CALCIUM BLOCKERS, both still open (unchanged — neither was touched this session)
1. **The 99/1 split has NO HOME on calcium's page.** Both carriers — `WAL-CLM-IMMORT-000065` and
   `WAL-CLM-EPIGEN-000232` — have an **empty `essentials` array**, so Wallach's most famous calcium
   fact maps to nothing and cannot be pulled by claim id. Rule 6 requires numbers pulled BY ID. Any
   header using 99/1 needs that mapping closed first: add `calcium` → `corpus_resnap` → **Luneth**
   re-seals. Grep `source_claim_id` before touching it ([[remap-claim-can-orphan-target]]).
2. **The lede already states the split.** `entity-copy.json` calcium `lede` reads "99% locked in bone
   and teeth, the last 1% running your muscles, nerves and heartbeat." Any header built on 99/1
   restates it three lines later. The lede is APPROVED prose — his call, never a silent edit.

## Source-purification queue (a separate pass, needs his re-seal)
`LETS-000079` "nonnal" → normal (+ front-severed) · `LETS-000285` "phosphoms" ×4 ·
`LETS-000168` "magnesiumat"/"t.i.d.foras" · `EPIGEN-000232` "one percent is. found in" ·
`DDDL-000088` missing terminal period. All are in calcium's BEST passages.

## ★ A TOOLING TRAP found this session — it will bite the next snapshot
`tools/safe_write.py` writes text in Windows text mode, so **an LF payload lands on disk as CRLF.**
A byte-exact HTML snapshot committed through it read as "all 256 lines differ" against an
unchanged render, and the first reading blamed the source file's line endings (wrongly — a template
literal's CRLF normalises to LF when evaluated, so line endings never reach the DOM). Store any
byte-exact snapshot **inside JSON**, where a newline is a two-char `\n` escape and survives the write
path; then the comparison can be RAW, with no normalisation to hide a real change.
Second trap from the same hour: the sealed claim shards key the id as **`id`, not `claim_id`** — the
new gate's first draft read `claim_id`, got an empty set, and reddened all 26 genuine references.
A gate can lie about clean data; run it, do not read it. ([[the-instrument-lies-before-the-eye]])

## Zinc, still open (flagged, not fixed)
Lightening the nail to `#f9d7c2` moved it much closer to the lunula `__nlun` (`#fae2d0`) — the
blue-channel gap fell 24 → 14, so the half-moon reads fainter. His call whether to nudge it.

## LOAD FIRST next session
- `.claude/rules/element-headers.md` — **Rule 0 first**, then "THE SCHEMA WAS THE TEMPLATE" for the
  block vocabulary.
- `.claude/rules/visual-verification.md` (the STOP gate) + `.claude/rules/data-flow.md`.
- `core/schemas/mechanism-clarity.ts` + `views/entity-page.ts::renderMechBlocks` — read the composed
  shape before authoring calcium's entry.
- `temporary/copper-header-combined.html` / `zinc-header-B3.html` — the real-container mockup shells
  to copy (rule 1). **Both calcium pages were deleted; do not look for them.**
- Memories: [[element-header-playbook]] · [[element-header-illustration-failure-modes]] ·
  [[element-header-only-four-things-fixed]] · [[svg-render-traps-fill-and-content-width]] ·
  [[measured-change-not-extremes]] · [[header-mockups-in-real-container]] ·
  [[negative-control-or-it-proves-nothing]] · [[screenshot-verify-visual-chunks]] ·
  [[daily-target-provenance-always]].

## OPEN DEFERRAL (unchanged, carry forward)
`entity-copy.json` holds **4 of 91** (calcium · selenium · copper · zinc). The other 87 have neither
a `lede` nor a why-this-number line. `element_header_complete` binds only on elements that HAVE a
header, so this is a labelled WISH, not a covered gap ([[daily-target-provenance-always]]).

## MAINTENANCE
The memory index crossed **190 lines** (limit 200). Compact by shortening HOOKS first — that is
lossless — never by dropping entries ([[memory-consolidation-threshold]]).

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food; nutrients from the DIET (food OR supplements). 3. NEVER fabricate — verbatim ⊆ sealed book, or GAP.
4. `corpus_seal` + `catalog_seal` are USER-ONLY (per-invocation authorization). 5. A DOM probe is not a visual check — screenshot it, then STOP for his eyes.

**Corpus kv432 · 2267 claims · board 79/79 green. Next: design calcium's header to calcium's own
content as a COMPOSED entry — the structure can finally express a different shape.**
