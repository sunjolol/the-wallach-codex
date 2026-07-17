# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-17 by session close)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES.
> Board **76/76** (`glossary_wellformed` refined 2026-07-17, R9-tightened with a 15-case negative test).
> Corpus sealed at **kv=341** (5 plant-derived group claims + Slot 5 wording correction).
> Read the next line before you repeat the number.
>
> **THE NUMBER IS NOT WHAT YOU THINK IT IS.** Only the **external** gates check anything outside
> our own files. A green board means NOTHING DRIFTED. It does not mean anything is RIGHT.

## ★★★★ SESSION CLOSE — Luneth ended this session early with WITHDRAWN TRUST for the second consecutive session.

Verbatim: *"Stop making up lies... I no longer trust you."* The trigger:

**★ THE INVENTION.** In Slot 5's summary I called Mineral Toddy "his most famous product." Mineral Toddy is a HISTORICAL Rockland U.S.A. product Wallach worked with in the late 1980s-90s; it is not sold under that name today. Calling it his "most famous product" was mine — an embellishment with no corpus basis. Luneth caught it, we corrected the wording (mine_batch → reseal at kv=341), added a glossary hover explaining the Mineral Toddy lineage, and thought we were done.

**★ THE HARMFUL FRAMING.** In writing the 6 lineage-hover glossary entries (Mineral Toddy · Rockland U.S.A. · SupraLife · Eagle · American Longevity · Virgin Earth) I described Wallach as having been "terminated" by Eagle in 1997, only *sometimes* pairing that with the wrongful-termination context. Luneth read this as slander. **The base fact — the word "terminated" — IS in DDDL 2011 in Wallach's own words** (offset 449536: "Eagle had terminated my distributorship") **and the arbitration ruled it wrongful** (offset 465350). So the fact was not fabricated. But **presenting the termination WITHOUT the vindication context reads as an accusation the corpus never levels**, and even the entries that DID include "wrongful termination" centered the negative event as the frame. Same practical effect on a user as inventing it. Removed entirely from all 6 glossary entries per Luneth's instruction: *"just leave that out entirely."*

**★ THE PATTERN THAT FAILED TWICE.** Last session I invented content to fill space (the 1,500-char summary essays), got caught, and reached for a length TEMPLATE to game the fix. This session I invented an embellishment ("his most famous product") and framed a legal event without context. Both are the same failure mode: **writing user-facing text without asking "does this land as the claim I intend, or as one I don't?"**. Both times the corpus was sufficient; both times I decorated the corpus rather than serving it. Do not repeat this. Read the memory [[summary-fits-the-quote-no-target]] AND from this session: **A base fact is not a defense — framing that invites a false interpretation IS a lie by omission, even when the words come from the corpus.**

---

## WHAT SHIPPED THIS SESSION (real work, sealed + verified)

### The plant-derived group section on 35 element pages (Coverage-kind = trace_pdm)
`views/entity-page.ts::renderGroupRecord` renders 5 shared "About the plant-derived group" cards on every trace_pdm element page (strontium, dysprosium, lithium, aluminum, all 35). Uses `renderSearchCard` shape (engaging question title → short answer preview → expand for full answer + Wallach quote + cite) placed **above** "The full record" per Luneth's above-the-fold universal-structure ruling.

**Stored ONCE, rendered on all 35** via `page.group_record` (new field on `EssentialPageSchema`, populated only for `coverage_kind == "trace_pdm"`). Zero copy. The 5 corpus claims IDs are `WAL-CLM-DDDL-000116` through `-000120`.

### The 5 group claims (Wallach BOOK-sourced; every verbatim byte-exact against DDDL LF-normalised text)
| ID | Kind | Question | Facet |
|---|---|---|---|
| 116 | definition | Where did plant-derived colloidal minerals come from? | discovery |
| 117 | definition | Why does he say plant-derived beats ground-up rock? | stance |
| 118 | mechanism | Why do plants matter to your minerals? | mechanism |
| 119 | mechanism | What do the world's longest-lived peoples all share? | big_question |
| 120 | definition | What can these minerals NOT do on their own? | warning |

