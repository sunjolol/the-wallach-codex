#!/usr/bin/env python3
"""corpus_derive.py — claims/* -> indices/* (pure, deterministic).

The indices (essentials, other-substances, conditions, symptoms, consistency) are
NOT hand-edited; they are regenerated here and byte-compared by corpus_verify.py
(check #8), so an index can never silently drift from the claim graph.

PHASE STATE: the full per-axis derivation lands in Phase δ (after the first books'
claims are sealed). Until then `derive_indices` returns {} — there are no indices to
build yet, and seal/verify treat "no indices" as valid. This is deliberate: claims
(Phase β/γ) seal before indices (Phase δ).
"""
from pathlib import Path

INDEX_NAMES = ["essentials", "other-substances", "conditions", "symptoms", "consistency"]


def derive_indices(shards):
    """Map index-name -> index object, derived purely from the claim shards.

    `shards`: list of Path to claims/claims-*.json.
    Returns {} until Phase δ implements the per-axis derivation. Returning {} means
    "no indices to seal" — correct for the claims-before-indices phasing.
    """
    _ = [Path(s) for s in shards]  # accepted; full walk implemented in Phase δ
    return {}


if __name__ == "__main__":
    import sys
    from pathlib import Path as _P
    root = _P(__file__).resolve().parent.parent.parent
    shards = sorted((root / "eden" / "corpus" / "claims").glob("claims-*.json"))
    out = derive_indices(shards)
    print(f"derive_indices: {len(shards)} shard(s) -> {len(out)} index object(s) "
          f"(full derivation is Phase δ).")
    sys.exit(0)
