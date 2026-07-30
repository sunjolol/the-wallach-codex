# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-07-30, after EIGHT calcium mockups were rejected)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` HIMSELF, in a NEW session. Claude runs `tools/genesis.py` ONLY in response
to that — never as a self-initiated in-session "reboot" ([[reboot-after-boot-file-changes]]).

# ★★★★★ READ FIRST — THE SESSION THAT PRODUCED THIS HANDOFF FAILED. Read why before you build.
Board **78/78 green · corpus kv432 · 2267 sealed claims**. Three element headers are shipped
(selenium, copper, zinc). **Calcium is element #3 and it is NOT done. Two full rounds of four
mockups each — eight designs — were rejected outright.** Both mockup pages were deleted at his
instruction. Nothing about calcium's header survives except the lessons below.

## ★ THE ONE THING THAT MATTERS: only FOUR things are fixed. The rest is NOT a template.
His words, verbatim, and they are now **Rule 0** in `.claude/rules/element-headers.md`:

> "you keep following the same structure/template. There's no way 3 minerals in a row fit cleanly as
> an illustration > into a 1-2-3 point > into a big number statement > into a wallach quote — as the
> BEST way to display all of these, you need to actually consider what Calcium NEEDS to be displayed
> in the best way possible and stop constraining yourself under this template which I've explicitly
> told you to avoid over and over. The only thing that should be a template is the opening statement,
> 'why this number?', the width so it matches the element detail screen exactly and the background
> color/main content box because it leads into the best Youngevity sources block, everything else in
> this main block should adapt to the content/claims themselves, not this weird regression you keep
> doing into the same old template over and over"

FIXED: (1) the opening statement/lede · (2) "why this number?" · (3) the width, matching the element
detail screen exactly · (4) the background colour / main content box, because it leads into the Best
Youngevity sources block. **EVERYTHING ELSE ADAPTS TO THE CONTENT.** Section count, whether beats
exist at all, whether there is a big stat number, whether there is a pull quote, what the
illustration is, and the ORDER of all of it.

## ★★ DO NOT START BY DESIGNING MOCKUPS. The schema is the template — that is the real bug.
This is why two rounds of "design it bespoke" both regressed, and why more instructions would not
have helped. Measured 2026-07-30 in `dashboard/assets/js/src/core/schemas/mechanism-clarity.ts`:

- `MechanismSchema` **REQUIRES** `eyebrow` · `kill` · `figure` · `figure_alt` · `beats[]` ·
  `quote_claim`. **That mandatory set IS the rejected chassis.**
- Everything that looks like freedom (`hook` · `split` · `bridge` · `figure_pre_beats` ·
  `figure_post_beats` · `beats_layout` · `coda` · `stat`) is an OPTIONAL EXTRA on that skeleton.
- `views/entity-page.ts::renderMechanism` (~line 1324) emits the blocks in ONE hard-coded order.

**So the first task is structural, not visual.** Give the renderer an ordered, self-describing block
list — each entry declaring its own type, so an entry can omit beats/stat/quote entirely and set its
own sequence — or accept a per-element render path. Until the structure can express a different
shape, every "bespoke" header regresses to this one. Selenium/copper/zinc must keep rendering
byte-identically (they are signed off), so this is an ADDITIVE change with a gate proving the three
shipped entries are unchanged.

## What was rejected, so it is not re-attempted (all eight)
**Round 1** — (A) a drawn human FACE: *"looks psychotic and low quality… absurd, ridiculous."* Note
the scope: zinc's fingertip/nail crop is fine and shipped; a whole face is not. (B) a plain bar chart
of the 1,000 mg tablet table: *"straight up boring and a waste of space."* (C) a 21-label plumbing
circuit: *"probably closest but… so complex and convoluted I don't even want to read it"* — closest on
CONTENT, fatal on execution. (D) a vinegar/bone-broth pot: *"what the hell does vinegar have to do
with anything and why is it never explained how it even enters the equation? Just bizarre and
random"* — an object must be REQUIRED by the argument and earned in the first sentence of prose.

**Round 2** — cut to 4/5/7/8 labels, one figure each, ≤3 beats, adversarially critiqued. Still
rejected, for Rule 0: every one was the same chassis. The content was right by then; the SHAPE was
the problem. **Do not simply re-simplify. Change the shape.**

## The content IS solved — reuse it, do not re-derive it
Every claim below was re-read at the BYTE level from the sealed shards this session. The story that
survived both rounds (he confirmed round-1 C was "closest" on content):

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

