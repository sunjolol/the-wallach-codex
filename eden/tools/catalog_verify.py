#!/usr/bin/env python3
"""catalog_verify.py -- read-only integrity verifier for the Catalog pillar (eden/catalog/).

Mirrors corpus_verify: it only parses JSON, hashes files, and tests set membership, so it
cannot lie. The single implementation of the catalog checks (the `catalog_integrity`
invariant shells out to this file -- one source, no duplication). It verifies the catalog's
INTERNAL structure + its pointers into essentials-canon; the cross-pillar corpus->catalog
resolution (a claim slug must be catalogued) is the separate `references_resolve` gate.

All hashes are over LF-NORMALIZED UTF-8 content (clone/CRLF-stable).

Exit codes:
  0  SEALED & healthy -- every check passed (incl. golden hashes).
  1  FAIL -- a real violation (bad slug, dangling umbrella child, canon_slug not in canon...).
  2  BOOTSTRAP -- not yet sealed (no golden siblings). Structural checks still ran + passed.

The agent MAY run this. It never writes anything.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CATALOG = ROOT / "eden" / "catalog"
CORPUS = ROOT / "eden" / "corpus"
COND_PATH = CATALOG / "conditions.json"
SYMP_PATH = CATALOG / "symptoms.json"
NUTR_PATH = CATALOG / "nutrients.json"
CANON_PATH = CORPUS / "essentials-canon.json"

FILES = [COND_PATH, SYMP_PATH, NUTR_PATH]
# conditions/symptoms use snake_case slugs; essentials/nutrients use kebab-case. The one
# rule both share: lowercase alphanumerics joined by a SINGLE separator, never a space.
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
    nutr = load(NUTR_PATH)
    canon = load(CANON_PATH)
    canon_slugs = {e["slug"] for e in canon.get("essentials", [])}

    # header sanity
    for name, obj in (("conditions", cond), ("symptoms", symp), ("nutrients", nutr)):
        if obj.get("schema_version") != 1:
            fails.append(f"{name}.json schema_version != 1")
        if not isinstance(obj.get("_doctrine"), str) or not obj["_doctrine"]:
            fails.append(f"{name}.json missing _doctrine")

    conditions = cond.get("conditions", {})
    symptoms = symp.get("symptoms", {})
    nutrients = nutr.get("nutrients", {})

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

    # ---- nutrients ----
    n_canon = 0
    for slug, e in nutrients.items():
        if not SLUG_RE.match(slug):
            fails.append(f"[nutr] malformed slug '{slug}'")
        if not e.get("display_name"):
            fails.append(f"[nutr] {slug} missing display_name")
        if "canon_slug" not in e:
            fails.append(f"[nutr] {slug} missing canon_slug key")
            continue
        cs = e["canon_slug"]
        if cs is not None:
            n_canon += 1
            if cs not in canon_slugs:
                fails.append(f"[nutr] {slug} canon_slug '{cs}' not in essentials-canon")
            elif cs != slug:
                fails.append(f"[nutr] canonical nutrient '{slug}' canon_slug '{cs}' must equal its own slug")
    # every canon essential must be registered as a nutrient (superset rule)
    missing_canon = sorted(canon_slugs - {s for s, e in nutrients.items() if e.get("canon_slug")})
    if missing_canon:
        fails.append(f"[nutr] {len(missing_canon)} canon essential(s) not registered as nutrients: {missing_canon[:5]}")
    _count(fails, "nutrients", nutr, "nutrients", len(nutrients))
    _count(fails, "nutrients", nutr, "canonical", n_canon)
    _count(fails, "nutrients", nutr, "non_canonical", len(nutrients) - n_canon)

    infos.append(f"{len(conditions)} conditions ({n_umb} umbrellas, {n_syn} synonyms), "
                 f"{len(symptoms)} symptoms, {len(nutrients)} nutrients ({n_canon} canonical)")
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
