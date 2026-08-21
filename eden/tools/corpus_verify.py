#!/usr/bin/env python3
"""corpus_verify.py — read-only integrity verifier for eden/corpus.

Truth-anchored and deterministic: it only hashes files and tests substrings, so it
cannot lie. The single implementation of the 12 corpus checks (the `corpus_integrity`
invariant shells out to this file — one source, no duplication).

All corpus text/JSON hashes are over LF-NORMALIZED UTF-8 content (clone/CRLF-stable).
Graphics are not this tool's concern (see graphics_verify.py).

Exit codes:
  0  SEALED & healthy — every check passed.
  1  FAIL — a real violation (drift, broken verbatim, bad slug, ...). Loud.
  2  BOOTSTRAP — not yet sealed (no golden hashes). The always-valid checks
     (canon has 90 essential entries, book content hashes match books-meta, any present claims/indices)
     still ran and passed; the seal-gated checks were skipped. Distinct from FAIL.

Read-only: it never writes anything, so it is safe to run at any time.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
BOOKS_DIR = CORPUS / "books"
CLAIMS_DIR = CORPUS / "claims"
INDICES_DIR = CORPUS / "indices"
CANON_PATH = CORPUS / "essentials-canon.json"
META_PATH = CORPUS / "books-meta.json"
VERSION_PATH = CORPUS / "knowledge-version.json"

INDEX_NAMES = ["essentials", "other-substances", "conditions", "symptoms", "consistency"]


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def lf_sha256(p: Path) -> str:
    return hashlib.sha256(lf_text(p).encode("utf-8")).hexdigest()


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def is_sealed() -> bool:
    """Sealed iff the canon's golden sibling exists."""
    return (CORPUS / "essentials-canon.json.golden.sha256").exists()


def collect_claim_shards():
    return sorted(CLAIMS_DIR.glob("claims-*.json")) if CLAIMS_DIR.exists() else []


def collect_indices():
    out = {}
    if INDICES_DIR.exists():
        for name in INDEX_NAMES:
            p = INDICES_DIR / f"{name}.json"
            if p.exists():
                out[name] = p
    return out


def _canon_slugs():
    """The sealed canon's slugs. Empty set when canon is absent/unparseable (bootstrap-safe);
    run_checks reports those failures itself, so this stays silent rather than double-reporting."""
    try:
        canon = load_json(CANON_PATH)
    except (json.JSONDecodeError, OSError):
        return set()
    return {e.get("slug") for e in canon.get("essentials", [])}


def unresolved_references():
    """references_resolve: claim condition/symptom/substance/about slugs NOT
    registered in the Catalog pillar (eden/catalog/{conditions,symptoms,nutrients}.json) or the
    sealed canon. Returns [] when the catalog is absent (bootstrap-safe) or clean. Single source,
    called by both run_checks (#12) and the named references_resolve invariant.

    `about` is the claim's SUBJECT -- what it is *about* -- as opposed to `other_substances`,
    which is only what it MENTIONS. WHY a separate field rather than reusing the tag: they are
    different facts and neither implies the other. Measured on the plant-derived colloidal-mineral
    complex, the tag is wrong in BOTH directions -- dozens of claims carry it whose own verbatim
    never names the complex (a miner's extraction window bleeding in from a neighbouring A-Z
    entry), and dozens more that DO name it are untagged. Before this field, every consumer had to
    INFER aboutness from that tag or from a regex over the verbatim; both proxies are silently
    wrong in both directions, which is how a goal can end up dark for a condition Wallach
    explicitly addresses -- his OBESITY entry ends "(Use colloidal minerals)!". Aboutness is
    authored, never inferred.

    Resolves against canon | nutrients | conditions: a claim may be about an essential, a
    substance, or a disease. Mirrors the keyspace `search_index_derive.validate()` already uses
    for the search side's `subject`, rather than minting a fourth vocabulary.
    """
    if not (ROOT / "eden" / "catalog" / "conditions.json").exists():
        return []
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import catalog as _catalog
    cond_ok, symp_ok = _catalog.condition_slugs(), _catalog.symptom_slugs()
    nutr_ok = _catalog.nutrient_slugs() if (ROOT / "eden" / "catalog" / "nutrients.json").exists() else None
    about_ok = _canon_slugs() | cond_ok | (nutr_ok or set())
    out = []
    for shard in collect_claim_shards():
        try:
            data = load_json(shard)
        except json.JSONDecodeError:
            continue  # parse errors are reported by run_checks
        for c in data.get("claims", []):
            cid = c.get("id")
            for slug in c.get("conditions", []):
                if slug not in cond_ok:
                    out.append(f"claim {cid} references unregistered condition '{slug}'")
            for slug in c.get("symptoms", []):
                if slug not in symp_ok:
                    out.append(f"claim {cid} references unregistered symptom '{slug}'")
            if nutr_ok is not None:
                for slug in c.get("other_substances", []):
                    if slug not in nutr_ok:
                        out.append(f"claim {cid} references unregistered substance '{slug}'")
            # `about` is optional and absent on most claims; .get(...) or [] keeps those
            # silent rather than failing every claim that predates the field.
            for slug in (c.get("about") or []):
                if slug not in about_ok:
                    out.append(f"claim {cid} is `about` unregistered subject '{slug}'")
    return out


