# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-17 ~19:35 CDT, session close)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES.
> Board **76/76**. Corpus sealed at **kv=353**, **1335 claims**. Working tree clean + pushed (last commit `cdd4d04c`).
> The ~98 sweep + **ALL 39 rulings are DONE**. Corpus UNCHANGED since (kv=353, 1335 claims, board 76/76). **NEW: a later autonomous pass surfaced 45 minor fidelity fixes + measured a 6% residual defect rate — ALL AWAITING YOUR REVIEW (next section). Nothing sealed.**

---

# ★★★★ PENDING YOUR REVIEW — autonomous adjudication + confidence audit (2026-07-17 evening)
While Luneth was away, an autonomous pass ran two adversarially-verified workflows (READ-ONLY, nothing sealed). **Deliverables (force-committed for durability): `temporary/audit-2026-07-17/CONFIDENCE-REPORT.md` (the answer) · `worth-a-look-REPORT.md` + `worth-a-look-adjudication.json` (the 36) · `bulk-sample-fixes.json` (the 9).**

## The confidence answer (Luneth asked "are the claims reasonably pristine?")
**Yes for building forward.** A fresh audit of 150 RANDOM never-flagged bulk claims found a **6.0% residual defect rate** (9/150, 95% CI ~3-11%), **0 false alarms, ZERO dangerous defects** (no fabrications, wrong doses, or inversions). Every defect is minor-fidelity (injected true-in-world word, dropped hedge, gloss). The scary classes are swept; a bounded ~6% minor-polish tail remains. It re-confirmed safety values (silver = 400 mcg, etc.) as faithful.

## The 45 ratify-ready fixes (his review -> then execute small-batch EXACTLY like the 39)
- **36 from the 123 worth-a-look** — each has adjudicator + adversarial-verifier agreement; exact before->after + `proposed_edit` in `worth-a-look-adjudication.json` -> `confirmed_changes[]`.
- **9 from the 150 bulk sample** — `bulk-sample-fixes.json` -> `fixes[]`.
- ALL the SAME classes Luneth already ruled on (injected descriptor / qualifier-shift / misattribution). Process: propose batch -> his approval -> mine_batch -> USER seal. Any fix on an ENRICHED claim must also fix the sidecar ([[purge-cleans-shard-and-enrichment]]).

## Special flags inside the 45
- **WARNING: `WAL-CLM-EPIGEN-000008` (charged content — homosexuality)** is among the 36; the fix improves source-fidelity but READ IT CAREFULLY per the charged-content policy before approving.
- **4 need a page-image glance** (unresolvable from text): worth-a-look `IMMORT-000092`, `LETS-000243`; sample `EPIGEN-000026`, `RARE-000083`.
- **2 near-misses** the verifier reverted -> leave-as-is (`LETS-000136`, `LETS-000293`) — no action needed.

## Also surfaced (NOT claim edits — feeds SOURCE PURIFICATION, axis-2)
**13 source-`.txt` OCR corruptions** where the claim is FINE but the sealed book text has an OCR defect (e.g. tin "1.99 |ng/gm" -> "µg/gm", "vitamin B, 2" -> "B12"). Listed in `worth-a-look-adjudication.json` -> `source_corruption_worklist[]`. These need the resnap->reseal SOURCE process, not a claim edit.

## The open DECISION (Luneth's — a genuine cost tradeoff; the autonomous pass PAUSED here)
1. **Ratify the 45 + call it done** — apply his approved subset, treat corpus as reasonably pristine.
2. **Full bulk faithfulness sweep** (~1,100 remaining claims, same validated harness) -> ~66 more minor fixes, faithfulness-pristine. **Cost ~85M tokens** — declined to auto-fire per [[workflow-token-budget-guard]] (~24M already spent this session; the 32M ~98 sweep already "blew the cap" once).
3. **Bigger sample** (~+350 claims, ~25M) -> tighter estimate + ~20 more fixes.
4. **Source page-read** for the 3 raw books (epigenetics / lets-play-doctor / rare-earths) — the axis-2 lever; needs his camera for lets + rare.

