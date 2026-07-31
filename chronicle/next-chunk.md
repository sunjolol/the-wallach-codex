# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-07-30, after calcium's header was FINISHED + round-closed)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` HIMSELF, in a NEW session. Claude runs `tools/genesis.py` ONLY in response
to that — never a self-initiated in-session "reboot" ([[reboot-after-boot-file-changes]]). After the
report, ASK which element to build next — Luneth picks.

# ★★★★★ READ FIRST — calcium's header is DONE and committed. Board 80/80 · corpus kv432 · 2267 claims.
**FOUR** element headers now render as signed-off: selenium, copper, zinc, **calcium** (calcium finished
2026-07-30), of 90/91. Calcium's live header was reviewed by Luneth and every porting mistake he flagged
was fixed against the mockup at the REAL scrollbar-narrowed width (see the lessons below), then
round-closed + committed. **Next: build the NEXT element header (Luneth's pick).**

## ★ NEW CAPABILITIES calcium added (available to every future header)
- **`quote_trim`** (split side): show a TRIMMED literal Wallach quote by claim-ID — a contiguous slice
  of the sealed verbatim, cite composed from the registry. GATED by `mech_quote_trim_faithful`
  (critical) — the slice must be ⊆ the sealed verbatim (trim only, never fabricate). Negative test:
  `tools/test_mech_quote_trim_faithful.py`.
- **SOURCED PARAPHRASE** (`note` + `quote_claim`, NO `quote_trim`): our tightened summary of a claim,
  shown in the quote style with the registry cite but NO quote marks — faithfulness is HUMAN-REVIEW,
  not gated (Luneth's ruling, logged `chronicle/contradictions/2026-07-30-calcium-sourced-paraphrase-cite.md`).
  Use SPARINGLY, only when a verbatim `quote_trim` genuinely won't fit; the DEFAULT is the gated verbatim.
  Marked `kd-ep-fam__miniq--sourced` in the DOM.
- **`*emphasis*` in prose** (`glossify(text, true)`): opt-in inline italic via `*...*`; on for split
  prose. Off by default so corpus verbatims are untouched.
- **COMPOSED mechanism entry** + the CARD treatment (`cards:true`, scoped `kd-ep-fam--cards`) — see
  calcium in `mechanism-clarity-data.json` as the worked example.

## ★★ THE SCROLLBAR / "EXACT WIDTH" LESSON (do NOT repeat) — [[headless-scrollbar-hides-real-width]]
Headless Chromium draws **0px overlay scrollbars**; the real app has an **11px** drawer scrollbar
(`dashboard.css:30`) that narrows the cards. So a headless "widths identical" check is BLIND to the
one thing an EXACT-width request cares about — Luneth caught the right card wrapping one extra line
("you made the mockup 16px too wide … you ALWAYS make it slightly off"). A mockup shell with
`overflow:visible` (no `.app-shell`) is ~11–16px too wide by construction. **Verify wrap at the TRUE
width**: narrow `.kd-ep` by ~11px and re-measure (the 4→5 line transition crosses at ~9–11px). Never
call a width "exact" from headless alone.

## DEFERRED (carry forward)
- **`render_probe_calcium.js`** — STILL unwritten (per-element probe gap; copy `render_probe_copper.js`,
  ~47 checks, include a regression pass on a shipped element). It MUST be **scrollbar-aware** (simulate
  the 11px narrow). Real gap — the composed calcium render has no dedicated runtime probe.
- **element-headers.md Rule 1** — codify the headless-scrollbar / mockup-`overflow:visible` width trap.
- **Double-gloss** — calcium's right card underlines both "parathyroids" and "parathyroid"; dedup
  `glossify` by definition (not by word) later — a shared-fn change, verify other renders first.
- **MEMORY index compaction** — was ~191 lines; being compacted this session per the hook.

## LOAD FIRST next session
- `.claude/rules/element-headers.md` (Rule 0 + composed `blocks[]` + the new quote_trim/paraphrase/
  emphasis vocabulary) · `.claude/rules/visual-verification.md` (STOP-for-sign-off) · `.claude/rules/data-flow.md`.
- Memories: [[element-header-playbook]] · [[element-header-only-four-things-fixed]] ·
  [[headless-scrollbar-hides-real-width]] · [[svg-render-traps-fill-and-content-width]] ·
  [[screenshot-verify-visual-chunks]] · [[measured-change-not-extremes]] · [[decisions-need-a-question]].

## HOW TO BUILD AN ELEMENT HEADER (the locked workflow)
1. Read `.claude/rules/element-headers.md` FIRST. 2. Build 4 genuinely DISTINCT mockups (layout AND
illustration) inside the REAL `.kd-ep-fam` container at exact width. 3. Luneth picks. 4. Build the
winner into the entity page. 5. STOP for his visual sign-off before logging/committing. Every header
ships a complete `entity-copy.json` entry (`lede` + `why`) and a per-element probe.

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food. 3. NEVER fabricate — verbatim ⊆ sealed book, or GAP; a cited quote is verbatim (trim
only) unless consciously ruled a sourced paraphrase. 4. `corpus_seal`/`catalog_seal` are USER-ONLY.
5. A DOM probe is not a visual check — screenshot it AND verify at the true width, then STOP for his eyes.

**Corpus kv432 · 2267 claims · board 80/80 green · 4 element headers live (selenium/copper/zinc/calcium).
Next: Luneth picks element #5; build 4 mockups → his pick → port → STOP for sign-off.**
