#!/usr/bin/env python3
"""graphics_seal.py — USER-ONLY. Seals the sacred graphics manifest.

Mirrors corpus_seal posture: no automated process may run this on the owner's
behalf without explicit per-invocation human approval. Recomputes each graphic's
RAW-BYTE sha256, refuses if any drifts from the manifest, then writes the manifest's
LF-content hash to graphics-manifest.json.golden.sha256 and logs the seal.
"""
import argparse
import datetime
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
GRAPHICS = ROOT / "eden" / "graphics"
MANIFEST = GRAPHICS / "graphics-manifest.json"
GOLDEN = GRAPHICS / "graphics-manifest.json.golden.sha256"
SEAL_LOG = GRAPHICS / "seal-history.log"


def raw_sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def lf_sha256(p: Path) -> str:
    return hashlib.sha256(p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n").encode("utf-8")).hexdigest()


def _guard_cli() -> None:
    """USER-ONLY arg guard: a bare invocation seals; ANY argument is rejected. Mirrors
    corpus_seal._guard_cli: a seal tool that ignores argv turns `--help` into a silent full
    seal. argparse prints real help on -h/--help and errors on unknown flags, so only a
    deliberate BARE run can seal.
    """
    argparse.ArgumentParser(
        prog="graphics_seal.py",
        description="USER-ONLY. Seals the sacred graphics manifest: verifies image hashes, rewrites "
                    "graphics-manifest.json.golden.sha256, and logs the seal. Takes NO options -- a "
                    "bare run seals; any argument is rejected.",
    ).parse_args()


def main() -> int:
    _guard_cli()
    if not MANIFEST.exists():
        print(f"FAIL: {MANIFEST} missing")
        return 1
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    fails = []
    for g in manifest.get("graphics", []):
        p = ROOT / g.get("file", "")
        if not p.exists():
            fails.append(f"missing {g.get('file')}")
        elif raw_sha256(p) != g.get("file_sha256"):
            fails.append(f"hash drift {p.name} — manifest file_sha256 does not match the image bytes")
    if fails:
        print("REFUSING to seal — graphics manifest does not match the images:")
        for f in fails:
            print(f"  - {f}")
        return 1

    h = lf_sha256(MANIFEST)
    GOLDEN.write_text(h + "\n", encoding="utf-8")
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    if not SEAL_LOG.exists():
        SEAL_LOG.write_text("# eden/graphics seal history — append-only\n", encoding="utf-8")
    with open(SEAL_LOG, "a", encoding="utf-8") as f:
        f.write(f"{now} | graphics={len(manifest.get('graphics', []))} | manifest_hash={h[:16]}...\n")
    print(f"SEALED: {len(manifest.get('graphics', []))} sacred graphic(s).")
    print(f"  golden: {GOLDEN}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
