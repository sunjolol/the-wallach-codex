# ★ NEXT SESSION — both corpus branches are clean; PR #1 is rebased and ready (read first)

Two big things shipped and are on the remote. **Nothing is pending or broken.**

## State of the world
- **`master`** = `1c47831f`, **kv467**, 2162 claims, board 89/89 — the **dedup** (274 rulings applied,
  88 deleted, 5 merged, 92 re-tagged). Pushed.
- **`protocol-widen-batch`** (PR #1) = `f9b416a2`, **kv468** — master **+ PR #1's 38 protocol
  dose-widenings + 2 book de-hyphenations**, rebased cleanly onto the dedup. Board 89/89. Pushed
  (force). **You are on this branch.**
- PR #1 now **fast-forwards master** (its only diff vs master is the 38 widenings — a correct, small,
  ready-to-merge PR, NOT unsaved work). Merge it whenever: `git checkout master && git merge --ff-only
  protocol-widen-batch && git push`. That takes master to kv468 with everything.

## Nothing else is open
The whole duplicate-review nightmare is done. Build-log has the two round-closes (`13:50` dedup,
`14:16` pr1-rebase); Creator's Log `lg_msjaxmrr` + `lg_msjbtnac`.

## Traps this stretch exposed (durable — see memory)
1. **After `corpus_seal`, always run `build_embeds`** (not just `corpus_embed`) — else 3 gates red on
   stale dashboard artifacts.
2. **Deleting a claim can un-vouch a book word** → `book_source_clean` reds elsewhere → allowlist the
   real term in the book's purity baseline.
3. **A merge that folds a topic's only card drops it from search** → add the topic to the keeper's
   `also_about`; grep `foods-curation.json` before folding.
4. **A corpus branch "rebase" is NOT a git rebase** — the shards/goldens/kv/derived are generated, so
   git conflicts are unresolvable soup. Replay the SOURCE change (book edits + `resnap --fix` the
   verbatims) on the new base and re-seal. See memory `corpus-branch-rebase-is-source-replay`.

# ⚠ DELIBERATELY NOT RESTORED — HIS DECISION (still binding)
The 18 claims deleted Aug 3–5 and the 88 deleted this session STAY DELETED — each his own ruling.