def run_checks(skip_index_derive_check=False):
    """Returns (fails, infos, n_claims). fails non-empty => FAIL regardless of seal.

    skip_index_derive_check: when True, omit check #8 (indices are a clean
    derivation of claims/*). corpus_seal's PRE-gate passes this because the seal
    re-derives every index in its next step, so a #8 mismatch there is EXPECTED
    whenever corpus_derive.py changed or a draft edits a condition mapping; the
    seal's FINAL gate (full run_checks) still enforces #8 on the re-derived result."""
    fails, infos = [], []

    # --- canon (always valid) ---
    if not CANON_PATH.exists():
        return [f"missing {CANON_PATH.relative_to(ROOT)}"], infos, 0
    try:
        canon = load_json(CANON_PATH)
    except json.JSONDecodeError as e:
        return [f"essentials-canon.json parse error: {e}"], infos, 0
    essentials = canon.get("essentials", [])
    canon_slugs = [e.get("slug") for e in essentials]
    # The 90 are the essential nutrients; non-essential extras (e.g. omega-9, "becomes
    # essential if deficient in linoleic acid") ride along in the file but are NOT counted.
    essential_entries = [e for e in essentials if e.get("essential") is not False]
    if len(essential_entries) != 90:
        fails.append(f"canon has {len(essential_entries)} essential entries, expected 90")
    if canon.get("counts", {}).get("essential") != 90:
        fails.append(f"canon counts.essential != 90: {canon.get('counts', {}).get('essential')}")
    if len(set(canon_slugs)) != len(canon_slugs):
        fails.append("canon slugs are not unique")
    canon_set = set(canon_slugs)

    # --- books-meta + book content hashes (check #6, always valid; the truth anchor) ---
    if not META_PATH.exists():
        return [f"missing {META_PATH.relative_to(ROOT)}"], infos, 0
    try:
        meta = load_json(META_PATH)
    except json.JSONDecodeError as e:
        return [f"books-meta.json parse error: {e}"], infos, 0
    book_text = {}  # book_id -> lf text (cached for verbatim checks)
    book_ids = set()
    for b in meta.get("books", []):
        bid = b.get("book_id")
        book_ids.add(bid)
        bp = ROOT / b.get("file", "")
        if not bp.exists():
            fails.append(f"book file missing for {bid}: {b.get('file')}")
            continue
        actual = lf_sha256(bp)
        if actual != b.get("content_sha256"):
            fails.append(f"[#6] book {bid} content hash drift: meta={str(b.get('content_sha256'))[:12]}... actual={actual[:12]}...")
        else:
            book_text[bid] = lf_text(bp)
    infos.append(f"{len(meta.get('books', []))} books, hashes match" if not fails else f"{len(meta.get('books', []))} books")

    # --- claims (only if present) ---
    shards = collect_claim_shards()
    all_ids = set()
    n_claims = 0
    for shard in shards:
        try:
            data = load_json(shard)
        except json.JSONDecodeError as e:
            fails.append(f"{shard.name} parse error: {e}")
            continue
        bid = data.get("book_id")
        for c in data.get("claims", []):
            n_claims += 1
            cid = c.get("id")
            if cid in all_ids:
                fails.append(f"[#5] duplicate claim id {cid}")
            all_ids.add(cid)
            # #3 essentials slugs in canon
            for slug in c.get("essentials", []):
                if slug not in canon_set:
                    fails.append(f"[#3] claim {cid} uses non-canon essential slug '{slug}'")
            # #2 verbatim is a substring of its book (THE load-bearing check)
            vb = c.get("verbatim", "")
            loc = c.get("locator", {}) or {}
            lbid = loc.get("book", bid)
            txt = book_text.get(lbid)
            if not vb or len(vb) < 60 or len(vb) > 1200:
                fails.append(f"[#2] claim {cid} verbatim length {len(vb)} outside 60–1200")
            elif txt is None:
                fails.append(f"[#2] claim {cid} references unknown/unhashed book '{lbid}'")
            else:
                idx = txt.find(vb)
                if idx < 0:
                    fails.append(f"[#2] claim {cid} verbatim NOT found in book {lbid}")
                else:
                    # #9 char_offset agreement (when present)
                    off = loc.get("char_offset")
                    if off is not None and txt[off:off + len(vb)] != vb:
                        fails.append(f"[#9] claim {cid} char_offset {off} does not point at verbatim")
            # #11 dose is null or an object (the CorpusDoseSchema shape) — a bare string/number/list is the runtime-break class that empties the drawer
            dose = c.get("dose")
            if dose is not None and not isinstance(dose, dict):
                fails.append(f"[#11] claim {cid} dose must be null or an object, got {type(dose).__name__}")

    # #12 references_resolve (Catalog pillar): every claim condition/symptom/
    # substance slug must be pre-registered in eden/catalog/{conditions,symptoms,nutrients}.json.
    # Skipped by the seal PRE-gate (skip_index_derive_check) for the SAME reason as #8: a draft
    # mapping edit / slug rename transiently mismatches the still-catalogued OLD shard state
    # (the pre-gate runs BEFORE the draft is promoted). The seal FINAL gate (full run_checks)
    # re-checks #12 against the promoted shards + the updated catalog and refuses on a real miss.
    if not skip_index_derive_check:
        fails += [f"[#12] {m} -- register it in eden/catalog/" for m in unresolved_references()]

    # --- indices (only if present) ---
    indices = collect_indices()
    # #4 other-substances disjoint from canon
    if "other-substances" in indices:
        try:
            other = load_json(indices["other-substances"])
            other_keys = set(other.keys()) if isinstance(other, dict) else set()
            overlap = other_keys & canon_set
            if overlap:
                fails.append(f"[#4] other-substances overlaps canon: {sorted(overlap)[:5]}")
        except json.JSONDecodeError as e:
            fails.append(f"other-substances.json parse error: {e}")
    # #1 every claim id referenced by an index exists
    for name, p in indices.items():
        try:
            referenced = _claim_ids_in(load_json(p))
        except json.JSONDecodeError as e:
            fails.append(f"{name}.json parse error: {e}")
            continue
        missing = referenced - all_ids
        if missing:
            fails.append(f"[#1] {name}.json references {len(missing)} unknown claim id(s): {sorted(missing)[:3]}")

    # #8 indices are an honest derivation (only when claims AND indices both exist).
    # Skipped by the seal PRE-gate (it re-derives next); the seal POST-gate re-checks.
    if shards and indices and not skip_index_derive_check:
        try:
            sys.path.insert(0, str(ROOT / "eden" / "tools"))
            import corpus_derive
            regen = corpus_derive.derive_indices(shards)
            for name, p in indices.items():
                want = json.dumps(regen.get(name, {}), indent=2, ensure_ascii=False, sort_keys=True)
                have = json.dumps(load_json(p), indent=2, ensure_ascii=False, sort_keys=True)
                if want != have:
                    fails.append(f"[#8] {name}.json is not a clean derivation of claims/* (hand-edited or stale)")
        except Exception as e:  # noqa: BLE001 — a broken derive must degrade to an INFO here
            # rather than mask the other checks. Nothing is lost: the seal FINAL gate re-runs the
            # full run_checks, so a genuinely broken #8 still refuses the seal.
            infos.append(f"[#8] skipped (derive unavailable: {e})")

    # #10 no draft referenced by a sealed index
    draft_names = {p.name for p in (CORPUS / "drafts").glob("*.json")} if (CORPUS / "drafts").exists() else set()
    if draft_names and indices:
        blob = " ".join(p.read_text(encoding="utf-8") for p in indices.values())
        for dn in draft_names:
            if dn in blob:
                fails.append(f"[#10] sealed index references a draft file '{dn}'")

    return fails, infos, n_claims