## The validated harness (to resume any of the above)
The adjudication workflow WORKS: 161 agents, 0 errors, precise (0 false alarms on the sample). Pattern: one small payload file per claim + a `general-purpose` agent reads its file and adjudicates against the source span, then an adversarial verifier tries to REFUTE any proposed change (defaults to revert). Scripts live under `.claude/projects/<session>/workflows/scripts/worth-a-look-adjudication-*.js` + `bulk-sample-faithfulness-audit-*.js`; payloads regenerate from `handoff-v2/merged-results.json` (worth-a-look) or the corpus (sample). ★ TRAP: Workflow `args` arrive as a STRING — `JSON.parse` defensively at the top. ★ Page-image reading was DELIBERATELY not automated (fabrication risk — the pass FLAGS "needs image" instead of guessing).

---

# ★★★★ THE RULING CAMPAIGN IS COMPLETE (do not redo)
The full 2026-07-17 whole-corpus accuracy sweep is executed end to end. **All 39 rulings Luneth adjudicated are applied** — 37 rewrites + 1 purge (`WAL-CLM-IMMORT-000077` cadmium) + 1 keep (`WAL-CLM-IMMORT-000061`, no-op) — across 7 reviewed batches, each PROPOSED for his review and sealed only with his authorization (small-batch mandate honored throughout). Corpus went **1336 → 1335 claims** (the one purge) and **kv 345 → 353** (8 seals).

Commits (all pushed): `22ebb941` LETS source fixes x2 (cartilage 5mg->5gm safety; tonsillitis vit C->A) · `c3d7dfe6` RARE bookkeeping-tail strips x8 · `41e54243` IMMORT thyroid/pregnancy x3 · `86d5a3ee` + `527ab22e` LETS rewrites x6 (incl. AIDS->autoimmune + HIV-clause removed) + bundle fixup · `8f722512` EPIGEN x8 · `51a36fdb` IMMORT x6 · `5ee028b7` the purge · `cdd4d04c` final x4 (HELLS/IAIYH/RARE). The per-ruling record is in the Creator's Log + `chronicle/build-log.md`. The execution package (`temporary/audit-2026-07-17/handoff-v2/EXECUTION-PACKAGE.json`) is now fully consumed.

# ★ NEXT WORK — pick with Luneth (nothing is forced)
1. **The 123 worth-a-look pass** (optional). The sweep surfaced 123 CLEAN-but-worth-a-look claims — auditor ruled them clean but noted a doubt. Luneth did NOT rule these (he stopped at the actionable 39); they default to **leave-as-is**. Detail: `handoff-v2/merged-results.json` (`worth_a_look`). Offer him a pass whenever, no rush.
2. **The plant-derived group expansion (5 -> 20 claims).** Research at `temporary/plant-derived-research-2026-07-17/`. ★★ One of its 11 ACCEPTs — `WAL-CLM-EPIGEN-000089` — was PROVEN BAD and REWRITTEN; its source page (the colloidal-mineral table) is now fixed in the .txt. Re-validate every remaining draft before landing any. ★ Epigenetics is still `raw` in `purity-status.json` with 3362 unresolved defects (mostly PDF hyphen-wraps); one table was fixed, not the book.
3. **Regimen + Scanner rebuilds** — `chronicle/coverage-regimen-scanner-blueprint.md` signed off; `views/regimen.ts` + `views/scanner.ts` still burn.

**Phase 2 lineage topics — DEAD.** Luneth: "the hover hints are enough." Do not resurrect.

---