## ⚠ TWO BLOCKERS FOUND, both still open
1. **The 99/1 split has NO HOME on calcium's page.** Both carriers — `WAL-CLM-IMMORT-000065` and
   `WAL-CLM-EPIGEN-000232` — have an **empty `essentials` array**, so Wallach's most famous calcium
   fact maps to nothing and cannot be pulled by claim id. Rule 6 requires numbers pulled BY ID. Any
   header using 99/1 needs that mapping closed first: add `calcium` → `corpus_resnap` → **Luneth**
   re-seals. Grep `source_claim_id` before touching it ([[remap-claim-can-orphan-target]]).
2. **The lede already states the split.** `entity-copy.json` calcium `lede` reads "99% locked in bone
   and teeth, the last 1% running your muscles, nerves and heartbeat." Any header built on 99/1
   restates it three lines later. The lede is APPROVED prose — his call, never a silent edit.

## Source-purification queue found while verifying (a separate pass, needs his re-seal)
`LETS-000079` "nonnal" → normal (+ front-severed) · `LETS-000285` "phosphoms" ×4 ·
`LETS-000168` "magnesiumat"/"t.i.d.foras" · `EPIGEN-000232` "one percent is. found in" ·
`DDDL-000088` missing terminal period. All are in calcium's BEST passages.

## What DID ship this session (committed, verified)
Zinc's nail figure recoloured at his instruction: `.kd-ep-fam__nail` → `#f9d7c2`,
`.kd-ep-fam__skin` → `#f2c5a3` (`drawer-knowledge.css:2400`). Build + 78/78 invariants +
`render_probe_zinc` 57/57 green. **Flagged, not fixed:** lightening the nail moved it much closer to
the lunula `__nlun` (`#fae2d0`) — the blue-channel gap fell 24 → 14, so the half-moon reads fainter.
His call whether to nudge it.

## Playbook changes landed this session (`.claude/rules/element-headers.md`, now 217 lines)
- **Rule 0** added — the four fixed things + the schema-is-the-template diagnosis. It outranks
  everything else in the file.
- **Rule 1 width CORRECTED.** It said "a measured 867px content width" with no distinction. That is
  the outer `.kd-ep` screen. `.kd-ep-fam` clientWidth is 865 and it carries 24px padding a side, so
  the real FIGURE ceiling is **817px**. A figure authored at 820 rendered at scale 0.996 and taxed
  every label. Prefer the shipped exact slots: `--fork` 700px, `--rail` 660px.
- **Rule 2 gained a third invisible-in-source trap:** an SVG `fill="…"` attribute LOSES to a CSS
  class rule (a white glyph rendered accent-on-accent, invisible). Use `style="fill:…"`.
- **Probe gap recorded:** text-vs-text collision checks are blind to a label painted under an opaque
  shape. Add a paint-order occlusion check, intersect each shape with its nearest `clip-path`
  ancestor (clipped-away shapes still report a full bbox and over-fire), and ship a negative control.

## LOAD FIRST next session
- `.claude/rules/element-headers.md` — **Rule 0 first**, then the rest.
- `.claude/rules/visual-verification.md` (the STOP gate) + `.claude/rules/data-flow.md`.
- `core/schemas/mechanism-clarity.ts` + `views/entity-page.ts::renderMechanism` — the structural
  work is here, and it comes BEFORE any mockup.
- `temporary/copper-header-combined.html` / `zinc-header-B3.html` — the real-container mockup shells
  to copy (rule 1). **Both calcium pages were deleted; do not look for them.**
- Memories: [[element-header-playbook]] · [[element-header-illustration-failure-modes]] ·
  [[svg-render-traps-fill-and-content-width]] · [[measured-change-not-extremes]] ·
  [[header-mockups-in-real-container]] · [[negative-control-or-it-proves-nothing]] ·
  [[screenshot-verify-visual-chunks]] · [[daily-target-provenance-always]].

## OPEN DEFERRAL (unchanged, carry forward)
`entity-copy.json` holds **4 of 91** (calcium · selenium · copper · zinc). The other 87 have neither
a `lede` nor a why-this-number line. `element_header_complete` binds only on elements that HAVE a
header, so this is a labelled WISH, not a covered gap ([[daily-target-provenance-always]]).

## MAINTENANCE
The memory index crossed **188 lines** (limit 200). Compact by shortening HOOKS first — that is
lossless — never by dropping entries ([[memory-consolidation-threshold]]).

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food; nutrients from the DIET (food OR supplements). 3. NEVER fabricate — verbatim ⊆ sealed book, or GAP.
4. `corpus_seal` + `catalog_seal` are USER-ONLY (per-invocation authorization). 5. A DOM probe is not a visual check — screenshot it, then STOP for his eyes.

**Corpus kv432 · 2267 claims · board 78/78 green. Next: make the renderer able to express a
different SHAPE, then design calcium's header to its own content — not to the chassis.**