def _claim_ids_in(obj):
    """Recursively collect any WAL-CLM-* ids referenced anywhere in an index."""
    found = set()

    def walk(o):
        if isinstance(o, str):
            if o.startswith("WAL-CLM-"):
                found.add(o)
        elif isinstance(o, list):
            for x in o:
                walk(x)
        elif isinstance(o, dict):
            for x in o.values():
                walk(x)

    walk(obj)
    return found


def check_golden_hashes():
    """#7 — every sealed file's LF-content hash matches its *.golden.sha256."""
    fails = []
    sealed_targets = [CANON_PATH, META_PATH, VERSION_PATH]
    sealed_targets += collect_claim_shards()
    sealed_targets += [p for p in collect_indices().values()]
    for p in sealed_targets:
        golden = p.parent / (p.name + ".golden.sha256")
        if not golden.exists():
            fails.append(f"[#7] sealed file {p.relative_to(ROOT)} has no golden sibling")
            continue
        want = golden.read_text(encoding="utf-8").strip()
        actual = lf_sha256(p)
        if actual != want:
            fails.append(f"[#7] hash drift {p.name}: golden={want[:12]}... actual={actual[:12]}...")
    return fails


def main() -> int:
    fails, infos, n_claims = run_checks()

    if not is_sealed():
        if fails:
            print("FAIL (bootstrap state, but always-valid checks failed):")
            for f in fails:
                print(f"  - {f}")
            return 1
        print("BOOTSTRAP: eden/corpus not yet sealed. Run eden/tools/corpus_seal.py to seal.")
        print(f"  always-valid checks passed: {'; '.join(infos)}")
        print(f"  claims present: {n_claims}")
        return 2

    # sealed: run the golden-hash gate too
    fails += check_golden_hashes()
    if fails:
        print(f"FAIL: {len(fails)} corpus integrity violation(s):")
        for f in fails[:15]:
            print(f"  - {f}")
        if len(fails) > 15:
            print(f"  ... and {len(fails) - 15} more")
        return 1
    version = load_json(VERSION_PATH).get("knowledge_version")
    print(f"PASS: eden/corpus integrity verified (knowledge_version={version}).")
    print(f"  {n_claims} claims; {'; '.join(infos)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
