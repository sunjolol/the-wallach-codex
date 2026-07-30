# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-07-30, after calcium's header was PORTED LIVE)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` HIMSELF, in a NEW session. Claude runs `tools/genesis.py` ONLY in response
to that — never a self-initiated in-session "reboot" ([[reboot-after-boot-file-changes]]).

# ★★★★★ READ FIRST — calcium's element header is LIVE, but it is a CHECKPOINT, not a sign-off.
Board **79/79 green · corpus kv432 · 2267 claims**. **Four** element headers now render
(selenium, copper, zinc, **calcium**). Calcium (#3) was ported live 2026-07-30 from the SIGNED-OFF
mockup `temporary/calcium-header-v5.html` and committed as a checkpoint — Luneth's words at commit:
**"tons of mistakes porting it live … I'll deal with these in a new session"** (he was low on session
usage). So the LIVE render has porting imperfections HE will flag; the mockup is the approved target.

## ★ HOW TO REVIEW (do this first)
Open `dashboard/dashboard.html` → **Knowledge → Essentials → Calcium**. Compare the live header to
the approved `temporary/calcium-header-v5.html` side by side. Luneth drives — let him flag the
porting mistakes; do NOT guess-fix. A headless screenshot does NOT capture the below-fold reveal
(the closing 147 quote + Youngevity sources fade in on scroll — they ARE in the DOM, confirmed);
scroll the real app to see them.

## ★★ KNOWN ISSUE #1 — the 9-10.8 number is back, in a quote (Luneth's decision needed)
The **"Why the timing matters"** split card pulls **LETS-000078's FULL sealed verbatim**, which ENDS
with *"…The normal range is 9-10.8 mg"* — the number Luneth called asinine and wants GONE. In the
mockup it was hand-excerpted; **R3 forbids hand-excerpting a live quote** (verbatim is pulled whole
by claim-ID). Options he was given (his call): **(1)** swap that card to a prose `note` — same
"convulsions strike before the blood drops" point, no 9-10.8, costs the one direct Wallach quote in
the split; **(2)** keep it (Wallach's contextual words, small italic); **(3)** re-seal a trimmed
LETS-000078 (`corpus_seal` is USER-ONLY). Not yet resolved.

## ★ KNOWN ISSUE #2 — other porting imperfections
Luneth said "tons of mistakes" — he will review live and enumerate. Likely candidates to check
against the mockup: card padding/spacing, the hook footer band, the CTA sizing, figure scale, the
heart. All figures verified scale 1.0 + no collisions, but VISUAL parity is his eyes' call.

## ✔ WHAT LANDED (committed 2026-07-30, board green, signed-off headers BYTE-IDENTICAL)
Calcium is the FIRST **composed** mechanism entry. New architecture, all verified:
- `core/schemas/mechanism-clarity.ts` — composed entry gained an opt-in **`cards`** flag; the split
  side gained a **`note`** (prose evidence); the beat gained a **`cta`** ({label, tab}).
- `views/entity-page.ts` — two figure fns on GENERIC keys: **`diseaseScaleFigure`** (`disease_scale`,
  the 147-vs-~10) + **`heartbeatFigure`** (`heartbeat`, the 1% heart with a PQRST monitor line);
  dispatch cases; `mechEvidence` note branch; `mechBeats` cta (empty string for legacy → BYTE-
  IDENTICAL, proven by render_probe_mech_shape 18/18); `renderMechanism` `kd-ep-fam--cards` modifier.
- `assets/data/mechanism-clarity-data.json` — calcium composed entry (`cards:true`; quotes by
  claim-ID **LETS-000078** [the 9-10.8 one] + **IMMORT-000015** [the 147 quote]).
- `assets/styles/drawer-knowledge.css` — figure text TIERS (hero numerals / figure title / caption
  sit OUTSIDE the `.kd-ep-fam__g*` family the 12px figure-type gate governs, like `statnum` — NOT a
  dodge, a real tier); the CARD treatment **scoped to `.kd-ep-fam--cards`** so copper/selenium/zinc
  are untouched; **Chakra Petch `@font-face`** (the beat-hook font Luneth chose — pairs with Unbounded).

## DEFERRED (next session)
- **`render_probe_calcium.js`** — NOT written yet. The element-headers playbook requires a per-element
  probe (~47 checks, copy `render_probe_copper.js`, include a regression pass on a shipped element).
  This is a real gap — calcium's composed RENDER path has no dedicated runtime probe yet.
- The **"1%"** in the heart's "CALCIUM · THE LIVING 1%" title — kept as approved prose (it matches the
  approved calcium lede in entity-copy.json). Formal source-mapping of the 99/1 claim
  (IMMORT-000065 / EPIGEN-000232 have empty `essentials[]`) is a later tightening, not a blocker.

## LOAD FIRST next session
- `.claude/rules/element-headers.md` (Rule 0 + the composed `blocks[]` vocabulary) ·
  `.claude/rules/visual-verification.md` (the STOP gate) · `.claude/rules/data-flow.md`.
- `temporary/calcium-header-v5.html` — the APPROVED target to port-match against.
- Memories: [[element-header-playbook]] · [[element-header-only-four-things-fixed]] ·
  [[answered-questions-stay-answered]] (the 9-10.8 objection stands) · [[decisions-need-a-question]] ·
  [[refine-gate-dont-strip-or-bypass]] · [[screenshot-verify-visual-chunks]].

## MAINTENANCE
Memory index ~190 lines (limit 200) — compact by shortening HOOKS, never dropping entries
([[memory-consolidation-threshold]]).

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food. 3. NEVER fabricate — verbatim ⊆ sealed book, or GAP. 4. `corpus_seal` + `catalog_seal`
are USER-ONLY. 5. A DOM probe is not a visual check — screenshot it, then STOP for his eyes.

**Corpus kv432 · 2267 claims · board 79/79 green · 4 element headers live. Next: Luneth reviews the
LIVE calcium header, decides the 9-10.8 quote (issue #1), and flags the porting mistakes to fix.**
