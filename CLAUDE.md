# CLAUDE.md — The Wallach Codex

_The operating contract. Everything else loads on demand._

## What this is

A single-page, offline-first health-coverage dashboard for Dr. Joel Wallach's framework. Opens from
`file://`. No server, no backend, no accounts, no telemetry, **no network at runtime**. The user owns
100% of their data on their device; export/import is JSON. Distributed as static files plus a pinned
portable browser, so it cannot be taken offline or broken by an update, and runs for years with no
upkeep.

`eden/` holds the three sealed, hand-edited data pillars — Wallach Corpus, Youngevity Product DB,
shared Catalog. `eden/tools/` derives them into `dashboard/assets/data/*.json`; esbuild inlines that
into one bundle. `dashboard/dashboard.html` is a pure shell. The rest of the layout explains itself.

## §00.A — Wallach is the only source of amounts (100/100)

**Every recommended amount, dose, range, daily target, deficiency sign, and health claim traces to a
Wallach book.** No exceptions — including Luneth, who has retracted his own experience against it.
The 7 books are registered in `eden/corpus/books-meta.json`; **that registry is the authority**, never
a hand-typed citation and never a list memorized from a doc. Books only — no lectures or transcripts.

Youngevity contributes **product composition only** — what a product contains. Composition is an
input to the coverage math, never a target. Where the corpus has no dose claim yet, the honest answer
is "no Wallach target stated" — never a fallback number from anywhere else.

Wrong doses hurt real people, so this is the one place to be rigid rather than clever. Never
fabricate: a verbatim is a byte-exact slice of the sealed source or you say UNREADABLE. **Never
guess, and never guess silently** — surface the uncertainty in the same turn.

Changing this rule needs the three-turn override in the `wallach-source-rule` skill. Load that skill
before touching any number, dose, or claim.

## §00.B — Engineering standard

1. **Two hand-edited sources, everything else generated.** Only the sealed `eden/` pillars are
   hand-edited. No canonical value lives in two hand-maintained places.
2. **Codify, don't promise.** A rule that can be a gate *is* one, shipped in the same patch. A rule
   with no gate is labeled **WISH** — honestly, never sold as safe.
3. **Surface uncertainty loudly.** A comment that has drifted out of sync with its code is a defect
   worse than no comment.

When §00.A and §00.B conflict: stop, write `chronicle/contradictions/<date>-<slug>.md`, surface it
prefixed `⚠ PRIME DIRECTIVE CONFLICT`. A wins by default; silently picking is itself the violation.

## What a green board actually means

`PYTHONUTF8=1 python tools/invariants.py` — 90 gates. Green means **nothing drifted**. It does *not*
mean anything is right. Only the 23 gates anchored outside our own files (book bytes, physical
constants, git) can catch a value that is wrong but self-consistent. Report the split, never hand
Luneth the total as evidence about Wallach.

A seal proves a pillar has not **changed** — never that it is **right**. The canon's mineral tiers
were mockup-derived, sealed, and green for three weeks.

## Gotchas that will cost you a session

1. **`corpus_seal` and `catalog_seal` are USER-ONLY.** Permission from a past session never carries
   forward. Ask every time.
2. **Never build a live element header without explicit permission.** Demo-only until Luneth approves.
3. **A DOM probe is not a visual check.** Screenshot it, then stop for his eyes.
4. **A gate can be green *because of* the defect** — and can go red *because of* the correction. On a
   post-fix red, ask what was making it pass before.
5. **Searching book text or a sealed verbatim literally is blind.** Both are byte-exact OCR with hard
   line breaks inside sentences; `"pure cobalt requirement"` returns a confident null. Use `\s+`
   between words, or enumerate the entity's claims instead of grepping for a string you expect.
6. **Confirm a defect in the encoding the file actually uses before "fixing" it.** PowerShell reads
   UTF-8 as cp1252 and git escapes non-ASCII paths — both have produced convincing false alarms.
7. **`.claude/invariant-baseline.json` is invariant-scoped**: one entry tolerates a whole gate
   forever. Per-case exceptions go *in* the gate with a reason and a test. It is empty by design.

## Skills

Domain guidance lives in `.claude/skills/` and loads when the work matches — source rule, write
discipline, mining, round-close, dashboard code, testing, element headers, visual verification,
charter, engineering doctrine. Read the one that matches before your first write in that domain.
Do not preload them all.

## Genesis

Luneth types `genesis`; run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which task to
resume** — never a flair-only boot. If a new invariant red appears, that is the only response. If he
opens with substantive work instead, do a silent micro-check and proceed.

The live handoff is `chronicle/next-chunk.md`. If anything here conflicts with an older document,
older loses.