# ★★ THE CORPUS-EDIT PLAYBOOK (proven across 8 seals this session — READ BEFORE TOUCHING THE CORPUS)
The small-batch ruling-execution loop that worked, start to finish:
1. **Read the ruling record** (or design the fix). Verify every removal/replacement string is a UNIQUE match in the **LIVE draft** (not the audit snapshot).
2. **Check search-enrichment membership** — `eden/corpus/search-enrichment.json` is a dict under key `enrichment` KEYED BY claim_id (298 entries). If the claim is enriched, its `answer_short`/`answer` may carry the SAME defect -> fix it too (or, like RARE-000315's "Yes.", intentionally keep it — a claim_text STATEMENT and a Q&A ANSWER legitimately differ). [[purge-cleans-shard-and-enrichment]]
3. **Propose to Luneth, get ratification** (AskUserQuestion). Small batches; his review every time. Never automate. [[small-batch-build-test-log-mandate]]
4. **Apply**: claim_text/semantic edits via `mine_batch apply --batch <file>` (per book; edits the DRAFT). Source .txt edits via `safe_write replace` (single-line fragments = no CRLF issue). Enrichment edits via `safe_write.safe_rewrite` (round-trips byte-exact at indent=2 + trailing newline). Claim DELETE = filter out of the draft + safe_rewrite (mine_batch has NO delete path).
5. **If a source .txt changed**: `corpus_resnap --write --fix fixes.json` (updates books-meta hash + re-snaps shard verbatims) -> **SYNC shard->draft** (verbatim + char_offset ONLY, not claim_text) — this is the 3x-hit trap. If NO source edit, SKIP resnap entirely.
6. **Pre-seal field-by-field draft-vs-shard diff** — confirm ONLY the intended fields differ.
7. **`corpus_seal`** (USER-ONLY) -> `build_embeds` -> `node build.mjs` -> `invariants.py` **(confirm 76/76 GREEN)** -> render probe -> build-log -> Creator's Log -> **re-inline `build.mjs`** (bakes the log embed) -> **re-verify GREEN** -> commit -> push.

# ★★ TOOLING TRAPS — still live
**1. resnap -> seal ORDERING** (only when a source .txt changed). edit .txt -> edit draft -> `corpus_resnap --book X --write [--fix]` -> SYNC shard->draft (verbatim+offset only) -> field-by-field diff -> seal. Both single-char same-length source edits this session (LETS-000205 mg->gm, LETS-000452 C->A) did NOT move offsets.
**2. safe_write payloads must be LF.** Books are CRLF; single-line fragment old/new strings (no embedded newline) sidestep it entirely.
**3. Drafts are NOT all indent=1** — detect by byte-exact round-trip; refuse to write if you cannot reproduce the original bytes.
**4. books-meta.json field is `content_sha256`.** Books have no `.golden.sha256`.
**4b. PURGING SHRINKS THE VOCABULARY** -> `book_source_clean` can redden on a real word in some book. Did NOT fire for the cadmium purge (molluscs/nematode/cysts are in book_purity's base dictionary). Root-cause + allowlist WITH citation if it ever does.
**5. Claims live in TWO files** — sealed shard (`claims/`, golden) + the sidecar `search-enrichment.json` (NOT sealed, keyed by claim_id under `enrichment`). Edit the DRAFT for claims.
**6. `mine_batch` has NO delete path.** Delete = filter the draft + seal.
**7. Claim-id prefixes:** DDDL · EPIGEN · HELLS · IAIYH · IMMORT · LETS · RARE.
**8. Writes inside the repo are hook-blocked** — route through `safe_write` even from Python. Scratchpad (`AppData\...\scratchpad`) is OUTSIDE the repo and writable (the Write tool works there too).
**9. Bare `cd subdir` drifts the shared bash cwd** — use subshells; recover with PowerShell `Set-Location`.
**10. `corpus_seal` is USER-ONLY** — stage + dry-run, then get explicit approval.
**11. Machine-clock trap** — `TZ=... date` in git-bash prints UTC; use PowerShell `Get-Date` for local time (CDT in July).
**12. ★ NEW — commit-message heredoc backticks.** A message containing backticks in an UNQUOTED `python - <<PY` heredoc runs command-substitution (a bare backtick-tail hangs on stdin -> 2-min timeout; a backtick-`node build.mjs` actually builds, and the file never gets written). Use `<<'PY'` (quoted) + hardcode paths inside python, or strip backticks. For a BIG payload (this handoff), skip the heredoc — use the Write tool to the scratchpad, then `safe_write`. [[heredoc-backticks-and-verify-before-commit]]
**13. ★ NEW — don't mask a build fail in a pipe.** `node build.mjs | tail && git commit` hides a failed build -> stale bundle shipped at 75/76 (happened this session; fixed by `527ab22e`). Run build + invariants as their OWN step, confirm GREEN, THEN commit.
**14. ★ NEW — the git hooks + timeout.** pre-commit (`lint-staged`) + pre-push (`npm run check-all`, which builds) can push a CHAINED commit+push past a 2-min bash timeout. Commit and push as SEPARATE steps with generous timeouts (commit ~180s, push ~420s).

# ★ PAGE IMAGES ARE ON DISK — resolve it yourself before backlogging him
`epigenetics` (465 shots) · `immortality` (254, + `temporary/immortality-ocr/manifest.json` maps page -> `source_png`) · `iaiyh` (34) · Hell's Kitchen (full PDF at `temporary/hk/`). `locator.screenshot` N -> `Screenshot (N).png`. Crop + upscale (PIL, x3-5 LANCZOS) before reading. Only `lets-play-doctor` (56 risk claims) and `rare-earths` (19) genuinely need his camera.

# ★ OPEN QUESTIONS FOR LUNETH (carried, not blocking)
1. **`IMMORT-000060`** — page prints "nitric acid", our .txt says "nitric oxide": a word-level factual divergence (a DIFFERENT chemical, not a spelling fix). Logged correction or silent drift? Still open.
2. **The 114-claim `claim_text_numbers_backed` gate migration** — schedule it, or leave the gate a labeled WISH? (`numfix.py` ready; prototype `temporary/audit-2026-07-17/tools/gate_proto.py`.)
3. **The scanner false-alarm fix** (`handoff-v2/tools/numfix.py`, 20-case test) is BUILT + tested but NOT yet wired into the live gate.
4. **`EPIGEN-000088`** merges two source tables with different dosing bases — checked CORRECT in the derive (all 13 x1.54 targets are minerals), a corpus-prose note not a live wrong dose.

# ★ CODIFY, DON'T PROMISE (§00.B) — still owed
- The `claim_text_numbers_backed` gate (unit/row-adjacent number -> must be in the claim's own verbatim): designed + measured + prototyped (114 claims fail today = the migration debt), NOT shipped.
- A `corpus_seal` draft/shard offset guard (the resnap trap).

---

## ★★ THE PATTERN THAT KEEPS FAILING (read before writing ANY prose or firing ANY fleet)
Session A: invented 1,500-char summary essays, reached for a length TEMPLATE to game the fix.
Session B: called Mineral Toddy "his most famous product"; framed the Eagle termination without its vindication.
Session C: found the same disease **in the sealed corpus** — numbers invented over unreadable cells.
2026-07-17 (sweep): the audit built to catch it made the same class of error itself — asserting absence from a window it could not see past, reported with confidence; four "damning fabrications" were later refuted. AND: shipped a review tool whose export silently did nothing (clipboard blocked in the sandbox).
2026-07-17 (execution): the OPPOSITE discipline held — 39 rulings landed with each string verified UNIQUE against the LIVE draft, every enriched claim's sidecar checked, and the board re-verified GREEN before each commit (after one masked-build stale-bundle slip, caught + fixed + codified as trap #13).

**One failure mode: producing a confident claim/tool whose evidence (or function) does not actually cover what it asserts — and filling the gap with invention or an untested assumption instead of READING MORE / TESTING.**
**When you cannot read something, or cannot verify it works: SAY SO.**

Memories: [[small-batch-build-test-log-mandate]], [[workflow-token-budget-guard]], [[span-presence-is-not-evidence]], [[the-corrupted-blind-spot]], [[outside-knowledge-injected-as-wallach]], [[severed-quote-signature]], [[say-unreadable-never-guess]], [[editing-sealed-corpus-claims]], [[purge-cleans-shard-and-enrichment]], [[heredoc-backticks-and-verify-before-commit]], [[prove-completion-dont-narrate-it]], [[verify-against-source-images]], [[page-images-exist-for-three-books]], [[draft-indent-varies-per-book]].
