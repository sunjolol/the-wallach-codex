#!/usr/bin/env python3
"""coverage_layout_derive.py -- derive the Coverage periodic-table layout from the
sealed canon (Phase E, crack #1 deferred half, 2026-07-06).

The Coverage tiles' CANONICAL fields (display name, and for minerals the atomic symbol +
number) used to be hand-typed in coverage-layout-data.json -- a silent duplication of
essentials-canon (91 names re-typed). This generator makes canon the single home for those
values: the hand-authored SKELETON (coverage-layout-skeleton.json) holds only the editorial
ARRANGEMENT (section/subsection chrome, per-tile codes/letters/abbrs/hints, the goals block)
plus each tile's `key` (a reference to a canon layout_key); this generator fills each tile's
`name` from canon display_name (uppercased) and, for minerals, `sym`+`num` from canon. So the
periodic table's canonical identity can never drift from the pillar again -- it IS the pillar.

Contract (eden/derived/MANIFEST.json): build_data() -> the artifact object (pure, no write;
the derived_artifacts_fresh gate compares json.loads(disk) == build_data()); write_data() ->
regenerates the on-disk artifact via safe_write (used by build_embeds.py).
"""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SKELETON = ROOT / "dashboard" / "assets" / "data" / "coverage-layout-skeleton.json"
CANON = ROOT / "eden" / "corpus" / "essentials-canon.json"
ARTIFACT = ROOT / "dashboard" / "assets" / "data" / "coverage-layout-data.json"


def _canon_by_key() -> dict:
    canon = json.loads(CANON.read_text(encoding="utf-8"))["essentials"]
    return {c["layout_key"]: c for c in canon}


def _derive_tile(skel_tile: dict, cbk: dict) -> dict:
    """Merge a skeleton tile (key + editorial fields) with its canon-derived identity.
    name <- canon display_name (uppercased); minerals also get sym <- symbol, num <-
    atomic_number. Every other field on the tile is editorial and passes through."""
    key = skel_tile["key"]
    c = cbk.get(key)
    if c is None:
        raise KeyError(f"coverage-layout-skeleton tile key {key!r} is not a canon layout_key")
    out = dict(skel_tile)
    out["name"] = c["display_name"].upper()
    if c["category"] == "mineral":
        out["num"] = c["atomic_number"]
        out["sym"] = c["symbol"]
    return out


def build_data() -> dict:
    """Pure: skeleton + canon -> the full coverage-layout-data object. No write.
    Skeleton metadata (top-level keys starting with '_') is dropped -- the generated
    artifact carries only the rendered structure (sections + goals)."""
    skeleton = json.loads(SKELETON.read_text(encoding="utf-8"))
    cbk = _canon_by_key()
    out = {k: copy.deepcopy(v) for k, v in skeleton.items() if not k.startswith("_")}
    for sec in out.get("sections", []):
        if "tiles" in sec:
            sec["tiles"] = [_derive_tile(t, cbk) for t in sec["tiles"]]
        for sub in sec.get("subsections", []):
            sub["tiles"] = [_derive_tile(t, cbk) for t in sub["tiles"]]
    return out


def write_data() -> int:
    """Regenerate coverage-layout-data.json from the skeleton + canon via safe_write."""
    import sys
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite
    text = json.dumps(build_data(), indent=2, ensure_ascii=False) + "\n"
    safe_rewrite(ARTIFACT, text)
    return len(text.encode("utf-8"))


if __name__ == "__main__":
    n = write_data()
    print(f"coverage-layout-data.json regenerated from skeleton + canon ({n} B)")
