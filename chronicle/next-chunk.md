# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-23, touchup batch CLOSED · next = MINING)

# ★★★★★ Luneth's dashboard-wide touchup batch is DONE, reviewed, committed + pushed (6 commits, board 77/77, all 8 render probes green). NEXT SESSION = **MINING to enrich Ask-Wallach**, plus "some things I feel are missing" — ask him for that list at session start, do NOT assume scope.

## ▶ NEXT — mining for search (the big lever)
Per `.claude/rules/search-corpus.md` + memory `mining-serves-ask-wallach`: **the PRIMARY purpose of every mining operation is to make Ask-Wallach magical.** Mine FOR the search, biggest / most-searched entities first.

**The enrichment recipe** (matches how `state/search.ts::scoreClaim` actually ranks):
`question` in the EXACT words a person types (highest-weighted field) · correct `subject` (drives intent routing + best-answer pick) · rich LAY `synonyms` on the entity (the single biggest lever) · `topics[]` tags · a crisp `answer_short` · `also_about` cross-links · correct `facet` · per-entity QUESTION-INVENTORY coverage (L3).

**Two force multipliers now live that mining feeds directly:**
- The **Best-match block** ranks on TITLE with AND-over-terms. Entity `synonyms` are what let a lay phrasing reach the right title — currently sparse (**2/502 conditions, 14/91 essentials**). Populating aliases is a small data task with outsized payoff.
- The **Explore filter** searches `synonyms + claim topics + claim QUESTIONS`. Every well-phrased `question` mined is immediately a new way to find that topic.

**The review process is non-negotiable** (memory `review-claims-in-exact-form-approve-the-claim`, `small-batch-build-test-log-mandate`): SMALL batches, each claim shown in EXACT final form (Q → answer_short → [full answer if it adds] → verbatim quote), Luneth approves the CLAIM. Never automate. Never guess — and never guess SILENTLY (`.claude/rules/mining-veins.md`). `corpus_seal` is USER-ONLY.

## ▶ ALSO NEXT — "things I feel are missing"
Luneth has a second list for this session. **Await it; do not assume scope.**

## ✅ WHAT LANDED THIS SESSION (6 commits, each with its own build-log line + Creator's Log entry)
1. `a73be090` — Ask-Wallach blur restored lag-free (the seven ambient animations behind it were the cost, not the blur; a `:has()`-scoped freeze took compositor work 292→81ms) + typography pass + the orange scanning line deleted at source + entity-page colour clustering (essentials 16→12 colour switches).
2. `2769faa5` — related pills route 264/272, and a REAL pre-existing bug fixed: Ask-Wallach "Learn More" on any **essential** had been opening an EMPTY page since it shipped (`openEntity` passed a slug into a handler keyed by Coverage layout key).
3. `45f07a09` — Best-match block (exact title first, cap 12, AND-over-terms) + Explore content filter.
4. `105fe4ef` — Essentials tab out of the drawer menu; route alive via 3 doors; all 91 Coverage cards open their element.
5. `208368ef` — drawer menu → Unbounded (a MISSED item from the batch) + Explore's first category flush.
6. `caa4047b` + follow-up — menu optically centred between the mark and the [X], font settled at **0.7rem**.

## 🔴 FLAGGED — needs Luneth's call, not mine
- **8 related-pill slugs have no page** and stay honestly unclickable rather than pointing somewhere plausible: `digestion`, `epigenetics`, `margarine`, `ph`, `poultry`, `silicon`, `villi`, `wheat`. Each looks like a legitimate Explore topic not yet created. **Good mining candidates.**
- **The sealed design-system stylesheet has a stale comment**: its reduced-motion block still lists `ds-scan-sweep` among "7 painted offenders" (now 6 — the scan line was deleted). NOT edited under the general "permission to seal", because that gate's own docstring says *an agent re-sealing to match its own css edit is exactly what this catches* — it wants a per-file green light. Zero functional impact; a 2-line fix whenever he names the file.

## 🔴 DEFERRED (unchanged)
- **testosterone → strength**: a MINING gap, not code — the intent system is ready and waiting for the material.
- **Products in search**: needs a state-level product read-boundary + a route to `renderProductDeep`.

## 🔧 MECHANICS — the load-bearing ones
- CSS is LINKED (no rebuild); JS/data need `node tools/build.mjs`. Creator's-Log embed inlines at BUILD → **re-inline AFTER logging**.
- Every write via `safe_write` (LF payloads; multi-edit → a Python driver of exact-string replaces with `count==1` asserts — that assert caught two real mistakes this session and prevented both). Never bare `cd subdir` (it drifts cwd and blocks the hooks).
- `creators_log.py append --kind` takes a FIXED set (build · round-close · milestone · incident · design-decision · note · …); `fix` is not one. `--summary` ≤ 280 chars.
- The pre-bash guard pattern-matches on sealed filenames: mentioning `design-system.css` inside a bash STRING (e.g. a log body) trips it. Rephrase, don't fight it.
- Round-close: build → invariants → probes → build-log → `creators_log.py append` → RE-inline build → commit + push.
- **Probe-instrument traps hit this session — every one produced a confident WRONG answer:**
  - rAF cadence is BLIND to blur cost headless (a 60px blur measured identical to none). **Always ship a negative control**; it is what caught this.
  - `[data-kd-tab]` also matches BREADCRUMB anchors, not just menu buttons — scope to `.kd-knh__tabs`.
  - a condition row's `textContent` starts with its ghost claim-count, so read `.kd-condition-row__name` for titles.
  - the drawer menu was ALREADY geometrically centred (offset 0px) while looking wrong; assert the two GAPS are equal, since the centred-in-container property was true *while the defect stood*.

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if it adds]→quote), approve the CLAIM. Unreviewed = log "unreviewed". `corpus_seal` USER-ONLY.
