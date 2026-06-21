# memory/

Long-lived knowledge, preferences, doctrine, and append-only essence. Distinct from `chronicle/` (which holds discipline surfaces and version history) and from `knowledge/` (which holds the Wallach corpus + design-wisdom).

## Canonical substrate files (referenced by `/CLAUDE.md`)

| File | Role |
|---|---|
| `source-rule.md` | The full Wallach allowlist text — `CLAUDE.md` §00.A points here as canonical |
| `engineering-doctrine.md` | The 11 engineering principles — `CLAUDE.md` §00.B substrate |
| `operating-protocols.md` | Operational discipline (24 sections) — translates doctrine + contract to write-site practice |
| `preferences.md` | Personal preferences: tone, process, communication style, division-of-labor doctrine |
| `claude-best-practices.md` | The 10 principles for HOW lessons / log entries / rules are written — Creator's Log writing standard |
| `identity.md` | Project identity — who Luneth is, what's being built, where the corpus lives |

## Essence (append-only narrative — preserved forever)

| File | Role |
|---|---|
| `essence/saga.md` | The narrative arc of the project |
| `essence/lessons.md` | Corpus-specific wisdom learned from real failures |
| `essence/decisions.md` | Architectural commitments |
| `memory-change-log.md` | Append-only ledger of every memory write |
| `source-rule-audit.md` | Every time the source rule was approached |

## Inventories + active state

| File | Status |
|---|---|
| `open-threads.md` | Active todo — will be supplanted by the Profile panel once it ships |
| `paired-write-catalog.md` | Legacy catalog — retire after src/dist parity round |
| `state-mutation-catalog.md` | Legacy LS-key inventory — superseded by `core/schemas/` Zod definitions when substrate lands |

## Discipline

- Default is don't write. When in doubt, leave it out.
- A new `lessons.md` entry comes from a real failure or insight, not vibes.
- Every write goes through `tools/safe_write.py` (per `/CLAUDE.md` never-do #7 — no Edit, no Write, no bash redirection to this dir).
- Essence (saga + lessons + decisions) stays high-signal. Editorial constraint, not soft target.
