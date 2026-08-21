#!/usr/bin/env python3
"""catalog_verify.py -- read-only integrity verifier for the Catalog pillar (eden/catalog/).

Mirrors corpus_verify: it only parses JSON, hashes files, and tests set membership, so it
cannot lie. The single implementation of the catalog checks (the `catalog_integrity`
invariant shells out to this file -- one source, no duplication). It verifies the catalog's
INTERNAL structure (the conditions + symptoms registries: well-formed slugs, umbrella
children resolve); the cross-pillar corpus->catalog resolution (a claim slug must be
catalogued) is the separate `references_resolve` gate.

The nutrient/ingredient vocabulary IS verified here. An earlier version of nutrients.json was
deleted as a duplicate of essentials-canon and rebuilt against the Youngevity Product DB; this
tool checks its schema_version plus the essential_aliases / canonical_forms / nutrients blocks
(412 substances) alongside the conditions + symptoms registries.

All hashes are over LF-NORMALIZED UTF-8 content (clone/CRLF-stable).

Exit codes:
  0  SEALED & healthy -- every check passed (incl. golden hashes).
  1  FAIL -- a real violation (bad slug, dangling umbrella child...).
  2  BOOTSTRAP -- not yet sealed (no golden siblings). Structural checks still ran + passed.

Read-only: it never writes anything, so it is safe to run at any time.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CATALOG = ROOT / "eden" / "catalog"
COND_PATH = CATALOG / "conditions.json"
SYMP_PATH = CATALOG / "symptoms.json"
NUTR_PATH = CATALOG / "nutrients.json"

FILES = [COND_PATH, SYMP_PATH, NUTR_PATH]
# conditions/symptoms use snake_case slugs. The rule: lowercase alphanumerics joined by a
# SINGLE separator, never a space.
SLUG_RE = re.compile(r"^[a-z0-9]+([_-][a-z0-9]+)*$")


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def lf_sha256(p: Path) -> str:
    return hashlib.sha256(lf_text(p).encode("utf-8")).hexdigest()


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def is_sealed() -> bool:
    """Sealed iff every catalog file has a golden sibling."""
    return all((p.parent / (p.name + ".golden.sha256")).exists() for p in FILES)


def run_checks():
    """Returns (fails, infos). fails non-empty => FAIL regardless of seal."""
    fails, infos = [], []

    for p in FILES:
        if not p.exists():
            return [f"missing {p.relative_to(ROOT)}"], infos
        try:
            load(p)
        except json.JSONDecodeError as e:
            return [f"{p.name} parse error: {e}"], infos

    cond = load(COND_PATH)
    symp = load(SYMP_PATH)

    # header sanity
    for name, obj in (("conditions", cond), ("symptoms", symp)):
        if obj.get("schema_version") != 1:
            fails.append(f"{name}.json schema_version != 1")
        if not isinstance(obj.get("_doctrine"), str) or not obj["_doctrine"]:
            fails.append(f"{name}.json missing _doctrine")

    conditions = cond.get("conditions", {})
    symptoms = symp.get("symptoms", {})

    # ---- conditions ----
    n_umb = n_syn = 0
    for slug, e in conditions.items():
        if not SLUG_RE.match(slug):
            fails.append(f"[cond] malformed slug '{slug}'")
        if not e.get("display_name"):
            fails.append(f"[cond] {slug} missing display_name")
        syn = e.get("synonyms")
        if syn is not None:
            if not isinstance(syn, list) or not all(isinstance(x, str) for x in syn):
                fails.append(f"[cond] {slug} synonyms must be a list of strings")
            else:
                n_syn += 1
        umb = e.get("umbrella_of")
        if umb is not None:
            n_umb += 1
            for child in umb:
                if child not in conditions:
                    fails.append(f"[cond] umbrella '{slug}' names non-existent child '{child}'")
                elif child == slug:
                    fails.append(f"[cond] umbrella '{slug}' lists itself as a child")
    _count(fails, "conditions", cond, "conditions", len(conditions))
    _count(fails, "conditions", cond, "umbrellas", n_umb)
    _count(fails, "conditions", cond, "with_synonyms", n_syn)

    # ---- symptoms ----
    for slug, e in symptoms.items():
        if not SLUG_RE.match(slug):
            fails.append(f"[symp] malformed slug '{slug}'")
        if not e.get("display_name"):
            fails.append(f"[symp] {slug} missing display_name")
    _count(fails, "symptoms", symp, "symptoms", len(symptoms))

    # ---- nutrients (essential aliases + canonical forms + substance vocab) ----
    nutr = load(NUTR_PATH)
    if nutr.get("schema_version") != 1:
        fails.append("nutrients.json schema_version != 1")
    for key in ("essential_aliases", "canonical_forms", "nutrients"):
        if not isinstance(nutr.get(key), dict):
            fails.append(f"nutrients.json missing/invalid '{key}'")

    infos.append(f"{len(conditions)} conditions ({n_umb} umbrellas, {n_syn} synonyms), "
                 f"{len(symptoms)} symptoms, {len(nutr.get('nutrients', {}))} substances")
    return fails, infos


def _count(fails, fname, obj, key, actual):
    want = obj.get("counts", {}).get(key)
    if want != actual:
        fails.append(f"[{fname}] counts.{key}={want} but actual={actual}")


def check_golden_hashes():
    """Every catalog file's LF-content hash matches its *.golden.sha256."""
    fails = []
    for p in FILES:
        golden = p.parent / (p.name + ".golden.sha256")
        if not golden.exists():
            fails.append(f"sealed file {p.relative_to(ROOT)} has no golden sibling")
            continue
        if lf_sha256(p) != golden.read_text(encoding="utf-8").strip():
            fails.append(f"hash drift {p.name}")
    return fails


def main() -> int:
    fails, infos = run_checks()
    if not is_sealed():
        if fails:
            print("FAIL (bootstrap state, but structural checks failed):")
            for f in fails:
                print(f"  - {f}")
            return 1
        print("BOOTSTRAP: eden/catalog not yet sealed. Run eden/tools/catalog_seal.py to seal.")
        print(f"  structural checks passed: {'; '.join(infos)}")
        return 2
    fails += check_golden_hashes()
    if fails:
        print(f"FAIL: {len(fails)} catalog integrity violation(s):")
        for f in fails[:15]:
            print(f"  - {f}")
        return 1
    print(f"PASS: eden/catalog integrity verified. {'; '.join(infos)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
