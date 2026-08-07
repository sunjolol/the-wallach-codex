# ★ STATE ✓ measured 2026-08-06 (branch cleanup + protocol-widen PR opened)

- **master @ `be7a2d51`** — corpus kv=466, **2250 claims**, `corpus_verify` PASS, 7 book hashes match.
  `origin/master` had lagged a commit behind at `ece492f7`; it was **fast-forwarded to `be7a2d51`**
  this session so the PR base is correct. Local == `origin/master`.
- **Board 89/89, 0 failed** at this state. `build_embeds` + `node tools/build.mjs` exit 0.
  `render_probe_knowledge`, `render_probe_entity`, `render_probe_knowledge_filter` PASS.
- ⚠ **`render_probe_search` still FAILS** on hardcoded `146` calcium / `74` cancer counts. The fix
  for this lived on the deleted `derive-counts` branch (below) — it is gone; redo if wanted.
- **Kept tooling:** `tools/claim_review.py --enrichment <path>` renders a PROPOSED enrichment store
  through the real renderer instead of hand-formatting. Read-only. It is how per-claim review gets
  shown without hand-formatting — keep it.

# ★ BRANCHES — only two remain

- **`master`** = `be7a2d51` (kv466), the rollback. Trunk.
- **`protocol-widen-batch`** → **PR #1 OPEN**, not merged:
  https://github.com/sunjolol/the-wallach-codex/pull/1
  2 commits, +1,297/−1,289, 29 files. The protocol source-read (all 427 protocol claims read against
  the page, **0 fabricated doses**) plus **38 verbatim widenings** so each quote contains the dose its
  `claim_text` cites — no recommendation changed, only the stored slice got longer. Corpus on that
  branch = **kv469** (38 widenings + LPD/HK OCR de-hyphenation + 1 dose-typo fix `1 20 gm`→`120 gm`,
  three user-authorized seals). Ready to review/merge. **If it merges before the search-probe fix is
  redone, master's `render_probe_search` stays red until then; `invariants.py` is 89/89 regardless.**

# ⚠ CANCELLED & DELETED THIS SESSION — HIS CALL, REDOABLE

The post-rollback count-derivation work was untrustworthy; he cleared it. None of it is in the tree.
- **`derive-counts-from-truthful-state`** (was `3d7f37cc`; de-brittle `7e78700f` under it) — DELETED
  local+remote. It changed 3 Products `of 90` → `essentialCount()` and de-brittled 4 test probes
  (incl. the `render_probe_search` calcium/cancer counts). The **principle still stands**
  (`counts-derive-from-truth-not-hardcoded` in memory) — the *execution* was discarded. Redo from
  scratch under a trusted process if wanted. Recover: `git branch <name> 3d7f37cc`.
- **`claude/nervous-shannon-71b572`** (was `42f1ba11`) — DELETED local+remote. Stale PRE-rollback
  branch; its one probe-selector fix is already on master via `6c2c9ebb`. Recover: `git branch <name> 42f1ba11`.

# ★★★ THE ROLLBACK HEADLINE — STILL BINDING

Luneth asked for duplicate removal. Over two sessions the work grew into: 20 claims deleted, 46 claims
re-faceted, 17 questions re-cut, and 16 more re-cuts + 8 un-enrichments. He reloaded the app, found his
magnesium page gutted, and ordered everything rolled back.

**Read `duplicate-deletion-needs-per-claim-approval` in memory before touching a single duplicate.**

**THE PROCESS, HIS INSTRUCTION, NOT NEGOTIABLE:** every duplicate pair goes to him **one at a time,
first**, and he decides: which stays, which goes, **or whether the two should be merged into one**.
A review document listing many pairs with a blanket yes is NOT per-claim approval — that is exactly
what failed here.

**What made it invisible until he looked:** a re-facet deletes nothing and still guts a page. Moving
46 claims from `warning` to `physiology` took magnesium's Cautions 7 → 4 with zero claims deleted.
Un-enriching is worse: it removes the card from search entirely. Both are reader-facing deletions and
both need his per-claim yes.

# ⚠ DELIBERATELY NOT RESTORED — HIS DECISION

**The 18 claims deleted Aug 3–5 STAY DELETED.** He was offered `83c0e63f` (2,268 claims) and chose
`36e2c6cc` (2,250). Do not "helpfully" restore them.
- `b3551834` — 13 duplicate claims
- `4b962ea0` — 1 misprinted 2014 folate claim
- `473569ae` — 4 claims (the vitamin D 400 IU ceiling group)

# ⚠ OPEN

- **PR #1 awaits your review/merge.** Nothing else is queued behind it.
- **The duplicates are still there** — redo under the per-claim process above. The 46 subject+question
  collisions exist in this data again; there is no gate for them any more.
- **The count-derivation / probe de-brittle** — cancelled and deleted (above). Redo cleanly if wanted;
  this is what unblocks `render_probe_search`.
- `render_probe_search`'s two hardcoded counts (146 calcium / 74 cancer).

# TRAPS

1. `corpus_seal` / `catalog_seal` are **USER-ONLY**. Ask every time. Master needed **no seal** — a
   `git checkout` of a previously-sealed snapshot brings its goldens with it, and `corpus_verify`
   passed at kv=466 unchanged.
2. **Claims carry byte offsets into `eden/corpus/books/*.txt`.** Claims and book sources cannot be
   rolled back separately or every quote breaks. Restore the whole `eden/corpus` tree together.
3. **A green board says nothing drifted, not that anything is right.** 23 of 89 gates anchor outside
   our own files.
4. **Cross-book context in `claim_text` is BY DESIGN** — the verbatim is the strongest available
   reference, not a boundary. Do not propose a "does claim_text trace to its own book" sweep or gate.
   See `corpus-defect-signatures`.
5. **`no_duplicate_questions` was removed in the rollback.** A card reaches a page via `subject` AND
   `also_about` (`state/search.ts:84`); any page-scope query must use `subject == S or S in also_about`.
   Entity pages exclude `also_about`; topic/search pages include it.
6. **The first-run onboarding modal covers the page.** Dismiss "I'm just browsing" before any capture.
7. `git stash`/`pop` **normalises line endings** under `core.autocrlf=input`.
8. **origin/master can lag local master.** This session the PR base was wrong until a fast-forward
   push — a handoff saying "master is at X" may describe *unpushed local* state. Verify `origin/master`
   before opening a PR; the compare base is the remote, not your local ref.
