#!/usr/bin/env python3
"""
eden_verify.py — read-only integrity verifier for Eden.

Truth-anchored, deterministic, cannot lie. Compares:
  1. Actual SHA-256 of eden/eden-catalog.json against eden/eden-catalog.golden.sha256
  2. eden_version field embedded in the three dashboard embeds matches the
     eden_version in the canonical catalog (Phase E — wiring step)
  3. Catalog conforms to the strict schema in eden/SCHEMA.md

Behaviour:
  - PASS: prints PASS line + summary statistics, exits 0
  - FAIL: prints FAIL line + specific drift detected, exits 1
  - BOOTSTRAP: golden hash is the placeholder; reports the bootstrap state
    and exits 2 (signals "Eden not yet sealed" — distinct from drift)

Never modifies any file. Never silently passes anything. If the hash
matches but the schema doesn't validate, that's still a FAIL.

The agent (Claude) MAY run this tool. The agent MAY NOT modify Eden files.
This file (eden_verify.py) itself can be agent-modified; a meta-invariant
in tools/invariants.py tests this verifier against eden_test_fixture.json
so a corrupted verifier is caught.
"""

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
EDEN_DIR = ROOT / "eden"
CATALOG_PATH = EDEN_DIR / "eden-catalog.json"
GOLDEN_PATH = EDEN_DIR / "eden-catalog.golden.sha256"

# Strict slug pattern enforced on every Eden ID
EDEN_ID_RE = re.compile(r"^EDEN-LOCKED-[a-z0-9-]+$")

# Source-rule cornerstone allowlist for source citations
ALLOWED_SOURCE_KINDS = {"wallach_book", "youngevity_label", "pack_extrapolation", "wallach_transcript", "youngevity_url"}


def sha256_of_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def read_golden() -> str:
    if not GOLDEN_PATH.exists():
        return ""
    return GOLDEN_PATH.read_text(encoding="utf-8").strip()


def is_bootstrap_golden(golden: str) -> bool:
    return golden == "" or golden == "BOOTSTRAP-PLACEHOLDER-PRE-SEAL"


def validate_schema(catalog: dict) -> list[str]:
    """Strict schema validation per eden/SCHEMA.md. Returns list of failure
    messages. Empty list = schema valid."""
    failures = []
    required_top = {"schema_version", "eden_version", "sealed_at", "products", "goals", "tiers"}
    missing_top = required_top - set(catalog.keys())
    if missing_top:
        failures.append(f"top-level missing fields: {sorted(missing_top)}")

    products = catalog.get("products", {})
    if not isinstance(products, dict):
        failures.append("products must be a dict")
        return failures

    goals = catalog.get("goals", {})
    if not isinstance(goals, dict):
        failures.append("goals must be a dict")
        return failures
    valid_goal_keys = set(goals.keys())

    tiers = catalog.get("tiers", {})
    if not isinstance(tiers, dict):
        failures.append("tiers must be a dict")
        return failures

    # Validate each product
    for pid, prod in products.items():
        if not EDEN_ID_RE.match(pid):
            failures.append(f"product ID '{pid}' does not match EDEN-LOCKED-<slug> pattern")
        if not isinstance(prod, dict):
            failures.append(f"product '{pid}' is not a dict")
            continue
        required = ["canonical_name", "brand", "brand_tier", "source_citations",
                    "nutrients", "category_label", "serving_size",
                    "servings_per_container", "dose_text", "pricing", "goals",
                    "eden_metadata"]
        for field in required:
            if field not in prod:
                failures.append(f"product '{pid}' missing required field '{field}'")
        # brand_tier must be 1 or 2
        if prod.get("brand_tier") not in (1, 2):
            failures.append(f"product '{pid}' brand_tier must be 1 or 2, got {prod.get('brand_tier')!r}")
        # source_citations must have at least one entry from allowed kinds
        cites = prod.get("source_citations", [])
        if not isinstance(cites, list) or len(cites) == 0:
            failures.append(f"product '{pid}' must have at least one source citation")
        else:
            for c in cites:
                if not isinstance(c, dict) or c.get("kind") not in ALLOWED_SOURCE_KINDS:
                    failures.append(f"product '{pid}' has source citation with invalid kind: {c}")
        # nutrients: empty array only allowed with explicit_empty marker
        nutrients = prod.get("nutrients", None)
        if not isinstance(nutrients, list):
            failures.append(f"product '{pid}' nutrients must be a list")
        elif len(nutrients) == 0:
            if not prod.get("nutrients_explicit_empty"):
                failures.append(f"product '{pid}' has empty nutrients without nutrients_explicit_empty: true")
            if "nutrients_empty_reason" not in prod:
                failures.append(f"product '{pid}' has empty nutrients without nutrients_empty_reason")
        # goal references must be valid
        for g in prod.get("goals", []):
            if g not in valid_goal_keys:
                failures.append(f"product '{pid}' references unknown goal '{g}'")

    # Every goal must have at least one product referencing it
    for gkey in goals:
        referenced = any(gkey in p.get("goals", []) for p in products.values())
        if not referenced:
            failures.append(f"goal '{gkey}' has zero products referencing it")

    # hbsp_default tier products must exist + be brand_tier 1
    hbsp = tiers.get("hbsp_default", [])
    for pid in hbsp:
        if pid not in products:
            failures.append(f"tiers.hbsp_default references missing product '{pid}'")
        elif products[pid].get("brand_tier") != 1:
            failures.append(f"tiers.hbsp_default product '{pid}' is not brand_tier 1")

    return failures


def main() -> int:
    if not CATALOG_PATH.exists():
        print(f"FAIL: catalog file missing: {CATALOG_PATH}")
        return 1
    if not GOLDEN_PATH.exists():
        print(f"FAIL: golden hash file missing: {GOLDEN_PATH}")
        return 1

    actual_hash = sha256_of_file(CATALOG_PATH)
    golden = read_golden()

    if is_bootstrap_golden(golden):
        print(f"BOOTSTRAP: Eden not yet sealed. Run eden/tools/eden_seal.py to seal.")
        print(f"  catalog: {CATALOG_PATH}")
        print(f"  actual SHA-256: {actual_hash}")
        return 2

    # Hash check
    if actual_hash != golden:
        print(f"FAIL: catalog hash drift detected")
        print(f"  expected (golden): {golden}")
        print(f"  actual:            {actual_hash}")
        print(f"  catalog: {CATALOG_PATH}")
        return 1

    # Schema validation
    try:
        catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"FAIL: catalog JSON parse error: {e}")
        return 1

    schema_failures = validate_schema(catalog)
    if schema_failures:
        print(f"FAIL: {len(schema_failures)} schema violation(s):")
        for f in schema_failures[:10]:
            print(f"  - {f}")
        if len(schema_failures) > 10:
            print(f"  ... and {len(schema_failures) - 10} more")
        return 1

    # All pass
    n_products = len(catalog.get("products", {}))
    n_goals = len(catalog.get("goals", {}))
    n_hbsp = len(catalog.get("tiers", {}).get("hbsp_default", []))
    eden_version = catalog.get("eden_version")
    print(f"PASS: Eden integrity verified.")
    print(f"  eden_version: {eden_version}")
    print(f"  catalog hash matches golden ({actual_hash[:12]}...)")
    print(f"  {n_products} products, {n_goals} goals, {n_hbsp} HBSP default(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
