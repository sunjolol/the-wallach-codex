#!/usr/bin/env python3
"""graphics_verify.py — read-only verifier for the sacred graphics (eden/graphics).

Each graphic's RAW-BYTE sha256 must equal its file_sha256 in graphics-manifest.json
(graphics are binary, not LF-normalized). When the manifest is sealed, its own
LF-content hash must match graphics-manifest.json.golden.sha256.

Exit: 0 sealed & healthy · 1 FAIL · 2 BOOTSTRAP (manifest not yet sealed; image
hashes still checked). Never writes anything.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
GRAPHICS = ROOT / "eden" / "graphics"
MANIFEST = GRAPHICS / "graphics-manifest.json"
GOLDEN = GRAPHICS / "graphics-manifest.json.golden.sha256"


def raw_sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def lf_sha256(p: Path) -> str:
    return hashlib.sha256(p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n").encode("utf-8")).hexdigest()


def main() -> int:
    if not MANIFEST.exists():
        print(f"FAIL: {MANIFEST.relative_to(ROOT)} missing")
        return 1
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    fails = []
    n = 0
    for g in manifest.get("graphics", []):
        n += 1
        p = ROOT / g.get("file", "")
        if not p.exists():
            fails.append(f"graphic missing: {g.get('file')}")
            continue
        actual = raw_sha256(p)
        if actual != g.get("file_sha256"):
            fails.append(f"{p.name} hash drift: manifest={str(g.get('file_sha256'))[:12]}... actual={actual[:12]}...")

    if fails:
        print(f"FAIL: {len(fails)} graphics violation(s):")
        for f in fails:
            print(f"  - {f}")
        return 1

    if not GOLDEN.exists():
        print(f"BOOTSTRAP: graphics manifest not yet sealed. Run eden/tools/graphics_seal.py.")
        print(f"  {n} graphic(s); all image hashes match the manifest.")
        return 2

    want = GOLDEN.read_text(encoding="utf-8").strip()
    if lf_sha256(MANIFEST) != want:
        print(f"FAIL: graphics-manifest.json drift vs golden (manifest edited without re-seal).")
        return 1
    print(f"PASS: {n} sacred graphic(s) verified against sealed manifest.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
