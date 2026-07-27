# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-27 · ENTITY-FILL CAMPAIGN set up)

# ★★★★★ READ FIRST (plain language)
The task for the NEXT session: **fill out the 18 newly-mined Ask-Wallach entity pages with ALL their
unique claims.** Right now each has exactly ONE claim — Luneth's directive: an entity/topic page must
surface as many unique claims as genuinely exist, never just 1 (unless only 1 legitimately exists).
Luneth will **span out agents** to do this efficiently + completely + **high quality, no corner-cutting.**

**Corpus: kv415, 2187 claims, board green 77/77, 18 entities live at 1 claim each.**

## The inventory is already computed → `temporary/entity-fill/inventory.md`
Per-entity candidate claim IDs, each tagged:
- `[LIVE subject]` — the 1 claim already on the page.
- `[ENRICHED-as:<subj>] -> also_about` — a claim ALREADY enriched under another subject that discusses
  this entity → **add this entity to that claim's `also_about`** to surface it on the page (NO new claim, cheap + faithful).
- `[UNENRICHED] -> enrich or mine` — enrich it `subject=<entity>` if it's primarily about the entity, else mine a fresh claim.
~87 strong candidates total. Rich pages: **protein (44), nitrates (11), serotonin (8), korsakoff (7),
testosterone (5)**, then the 4s (coenzyme-a, nitrites, tuna). Legitimately thin (1–2, leave small):
DHA, arsenic-trioxide, ornithine, GLA, berylliosis, silver-nitrate, melatonin, nitric-oxide, acetylcholine.
NOTE: "candidate" is a mention-based UPPER estimate — verify each is genuinely relevant before adding.

## ★ THE QUALITY BAR — non-negotiable (Luneth has corrected the short-answer failure SIX times)
- Every claim ships a **SHORT answer + a RICH FULL answer** (~90% carry both). The FULL answer IS the
  sealed `claim_text`; if a reused/thin claim's claim_text is terse, ENRICH the claim_text from the
  surrounding book paragraphs (mine_batch → re-seal). Do NOT bolt a short summary onto a thin claim.
  [[claim-summary-verbatim-format]] [[review-claims-in-exact-form]]. No padding, no memify, case-by-case.
- **Never guess / never guess silently.** Byte-verify every verbatim against the sealed book; fact-check
  synthesized details appear in source. Only mine what Wallach actually wrote. [[say-unreadable-never-guess]]
- **Never remove/skip a chip or claim that HAS content** — mine it. Only drop the genuinely-empty, and
  confirm which. (This session's mistake: I removed minable chips; Luneth: "asinine… MINE THEM.")

## The proven method (Luneth authorized workflow-draft for this campaign)
1. Workflow: one agent per entity/cluster drafts byte-faithful claims (or `also_about` proposals) from the
   book — reference script saved at `temporary/entity-fill/mine-workflow-reference.js`.
2. I DETERMINISTICALLY byte-verify every verbatim + fact-check + validate cross-links resolve.
3. Luneth reviews the batch (Q→short→FULL→quote) BEFORE seal. `corpus_seal` is USER-ONLY.
4. Assemble: `also_about` edits (search-enrichment.json) + new claims (corpus_extract finalize per book,
   ONE finalize per book per seal cycle — [[corpus-extract-finalize-not-additive]]) + enrich → seal → build_embeds → build → invariants → probes → round-close.

## ★ ENTITY-TYPE TRAP (this session's green-board bug — the gate now catches it)
A registry entity's `type` MUST be one of the runtime enum: **element·nutrient·substance·condition·concept·
topic·person·event** (core/schemas/search.ts). `compound`/`food` are NOT valid → the runtime Zod REJECTS
THE WHOLE search index → EMPTY_INDEX → every enriched page blanks while the board stays GREEN. Foods use
`substance` (salmon/beef/eggs). Non-catalog diseases (korsakoff/berylliosis) use `topic`, NOT `condition`
(condition type expects a catalog page). NEW GATE (2026-07-27): search_index_derive.ENTITY_TYPES + a
validate() check + a TS↔Python cross-check in search_index_wellformed. [[build-gate-vs-runtime-schema-drift]]

## What shipped this session (2026-07-27, kv410→kv415)
- Bucket A (347b7f41): re-pointed 11 dead related-chip slugs to existing pages.
- Bucket D (066baff1): enriched cadmium/estrogen/hydrogen-peroxide/arachidonic-acid (rich short+full after
  the short-answer correction); removed then RE-mined the dangling concepts.
- Mining (7321abcf): 18 new entities mined (workflow-drafted, byte-verified), chips restored, iodine→rhenium;
  fixed the entity-type green-board bug + added the gate; korsakoff/berylliosis→topic; citrulline ATP gloss.

## DEFERRED / FOLLOW-UPS
- The entity-fill campaign above (the main next task).
- Broader Ask-Wallach: extend the same treatment to more topics/conditions (search is the LARGER consumer,
  [[mining-serves-ask-wallach]] [[search-is-a-catch-all-over-everything]]).
- Memory index ~22KB — consolidate at a natural break ([[memory-consolidation-threshold]]).
