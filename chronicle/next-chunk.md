# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-08-02)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` in a NEW session; Claude runs `tools/genesis.py` ONLY in response, reports,
then asks what to resume.

# ★★★ TOP PRIORITY — front-facing quote OCR remediation ("for good")
Luneth found enriched (USER-FACING) quotes shown with OCR garbage — e.g. `WAL-CLM-RARE-000336`
("tisk"→risk, "rea"→area, "ancer"→cancer, "doses f"→of) and `WAL-CLM-LETS-000502` (line-break splits
"try-\ning", "de-\nspite", "mal-\nabsorption", "1 20"→120). Root cause: 3 books are officially `raw`
(untouched OCR) in `eden/tools/purity-status.json` — epigenetics, lets-play-doctor, rare-earths; immortality
`purifying`. Claims were enriched from them anyway; "fix as we enrich" was a promise with NO gate.
He wants **every front-facing quote that is wrong found + cleaned + LOCKED so it can never recur.**
NOT whole-book cleanup.

→ **READ IN FULL:** `chronicle/frontface-ocr/BLUEPRINT.md` — self-contained: exact scope (1,838 quotes),
  ground-truth vision method (diff each verbatim vs its source PAGE IMAGE), per-book page mapping, the
  fix pipeline (source-correct → resnap → USER seals → rebuild), the TWO lock-gates that make it permanent,
  and the phases (start at Phase 0 PILOT — 5/book incl. the two known-bad — prove before scaling).
→ **Target list ready:** `chronicle/frontface-ocr/worklist.json` (1,838 entries, per-claim offset +
  Screenshot(N) + verbatim). Page images: epig/immort `Screenshot (N).png` dirs in temporary/; lets +
  rare-earths PDFs (both text-layered) — lets PDF now in `temporary/lets-play-doctor-pdf/`.
→ Honest limit (state it, don't soften): no scanner is 100% (invisible class = valid-word swaps,
  subscript B,→B6). The vision pass catches those once; the gate holds mechanical classes. See BLUEPRINT §5,§7.

# ★ STATE IS CLEAN — nothing needs re-deriving
Board 80/80, all 15 derived artifacts in sync, dist fresh (verified 2026-08-02).
UNCOMMITTED in the working tree (all internally consistent; board green):
- **Sealed claim round:** `WAL-CLM-EPIGEN-000464` (mechanism — thiamine/TPP is needed to metabolize 5
  aminos: Met/Thr/Leu/Ile/Val) — SEALED (knowledge_version=438), enriched + confirmed live in search,
  embeds + bundle rebuilt. (Creator's Log `lg_msbwch6z_uzad5p`.)
- **Amino review docs** (gitignored): `temporary/amino-claim-candidates.md`, `temporary/amino-claims-verified.md`.
  Discovery→verify found 3 clean-new; only Claim C sealed. Dropped/deferred: fibromyalgia (already sealed
  DDDL-000098/-000136), methionine→SAMe (OCR-garbled source), alkaptonuria + arginine codons (Luneth's call).
- **Vitamin C demos** (gitignored): `temporary/vitamin-c-demos.html` — 4 redesigned distinct demos
  (1 Come-Apart-Seams lead · 2 Number War · 3 On Every Page · 4 fresh "Unlocks Iron"); jargon "why this
  number" + throwaway micro-quotes removed. **AWAITING Luneth's direction pick.**
- `chronicle/frontface-ocr/` (BLUEPRINT + worklist) — the campaign above.
→ **Nothing committed/pushed.** Commit when Luneth says.

# ★ DEFERRED header work (resume after the OCR campaign, or on redirect)
- **Vitamin C:** Luneth reviewing the 4 redesigned demos → pick direction → refine → build live → visual sign-off.
- **Vitamin A** (SHIPPED header): pull-quote is a ~240-char run-on he wants shorter. He REJECTED the 4
  options offered (DDDL-000056 / DDDL-000165-trim / LETS-000196 / DDDL-000041) and was finding his own when
  he hit the OCR issue. Re-ask after the OCR campaign clears (his own quote may itself be a raw-book quote to
  verify first). Lives in `mechanism-clarity-data.json` vitamin-a `quote` block (claim DDDL-000165 + trim + highlight).
- The 29 header demos review/refine (prior campaign) — still open (see the earlier handoff in git history / build-log).

# ★ SEPARATE BUG (don't lose)
"reduced" gets a dotted-underline term-gloss with irrelevant hover — the gloss matcher over-firing on a
common word (NOT OCR). Fix in `eden/tools/term-gloss-lexicon.json` + gloss gates. See BLUEPRINT §8.

# STANDING DOCTRINES (unchanged)
1. `corpus_seal`/`catalog_seal` are USER-ONLY. 2. NEVER fabricate — verbatim ⊆ sealed source (by claim id)
or GAP; say UNREADABLE, never guess. 3. Every claim lives in ONE of 3 homes; search is a retrieval layer.
4. A DOM probe is NOT a visual check — screenshot + STOP for his eyes. 5. NEVER build a header live without
explicit permission. 6. Small, reviewed increments. 7. No "for good" without a GATE (§00.B: codify, don't promise).

**Board 80/80 · state clean, nothing to re-derive · TOP PRIORITY = front-facing OCR remediation (chronicle/frontface-ocr/BLUEPRINT.md) · header work deferred · nothing committed.**
