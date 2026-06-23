# Eden — Sealed Catalog Architecture

_Created 2026-06-20. The architectural surface where the recommendation system is locked down by design._

## What Eden is

Eden is the **single sealed source of truth** for every product the recommendation system can surface across the entire dashboard. It's a closed garden: data flows IN only by user-controlled manual edits to the catalog file, data flows OUT to recommendations and read surfaces, and user inputs (Scanner, manual additions) live in a strictly parallel namespace that the recommendation engine can never read.

Naming is intentional. "Eden" captures the architectural posture: pristine, sealed, can't be poisoned, manually tended.

## The Eden invariants — what makes the garden hold

1. **One source of truth.** `eden/eden-catalog.json` is the canonical catalog. All dashboard embeds (regimen-label-lookup, goal-recommendations-data, REGIMEN_BASE_DATA.recommended) derive deterministically from it via `eden/tools/eden_build.py`.
2. **Sealed by hash.** `eden/eden-catalog.golden.sha256` holds the SHA-256 of the canonical catalog at last user-approved seal. Any drift between actual hash and golden hash → loud failure → recommendation surfaces refuse to render.
3. **Embed coherence.** All three dashboard embeds carry the same Eden version stamp. Any drift between them or against the canonical catalog → loud failure.
4. **Write-protection at the agent layer.** Claude (the agent) is explicitly forbidden from writing to `eden/eden-catalog.json` or `eden/eden-catalog.golden.sha256`. The §17 write-discipline hooks block agent writes to these files at the tool boundary, and the `eden_hash_integrity` invariant fires CRITICAL on any drift between the catalog and its sealed golden hash.
5. **Strict ID namespace.** Eden product IDs use the prefix `EDEN-LOCKED-<slug>` (e.g. `EDEN-LOCKED-btt-2-5-canister`). User-scanned items use `scan-<timestamp>`; user-manual items use `manual-<timestamp>`. The system rejects any `EDEN-LOCKED-*` ID found in user namespace data — quarantines and flags loud.
6. **Scanner severance.** Eden items have no path through the Scanner. "Details" opens a read-only modal. The "Recent scans" surface filters out any item with `EDEN-LOCKED-*` source. Boot-time scrub removes drift.
7. **Truth-anchored self-check.** `eden/tools/eden_verify.py` is purely read-only. Compares actual hashes against golden. Cannot lie because it only hashes + compares. A meta-invariant tests the verifier against a known-good fixture so a corrupted verifier can't fake a "pass".
8. **No silent failures.** Every check either passes loud OR fails loud. Quiet success = pass. Quiet anything else = a bug in the verification logic itself, which the meta-invariant catches.

## File map

| File | Purpose | Writer |
|---|---|---|
| `eden/eden-catalog.json` | The canonical sealed catalog. All products + metadata. | **User only** (Luneth) |
| `eden/eden-catalog.golden.sha256` | SHA-256 of canonical catalog at last seal. Truth anchor. | **User only**, via `eden_seal.py` |
| `eden/SCHEMA.md` | Strict schema spec for eden-catalog.json. | Editors of this doc, not the catalog. |
| `eden/tools/eden_build.py` | Derives the three dashboard embeds from canonical catalog. Read-only against eden-catalog.json. | Agent (can run, can't modify catalog) |
| `eden/tools/eden_seal.py` | Recomputes the golden hash. Run only when user intentionally modifies catalog. | User only |
| `eden/tools/eden_verify.py` | Read-only verifier. Hashes catalog, compares against golden, verifies embed coherence. | Agent (can run, only reports) |
| `eden/tools/eden_test_fixture.json` | Known-good catalog used by the meta-invariant to test the verifier. Locked. | User only |

## How updates work

**To add or modify an Eden product (you, the user):**
1. Edit `eden/eden-catalog.json` directly OR paste a full replacement into the file. Agent can paste contents for you to overwrite with, but the agent cannot write to this file.
2. Run `python3 eden/tools/eden_seal.py` to regenerate the golden hash.
3. Run `python3 eden/tools/eden_build.py` to refresh the dashboard embeds.
4. Run `python3 eden/tools/eden_verify.py` to confirm everything is coherent.
5. Reload dashboard.

**To verify Eden integrity (agent or user, any time):**
- `python3 eden/tools/eden_verify.py` — read-only report. Returns `pass / fail / drift-detected`.

## Why this works

Eden is the architectural answer to "the system can't be trusted to be self-consistent without external proof." Hash anchoring is the external proof. The verifier can't lie because it only computes hashes (deterministic, math-anchored). The meta-invariant prevents the verifier itself from being silently broken. The agent's write-protection lockdown means even agent-side mistakes can't poison the garden. The user is the only writer; everyone else reads.

If something inside Eden goes wrong, **failure is loud and the system refuses to surface recommendations**. The user always knows whether Eden is healthy or not — no in-between, no silent degradation.

This is the "no silent failures + no discipline-only + truth-anchored" framing fully instantiated at the catalog layer.

## Related doctrine

- `.claude/rules/source-rule.md` — Eden formalizes the boundary the cornerstone has been protecting.
- `.claude/rules/engineering-doctrine.md` — Doctrine §1 (no silent failures), §6 (verifiable invariants), §11 (truth-anchored invariants) instantiated in code.
- `.claude/rules/write-discipline.md` (§17) — Edit-tool ban applies to all Eden files; only `safe_write` for agent-readable edits; `eden-catalog.json` and `eden-catalog.golden.sha256` are user-only.
