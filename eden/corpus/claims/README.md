# eden/corpus/claims/

Sealed claim shards land here — **one JSON file per book** (`claims-<book_id>.json`,
e.g. `claims-dddl-3e-2011.json`), each with its own `*.golden.sha256` sibling.

Now holds seven sealed books — `claims-dddl-3e-2011.json`, `claims-rare-earths.json`,
`claims-lets-play-doctor.json`, `claims-epigenetics.json`, `claims-immortality.json`,
`claims-iaiyh.json`, and `claims-hells-kitchen.json`. `../books-meta.json` is the registry
of record; read the book list off it rather than off this sentence. The spine of the
whole corpus: every index under `../indices/` is a pure derivation of these shards.
Sharding keeps each book's extraction + seal independent and the inbound books purely
additive.

Mining drafts go to `../drafts/`, never here. That directory exists only while a mining
round is open — `corpus_seal.py` (user-only) promotes a draft into a shard and clears it,
so a clean tree has no `../drafts/`.