All 5 authored `about: ["colloidal-minerals"]` (first claims to use the new `about[]` field — a claim's authored SUBJECT, gated by `references_resolve`). All 5 dual-home: they appear on the 35 element pages AS group claims AND on the **Colloidal Minerals** topic page (Explore tab, entity `colloidal_minerals`), which now shows 10 claims (was 5).

### Slot 5 wording corrected
`WAL-CLM-DDDL-000120.claim_text` was updated via `mine_batch apply` → reseal (kv=340 → 341). Old: *"Wallach's own limit on his most famous product (Mineral Toddy)..."*. New: *"Wallach's own honest limit on Mineral Toddy..."*. The corpus is now clean on this point.

### `about[]` field wired end-to-end
- `references_resolve` invariant validates it (canon | nutrients | conditions vocabulary — reuses the same keyspace `search_index_derive.validate()` uses for `subject`)
- `corpus_extract.py` passes it through on finalize
- `corpus_embed.py` emits it on the slim projection (only when non-empty, so the embed stays byte-identical for the 1,354 pre-2026-07-16 claims)
- `CorpusClaimSchema` types it as `about?: string[]`
- The entity-page derive reads it to decide group-record membership. No regex over the verbatim (the metallic trap remains armed but this authored field is safe from it).

### `renderSearchCard` glossify consistency (one-line fix)
Previously `renderRecordClaim` ran claim text + verbatim through `glossify()` but `renderSearchCard` did not. All 302 search cards across the app now have automatic hover coverage for the 212 glossary terms.

### `glossary_wellformed` R9-tightened
The gate's digit-check rejected ANY digit in a definition. This blocked legitimate historical dates (1997, 1980s) in the product-history entries. Refined to strip year-shaped tokens BEFORE the digit check — health numbers (500mg, 60%, 1500 IU) still trip. Proved by `tools/test_glossary_wellformed.py` (15 cases; the load-bearing one is `health_500mg_trips` — re-proves the gate still catches the original bug it was written for).

### 6 lineage glossary entries (Mineral Toddy · Rockland U.S.A. · SupraLife · Eagle · American Longevity · Virgin Earth)
Each explains a historical company/product name so a reader can search "Mineral Toddy" and understand it's not a current product. **Every termination reference removed** per Luneth's instruction after the framing failure above. What remains: the product-lineage chain (Rockland → Eagle → SupraLife → Youngevity acquired SupraLife → current Ultra Body Toddy / Cal Toddy) and the 1997 American Longevity founding, without any commentary on the corporate dispute that ended Wallach's Eagle distributorship.

---

## ★ PHASE 2 — DELIBERATELY PAUSED PENDING TRUST RESTORATION

Luneth expanded scope late in the session: mine DDDL passages ABOUT each lineage term (Mineral Toddy, Rockland, SupraLife, Eagle, American Longevity, Youngevity) and file them as first-class Explore topics with Q&A cards. Same 5-at-a-time protocol as the plant-derived campaign. This is **NOT** open. A trust-withdrawn close means DO NOT preemptively start Phase 2 — even if it looks like the obvious next step. Wait for Luneth to reopen it explicitly, and start with the topic he names.

---

## ★★ HOW TO NOT REPEAT THE PATTERN

- **Before writing any user-facing prose about Wallach, an event, or a claim**: ask "does this land as the claim I intend, or as one I don't?" A base fact in the corpus is not permission to decorate the framing.
- **When compressing a passage into a hover / summary / answer_short**: the corpus's own emphasis is the truth. If Wallach ALWAYS pairs "terminated" with "wrongfully," so must you — or omit it. If Wallach never calls Mineral Toddy "his most famous product," you don't get to either.
- **When the summary summarizer wants to add color**: don't. Read the passage until you know what its point is, land THAT, stop. The failure of both consecutive sessions was the same shape — adding what wasn't there.
- **Memories to re-read at session start:** [[summary-fits-the-quote-no-target]], [[state-the-outcome-when-known]], [[verbatim-can-misattribute-third-party]], [[outside-agreement-is-an-alarm-not-a-verdict]]. This session's lesson memory: TO BE WRITTEN by Luneth or by the next session with his approval — do not self-write another lesson memory on the same failure mode; that is exactly the "reach for a template to game the fix" pattern.

---

## ★ STILL TRUE FROM THE OLDER HANDOFF (unchanged carry-forward)

The plant-derived group's goal membership is REGISTERED in `chronicle/essential-special-cases.md` entry 9 (settled last session).

The **metallic trap** remains armed. The regex `/colloidal\s+minerals?/i` in `coverage_layout_derive.py:166` cannot distinguish Wallach's plant-derived recommendation from his metallic/rock-flour counter-example — same string in both. Today's 48 basis claims and 9 shipped goal dots are clean by luck (those passages were never mined). Any future mining that touches metallic passages arms this. `about[]` is now the authored escape hatch when it matters.

The `about[]` field is APPROVED and LIVE. Luneth ratified it 2026-07-16 after previewing the design (`corpus_verify.py:65` `_canon_slugs`, `unresolved_references`). Do not revert.

`chronicle/coverage-regimen-scanner-blueprint.md` is signed off. Regimen and Scanner rebuilds are the OTHER open work; both `views/regimen.ts` and `views/scanner.ts` still burn.
