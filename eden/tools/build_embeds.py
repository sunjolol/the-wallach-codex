#!/usr/bin/env python3
"""build_embeds.py — the single derivation orchestrator (Phase C / blueprint D2).

ONE command that regenerates every GENERATED data artifact from the sealed
pillars, in the order eden/derived/MANIFEST.json declares. Each artifact has
exactly one pure generator (a module exposing build_fn() -> object and
write_fn() -> writes the file via safe_write, §17). This tool imports each
generator and calls its write_fn; the derived_artifacts_fresh invariant then
proves the on-disk artifacts equal a fresh build_fn() run, so shipping drift is
impossible (R1).

Why a manifest, not a hard-coded list: the freshness gate and this orchestrator
iterate the SAME registry, so nothing is silently unchecked and nothing is
regenerated that the gate does not also verify (D2). As Phase C folds each embed
into the pipeline (targets_derive, the product embeds), it lands as one manifest
row + one generator module — the orchestrator and the gate pick it up for free.

This absorbs the standalone generators over Phase C; today it drives corpus_embed
(corpus-embed.json). Run after any pillar change, before `node tools/build.mjs`.

Exit codes: 0 = all artifacts regenerated · 1 = a generator failed.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
MANIFEST_PATH = ROOT / "eden" / "derived" / "MANIFEST.json"

# Generators import safe_write + catalog by bare name; make both dirs importable.
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "eden" / "tools"))


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def load_generator(rel_path: str):
    """Import a generator module by its repo-relative path (not on sys.path as a
    package). Returns the loaded module so callers can reach build_fn / write_fn."""
    gen_path = ROOT / rel_path
    spec = importlib.util.spec_from_file_location(gen_path.stem, gen_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load generator {rel_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    manifest = load_manifest()
    artifacts = manifest.get("artifacts", [])
    print(f"build_embeds — regenerating {len(artifacts)} artifact(s) from the sealed pillars\n")
    failed = False
    for entry in artifacts:
        artifact = entry["artifact"]
        generator = entry["generator"]
        write_fn_name = entry["write_fn"]
        try:
            mod = load_generator(generator)
            write_fn = getattr(mod, write_fn_name)
            n = write_fn()
            size = f"{n} B" if isinstance(n, int) else "ok"
            print(f"  OK  {artifact}  <-  {generator}::{write_fn_name}()  ({size})")
        except Exception as e:  # noqa: BLE001 — surface any generator failure loudly
            failed = True
            print(f"  FAIL  {artifact}  <-  {generator}::{write_fn_name}()  :: {e}", file=sys.stderr)
    if failed:
        print("\nbuild_embeds FAILED — see errors above", file=sys.stderr)
        return 1
    print("\nbuild_embeds OK — run `python tools/invariants.py` (derived_artifacts_fresh) to verify")
    return 0


if __name__ == "__main__":
    sys.exit(main())
