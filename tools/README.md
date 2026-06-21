# Tools

Operational scripts for the Wallach-framework health agent. User-side Python; the agent invokes them through bash.

---

## corpus_search.py

Indexed retrieval across the Wallach corpus. Replaces "agent reasons from working memory" with "agent reads actual passages from books + transcripts."

### Coverage

- 4 Wallach books (`knowledge/books-clean/`): Dead Doctors Don't Lie, Hell's Kitchen, Let's Play Doctor, Rare Earths: Forbidden Cures. ~3.5MB cleaned text. Each book has a `.pages.json` or `.chapters.json` sidecar for location lookups.
- ~300 transcripts (`knowledge/transcripts-clean/`), filtered by manifest tier (High + Moderate by default; Low/Exclude dropped).
- Skip list: the dropped 90-essentials Dirobi/Harada scan (decided against 2026-06-12).

### Usage

```bash
python tools/corpus_search.py "boron"
python tools/corpus_search.py "fluoride dose" --max 5 --context 3000
python tools/corpus_search.py "vanadium chromium" --books-only
python tools/corpus_search.py "taurine eyes" --tier High
python tools/corpus_search.py "selenium" --json > /tmp/sel.json
```

### How ranking works

1. **Structured data first.** Passages that look like supplement tables / dose lists / nutrient lists rank above prose. (Heuristic: dense short lines + `mg`/`mcg`/`iu` patterns.) This enforces the brain's "structured data wins over rhetoric" rule.
2. **Tier next.** Books (Tier 1) above transcripts (Tier 2). Within transcripts, High before Moderate.
3. **Score last.** Score = total hits + 5 × distinct-term-coverage. Rewards passages where multiple query terms appear together.
4. **Per-source cap** (default 2). One book can't crowd out others.

### Flags

| Flag | Default | Notes |
|---|---|---|
| `--max N` | 8 | Total passages returned. |
| `--context N` | 2000 | Chars per passage. Brain rule: ≥2000 or full section. |
| `--books-only` | off | Skip transcripts. |
| `--transcripts-only` | off | Skip books. |
| `--tier {High\|Moderate\|Low}` | Moderate | Transcript cutoff (inclusive). |
| `--case-sensitive` | off | |
| `--json` | off | JSON output instead of markdown. |
| `--per-source N` | 2 | Max passages from one file. |

### Reading the output

Each passage block shows:
- File name (book or transcript)
- Tier (`T1 book` / `T2 transcript (High)`)
- Location (`page 309` / `chapter part 22`) — book passages only
- Score + hit count
- `**STRUCTURED**` flag when the passage matches the supplement-table heuristic

### When to use it (agent discipline)

Per brain v2.5 Retrieval Mechanism:

- **Always** before answering substance questions (4-axis decomposition needs source pulls).
- **Always** when building WHY-layer notes.
- **Always** before claiming the corpus does/doesn't address a topic.
- **Skip** for casual conversation, definitional questions, or where memory + WHY-layer notes already cover the ground.

If a query returns fewer than 3 distinct sources for a topic Wallach is known to discuss, the search is incomplete — broaden terms or try synonyms.

### Limitations

- Regex-only. No stemming, no synonyms, no embeddings. Query `"hypothyroid"` won't find `"thyroid"`-only passages — you have to know to broaden.
- Section boundaries are paragraph-based (`\n\n`), not semantic. Occasionally a passage splits a thought; widen `--context` if it does.
- Manifest CSV is authoritative for transcript tiers. Files not in the manifest are ignored.
- Cheap-tier per the v2.4 build plan. If retrieval quality is the bottleneck, upgrade path: keyword-tagged manifest → embeddings + vector search.
