#!/usr/bin/env python3
"""products_seal.py -- USER-approved seal of the Youngevity Product DB pillar (eden/products/).

Sealing ratifies the hand-built product COMPOSITION as canonical and writes Eden's wall: after
this, products.json carries a *.golden.sha256 sibling and the scanner/user path can never write
it (products_hash_integrity RED-flags any drift). Like catalog_seal / corpus_seal, this is the
human's act of ratifying state as truth; it runs ONLY with the owner's explicit,
per-invocation approval. LF-normalized hash (clone/CRLF-stable; see .gitattributes).

Order:
  1. Refuse unless products_verify passes (structure + prose containment).
  2. Stamp _meta.sealed_at (UTC).
  3. Write products.json.golden.sha256 (LF-normalized content hash of the stamped file).
  4. Append eden/products/seal-history.log (append-only).
  5. Re-run products_verify as the final gate.
"""
import argparse
import datetime
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PRODUCTS = ROOT / "eden" / "products" / "products.json"
GOLDEN = PRODUCTS.parent / (PRODUCTS.name + ".golden.sha256")
SEAL_LOG = PRODUCTS.parent / "seal-history.log"
sys.path.insert(0, str(ROOT / "eden" / "tools"))
import products_verify  # noqa: E402


def lf_sha256(p: Path) -> str:
    t = p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    return hashlib.sha256(t.encode("utf-8")).hexdigest()


def _guard_cli() -> None:
    """USER-ONLY arg guard: a bare invocation seals; ANY argument is rejected. Mirrors
    corpus_seal._guard_cli, against the same silent-seal-on---help failure. argparse prints real
    help on -h/--help and errors on unknown flags, so only a deliberate BARE run can seal.
    """
    argparse.ArgumentParser(
        prog="products_seal.py",
        description="USER-ONLY. Seals the Youngevity Product DB pillar (eden/products/): stamps "
                    "sealed_at, writes products.json.golden.sha256, then runs products_verify as the "
                    "final gate. Takes NO options -- a bare run seals; any argument is rejected.",
    ).parse_args()


def main() -> int:
    _guard_cli()
    # 1. gate on structural + prose checks
    if products_verify.main() != 0:
        print("\nREFUSING to seal -- products_verify failed (fix the pillar first).")
        return 1

    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

    # 2. stamp sealed_at, then 3. write golden (hash reflects the stamped file)
    obj = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    obj.setdefault("_meta", {})
    obj["_meta"]["sealed_at"] = now
    PRODUCTS.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    h = lf_sha256(PRODUCTS)
    GOLDEN.write_text(h + "\n", encoding="utf-8")

    # 4. append seal log
    if not SEAL_LOG.exists():
        SEAL_LOG.write_text(
            "# eden/products seal history -- append-only log of user-approved product-DB seals\n"
            "# Format: <ISO> | products=N | sha=<sha16>\n",
            encoding="utf-8",
        )
    n = len(obj.get("products", {}))
    with open(SEAL_LOG, "a", encoding="utf-8") as f:
        f.write(f"{now} | products={n} | sha={h[:16]}\n")

    print(f"\nSEALED: eden/products/products.json at {now} ({n} products, sha {h[:16]}...)")
    print("\nFinal gate -- products_verify:")
    return products_verify.main()


if __name__ == "__main__":
    sys.exit(main())
