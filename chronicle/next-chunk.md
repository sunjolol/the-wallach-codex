# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-07-30, after a side-task session closed clean)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` HIMSELF, in a NEW session. Claude runs `tools/genesis.py` ONLY in response
to that — never a self-initiated in-session "reboot" ([[reboot-after-boot-file-changes]]). After the
report, **ASK which element to build next — Luneth picks** (via AskUserQuestion, [[decisions-need-a-question]]).
Do NOT start building an element header without his pick.

# ★★★★★ READ FIRST — board 80/80 · corpus kv436 · 2267 claims · 4 element headers live.
**FOUR** element headers render as signed-off: selenium, copper, zinc, calcium, of 90/91.
**Next: build the NEXT element header — element #5, Luneth's pick.** Nothing is mid-flight; the tree
is clean and every gate is green. This is a fresh start on element #5.

## ★ WHAT LANDED THIS SESSION (2026-07-30 side tasks — all committed + pushed)
Three side tasks between calcium's header and element #5:
1. **Zinc header prose fix** — "he starts at a fingernail" → "Wallach starts at a fingernail" (first
   occurrence only). Golden `mechanism-sections.json` updated; mech-shape probe byte-identical. `12e95b46`
2. **Element-card claim counts were undercounting** — the tiles/hero counted only operationally-mapped
   claims (`claim_count`) and ignored the "Worth knowing" enrichment layer the page renders. NEW
   derived field **`distinct_claim_count`** = |record ∪ worth-knowing|, deduped, EXCLUDING the 33 shared
   plant-derived group claims (Luneth's element-specific choice). Wired into the 90-tab tile, home shelf
   (display+sort), home live-search meta, and the essential detail hero. `claim_count` UNTOUCHED so "The
   full record · All N" keeps the operational number. Calcium 146, Zinc 133, Gold 13, etc. `12e95b46`
   - **Conditions do NOT get this** — DOM-verified they render NO "Worth knowing" section, so their
     cards already matched their pages. An extension was built then reverted (memory of the trap in the
     commit body). If Luneth ever wants conditions to show more, that's a NEW feature (add a Worth-Knowing
     section to condition pages), not a count fix.
3. **Omega-6 was under-MAPPED, not under-mined** — a 5-book scan found the omega-6 content already in the
   corpus but orphaned (empty `essentials[]`). Remapped 9 claims Luneth ratified (8 HIGH epigenetics + the
   RARE-000334 hair-EFA sign): **omega-6 10→19**, omega-3 84→92, the GLA/conditionally-essential content
   is finally visible. `IMMORT-000277` (a duplicate EFA dose) proved unmappable — the EFA collective dose
   is a SINGLETON (DDDL-000115); see the NEW memory [[efa-collective-dose-is-singleton]]. Sealed
   kv433→436. `879a6b2e` + `f6b77dbd`

## DEFERRED (carry forward — unchanged from calcium)
- **`render_probe_calcium.js`** — STILL unwritten (per-element probe gap; copy `render_probe_copper.js`,
  ~47 checks, include a regression pass on a shipped element). MUST be **scrollbar-aware** (simulate the
  11px narrow). Real gap — the composed calcium render has no dedicated runtime probe.
- **element-headers.md Rule 1** — codify the headless-scrollbar / mockup-`overflow:visible` width trap.
- **Double-gloss** — calcium's right card underlines both "parathyroids" and "parathyroid"; dedup
  `glossify` by definition (not by word) later — a shared-fn change, verify other renders first.

## ★★ THE SCROLLBAR / "EXACT WIDTH" LESSON (do NOT repeat) — [[headless-scrollbar-hides-real-width]]
Headless Chromium draws **0px overlay scrollbars**; the real app has an **11px** drawer scrollbar
(`dashboard.css:30`) that narrows the cards. A headless "widths identical" check is BLIND to the one
thing an EXACT-width request cares about. **Verify wrap at the TRUE width**: narrow `.kd-ep` by ~11px and
re-measure (the 4→5 line transition crosses at ~9–11px). Never call a width "exact" from headless alone.

## ★ NEW CAPABILITIES available to every future header (from calcium, still live)
- **`quote_trim`** (split side): a TRIMMED literal Wallach quote by claim-ID (⊆ sealed verbatim). GATED
  by `mech_quote_trim_faithful` (critical).
- **SOURCED PARAPHRASE** (`note` + `quote_claim`, NO `quote_trim`): a tightened summary in quote style
  with the registry cite but NO quote marks — HUMAN-REVIEW faithfulness, not gated. Use SPARINGLY; the
  DEFAULT is the gated verbatim.
- **`*emphasis*` in prose** (`glossify(text, true)`): opt-in inline italic; on for split prose.
- **COMPOSED mechanism entry** + the CARD treatment (`cards:true`, scoped `kd-ep-fam--cards`) — calcium
  in `mechanism-clarity-data.json` is the worked example.

## LOAD FIRST next session
- `.claude/rules/element-headers.md` (Rule 0 + composed `blocks[]` + quote_trim/paraphrase/emphasis) ·
  `.claude/rules/visual-verification.md` (STOP-for-sign-off) · `.claude/rules/data-flow.md`.
- Memories: [[element-header-playbook]] · [[element-header-only-four-things-fixed]] ·
  [[headless-scrollbar-hides-real-width]] · [[svg-render-traps-fill-and-content-width]] ·
  [[screenshot-verify-visual-chunks]] · [[measured-change-not-extremes]] · [[decisions-need-a-question]].

## HOW TO BUILD AN ELEMENT HEADER (the locked workflow)
1. Read `.claude/rules/element-headers.md` FIRST. 2. Build 4 genuinely DISTINCT mockups (layout AND
illustration) inside the REAL `.kd-ep-fam` container at exact width. 3. Luneth picks. 4. Build the winner
into the entity page. 5. STOP for his visual sign-off before logging/committing. Every header ships a
complete `entity-copy.json` entry (`lede` + `why`) and a per-element probe.

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food. 3. NEVER fabricate — verbatim ⊆ sealed book, or GAP; a cited quote is verbatim (trim
only) unless consciously ruled a sourced paraphrase. 4. `corpus_seal`/`catalog_seal` are USER-ONLY.
5. A DOM probe is not a visual check — screenshot it AND verify at the true width, then STOP for his eyes.

**Corpus kv436 · 2267 claims · board 80/80 green · 4 element headers live (selenium/copper/zinc/calcium).
Next: Luneth picks element #5; build 4 mockups → his pick → port → STOP for sign-off.**
