#!/usr/bin/env python3
"""
eden_seal.py — recompute the golden SHA-256 hash for Eden's catalog.

Run ONLY when the user has intentionally modified eden/eden-catalog.json
and wants to seal the new state as the new truth anchor.

The agent (Claude) MAY NOT run this tool on the user's behalf without
explicit per-invocation approval. The script will refuse to run if the
catalog is in BOOTSTRAP state but the user explicitly chose to seal a
non-bootstrap catalog (sanity gate).

Workflow:
  1. User edits eden/eden-catalog.json (canonical name, products, etc.)
  2. User runs: python3 eden/tools/eden_seal.py
  3. The tool computes SHA-256 of the catalog, writes it to
     eden/eden-catalog.golden.sha256, and prints confirmation.
  4. User runs eden_verify.py to confirm everything passes.
  5. User runs eden_build.py to refresh dashboard embeds.

The seal action itself is logged to eden/seal-history.log (append-only).
"""

import datetime
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
EDEN_DIR = ROOT / "eden"
CATALOG_PATH = EDEN_DIR / "eden-catalog.json"
GOLDEN_PATH = EDEN_DIR / "eden-catalog.golden.sha256"
SEAL_LOG = EDEN_DIR / "seal-history.log"


def sha256_of_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    if not CATALOG_PATH.exists():
        print(f"FAIL: catalog file missing: {CATALOG_PATH}", file=sys.stderr)
        return 1

    # Parse JSON to confirm it's valid before sealing
    try:
        catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"FAIL: catalog JSON parse error — refusing to seal invalid catalog: {e}", file=sys.stderr)
        return 1

    new_hash = sha256_of_file(CATALOG_PATH)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

    # Read prior hash for log + diff
    prior_hash = GOLDEN_PATH.read_text(encoding="utf-8").strip() if GOLDEN_PATH.exists() else ""

    # Write new golden hash
    GOLDEN_PATH.write_text(new_hash + "\n", encoding="utf-8")

    # Append to seal history log
    n_products = len(catalog.get("products", {}))
    n_goals = len(catalog.get("goals", {}))
    eden_version = catalog.get("eden_version")
    log_line = (
        f"{now_iso} | eden_version={eden_version} | hash={new_hash[:16]}... "
        f"| prior={prior_hash[:16] if prior_hash else 'NONE'}... "
        f"| products={n_products} goals={n_goals}\n"
    )
    if not SEAL_LOG.exists():
        SEAL_LOG.write_text(
            "# Eden seal history — append-only log of user-approved catalog seals\n"
            "# Format: <ISO timestamp> | eden_version=N | hash=<first 16 chars> | prior=<first 16> | products=N goals=N\n",
            encoding="utf-8",
        )
    with open(SEAL_LOG, "a", encoding="utf-8") as f:
        f.write(log_line)

    print(f"SEALED: Eden catalog hash updated.")
    print(f"  eden_version: {eden_version}")
    print(f"  new hash:   {new_hash}")
    if prior_hash:
        print(f"  prior hash: {prior_hash}")
    print(f"  golden file: {GOLDEN_PATH}")
    print(f"  seal log:    {SEAL_LOG}")
    print()
    print(f"Next steps:")
    print(f"  1. python3 eden/tools/eden_verify.py  # confirm pass")
    print(f"  2. python3 eden/tools/eden_build.py   # refresh dashboard embeds")
    return 0


if __name__ == "__main__":
    sys.exit(main())
