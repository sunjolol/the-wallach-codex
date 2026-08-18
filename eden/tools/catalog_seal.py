#!/usr/bin/env python3
"""catalog_seal.py -- USER-ONLY. Seals the Catalog pillar (eden/catalog/) as canonical.

Like corpus_seal.py, sealing is the human's act of ratifying catalog state as
truth. The agent (Claude) MAY NOT run this without explicit per-invocation approval.

What it does, in order:
  1. Refuses unless catalog_verify's structural checks pass.
  2. Stamps sealed_at (UTC) in each catalog file.
  3. Writes a *.golden.sha256 (LF-normalized content hash) sibling for each catalog file.
  4. Appends to eden/catalog/seal-history.log (append-only).
  5. Runs catalog_verify.py as the final gate; refuses success unless it passes.

All hashes are over LF-normalized UTF-8 content (clone/CRLF-stable; see .gitattributes).
"""
import argparse
import datetime
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CATALOG = ROOT / "eden" / "catalog"
SEAL_LOG = CATALOG / "seal-history.log"
sys.path.insert(0, str(ROOT / "eden" / "tools"))
import catalog_verify  # noqa: E402

FILES = [CATALOG / "conditions.json", CATALOG / "symptoms.json", CATALOG / "nutrients.json"]


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def lf_sha256(p: Path) -> str:
    return hashlib.sha256(lf_text(p).encode("utf-8")).hexdigest()


def _guard_cli() -> None:
    """USER-ONLY arg guard: a bare invocation seals; ANY argument is rejected.

    catalog_seal has NO options -- it always seals the whole Catalog pillar. It historically
    ignored argv, so `catalog_seal.py --help` (an agent probing for usage) SILENTLY RAN a full
    seal (2026-08-18 incident). argparse now prints real help on -h/--help and errors on any
    unknown flag, so only a deliberate BARE run can seal. Mirrors corpus_seal._guard_cli.
    """
    argparse.ArgumentParser(
        prog="catalog_seal.py",
        description="USER-ONLY. Seals the Catalog pillar (eden/catalog/) as canonical: stamps "
                    "sealed_at, rewrites each *.golden.sha256, then runs catalog_verify as the "
                    "final gate. Takes NO options -- a bare run seals; any argument is rejected.",
    ).parse_args()


def main() -> int:
    _guard_cli()
    # 1. gate on structural checks
    fails, _ = catalog_verify.run_checks()
    if fails:
        print("REFUSING to seal -- catalog structural checks failed:")
        for f in fails:
            print(f"  - {f}")
        return 1

    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

    # 2. stamp sealed_at, then 3. write golden (hash reflects the stamped file)
    for p in FILES:
        obj = json.loads(p.read_text(encoding="utf-8"))
        obj["sealed_at"] = now
        p.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        h = lf_sha256(p)
        (p.parent / (p.name + ".golden.sha256")).write_text(h + "\n", encoding="utf-8")

    # 4. append seal log
    if not SEAL_LOG.exists():
        SEAL_LOG.write_text(
            "# eden/catalog seal history -- append-only log of user-approved catalog seals\n"
            "# Format: <ISO> | files=N | <name>=<sha12> ...\n",
            encoding="utf-8",
        )
    parts = " ".join(f"{p.name}={lf_sha256(p)[:12]}" for p in FILES)
    with open(SEAL_LOG, "a", encoding="utf-8") as f:
        f.write(f"{now} | files={len(FILES)} | {parts}\n")

    print(f"SEALED: eden/catalog at {now}")
    print(f"  golden hashes written for {len(FILES)} file(s).")
    print()
    print("Final gate -- catalog_verify:")
    return catalog_verify.main()


if __name__ == "__main__":
    sys.exit(main())
