#!/usr/bin/env python3
"""nutrient_resolver_embed.py -- project the registry's IDENTITY resolver into a runtime
map the offline app inlines, so the Coverage matcher resolves nutrient label names to canon
slugs through the SAME tables as the Python resolver.

ONE resolution truth. This artifact is GENERATED FROM nutrient_resolve: it emits exactly the
tables resolve() consults -- the registry essential_aliases (nutrients.json), the canon
mineral/amino display names (essentials-canon), the fatty-acid FA_PATTERNS, and the stereo
prefixes -- so it cannot drift from the Python resolver. core/nutrient-resolver.ts reimplements
resolve() over this map; the parity gate (nutrient_resolver_parity) + a vitest prove TS ==
Python over every substance name in the pillar. Composition-only (§00.A): identity resolution
never defines a Wallach amount.

Two outputs:
  - dashboard/assets/data/nutrient-resolver-data.json -- the runtime resolver map (the MANIFEST
    artifact; build_data() returns EXACTLY this, freshness-gated byte-for-byte).
  - dashboard/assets/js/src/core/__fixtures__/nutrient-resolver-fixture.json -- the parity
    fixture: every distinct (name, form) in the pillar -> resolve()'s slug (or null). Lives
    under src/ (out of data_artifacts_accounted's sweep); gated by nutrient_resolver_parity, NOT
    the manifest. Written alongside by write_data().

Contract (eden/derived/MANIFEST.json): build_data() -> object (pure; the derived_artifacts_fresh
gate compares json.loads(disk) == build_data()); write_data() -> regenerates via safe_write.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
ARTIFACT = ROOT / "dashboard" / "assets" / "data" / "nutrient-resolver-data.json"
FIXTURE = (ROOT / "dashboard" / "assets" / "js" / "src" / "core" / "__fixtures__"
           / "nutrient-resolver-fixture.json")
sys.path.insert(0, str(ROOT / "eden" / "tools"))
import nutrient_resolve as nr  # noqa: E402


def build_data() -> dict:
    """The runtime resolver map -- exactly the tables nr.resolve() consults, all
    deterministically ordered so build_data() byte-compares to disk."""
    return {
        "schema_version": 1,
        "_doctrine": ("Runtime IDENTITY resolver map: nutrient label name -> canon slug. "
                      "GENERATED from nutrient_resolve (registry essential_aliases + canon "
                      "mineral/amino display names + fatty-acid FA_PATTERNS + stereo prefixes) "
                      "so it cannot drift from the Python resolver. core/nutrient-resolver.ts "
                      "mirrors resolve() over this; nutrient_resolver_parity + a vitest prove "
                      "TS == Python. Composition-only (§00.A): identity never sets a target."),
        "vitamin_aliases": dict(sorted(nr.VIT_ALIAS.items())),
        "mineral_aliases": dict(sorted(nr.MIN_ALIAS.items())),
        "mineral_names": dict(sorted(nr.MINERALS.items())),
        "amino_names": dict(sorted(nr.AMINOS.items())),
        "fatty_acid_patterns": [[slug, pat] for slug, pat in nr.FA_PATTERNS],
        "omega_digit_pattern": nr.OMEGA_DIGIT.pattern,
        "stereo_prefixes": list(nr.STEREO_PREFIXES),
    }


def build_fixture() -> list:
    """Every distinct (name, form) in the sealed pillar -> resolve()'s slug (or None) --
    the real input universe the TS<->Python parity is checked over."""
    seen = {}
    for _pid, (name, form, _amt, _unit) in nr._iter_substances():
        if not name:
            continue
        key = (name, form)
        if key not in seen:
            seen[key] = nr.resolve(name, form)
    rows = [{"name": name, "form": form, "slug": slug}
            for (name, form), slug in seen.items()]
    rows.sort(key=lambda r: ((r["name"] or ""), (r["form"] or "")))
    return rows


def write_data() -> int:
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite
    art = json.dumps(build_data(), indent=2, ensure_ascii=False) + "\n"
    fix = json.dumps(build_fixture(), indent=2, ensure_ascii=False) + "\n"
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    safe_rewrite(ARTIFACT, art)
    safe_rewrite(FIXTURE, fix)
    return len(art.encode("utf-8"))


if __name__ == "__main__":
    n = write_data()
    print(f"nutrient-resolver-data.json regenerated ({n} B) + fixture ({len(build_fixture())} rows)")
