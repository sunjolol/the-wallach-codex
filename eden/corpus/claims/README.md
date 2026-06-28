# eden/corpus/claims/

Sealed claim shards land here — **one JSON file per book** (`claims-<book_id>.json`,
e.g. `claims-dddl-3e-2011.json`), each with its own `*.golden.sha256` sibling.

Now holds three sealed books — `claims-dddl-3e-2011.json`, `claims-rare-earths.json`,
and `claims-lets-play-doctor.json` (the corpus grows as more books are mined). The
spine of the whole corpus: every index under `../indices/` is a pure derivation of
these shards. Sharding keeps each book's extraction + seal independent and the
inbound books purely additive.

Agent drafts go to `../drafts/`, never here. Promotion draft → shard is `corpus_seal.py` (user-only).
